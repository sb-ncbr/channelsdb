"""ChannelsDB as an MCP server (https://modelcontextprotocol.io) at /mcp, for assistants: summaries of the stored channels
a model can read, saying what the data cannot provide and why (MCP.md). Stateless and answered as JSON, as MOLEonline's."""

import json
import logging
import re
import threading
from collections import OrderedDict
from contextlib import asynccontextmanager
from functools import lru_cache
from pathlib import Path
from zipfile import ZipFile

import anyio
import requests
from fastapi import FastAPI
from mcp.server.mcpserver import Context, MCPServer
from mcp.server.mcpserver.exceptions import ToolError
from mcp.server.transport_security import TransportSecuritySettings
from mcp.types import ToolAnnotations
from starlette.exceptions import HTTPException
from starlette.routing import Route
from starlette.types import ASGIApp, Receive, Scope, Send

from api.common import CHANNEL_TYPES_ALPHAFILL, CHANNEL_TYPES_PDB, PDB_ID_REGEX, UNIPROT_ID_REGEX, SourceDatabase
from api.config import config
from api.endpoints.annotations import get_sifts


MAX_CHANNELS = 30  # of a category in describe_entry, the rest are counted
MAX_ENTRIES = 100  # in a call of lookup_entries
MAX_LAYERS = 40  # of a channel in describe_channel, about 400 characters each (long channels have hundreds)
# Of the data.zip files kept parsed in each worker: parsed, an entry takes about 5 times its file's size (6hif: 180 MB, 1 GB).
# 99.9 % of the entries have less than 17 MB; larger ones than half of this are parsed at each call, not kept.
CACHE_BYTES = 40 * 2**20
PROPERTIES = ('Charge', 'Hydropathy', 'Hydrophobicity', 'Polarity', 'Mutability')  # of MOLE's channels, averages over the lining residues

logger = logging.getLogger(__name__)

# not in the API's log: each stateless request's end of its MCP session
logging.getLogger('mcp.server.streamable_http').setLevel(logging.WARNING)

# What the channels of each file are, and the structure they were computed on (as COMPUTED_ON on the results page)
ASSEMBLY = 'the preferred assembly of the PDB entry at the time of the computation'
MODEL = 'the deposited model (asymmetric unit) of the PDB entry'
ALPHAFILL = 'the AlphaFill model: a predicted structure with transplanted ligands, as it was at the time of the computation'
CATEGORIES = {
    'csa': ('MOLE', 'tunnels from the catalytic site (M-CSA)', ASSEMBLY),
    'cscaver': ('CAVER', 'tunnels from the catalytic site (M-CSA)', MODEL),
    'authors': ('MOLE', 'reviewed channels, from the literature', None),
    'aucaver': ('CAVER', 'reviewed channels, from the literature', None),
    'cofactors': ('MOLE', 'tunnels from cofactors', ASSEMBLY),
    'cocaver': ('CAVER', 'tunnels from cofactors', MODEL),
    'pores': ('MOLE', 'transmembrane pores', ASSEMBLY),
    'pocaver': ('CAVER', 'transmembrane pores', MODEL),
    'procognate': ('MOLE', 'tunnels from cognate ligands', MODEL),
    'procaver': ('CAVER', 'tunnels from cognate ligands', MODEL),
    'alphafill': ('MOLE', 'tunnels from AlphaFill ligands', ALPHAFILL),
    'alphacaver': ('CAVER', 'tunnels from AlphaFill ligands', ALPHAFILL),
}

# The sections of the results page listing the channels of each file
SECTIONS = {
    'csa': 'CSA Tunnels MOLE', 'cscaver': 'CSA Tunnels CAVER', 'authors': 'Reviewed Channels MOLE', 'aucaver': 'Reviewed Channels CAVER',
    'cofactors': 'Cofactor Tunnels MOLE', 'cocaver': 'Cofactor Tunnels CAVER', 'pores': 'Transmembrane Pores MOLE',
    'pocaver': 'Transmembrane Pores CAVER', 'procognate': 'COGNATE Tunnels MOLE', 'procaver': 'COGNATE Tunnels CAVER',
    'alphafill': 'AlphaFill Tunnels MOLE', 'alphacaver': 'AlphaFill Tunnels CAVER',
}

# Why a value is not given (MCP.md, What each method provides)
CAVER_CONVERSION = 'caver_conversion'
CAVER_UNAVAILABLE = {'lining_residues': CAVER_CONVERSION, 'bottleneck_residues': CAVER_CONVERSION, 'properties': CAVER_CONVERSION}
NOT_NEGATIVE = 'Not found is not a negative result: ChannelsDB has the channels found for its starting points and parameters only.'
NOT_COMPUTED = ('ChannelsDB has no channels of {entry}. That is not a negative result: ChannelsDB has the channels found for '
                'its starting points and parameters only. They can be computed in MOLEonline (https://moleonline.cz).')

INSTRUCTIONS = (
    'ChannelsDB has precomputed channels (tunnels, pores) of PDB entries and AlphaFill models, by MOLE and CAVER, with '
    'curated names from the literature. Start with describe_entry, then describe_channel. MOLE channels have lining residues, '
    'bottleneck residues and properties; CAVER channels geometry only (length, radii): their residues and properties came '
    'through a faulty conversion and are not given (reason caver_conversion). A tunnel is defined by where it starts. The '
    'channels were computed once on one static structure, so a radius is of that geometry, not a proof that a molecule '
    'passes. No channels in ChannelsDB does not mean the protein has none.')


