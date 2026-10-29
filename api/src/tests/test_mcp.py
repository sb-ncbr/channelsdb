import json
from zipfile import ZipFile

import pytest
import requests
from fastapi import HTTPException
from fastapi.testclient import TestClient

from api import mcp_server
from api.config import config
from api.main import app


def layer(start: float, end: float, radius: float, residues: list[str], bottleneck: bool = False, charge: int = 0) -> dict:
    # As in the data, the flag of the bottleneck only in its layer
    return {'LayerGeometry': {'MinRadius': radius, 'MinFreeRadius': radius, 'StartDistance': start, 'EndDistance': end,
                              'LocalMinimum': False} | ({'Bottleneck': True} if bottleneck else {}),
            'Residues': residues, 'FlowIndices': [],
            'Properties': {'Charge': charge, 'Hydropathy': -0.9, 'Hydrophobicity': -0.4, 'Polarity': 20.0, 'Mutability': 70}}


def channel(channel_id: str, layers: list[dict], profile: list[tuple[float, float]]) -> dict:
    return {'Type': 'Tunnel', 'Id': channel_id, 'Cavity': '1', 'Auto': True,
            'Properties': {'Charge': 1, 'Hydropathy': -0.5, 'Hydrophobicity': -0.2, 'Polarity': 10.0, 'Mutability': 80},
            'Profile': [{'Radius': radius, 'FreeRadius': radius, 'T': i / (len(profile) - 1), 'Distance': distance,
                         'X': 0.0, 'Y': 0.0, 'Z': distance, 'Charge': 0} for i, (distance, radius) in enumerate(profile)],
            'Layers': {'ResidueFlow': [], 'HetResidues': [], 'LayerWeightedProperties': {}, 'LayersInfo': layers}}


def channels_file(channels: list[dict], config_: dict) -> dict:
    # CAVER's files too carry MOLE's version
    return {'Version': '2.5.17.4.24', 'Config': config_, 'Channels': {'Paths': channels, 'Tunnels': [], 'Pores': [], 'MergedPores': []}}


MOLE_CONFIG = {'Params': {'Parameters': {'ProbeRadius': 5.0, 'BottleneckRadius': 1.25, 'WeightFunction': 0,
                                         'FilterTunnelBoundaryLayers': True},
                          'QueryFilterString': None},
               'Export': {'Parameters': {'FormatJSON': True}}, 'CustomVdw': {'Values': {}},
               'Origins': {'Points': {'Points': [{'Residues': [], 'Points': [],
                                                  'Queries': [{'Text': "Atoms('Fe').Inside(Residues('HEM'))"}]}]}}}
# MOLE: the start narrowest, the flagged bottleneck after it; a residue lining with its backbone only
COFACTORS = channels_file([channel('25.20', [layer(0, 2, 1.0, ['HEM 500 A', 'PHE 57 A'], charge=-1),
                                             layer(2, 9, 1.4, ['PHE 57 A Backbone', 'GLY 58 A Backbone'], bottleneck=True),
                                             layer(9, 24, 2.2, ['GLN 221 A i:A', 'GLU 221 B-2', 'ALA -3 AA'], charge=2)],
                                   [(0, 1.0), (5, 1.4), (25.23, 2.6)])], MOLE_CONFIG)
# CAVER: two flagged layers; its ID also of the MOLE channel, its flagged layer ending past the profile (as CAVER's do);
# the flagged layer inverted (starting after it ends); the flagged layer starting at the profile's end
COCAVER = channels_file([channel('1', [layer(0, 1, 1.5, ['BSER 106 A'], bottleneck=True), layer(1, 2, 1.5, ['SER 106 A'], bottleneck=True)],
                                 [(0, 1.5), (1.8, 1.6)]),
                         channel('25.20', [layer(0, 3, 1.2, ['GLN -0.295 C1164'], bottleneck=True)], [(0, 1.2), (2.96, 1.9)]),
                         channel('3', [layer(0, 7.2, 1.8, []), layer(7.2, 7.1, 1.5, [], bottleneck=True)], [(0, 1.8), (6.9, 1.5)]),
                         channel('4', [layer(0, 13.9, 1.8, []), layer(13.9, 14.6, 1.1, [], bottleneck=True)], [(0, 1.8), (13.9, 1.5)])],
                        {'InMembrane': False})
