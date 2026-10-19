from fastapi.testclient import TestClient

from api.config import config
from api.main import app


client = TestClient(app)


def test_statistics():
    response = client.get('/statistics')
    assert response.status_code == 200


def test_content():
    response = client.get('/content')
    assert response.status_code == 200


def test_cors():
    origin = {'Origin': 'https://example.org'}
    assert client.get('/statistics', headers=origin).headers['access-control-allow-origin'] == '*'
    assert client.get('/nonexistent', headers=origin).headers['access-control-allow-origin'] == '*'
    preflight = client.options('/statistics', headers=origin | {'Access-Control-Request-Method': 'GET',
                                                                'Access-Control-Request-Headers': 'Content-Type'})
    assert preflight.status_code == 200
    assert preflight.headers['access-control-allow-origin'] == '*'
    assert 'GET' in preflight.headers['access-control-allow-methods']


def test_cors_on_server_errors(monkeypatch):
    # The statistics cannot be read, an unhandled exception
    monkeypatch.setitem(config['dirs'], 'base', '/nonexistent')
    response = TestClient(app, raise_server_exceptions=False).get('/statistics', headers={'Origin': 'https://example.org'})
    assert response.status_code == 500
    assert response.headers['access-control-allow-origin'] == '*'