def entry_of(entry: str) -> tuple[SourceDatabase, str]:
    """The database and ID of an entry given as a PDB ID or a UniProt ID (of an AlphaFill model)"""
    entry = entry.strip()
    if re.fullmatch(PDB_ID_REGEX, entry):
        return SourceDatabase.PDB, entry.lower()
    if re.fullmatch(UNIPROT_ID_REGEX, entry.upper()):
        return SourceDatabase.AlphaFill, entry.upper()
    raise ToolError(f'"{entry}" is neither a PDB ID (e.g. 1tqn) nor a UniProt ID of an AlphaFill model (e.g. P10635).')


def site(ctx: Context) -> str:
    """The website as the user reached it: nginx passes the user's host and scheme (X-Forwarded-Proto, which uvicorn
    trusts), as it ends TLS itself"""
    url = ctx.request_context.request.url
    return f'{url.scheme}://{url.netloc}'


def web_page(website: str, source_db: SourceDatabase, protein_id: str) -> str:
    """The entry's results page, to see its channels in 3D with the structure"""
    return f'{website}/detail/{source_db.lower()}/{protein_id}'


# The API's exports of all the channels of an entry, to open them in a viewer with the structure
DOWNLOADS = ('pymol', 'chimera', 'vmd', 'pdb', 'zip')


def downloads(website: str, source_db: SourceDatabase, protein_id: str) -> dict[str, str]:
    return {name: f'{website}/api/download/{source_db.lower()}/{protein_id}/{name}' for name in DOWNLOADS}


def channel_types(source_db: SourceDatabase) -> dict[str, str]:
    return CHANNEL_TYPES_PDB if source_db == SourceDatabase.PDB else CHANNEL_TYPES_ALPHAFILL


def alphafill_model(protein_id: str) -> str:
    """The AlphaFill model as AlphaFill has it today (the website loads it from there); it may have changed since the
    channels were computed"""
    return f'https://alphafill.eu/v1/aff/{protein_id}'


def base() -> Path:
    """The directory of the data release, resolved once per call (the data link is switched to release new data), so that
    an answer comes from a single release, the one it names"""
    return Path(config['dirs']['base']).resolve()


def entry_file(release_dir: Path, source_db: SourceDatabase, protein_id: str) -> Path:
    # As protein_dir() in api.common, within the given release
    return release_dir / str(source_db) / protein_id.lower()[1:3] / protein_id.lower() / 'data.zip'


def parse(data_file: Path) -> tuple[dict[str, dict], list[dict]]:
    """The channel files of an entry by their name (csa, cocaver, ...) and its curated annotations"""
    files, annotations = {}, []
    with ZipFile(data_file) as z:
        for member in z.namelist():
            if (name := Path(member).stem) in CATEGORIES:
                files[name] = json.loads(z.read(member))
            elif member == 'annotations.json':
                annotations = json.loads(z.read(member))
    # In the order of the categories, as the results page lists them
    return {name: files[name] for name in CATEGORIES if name in files}, annotations


# Entries parsed in this worker, by their file and its modification time (a changed file is parsed again), the least
# recently used first, with the sizes of their files; the tools run in threads
cache: OrderedDict[tuple[str, int], tuple[int, tuple[dict[str, dict], list[dict]]]] = OrderedDict()
cache_lock = threading.Lock()


def parsed(data_file: Path) -> tuple[dict[str, dict], list[dict]]:
    """An entry's data, kept for the next calls about it (paging, its channels), up to CACHE_BYTES of files in a worker. The
    data are shared by the calls and must not be modified. Two calls missing the same entry at once both parse it."""
    status = data_file.stat()
    key = (str(data_file), status.st_mtime_ns)
    with cache_lock:
        if key in cache:
            cache.move_to_end(key)
            return cache[key][1]
    data = parse(data_file)
    if status.st_size <= CACHE_BYTES // 2:
        with cache_lock:
            cache[key] = (status.st_size, data)
            while sum(size for size, _ in cache.values()) > CACHE_BYTES:
                cache.popitem(last=False)
    return data


def opened(entry: str) -> tuple[dict, SourceDatabase, str, tuple[dict[str, dict], list[dict]] | None]:
    """An entry's answer to start from (its database, ID and release) and its data, None when ChannelsDB does not have it"""
    source_db, protein_id = entry_of(entry)
    release_dir = base()
    answer = {'source': 'channelsdb', 'release': release_dir.name, 'entry': protein_id, 'database': str(source_db)}
    data_file = entry_file(release_dir, source_db, protein_id)
    if not data_file.exists():
        return answer | {'found': False, 'message': NOT_COMPUTED.format(entry=protein_id)}, source_db, protein_id, None
    return answer, source_db, protein_id, parsed(data_file)


def channels_of(data: dict) -> list[dict]:
    """The channels of a file, in the order the API reads them (their references count from 1 in this order)"""
    return [channel for group in ('Paths', 'Tunnels', 'Pores', 'MergedPores') for channel in data['Channels'][group]]


# The residue names a MOLE query selects (Residues('HEM'), Residues('FAD', 'FMN'), Residues('FAD, FMN'))
QUERY_RESIDUES = re.compile(r"Residues\(([^()]*)\)")
PLAIN_QUERY = re.compile(r"Residues\((['\"])[A-Za-z0-9]{1,5}\1\)")


