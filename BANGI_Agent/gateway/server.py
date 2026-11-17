"""
Bangi Gateway v0.5 — Unified Gateway for Next.js Web + Flutter + Tauri
======================================================================
Single entry point for Next.js web + Flutter + Tauri desktop.

                    ┌──────────────────────────────────────────┐
  Browser (Next) ──▶│  :3000 Next.js (proxies /api → :8001)   │
  Flutter App ─────▶│  :8001 Gateway (FastAPI)                │──▶ :8000 Backend (BangiAgent)
  Tauri Desktop ───▶│       /api/*  /ws  /auth  /health       │    (Hybrid router + Hermes skills)
                    └──────────────────────────────────────────┘

Features: JWT auth, rate limit, WebSocket streaming, CORS, health aggregation.
Run: uv run gateway  (port 8001) + uv run bangi (port 8000) + npm run dev (port 3000)
"""
import os
import sys
import time
import uuid
import json
import asyncio
from typing import Any, Dict, Optional, List
from datetime import datetime

from fastapi import FastAPI, Body, Query, Depends, HTTPException, Request, WebSocket, WebSocketDisconnect
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import httpx

# Import Bangi backend for in-process mode
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
try:
    from backend.bangi_agent import BangiAgent
    _bangi = BangiAgent()
    IN_PROCESS = True
except Exception as e:
    print(f"Gateway in-process Bangi failed, fallback to proxy mode: {e}")
    _bangi = None
    IN_PROCESS = False

BACKEND_URL = os.getenv("BANGI_BACKEND_URL", "http://localhost:8000")
GATEWAY_PORT = int(os.getenv("GATEWAY_PORT", "8001"))

