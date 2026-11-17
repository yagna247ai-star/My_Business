# BANGI — RUNBOOK (MVP v0.5)

> **Single source of truth.** Dev, prod, deploy — one file. Stack: **Backend :8000 + Gateway :8001 + Next.js :3000 + Flutter** (Antigravity theme, Hermes hybrid).

---

## 1. TL;DR — Run locally in 60s

```bash
cd /Users/apple/Documents/My_Business/BANGI_Agent

# 0. One-time setup (Python 3.11 + uv + Node 20)
curl -LsSf https://astral.sh/uv/install.sh | sh  # provides `uv`
uv sync                                           # creates .venv + installs fastapi, httpx, pandas, etc.
npm --prefix apps/web --cache /tmp/npm-cache install  # Next.js deps

# 1. Three terminals (or `docker compose up`)
# Terminal A — Backend (Hermes hybrid router, 11 endpoints)
uv run bangi                                      # → http://localhost:8000  /docs  /health  /hermes/*  /cua/*

# Terminal B — Gateway (unified /api/* for Web+Flutter, WS, in-process — zero hop)
uv run gateway                                    # → http://localhost:8001  /api/*  /ws  /health  (needs backend or runs in-process alone)

# Terminal C — Web (Next.js 14 App Router, proxies /api → :8001)
npm --prefix apps/web --cache /tmp/npm-cache run dev  # → http://localhost:3000

# Flutter (if Flutter 3.16+ installed — otherwise web works standalone)
cd apps/flutter_app && flutter pub get && flutter run  # Android emulator: 10.0.2.2:8001 • iOS/macOS: localhost:8001
```

**Health (all green = MVP live):**
```bash
curl http://localhost:8001/health | jq   # gateway + bangi + hermes + cua
curl http://localhost:8000/health | jq   # backend direct
curl http://localhost:8000/hermes/report | jq  # Hermes daily digest (no SOM)
open http://localhost:3000               # Next.js — Jobs + CRM + SOM preview + TaskBar
open http://localhost:8001/docs          # Gateway Swagger
open http://localhost:8000/docs          # Backend Swagger
```

---

## 2. What lives where

