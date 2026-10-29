"""ChannelsDB as an MCP server (https://modelcontextprotocol.io) at /mcp, for assistants: summaries of the stored channels
a model can read, saying what the data cannot provide and why (MCP.md). Stateless and answered as JSON, as MOLEonline's."""

import json
import logging
import re
from contextlib import asynccontextmanager
from pathlib import Path
from zipfile import ZipFile

import anyio
from fastapi import FastAPI
from mcp.server.mcpserver import MCPServer
from mcp.server.mcpserver.exceptions import ToolError
from mcp.server.transport_security import TransportSecuritySettings
from mcp.types import ToolAnnotations
from starlette.exceptions import HTTPException
from starlette.routing import Route
from starlette.types import ASGIApp, Receive, Scope, Send

from api.common import CHANNEL_TYPES_ALPHAFILL, CHANNEL_TYPES_PDB, PDB_ID_REGEX, UNIPROT_ID_REGEX, SourceDatabase, protein_dir
from api.config import config


MAX_CHANNELS = 30  # of a category in describe_entry, the rest are counted
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


def residues(layers: list[dict]) -> list[dict]:
    """The residues of layers in the order of their first appearance, each backbone_only when only its backbone lines them"""
    found: dict[str, bool] = {}
    for layer in layers:
        for residue in layer['Residues']:
            name = residue.removesuffix(' Backbone')
            found[name] = found.get(name, True) and residue != name
    return [{'residue': name, 'backbone_only': backbone} for name, backbone in found.items()]


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
    summary = {'ref': ref, 'id': channel['Id'], 'names': names_of(annotations, channel['Id'], details)} | geometry(channel)
    if summary['names'] and channel['Id'] in shared:
        summary['names_apply_also_to'] = [other for other in shared[channel['Id']] if other != ref]
    return summary


def describe_entry_of(entry: str) -> dict:
    source_db, protein_id = entry_of(entry)
    answer = {'source': 'channelsdb', 'release': release(), 'entry': protein_id, 'database': str(source_db)}
    if (read := read_entry(source_db, protein_id)) is None:
        return answer | {'found': False, 'message': NOT_COMPUTED.format(entry=protein_id)}
    files, annotations = read
    shared = shared_ids(files)
    categories = []
    for name, data in files.items():
        channels = channels_of(data)
        categories.append(category(name, data) | {
            'total_channels': len(channels),
            'channels': [channel_summary(f'{name}/{position}', channel, annotations, shared)
                         for position, channel in enumerate(channels[:MAX_CHANNELS], 1)]})
    names = CHANNEL_TYPES_PDB if source_db == SourceDatabase.PDB else CHANNEL_TYPES_ALPHAFILL
    # Said explicitly, so that a missing category is not read as a protein without such channels
    none = [f'{method} {what}' for name, (method, what, _) in CATEGORIES.items() if name in names and name not in files]
    return answer | {'found': True, 'categories': categories, 'channelsdb_has_none_of': none}


def describe_channel_of(entry: str, channel: str) -> dict:
    source_db, protein_id = entry_of(entry)
    answer = {'source': 'channelsdb', 'release': release(), 'entry': protein_id, 'database': str(source_db)}
    if (read := read_entry(source_db, protein_id)) is None:
        return answer | {'found': False, 'message': NOT_COMPUTED.format(entry=protein_id)}
    files, annotations = read
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
    else:
        layers = found['Layers']['LayersInfo']
        properties = {key.lower(): found['Properties'].get(key) for key in PROPERTIES}
        summary |= {'lining_residues': residues(layers), 'bottleneck_residues': None, 'properties': properties}
        if summary['bottleneck_radius'] is None:
            # Unknown, not none: for the same reason as the bottleneck itself
            summary['unavailable']['bottleneck_residues'] = summary['unavailable']['bottleneck_radius']
        else:
            summary['bottleneck_residues'] = residues([layer for layer in layers if is_bottleneck(layer)])
    return answer | {'found': True, 'channel': summary}


# The tools only read the stored data, the same answer for the same data
READ_ONLY = ToolAnnotations(read_only_hint=True, destructive_hint=False, idempotent_hint=True, open_world_hint=False)


def create_server() -> MCPServer:
    """The server; its route is added to the app (add_to), its session manager runs in the app's lifespan"""
    server = MCPServer('ChannelsDB', instructions=INSTRUCTIONS)

    @server.tool(annotations=READ_ONLY)
    async def describe_entry(entry: str) -> dict:
        """The channels ChannelsDB has for an entry, given as a PDB ID (e.g. 1tqn) or a UniProt ID of an AlphaFill model (e.g.
        P10635), by category: what they start from, the structure they were computed on, and for each channel its ref (for
        describe_channel), curated names, length, bottleneck (the method's, MOLE's not counting the start) and narrowest point
        (Å, distances along the channel from its start). An entry not in ChannelsDB is found: false, not an error."""
        return await anyio.to_thread.run_sync(describe_entry_of, entry)

    @server.tool(annotations=READ_ONLY)
    async def describe_channel(entry: str, channel: str) -> dict:
        """One channel of an entry by its ref from describe_entry (e.g. cofactors/2): its geometry, curated names with their
        references, and for MOLE its lining residues and bottleneck residues (backbone_only: only its backbone atoms line the
        channel in the stored structure) and properties. CAVER channels have geometry only, the rest is null with the reason."""
        return await anyio.to_thread.run_sync(describe_channel_of, entry, channel)

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
