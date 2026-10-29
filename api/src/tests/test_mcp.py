import json
from zipfile import ZipFile

import pytest
from fastapi.testclient import TestClient

from api.config import config
from api.main import app


def layer(start: float, end: float, radius: float, residues: list[str], bottleneck: bool = False) -> dict:
    # As in the data, the flag of the bottleneck only in its layer
    return {'LayerGeometry': {'MinRadius': radius, 'MinFreeRadius': radius, 'StartDistance': start, 'EndDistance': end,
                              'LocalMinimum': False} | ({'Bottleneck': True} if bottleneck else {}),
            'Residues': residues, 'FlowIndices': [], 'Properties': {}}


def channel(channel_id: str, layers: list[dict], profile: list[tuple[float, float]]) -> dict:
    return {'Type': 'Tunnel', 'Id': channel_id, 'Cavity': '1', 'Auto': True,
            'Properties': {'Charge': 1, 'Hydropathy': -0.5, 'Hydrophobicity': -0.2, 'Polarity': 10.0, 'Mutability': 80},
            'Profile': [{'Radius': radius, 'FreeRadius': radius, 'T': i / (len(profile) - 1), 'Distance': distance,
                         'X': 0.0, 'Y': 0.0, 'Z': distance, 'Charge': 0} for i, (distance, radius) in enumerate(profile)],
            'Layers': {'ResidueFlow': [], 'HetResidues': [], 'LayerWeightedProperties': {}, 'LayersInfo': layers}}


def channels_file(channels: list[dict], config_: dict) -> dict:
    return {'Config': config_, 'Channels': {'Paths': channels, 'Tunnels': [], 'Pores': [], 'MergedPores': []}}


MOLE_CONFIG = {'Origins': {'Points': {'Points': [{'Residues': [], 'Points': [],
                                                 'Queries': [{'Text': "Atoms('Fe').Inside(Residues('HEM'))"}]}]}}}
# MOLE: the start narrowest, the flagged bottleneck after it; a residue lining with its backbone only
COFACTORS = channels_file([channel('25.20', [layer(0, 2, 1.0, ['HEM 500 A', 'PHE 57 A']),
                                             layer(2, 9, 1.4, ['PHE 57 A Backbone', 'GLY 58 A Backbone'], bottleneck=True),
                                             layer(9, 24, 2.2, ['GLN 221 A i:A'])],
                                   [(0, 1.0), (5, 1.4), (25.23, 2.6)])], MOLE_CONFIG)
# CAVER: two flagged layers; its ID also of the MOLE channel, its flagged layer ending past the profile (as CAVER's do);
# the flagged layer inverted (starting after it ends); the flagged layer starting at the profile's end
COCAVER = channels_file([channel('1', [layer(0, 1, 1.5, ['BSER 106 A'], bottleneck=True), layer(1, 2, 1.5, ['SER 106 A'], bottleneck=True)],
                                 [(0, 1.5), (1.8, 1.6)]),
                         channel('25.20', [layer(0, 3, 1.2, ['GLN -0.295 C1164'], bottleneck=True)], [(0, 1.2), (2.96, 1.9)]),
                         channel('3', [layer(0, 7.2, 1.8, []), layer(7.2, 7.1, 1.5, [], bottleneck=True)], [(0, 1.8), (6.9, 1.5)]),
                         channel('4', [layer(0, 13.9, 1.8, []), layer(13.9, 14.6, 1.1, [], bottleneck=True)], [(0, 1.8), (13.9, 1.5)])],
                        {'InMembrane': False})
# MOLE: starting points chosen by MOLE, a channel without a flagged layer
PROCOGNATE = channels_file([channel('12.00', [layer(0, 12, 1.3, ['TYR 96 A'])], [(0, 1.3), (12, 2.0)])],
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
    assert {t['name'] for t in tools} == {'describe_entry', 'describe_channel', 'lookup_entries'}
    # Read-only, so that clients need not ask before calling them
    assert all(t['annotations']['readOnlyHint'] and not t['annotations']['destructiveHint'] for t in tools)


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
    assert cofactors['starts_from'] == ["atoms of the query Atoms('Fe').Inside(Residues('HEM'))"]
    assert 'preferred assembly' in cofactors['computed_on']
    [mole] = cofactors['channels']
    # The bottleneck is the flagged layer, the narrowest point is at the start; the length is the profile's end
    assert {key: mole[key] for key in ('ref', 'length', 'bottleneck_radius', 'bottleneck_at', 'min_radius', 'min_radius_at')} == {
        'ref': 'cofactors/1', 'length': 25.2, 'bottleneck_radius': 1.4, 'bottleneck_at': [2, 9], 'min_radius': 1.0, 'min_radius_at': 0}
    assert mole['names'] == [{'name': 'Channel 2a', 'reference': '10.1016/j.bbagen.2006.07.005', 'reference_type': 'DOI'}]
    assert mole['names_apply_also_to'] == ['cocaver/2']
    # Where the page lists each channel, without a describe_channel call
    assert mole['on_web'] == 'Cofactor Tunnels MOLE: Channel 2a (Id: 25.20)'
    assert (cocaver['method'], cocaver['starts_from']) == ('CAVER', 'not recorded')
    assert cocaver['unavailable']['lining_residues'] == 'caver_conversion'
    assert cocaver['channels'][0]['bottleneck_radius'] is None
    assert cocaver['channels'][0]['unavailable'] == {'bottleneck_radius': 'several_bottleneck_flags'}
    # A layer starting after it ends, or at or past the end of the profile, is no location on the channel
    for outside, length in zip(cocaver['channels'][2:], (6.9, 13.9), strict=True):
        assert (outside['length'], outside['bottleneck_radius'], outside['bottleneck_at']) == (length, None, None)
        assert outside['unavailable'] == {'bottleneck_radius': 'bottleneck_outside_channel'}
    assert procognate['starts_from'] == ['starting points chosen automatically by MOLE (in the cavities it found)']
    assert 'MOLE tunnels from the catalytic site (M-CSA)' in answer['channelsdb_has_none_of']


def test_describe_mole_channel(client):
    _, answer = tool(client, 'describe_channel', entry='1tqn', channel='cofactors/1')
    found = answer['channel']
    assert found['lining_residues'] == [{'residue': 'HEM 500 A', 'backbone_only': False},
                                        {'residue': 'PHE 57 A', 'backbone_only': False},
                                        {'residue': 'GLY 58 A', 'backbone_only': True},
                                        {'residue': 'GLN 221 A i:A', 'backbone_only': False}]
    assert found['bottleneck_residues'] == [{'residue': 'PHE 57 A', 'backbone_only': True}, {'residue': 'GLY 58 A', 'backbone_only': True}]
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
    assert found['lining_residues'] == [{'residue': 'TYR 96 A', 'backbone_only': False}]


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
    assert failed and 'cofactors/1..1, cocaver/1..4, procognate/1..1' in text


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
