# SentinelChain Monorepo

A modern fullstack monorepo featuring a Next.js App Router frontend with Tailwind CSS, shadcn/ui, and Tremor, alongside a high-performance Python FastAPI backend in an isolated virtual environment.

---

## 📁 Repository Structure

```
SentinelChain/
├── frontend/                     # Next.js App Router frontend
│   ├── app/                      # Next.js App Router (layout, page)
│   ├── components/               # UI components
│   │   └── ui/                   # shadcn/ui (card, badge, button, dialog, table, tabs)
│   ├── lib/                      # Utilities (cn helper)
│   ├── components.json           # shadcn/ui configuration (neutral / slate theme)
│   ├── package.json              # Next.js + @tremor/react dependencies
│   ├── tailwind.config.ts        # Tailwind CSS configuration
│   └── tsconfig.json             # TypeScript configuration
├── backend/                      # Python FastAPI backend
│   ├── .venv/                    # Isolated Python virtual environment
│   ├── app/
│   │   ├── __init__.py
│   │   └── main.py               # FastAPI application with health check endpoint
│   ├── requirements.txt          # fastapi, uvicorn[standard], pydantic
│   └── .gitignore
└── README.md                     # Project documentation
```

---

## 🚀 Getting Started

### 1. Backend (Python + FastAPI)

The backend uses a dedicated virtual environment in `backend/.venv` to keep dependencies isolated from global Python packages.

```powershell
# Navigate to backend
cd backend

# Activate virtual environment (Windows PowerShell)
.\.venv\Scripts\Activate.ps1

# (Optional) If dependencies need reinstalling:
pip install -r requirements.txt

# Start FastAPI development server
uvicorn app.main:app --reload --port 8000
```

- **Health Check Endpoint:** [http://127.0.0.1:8000/health](http://127.0.0.1:8000/health)
- **Interactive Swagger Docs:** [http://127.0.0.1:8000/docs](http://127.0.0.1:8000/docs)
- **ReDoc:** [http://127.0.0.1:8000/redoc](http://127.0.0.1:8000/redoc)

---

### 2. Frontend (Next.js + TypeScript + Tailwind + shadcn/ui + Tremor)

The frontend includes shadcn/ui components (`card`, `badge`, `button`, `dialog`, `table`, `tabs`) and `@tremor/react` charts and metrics.

```powershell
# Navigate to frontend
cd frontend

# Start Next.js development server
npm run dev
```

- **Frontend App:** [http://localhost:3000](http://localhost:3000)

---

## 🛠️ Tech Stack & Features

- **Frontend:**
  - Next.js 14 (App Router)
  - TypeScript
  - Tailwind CSS (Slate / Neutral Theme)
  - shadcn/ui (`card`, `badge`, `button`, `dialog`, `table`, `tabs`)
  - `@tremor/react` (Metrics, Charts, Progress indicators)
  - `lucide-react` icons
- **Backend:**
  - FastAPI
  - Uvicorn (ASGI server)
  - Pydantic v2 data validation
  - CORS middleware enabled for `http://localhost:3000`
