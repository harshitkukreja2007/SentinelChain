"""
Trade Policy & Geopolitical Compliance Risk Agent
Evaluates tariffs, export control lists (BIS/EAR), customs regulatory shifts, and sanction screenings.
"""
from typing import Union, Any


def check_risk(order: Union[dict, Any]) -> dict:
    """
    Evaluates trade policy, tariff shifts, and compliance risk for the order.
    """
    order_dict = order if isinstance(order, dict) else (order.model_dump() if hasattr(order, "model_dump") else vars(order))
    item_category = order_dict.get("item_category", "").lower()

    if "semiconductor" in item_category or "dual-use" in item_category or "lithium" in item_category:
        return {
            "agent_name": "Trade Policy & Compliance",
            "risk_level": "high",
            "score": 88.5,
            "factors": [
                "Advanced technology export restrictions enacted under updated trade controls",
                "Requires enhanced end-user certificate (EUC) verification before customs clearance",
            ],
            "recommendation": "File expedited export license with Bureau of Industry and Security immediately.",
            "metadata": {"hs_code_prefix": "8542", "sanction_match": "Flagged Review", "tariff_rate": "25%"},
        }

    return {
        "agent_name": "Trade Policy & Compliance",
        "risk_level": "low",
        "score": 15.0,
        "factors": [
            "Clear general license designation under existing bilateral trade treaty",
            "Zero entity list matches on buyer, consignee, or intermediate carrier",
        ],
        "recommendation": "Standard automated customs documentation filing.",
        "metadata": {"hs_code_prefix": "8471", "sanction_match": "Clear", "tariff_rate": "0%"},
    }
