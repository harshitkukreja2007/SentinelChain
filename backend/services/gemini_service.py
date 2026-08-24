"""
SentinelChain Gemini Reasoning & Grounded Q&A Service
Synthesizes multi-agent orchestrator findings and ChromaDB vector documents
using Google Gemini with explicit source citations.
"""
import os
from pathlib import Path
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

from data.vector_db import search_similar_documents

# Load environment variables from backend/.env
env_path = Path(__file__).resolve().parent.parent / ".env"
load_dotenv(dotenv_path=env_path)


def get_gemini_api_key() -> Optional[str]:
    """Retrieves Gemini API key from environment."""
    return os.getenv("GEMINI_API_KEY")


def get_gemini_model_name() -> str:
    """Retrieves configured Gemini model name from environment, defaulting to free-tier gemini-2.0-flash."""
    return os.getenv("GEMINI_MODEL", "gemini-2.0-flash")


def generate_risk_explanation(
    order: Dict[str, Any],
    orchestrator_result: Dict[str, Any],
    retrieved_documents: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """
    Combines factual order attributes, 4-agent findings, and ChromaDB vector matches,
    then prompts Gemini to produce a plain-language executive explanation with explicit citations.

    Returns:
        Dict matching {"risk_level": str, "explanation": str, "sources": list}
    """
    api_key = get_gemini_api_key()
    risk_level = orchestrator_result.get("riskLevel") or orchestrator_result.get("overall_risk_level", "low")
    
    # 1. Compile Source List
    sources: List[Dict[str, Any]] = []
    
    # Add retrieved ChromaDB documents
    for doc in retrieved_documents:
        sources.append({
            "source_id": doc.get("doc_id", "DOC-VECTOR"),
            "title": doc.get("title", ""),
            "type": "vector_intelligence_document",
            "category": doc.get("category", ""),
            "similarity": doc.get("similarity_score", 0.0),
        })

    # Add active agent findings
    for finding in orchestrator_result.get("findings", []):
        if finding.get("risk_level") in ["high", "medium"]:
            sources.append({
                "source_id": finding.get("agent", "agent"),
                "title": f"{finding.get('type', 'Agent').capitalize()} Risk Assessment Finding",
                "type": "modular_agent_telemetry",
                "confidence": finding.get("confidence", 0.0),
                "matched_doc": finding.get("matched_doc_id"),
            })

    # 2. Build structured context prompt
    agent_findings_text = "\n".join([
        f"- [{f.get('agent', 'agent')}] (Confidence: {int(f.get('confidence', 1.0)*100)}%, Risk: {f.get('risk_level', 'low').upper()}): "
        f"{f.get('summary')} (Mitigation: {f.get('recommendation', 'N/A')})"
        for f in orchestrator_result.get("findings", [])
    ])

    retrieved_docs_text = "\n\n".join([
        f"DOCUMENT ID: {d.get('doc_id')}\n"
        f"TITLE: {d.get('title')}\n"
        f"CATEGORY: {d.get('category')}\n"
        f"RELEVANCE SIMILARITY: {d.get('similarity_score')}\n"
        f"CONTENT: {d.get('content_snippet')}"
        for d in retrieved_documents
    ])

    prompt = f"""You are the SentinelChain Senior Supply Chain Risk Intelligence Officer.
Analyze the following MSME supply chain order, its multi-agent telemetry findings, and retrieved regulatory/disruption documents from the vector database.

Provide a clear, cohesive, plain-language executive explanation of the evaluated risk.
You MUST explicitly cite which source document (e.g. [DOC-WX-2026-08], [DOC-LOG-2026-11], [DOC-GST-2026-04], [DOC-CUST-2026-19], [DOC-SUP-2026-03]) or which agent finding ([supplier_agent], [weather_agent], [policy_agent], [logistics_agent]) each risk factor or fact originated from.

FACTUAL ORDER SPECIFICATION:
- Order ID: {order.get('id', 'N/A')}
- Supplier: {order.get('supplier_name', 'N/A')}
- Location: {order.get('supplier_location', 'N/A')}
- Dispatch Port: {order.get('dispatch_port', 'N/A')}
- Item: {order.get('item', 'N/A')}
- Category: {order.get('category', 'N/A')}
- Order Value: INR {order.get('order_value_inr', 0):,}
- Expected Delivery Date: {order.get('expected_delivery_date', 'N/A')}

ORCHESTRATOR RISK SYNTHESIS:
- Computed Risk Level: {risk_level.upper()}
- Overall Composite Score: {orchestrator_result.get('overall_score', 0)}/100
- Executive Summary: {orchestrator_result.get('executive_summary', 'N/A')}
- Primary Recommendation: {orchestrator_result.get('primary_recommendation', 'N/A')}

MODULAR AGENT FINDINGS:
{agent_findings_text}

RETRIEVED VECTOR DATABASE INTELLIGENCE NOTICES:
{retrieved_docs_text}

OUTPUT INSTRUCTIONS:
1. Start with a direct bottom-line assessment stating the order risk level ({risk_level.upper()}) and primary driver.
2. Provide a 2-3 paragraph breakdown explaining the operational threats, citing specific document IDs [DOC-...] and agent findings [agent_name].
3. Conclude with concrete, prioritized mitigation actions for procurement and logistics teams.
4. Keep the tone professional, dense, and operational (B2B supply chain audience)."""

    # 3. Call Gemini if API Key is configured
    explanation_text = None
    if api_key and api_key.strip():
        model_name = get_gemini_model_name()
        try:
            from google import genai
            client = genai.Client(api_key=api_key.strip())
            response = client.models.generate_content(
                model=model_name,
                contents=prompt,
            )
            if response and response.text:
                explanation_text = response.text.strip()
        except Exception:
            try:
                import google.generativeai as legacy_genai
                legacy_genai.configure(api_key=api_key.strip())
                model = legacy_genai.GenerativeModel(model_name if "1.5" in model_name else "gemini-1.5-flash")
                resp = model.generate_content(prompt)
                if resp and resp.text:
                    explanation_text = resp.text.strip()
            except Exception:
                explanation_text = None

    # 4. Graceful Deterministic Synthesis Fallback if API Key not provided or offline
    if not explanation_text:
        explanation_text = _generate_fallback_explanation(order, orchestrator_result, retrieved_documents, risk_level)

    return {
        "risk_level": risk_level,
        "explanation": explanation_text,
        "sources": sources,
    }


def answer_grounded_question(question: str, n_results: int = 3) -> Dict[str, Any]:
    """
    Answers an operational risk query grounded ONLY in retrieved ChromaDB vector context,
    citing specific source documents.

    Returns:
        Dict matching {"question": str, "answer": str, "sources": list}
    """
    api_key = get_gemini_api_key()
    
    # 1. Retrieve vector context from ChromaDB
    retrieved_docs = search_similar_documents(query_text=question, n_results=n_results)
    
    sources = [
        {
            "source_id": doc.get("doc_id", "DOC-VECTOR"),
            "title": doc.get("title", ""),
            "category": doc.get("category", ""),
            "similarity": doc.get("similarity_score", 0.0),
            "locations": doc.get("affected_locations", []),
            "sectors": doc.get("affected_sectors", []),
        }
        for doc in retrieved_docs
    ]

    # Build Grounding Context
    context_text = "\n\n".join([
        f"SOURCE ID: {d.get('doc_id')}\n"
        f"TITLE: {d.get('title')}\n"
        f"CATEGORY: {d.get('category')}\n"
        f"SEVERITY: {d.get('severity')}\n"
        f"LOCATIONS AFFECTED: {', '.join(d.get('affected_locations', []))}\n"
        f"SECTORS: {', '.join(d.get('affected_sectors', []))}\n"
        f"CONTENT: {d.get('content_snippet')}"
        for d in retrieved_docs
    ])

    grounding_prompt = f"""You are SentinelChain's Grounded Supply Chain Risk Intelligence Assistant.
Answer the user's question strictly grounded ONLY in the retrieved intelligence documents provided below.
Do NOT invent or extrapolate facts beyond what is in the documents.
Always explicitly cite the relevant document ID (e.g. [DOC-LOG-2026-11], [DOC-WX-2026-08], [DOC-GST-2026-04], [DOC-CUST-2026-19], [DOC-SUP-2026-03]) when stating facts.

If the retrieved context does not contain enough information to answer the question, clearly state:
"Based on current indexed vector database intelligence, no active disruption notices cover this specific query."

USER QUESTION:
"{question}"

RETRIEVED VECTOR DATABASE INTELLIGENCE DOCUMENTS:
{context_text}

INSTRUCTIONS:
1. Provide a direct, professional, factual answer grounded in the sources.
2. Explicitly cite document IDs [DOC-...] for every claim or event mentioned.
3. If relevant, summarize the affected industrial locations, logistics bottlenecks, or policy changes.
4. Keep the answer concise and actionable."""

    answer_text = None
    if api_key and api_key.strip():
        model_name = get_gemini_model_name()
        try:
            from google import genai
            client = genai.Client(api_key=api_key.strip())
            response = client.models.generate_content(
                model=model_name,
                contents=grounding_prompt,
            )
            if response and response.text:
                answer_text = response.text.strip()
        except Exception:
            try:
                import google.generativeai as legacy_genai
                legacy_genai.configure(api_key=api_key.strip())
                model = legacy_genai.GenerativeModel(model_name if "1.5" in model_name else "gemini-1.5-flash")
                resp = model.generate_content(grounding_prompt)
                if resp and resp.text:
                    answer_text = resp.text.strip()
            except Exception:
                answer_text = None

    # Fallback deterministic answer synthesis
    if not answer_text:
        if retrieved_docs and retrieved_docs[0].get("similarity_score", 0) > 0.15:
            top_doc = retrieved_docs[0]
            answer_text = (
                f"**Grounded Intelligence Match:**\n"
                f"According to **[{top_doc['doc_id']}]** (*{top_doc['title']}*), active disruption impacts "
                f"{', '.join(top_doc.get('affected_locations', []))} affecting {', '.join(top_doc.get('affected_sectors', []))}.\n\n"
                f"**Details:** {top_doc['content_snippet']}\n\n"
                f"*(Note: Connect `GEMINI_API_KEY` in `backend/.env` for live dynamic natural language synthesis)*"
            )
        else:
            answer_text = "Based on current indexed vector database intelligence, no active disruption notices match this specific query."

    return {
        "question": question,
        "answer": answer_text,
        "sources": sources,
        "count": len(sources),
    }


def _generate_fallback_explanation(
    order: Dict[str, Any],
    orchestrator_result: Dict[str, Any],
    retrieved_documents: List[Dict[str, Any]],
    risk_level: str
) -> str:
    """Produces structured explanation citing sources when Gemini API key is pending."""
    active_threats = [f for f in orchestrator_result.get("findings", []) if f.get("risk_level") in ["high", "medium"]]
    
    paragraphs = []
    
    if risk_level == "high":
        paragraphs.append(
            f"**EXECUTIVE RISK ASSESSMENT: HIGH SEVERITY (Score: {orchestrator_result.get('overall_score', 0)}/100)**\n"
            f"Order {order.get('id')} with supplier {order.get('supplier_name')} ({order.get('supplier_location')}) "
            f"is subject to acute operational disruptions requiring immediate contingency intervention."
        )
    elif risk_level == "medium":
        paragraphs.append(
            f"**EXECUTIVE RISK ASSESSMENT: MEDIUM EXPOSURE (Score: {orchestrator_result.get('overall_score', 0)}/100)**\n"
            f"Order {order.get('id')} with supplier {order.get('supplier_name')} ({order.get('supplier_location')}) "
            f"faces moderate regulatory compliance or capacity deferrals requiring verification."
        )
    else:
        paragraphs.append(
            f"**EXECUTIVE RISK ASSESSMENT: LOW RISK / NO ACTIVE THREATS (Score: {orchestrator_result.get('overall_score', 0)}/100)**\n"
            f"Order {order.get('id')} with supplier {order.get('supplier_name')} ({order.get('supplier_location')}) "
            f"exhibits optimal baseline flow with zero active disruption alerts across transit corridors."
        )

    if active_threats or retrieved_documents:
        body_points = []
        for finding in active_threats:
            doc_cite = f" [Source Document: {finding.get('matched_doc_id')}]" if finding.get('matched_doc_id') else ""
            body_points.append(
                f"- **{finding.get('type', 'risk').capitalize()} Vector** [Source: `{finding.get('agent')}` (Confidence: {int(finding.get('confidence', 0.9)*100)}%){doc_cite}]: "
                f"{finding.get('summary')}"
            )
        
        for doc in retrieved_documents[:2]:
            if doc.get("similarity_score", 0) > 0.25:
                body_points.append(
                    f"- **Regulatory & Intelligence Advisory** [Source: `{doc.get('doc_id')}` - *{doc.get('title')}*]: "
                    f"Vector similarity index of {(doc.get('similarity_score', 0)*100):.1f}% indicates active disruption across {', '.join(doc.get('affected_locations', []))}."
                )

        paragraphs.append("### Key Risk Drivers & Source Evidence:\n" + "\n".join(body_points))

    paragraphs.append(
        f"### Prescribed Operational Mitigation:\n"
        f"- **Primary Action:** {orchestrator_result.get('primary_recommendation')}\n"
        f"- **Procurement Protocol:** Audit supplier milestone telemetry for `{order.get('item')}` before releasing stage payments."
    )

    if not get_gemini_api_key():
        paragraphs.append(
            "\n*(Note: Set `GEMINI_API_KEY` in `backend/.env` to enable live dynamic Gemini 2.5/1.5 Flash LLM reasoning)*"
        )

    return "\n\n".join(paragraphs)