# MOLE: starting points chosen by MOLE, a channel without a flagged layer, and one with it, both lined by TYR 96 A
PROCOGNATE = channels_file([channel('12.00', [layer(0, 12, 1.3, ['TYR 96 A'])], [(0, 1.3), (12, 2.0)]),
                            channel('14.00', [layer(0, 3, 1.6, []), layer(3, 14, 1.2, ['TYR 96 A'], bottleneck=True)],
                                    [(0, 1.6), (14, 2.0)])],
                           {'Origins': {'UseAutoPoints': True, 'Points': {'Points': []}}})
ANNOTATIONS = [{'Id': '25.20', 'Name': 'Channel 2a', 'Description': 'Between the F-G loop and the B-C loop',
                'Reference': '10.1016/j.bbagen.2006.07.005', 'ReferenceType': 'DOI'}]


@pytest.fixture
def client(tmp_path, monkeypatch):
    """The API on a data release with one PDB entry, 1tqn"""
    release = tmp_path / 'releases' / '20261028-073322'
    entry = release / 'PDB' / 'tq' / '1tqn'
    entry.mkdir(parents=True)
    with ZipFile(entry / 'data.zip', 'w') as z:
        for name, content in (('cofactors.json', COFACTORS), ('cocaver.json', COCAVER), ('procognate.json', PROCOGNATE),
                              ('annotations.json', ANNOTATIONS)):
            z.writestr(name, json.dumps(content))
    # As calculate_stats.py writes it: the numbers of channels in the order of CHANNEL_TYPES_PDB / CHANNEL_TYPES_ALPHAFILL
    (release / 'db_content.json').write_text(json.dumps({'PDB': {'1tqn': [0, 0, 0, 0, 1, 4, 0, 0, 1, 0]},
                                                         'AlphaFill': {'p10635': [6, 8]}}))
    # An AlphaFill model, numbered as UniProt; a ligand outside chain A
    model = release / 'AlphaFill' / '9x' / 'q9xyz1'
    model.mkdir(parents=True)
    lining = layer(0, 8, 1.2, ['LEU 87 A', 'HIS 194 A Backbone', 'HEM 1 B'], bottleneck=True)
    with ZipFile(model / 'data.zip', 'w') as z:
        z.writestr('alphafill.json', json.dumps(channels_file([channel('8.10', [lining], [(0, 1.2), (8.1, 1.9)])], MOLE_CONFIG)))
    (tmp_path / 'current').symlink_to(release)
    monkeypatch.setitem(config['dirs'], 'base', str(tmp_path / 'current'))
    with TestClient(app) as client:
        yield client


def rpc(client, method: str, params: dict | None = None) -> dict:
    response = client.post('/mcp', json={'jsonrpc': '2.0', 'id': 1, 'method': method, 'params': params or {}},
                           headers={'Accept': 'application/json, text/event-stream', 'MCP-Protocol-Version': '2025-06-18'})
    assert response.status_code == 200, response.text
    return response.json()['result']


def tool(client, name: str, **arguments) -> tuple[bool, dict | str]:
    """Whether the tool failed, and its answer (the error's text when it did)"""
    result = rpc(client, 'tools/call', {'name': name, 'arguments': arguments})
    text = result['content'][0]['text']
    return result.get('isError', False), text if result.get('isError') else json.loads(text)


def test_tools(client):
    tools = rpc(client, 'tools/list')['tools']
    assert {t['name'] for t in tools} == {'describe_entry', 'describe_channel', 'lookup_entries', 'find_channels'}
    # Read-only, so that clients need not ask before calling them; describe_channel asks SIFTS
    assert all(t['annotations']['readOnlyHint'] and not t['annotations']['destructiveHint'] for t in tools)
    assert {t['name']: t['annotations']['openWorldHint'] for t in tools} == {
        'describe_entry': False, 'describe_channel': True, 'lookup_entries': False, 'find_channels': False}


@pytest.mark.parametrize('method', ['GET', 'DELETE'])
def test_only_post(client, method):
    response = client.request(method, '/mcp', headers={'Accept': 'text/event-stream'})
    assert (response.status_code, response.headers['Allow']) == (405, 'POST')


def test_invalid_entry_is_an_error(client):
    failed, text = tool(client, 'describe_entry', entry='not an id')
    assert failed and 'neither a PDB ID' in text


