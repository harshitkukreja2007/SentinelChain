import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(backend_dir))

from agents import supplier_agent, weather_agent, policy_agent, logistics_agent, orchestrator
from data.mock_orders import MOCK_ORDERS
from data.vector_db import initialize_and_load_vector_db

def test_agents_and_orchestrator():
    print("=== 1. Initializing ChromaDB for Agent Context ===")
    initialize_and_load_vector_db()

    print("\n=== 2. Testing Individual Agent Contracts ===")
    agents = [
        ("supplier_agent", supplier_agent, "supplier"),
        ("weather_agent", weather_agent, "weather"),
        ("policy_agent", policy_agent, "policy"),
        ("logistics_agent", logistics_agent, "logistics"),
    ]

    for order in MOCK_ORDERS:
        print(f"\nEvaluating Order: {order['id']} ({order['supplier_name']} - {order['supplier_location']})")
        for agent_name, agent_mod, expected_type in agents:
            assert hasattr(agent_mod, "check_risk"), f"{agent_name} missing check_risk function"
            finding = agent_mod.check_risk(order)

            if finding is not None:
                assert "type" in finding, f"{agent_name} finding missing 'type'"
                assert "summary" in finding, f"{agent_name} finding missing 'summary'"
                assert "confidence" in finding, f"{agent_name} finding missing 'confidence'"
                assert 0.0 <= finding["confidence"] <= 1.0, f"Confidence {finding['confidence']} outside [0, 1]"
                print(f"  [FINDING] {agent_name:<16} | Type: {finding['type']:<10} | Conf: {finding['confidence']:.2f} | Risk: {finding.get('risk_level', 'N/A'):<6} | {finding['summary'][:60]}...")
            else:
                print(f"  [NONE   ] {agent_name:<16} | No risk detected.")

    print("\n=== 3. Testing Orchestrator Multi-Agent Assessment ===")
    for order in MOCK_ORDERS:
        assessment = orchestrator.run_all_agents(order)
        
        assert "order_id" in assessment
        assert "riskLevel" in assessment
        assert assessment["riskLevel"] in ["high", "medium", "low"]
        assert "overall_score" in assessment
        assert 0.0 <= assessment["overall_score"] <= 100.0
        assert "findings" in assessment
        assert isinstance(assessment["findings"], list)
        assert "executive_summary" in assessment
        assert "primary_recommendation" in assessment

        print(f"\n[ORCHESTRATOR RESULT] Order {assessment['order_id']}")
        print(f"  Supplier : {assessment['supplier_name']} ({assessment['supplier_location']})")
        print(f"  RiskLevel: {assessment['riskLevel'].upper()} (Score: {assessment['overall_score']}/100)")
        print(f"  Findings : {len(assessment['findings'])} findings ({assessment['critical_findings_count']} critical/medium)")
        print(f"  Action   : {assessment['primary_recommendation']}")

    print("\nAll 4 agents and Orchestrator tests passed successfully!")

if __name__ == "__main__":
    test_agents_and_orchestrator()
