# BANGI — Architecture v0.5 (Next.js + Flutter + Gateway)

## Vision
Bangi — personal computer-use agent — one hybrid brain, two frontends, one gateway. Meta SOM + Hermes skills, lightweight, durable, cross-platform.

## C4 — Updated

```
User (Next :3000 / Flutter / Tauri)
  → Gateway :8001 (FastAPI — /api/*, /ws, auth, rate limit, health aggregate)
      → Backend :8000 (FastAPI + BangiAgent hybrid router)
          ├─ Hermes-RealEstate — 10 skills (direct API, no SOM, ~0.5s, 70% tokens saved)
          └─ Hermes-Agent — 70 tools via cua-driver MCP (SOM + AX, pid-scoped, stealth)
      → Meta Model API (Muse Spark + computer_use tool) → OS (Chrome, Excel, CRM)
```

### Why Gateway?

- Single `/api/*` surface for **both** Next and Flutter (no drift)
- In-process mode: Gateway imports `BangiAgent` directly — zero HTTP hop for `POST /api/task` (fast path)
- Proxy mode: `BANGI_BACKEND_URL=http://localhost:8000` when backend scales separately
- WebSocket `/ws` — Next `TaskBar` + Flutter `home_screen` stream `ack → progress → result`
- Health aggregation: `GET /health` returns gateway + bangi + hermes + cua in one call

## Components

| Layer | Port | Tech | Key files |
|---|---|---|---|
| Backend | 8000 | FastAPI + BangiAgent | `backend/app.py` (11 endpoints), `backend/bangi_agent.py` (hybrid `do_task()`), `config.yaml` |
| Gateway | 8001 | FastAPI + httpx + WS | `gateway/server.py` (REST + WS + proxy + in-process) |
| Web | 3000 | Next 14 App Router + Tailwind | `apps/web/app/page.tsx`, `components/DesktopPreview.tsx`, `components/TaskBar.tsx`, `lib/api.ts`, `next.config.js` rewrites `/api/*` → :8001 |
| Flutter | — | Flutter 3.16+ | `apps/flutter_app/lib/{main,api,config}.dart`, `screens/home_screen.dart`, `widgets/*` — same `POST /api/task` |

## Decisions

- **Next.js 14 App Router** (not Pages) — streaming, `lib/api.ts` shared pattern, rewrites to gateway avoids CORS
- **Flutter + http + web_socket_channel + shared_preferences** — one codebase for Android/iOS/macOS/Win/Web, gateway URL persisted
- **Gateway in-process** — dev: single process, no backend needed; prod: proxy mode lets backend scale
- **Hybrid ADR-003** preserved — gateway just forwards `prompt` to `BangiAgent.do_task()`; routing still `prefer_direct` vs `fallback_som`

## Ports & Run

```
uv run bangi    → :8000 /docs /health /hermes/* /cua/*
uv run gateway  → :8001 /api/* /ws /health (needs backend or in-process)
npm run dev     → :3000 Next.js → /api/* rewrites → :8001
flutter run     → device → http://10.0.2.2:8001 (Android) or localhost:8001
env: BANGI_BACKEND_URL, GATEWAY_PORT, BANGI_API_KEY, NEXT_PUBLIC_GATEWAY_URL
```

## Security / Durability

- Rate limit 60/min per IP (gateway), CORS *, `X-API-Key` when `BANGI_API_KEY` set
- Events `~/.bangi/events.jsonl` (or `/tmp/.bangi` in sandbox) — replayable
- SQLite `~/.bangi/bangi.db` + S3 sync ready
