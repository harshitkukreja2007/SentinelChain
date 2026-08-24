"""
SentinelChain Backend Application
Supply chain risk intelligence platform powered by ChromaDB vector search,
modular multi-agent orchestration, and Google Gemini reasoning.
"""
import sys
from pathlib import Path
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

# Ensure root backend directory is on sys.path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from agents import supplier_agent, weather_agent, policy_agent, logistics_agent, orchestrator
from data.mock_orders import MOCK_ORDERS, get_all_orders, get_order_by_id
from data.mock_documents import MOCK_DOCUMENTS, get_all_documents, get_document_by_id
from data.vector_db import (
    initialize_and_load_vector_db,
    search_similar_documents,
    query_disruptions_for_order,
)
from services.gemini_service import generate_risk_explanation, get_gemini_api_key

# Registry of specialized agents
AGENT_REGISTRY = {
    "supplier": supplier_agent,
    "weather": weather_agent,
    "policy": policy_agent,
    "logistics": logistics_agent,
    "supplier_agent": supplier_agent,
    "weather_agent": weather_agent,
    "policy_agent": policy_agent,
    "logistics_agent": logistics_agent,
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize and load ChromaDB vector store on startup
    initialize_and_load_vector_db(force_reload=False)
    yield


app = FastAPI(
    title="SentinelChain API",
    description="Supply chain risk intelligence with multi-agent orchestration and Gemini reasoning",
    version="0.1.0",
    lifespan=lifespan,
)

# Enable CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class HealthResponse(BaseModel):
    status: str = Field(default="healthy", description="Current health status of the API")
    timestamp: str = Field(description="ISO 8601 timestamp of the health check")
    version: str = Field(default="0.1.0", description="API version")
    service: str = Field(default="SentinelChain Backend", description="Service name")
    vector_db_documents: int = Field(default=5, description="Count of indexed vector documents")
    gemini_configured: bool = Field(default=False, description="Whether GEMINI_API_KEY is configured")


class SearchQueryRequest(BaseModel):
    query: str = Field(..., description="Semantic search query string")
    n_results: int = Field(default=3, ge=1, le=10, description="Max documents to return")
    category: Optional[str] = Field(default=None, description="Optional category filter")


class AnalyzeOrderRequest(BaseModel):
    order_id: Optional[str] = Field(default=None, description="MSME Order ID to analyze (e.g. MSME-ORD-101)")
    id: Optional[str] = Field(default=None, description="Alias for order_id")
    order: Optional[Dict[str, Any]] = Field(default=None, description="Optional full factual order payload")


class SourceCitation(BaseModel):
    source_id: str
    title: str
    type: str
    category: Optional[str] = None
    similarity: Optional[float] = None
    confidence: Optional[float] = None
    matched_doc: Optional[str] = None


class AnalyzeResponse(BaseModel):
    risk_level: str = Field(..., description="Computed overall risk level: high | medium | low")
    explanation: str = Field(..., description="Plain-language explanation citing evidence and sources")
    sources: List[Dict[str, Any]] = Field(default_factory=list, description="Referenced intelligence sources")


# ==========================================
# General & Health Endpoints
# ==========================================
@app.get("/", tags=["General"])
def read_root():
    return {
        "message": "Welcome to SentinelChain API",
        "docs_url": "/docs",
        "health_check": "/health",
        "gemini_configured": bool(get_gemini_api_key()),
        "endpoints": [
            "/api/orders",
            "/api/documents",
            "/api/documents/search",
            "/api/risk/evaluate",
            "/api/risk/evaluate/{order_id}",
            "/api/analyze",
        ],
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
def health_check():
    doc_count = len(MOCK_DOCUMENTS)
    return HealthResponse(
        status="healthy",
        timestamp=datetime.now(timezone.utc).isoformat(),
        version="0.1.0",
        service="SentinelChain Backend",
        vector_db_documents=doc_count,
        gemini_configured=bool(get_gemini_api_key()),
    )


# ==========================================
# Gemini Reasoning Endpoint: POST /api/analyze
# ==========================================
@app.post("/api/analyze", response_model=AnalyzeResponse, tags=["Gemini Analysis"])
def analyze_order(payload: AnalyzeOrderRequest):
    """
    Takes an order ID, executes the multi-agent orchestrator, performs vector similarity search
    against ChromaDB for related documents, and prompts Gemini to produce a plain-language
    explanation citing specific sources.
    
    Returns JSON:
        - risk_level: "high" | "medium" | "low"
        - explanation: Plain-language summary with citations
        - sources: List of source documents and agent findings
    """
    target_id = payload.order_id or payload.id
    order_data = None

    if target_id:
        order_data = get_order_by_id(target_id)
        if not order_data and not payload.order:
            raise HTTPException(status_code=404, detail=f"Order '{target_id}' not found in MSME dataset.")

    if not order_data:
        if payload.order:
            order_data = payload.order
        else:
            raise HTTPException(status_code=400, detail="Must provide 'order_id' or full 'order' object.")

    # 1. Run through Multi-Agent Orchestrator
    orchestrator_assessment = orchestrator.run_all_agents(order_data)

    # 2. Similarity search against Vector DB
    retrieved_documents = query_disruptions_for_order(order_data, n_results=3)

    # 3. Call Gemini Reasoning Service
    result = generate_risk_explanation(
        order=order_data,
        orchestrator_result=orchestrator_assessment,
        retrieved_documents=retrieved_documents,
    )

    return AnalyzeResponse(**result)


# ==========================================
# MSME Orders Endpoints (Factual Data + Live Dynamic Assessment)
# ==========================================
@app.get("/api/orders", tags=["Orders"])
def list_orders(include_live_risk: bool = Query(True, description="Compute live risk level via orchestrator")):
    """
    Returns all 6 realistic Indian MSME supply orders.
    When include_live_risk is True, evaluates live orchestrator assessments dynamically.
    """
    raw_orders = get_all_orders()
    if not include_live_risk:
        return {"orders": raw_orders, "count": len(raw_orders)}

    enriched_orders = []
    for order in raw_orders:
        assessment = orchestrator.run_all_agents(order)
        enriched_orders.append({
            **order,
            "riskLevel": assessment["riskLevel"],
            "overall_score": assessment["overall_score"],
            "critical_findings_count": assessment["critical_findings_count"],
            "executive_summary": assessment["executive_summary"],
            "primary_recommendation": assessment["primary_recommendation"],
        })

    return {"orders": enriched_orders, "count": len(enriched_orders)}


@app.get("/api/orders/{order_id}", tags=["Orders"])
def get_order(order_id: str):
    """Fetches a specific factual MSME order by ID."""
    order = get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail=f"Order '{order_id}' not found.")
    return order


@app.get("/api/orders/{order_id}/disruptions", tags=["Orders"])
def get_order_disruptions(order_id: str, n_results: int = Query(2, ge=1, le=5)):
    """
    Performs ChromaDB vector similarity search to find matching disruption notices for an order.
    """
    order = get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail=f"Order '{order_id}' not found.")
    disruptions = query_disruptions_for_order(order, n_results=n_results)
    return {
        "order_id": order_id,
        "supplier_location": order["supplier_location"],
        "item": order["item"],
        "matched_disruptions": disruptions,
    }


