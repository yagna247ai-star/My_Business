# Bangi — Full ARB Artifacts Package
Ready for Architecture Review Board (ARB) — C4 + ADR + NFRs

## 1. Prototype vs MVP vs GA
| Stage | Code | Install | Computer-Use | CRM/Jobs | Ship |
|-------|------|---------|--------------|----------|------|
| Prototype (NOW) | `frontend/index.html` + `backend/app.py` mock | 0MB (open HTML) | Demo SOM [1][2][3] log | Mock 22 leads / 24 jobs | This repo |
| MVP (W2-3) | Tauri + Capacitor + core | 5-8MB | Real cua-driver MCP | Real Hermes + Naukri selectors YAML | TestFlight / DMG / APK |
| GA (W4) | + Remote Config + Sync + Store | <50MB | Hybrid (API preferred) | HubSpot/Sheets adapters | Play Store + App Store + .dmg |

## 2. Code Artifacts
```
BANGI_Agent/
├── ARCHITECTURE.md, config.yaml, README.md
├── frontend/index.html  — 12-col Antigravity GUI, SOM preview (DONE)
├── backend/app.py       — FastAPI hybrid proxy (DONE)
├── backend/requirements.txt, .env.example
├── docs/PROTOTYPE.md, docs/MVP.md, docs/ARCHITECTURE_ARTIFACTS.md
├── packages/core/       — (MVP) task-planner, som-client, job-applier (create with `npm init`)
├── src-tauri/           — (MVP) Tauri Rust, cua-driver sidecar
├── capacitor.config.ts  — (MVP) Capacitor wrapper for Android/iOS
└── config/jobs.selectors.yaml — (MVP) per-site CSS selectors, hot-swappable
```

## 3. NFRs (ARB sign-off)
- Configurable: 100% via `config.yaml` + Firebase Remote Config, no rebuild
- Durable: SQLite + JSONL + retry + health, Works offline, WorkManager/BGTask 15m
- Lightweight: Web 30KB, Desktop 5MB (Tauri), Mobile 8MB, RAM <120MB, cold <2s
- Cross-platform: 95% shared TypeScript, PWA offline, Tauri macOS/Win, Capacitor Android/iOS
- Security: Keychain/Keystore, OAuth PKCE, approval hook, screenshot redaction

## 4. How to Present to ARB
1. Demo Prototype: open `frontend/index.html`, type `Apply jobs` → show SOM log
2. Show `ARCHITECTURE.md` C4 L2 + ADR-001…004
3. Show `config.yaml` — toggle `jobs.providers` live
4. Commit MVP plan `docs/MVP.md` with build commands + lightweight proof

## 5. Immediate Next Steps (if you say `build MVP now`)
I scaffold `packages/core`, `src-tauri/`, `capacitor.config.ts`, `config/jobs.selectors.yaml` and generate installers — all in one go.
