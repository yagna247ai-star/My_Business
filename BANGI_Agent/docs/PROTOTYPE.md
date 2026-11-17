# Bangi Prototype — Week 1 (This Repo)
**Goal:** Clickable GUI + mock computer-use loop, no native build required.

## Deliverables
- Glass GUI `frontend/index.html` (Antigravity, 12-col, SOM preview, Jobs + CRM panels, task bar)
- `backend/app.py` FastAPI `POST /computer-use` — hybrid: Hermes direct for CRM, demo SOM for jobs
- `config.yaml` hot-config, `events.jsonl` durable log

## Run prototype (30s)
```bash
cd BANGI_Agent
python -m venv .venv && source .venv/bin/activate
pip install -r backend/requirements.txt
python backend/app.py  # http://localhost:8000
open frontend/index.html  # or http://localhost:8000/static/index.html
```
Type: `Apply 10 jobs on Naukri` or `Check CRM lead status` — see SOM log `capture → click index 1 → verify`.

## Validation
- [ ] GUI loads, SOM overlays visible [1][2][3]
- [ ] Task bar → log shows `capture → computer_use {click index 1}`
- [ ] CRM panel shows 22 leads (Hermes mock)
- [ ] Jobs panel shows 18 LinkedIn + 6 Naukri
