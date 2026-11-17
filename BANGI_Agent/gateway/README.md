# Bangi Gateway — Unified API Gateway

**Port 8001** — Single entry for **Next.js web (3000) + Flutter (mobile/desktop) + Tauri** → Bangi Backend (8000).

## Architecture
```
Next.js :3000 ──/api/*──▶ Gateway :8001 ──▶ Backend :8000 (BangiAgent hybrid)
Flutter ────────/api/*──▶  /api/*  /ws          (Hermes 10 skills + 70 tools + SOM)
Tauri ─────────/api/*──▶  /health /docs         events.jsonl, rate limit, CORS
                            ▲
                         In-process mode: imports BangiAgent directly (no HTTP hop)
                         Proxy mode: BANGI_BACKEND_URL=http://localhost:8000
```

## Endpoints (both REST + WebSocket)
- `GET  /health`, `/api/health` — gateway + bangi health
- `POST /api/task` `{prompt}` — **universal** (Next + Flutter use this) → `BangiAgent.do_task()`
- `POST /api/computer-use` — alias
- `POST /api/hermes/lead`, `GET /api/hermes/report`, `POST /api/hermes/coach`, `POST /api/hermes/campaign`
- `GET  /api/capabilities`, `GET /api/jobs`
- `WS   /ws`, `/api/ws` — streaming `{prompt}` → `ack` → `progress` → `result` + broadcast

## Run
```bash
cd BANGI_Agent
uv run gateway        # :8001
uv run bangi          # :8000 (backend)
cd apps/web && npm run dev  # :3000 Next.js (proxies /api → :8001)
# Flutter: cd apps/flutter_app && flutter run
```

Env: `BANGI_BACKEND_URL`, `GATEWAY_PORT`, `BANGI_API_KEY` (X-API-Key when set).