def starts(data: dict) -> list[dict] | None:
    """Where MOLE started the channels of a file, from its Config, in the terms of MOLEonline's compute_tunnels (start:
    residues, ligand, point, auto), so that an assistant can compute the like there; None when not recorded (CAVER,
    reviewed channels, pores). Of a ligand, its names (MOLE starts from any of them the structure has) and the queries
    when they select more than the residues (its reactive atoms, as MOLEonline's known cofactors)."""
    origins = data.get('Config', {}).get('Origins')
    if origins is None:
        return None
    found = [{'start': 'auto'}] if origins.get('UseAutoPoints') else []
    for origin in origins['Points']['Points']:
        if residues := origin['Residues']:
            found.append({'start': 'residues',
                          'residues': [f'{r["Chain"]} {r["SequenceNumber"]}{(r.get("InsertionCode") or "").strip()}' for r in residues]})
        if queries := [query['Text'] for query in origin['Queries']]:
            names = [name.strip(' \'"') for query in queries for listed in QUERY_RESIDUES.findall(query)
                     for name in re.split(r"[,\s]+", listed.strip(' \'"')) if name.strip(' \'"')]
            found.append({'start': 'ligand', 'ligands': list(dict.fromkeys(names))}
                         | ({'queries': queries} if not all(PLAIN_QUERY.fullmatch(query) for query in queries) else {}))
        found.extend({'start': 'point', 'point': [round(c, 3) for c in point['Point']]} for point in origin['Points'])
    return found


def is_bottleneck(layer: dict) -> bool:
    # The flag is left out of the other layers
    return layer['LayerGeometry'].get('Bottleneck', False)


def outside_channel(layer_geometry: dict, length: float) -> bool:
    """CAVER's last layer can start after it ends, or past the profile (CAVER.md): no location on the channel. A layer only
    ending past the profile is not outside, CAVER's layers end up to 5 Å after it."""
    return layer_geometry['StartDistance'] > layer_geometry['EndDistance'] or layer_geometry['StartDistance'] >= length


def geometry(channel: dict) -> dict:
    """Length, bottleneck (the method's flagged layer) and narrowest point of a channel, with why a value is missing"""
    profile = channel['Profile']
    narrowest = min(profile, key=lambda point: point['Radius'])
    summary = {'length': round(profile[-1]['Distance'], 1),
               'bottleneck_radius': None, 'bottleneck_at': None,
               'min_radius': round(narrowest['Radius'], 2), 'min_radius_at': round(narrowest['Distance'], 1)}
    flagged = [layer['LayerGeometry'] for layer in channel['Layers']['LayersInfo'] if is_bottleneck(layer)]
    if len(flagged) != 1:
        summary['unavailable'] = {'bottleneck_radius': 'several_bottleneck_flags' if flagged else 'no_bottleneck_flag'}
    elif outside_channel(flagged[0], profile[-1]['Distance']):
        summary['unavailable'] = {'bottleneck_radius': 'bottleneck_outside_channel'}
    else:
        summary['bottleneck_radius'] = round(flagged[0]['MinRadius'], 2)
        summary['bottleneck_at'] = [round(flagged[0]['StartDistance'], 1), round(flagged[0]['EndDistance'], 1)]
    return summary


def properties_of(properties: dict) -> dict:
    return {key.lower(): properties.get(key) for key in PROPERTIES}


def layer_interval(layer: dict) -> dict:
    """Where a layer is along the channel, its narrowest radius and whether it is the flagged bottleneck"""
    geometry_ = layer['LayerGeometry']
    return {'from': round(geometry_['StartDistance'], 1), 'to': round(geometry_['EndDistance'], 1),
            'min_radius': round(geometry_['MinRadius'], 2), 'bottleneck': is_bottleneck(layer)}


def layer_details(channel: dict, method: str) -> list[dict]:
    """Each layer of a channel: where it is along the channel, its narrowest radius, whether it is the flagged bottleneck,
    and for MOLE whether it is a local minimum of the radius, its residues and properties (CAVER's are not given)"""
    length = channel['Profile'][-1]['Distance']
    details = []
    for layer in channel['Layers']['LayersInfo']:
        geometry_ = layer['LayerGeometry']
        detail = layer_interval(layer)
        if outside_channel(geometry_, length):
            detail['outside_channel'] = True
        if method == 'MOLE':
            detail |= {'local_minimum': geometry_.get('LocalMinimum', False), 'residues': residues([layer]),
                       'properties': properties_of(layer['Properties'])}
        details.append(detail)
    return details


# A residue as MOLE writes it: name, author number, chain (none when the file has none), its insertion code (i:A), and
# Backbone when only the backbone lines the layer. The chain of a copy in an assembly has the copy's number after a dash
# (ChannelsDB's B-2) or an underscore (PDBe's C_2, which MOLEonline computes on): MOLE's notation, not of author chain IDs
# in general (in the release of 2026-10-28 no other chain has a dash, and all MOLE's residues parse). The same pattern as
# MOLEonline's MCP server, so that both parse residues alike (sbncbr-mcp-design.md, Shared vocabulary).
RESIDUE = re.compile(r'(?P<name>\S+) (?P<number>-?\d+)(?: (?!i:)(?P<chain>\S+?)(?:[_-](?P<copy>\d+))?)?(?: i:(?P<insertion_code>\S))?')


def residue_parts(residue: str) -> dict:
    """The parts of a residue, so that a reader need not parse it: its chain is the deposited chain (author chain ID),
    also for a symmetry copy, whose number is in copy"""
    if (match := RESIDUE.fullmatch(residue)) is None:
        return dict.fromkeys(('name', 'number', 'insertion_code', 'chain', 'copy'))
    return {'name': match['name'], 'number': int(match['number']), 'insertion_code': match['insertion_code'],
            'chain': match['chain'], 'copy': int(match['copy']) if match['copy'] else None}