def test_entry_not_stored_is_an_answer(client):
    failed, answer = tool(client, 'describe_entry', entry='P10635')
    assert not failed
    assert (answer['found'], answer['database'], answer['release']) == (False, 'AlphaFill', '20261028-073322')
    assert 'not a negative result' in answer['message']
    assert 'web' not in answer


def test_describe_entry(client):
    _, answer = tool(client, 'describe_entry', entry='1TQN')
    assert (answer['source'], answer['entry'], answer['found']) == ('channelsdb', '1tqn', True)
    # The results page, on the host the client reached
    assert answer['web'] == 'http://testserver/detail/pdb/1tqn'
    assert answer['downloads']['pymol'] == 'http://testserver/api/download/pdb/1tqn/pymol'
    assert set(answer['downloads']) == {'pymol', 'chimera', 'vmd', 'pdb', 'zip'}
    cofactors, cocaver, procognate = answer['categories']
    assert (cofactors['method'], cofactors['file'], cofactors['total_channels']) == ('MOLE', 'cofactors.json', 1)
    # What they were computed with, in the terms of MOLEonline's tools: load_structure's structure, compute_tunnels' start,
    # the parameters in its API's shape (WeightFunction 0 is VoronoiScale), and what its API cannot take
    assert cofactors['computed_with'] == {
        'structure': {'pdb_id': '1tqn', 'assembly': 'preferred',
                      'note': "PDBe's preferred assembly at the time of the computation; today's may differ (its ID is not recorded)"},
        'starting_point': [{'start': 'ligand', 'ligands': ['HEM'], 'queries': ["Atoms('Fe').Inside(Residues('HEM'))"]}],
        'mole_version': '2.5.17.4.24',
        'parameters': {'Cavity': {'ProbeRadius': 5.0}, 'Tunnel': {'BottleneckRadius': 1.25, 'WeightFunction': 'VoronoiScale'},
                       'Origin': {'QueryExpression': "Atoms('Fe').Inside(Residues('HEM'))"}},
        'not_in_moleonline': {'FilterTunnelBoundaryLayers': True}}
    [mole] = cofactors['channels']
    # The bottleneck is the flagged layer, the narrowest point is at the start; the length is the profile's end
    assert {key: mole[key] for key in ('ref', 'length', 'bottleneck_radius', 'bottleneck_at', 'min_radius', 'min_radius_at')} == {
        'ref': 'cofactors/1', 'length': 25.2, 'bottleneck_radius': 1.4, 'bottleneck_at': [2, 9], 'min_radius': 1.0, 'min_radius_at': 0}
    assert mole['names'] == [{'name': 'Channel 2a', 'reference': '10.1016/j.bbagen.2006.07.005', 'reference_type': 'DOI'}]
    assert mole['names_apply_also_to'] == ['cocaver/2']
    # The type and properties of each channel, as in MOLEonline's summaries; CAVER's properties not given
    assert (mole['type'], mole['properties']['charge']) == ('Tunnel', 1)
    assert (cocaver['channels'][0]['type'], cocaver['channels'][0]['properties']) == ('Tunnel', None)
    # Where the page lists each channel, without a describe_channel call
    assert mole['on_web'] == 'Cofactor Tunnels MOLE: Channel 2a (Id: 25.20)'
    assert cocaver['method'] == 'CAVER'
    # Not recorded is null with the reason, as elsewhere
    assert cocaver['computed_with'] == {
        'structure': {'pdb_id': '1tqn', 'assembly': 'asymmetric'}, 'starting_point': None, 'mole_version': None, 'parameters': None,
        'not_in_moleonline': None, 'unavailable': dict.fromkeys(('starting_point', 'mole_version', 'parameters', 'not_in_moleonline'),
                                                                 'not_recorded')}
    assert cocaver['unavailable']['lining_residues'] == 'caver_conversion'
    assert cocaver['channels'][0]['bottleneck_radius'] is None
    assert cocaver['channels'][0]['unavailable'] == {'bottleneck_radius': 'several_bottleneck_flags'}
    # A layer starting after it ends, or at or past the end of the profile, is no location on the channel
    for outside, length in zip(cocaver['channels'][2:], (6.9, 13.9), strict=True):
        assert (outside['length'], outside['bottleneck_radius'], outside['bottleneck_at']) == (length, None, None)
        assert outside['unavailable'] == {'bottleneck_radius': 'bottleneck_outside_channel'}
    assert procognate['computed_with']['starting_point'] == [{'start': 'auto'}]
    # Only an AlphaFill model has a structure_url (a PDB entry is loaded by its ID)
    assert 'structure_url' not in answer
    assert 'MOLE tunnels from the catalytic site (M-CSA)' in answer['channelsdb_has_none_of']


