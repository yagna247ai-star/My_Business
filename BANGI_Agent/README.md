# BANGI — Hermes-Powered Personal Computer-Use Agent 🤖
**v0.5 — Next.js + Flutter + Gateway** — One gateway, two frontends, one hybrid brain.

> Meta Computer-Use (SOM + AX, `cua-driver` MCP) + **Hermes-RealEstate (10 skills) + Hermes-Agent (70+ tools)** via hybrid router. Next.js web (3000) + Flutter (Android/iOS/macOS/Win/Web) → **Gateway :8001** → Backend :8000.

**RUNBOOK (single source): [`RUNBOOK.md`](RUNBOOK.md)** — dev, prod, deploy, verify — start here.

**Docs:** [`docs/BANGI_HERMES_INTEGRATION.html`](docs/BANGI_HERMES_INTEGRATION.html) • [`docs/INTEGRATED_PLATFORM_REPORT.html`](docs/INTEGRATED_PLATFORM_REPORT.html) (43/43 tests + NFR) • [`ARCHITECTURE.md`](ARCHITECTURE.md) • [`gateway/README.md`](gateway/README.md) • [`apps/web/README.md`](apps/web/README.md) • [`apps/flutter_app/README.md`](apps/flutter_app/README.md)

## Quickstart — 3 terminals

```bash
# Terminal 1 — Backend (Hermes hybrid)
cd BANGI_Agent && uv run bangi          # :8000 — /docs, /health, /hermes/*, /cua/*

# Terminal 2 — Gateway (unified)
uv run gateway                          # :8001 — /api/*, /ws, /health (in-process Bangi, no hop)

# Terminal 3 — Web
cd apps/web && npm --prefix /Users/apple/Documents/My_Business/BANGI_Agent/apps/web --cache /tmp/npm-cache install
npm --prefix /Users/apple/Documents/My_Business/BANGI_Agent/apps/web --cache /tmp/npm-cache run dev  # :3000 → proxies /api → :8001

# Flutter (if Flutter installed)
cd apps/flutter_app && flutter pub get && flutter run  # Android/iOS/macOS — Gateway URL in Settings
# Without Flutter: web + legacy frontend/index.html work via Gateway
```

Health: `http://localhost:8001/health` • `http://localhost:8000/health` • `http://localhost:3000`

## Architecture

```
Next.js :3000 ──/api/*──┐
Flutter App ───/api/*──▶ Gateway :8001 (/api/*, /ws, /health) ──▶ Backend :8000 (BangiAgent hybrid)
Tauri ─────────/api/*──┘   in-process (imports BangiAgent)    (Hermes 10 skills + 70 tools + SOM)
                            or proxy BANGI_BACKEND_URL
```

- **Gateway** (`gateway/server.py`): FastAPI :8001, CORS, rate limit (60/min), JWT stub (`BANGI_API_KEY` → `X-API-Key`), WebSocket `/ws` streaming (`ack` → `progress` → `result` + broadcast), health aggregation.
- **Next.js** (`apps/web`): Next 14 App Router + Tailwind, `lib/api.ts` (same `/api/*` as Flutter), `DesktopPreview` SOM [1][2][3], `TaskBar` WS+REST. Rewrite `/api/:path*` → `:8001`.
- **Flutter** (`apps/flutter_app`): `lib/api.dart` + `lib/screens/home_screen.dart` + `widgets/*`, Antigravity theme (ink #070A12, gold #C9A86A), `shared_preferences` gateway URL (default `10.0.2.2:8001` Android, `localhost:8001` elsewhere), WebSocket + REST fallback.

## Endpoints (Gateway unified — Next + Flutter same)

| Method | Path | Notes |
|---|---|---|
| POST | `/api/task` `{prompt}` | **Universal** — `BangiAgent.do_task()` hybrid |
| POST | `/api/computer-use` | Alias |
| POST | `/api/hermes/lead` | Speed-to-lead |
| GET  | `/api/hermes/report` | Daily digest (direct, no SOM) |
| POST | `/api/hermes/coach` `{agent_name,transcript}` | 4-Pillar |
| POST | `/api/hermes/campaign` `{corridor_id}` | Mama Hermes |
| GET  | `/api/capabilities`, `/api/jobs` | Discovery |
| WS   | `/ws`, `/api/ws` | Streaming task |

Backend direct (same without `/api` prefix): `http://localhost:8000/docs`

## Config

`config.yaml` — `hermes.mode=hybrid`, `hermes.routing.prefer_direct` vs `fallback_som`, `features.jobs.providers`, `features.coaching`. No rebuild. Env: `BANGI_BACKEND_URL`, `GATEWAY_PORT`, `BANGI_API_KEY`, `NEXT_PUBLIC_GATEWAY_URL`.

## Build

```bash
# Web prod
npm --prefix BANGI_Agent/apps/web --cache /tmp/npm-cache run build  # → .next
# Flutter
flutter build apk --release; flutter build ios; flutter build macos; flutter build web
# Python
uv sync && uv run bangi && uv run gateway
```