def residues(layers: list[dict], parts: bool = False) -> list[dict]:
    """The residues of layers in the order of their first appearance, each backbone_only when only its backbone lines them,
    with their parts"""
    found: dict[str, bool] = {}
    for layer in layers:
        for residue in layer['Residues']:
            name = residue.removesuffix(' Backbone')
            found[name] = found.get(name, True) and residue != name
    return [{'residue': name} | (residue_parts(name) if parts else {}) | {'backbone_only': backbone} for name, backbone in found.items()]


def names_of(annotations: list[dict], channel_id: str, details: bool = False) -> list[dict]:
    """The curated names of a channel with their references (and descriptions with details)"""
    return [{'name': a['Name'], 'reference': a['Reference'], 'reference_type': a['ReferenceType']}
            | ({'description': a['Description']} if details else {})
            for a in annotations if a['Id'] == channel_id]


def shared_ids(files: dict[str, dict]) -> dict[str, list[str]]:
    """The references of the channels by ID, for the IDs of several channels: their curated names apply to all of them"""
    by_id: dict[str, list[str]] = {}
    for name, data in files.items():
        for position, channel in enumerate(channels_of(data), 1):
            by_id.setdefault(channel['Id'], []).append(f'{name}/{position}')
    return {channel_id: refs for channel_id, refs in by_id.items() if len(refs) > 1}


def stated(value):
    """The parameters without their empty parts (no origin points, no query, ...), as the model reads them (as MOLEonline's)"""
    if isinstance(value, dict):
        return {k: v for k, v in ((k, stated(v)) for k, v in value.items()) if v not in (None, '', [], {})}
    if isinstance(value, list):
        return [stated(v) for v in value]
    return value


# MOLE's parameters (Config.Params.Parameters) where MOLEonline's API has them (its MoleParameters: Cavity, Tunnel)
MOLEONLINE_PARAMETERS = {'ProbeRadius': 'Cavity', 'InteriorThreshold': 'Cavity', 'IgnoreHETAtoms': 'Cavity', 'IgnoreHydrogens': 'Cavity',
                         'WeightFunction': 'Tunnel', 'BottleneckRadius': 'Tunnel', 'BottleneckTolerance': 'Tunnel',
                         'MaxTunnelSimilarity': 'Tunnel', 'OriginRadius': 'Tunnel', 'SurfaceCoverRadius': 'Tunnel'}
# MOLE 2.5.17's WeightFunction 0 is VoronoiScale (replayed exactly with MOLE 2.5.26); others are not verified
WEIGHT_FUNCTIONS = {0: 'VoronoiScale'}


def moleonline_residues(residues: list[dict]) -> list[dict]:
    # MOLEonline's residues have no insertion code (none of the stored starting residues has one)
    return [{'Chain': r['Chain'], 'SequenceNumber': r['SequenceNumber']} for r in residues]


def moleonline_points(points: list[dict]) -> list[dict]:
    return [{'X': x, 'Y': y, 'Z': z} for x, y, z in (point['Point'] for point in points)]


def moleonline_parameters(config: dict) -> tuple[dict, dict]:
    """MOLE's stored config as the parameters of MOLEonline's API (MoleParameters: Cavity, Tunnel, Origin, ...), all of them
    given, also the defaults, so that a job can repeat the computation; and what MOLEonline's API cannot take, as stored"""
    parameters: dict = {'Input': {}, 'Cavity': {}, 'Tunnel': {}}
    not_in_moleonline = {}
    for key, value in config['Params']['Parameters'].items():
        if key == 'WeightFunction' and value not in WEIGHT_FUNCTIONS:
            not_in_moleonline[key] = value
        elif key in MOLEONLINE_PARAMETERS:
            parameters[MOLEONLINE_PARAMETERS[key]][key] = WEIGHT_FUNCTIONS[value] if key == 'WeightFunction' else value
        else:
            not_in_moleonline[key] = value
    if chains := config.get('Input', {}).get('SpecificChains'):
        parameters['Input']['SpecificChains'] = chains
    if config.get('Input', {}).get('ReadAllModels'):
        not_in_moleonline['ReadAllModels'] = True
    if query := config['Params'].get('QueryFilterString'):
        parameters['QueryFilter'] = query
    excluded = config.get('NonActiveParts', {})
    if excluded.get('Residues'):
        parameters['NonActiveResidues'] = moleonline_residues(excluded['Residues'])
    if excluded.get('Queries'):
        not_in_moleonline['NonActiveParts'] = [query['Text'] for query in excluded['Queries']]
    origin = {}
    for point in config.get('Origins', {}).get('Points', {}).get('Points', []):
        if point['Residues']:
            origin.setdefault('Residues', []).append(moleonline_residues(point['Residues']))
        origin.setdefault('Points', []).extend(moleonline_points(point['Points']))
        origin.setdefault('Queries', []).extend(query['Text'] for query in point['Queries'])
    if queries := origin.pop('Queries', []):
        # MOLEonline's origin is one query
        origin['QueryExpression'] = queries[0] if len(queries) == 1 else f'Or({",".join(queries)})'
    parameters['Origin'] = stated(origin)
    # Exits are given as the origins are, points in groups
    exits = [point for group in config.get('CustomExits', {}).get('Points', {}).get('Points', []) for point in group['Points']]
    if exits:
        parameters['CustomExits'] = {'Points': moleonline_points(exits)}
    # Any other part (a pore's Paths, charges, van der Waals radii), when it has something
    for key, value in config.items():
        if key not in ('Input', 'Params', 'NonActiveParts', 'CustomExits', 'Origins', 'Export') and stated(value):
            not_in_moleonline[key] = stated(value)
    return stated(parameters), not_in_moleonline


