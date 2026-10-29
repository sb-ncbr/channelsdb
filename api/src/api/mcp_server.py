"""ChannelsDB as an MCP server (https://modelcontextprotocol.io) at /mcp, for assistants: summaries of the stored channels
a model can read, saying what the data cannot provide and why (MCP.md). Stateless and answered as JSON, as MOLEonline's."""

import json
import logging
import re
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

from api.common import CHANNEL_TYPES_ALPHAFILL, CHANNEL_TYPES_PDB, PDB_ID_REGEX, UNIPROT_ID_REGEX, SourceDatabase, protein_dir
from api.config import config
from api.endpoints.annotations import get_sifts


MAX_CHANNELS = 30  # of a category in describe_entry, the rest are counted
MAX_ENTRIES = 100  # in a call of lookup_entries
MAX_LAYERS = 40  # of a channel in describe_channel, about 400 characters each (long channels have hundreds)
PROPERTIES = ('Charge', 'Hydropathy', 'Hydrophobicity', 'Polarity', 'Mutability')  # of MOLE's channels, averages over the lining residues

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


def release() -> str:
    """The name of the data release read (the directory the data link points to)"""
    return Path(config['dirs']['base']).resolve().name


def read_entry(source_db: SourceDatabase, protein_id: str) -> tuple[dict[str, dict], list[dict]] | None:
    """The channel files of an entry by their name (csa, cocaver, ...) and its curated annotations; None when not stored"""
    data_file = protein_dir(source_db, protein_id) / 'data.zip'
    if not data_file.exists():
        return None
    names = CHANNEL_TYPES_PDB if source_db == SourceDatabase.PDB else CHANNEL_TYPES_ALPHAFILL
    files, annotations = {}, []
    with ZipFile(data_file) as z:
        for member in z.namelist():
            if (name := Path(member).stem) in names:
                files[name] = json.loads(z.read(member))
            elif member == 'annotations.json':
                annotations = json.loads(z.read(member))
    # In the order of the categories, as the results page lists them
    return {name: files[name] for name in CATEGORIES if name in files}, annotations


def channels_of(data: dict) -> list[dict]:
    """The channels of a file, in the order the API reads them (their references count from 1 in this order)"""
    return [channel for group in ('Paths', 'Tunnels', 'Pores', 'MergedPores') for channel in data['Channels'][group]]


def starts(data: dict) -> list[str] | None:
    """Where MOLE started the channels of a file, from its Config; None when not recorded (CAVER, reviewed, pores)"""
    origins = data.get('Config', {}).get('Origins')
    if origins is None:
        return None
    found = ['starting points chosen automatically by MOLE (in the cavities it found)'] if origins.get('UseAutoPoints') else []
    for origin in origins['Points']['Points']:
        if residues := origin['Residues']:
            found.append('residues ' + ', '.join(f'{r["Chain"]} {r["SequenceNumber"]}{r["InsertionCode"].strip()}' for r in residues))
        found.extend(f'atoms of the query {query["Text"]}' for query in origin['Queries'])
        found.extend('point [{:.2f}, {:.2f}, {:.2f}] Å'.format(*point['Point']) for point in origin['Points'])
    return found


def is_bottleneck(layer: dict) -> bool:
    # The flag is left out of the other layers
    return layer['LayerGeometry'].get('Bottleneck', False)


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
    elif flagged[0]['StartDistance'] > flagged[0]['EndDistance'] or flagged[0]['StartDistance'] >= profile[-1]['Distance']:
        # CAVER's last layer can start after it ends, or past the profile (CAVER.md): no location on the channel. A layer
        # only ending past the profile is not excluded, CAVER's layers end up to 5 Å after it.
        summary['unavailable'] = {'bottleneck_radius': 'bottleneck_outside_channel'}
    else:
        summary['bottleneck_radius'] = round(flagged[0]['MinRadius'], 2)
        summary['bottleneck_at'] = [round(flagged[0]['StartDistance'], 1), round(flagged[0]['EndDistance'], 1)]
    return summary


def properties_of(properties: dict) -> dict:
    return {key.lower(): properties.get(key) for key in PROPERTIES}


def layer_details(channel: dict, method: str) -> list[dict]:
    """Each layer of a channel: where it is along the channel, its narrowest radius, whether it is the flagged bottleneck,
    and for MOLE whether it is a local minimum of the radius, its residues and properties (CAVER's are not given)"""
    length = channel['Profile'][-1]['Distance']
    details = []
    for layer in channel['Layers']['LayersInfo']:
        geometry_ = layer['LayerGeometry']
        detail = {'from': round(geometry_['StartDistance'], 1), 'to': round(geometry_['EndDistance'], 1),
                  'min_radius': round(geometry_['MinRadius'], 2), 'bottleneck': is_bottleneck(layer)}
        if geometry_['StartDistance'] > geometry_['EndDistance'] or geometry_['StartDistance'] >= length:
            # CAVER's last layer can start after it ends, or past the profile: no location on the channel (geometry())
            detail['outside_channel'] = True
        if method == 'MOLE':
            detail |= {'local_minimum': geometry_.get('LocalMinimum', False), 'residues': residues([layer]),
                       'properties': properties_of(layer['Properties'])}
        details.append(detail)
    return details


