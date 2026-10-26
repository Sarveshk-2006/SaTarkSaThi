import pytest
from fastapi.testclient import TestClient
from backend.app.main import app

client = TestClient(app)

def test_api_health_endpoint():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] in ["online", "degraded"]
    assert data["database"] == "healthy"
    assert "version" in data
    assert data["analysis_provider"] in ["rule_based", "watsonx"]

def test_root_endpoint():
    # 1. Strict API contract: clients requesting JSON must always receive structured welcome JSON
    json_resp = client.get("/", headers={"Accept": "application/json"})
    assert json_resp.status_code == 200
    assert "application/json" in json_resp.headers.get("content-type", "")
    json_data = json_resp.json()
    assert "Satark Saathi" in json_data["message"]
    assert json_data["docs_url"] == "/docs"
    assert json_data["health_url"] == "/api/health"

    # 2. Browser request contract: serves SPA index.html when dist exists, or fallback JSON
    browser_resp = client.get("/")
    assert browser_resp.status_code == 200
    ct = browser_resp.headers.get("content-type", "")
    if "text/html" in ct:
        assert b"<!doctype html" in browser_resp.content.lower()
    else:
        assert "application/json" in ct
        assert "Satark Saathi" in browser_resp.json()["message"]
