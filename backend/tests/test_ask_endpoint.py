import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_ask_endpoint():
    print("=== 1. Testing Question about Port Strike ===")
    res1 = client.post("/api/ask", json={"question": "Are there any port strikes affecting JNPT or Nhava Sheva?"})
    assert res1.status_code == 200, f"Failed: {res1.text}"
    data1 = res1.json()
    assert "answer" in data1
    assert "sources" in data1
    assert any("DOC-LOG" in s["source_id"] for s in data1["sources"])
    print(f"Question: {data1['question']}")
    print(f"Sources : {[s['source_id'] for s in data1['sources']]}")
    print(f"Answer  :\n{data1['answer'][:200]}...\n")

    print("=== 2. Testing Question about Cyclone Weather Alert ===")
    res2 = client.post("/api/ask", json={"question": "What is the cyclone alert status in Chennai port?"})
    assert res2.status_code == 200
    data2 = res2.json()
    assert any("DOC-WX" in s["source_id"] for s in data2["sources"])
    print(f"Question: {data2['question']}")
    print(f"Sources : {[s['source_id'] for s in data2['sources']]}")
    print(f"Answer  :\n{data2['answer'][:200]}...\n")

    print("All POST /api/ask tests passed successfully!")

if __name__ == "__main__":
    test_ask_endpoint()