# A residue as MOLE writes it: name, author number and chain, its insertion code (i:A), and Backbone when only the
# backbone lines the layer. The chain of a symmetry copy of an assembly has the copy's number after a dash (B-2): MOLE's
# notation, not of author chain IDs in general (in the release of 2026-10-28 no other chain has a dash, and all MOLE's
# residues parse).
RESIDUE = re.compile(r'(?P<name>\S+) (?P<number>-?\d+) (?P<chain>\S+?)(?:-(?P<copy>\d+))?(?: i:(?P<insertion_code>\S))?')


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


def category(name: str, data: dict) -> dict:
    method, what, computed_on = CATEGORIES[name]
    summary = {'file': f'{name}.json', 'method': method, 'channels_of': what,
               'computed_on': computed_on or 'not recorded', 'starts_from': starts(data) or 'not recorded'}
    if method == 'CAVER':
        summary['unavailable'] = CAVER_UNAVAILABLE
    return summary


def channel_summary(ref: str, channel: dict, annotations: list[dict], shared: dict[str, list[str]], details: bool = False) -> dict:
    names = names_of(annotations, channel['Id'], details)
    # Where the results page lists it: under its first curated name, or its type, as the page labels channels
    label = names[0]['name'] if names else channel['Type']
    summary = {'ref': ref, 'id': channel['Id'], 'on_web': f'{SECTIONS[ref.partition("/")[0]]}: {label} (Id: {channel["Id"]})',
               'names': names} | geometry(channel)
    if names and channel['Id'] in shared:
        summary['names_apply_also_to'] = [other for other in shared[channel['Id']] if other != ref]
    return summary


def describe_entry_of(entry: str, website: str, category_name: str | None = None, offset: int = 0) -> dict:
    source_db, protein_id = entry_of(entry)
    answer = {'source': 'channelsdb', 'release': release(), 'entry': protein_id, 'database': str(source_db)}
    if (read := read_entry(source_db, protein_id)) is None:
        return answer | {'found': False, 'message': NOT_COMPUTED.format(entry=protein_id)}
    answer['web'] = web_page(website, source_db, protein_id)
    answer['downloads'] = downloads(website, source_db, protein_id)
    files, annotations = read
    if category_name is not None and category_name not in files:
        raise ToolError(f'"{category_name}" is not a category of {protein_id}. Its categories are {", ".join(files)}.')
    if offset < 0 or (offset and category_name is None):
        raise ToolError('offset is the position to list the channels of one category from (from next_offset), with its category.')
    shared = shared_ids(files)
    categories = []
    for name, data in files.items() if category_name is None else [(category_name, files[category_name])]:
        channels = channels_of(data)
        listed = category(name, data) | {
            'total_channels': len(channels),
            'channels': [channel_summary(f'{name}/{position}', channel, annotations, shared)
                         for position, channel in enumerate(channels[offset:offset + MAX_CHANNELS], offset + 1)]}
        if offset + MAX_CHANNELS < len(channels):
            listed['next_offset'] = offset + MAX_CHANNELS
        categories.append(listed)
    if category_name is not None:
        return answer | {'found': True, 'categories': categories}
    names = CHANNEL_TYPES_PDB if source_db == SourceDatabase.PDB else CHANNEL_TYPES_ALPHAFILL
    # Said explicitly, so that a missing category is not read as a protein without such channels
    none = [f'{method} {what}' for name, (method, what, _) in CATEGORIES.items() if name in names and name not in files]
    return answer | {'found': True, 'categories': categories, 'channelsdb_has_none_of': none}


@lru_cache(maxsize=2)
def content(release_dir: str) -> dict[str, dict[str, list[int]]]:
    """db_content.json of a release: the numbers of channels of each entry (by lowercased ID) in the order of
    CHANNEL_TYPES_PDB or CHANNEL_TYPES_ALPHAFILL, as calculate_stats.py writes them; read once per release"""
    with open(Path(release_dir) / 'db_content.json') as f:
        return json.load(f)


