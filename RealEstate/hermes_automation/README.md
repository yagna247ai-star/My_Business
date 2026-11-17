# Hermes Agent Real Estate Automation — Abhinandhana Avenues

Autonomous sales, speed-to-lead qualification, 90-day multi-touch cadence, site visit confirmation protocol, NRI remote closing, EMI plot matching, sales tracker sync, and market intelligence scanner powered by **Hermes Agent** (Nous Research).

---

## 🏗️ System Architecture

```
hermes_automation/
├── .env.example                # Environment variables template
├── requirements.txt            # Python dependencies
├── main.py                     # Main Hermes Agent Runner & Webhook listener
├── memory/
│   └── buyer_personas.json     # 4 Core Buyer Personas (Gulf NRI, US NRI, Salaried, Investor)
├── skills/
│   ├── lead_qualifier.py       # Speed-to-Lead (<1 min SLA) & Bilingual qualification
│   ├── cadence_nurturer.py     # 90-Day multi-touch nurturing engine
│   ├── site_visit_scheduler.py # Site visit confirmation & show-rate recovery
│   ├── nri_remote_closing.py   # Video walkthroughs & digital token generation
│   ├── emi_plot_matcher.py     # Down payment & 12-60 month EMI calculator
│   ├── tracker_sync.py         # Real-time Excel sync & daily 8 PM GM digest
│   └── market_intel_scanner.py # AP & Telangana plot rates & corridor scanner
└── tests/
    └── test_all_skills.py      # Comprehensive Pytest test suite
```

---

## ⚡ Quickstart with `uv`

### 1. Environment Setup

This repository uses **`uv`** for ultra-fast dependency resolution and virtual environment management:

```bash
# Create virtual environment and install dependencies
uv venv
uv pip install -r requirements.txt
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Set your OpenRouter / Nous Hermes API key, WhatsApp provider keys (Green API / Twilio), and Telegram bot chat ID.

### 3. Run Test Suite

```bash
uv run pytest
```

### 4. Execute Main Agent Runner

```bash
uv run python main.py
```

---

## 🎯 Automated Funnel Leaks Addressed

1. **Leak #1 (Slow First Response):** < 1 min SLA bilingual (Telugu/English) response on Meta/WhatsApp leads.
2. **Leak #2 (Site Visit Show-Rate):** 24h & 2h reminders + landmark pickup + non-guilt scarcity no-show recovery script.
3. **Leak #3 (NRI & Long-Tail Decisions):** 90-day automated nurturing cadence + remote video walkthroughs + digital reservation token links.