def computed_with(name: str, data: dict, source_db: SourceDatabase, protein_id: str) -> dict:
    """What the channels of a file were computed with (provenance as in the shared vocabulary), in the terms of MOLEonline's
    tools, so that an assistant can compute the like there: the structure (load_structure's pdb_id and assembly, or the
    model's URL), the starting point (compute_tunnels' start), and for MOLE its version and parameters (MOLEonline's API
    shape, and what MOLEonline cannot take). null when not recorded: CAVER's files and the reviewed channels and pores
    record no parameters (their config is a placeholder, their Version MOLE's)."""
    config = data.get('Config', {})
    structure_kind = CATEGORIES[name][2]
    if structure_kind is None:
        structure = None
    elif source_db == SourceDatabase.AlphaFill:
        structure = {'url': alphafill_model(protein_id),
                     'note': 'the model as AlphaFill has it today, which may differ from the one computed on'}
    elif structure_kind == ASSEMBLY:
        structure = {'pdb_id': protein_id, 'assembly': 'preferred',
                     'note': "PDBe's preferred assembly at the time of the computation; today's may differ (its ID is not recorded)"}
    else:
        structure = {'pdb_id': protein_id, 'assembly': 'asymmetric'}
    answer = {'structure': structure, 'starting_point': starts(data) or None, 'mole_version': None, 'parameters': None,
              'not_in_moleonline': None}
    if CATEGORIES[name][0] == 'MOLE' and 'Params' in config:
        answer['mole_version'] = data.get('Version')
        answer['parameters'], answer['not_in_moleonline'] = moleonline_parameters(config)
    if unavailable := {key: 'not_recorded' for key, value in answer.items() if value is None}:
        answer['unavailable'] = unavailable
    return answer


def category(name: str, data: dict, source_db: SourceDatabase, protein_id: str) -> dict:
    method, what, _ = CATEGORIES[name]
    summary = {'file': f'{name}.json', 'method': method, 'channels_of': what,
               'computed_with': computed_with(name, data, source_db, protein_id)}
    if method == 'CAVER':
        # A copy: answers are added to, the constant must not be
        summary['unavailable'] = dict(CAVER_UNAVAILABLE)
    return summary


def channel_summary(ref: str, channel: dict, annotations: list[dict], shared: dict[str, list[str]], details: bool = False) -> dict:
    names = names_of(annotations, channel['Id'], details)
    # Where the results page lists it: under its first curated name, or its type, as the page labels channels
    label = names[0]['name'] if names else channel['Type']
    name = ref.partition('/')[0]
    # Properties are averages over the lining residues, which CAVER's are not given of (the category's unavailable)
    properties = properties_of(channel['Properties']) if CATEGORIES[name][0] == 'MOLE' else None
    summary = {'ref': ref, 'type': channel['Type'], 'id': channel['Id'], 'on_web': f'{SECTIONS[name]}: {label} (Id: {channel["Id"]})',
               'names': names} | geometry(channel) | {'properties': properties}
    if names and channel['Id'] in shared:
        summary['names_apply_also_to'] = [other for other in shared[channel['Id']] if other != ref]
    return summary


def describe_entry_of(entry: str, website: str, category_name: str | None = None, offset: int = 0) -> dict:
    answer, source_db, protein_id, read = opened(entry)
    if read is None:
        return answer
    answer['web'] = web_page(website, source_db, protein_id)
    answer['downloads'] = downloads(website, source_db, protein_id)
    if source_db == SourceDatabase.AlphaFill:
        answer['structure_url'] = alphafill_model(protein_id)
    files, annotations = read
    if category_name is not None and category_name not in files:
        raise ToolError(f'"{category_name}" is not a category of {protein_id}. Its categories are {", ".join(files)}.')
    if offset < 0 or (offset and category_name is None):
        raise ToolError('offset is the position to list the channels of one category from (from next_offset), with its category.')
    shared = shared_ids(files)
    categories = []
    for name, data in files.items() if category_name is None else [(category_name, files[category_name])]:
        channels = channels_of(data)
        listed = category(name, data, source_db, protein_id) | {
            'total_channels': len(channels),
            'channels': [channel_summary(f'{name}/{position}', channel, annotations, shared)
                         for position, channel in enumerate(channels[offset:offset + MAX_CHANNELS], offset + 1)]}
        if offset + MAX_CHANNELS < len(channels):
            listed['next_offset'] = offset + MAX_CHANNELS
        categories.append(listed)
    if category_name is not None:
        return answer | {'found': True, 'categories': categories}
    # Said explicitly, so that a missing category is not read as a protein without such channels
    none = [f'{method} {what}' for name, (method, what, _) in CATEGORIES.items() if name in channel_types(source_db) and name not in files]
    return answer | {'found': True, 'categories': categories, 'channelsdb_has_none_of': none}


# A residue asked for: chain and author number, with an insertion code (A 221, A:221, A 221A)
ASKED_RESIDUE = re.compile(r'(?P<chain>[A-Za-z0-9]+)[ :](?P<number>-?\d+)(?P<insertion_code>[A-Za-z]?)')