def test_describe_mole_channel(client):
    _, answer = tool(client, 'describe_channel', entry='1tqn', channel='cofactors/1')
    found = answer['channel']
    assert [(r['residue'], r['backbone_only']) for r in found['lining_residues']] == [
        ('HEM 500 A', False), ('PHE 57 A', False), ('GLY 58 A', True), ('GLN 221 A i:A', False), ('GLU 221 B-2', False),
        ('ALA -3 AA', False)]
    # The parts of each residue, so that a reader need not parse it; a symmetry copy's chain is the deposited chain
    parts = [{key: r[key] for key in ('name', 'number', 'insertion_code', 'chain', 'copy')} for r in found['lining_residues'][3:]]
    assert parts == [{'name': 'GLN', 'number': 221, 'insertion_code': 'A', 'chain': 'A', 'copy': None},
                     {'name': 'GLU', 'number': 221, 'insertion_code': None, 'chain': 'B', 'copy': 2},
                     {'name': 'ALA', 'number': -3, 'insertion_code': None, 'chain': 'AA', 'copy': None}]
    assert found['bottleneck_residues'] == [
        {'residue': 'PHE 57 A', 'name': 'PHE', 'number': 57, 'insertion_code': None, 'chain': 'A', 'copy': None, 'backbone_only': True},
        {'residue': 'GLY 58 A', 'name': 'GLY', 'number': 58, 'insertion_code': None, 'chain': 'A', 'copy': None, 'backbone_only': True}]
    assert found['properties'] == {'charge': 1, 'hydropathy': -0.5, 'hydrophobicity': -0.2, 'polarity': 10.0, 'mutability': 80}
    assert found['names'][0]['description'] == 'Between the F-G loop and the B-C loop'
    # Listed on the page under its curated name
    assert (answer['web'], found['on_web']) == ('http://testserver/detail/pdb/1tqn', 'Cofactor Tunnels MOLE: Channel 2a (Id: 25.20)')


def test_unknown_bottleneck_has_unknown_residues(client):
    """Not an empty list, which would say that no residues form the bottleneck"""
    _, answer = tool(client, 'describe_channel', entry='1tqn', channel='procognate/1')
    found = answer['channel']
    assert (found['bottleneck_radius'], found['bottleneck_residues']) == (None, None)
    assert found['unavailable'] == {'bottleneck_radius': 'no_bottleneck_flag', 'bottleneck_residues': 'no_bottleneck_flag'}
    assert [r['residue'] for r in found['lining_residues']] == ['TYR 96 A']


def test_describe_caver_channel(client):
    _, answer = tool(client, 'describe_channel', entry='1tqn', channel='cocaver/2')
    found = answer['channel']
    assert (found['lining_residues'], found['bottleneck_residues'], found['properties']) == (None, None, None)
    assert found['unavailable'] == {'lining_residues': 'caver_conversion', 'bottleneck_residues': 'caver_conversion',
                                    'properties': 'caver_conversion'}
    # Its flagged layer ends past the profile, and is the bottleneck still
    assert (found['length'], found['bottleneck_radius'], found['bottleneck_at']) == (3.0, 1.2, [0, 3])
    # A missing bottleneck adds to the reasons of the method; without a curated name, listed by its type
    _, answer = tool(client, 'describe_channel', entry='1tqn', channel='cocaver/1')
    assert answer['channel']['on_web'] == 'Cofactor Tunnels CAVER: Tunnel (Id: 1)'
    assert answer['channel']['unavailable'] == {'lining_residues': 'caver_conversion', 'bottleneck_residues': 'caver_conversion',
                                                'properties': 'caver_conversion', 'bottleneck_radius': 'several_bottleneck_flags'}


@pytest.mark.parametrize('ref', ['cofactors/2', 'csa/1', 'cofactors', 'cofactors/x'])
def test_unknown_channel_is_an_error(client, ref):
    failed, text = tool(client, 'describe_channel', entry='1tqn', channel=ref)
    assert failed and 'cofactors/1..1, cocaver/1..4, procognate/1..2' in text


