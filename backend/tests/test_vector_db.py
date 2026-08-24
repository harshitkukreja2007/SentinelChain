import sys
from pathlib import Path

# Add backend root to path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from data.vector_db import initialize_and_load_vector_db, search_similar_documents, query_disruptions_for_order
from data.mock_orders import MOCK_ORDERS
from data.mock_documents import MOCK_DOCUMENTS

def test_vector_database():
    print("--- 1. Testing Vector DB Loading ---")
    load_result = initialize_and_load_vector_db(force_reload=True)
    print("Load Result:", load_result)
    assert load_result["document_count"] == len(MOCK_DOCUMENTS)
    assert load_result["document_count"] == 5

    print("\n--- 2. Testing Similarity Queries for all 5 Disruption Types ---")
    test_cases = [
        ("cyclone heavy rain alert Chennai port suspended", "DOC-WX-2026-08"),
        ("GST rate change on synthetic textiles in Surat", "DOC-GST-2026-04"),
        ("JNPT port truck drivers flash strike Nhava Sheva", "DOC-LOG-2026-11"),
        ("BIS quality control certification for Ludhiana fasteners", "DOC-CUST-2026-19"),
        ("Pig iron blast furnace overhaul in Rajkot foundries", "DOC-SUP-2026-03"),
    ]

    for query, expected_id in test_cases:
        results = search_similar_documents(query, n_results=1)
        assert len(results) > 0
        top = results[0]
        print(f"Query: '{query[:35]}...' -> Matched: [{top['doc_id']}] {top['title'][:40]}... (Dist: {top['distance']})")
        assert top["doc_id"] == expected_id, f"Expected {expected_id} but got {top['doc_id']}"

    print("\n--- 3. Testing Order-to-Document Disruption Mapping ---")
    for order in MOCK_ORDERS:
        matches = query_disruptions_for_order(order, n_results=1)
        assert len(matches) > 0
        print(f"Order: {order['id']} ({order['supplier_name']} - {order['supplier_location']}) -> Matched Doc: [{matches[0]['doc_id']}] {matches[0]['title'][:40]}...")

    print("\nAll Vector DB tests passed successfully!")

if __name__ == "__main__":
    test_vector_database()
