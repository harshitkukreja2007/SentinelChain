import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_feed_endpoint():
    print("=== Testing POST /api/feed/next-event ===")
    for i in range(3):
        res = client.post("/api/feed/next-event")
        assert res.status_code == 200, f"Failed: {res.text}"
        data = res.json()
        assert "event" in data
        assert "impacted_order_ids" in data
        assert "all_orders" in data
        assert "toast_message" in data
        print(f"Cycle {i+1}:")
        print(f"  Event: [{data['event']['id']}] {data['event']['title']}")
        print(f"  Impacted Orders: {data['impacted_order_ids']}")
        safe_toast = data['toast_message'].encode('ascii', 'replace').decode('ascii')
        print(f"  Toast Alert: {safe_toast}\n")

    print("All live feed endpoint tests passed!")

if __name__ == "__main__":
    test_feed_endpoint()
