from fastapi.testclient import TestClient

from api.main import app


client = TestClient(app)


class TestChannels:
    def test_stored(self, stored_pdb_ids):
        response = client.get(f'/channels/pdb/{stored_pdb_ids}')
        assert response.status_code == 200
        json = response.json()
        assert isinstance(json, dict)
        assert 'Annotations' in json
        assert 'Channels' in json

    def test_invalid_pdbid(self):
        response = client.get('/channels/pdb/some_invalid_pdb_id')
        assert response.status_code == 422


class TestAssembly:
    def test_stored(self, stored_pdb_ids):
        response = client.get(f'/assembly/{stored_pdb_ids}')
        assert response.status_code == 200
        assert str(response.json()).isnumeric()

    def test_invalid_pdbid(self):
        response = client.get('/assembly/some_invalid_pdb_id')
        assert response.status_code == 422


class TestAnnotations:
    def test_stored(self, stored_pdb_ids):
        response = client.get(f'/annotations/pdb/{stored_pdb_ids}')
        assert response.status_code == 200
        json = response.json()
        assert isinstance(json, dict)
        assert 'EntryAnnotations' in json
        assert 'ResidueAnnotations' in json

    def test_invalid_pdbid(self):
        response = client.get('/annotations/pdb/some_invalid_pdb_id')
        assert response.status_code == 422


class TestDownloadPNG:
    def test_stored(self, stored_pdb_ids):
        response = client.get(f'/download/pdb/{stored_pdb_ids}/png', follow_redirects=False)
        assert response.status_code in (200, 307)
        if response.status_code == 200:
            assert response.headers['content-type'] == 'image/png'

    def test_invalid_pdbid(self):
        response = client.get('/download/pdb/some_invalid_pdb_id/png')
        assert response.status_code == 422
