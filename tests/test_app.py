import os
import pytest
from autocam import create_app


@pytest.fixture()
def app(monkeypatch):
    # Use mongomock by pointing to a fake uri
    monkeypatch.setenv("MONGO_URI", "mongomock://localhost")
    monkeypatch.setenv("SECRET_KEY", "test")
    monkeypatch.setenv("ADMIN_EMAILS", "admin@example.com")
    app = create_app({
        "TESTING": True,
    })
    yield app


@pytest.fixture()
def client(app):
    return app.test_client()


def test_health(client):
    rv = client.get("/healthz")
    assert rv.status_code == 200


def test_requires_login_redirect(client):
    rv = client.get("/dashboard", follow_redirects=False)
    assert rv.status_code in (301, 302) 