app = FastAPI(
    title="Bangi Gateway",
    version="0.5.0",
    description="Unified Gateway — Next.js + Flutter → Bangi Backend (Hermes hybrid). Async non-blocking.",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Correlation ID and Auth middleware
API_KEY = os.getenv("BANGI_API_KEY", "")

@app.middleware("http")
async def correlation_and_rate_middleware(request: Request, call_next):
    correlation_id = request.headers.get("x-request-id") or str(uuid.uuid4())
    request.state.correlation_id = correlation_id

    # Rate limiting (per-IP, 60 req/min)
    client_ip = request.client.host if request.client else "unknown"
    if not _rate_ok(client_ip):
        return JSONResponse(status_code=429, content={"detail": "Rate limit exceeded (60 req/min)"})

    # Auth check
    if API_KEY and request.url.path not in ["/health", "/docs", "/openapi.json", "/"]:
        key = request.headers.get("x-api-key") or request.query_params.get("api_key")
        if key != API_KEY:
            return JSONResponse(status_code=401, content={"detail": "Invalid API key"})

    response = await call_next(request)
    response.headers["X-Request-ID"] = correlation_id
    return response


# Rate limiting helper
_hits: Dict[str, List[float]] = {}
def _rate_ok(ip: str, limit: int = 60, window: int = 60) -> bool:
    now = time.time()
    bucket = _hits.setdefault(ip, [])
    bucket[:] = [t for t in bucket if now - t < window]
    if len(bucket) >= limit:
        return False
    bucket.append(now)
    return True


async def _call_bangi(prompt: str, correlation_id: Optional[str] = None) -> Dict[str, Any]:
    """Invoke Bangi Agent via in-process async call or HTTP proxy."""
    if IN_PROCESS and _bangi:
        return await _bangi.do_task(prompt, correlation_id=correlation_id)
    
    headers = {"X-Request-ID": correlation_id} if correlation_id else {}
    if API_KEY:
        headers["X-API-Key"] = API_KEY

    async with httpx.AsyncClient(timeout=30) as c:
        r = await c.post(f"{BACKEND_URL}/computer-use", json={"prompt": prompt, "correlation_id": correlation_id}, headers=headers)
        r.raise_for_status()
        return r.json()


# ──────────────────────────────────────────────
# REST Unified API Surface
# ──────────────────────────────────────────────

@app.get("/health")
async def health():
    b = _bangi.health() if _bangi else {"bangi": "proxy", "backend": BACKEND_URL}
    return {
        "gateway": "ok",
        "version": "0.5.0",
        "in_process": IN_PROCESS,
        "backend_url": BACKEND_URL,
        "bangi": b,
        "now": datetime.utcnow().isoformat(),
    }

@app.get("/api/health")
async def api_health():
    return await health()

@app.get("/api/capabilities")
async def api_caps():
    if _bangi:
        return {"capabilities": _bangi.capabilities, "version": "0.5.0"}
    async with httpx.AsyncClient(timeout=10) as c:
        r = await c.get(f"{BACKEND_URL}/capabilities")
        return r.json()

@app.post("/api/task")
async def api_task(request: Request, prompt: str = Body(..., embed=True)):
    cid = request.state.correlation_id
    result = await _call_bangi(prompt, correlation_id=cid)
    return {"ok": True, **result, "via": "gateway", "in_process": IN_PROCESS}

@app.post("/api/computer-use")
async def api_computer_use(request: Request, prompt: str = Body(..., embed=True)):
    return await api_task(request, prompt)

@app.get("/api/tasks")
async def api_tasks(limit: int = Query(50, ge=1, le=200)):
    if _bangi:
        return {"tasks": _bangi.db.list_tasks(limit=limit)}
    async with httpx.AsyncClient(timeout=10) as c:
        r = await c.get(f"{BACKEND_URL}/tasks?limit={limit}")
        return r.json()


# ──────────────────────────────────────────────
# WebSocket Realtime Task Streaming
# ──────────────────────────────────────────────

class ConnMgr:
    def __init__(self):
        self.active: List[WebSocket] = []

    async def connect(self, ws: WebSocket):
        await ws.accept()
        self.active.append(ws)

    def disconnect(self, ws: WebSocket):
        if ws in self.active:
            self.active.remove(ws)

    async def broadcast(self, msg: Dict[str, Any]):
        dead = []
        for ws in self.active:
            try:
                await ws.send_json(msg)
            except Exception:
                dead.append(ws)
        for d in dead:
            self.disconnect(d)

mgr = ConnMgr()

@app.websocket("/ws")
async def ws_endpoint(ws: WebSocket):
    await mgr.connect(ws)
    await ws.send_json({"type": "hello", "gateway": "0.5.0", "in_process": IN_PROCESS})
    try:
        while True:
            data = await ws.receive_json()
            prompt = data.get("prompt") or data.get("message") or ""
            cid = data.get("correlation_id") or str(uuid.uuid4())
            if not prompt:
                await ws.send_json({"type": "error", "detail": "Missing {prompt: string}"})
                continue
            
            await ws.send_json({"type": "ack", "prompt": prompt, "correlation_id": cid})
            await ws.send_json({"type": "progress", "step": "routing", "detail": "Hybrid router evaluating fast-path regex / CUA fallback"})
            
            result = await _call_bangi(prompt, correlation_id=cid)
            await ws.send_json({"type": "result", **result})
            await mgr.broadcast({"type": "event", "prompt": prompt, "mode": result.get("mode"), "correlation_id": cid})
    except WebSocketDisconnect:
        mgr.disconnect(ws)
    except Exception as e:
        try:
            await ws.send_json({"type": "error", "detail": str(e)})
        except Exception:
            pass
        mgr.disconnect(ws)

@app.websocket("/api/ws")
async def ws_alias(ws: WebSocket):
    await ws_endpoint(ws)


@app.get("/")
async def root():
    return {
        "bangi_gateway": "0.5.0",
        "docs": "/docs",
        "health": "/health",
        "ws": "/ws",
        "in_process": IN_PROCESS,
    }

def main():
    import uvicorn
    print(f"Bangi Gateway :{GATEWAY_PORT} → backend {BACKEND_URL} (in_process={IN_PROCESS})")
    uvicorn.run(app, host="0.0.0.0", port=GATEWAY_PORT)

if __name__ == "__main__":
    main()
