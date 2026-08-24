# Project Rules & Architecture Guidelines: SentinelChain

## 1. System Overview & Philosophy
SentinelChain is an enterprise B2B operations and supply chain risk intelligence platform. Design and code should prioritize information density, reliability, speed, and strict modularity over ornamental consumer UX.

---

## 2. Frontend Guidelines (`frontend/`)

### 2.1 Component Usage & Design System
- **Strict Component Source:** ONLY use components from `components/ui/` (shadcn/ui) and `@tremor/react`.
- **No Custom Re-inventions:** Do NOT invent custom button, card, badge, dialog, or table styles from scratch. Always compose from the standardized shadcn/ui components or Tremor visualization primitives.
- **Iconography:** Use `lucide-react` for consistent, crisp enterprise iconography.

### 2.2 Standard Risk Color Coding
Uniform color-coding MUST be strictly enforced across all cards, badges, charts, progress bars, and alerts:
- 🔴 **High Risk:** `red-500` (`#ef4444` / `bg-red-500`, `text-red-500`, `border-red-500`)
- 🟡 **Medium Risk:** `amber-500` (`#f59e0b` / `bg-amber-500`, `text-amber-500`, `border-amber-500`)
- 🟢 **Low Risk:** `green-500` (`#22c55e` / `bg-green-500`, `text-green-500`, `border-green-500`)

### 2.3 Layout & UX Requirements
- **Structure:** Persistent **Sidebar Navigation + Main Content Area** dashboard layout.
- **Density & Ergonomics:** High information density, compact tables, scannable telemetry metrics, minimal empty margins, optimized for operational desk monitors (B2B workstation workflow).

---

## 3. Backend Guidelines (`backend/`)

### 3.1 Modular Agent Architecture
- All intelligence and domain-specific risk checkers MUST reside as independent modules within `backend/agents/`:
  - `backend/agents/supplier.py` (Supplier financial health, geopolitical exposure, historical performance)
  - `backend/agents/weather.py` (Severe weather events, route disruptions, seasonal anomalies)
  - `backend/agents/policy.py` (Tariffs, compliance, trade sanctions, customs regulatory shifts)
  - `backend/agents/logistics.py` (Port congestion, carrier delays, route bottlenecks)

### 3.2 Common Interchangeable Agent Interface
Every agent module MUST expose the unified interface function:
```python
def check_risk(order: dict | OrderModel) -> RiskAssessment:
    """
    Evaluates order-specific risk and returns a standardized assessment.
    
    Returns:
        RiskAssessment: standardized dictionary or Pydantic model containing:
            - agent_name: str
            - risk_level: "low" | "medium" | "high"
            - score: float (0.0 to 100.0)
            - factors: list[str]
            - recommendation: str
    """
    ...
```

### 3.3 Virtual Environment Isolation
- Always execute backend commands within the dedicated `backend/.venv` virtual environment to prevent contamination of global system packages.
- Manage dependencies cleanly in `backend/requirements.txt`.
