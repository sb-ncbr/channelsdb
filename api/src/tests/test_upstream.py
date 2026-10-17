import gzip

import pytest
import requests
from fastapi import HTTPException
from fastapi.testclient import TestClient

from api import common
from api.common import _get_pdbe_summary, get_pdbe_summary, session
from api.endpoints.assembly import get_assembly_id
from api.main import app


client = TestClient(app)

SIFTS = ('<entry xmlns="http://www.ebi.ac.uk/pdbe/docs/sifts/eFamily.xsd">'
         '<entity entityId="A"><segment><listResidue><residue>'
         '<crossRefDb dbCoordSys="UniProt" dbAccessionId="P11111" dbResNum="1"/><crossRefDb dbCoordSys="PDBresnum" dbResNum="1"/>'
         '</residue></listResidue></segment></entity>'
         '<entity entityId="B"><segment><listResidue><residue>'
         '<crossRefDb dbCoordSys="UniProt" dbAccessionId="P22222" dbResNum="1"/><crossRefDb dbCoordSys="PDBresnum" dbResNum="1"/>'
         '</residue></listResidue></segment></entity></entry>')

SUMMARY = '{"1abc": [{"assemblies": [{"assembly_id": "1", "preferred": true}]}]}'

UNIPROT = '<uniprot xmlns="https://uniprot.org/uniprot"><entry><protein><recommendedName><fullName>Protein</fullName></recommendedName></protein></entry></uniprot>'


def response(status_code: int, content: bytes = b'') -> requests.Response:
    r = requests.Response()
    r.status_code = status_code
    r._content = content
    r.url = 'https://upstream.example'
    return r


@pytest.fixture
def upstream(monkeypatch):
    """Mock the external APIs. Status codes can be set for 'pdbe', 'sifts', 'uniprot' (ID validation)
    or for individual UniProt IDs (EBI Proteins API); everything else succeeds."""
    statuses: dict[str, int] = {}

    def reply(key: str, content: str) -> requests.Response:
        status = statuses.get(key, 200)
        return response(status, content.encode() if status == 200 else b'')

    def get(url, **kwargs):
        if 'sifts' in url:
            status = statuses.get('sifts', 200)
            return response(status, gzip.compress(SIFTS.encode()) if status == 200 else b'')
        if 'proteins/api' in url:
            return reply(url.rsplit('/', 1)[-1], UNIPROT)
        if 'pdbe/api' in url:
            return reply('pdbe', SUMMARY)
        raise AssertionError(f'Unexpected request: {url}')

    monkeypatch.setattr(session, 'get', get)
    monkeypatch.setattr(session, 'head', lambda url, **kwargs: reply('uniprot', ''))
    # Summaries cached by other tests would bypass the mocked responses
    _get_pdbe_summary.cache_clear()
    yield statuses
    _get_pdbe_summary.cache_clear()


def uniprot_ids(response) -> list[str]:
    return [entry['UniProtId'] for entry in response.json()['EntryAnnotations']]


def test_all_found(upstream):
    response = client.get('/annotations/pdb/1abc')
    assert response.status_code == 200
    assert uniprot_ids(response) == ['P11111', 'P22222']


def test_unknown_uniprot_id_is_skipped(upstream):
    upstream['P22222'] = 404
    response = client.get('/annotations/pdb/1abc')
    assert response.status_code == 200
    assert uniprot_ids(response) == ['P11111']


def test_all_uniprot_ids_unknown(upstream):
    upstream.update({'P11111': 404, 'P22222': 404})
    response = client.get('/annotations/pdb/1abc')
    assert response.status_code == 200
    assert uniprot_ids(response) == []


@pytest.mark.parametrize('status_code', [400, 403, 429, 500, 503])
def test_upstream_failure_is_reported(upstream, status_code):
    upstream['P22222'] = status_code
    response = client.get('/annotations/pdb/1abc')
    assert response.status_code == 502


@pytest.mark.parametrize('status_code, expected', [(404, 404), (429, 502), (503, 502)])
def test_alphafill_upstream_status(upstream, status_code, expected):
    upstream['P11111'] = status_code
    response = client.get('/annotations/alphafill/P11111')
    assert response.status_code == expected


UPSTREAM_STATUSES = [(404, 404), (403, 502), (429, 502), (503, 502)]


@pytest.mark.parametrize('status_code, expected', UPSTREAM_STATUSES)
@pytest.mark.parametrize('service, path', [('pdbe', '/channels/pdb/1abc'),
                                           ('uniprot', '/channels/alphafill/P11111'),
                                           ('sifts', '/annotations/pdb/1abc')])
def test_upstream_status(upstream, service, path, status_code, expected):
    upstream[service] = status_code
    response = client.get(path)
    assert response.status_code == expected


@pytest.mark.parametrize('status_code, expected', UPSTREAM_STATUSES)
def test_assembly_upstream_status(upstream, status_code, expected):
    # Called directly, as the endpoint's PDB ID validation would request the same URL first
    upstream['pdbe'] = status_code
    with pytest.raises(HTTPException) as e:
        get_assembly_id('1abc')
    assert e.value.status_code == expected


def test_assembly(upstream):
    assert get_assembly_id('1abc') == '1'


@pytest.fixture
def summary_requests(upstream, monkeypatch):
    """Count requests for PDBe summaries"""
    count = {'n': 0}
    get = session.get

    def counting_get(url, **kwargs):
        if 'pdbe/api' in url:
            count['n'] += 1
        return get(url, **kwargs)

    monkeypatch.setattr(session, 'get', counting_get)
    return count


def test_summary_is_cached(summary_requests):
    assert client.get('/assembly/1abc').status_code == 200
    assert client.get('/assembly/1abc').status_code == 200
    assert summary_requests['n'] == 1


def test_summary_failure_is_not_cached(upstream, summary_requests):
    upstream['pdbe'] = 429
    assert client.get('/assembly/1abc').status_code == 502
    upstream['pdbe'] = 200
    assert client.get('/assembly/1abc').status_code == 200
    assert summary_requests['n'] == 2


def test_summary_expires(summary_requests, monkeypatch):
    now = 1000 * common.PDBE_SUMMARY_TTL
    monkeypatch.setattr(common.time, 'monotonic', lambda: now)
    get_pdbe_summary('1abc')
    now += common.PDBE_SUMMARY_TTL - 1
    get_pdbe_summary('1abc')
    assert summary_requests['n'] == 1
    now += 1
    get_pdbe_summary('1abc')
    assert summary_requests['n'] == 2