def find_channels_of(entry: str, residue: str, website: str, offset: int = 0) -> dict:
    if (asked := ASKED_RESIDUE.fullmatch(residue.strip())) is None:
        raise ToolError(f'"{residue}" is not a residue as chain and author number, e.g. "A 221", or with an insertion code "A 221A".')
    if offset < 0:
        raise ToolError('offset is the position to list the channels from (from next_offset).')
    chain, number, insertion_code = asked['chain'], int(asked['number']), asked['insertion_code'] or None
    answer, source_db, protein_id, read = opened(entry)
    answer['residue'] = {'chain': chain, 'number': number, 'insertion_code': insertion_code}
    if read is None:
        return answer
    files, annotations = read
    lined, searched, not_searched = [], 0, 0
    for name, data in files.items():
        if CATEGORIES[name][0] == 'CAVER':
            not_searched += len(channels_of(data))
            continue
        for position, channel in enumerate(channels_of(data), 1):
            searched += 1
            # The residue as stored, in the deposited chain or a symmetry copy (GLU 221 A, GLU 221 A-2), with the layers it lines
            found: dict[str, list[dict]] = {}
            for layer in channel['Layers']['LayersInfo']:
                for stored in layer['Residues']:
                    parts = residue_parts(stored.removesuffix(' Backbone'))
                    if (parts['chain'], parts['number'], parts['insertion_code']) == (chain, number, insertion_code):
                        found.setdefault(stored.removesuffix(' Backbone'), []).append((layer, stored.endswith(' Backbone')))
            if not found:
                continue
            summary = channel_summary(f'{name}/{position}', channel, annotations, {})
            ways = []
            for stored, layers in found.items():
                # Unknown, not false, for a channel without a bottleneck (not exactly one flagged layer on the channel)
                at_bottleneck = None if summary['bottleneck_radius'] is None else any(is_bottleneck(layer) for layer, _ in layers)
                ways.append({'residue': stored, 'copy': residue_parts(stored)['copy'],
                             'backbone_only': all(backbone for _, backbone in layers), 'at_bottleneck': at_bottleneck,
                             'layers': [layer_interval(layer) | {'backbone_only': backbone} for layer, backbone in layers]})
            keys = ('ref', 'on_web', 'names', 'length', 'bottleneck_radius', 'unavailable')
            lined.append({key: summary[key] for key in keys if key in summary} | {'as': ways})
    answer |= {'found': True, 'web': web_page(website, source_db, protein_id), 'searched_channels': searched,
               'total_channels': len(lined), 'channels': lined[offset:offset + MAX_CHANNELS]}
    if offset + MAX_CHANNELS < len(lined):
        answer['next_offset'] = offset + MAX_CHANNELS
    if not_searched:
        answer['not_searched'] = {'channels': not_searched, 'reason': CAVER_CONVERSION}
    return answer


@lru_cache(maxsize=2)
def content(release_dir: str) -> dict[str, dict[str, list[int]]]:
    """db_content.json of a release: the numbers of channels of each entry (by lowercased ID) in the order of
    CHANNEL_TYPES_PDB or CHANNEL_TYPES_ALPHAFILL, as calculate_stats.py writes them; read once per release"""
    with open(Path(release_dir) / 'db_content.json') as f:
        return json.load(f)


def lookup_entries_of(entries: list[str]) -> dict:
    if len(entries) > MAX_ENTRIES:
        raise ToolError(f'{len(entries)} entries asked, at most {MAX_ENTRIES} in one call: split the list.')
    release_dir = base()
    stored = content(str(release_dir))
    found, seen = [], set()
    for entry in entries:
        try:
            source_db, protein_id = entry_of(entry)
        except ToolError as e:
            # One mistyped ID does not lose the answer for the others
            found.append({'entry': entry, 'error': str(e)})
            continue
        if (source_db, protein_id) in seen:
            continue
        seen.add((source_db, protein_id))
        answer = {'entry': protein_id, 'database': str(source_db)}
        if (counts := stored[str(source_db)].get(protein_id.lower())) is None:
            found.append(answer | {'found': False})
            continue
        found.append(answer | {'found': True, 'channels': {name: n for name, n in zip(channel_types(source_db), counts, strict=True) if n}})
    return {'source': 'channelsdb', 'release': release_dir.name,
            'categories': {name: f'{method} {what}' for name, (method, what, _) in CATEGORIES.items()},
            'entries': found, 'found': sum(1 for answer in found if answer.get('found')), 'asked': len(found),
            'note': NOT_NEGATIVE}


UNIPROT_FROM_SIFTS = 'SIFTS (PDBe), as it maps the entry now, read when asked and kept for up to a day; not of the data release'


def uniprot_residues(source_db: SourceDatabase, protein_id: str) -> tuple[dict[tuple[str, str], tuple[str, int]] | None, str | None]:
    """UniProt's accession and position of the residues of an entry by their deposited chain and author number with its
    insertion code (as SIFTS writes it, 59A), or None with the reason. An AlphaFill model is its UniProt protein, chain A
    numbered as in UniProt."""
    if source_db == SourceDatabase.AlphaFill:
        return None, None
    try:
        sifts = get_sifts(protein_id)
    except HTTPException as e:
        return None, 'not_in_sifts' if e.status_code == 404 else 'sifts_unavailable'
    except requests.RequestException:
        return None, 'sifts_unavailable'
    return {(chain, number): (accession, int(position)) for accession, chains in sifts.items() for chain, numbers in chains.items()
            for position, number in numbers.items() if position.lstrip('-').isdigit()}, None


