import gzip

import pytest
import requests
from fastapi.testclient import TestClient

from api.common import session
from api.main import app


client = TestClient(app)

SIFTS = ('<entry xmlns="http://www.ebi.ac.uk/pdbe/docs/sifts/eFamily.xsd">'
         '<entity entityId="A"><segment><listResidue><residue>'
         '<crossRefDb dbCoordSys="UniProt" dbAccessionId="P11111" dbResNum="1"/><crossRefDb dbCoordSys="PDBresnum" dbResNum="1"/>'
         '</residue></listResidue></segment></entity>'
         '<entity entityId="B"><segment><listResidue><residue>'
         '<crossRefDb dbCoordSys="UniProt" dbAccessionId="P22222" dbResNum="1"/><crossRefDb dbCoordSys="PDBresnum" dbResNum="1"/>'
         '</residue></listResidue></segment></entity></entry>')

UNIPROT = '<uniprot xmlns="https://uniprot.org/uniprot"><entry><protein><recommendedName><fullName>Protein</fullName></recommendedName></protein></entry></uniprot>'


def response(status_code: int, content: bytes = b'') -> requests.Response:
    r = requests.Response()
    r.status_code = status_code
    r._content = content
    r.url = 'https://upstream.example'
    return r


@pytest.fixture
def upstream(monkeypatch):
    """Mock the external APIs, the EBI Proteins API returns given status codes for given UniProt IDs"""
    statuses: dict[str, int] = {}

    def get(url, **kwargs):
        if 'sifts' in url:
            return response(200, gzip.compress(SIFTS.encode()))
        if 'proteins/api' in url:
            status = statuses.get(url.rsplit('/', 1)[-1], 200)
            return response(status, UNIPROT.encode() if status == 200 else b'')
        return response(200)

    monkeypatch.setattr(session, 'get', get)
    monkeypatch.setattr(session, 'head', lambda url, **kwargs: response(200))
    return statuses


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
