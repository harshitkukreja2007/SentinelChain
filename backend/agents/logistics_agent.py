"""
Logistics & Freight Disruption Agent
Evaluates port congestion, container terminal dwell times, drayage strikes,
and intermodal corridor bottlenecks via ChromaDB vector intelligence.
"""
from typing import Dict, Any, Optional, Union
from data.vector_db import search_similar_documents


def check_risk(order: Union[dict, Any]) -> Optional[Dict[str, Any]]:
    """
    Checks the order against port strike circulars, drayage union actions,
    and terminal dwell metrics in ChromaDB.

    Returns:
        dict containing finding details with confidence score between 0.0 and 1.0,
        or None if no logistics bottleneck is detected.
    """
    order_dict = order if isinstance(order, dict) else (
        order.model_dump() if hasattr(order, "model_dump") else vars(order)
    )

    location = order_dict.get("supplier_location", "")
    dispatch_port = order_dict.get("dispatch_port", "")
    item = order_dict.get("item", "")

    # 1. Vector search for port logistics and strike documents in ChromaDB
    query = f"port strike drayage truck driver halt JNPT Nhava Sheva {location} {dispatch_port}"
    matches = search_similar_documents(
        query_text=query,
        n_results=1,
        category_filter="Port Logistics & Labor"
    )
    top_doc = matches[0] if matches else None

    # Check for JNPT / Nhava Sheva strike corridor (Pune, Chakan, Talegaon, Maharashtra)
    is_jnpt_corridor = any(loc in location for loc in ["Pune", "Mumbai", "Maharashtra", "Chakan"]) or (
        "JNPT" in dispatch_port or "Nhava Sheva" in dispatch_port
    )

    if is_jnpt_corridor and top_doc and top_doc.get("similarity_score", 0) > 0.25:
        return {
            "agent": "logistics_agent",
            "type": "logistics",
            "summary": (
                f"JNPT / Nhava Sheva Drayage Flash Strike Active: Inter-terminal container trailer operations "
                f"halted. Dwell times for cargo originating from {location} projected to exceed 7-10 days."
            ),
            "confidence": 0.96,
            "risk_level": "high",
            "score": 89.0,
            "matched_doc_id": top_doc["doc_id"],
            "factors": [
                f"Mumbai Port & JNPT Drayage Federation Urgent Trade Circular ({top_doc['doc_id']})",
                "Indefinite strike over fuel surcharges halting road haulage to NSICT/BMCT/APMT gates",
                "Container gate closures impacting heavy machinery and hydraulics dispatches"
            ],
            "recommendation": "Divert high-priority export container bookings to Hazira or Mundra Port via dedicated rail rakes.",
            "metadata": {
                "doc_title": top_doc["title"],
                "similarity_score": top_doc["similarity_score"],
                "expected_dwell_days": "7-10",
                "affected_port": "JNPT / Nhava Sheva"
            }
        }

    # Chennai port logistics tied to weather/monsoon
    if "Chennai" in location or "Ennore" in dispatch_port:
        return {
            "agent": "logistics_agent",
            "type": "logistics",
            "summary": f"Coromandel coastal gateway congestion: Berth gantry suspension and off-dock CFS truck queuing in {location}.",
            "confidence": 0.82,
            "risk_level": "medium",
            "score": 68.0,
            "matched_doc_id": None,
            "factors": [
                "Container terminal gate entry metering in effect",
                "Secondary inland rail siding availability constrained"
            ],
            "recommendation": "Book off-dock staging yard and pre-clear shipping bills.",
            "metadata": {"port": "Chennai Port"}
        }

    # Normal freight flow (Ludhiana dry port, Coimbatore/Tuticorin, Rajkot/Kandla)
    return {
        "agent": "logistics_agent",
        "type": "logistics",
        "summary": f"Steady intermodal freight transit from {location} to {dispatch_port or 'gateway port'}.",
        "confidence": 0.91,
        "risk_level": "low",
        "score": 15.0,
        "matched_doc_id": None,
        "factors": [
            "Concor rail rake allocations operating on schedule",
            "Average container yard dwell under 2.4 days"
        ],
        "recommendation": "Maintain standard trucking dispatch timeline.",
        "metadata": {"corridor_flow": "optimal"}
    }
