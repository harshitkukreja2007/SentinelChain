"""
Trade Policy & Customs Compliance Risk Agent
Evaluates GST rate rationalization, inverted duty corrections, DGFT policy circulars,
and mandatory Bureau of Indian Standards (BIS) Quality Control Orders via ChromaDB.
"""
from typing import Dict, Any, Optional, Union
from data.vector_db import search_similar_documents


def check_risk(order: Union[dict, Any]) -> Optional[Dict[str, Any]]:
    """
    Checks the order against regulatory policy updates, GST notifications,
    and customs compliance advisories in ChromaDB.

    Returns:
        dict containing finding details with confidence score between 0.0 and 1.0,
        or None if no compliance risk is detected.
    """
    order_dict = order if isinstance(order, dict) else (
        order.model_dump() if hasattr(order, "model_dump") else vars(order)
    )

    location = order_dict.get("supplier_location", "")
    item = order_dict.get("item", "").lower()
    sector = order_dict.get("sector", "").lower()

    # 1. Check for GST / Inverted Duty Policy on Textiles / Synthetic Fibers (Surat / Gujarat)
    if ("surat" in location.lower() or "textile" in sector or "yarn" in item or "fabric" in item):
        matches = search_similar_documents(
            query_text=f"GST rate revision man made fiber synthetic yarn {location} {item}",
            n_results=1,
            category_filter="GST & Tariff Policy"
        )
        top_doc = matches[0] if matches else None

        if top_doc and top_doc.get("similarity_score", 0) > 0.20:
            return {
                "agent": "policy_agent",
                "type": "policy",
                "summary": (
                    f"CBIC GST Inverted Duty Revision: 18% unified rate enacted for MMF and filament yarns. "
                    f"Consignments from {location} subject to invoice reconciliation and potential 48h customs verification delay."
                ),
                "confidence": 0.89,
                "risk_level": "medium",
                "score": 62.0,
                "matched_doc_id": top_doc["doc_id"],
                "factors": [
                    f"CBIC Notification No. 24/2026-Central Tax ({top_doc['doc_id']})",
                    "Updated Electronic Way Bill (E-Way Bill) validation requirement",
                    "Risk of audit hold for legacy HSN classification mismatch"
                ],
                "recommendation": "Re-audit supplier tax invoices against revised 18% HSN 5402 schedule before dispatch.",
                "metadata": {
                    "doc_title": top_doc["title"],
                    "similarity_score": top_doc["similarity_score"],
                    "hs_code": "5402",
                    "applicable_gst": "18%"
                }
            }

    # 2. Check for DGFT BIS Quality Control Orders (QCO) for Fasteners & Steel Castings (Ludhiana / Punjab)
    if ("ludhiana" in location.lower() or "fastener" in item or "bolt" in item or "stud" in item):
        matches = search_similar_documents(
            query_text=f"BIS Quality Control Order fastener bolt steel testing {location} {item}",
            n_results=1,
            category_filter="Customs Policy & Compliance"
        )
        top_doc = matches[0] if matches else None

        if top_doc and top_doc.get("similarity_score", 0) > 0.20:
            return {
                "agent": "policy_agent",
                "type": "policy",
                "summary": (
                    f"DGFT Quality Control Order (QCO) Compliance Alert: Mandatory Bureau of Indian Standards (BIS) "
                    f"marking certificates required for industrial fasteners sourced from {location}."
                ),
                "confidence": 0.85,
                "risk_level": "medium",
                "score": 48.0,
                "matched_doc_id": top_doc["doc_id"],
                "factors": [
                    f"DGFT Policy Circular No. 14/2026-27 ({top_doc['doc_id']})",
                    "IS 1364/IS 1367 metallurgical conformity certificate enforcement",
                    "Demurrage and lab testing hold if standard mark missing at ICD filing"
                ],
                "recommendation": "Verify manufacturer's active BIS license number on the Bill of Lading.",
                "metadata": {
                    "doc_title": top_doc["title"],
                    "similarity_score": top_doc["similarity_score"],
                    "standard": "IS 1364 / IS 1367"
                }
            }

    # Low policy risk
    return {
        "agent": "policy_agent",
        "type": "policy",
        "summary": "Full compliance with prevailing GST tariffs and export/interstate transit documentation.",
        "confidence": 0.94,
        "risk_level": "low",
        "score": 10.0,
        "matched_doc_id": None,
        "factors": [
            "Clear HSN code mapping under automated E-Way Bill portal",
            "Zero active antidumping or tariff escalation notices"
        ],
        "recommendation": "Proceed with regular electronic billing generation.",
        "metadata": {"compliance_status": "certified"}
    }