def test_lookup_entries(client):
    _, answer = tool(client, 'lookup_entries', entries=['1TQN', 'P10635', '9zzz', 'cyp3a4', '1tqn'])
    assert answer['release'] == '20261028-073322'
    # In the order asked, each once; the counts keyed as describe_entry's files, only those it has
    assert answer['entries'] == [
        {'entry': '1tqn', 'database': 'PDB', 'found': True, 'channels': {'cofactors': 1, 'cocaver': 4, 'procognate': 1}},
        {'entry': 'P10635', 'database': 'AlphaFill', 'found': True, 'channels': {'alphafill': 6, 'alphacaver': 8}},
        {'entry': '9zzz', 'database': 'PDB', 'found': False},
        {'entry': 'cyp3a4', 'error': '"cyp3a4" is neither a PDB ID (e.g. 1tqn) nor a UniProt ID of an AlphaFill model (e.g. P10635).'}]
    assert (answer['found'], answer['asked']) == (2, 4)
    assert answer['categories']['cocaver'] == 'CAVER tunnels from cofactors'
    assert 'not a negative result' in answer['note']


def test_lookup_entries_at_most_100(client):
    failed, text = tool(client, 'lookup_entries', entries=[f'{n}abc' for n in range(1, 10)] + [f'1{n:03}' for n in range(100)])
    assert failed and '109 entries asked, at most 100' in text


def test_mole_layers(client):
    """Where along the channel a residue lines it, and how narrow it is there"""
    _, answer = tool(client, 'describe_channel', entry='1tqn', channel='cofactors/1', layers=True)
    first, bottleneck, last = answer['channel']['layers']
    assert {key: first[key] for key in ('from', 'to', 'min_radius', 'bottleneck', 'local_minimum')} == {
        'from': 0, 'to': 2, 'min_radius': 1.0, 'bottleneck': False, 'local_minimum': False}
    # In the layers, residues by their string only (the key into lining_residues), to keep long channels small
    assert first['residues'] == [{'residue': 'HEM 500 A', 'backbone_only': False}, {'residue': 'PHE 57 A', 'backbone_only': False}]
    # Backbone only in this layer, though not in the whole channel
    assert (bottleneck['bottleneck'], bottleneck['residues'][0]) == (True, {'residue': 'PHE 57 A', 'backbone_only': True})
    # Each layer's own properties, not the channel's (charge 1, hydropathy -0.5)
    assert [layer['properties']['charge'] for layer in (first, bottleneck, last)] == [-1, 0, 2]
    assert last['properties'] == {'charge': 2, 'hydropathy': -0.9, 'hydrophobicity': -0.4, 'polarity': 20.0, 'mutability': 70}
    _, answer = tool(client, 'describe_channel', entry='1tqn', channel='cofactors/1')
    assert 'layers' not in answer['channel']


def test_caver_layers(client):
    """Geometry only: CAVER's residues, properties and local minima are not given"""
    _, answer = tool(client, 'describe_channel', entry='1tqn', channel='cocaver/3', layers=True)
    found = answer['channel']
    assert found['layers'] == [{'from': 0, 'to': 7.2, 'min_radius': 1.8, 'bottleneck': False},
                               {'from': 7.2, 'to': 7.1, 'min_radius': 1.5, 'bottleneck': True, 'outside_channel': True}]
    assert found['unavailable']['local_minimum'] == 'caver_local_minimum_always_set'
    assert found['unavailable']['layer_residues'] == 'caver_conversion'


def test_paging_a_category(client, monkeypatch):
    monkeypatch.setattr(mcp_server, 'MAX_CHANNELS', 2)
    _, answer = tool(client, 'describe_entry', entry='1tqn')
    cocaver = answer['categories'][1]
    assert [c['ref'] for c in cocaver['channels']] == ['cocaver/1', 'cocaver/2']
    assert (cocaver['total_channels'], cocaver['next_offset']) == (4, 2)
    _, answer = tool(client, 'describe_entry', entry='1tqn', category='cocaver', offset=2)
    [cocaver] = answer['categories']
    assert [c['ref'] for c in cocaver['channels']] == ['cocaver/3', 'cocaver/4']
    assert 'next_offset' not in cocaver


