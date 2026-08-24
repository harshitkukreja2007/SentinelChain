"""
SentinelChain Multi-Agent Risk Orchestrator
Coordinates and executes all 4 domain risk agents (supplier, weather, policy, logistics),
synthesizes findings, and computes an overall riskLevel assessment dynamically based on live vector DB events.
"""
from datetime import datetime, timezone
from typing import Dict, Any, List, Union

from agents import supplier_agent, weather_agent, policy_agent, logistics_agent


AGENTS = [
    ("supplier_agent", supplier_agent),
    ("weather_agent", weather_agent),
    ("policy_agent", policy_agent),
    ("logistics_agent", logistics_agent),
]


def run_all_agents(order: Union[dict, Any]) -> Dict[str, Any]:
    """
    Executes all 4 specialized risk agents against a given MSME order,
    collects non-None findings, and computes a dynamic risk assessment.
    
    Risk level is NEVER hardcoded — it is computed live based on current risk events in the vector DB.
    If no matching risk event exists, the default state is 'low' / 'no active risk'.

    Args:
        order: Dictionary or Pydantic model representing factual order attributes.

    Returns:
        Dict containing:
            - order_id: str
            - supplier_name: str
            - supplier_location: str
            - item: str
            - riskLevel: "high" | "medium" | "low" (computed dynamically)
            - overall_risk_level: "high" | "medium" | "low"
            - risk_status: "High Threat" | "Elevated Exposure" | "No Active Risk"
            - overall_score: float (0.0 to 100.0)
            - findings: list of finding objects (with type, summary, confidence 0-1)
            - executive_summary: str
            - primary_recommendation: str
            - evaluated_at: ISO 8601 timestamp
    """
    order_dict = order if isinstance(order, dict) else (
        order.model_dump() if hasattr(order, "model_dump") else vars(order)
    )

    order_id = order_dict.get("id") or order_dict.get("order_id", "UNKNOWN-ORD")
    supplier_name = order_dict.get("supplier_name", "Unknown Supplier")
    location = order_dict.get("supplier_location", "Unknown Location")
    item = order_dict.get("item") or order_dict.get("item_category", "Goods")
    category = order_dict.get("category") or order_dict.get("sector", "")

    findings: List[Dict[str, Any]] = []

    # 1. Execute all 4 agents against the factual order data
    for agent_name, agent_module in AGENTS:
        try:
            finding = agent_module.check_risk(order_dict)
            if finding is not None:
                # Ensure confidence is clamped between 0.0 and 1.0
                if "confidence" in finding:
                    finding["confidence"] = max(0.0, min(1.0, float(finding["confidence"])))
                findings.append(finding)
        except Exception as e:
            findings.append({
                "agent": agent_name,
                "type": agent_name.replace("_agent", ""),
                "summary": f"Agent error during evaluation: {str(e)}",
                "confidence": 0.50,
                "risk_level": "medium",
                "score": 50.0,
                "factors": [f"Evaluation exception: {str(e)}"],
                "recommendation": "Perform manual review."
            })

    # Filter critical / notable risk alerts (medium or high)
    active_threats = [f for f in findings if f.get("risk_level") in ["high", "medium"]]

    # 2. Dynamically compute composite score and risk level
    if active_threats:
        # Confidence-weighted peak score calculation
        max_score = max(f.get("score", 0.0) for f in active_threats)
        avg_score = sum(f.get("score", 0.0) * f.get("confidence", 1.0) for f in active_threats) / len(active_threats)
        
        # 65% peak threat severity + 35% average ambient exposure
        overall_score = round((max_score * 0.65) + (avg_score * 0.35), 1)
        
        high_count = sum(1 for f in active_threats if f.get("risk_level") == "high")
        med_count = sum(1 for f in active_threats if f.get("risk_level") == "medium")

        if high_count > 0 or overall_score >= 70.0:
            overall_risk_level = "high"
            risk_status = "High Threat"
        elif med_count > 0 or overall_score >= 38.0:
            overall_risk_level = "medium"
            risk_status = "Elevated Exposure"
        else:
            overall_risk_level = "low"
            risk_status = "No Active Risk"

        summaries = [f"[{f.get('type', 'risk').upper()}] {f.get('summary')}" for f in active_threats]
        executive_summary = " | ".join(summaries)
        top_finding = max(active_threats, key=lambda x: x.get("score", 0))
        primary_recommendation = top_finding.get("recommendation", "Review dispatch schedule.")
    else:
        # No matching risk event exists — clean default state 'low' / 'no active risk'
        overall_score = 10.0
        overall_risk_level = "low"
        risk_status = "No Active Risk"
        executive_summary = f"No active risk events or corridor bottlenecks detected for {supplier_name} in {location}."
        primary_recommendation = "Maintain standard automated procurement and dispatch pipeline."

    return {
        "order_id": order_id,
        "supplier_name": supplier_name,
        "supplier_location": location,
        "item": item,
        "category": category,
        "riskLevel": overall_risk_level,
        "overall_risk_level": overall_risk_level,
        "risk_status": risk_status,
        "overall_score": overall_score,
        "findings_count": len(findings),
        "critical_findings_count": len(active_threats),
        "findings": findings,
        "executive_summary": executive_summary,
        "primary_recommendation": primary_recommendation,
        "evaluated_at": datetime.now(timezone.utc).isoformat(),
    }


def evaluate_order(order: Union[dict, Any]) -> Dict[str, Any]:
    """Alias for run_all_agents."""
    return run_all_agents(order)
