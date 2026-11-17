"""
BANGI Backend v0.5 — Hermes-Powered Computer-Use Proxy
========================================================
FastAPI server exposing:
  POST /computer-use  — hybrid router (Hermes direct → cua-driver fallback)
  POST /task          — universal task endpoint (alias)
  GET  /tasks         — list recent tasks from SQLite bangi.db
  GET  /tasks/{id}    — task state lookup
  POST /hermes/*      — direct skill endpoints (zero SOM overhead)
  POST /cua/*         — computer-use direct endpoints (capture, act, schema)
  GET  /health        — full system status
  GET  /capabilities  — all Bangi + Hermes capabilities

Pattern: https://dev.meta.ai/docs/computer-use + Hermes-agent/tools/computer_use/
"""
import os
import sys
import uuid
import json
from pathlib import Path
from typing import Any, Dict, Optional

# Load .env (dev live) — supports both `uv run` and direct TestClient
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env", override=False)
    load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env.local", override=False)
except Exception:
    pass

from fastapi import FastAPI, Body, Query, Request, HTTPException, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware

# Bangi agent (now Hermes-powered)
from backend.bangi_agent import BangiAgent, HERMES_AGENT_AVAILABLE, HERMES_TOOLS
from backend.schemas import TaskRequest, TaskResponse, LeadPayload, CoachPayload, CampaignPayload, HealthResponse

# Try to load CUA schema/tools for direct endpoint
try:
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../Hermes-agent/hermes-agent'))
    from tools.computer_use import handle_computer_use, get_computer_use_schema, check_computer_use_requirements
    HAS_CUA = True
except Exception as e:
    handle_computer_use = None
    get_computer_use_schema = None
    check_computer_use_requirements = None
    HAS_CUA = False

app = FastAPI(
    title="BANGI — Hermes-Powered Computer-Use Agent",
    version="0.5.0",
    description="Bangi + Hermes-RealEstate (10 skills) + Hermes-Agent (70+ tools). Hybrid router: direct API → SOM fallback.",
)

# NFR: CORS explicit origins (no * + credentials conflict)
_CORS_ORIGINS = [o.strip() for o in os.getenv("CORS_ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:8000,http://localhost:8001").split(",") if o.strip()]
app.add_middleware(CORSMiddleware, allow_origins=_CORS_ORIGINS, allow_credentials=False, allow_methods=["*"], allow_headers=["*"], expose_headers=["X-Request-ID"])

# API Key security authentication
BANGI_API_KEY = os.getenv("BANGI_API_KEY", "")

@app.middleware("http")
async def correlation_and_auth_middleware(request: Request, call_next):
    # Correlation ID handling
    correlation_id = request.headers.get("x-request-id") or str(uuid.uuid4())
    request.state.correlation_id = correlation_id

    # Auth check if BANGI_API_KEY is configured
    if BANGI_API_KEY and request.url.path not in ["/health", "/docs", "/openapi.json", "/"]:
        key = request.headers.get("x-api-key") or request.query_params.get("api_key")
        if key != BANGI_API_KEY:
            return JSONResponse(status_code=401, content={"detail": "Invalid API key"})

    response = await call_next(request)
    response.headers["X-Request-ID"] = correlation_id
    return response


# Single agent instance (holds Hermes)
bangi = BangiAgent()


# ──────────────────────────────────────────────
# Core hybrid endpoints
# ──────────────────────────────────────────────

@app.post("/computer-use")
async def computer_use(payload: TaskRequest = Body(...), request: Request = None):
    """
    Universal task endpoint — hybrid router.
    Tries Hermes direct API first, falls back to cua-driver SOM.
    """
    cid = request.state.correlation_id if request and hasattr(request.state, "correlation_id") else payload.correlation_id
    # also support raw {prompt} via TaskRequest validation
    if len(payload.prompt) > 4000:
        raise HTTPException(status_code=413, detail="Prompt too long (max 4000)")
    if not payload.prompt.strip():
        raise HTTPException(status_code=422, detail="Prompt must not be empty")
    try:
        result = await bangi.do_task(payload.prompt, correlation_id=cid)
    except ValueError as e:
        raise HTTPException(status_code=422, detail=str(e))
    return result


@app.post("/task")
async def task_generic(payload: TaskRequest = Body(...), request: Request = None):
    """Alias for /computer-use"""
    return await computer_use(payload, request)


@app.get("/tasks")
async def list_tasks(limit: int = Query(50, ge=1, le=200)):
    """List recent tasks from SQLite bangi.db."""
    return {"tasks": bangi.db.list_tasks(limit=limit)}


@app.get("/tasks/{task_id}")
async def get_task(task_id: str):
    """Query specific task state from SQLite bangi.db."""
    task = bangi.db.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    return task


# ──────────────────────────────────────────────
# Hermes direct skill endpoints (zero SOM overhead)
# ──────────────────────────────────────────────