@pytest.mark.parametrize(('arguments', 'error'), [({'category': 'csa'}, 'Its categories are cofactors, cocaver, procognate'),
                                                  ({'offset': 2}, 'with its category'),
                                                  ({'category': 'cocaver', 'offset': -1}, 'with its category')])
def test_paging_errors(client, arguments, error):
    failed, text = tool(client, 'describe_entry', entry='1tqn', **arguments)
    assert failed and error in text


def test_paging_layers(client, monkeypatch):
    monkeypatch.setattr(mcp_server, 'MAX_LAYERS', 2)
    _, answer = tool(client, 'describe_channel', entry='1tqn', channel='cofactors/1', layers=True)
    found = answer['channel']
    assert ([layer['from'] for layer in found['layers']], found['total_layers'], found['next_layer_offset']) == ([0, 2], 3, 2)
    _, answer = tool(client, 'describe_channel', entry='1tqn', channel='cofactors/1', layers=True, layer_offset=2)
    assert [layer['from'] for layer in answer['channel']['layers']] == [9]
    assert 'next_layer_offset' not in answer['channel']
    failed, text = tool(client, 'describe_channel', entry='1tqn', channel='cofactors/1', layer_offset=2)
    assert failed and 'with layers' in text


def test_residue_not_in_the_form_has_no_parts():
    """The string stays, the parts are null rather than guessed or missing"""
    parts = mcp_server.residue_parts('GLN -0.295 C1164')
    assert parts == {'name': None, 'number': None, 'insertion_code': None, 'chain': None, 'copy': None}


# SIFTS's mapping of 1tqn: UniProt positions to author numbers (with insertion codes, 221A) by author chain
SIFTS = {'P08684': {'A': {'57': '57', '58': '58', '300': '221A'}, 'B': {'301': '221'}}}


def test_uniprot_positions(client, monkeypatch):
    monkeypatch.setattr(mcp_server, 'get_sifts', lambda pdb_id: SIFTS)
    _, answer = tool(client, 'describe_channel', entry='1tqn', channel='cofactors/1', uniprot=True)
    found = answer['channel']
    # The cofactor and a chain without a mapping have none; an insertion code and a symmetry copy (by its deposited chain) map
    assert [(r['residue'], r['uniprot'], r['uniprot_position']) for r in found['lining_residues']] == [
        ('HEM 500 A', None, None), ('PHE 57 A', 'P08684', 57), ('GLY 58 A', 'P08684', 58), ('GLN 221 A i:A', 'P08684', 300),
        ('GLU 221 B-2', 'P08684', 301), ('ALA -3 AA', None, None)]
    assert [r['uniprot_position'] for r in found['bottleneck_residues']] == [57, 58]
    assert 'uniprot' not in found.get('unavailable', {})
    # Where the positions come from, apart from the release of the channels
    assert found['uniprot_mapping'].startswith('SIFTS (PDBe)')
    _, answer = tool(client, 'describe_channel', entry='1tqn', channel='cofactors/1')
    assert 'uniprot' not in answer['channel']['lining_residues'][0]


def test_uniprot_positions_of_an_alphafill_model(client):
    _, answer = tool(client, 'describe_channel', entry='Q9XYZ1', channel='alphafill/1', uniprot=True)
    found = answer['channel']
    # Chain A is the protein, numbered as UniProt; anything else (a transplanted ligand) has no UniProt position
    assert [(r['uniprot'], r['uniprot_position']) for r in found['lining_residues']] == [('Q9XYZ1', 87), ('Q9XYZ1', 194), (None, None)]
    assert 'AlphaFill model' in found['uniprot_mapping']


@pytest.mark.parametrize(('failure', 'reason'), [(HTTPException(404, 'Cannot find annotations'), 'not_in_sifts'),
                                                 (HTTPException(502, 'PDBe server returned an error'), 'sifts_unavailable'),
                                                 (requests.ConnectionError(), 'sifts_unavailable')])
def test_uniprot_positions_unavailable(client, monkeypatch, failure, reason):
    """The channel still answered, its residues without UniProt, saying why"""
    def failing(pdb_id):
        raise failure
    monkeypatch.setattr(mcp_server, 'get_sifts', failing)
    failed, answer = tool(client, 'describe_channel', entry='1tqn', channel='cofactors/1', uniprot=True)
    found = answer['channel']
    assert not failed and found['unavailable']['uniprot'] == reason
    assert {r['uniprot'] for r in found['lining_residues']} == {None}
    assert found['length'] == 25.2