def lookup_entries_of(entries: list[str]) -> dict:
    stored = content(str(Path(config['dirs']['base']).resolve()))
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
        names = CHANNEL_TYPES_PDB if source_db == SourceDatabase.PDB else CHANNEL_TYPES_ALPHAFILL
        found.append(answer | {'found': True, 'channels': {name: n for name, n in zip(names, counts, strict=True) if n}})
    if len(found) > MAX_ENTRIES:
        raise ToolError(f'{len(found)} entries asked, at most {MAX_ENTRIES} in one call: split the list.')
    return {'source': 'channelsdb', 'release': release(),
            'categories': {name: f'{method} {what}' for name, (method, what, _) in CATEGORIES.items()},
            'entries': found, 'found': sum(1 for answer in found if answer.get('found')), 'asked': len(found),
            'note': 'Not found is not a negative result: ChannelsDB has the channels found for its starting points and parameters only.'}


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
    source_db, protein_id = entry_of(entry)
    answer = {'source': 'channelsdb', 'release': release(), 'entry': protein_id, 'database': str(source_db)}
    if (read := read_entry(source_db, protein_id)) is None:
        return answer | {'found': False, 'message': NOT_COMPUTED.format(entry=protein_id)}
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
    of_category = category(name, files[name])
    summary = of_category | channel_summary(f'{name}/{position}', found, annotations, shared_ids(files), details=True)
    if unavailable := of_category.get('unavailable', {}) | summary.get('unavailable', {}):
        summary['unavailable'] = unavailable
    if CATEGORIES[name][0] == 'CAVER':
        summary |= {'lining_residues': None, 'bottleneck_residues': None, 'properties': None}
        if with_layers:
            summary['unavailable'] |= {'layer_residues': CAVER_CONVERSION, 'layer_properties': CAVER_CONVERSION,
                                       'local_minimum': 'caver_local_minimum_always_set'}
    else:
        layers = found['Layers']['LayersInfo']
        summary |= {'lining_residues': residues(layers, parts=True), 'bottleneck_residues': None,
                    'properties': properties_of(found['Properties'])}
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


def create_server() -> MCPServer:
    """The server; its route is added to the app (add_to), its session manager runs in the app's lifespan"""
    server = MCPServer('ChannelsDB', version='1.0.0', instructions=INSTRUCTIONS)

    @server.tool(annotations=READ_ONLY)
    async def describe_entry(ctx: Context, entry: str, category: str | None = None, offset: int = 0) -> dict:
        """The channels ChannelsDB has for an entry, given as a PDB ID (e.g. 1tqn) or a UniProt ID of an AlphaFill model (e.g.
        P10635), by category: what they start from, the structure they were computed on, and for each channel its ref (for
        describe_channel), curated names, length, bottleneck (the method's, MOLE's not counting the start) and narrowest point
        (Å, distances along the channel from its start); web: its page on the website, showing the channels in 3D with the
        structure, on_web: where the page lists each channel; downloads: all its channels for PyMOL, Chimera (legacy UCSF
        Chimera), VMD, as PDB or all in a ZIP. At most 30 channels of a category are listed, in the order of its file: a
        category with more has next_offset, to list the next ones with category (its file name, e.g. cocaver) and offset. An
        entry not in ChannelsDB is found: false, not an error."""
        return await anyio.to_thread.run_sync(describe_entry_of, entry, site(ctx), category, offset)

    @server.tool(annotations=READ_ONLY_OPEN)
    async def describe_channel(ctx: Context, entry: str, channel: str, layers: bool = False, layer_offset: int = 0,
                               uniprot: bool = False) -> dict:
        """One channel of an entry by its ref from describe_entry (e.g. cofactors/2): its geometry, curated names with their
        references, and for MOLE its lining residues and bottleneck residues (backbone_only: only its backbone atoms line the
        channel in the stored structure; with their name, author number, insertion code and chain, and the copy of a symmetry
        copy of the assembly: residue 'GLU 221 B-2' is GLU 221 of chain B in copy 2; all null for a residue not in this form)
        and properties. CAVER channels have
        geometry only, the rest is null with the reason. web: the entry's page on the website, on_web: where the page lists
        the channel, to show it in 3D. With layers: each layer along the channel (from, to: Å from its start), its narrowest
        radius and whether it is the flagged bottleneck; for MOLE also whether it is a local minimum of the radius, its
        residues (by their residue in lining_residues) and properties, to see where along the channel a residue lines it and
        how narrow it is there. A layer's min_radius is the narrowest anywhere in the layer, not
        at each of its residues; layer radii are MOLE's or CAVER's own, not the profile's. At most 40 layers at once: a channel
        with more has next_layer_offset, to list the next ones with layers=true and layer_offset. With uniprot: each lining and
        bottleneck residue of MOLE with its UniProt accession and position (from SIFTS for a PDB entry), to look up what is
        known about it, e.g. in UniProt; null for a residue without one (a ligand, a chain without UniProt), and all null with
        the reason in unavailable when the mapping is not available."""
        return await anyio.to_thread.run_sync(describe_channel_of, entry, channel, site(ctx), layers, layer_offset, uniprot)

    @server.tool(annotations=READ_ONLY)
    async def lookup_entries(entries: list[str]) -> dict:
        """Which of up to 100 entries (PDB IDs, UniProt IDs of AlphaFill models) ChannelsDB has, and how many channels of each
        category (keyed as describe_entry's files and channel refs; categories says what they are). For the IDs of a search
        elsewhere (PDBe, RCSB, UniProt), then describe_entry for the entries of interest. An invalid ID is an error of its
        item only."""
        return await anyio.to_thread.run_sync(lookup_entries_of, entries)

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
