# Bangi MVP — Weeks 2-3 (Upgrade from Prototype)
**Goal:** Real desktop control + real CRM/jobs + installers for Android/macOS/iOS (lightweight, durable).

## Tech Stack (lightweight)
- **Shared core:** `packages/core` TypeScript (task-planner, som-client, job-applier, crm-sync)
- **Web:** Vite + Preact + Tailwind (30KB), PWA `manifest.json`
- **Desktop:** Tauri 2.0 (Rust) — 5MB binary, uses `frontend/dist`, `cua-driver` sidecar (MCP stdio), SkyLight focus-without-raise
- **Mobile:** Capacitor 6 — wraps same `frontend/dist`, plugins: `App`, `Filesystem`, `LocalNotifications`
- **BFF:** FastAPI → Meta Model API `https://api.meta.ai/v1` with `computer_use` tool, streaming

## MVP Features
1. **Computer-Use real:** Install `cua-driver` (`pip install -e ../Hermes-agent/hermes-agent`), `POST /computer-use` → `handle_computer_use(action=capture)` → SOM PNG → Muse Spark → `click element_index`
2. **Jobs real:** `config/jobs.selectors.yaml` for Naukri/LinkedIn (CSS selectors), Playwright fallback, resume autofill, daily_limit 20, idempotent (skip if already applied)
3. **CRM real:** Hermes `tracker_sync` reads/writes `Abhinandhana_Visit_Close_Tracker.xlsx`, polls every 30m via `APScheduler` + `BGTaskScheduler` (iOS) / `WorkManager` (Android)
4. **Durable:** SQLite `bangi.db` + `events.jsonl` append-only, auto-retry, offline queue, health `/health`

## Build Commands
```bash
# Shared core
npm create vite@latest packages/core -- --template preact-ts && npm i
# Desktop (macOS)
cargo install tauri-cli
npm run tauri build  # → src-tauri/target/release/bundle/dmg/Bangi_0.2.0_x64.dmg (5MB)
# Mobile
npx cap add android && npx cap add ios
npx cap build android  # → android/app/build/outputs/apk/debug/app-debug.apk (~8MB)
npx cap build ios      # → Xcode archive, TestFlight
# PWA
npm run build && npx cap copy
```

## ARB Checklist for MVP
- [ ] ADR-001…004 signed, C4 L2 reviewed
- [ ] `config.yaml` validates via Zod, remote config via Firebase works
- [ ] E2E Playwright: `task('apply jobs')` → 1 job applied, `task('check CRM')` → report
- [ ] Lightweight: cold start <2s, RAM <120MB, install <50MB verified on Android 13 + macOS 14 + iOS 17
- [ ] Durable: kill app mid-task → resume from `events.jsonl` → completes