def test_find_channels(client):
    _, answer = tool(client, 'find_channels', entry='1tqn', residue='A 57')
    assert (answer['residue'], answer['searched_channels'], answer['total_channels']) == (
        {'chain': 'A', 'number': 57, 'insertion_code': None}, 3, 1)
    # CAVER's residues are not given: its channels are counted, not searched
    assert answer['not_searched'] == {'channels': 4, 'reason': 'caver_conversion'}
    [found] = answer['channels']
    assert (found['ref'], found['bottleneck_radius']) == ('cofactors/1', 1.4)
    assert found['on_web'] == 'Cofactor Tunnels MOLE: Channel 2a (Id: 25.20)'
    # With its side chain in the first layer, its backbone only in the bottleneck: not backbone only in the channel,
    # backbone only in the bottleneck layer
    assert found['as'] == [{'residue': 'PHE 57 A', 'copy': None, 'backbone_only': False, 'at_bottleneck': True,
                            'layers': [{'from': 0, 'to': 2, 'min_radius': 1.0, 'bottleneck': False, 'backbone_only': False},
                                       {'from': 2, 'to': 9, 'min_radius': 1.4, 'bottleneck': True, 'backbone_only': True}]}]


def test_find_channels_unknown_bottleneck(client):
    """Whether the residue lines a bottleneck the channel does not have is unknown, not false"""
    _, answer = tool(client, 'find_channels', entry='1tqn', residue='A 96')
    unknown, known = answer['channels']
    assert (unknown['ref'], unknown['as'][0]['at_bottleneck'], unknown['unavailable']) == (
        'procognate/1', None, {'bottleneck_radius': 'no_bottleneck_flag'})
    assert (known['ref'], known['as'][0]['at_bottleneck'], 'unavailable' in known) == ('procognate/2', True, False)


@pytest.mark.parametrize(('residue', 'stored'), [('B 221', 'GLU 221 B-2'), ('B:221', 'GLU 221 B-2'), ('A 221A', 'GLN 221 A i:A')])
def test_find_channels_in_copies_and_with_insertion_codes(client, residue, stored):
    _, answer = tool(client, 'find_channels', entry='1tqn', residue=residue)
    [found] = answer['channels']
    assert [way['residue'] for way in found['as']] == [stored]
    if stored == 'GLU 221 B-2':
        assert found['as'][0]['copy'] == 2


def test_find_channels_none_is_an_answer(client):
    """A 221 without its insertion code is another residue than A 221A"""
    failed, answer = tool(client, 'find_channels', entry='1tqn', residue='A 221')
    assert not failed and (answer['found'], answer['channels'], answer['total_channels']) == (True, [], 0)


def test_find_channels_pages(client, monkeypatch):
    monkeypatch.setattr(mcp_server, 'MAX_CHANNELS', 1)
    _, answer = tool(client, 'find_channels', entry='1tqn', residue='A 96')
    assert ([c['ref'] for c in answer['channels']], answer['total_channels'], answer['next_offset']) == (['procognate/1'], 2, 1)
    _, answer = tool(client, 'find_channels', entry='1tqn', residue='A 96', offset=1)
    assert [c['ref'] for c in answer['channels']] == ['procognate/2']
    assert 'next_offset' not in answer
    failed, text = tool(client, 'find_channels', entry='1tqn', residue='A 57', offset=-1)
    assert failed and 'offset' in text


@pytest.mark.parametrize('residue', ['GLU 221 A', '221', 'A'])
def test_find_channels_needs_chain_and_number(client, residue):
    failed, text = tool(client, 'find_channels', entry='1tqn', residue=residue)
    assert failed and 'chain and author number' in text


@pytest.mark.parametrize(('residue', 'parts'), [
    ('GLU 221 B-2', {'name': 'GLU', 'number': 221, 'insertion_code': None, 'chain': 'B', 'copy': 2}),
    ('ALA 5 C_2', {'name': 'ALA', 'number': 5, 'insertion_code': None, 'chain': 'C', 'copy': 2}),
    ('SER 12 i:B', {'name': 'SER', 'number': 12, 'insertion_code': 'B', 'chain': None, 'copy': None}),
    ('GLN 221 A i:A', {'name': 'GLN', 'number': 221, 'insertion_code': 'A', 'chain': 'A', 'copy': None})])