| Layer | Port | Entry | Tech | Docs |
|---|---|---|---|---|
| **Backend** | 8000 | `uv run bangi` (`backend/app.py`) | FastAPI + `BangiAgent` hybrid — Hermes 10 skills direct, 70 tools via `cua-driver` SOM | [ARCHITECTURE.md](ARCHITECTURE.md) |
| **Gateway** | 8001 | `uv run gateway` (`gateway/server.py`) | FastAPI `/api/*` + `WS /ws` + CORS + rate 60/min + `X-API-Key` (`BANGI_API_KEY`) + health aggregate — in-process or proxy `BANGI_BACKEND_URL` | [gateway/README.md](gateway/README.md) |
| **Web** | 3000 | `npm --prefix apps/web run dev` (`apps/web/app/page.tsx`) | Next 14 App Router + Tailwind, `lib/api.ts` (same `/api/*` as Flutter), `DesktopPreview` SOM [1][2][3], `TaskBar` WS+REST, `next.config.js` rewrites `/api/:path* → :8001` | [apps/web/README.md](apps/web/README.md) |
| **Flutter** | — | `flutter run` (`apps/flutter_app/lib/`) | Flutter 3.16+, `http` + `web_socket_channel` + `shared_preferences`, Antigravity (ink #070A12, gold #C9A86A), gateway URL persisted | [apps/flutter_app/README.md](apps/flutter_app/README.md) |
| **Legacy** | 8000 | `/static/index.html` | Preact 30KB PWA (still served by backend) | [frontend/index.html](frontend/index.html) |

**Unified API — both Web and Flutter use the same Gateway surface:**
```
POST /api/task {prompt}          # universal — BangiAgent.do_task() hybrid (CRM→direct, jobs→SOM)
POST /api/computer-use           # alias
POST /api/hermes/lead            # speed-to-lead (Hermes direct)
GET  /api/hermes/report          # daily digest (no SOM, ~0.5s, 70% tokens saved)
POST /api/hermes/coach {agent_name,transcript}  # 4-Pillar
POST /api/hermes/campaign {corridor_id}
GET  /api/capabilities, /api/jobs
WS   /ws, /api/ws                # streaming: ack → progress → result
```

---

## 3. Environment

Copy `.env.example` → `.env` (12-factor, no rebuild):

```bash
cp .env.example .env  # then fill META_API_KEY, BANGI_API_KEY for prod
```

| Var | Default | Purpose |
|---|---|---|
| `BANGI_BACKEND_URL` | `http://localhost:8000` | Gateway → Backend (proxy mode) |
| `GATEWAY_PORT` | `8001` | Gateway listen port |
| `BANGI_API_KEY` | *(empty = open in dev)* | When set, clients must send `X-API-Key: $BANGI_API_KEY` |
| `NEXT_PUBLIC_GATEWAY_URL` | `""` (same-origin via rewrites) | Web → Gateway direct URL (set to `http://localhost:8001` for direct) |
| `META_API_KEY` | — | Meta Model API (Muse Spark + `computer_use`) |
| `META_API_URL` | `https://api.meta.ai/v1` | Meta endpoint |
| `CRM_PATH` | `../RealEstate/hermes_automation` | Hermes skills path |
| `CONTACTS_CSV` | `../contacts.csv` | Legacy lead converter target |

`config.yaml` (hot-swappable, no rebuild): `hermes.mode=hybrid`, `hermes.routing.prefer_direct` vs `fallback_som`, `features.jobs.providers=[naukri,linkedin,indeed]`, `features.coaching`, `computer_use.backend=hybrid`, `storage.events_jsonl=~/.bangi/events.jsonl`.

---

## 4. Build — MVP artifacts

```bash
# One-shot MVP build (Python + Next.js + Flutter static check + pytest)
./scripts/build-mvp.sh

# Manual:
.venv/bin/python -m py_compile gateway/server.py backend/bangi_agent.py backend/app.py  # all ok
npm --prefix apps/web --cache /tmp/npm-cache run build   # → apps/web/.next (30 MB, 4 routes, 5.32 kB /)
BANGI_Agent/.venv/bin/python -m pytest ../RealEstate/hermes_automation/tests/test_all_skills.py -v  # 6/6
BANGI_Agent/.venv/bin/python /tmp/bangi_integrated_tests.py  # 43/43 → /tmp/bangi_test_results.json + docs/TEST_REPORT.html
# Flutter full (needs device): flutter build apk --release; flutter build ios; flutter build macos; flutter build web
```

**Artifacts:** `apps/web/.next` (Next standalone), `.venv` (Python), `docs/INTEGRATED_PLATFORM_REPORT.html` + `TEST_REPORT.html`.

---

## 5. Production

### 5a. Bare metal / VM (same as OCI)

```bash
# Copy .env + set secrets
cp .env.example .env  # set BANGI_API_KEY, META_API_KEY
# Option 1 — systemd user (lightweight, no Docker)
cp bangi.service ~/.config/systemd/user/bangi.service
systemctl --user daemon-reload && systemctl --user enable --now bangi  # Gateway+Backend together
systemctl --user status bangi --no-pager -l | head -n 50
journalctl --user -u bangi -n 50 -f
# Option 2 — separate
# bangi.service already runs: uv run bangi & uv run gateway & wait  (port 8000+8001)
# Web as systemd or nginx: npm --prefix apps/web start (or nginx proxy to :3000)
```

### 5b. Docker (single image — Gateway+Backend+Next)

```bash
docker build -t bangi-mvp .
docker compose up -d              # → :8000 backend, :8001 gateway, :3000 web (healthchecks)
docker compose logs -f              # or: gateway / backend / web
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d  # prod overlay
```

`Dockerfile` is multi-stage (uv + Node) with `HEALTHCHECK` on `:8001/health`. `docker-compose.yml` wires `backend → gateway → web` with `service_healthy` and `bangi-data` volume for `~/.bangi/events.jsonl`.

### 5c. OCI (current target — `140.245.194.223`)

```bash
chmod +x deploy_bangi_oci.sh && ./deploy_bangi_oci.sh
# Does: tar BANGI_Agent + RealEstate/hermes_automation → scp → uv sync → systemd enable --now bangi
# Check: ssh -i ~/Downloads/ssh-key-2026-08-18.key opc@140.245.194.223 'systemctl --user status bangi; journalctl --user -u bangi -n 50 -f'
# Tunnel GUI: ssh -i ~/Downloads/ssh-key-2026-08-18.key -L 8000:localhost:8000 -L 8001:localhost:8001 opc@140.245.194.223
# Then: open http://localhost:3000 (web) or http://localhost:8001/docs (gateway)
```

---

## 6. Verification — how to know MVP is live

```bash
# 1. Hermes pytest (real skills, not mocked)
.venv/bin/python -m pytest ../RealEstate/hermes_automation/tests/test_all_skills.py -v  # expect 6 passed in ~2.7s

# 2. Gateway + Backend TestClient (no network flake — 10 + 6 checks)
.venv/bin/python /tmp/bangi_integrated_tests.py  # expect 43/43 passed → docs/TEST_REPORT.html + INTEGRATED_PLATFORM_REPORT.html

# 3. NFR (included in above): latency 842–1310 ms avg warm (target <1500), concurrency 10× 10/10 in ~97ms, CORS, events.jsonl durable

# 4. Manual smoke (all via Gateway — same as Web+Flutter):
curl -X POST http://localhost:8001/api/task -H "Content-Type: application/json" -d '{"prompt":"check CRM lead status"}' | jq .mode      # hermes-direct
curl -X POST http://localhost:8001/api/task -H "Content-Type: application/json" -d '{"prompt":"generate campaign for shankarpally"}' | jq .data.instagram_reel.hook
curl -X POST http://localhost:8001/api/hermes/lead -H "Content-Type: application/json" -d '{"lead_id":"HYD_9901","name":"Srinivas","location":"Gachibowli","budget_lakhs":25,"residence":"India","language":"te_en"}' | jq
curl http://localhost:8001/api/hermes/report | jq .report | head -n 5
# WebSocket streaming (Next TaskBar + Flutter do this):
# wscat -c ws://localhost:8001/ws  → {"prompt":"check CRM lead status"} → ack → progress → result

# 5. Browser
open http://localhost:3000                # Next.js — click Apply jobs / Check CRM / Coach Yagna — log appends
open http://localhost:8001/docs           # Gateway Swagger — try POST /api/task
open docs/INTEGRATED_PLATFORM_REPORT.html # full report with NFR bars + tables
```

**Expected:** Web SOM overlays [1][2][3] visible, task bar `→ POST /api/task → hybrid` → `✓ hermes-direct` in <2s, `events.jsonl` at `~/.bangi/events.jsonl` (or `/tmp/.bangi` in sandbox) grows.

---

## 7. Troubleshooting

| Symptom | Fix |
|---|---|
| `ModuleNotFoundError: pandas` | `uv sync` (Hermes needs `pandas`+`openpyxl`) |
| `PermissionError: /Users/apple/.bangi` | Sandbox — fallback is `/tmp/.bangi/events.jsonl` (check gateway log `Events path fallback`) |
| `npm EPERM /Users/apple/.npm` | `npm --cache /tmp/npm-cache install` (root-owned cache) |
| `Could not find app directory` for `next build` | Run with `npm --prefix BANGI_Agent/apps/web` (not from `My_Business/`) |
| `hermes_realestate: false` in `/health` | Check `CRM_PATH` / `RealEstate/hermes_automation` mounted (Docker volume or `config.yaml:hermes.realestate_path`) |
| `X-API-Key 401` | Unset `BANGI_API_KEY` in dev, or send `X-API-Key: $BANGI_API_KEY` |
| Flutter `10.0.2.2:8001` not reachable | Device Settings → Gateway URL → set to `http://<your-mac-ip>:8001` (not `10.0.2.2` on real device) |
| Events not durable in sandbox | Expected — `/tmp` is correct fallback; on prod `~/.bangi` is writable |

---

## 8. Links

- **Integrated platform report (tests+NFR+build):** [docs/INTEGRATED_PLATFORM_REPORT.html](docs/INTEGRATED_PLATFORM_REPORT.html) + [docs/TEST_REPORT.html](docs/TEST_REPORT.html) (`/tmp/bangi_test_results.json`, `43/43` after warm fix)
- **Integration docs:** [docs/BANGI_HERMES_INTEGRATION.html](docs/BANGI_HERMES_INTEGRATION.html) (hybrid router, C4, 10 skills, 70 tools)
- **Architecture:** [ARCHITECTURE.md](ARCHITECTURE.md) • [gateway/README.md](gateway/README.md) • [apps/web/README.md](apps/web/README.md) • [apps/flutter_app/README.md](apps/flutter_app/README.md)
- **Scripts:** [scripts/build-mvp.sh](scripts/build-mvp.sh) — one-shot MVP build

*Generated for MVP v0.5 — 2026-08-18. Stack: Python 3.11 + FastAPI + Next 14 + Flutter 3.16 + Hermes. Ports 3000/8000/8001. Lightweight (<50 MB install, <120 MB RAM) + durable (events.jsonl).*
