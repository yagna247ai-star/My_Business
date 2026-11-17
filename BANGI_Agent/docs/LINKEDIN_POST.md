# LinkedIn Post — Bangi × Hermes (v0.4)

**Images:** `BANGI_Agent/docs/assets/linkedin-slide-*.svg` (1080×1350) — export to PNG for upload.
**Docs link (first comment):** `BANGI_Agent/docs/BANGI_HERMES_INTEGRATION.html`
**Architecture images for post body:** `assets/arch-hybrid-router.svg`, `assets/arch-c4-container.svg`, `assets/capability-matrix.svg`

---

## Main Post (Copy-Paste Ready)

We made our personal computer-use agent 10× more powerful — without making it heavier. 🤖

Meet **Bangi v0.4 — Hermes-Powered**.

The problem: Bangi could click any desktop button via Meta Computer-Use (SOM + AX tree, pid-scoped, no cursor steal) — but every CRM check still opened Excel via screenshots. Slow. Expensive. Fragile.

The fix: **Hybrid Router (ADR-003)**
→ Direct Hermes skill API when it exists (tracker, coach, converter — 70% fewer tokens, ~0.5s)
→ SOM fallback only when no API exists (jobs, generic desktop)

Result:
✅ 10 RealEstate skills (Mama Hermes → Lead Converter) via /hermes/*
✅ 70 Hermes-Agent tools (file, browser, code, MCP) via registry
✅ 11 endpoints, event-sourced (~/.bangi/events.jsonl), replayable
✅ <50MB install, <120MB RAM — still lightweight
✅ config.yaml hot-swappable — Naukri→LinkedIn without rebuild

One endpoint for everything:
```
POST /computer-use {prompt: "check CRM / coach Yagna / apply jobs / any desktop task"}
```
Bangi picks the cheapest path automatically.

Stack: FastAPI + Preact (30KB) + cua-driver MCP + Hermes — Tauri (5MB) + Capacitor. Not Electron.

Docs + architecture diagrams → BANGI_Agent/docs/BANGI_HERMES_INTEGRATION.html
Health → /health • Swagger → /docs

What would you automate first with a hybrid computer-use agent? 👇

#ComputerUse #AIAgent #MetaAI #Hermes #Bangi #BuildInPublic #OpenSource #RealEstate #Automation #ProductEngineering

---

## First Comment (Docs Link)

Full integration docs with diagrams + API reference:
→ `BANGI_Agent/docs/BANGI_HERMES_INTEGRATION.html` (open in browser)
→ `BANGI_Agent/docs/HERMES_INTEGRATION.md` (markdown)

Covers: hybrid router, C4 container, all 10 skills + 70 tools, 11 endpoints, config (no rebuild), quickstart (uv run bangi), durability (events.jsonl).

---

## Carousel — 4 Slides (1080×1350)

Each slide is an SVG at `assets/linkedin-slide-{1..4}.svg`. Export to PNG: open SVG in browser → right-click → Save Image (ensure 1080×1350).

### Slide 1 — Hook
**Visual:** `linkedin-slide-1.svg` — "BANGI WAS A DEMO. NOW IT'S HERMES-POWERED." — gold on ink, 10 skills + 70 tools badge.
**Alt text:** Bangi v0.4 cover — Hermes-powered computer-use agent.

### Slide 2 — The Problem → Fix
**Visual:** `linkedin-slide-2.svg` — Before (thin demo, SOM for everything) vs After (hybrid router, direct API first).
**Copy on slide:**
- Before: 2 skills, SOM for every task, token-heavy, fragile
- After: 10 skills + 70 tools, hybrid, 70% cheaper, durable

### Slide 3 — Hybrid Router Diagram
**Visual:** `linkedin-slide-3.svg` — Simplified router flow: Prompt → BangiAgent → Direct API (fast) vs SOM fallback.
**Use:** Also post `assets/arch-hybrid-router.svg` as a standalone image in comments for engineers.

### Slide 4 — CTA
**Visual:** `linkedin-slide-4.svg` — "ONE ENDPOINT FOR EVERYTHING" + POST /computer-use + health/docs links + question.
**Copy on slide:** `POST /computer-use {prompt}` → Bangi picks direct vs SOM. What would you automate?

---

## Hashtags (for reach)

Primary: #ComputerUse #AIAgent #MetaAI
Secondary: #Hermes #Bangi #BuildInPublic #OpenSource
Niche: #RealEstate #Automation #ProductEngineering #Tauri #Capacitor

---

## Posting Checklist

- [ ] Export 4 SVGs to PNG (1080×1350) — keep file names slide-1..4
- [ ] Copy Main Post text above (keep line breaks + code block)
- [ ] Upload carousel PNGs in order 1→4 (LinkedIn carousel)
- [ ] Publish → immediately add First Comment with docs link
- [ ] Optional: add `arch-hybrid-router.svg` exported PNG as a comment reply for technical audience
- [ ] Tag: Meta AI, Hermes (if applicable), your team

---

## Image Assets Inventory

| File | Size | Use |
|---|---|---|
| `assets/linkedin-slide-1.svg` | 1080×1350 | Carousel slide 1 — cover |
| `assets/linkedin-slide-2.svg` | 1080×1350 | Carousel slide 2 — before/after |
| `assets/linkedin-slide-3.svg` | 1080×1350 | Carousel slide 3 — hybrid diagram |
| `assets/linkedin-slide-4.svg` | 1080×1350 | Carousel slide 4 — CTA |
| `assets/arch-hybrid-router.svg` | 1100×520 | Docs + LinkedIn comment image |
| `assets/arch-c4-container.svg` | 1100×560 | Docs + LinkedIn comment image |
| `assets/capability-matrix.svg` | 1100×420 | Docs + LinkedIn comment image |