def test_residues_parsed_as_moleonline(residue, parts):
    """The copies of PDBe (C_2) and of ChannelsDB (B-2), residues without a chain"""
    assert mcp_server.residue_parts(residue) == parts


def test_structure_url_of_an_alphafill_model(client):
    _, answer = tool(client, 'describe_entry', entry='Q9XYZ1')
    assert answer['structure_url'] == 'https://alphafill.eu/v1/aff/Q9XYZ1'


OR_QUERY = "Or(AtomNames('N1N').Inside(Residues('NDP')),Atoms('Fe').Inside(Residues('HEM')))"


@pytest.mark.parametrize(('origin', 'started'), [
    ({'Residues': [{'Chain': 'A', 'SequenceNumber': 59, 'InsertionCode': 'A'}], 'Points': [], 'Queries': []},
     [{'start': 'residues', 'residues': ['A 59A']}]),
    ({'Residues': [], 'Points': [{'Point': [31.8114, -7.314, -15.896]}], 'Queries': []},
     [{'start': 'point', 'point': [31.811, -7.314, -15.896]}]),
    # Several cofactors, from their reactive atoms
    ({'Residues': [], 'Points': [], 'Queries': [{'Text': OR_QUERY}]},
     [{'start': 'ligand', 'ligands': ['NDP', 'HEM'], 'queries': [OR_QUERY]}]),
    ({'Residues': [], 'Points': [], 'Queries': [{'Text': "AtomNames('N5').Inside(Residues('FAD, FMN'))"}]},
     [{'start': 'ligand', 'ligands': ['FAD', 'FMN'], 'queries': ["AtomNames('N5').Inside(Residues('FAD, FMN'))"]}]),
    # AlphaFill's: any of the ligands, the queries adding nothing to their names
    ({'Residues': [], 'Points': [], 'Queries': [{'Text': 'Residues("HEM")'}, {'Text': 'Residues("ATP")'}]},
     [{'start': 'ligand', 'ligands': ['HEM', 'ATP']}])])
def test_starting_points_as_moleonline_takes_them(origin, started):
    assert mcp_server.starts({'Config': {'Origins': {'Points': {'Points': [origin]}}}}) == started


def test_parameters_for_moleonline():
    """Residue and point origins, several queries joined, excluded residues and queries, and an unverified weight function"""
    config = {'Input': {'SpecificChains': 'A'}, 'Params': {'Parameters': {'ProbeRadius': 3.0, 'WeightFunction': 2, 'MinDepth': 8},
                                                           'QueryFilterString': ''},
              'NonActiveParts': {'Residues': [{'Chain': 'A', 'SequenceNumber': 7, 'InsertionCode': ' '}],
                                 'Queries': [{'Text': 'HetResidues()', 'Query': {}}]},
              'CustomExits': {'Points': {'Points': [{'Residues': [], 'Points': [{'Point': [1.0, 2.0, 3.0]}], 'Queries': []}]}},
              'Paths': [{'Start': [0, 0, 0]}], 'CustomVdw': {'Values': {}},
              'Origins': {'Points': {'Points': [{'Residues': [{'Chain': 'A', 'SequenceNumber': 309, 'InsertionCode': ' '}],
                                                 'Points': [{'Point': [4.0, 5.0, 6.0]}],
                                                 'Queries': [{'Text': "Residues('HEM')"}, {'Text': "Residues('ATP')"}]}]}}}
    parameters, not_in_moleonline = mcp_server.moleonline_parameters(config)
    assert parameters == {'Input': {'SpecificChains': 'A'}, 'Cavity': {'ProbeRadius': 3.0},
                          'NonActiveResidues': [{'Chain': 'A', 'SequenceNumber': 7}],
                          'Origin': {'Residues': [[{'Chain': 'A', 'SequenceNumber': 309}]], 'Points': [{'X': 4.0, 'Y': 5.0, 'Z': 6.0}],
                                     'QueryExpression': "Or(Residues('HEM'),Residues('ATP'))"},
                          'CustomExits': {'Points': [{'X': 1.0, 'Y': 2.0, 'Z': 3.0}]}}
    # A pore's paths are not MOLEonline's tunnel parameters; empty parts are left out
    assert not_in_moleonline == {'WeightFunction': 2, 'MinDepth': 8, 'NonActiveParts': ['HetResidues()'], 'Paths': [{'Start': [0, 0, 0]}]}
