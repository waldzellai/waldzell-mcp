from fastapi.testclient import TestClient

from ..app import create_app


def get_client():
    app = create_app()
    return TestClient(app)


def test_assumption_xray():
    client = get_client()
    resp = client.post(
        "/assumption-xray/execute",
        json={"claim": "A", "context": "B"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert set(data.keys()) == {"assumptions", "confidence", "tests"}


def test_value_of_information():
    client = get_client()
    resp = client.post(
        "/value-of-information/execute",
        json={"decision_options": ["a"], "uncertainties": ["u"], "payoffs": [1.0]},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert set(data.keys()) == {"voi_score", "high_impact_questions"}


def test_drag_point_audit():
    client = get_client()
    resp = client.post(
        "/drag-point-audit/execute",
        json={"log": "..."},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert set(data.keys()) == {"drag_points", "summary_score"}


def test_safe_struggle_designer():
    client = get_client()
    resp = client.post(
        "/safe-struggle-designer/execute",
        json={"skill": "x", "current_level": 1, "target_level": 2},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert set(data.keys()) == {"scaffold_steps", "safety_measures", "review_intervals"}


def test_comparative_advantage():
    client = get_client()
    resp = client.post(
        "/comparative-advantage/execute",
        json={"skills": {"a": 1}, "tasks": {"t1": ["a"]}},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert set(data.keys()) == {"advantage_map"}


def test_analogical_mapper():
    client = get_client()
    resp = client.post(
        "/analogical-mapper/execute",
        json={"problem": "p"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert set(data.keys()) == {"analogies", "suggested_prompts"}


def test_seven_seekers_orchestrator():
    client = get_client()
    resp = client.post(
        "/seven-seekers-orchestrator/execute",
        json={"query": "q"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert set(data.keys()) == {"seeker_results", "resonance_map", "synthesis"}

