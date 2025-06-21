from fastapi.testclient import TestClient

from ..app import create_app


def test_existing_tool_example():
    app = create_app()
    client = TestClient(app)
    resp = client.post("/existing-tool-example/execute", json={"text": "hi"})
    assert resp.status_code == 200
    assert resp.json() == {"echoed": "hi"}