def add_uniprot(listed: list[dict], source_db: SourceDatabase, protein_id: str, mapping: dict | None) -> None:
    """The UniProt accession and position of each residue: null for a residue SIFTS maps to none (a ligand, a chain without
    UniProt), all null when the mapping is not available. A symmetry copy is mapped by its deposited chain."""
    for residue in listed:
        if residue['number'] is None:
            found = None
        elif source_db == SourceDatabase.AlphaFill:
            found = (protein_id, residue['number']) if residue['chain'] == 'A' and not residue['insertion_code'] else None
        else:
            found = (mapping or {}).get((residue['chain'], f'{residue["number"]}{residue["insertion_code"] or ""}'))
        residue['uniprot'], residue['uniprot_position'] = found or (None, None)


def describe_channel_of(entry: str, channel: str, website: str, with_layers: bool = False, layer_offset: int = 0,
                        with_uniprot: bool = False) -> dict:
    answer, source_db, protein_id, read = opened(entry)
    if read is None:
        return answer
    answer['web'] = web_page(website, source_db, protein_id)
    files, annotations = read
    if layer_offset < 0 or (layer_offset and not with_layers):
        raise ToolError('layer_offset is the position to list the layers from (from next_layer_offset), with layers.')
    name, _, position = channel.strip().partition('/')
    channels = channels_of(files[name]) if name in files else []
    if not position.isdigit() or not 1 <= int(position) <= len(channels):
        refs = ', '.join(f'{n}/1..{len(channels_of(d))}' for n, d in files.items())
        raise ToolError(f'"{channel}" is not a channel of {protein_id}. Its channels are {refs} (from describe_entry).')
    found = channels[int(position) - 1]
    of_category = category(name, files[name], source_db, protein_id)
    summary = of_category | channel_summary(f'{name}/{position}', found, annotations, shared_ids(files), details=True)
    if unavailable := of_category.get('unavailable', {}) | summary.get('unavailable', {}):
        summary['unavailable'] = unavailable
    if CATEGORIES[name][0] == 'CAVER':
        summary |= {'lining_residues': None, 'bottleneck_residues': None}
        if with_layers:
            summary['unavailable'] |= {'layer_residues': CAVER_CONVERSION, 'layer_properties': CAVER_CONVERSION,
                                       'local_minimum': 'caver_local_minimum_always_set'}
    else:
        layers = found['Layers']['LayersInfo']
        summary |= {'lining_residues': residues(layers, parts=True), 'bottleneck_residues': None}
        if summary['bottleneck_radius'] is None:
            # Unknown, not none: for the same reason as the bottleneck itself
            summary['unavailable']['bottleneck_residues'] = summary['unavailable']['bottleneck_radius']
        else:
            summary['bottleneck_residues'] = residues([layer for layer in layers if is_bottleneck(layer)], parts=True)
        if with_uniprot:
            # Not of the release: SIFTS's mapping of now
            summary['uniprot_mapping'] = (UNIPROT_FROM_SIFTS if source_db == SourceDatabase.PDB
                                          else 'the numbering of the AlphaFill model, which is UniProt\'s')
            mapping, reason = uniprot_residues(source_db, protein_id)
            if reason:
                summary.setdefault('unavailable', {})['uniprot'] = reason
            for listed in (summary['lining_residues'], summary['bottleneck_residues'] or []):
                add_uniprot(listed, source_db, protein_id, mapping)
    if with_layers:
        layers = layer_details(found, CATEGORIES[name][0])
        summary |= {'total_layers': len(layers), 'layers': layers[layer_offset:layer_offset + MAX_LAYERS]}
        if layer_offset + MAX_LAYERS < len(layers):
            summary['next_layer_offset'] = layer_offset + MAX_LAYERS
    return answer | {'found': True, 'channel': summary}


# The tools only read the stored data, the same answer for the same data
READ_ONLY = ToolAnnotations(read_only_hint=True, destructive_hint=False, idempotent_hint=True, open_world_hint=False)
# describe_channel asks SIFTS for the UniProt positions (uniprot)
READ_ONLY_OPEN = READ_ONLY.model_copy(update={'open_world_hint': True})


async def answered(function, *args) -> dict:
    """The function's answer, computed in a thread (it reads files). An unexpected failure (data not as expected) becomes
    an error the model can report, rather than the SDK's bare "Error executing tool": what failed, without details."""
    try:
        return await anyio.to_thread.run_sync(function, *args)
    except ToolError:
        raise
    except Exception as e:
        # Its details (paths, data) only in the log, the server is public
        logger.exception('MCP %s%s failed', function.__name__, args)
        raise ToolError(f'ChannelsDB failed to answer ({type(e).__name__}). The fault is ChannelsDB\'s, not the request\'s; '
                        'it is logged.') from e


