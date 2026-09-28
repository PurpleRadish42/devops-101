"""Fast tests that need no Postgres or Redis (the lifespan/startup does not run here)."""

from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_guestbook_rejects_long_name():
    # Validation happens before the database is touched, so this needs no DB.
    response = client.post("/api/guestbook", json={"name": "x" * 41, "message": "hi"})
    assert response.status_code == 422