# ==========================================
# ChromaDB Vector Search Endpoints
# ==========================================
@app.get("/api/documents", tags=["Vector Intelligence"])
def list_documents():
    """Returns all indexed supply chain intelligence documents."""
    return {"documents": get_all_documents(), "count": len(MOCK_DOCUMENTS)}


@app.post("/api/documents/search", tags=["Vector Intelligence"])
def search_documents(payload: SearchQueryRequest):
    """
    Performs local vector similarity search against the ChromaDB collection.
    """
    results = search_similar_documents(
        query_text=payload.query,
        n_results=payload.n_results,
        category_filter=payload.category,
    )
    return {"query": payload.query, "results": results, "count": len(results)}


@app.post("/api/vector-db/reload", tags=["Vector Intelligence"])
def reload_vector_db():
    """Forces reloading of all mock documents into ChromaDB."""
    result = initialize_and_load_vector_db(force_reload=True)
    return {"message": "ChromaDB reloaded successfully", "details": result}


# ==========================================
# Multi-Agent Risk Assessment & Orchestration
# ==========================================
@app.get("/api/agents", tags=["Agents"])
def list_agents():
    """Lists all available risk checking agents."""
    return {"agents": ["supplier_agent", "weather_agent", "policy_agent", "logistics_agent"]}


@app.post("/api/risk/evaluate", tags=["Risk Assessment"])
def evaluate_order_risk(order: Dict[str, Any]):
    """
    Runs all 4 specialized agents (supplier, weather, policy, logistics) via the orchestrator,
    collects findings with confidence scores, and returns a dynamically computed combined risk assessment.
    """
    assessment = orchestrator.run_all_agents(order)
    return assessment


@app.get("/api/risk/evaluate/{order_id}", tags=["Risk Assessment"])
def evaluate_order_by_id(order_id: str):
    """
    Evaluates a specific MSME order by ID through the multi-agent orchestrator.
    """
    order = get_order_by_id(order_id)
    if not order:
        raise HTTPException(status_code=404, detail=f"Order '{order_id}' not found.")
    return orchestrator.run_all_agents(order)


@app.post("/api/risk/evaluate/single/{agent_name}", tags=["Risk Assessment"])
def evaluate_single_agent(agent_name: str, order: Dict[str, Any]):
    """
    Evaluates an order with a specific individual agent.
    """
    clean_name = agent_name.lower().replace("_agent", "")
    if clean_name not in AGENT_REGISTRY:
        raise HTTPException(
            status_code=404,
            detail=f"Agent '{agent_name}' not found. Available: ['supplier_agent', 'weather_agent', 'policy_agent', 'logistics_agent']"
        )
    finding = AGENT_REGISTRY[clean_name].check_risk(order)
    return {"agent": agent_name, "finding": finding}
