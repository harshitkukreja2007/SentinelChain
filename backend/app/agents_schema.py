"""
Standardized Risk Assessment Data Models for SentinelChain Agents
"""
from enum import Enum
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field


class RiskLevel(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"


class RiskAssessment(BaseModel):
    agent_name: str = Field(..., description="Name of the evaluating agent")
    risk_level: RiskLevel = Field(..., description="Assessed risk level: low (green-500), medium (amber-500), high (red-500)")
    score: float = Field(..., ge=0.0, le=100.0, description="Numerical risk score from 0 (safe) to 100 (critical)")
    factors: List[str] = Field(default_factory=list, description="Key contributing risk factors")
    recommendation: str = Field(..., description="Actionable mitigation recommendation")
    metadata: Dict[str, Any] = Field(default_factory=dict, description="Agent-specific supplementary data")


class OrderInput(BaseModel):
    order_id: str
    supplier_id: str
    supplier_name: Optional[str] = None
    origin_country: str
    destination_country: str
    origin_port: Optional[str] = None
    destination_port: Optional[str] = None
    item_category: str
    total_value_usd: float
    required_delivery_date: Optional[str] = None
