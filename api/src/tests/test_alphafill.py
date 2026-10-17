from fastapi.testclient import TestClient

from api.main import app


client = TestClient(app)


class TestChannels:
    def test_stored(self, stored_uniprot_ids):
        response = client.get(f'/channels/alphafill/{stored_uniprot_ids}')
        assert response.status_code == 200
        json = response.json()
        assert isinstance(json, dict)
        assert 'Annotations' in json
        assert 'Channels' in json

    def test_non_existent_uniprot_id(self):
        response = client.get('/channels/alphafill/A0A000ZZZ9')
        assert response.status_code == 404

    def test_invalid_uniprot_id(self):
        response = client.get('/channels/alphafill/invalid_uniprot_id')
        assert response.status_code == 422


class TestAnnotations:
    def test_stored(self, stored_uniprot_ids):
        response = client.get(f'/annotations/alphafill/{stored_uniprot_ids}')
        assert response.status_code == 200
        json = response.json()
        assert isinstance(json, dict)
        assert 'EntryAnnotations' in json
        assert 'ResidueAnnotations' in json

    def test_non_existent_uniprot_id(self):
        response = client.get('/annotations/alphafill/A0A000ZZZ9')
        assert response.status_code == 404

    def test_invalid_uniprot_id(self):
        response = client.get('/annotations/alphafill/invalid_uniprot_id')
        assert response.status_code == 422


class TestDownloadPNG:
    def test_stored(self, stored_uniprot_ids):
        response = client.get(f'/download/alphafill/{stored_uniprot_ids}/png')
        if response.status_code == 200:
            assert response.headers['content-type'] == 'image/png'

    def test_non_existent_uniprot_id(self):
        # Now we are unable to find, whether the Uniprot ID is valid or not
        response = client.get('/download/alphafill/A0A000ZZZ9/png')
        assert response.status_code == 404

    def test_invalid_uniprot_id(self):
        # Now we are unable to find, whether the Uniprot ID is valid or not
        response = client.get('/download/alphafill/invalid_uniprot_id/png')
        assert response.status_code == 422
