import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_analyze_endpoint_high_risk():
    print("=== Testing POST /api/analyze for MSME-ORD-101 (Chennai) ===")
    response = client.post("/api/analyze", json={"order_id": "MSME-ORD-101"})
    assert response.status_code == 200, f"Error {response.status_code}: {response.text}"
    data = response.json()

    assert "risk_level" in data, "Missing 'risk_level'"
    assert "explanation" in data, "Missing 'explanation'"
    assert "sources" in data, "Missing 'sources'"
    assert data["risk_level"] in ["high", "medium", "low"]
    assert len(data["sources"]) > 0, "Expected sources list to contain citations"

    print(f"Risk Level : {data['risk_level'].upper()}")
    print(f"Sources ({len(data['sources'])}): {[s['source_id'] for s in data['sources']]}")
    print(f"Explanation Sample:\n{data['explanation'][:250]}...\n")


def test_analyze_endpoint_low_risk():
    print("=== Testing POST /api/analyze for MSME-ORD-105 (Coimbatore) ===")
    response = client.post("/api/analyze", json={"order_id": "MSME-ORD-105"})
    assert response.status_code == 200, f"Error {response.status_code}: {response.text}"
    data = response.json()

    assert data["risk_level"] == "low"
    assert "explanation" in data
    assert "sources" in data
    print(f"Risk Level : {data['risk_level'].upper()}")
    print(f"Explanation Sample:\n{data['explanation'][:200]}...\n")


if __name__ == "__main__":
    test_analyze_endpoint_high_risk()
    test_analyze_endpoint_low_risk()
    print("All POST /api/analyze tests passed successfully!")
