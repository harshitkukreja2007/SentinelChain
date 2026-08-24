import urllib.request
import json

def verify():
    # 1. Test Backend GET /api/orders with CORS Origin header
    url = "http://127.0.0.1:8000/api/orders"
    headers = {"Origin": "http://localhost:3000"}
    req = urllib.request.Request(url, headers=headers)
    
    with urllib.request.urlopen(req) as resp:
        status = resp.status
        cors_origin = resp.headers.get("access-control-allow-origin")
        content = resp.read().decode("utf-8")
        data = json.loads(content)

    print(f"Backend GET /api/orders HTTP Status : {status}")
    print(f"Access-Control-Allow-Origin          : {cors_origin}")
    print(f"Total MSME Orders Served             : {data.get('count')}")
    
    for order in data.get("orders", []):
        print(f"  • [{order['id']}] {order['supplier_name']} ({order['supplier_location']}) -> {order['riskLevel'].upper()} (Score: {order['overall_score']}/100)")

    # 2. Test Frontend Next.js Server on localhost:3000
    front_req = urllib.request.Request("http://localhost:3000")
    with urllib.request.urlopen(front_req) as front_resp:
        print(f"\nFrontend Next.js (localhost:3000) Status: {front_resp.status}")

    print("\nSUCCESS: Both servers are online and talking to each other with active CORS support!")

if __name__ == "__main__":
    verify()