def create_server() -> MCPServer:
    """The server; its route is added to the app (add_to), its session manager runs in the app's lifespan"""
    server = MCPServer('ChannelsDB', version='1.0.0', instructions=INSTRUCTIONS)

    @server.tool(annotations=READ_ONLY)
    async def describe_entry(ctx: Context, entry: str, category: str | None = None, offset: int = 0) -> dict:
        """The channels ChannelsDB has for an entry, given as a PDB ID (e.g. 1tqn) or a UniProt ID of an AlphaFill model
        (e.g. P10635), by category: computed_with, in the terms of MOLEonline's tools: the structure (load_structure's pdb_id
        and assembly, or the model's url), the starting point (compute_tunnels' start: residues, ligand, point or auto),
        MOLE's version, its parameters in the shape of MOLEonline's API, and not_in_moleonline: those MOLEonline's API cannot
        be given (it uses its own settings for them, so a job there may differ where they matter); null when not recorded.
        For each channel: its
        ref (for describe_channel; id is a label from the data and the website, not a length), type (Tunnel, Pore, Path),
        curated names, length, bottleneck (the method's, MOLE's not counting the start) and narrowest point (Å, distances
        along the channel from its start), and properties (averages over the lining residues; MOLE's only). web: its page
        on the website, showing the channels in 3D with the structure; on_web: where the page lists each channel;
        downloads: all its channels for PyMOL, Chimera (legacy UCSF Chimera), VMD, as PDB or all in a ZIP; structure_url
        (AlphaFill): the model, as AlphaFill has it today, which may differ from the one the channels were computed on.
        At most 30 channels of a category are listed, in the order of its file: a category with more has next_offset, to
        list the next ones with category (its file name, e.g. cocaver) and offset. An entry not in ChannelsDB is found:
        false, not an error."""
        return await answered(describe_entry_of, entry, site(ctx), category, offset)

    @server.tool(annotations=READ_ONLY_OPEN)
    async def describe_channel(ctx: Context, entry: str, channel: str, layers: bool = False, layer_offset: int = 0,
                               uniprot: bool = False) -> dict:
        """One channel of an entry by its ref from describe_entry (e.g. cofactors/2): its geometry, curated names with their
        references, and for MOLE its lining residues, bottleneck residues (those of the bottleneck layer) and properties.
        Each residue as stored (residue, for display: a copy in an assembly is written B-2 here, C_2 in MOLEonline) and its
        parts, to match residues by: name, author number, insertion code, chain (as deposited) and copy (GLU 221 B-2 is GLU
        221 of chain B in copy 2); all null for a residue not in this form. backbone_only: only its backbone atoms line the
        channel in the stored structure; in bottleneck_residues, only in the bottleneck layer. CAVER channels have geometry
        only, the rest is null with the reason. web: the entry's page on the website, on_web: where the page lists the
        channel, to show it in 3D.
        With layers: each layer along the channel (from, to: Å from its start), its narrowest radius and whether it is the
        flagged bottleneck; for MOLE also whether it is a local minimum of the radius, its residues (by their residue in
        lining_residues) and properties, to see where along the channel a residue lines it and how narrow it is there. A
        layer's min_radius is the narrowest anywhere in the layer, not at each of its residues; layer radii are MOLE's or
        CAVER's own, not the profile's. At most 40 layers at once: a channel with more has next_layer_offset, to list the
        next ones with layers=true and layer_offset.
        With uniprot: each lining and bottleneck residue of MOLE with its UniProt accession and position (from SIFTS for a
        PDB entry), to look up what is known about it, e.g. in UniProt; null for a residue without one (a ligand, a chain
        without UniProt), and all null with the reason in unavailable when the mapping is not available."""
        return await answered(describe_channel_of, entry, channel, site(ctx), layers, layer_offset, uniprot)

    @server.tool(annotations=READ_ONLY)
    async def lookup_entries(entries: list[str]) -> dict:
        """Which of up to 100 entries (PDB IDs, UniProt IDs of AlphaFill models) ChannelsDB has, and how many channels of each
        category (keyed as describe_entry's files and channel refs; categories says what they are). For the IDs of a search
        elsewhere (PDBe, RCSB, UniProt), then describe_entry for the entries of interest. An invalid ID is an error of its
        item only."""
        return await answered(lookup_entries_of, entries)

    @server.tool(annotations=READ_ONLY)
    async def find_channels(ctx: Context, entry: str, residue: str, offset: int = 0) -> dict:
        """The channels of an entry a residue lines, given as chain and author number (as in the structure file), with an
        insertion code if it has one: "A 221", "A 221A". Lines means listed among the residues of a channel's layers as
        computed, not merely near the channel. Also in the symmetry copies of an assembly (stored as GLU 221 A-2). For each
        channel its ref (for describe_channel), curated names, length and bottleneck, and the residue as stored (for
        display; its copy in copy) with backbone_only, whether it lines the bottleneck (null when the channel has none, with
        the reason in unavailable), and the layers it lines (from, to: Å from the start; min_radius is the layer's
        narrowest, not at the residue; backbone_only in that layer). MOLE's channels only: CAVER's residues are not given,
        their number is in not_searched. No channels is an answer: the residue lines none of the channels searched. At most
        30 channels at once: with more, next_offset, to list the next ones with offset."""
        return await answered(find_channels_of, entry, residue, site(ctx), offset)

    return server


class Endpoint:
    """The server's route, /mcp: stateless, JSON answers, only POST (as MOLEonline's: a GET would open a stream a stateless
    server never uses, kept open with pings). No DNS rebinding protection, which guards servers on the user's machine.

    The SDK's app for the route is made anew each time the API starts (running), as its session manager runs only once,
    and the API's app, a module's global, is started again by each test."""

    def __init__(self, server: MCPServer):
        self.server = server
        self.app: ASGIApp | None = None

    @asynccontextmanager
    async def running(self):
        mcp_app = self.server.streamable_http_app(stateless_http=True, json_response=True,
                                                  transport_security=TransportSecuritySettings(enable_dns_rebinding_protection=False))
        [route] = mcp_app.routes
        self.app = route.endpoint
        async with self.server.session_manager.run():
            yield

    async def __call__(self, scope: Scope, receive: Receive, send: Send) -> None:
        if scope['method'] != 'POST':
            raise HTTPException(405, headers={'Allow': 'POST'})
        await self.app(scope, receive, send)


def add_to(app: FastAPI, server: MCPServer) -> Endpoint:
    """Adds the server's route to the app; the app runs it (Endpoint.running) in its lifespan"""
    endpoint = Endpoint(server)
    app.router.routes.append(Route('/mcp', endpoint))
    return endpoint