@app.post("/hermes/lead")
async def hermes_lead(payload: Dict[str, Any] = Body(...), request: Request = None):
    """Speed-to-lead: handle incoming lead with instant response."""
    cid = request.state.correlation_id if request and hasattr(request.state, "correlation_id") else None
    return await bangi.handle_incoming_lead(payload, correlation_id=cid)


@app.get("/hermes/report")
async def hermes_report():
    """Daily executive digest from tracker_sync."""
    report = await bangi.generate_daily_report()
    return {"report": report, "mode": "hermes-direct", "tool": "tracker_sync"}


@app.post("/hermes/coach")
async def hermes_coach(agent_name: str = Body(...), transcript: str = Body(...), request: Request = None):
    """Sales call coaching — 4-Pillar framework."""
    cid = request.state.correlation_id if request and hasattr(request.state, "correlation_id") else None
    coaching = await bangi.coach_sales_call(agent_name, transcript, correlation_id=cid)
    return {"coaching": coaching}


@app.post("/hermes/convert")
async def hermes_convert(source_path: str = Body(...), target_path: str = Body(...), request: Request = None):
    """Lead converter: Meta CSV → contacts.csv"""
    cid = request.state.correlation_id if request and hasattr(request.state, "correlation_id") else None
    return await bangi.convert_leads_to_contacts(source_path, target_path, correlation_id=cid)


@app.post("/hermes/campaign")
async def hermes_campaign(corridor_id: str = Body("shankarpally_west", embed=True), request: Request = None):
    cid = request.state.correlation_id if request and hasattr(request.state, "correlation_id") else None
    return await bangi.generate_campaign_assets(corridor_id, correlation_id=cid)


@app.get("/hermes/market")
async def hermes_market(corridor: str = Query("shankarpally_west")):
    return await bangi.get_market_intel(corridor)


# ──────────────────────────────────────────────
# Computer-use direct (SOM)
# ──────────────────────────────────────────────

@app.post("/cua/capture")
async def cua_capture():
    if not HAS_CUA or not handle_computer_use:
        return {"error": "cua-driver not installed", "mode": "demo", "hint": "pip install -e ../Hermes-agent/hermes-agent"}
    try:
        result = await handle_computer_use(action="capture")
        return {"ok": True, "mode": "cua-driver", "result": str(result)[:2000]}
    except Exception as e:
        return {"ok": False, "error": str(e)}


@app.post("/cua/act")
async def cua_act(action: str = Body(...), element_index: Optional[int] = Body(None), text: Optional[str] = Body(None)):
    if not HAS_CUA or not handle_computer_use:
        return {"error": "cua-driver not installed", "mode": "demo"}
    try:
        kwargs = {}
        if element_index is not None:
            kwargs["element_index"] = element_index
        if text is not None:
            kwargs["text"] = text
        result = await handle_computer_use(action=action, **kwargs)
        bangi._log_event({"type": "cua_act", "action": action, "element_index": element_index})
        return {"ok": True, "mode": "cua-driver", "result": str(result)[:2000]}
    except Exception as e:
        return {"ok": False, "error": str(e)}


@app.get("/cua/schema")
async def cua_schema():
    if get_computer_use_schema:
        return get_computer_use_schema()
    return {"error": "schema not available", "mode": "demo", "fallback": {"action": "click|type|scroll|capture|wait", "element_index": "int (SOM overlay number)"}}


# ──────────────────────────────────────────────
# Health & discovery
# ──────────────────────────────────────────────

@app.get("/health")
def health():
    h = bangi.health()
    h["cua"] = HAS_CUA
    h["cua_check"] = str(check_computer_use_requirements())[:300] if check_computer_use_requirements else "not available"
    return h


@app.get("/capabilities")
def capabilities():
    return {"capabilities": bangi.capabilities, "tools": HERMES_TOOLS[:20], "version": "0.5.0-hermes"}


@app.get("/")
def root():
    return {"bangi": "Hermes-Powered Computer-Use Agent", "version": "0.5.0", "docs": "/docs", "frontend": "/static/index.html", "health": "/health"}


# Serve frontend (PWA)
frontend = os.path.join(os.path.dirname(__file__), "../frontend")
if os.path.isdir(frontend):
    app.mount("/static", StaticFiles(directory=frontend), name="static")


def main():
    import uvicorn
    print("=" * 60)
    print("  BANGI v0.5 — Hermes-Powered Computer-Use Agent")
    print("  http://localhost:8000  |  docs: /docs  |  frontend: /static/index.html")
    print("  Health: /health | Capabilities: /capabilities")
    print(f"  Hermes-RealEstate: {bangi.hermes is not None} | Hermes-Agent: {HERMES_AGENT_AVAILABLE} ({len(HERMES_TOOLS)} tools)")
    print("=" * 60)
    uvicorn.run(app, host="0.0.0.0", port=8000)


if __name__ == "__main__":
    main()
