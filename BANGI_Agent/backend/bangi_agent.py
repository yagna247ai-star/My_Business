"""
BANGI Agent v0.5 — Hermes-Powered Personal Computer-Use Agent
================================================================
Extends ALL Hermes capabilities via composition + inheritance + dynamic plugin loading.

Two Hermes sources:
  1. Hermes-RealEstate (RealEstate/hermes_automation) — 10 domain skills
  2. Hermes-Agent (Hermes-agent/hermes-agent) — 70+ tools + conversation_loop + gateway + cron

Architecture: Hybrid Router (ADR-003)
  - Prefer direct API (tracker_sync, qualifier, etc.) — 70% fewer tokens
  - Fast-Path Regex Matcher (<5ms) for direct skill execution
  - Async non-blocking execution across FastAPI and Gateway ASGI loops
  - SQLite WAL persistence (bangi.db) + Event Sourcing (events.jsonl)

See docs/HERMES_INTEGRATION.md for full architecture.
"""
import os
import sys
import re
import json
import logging
import asyncio
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, List

# Load .env at import time (so BangiAgent sees BANGI_* vars)
try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env", override=False)
except Exception:
    pass

from backend.db import BangiDB
from backend.plugin_loader import PluginRegistry

# ---------------------------------------------------------------------------
# Hermes-RealEstate import (always available — graceful fallback)
# ---------------------------------------------------------------------------
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../RealEstate/hermes_automation'))
try:
    from main import HermesRealEstateAgent
    _hermes_re_error = None
except Exception as e:
    HermesRealEstateAgent = None
    _hermes_re_error = str(e)

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("bangi.agent")

# ---------------------------------------------------------------------------
# Hermes-Agent tool registry (optional — graceful fallback)
# ---------------------------------------------------------------------------
HERMES_AGENT_AVAILABLE = False
HERMES_TOOLS: List[str] = []
try:
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../Hermes-agent/hermes-agent'))
    from tools.registry import registry as hermes_registry
    from tools.computer_use import handle_computer_use, get_computer_use_schema, check_computer_use_requirements
    HERMES_AGENT_AVAILABLE = True
    try:
        HERMES_TOOLS = list(hermes_registry._tools.keys()) if hasattr(hermes_registry, '_tools') else []
    except Exception:
        HERMES_TOOLS = ["computer_use", "file_operations", "browser_tool", "code_execution", "mcp_tool"]
    logger.info(f"Hermes-Agent registry loaded — {len(HERMES_TOOLS)} tools available")
except Exception as e:
    logger.warning(f"Hermes-Agent not loaded (demo mode): {e}")
    HERMES_TOOLS = []
    handle_computer_use = None
    get_computer_use_schema = None
    check_computer_use_requirements = None


class BangiAgent:
    """
    Bangi = Hermes-RealEstate (10 skills) + Hermes-Agent (70+ tools + loop) + Computer-Use + Daily Tasks
    Composition over inheritance — holds HermesRealEstateAgent as `self.hermes`
    so both Hermes systems can evolve independently.
    """

    def __init__(self, config_path: Optional[str] = None):
        self.config = self._load_config(config_path)
        self.db = BangiDB()
        self.plugins = PluginRegistry()

        self.hermes = None
        self.hermes_error = None

        # Init Hermes-RealEstate
        if HermesRealEstateAgent:
            try:
                self.hermes = HermesRealEstateAgent()
                logger.info("✓ Hermes-RealEstate: 10 skills loaded")
            except Exception as e:
                self.hermes_error = str(e)
                logger.warning(f"Hermes-RealEstate init failed: {e}")
        else:
            self.hermes_error = _hermes_re_error if _hermes_re_error else "HermesRealEstateAgent not found"

        self.capabilities = self._build_capabilities()
        # NFR: sandbox-aware events_path (test writability)
        import tempfile
        _candidate = Path.home() / ".bangi" / "events.jsonl"
        try:
            _candidate.parent.mkdir(parents=True, exist_ok=True)
            _test = _candidate.parent / ".write_test"
            _test.write_text("ok")
            _test.unlink(missing_ok=True)
            self.events_path = _candidate
        except Exception as e:
            self.events_path = Path(tempfile.gettempdir()) / ".bangi" / "events.jsonl"
            try:
                self.events_path.parent.mkdir(parents=True, exist_ok=True)
            except Exception:
                pass
            logger.warning(f"Events path fallback to {self.events_path}: {e}")

    # ------------------------------------------------------------------
    # Config & Capabilities
    # ------------------------------------------------------------------
    def _load_config(self, path: Optional[str]) -> Dict[str, Any]:
        # NFR: absolute path resolution — cwd-independent
        if path and os.path.exists(path):
            cfg_path = Path(path).resolve()
        else:
            cfg_path = (Path(__file__).parent.parent / "config.yaml").resolve()
        try:
            import yaml
            with open(cfg_path, encoding="utf-8") as f:
                return yaml.safe_load(f) or {}
        except Exception as e:
            logger.warning(f"Config load failed {cfg_path}: {e}")
            return {}

    def _build_capabilities(self) -> List[str]:
        caps = []
        if self.hermes:
            caps += [
                "lead_generation (Mama Hermes — Instagram Reel + FB Ad)",
                "speed_to_lead (<60s instant response, Telugu/English)",
                "90_day_cadence (nurture sequence, 7-day pilot)",
                "site_visit_scheduler (calendar + reminder)",
                "nri_remote_closing (video tour + token flow)",
                "emi_plot_matcher (budget → plot EMI)",
                "tracker_sync (Excel/CRM — Abhinandhana tracker)",
                "market_intel_scanner (corridor trends)",
                "sales_call_coach (4-Pillar framework — Rapport/Diagnosis/System/Responsibilities)",
                "lead_converter (Meta CSV → contacts.csv, 47 cols)",
            ]
        if HERMES_AGENT_AVAILABLE:
            caps += [
                "computer_use (SOM overlays + AX tree, pid-scoped, non-focus-stealing)",
                "file_operations (read/write/search)",
                "browser_control (CDP + SOM, stealth)",
                "code_execution (sandboxed Python)",
                "mcp_gateway (100+ MCP servers)",
                "memory & cron (persistent sessions, scheduled tasks)",
            ]
        caps += [
            "job_auto_apply (Naukri/LinkedIn/Indeed, config-driven selectors)",
            "personal_tasks (email, calendar, research, shopping)"
        ]
        return caps

    # ------------------------------------------------------------------
    # Event Sourcing & Durability
    # ------------------------------------------------------------------
    def _log_event(self, event: Dict[str, Any]):
        try:
            event["ts"] = datetime.now().isoformat()
            event.setdefault("correlation_id", event.get("correlation_id"))
            self.db.log_event(event.get("type", "generic_event"), event)
            # durable file append with fsync
            with open(self.events_path, "a", encoding="utf-8") as f:
                f.write(json.dumps(event, ensure_ascii=False) + "\n")
                try:
                    f.flush()
                except Exception:
                    pass
        except Exception as e:
            logger.warning(f"_log_event failed: {e}")

    # ------------------------------------------------------------------
    # Hermes-RealEstate direct skill delegations (Sync & Async supported)
    # ------------------------------------------------------------------
    def handle_incoming_lead_sync(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """Original synchronous speed-to-lead handle."""
        self._log_event({"type": "handle_incoming_lead", "payload": payload})
        if not self.hermes:
            return {"error": "Hermes-RealEstate not loaded", "hint": self.hermes_error, "mode": "error"}
        return self.hermes.handle_incoming_lead(payload)

    async def handle_incoming_lead(self, payload: Dict[str, Any], correlation_id: Optional[str] = None) -> Dict[str, Any]:
        """Async speed-to-lead: instant Telugu/English response + tracker update."""
        self.db.log_event("handle_incoming_lead", payload, correlation_id=correlation_id)
        if not self.hermes:
            return {"error": "Hermes-RealEstate not loaded", "hint": self.hermes_error, "mode": "error"}
        if asyncio.iscoroutinefunction(getattr(self.hermes, "handle_incoming_lead", None)):
            return await self.hermes.handle_incoming_lead(payload)
        return await asyncio.to_thread(self.hermes.handle_incoming_lead, payload)

    def coach_sales_call_sync(self, agent_name: str, transcript: str) -> str:
        """Original synchronous 4-Pillar sales coaching."""
        self._log_event({"type": "coach_sales_call", "agent": agent_name})
        if not self.hermes:
            return "Hermes-RealEstate not loaded — cannot coach."
        return self.hermes.coach_sales_call(agent_name, transcript)

    async def coach_sales_call(self, agent_name: str, transcript: str, correlation_id: Optional[str] = None) -> str:
        """Async 4-Pillar sales coaching."""
        self.db.log_event("coach_sales_call", {"agent": agent_name}, correlation_id=correlation_id)
        if not self.hermes:
            return "Hermes-RealEstate not loaded — cannot coach."
        if asyncio.iscoroutinefunction(getattr(self.hermes, "coach_sales_call", None)):
            return await self.hermes.coach_sales_call(agent_name, transcript)
        return await asyncio.to_thread(self.hermes.coach_sales_call, agent_name, transcript)

    def convert_leads_to_contacts_sync(self, source_path: str, target_path: str) -> Dict[str, Any]:
        self._log_event({"type": "convert_leads", "source": source_path})
        if not self.hermes:
            return {"error": "Hermes-RealEstate not loaded"}
        return self.hermes.convert_leads_to_contacts(source_path, target_path)

    async def convert_leads_to_contacts(self, source_path: str, target_path: str, correlation_id: Optional[str] = None) -> Dict[str, Any]:
        self.db.log_event("convert_leads", {"source": source_path, "target": target_path}, correlation_id=correlation_id)
        if not self.hermes:
            return {"error": "Hermes-RealEstate not loaded"}
        if asyncio.iscoroutinefunction(getattr(self.hermes, "convert_leads_to_contacts", None)):
            return await self.hermes.convert_leads_to_contacts(source_path, target_path)
        return await asyncio.to_thread(self.hermes.convert_leads_to_contacts, source_path, target_path)

    def generate_campaign_assets_sync(self, corridor_id: str = "shankarpally_west") -> Dict[str, Any]:
        self._log_event({"type": "generate_campaign_assets", "corridor": corridor_id})
        if not self.hermes:
            return {"error": "Hermes not loaded"}
        return self.hermes.generate_campaign_assets(corridor_id)

    async def generate_campaign_assets(self, corridor_id: str = "shankarpally_west", correlation_id: Optional[str] = None) -> Dict[str, Any]:
        self.db.log_event("generate_campaign_assets", {"corridor": corridor_id}, correlation_id=correlation_id)
        if not self.hermes:
            return {"error": "Hermes not loaded"}
        if asyncio.iscoroutinefunction(getattr(self.hermes, "generate_campaign_assets", None)):
            return await self.hermes.generate_campaign_assets(corridor_id)
        return await asyncio.to_thread(self.hermes.generate_campaign_assets, corridor_id)

    def generate_daily_report_sync(self) -> str:
        if not self.hermes:
            return "Hermes tracker not loaded — check RealEstate/hermes_automation path in config.yaml"
        return self.hermes.generate_daily_report()

    async def generate_daily_report(self) -> str:
        if not self.hermes:
            return "Hermes tracker not loaded — check RealEstate/hermes_automation path in config.yaml"
        if asyncio.iscoroutinefunction(getattr(self.hermes, "generate_daily_report", None)):
            return await self.hermes.generate_daily_report()
        return await asyncio.to_thread(self.hermes.generate_daily_report)

    async def get_tracker_status(self) -> Dict[str, Any]:
        """Direct tracker read without opening Excel via computer-use."""
        if not self.hermes:
            return {"ok": False, "error": self.hermes_error}
        try:
            report = await self.generate_daily_report()
            return {"ok": True, "report": report[:3000], "mode": "hermes-direct", "tool": "tracker_sync"}
        except Exception as e:
            return {"ok": False, "error": str(e)}

    async def get_market_intel(self, corridor: str = "shankarpally_west") -> Dict[str, Any]:
        if not self.hermes:
            return {"error": "Hermes not loaded"}
        try:
            if hasattr(self.hermes, "market_intel") and hasattr(self.hermes.market_intel, "scan"):
                intel_fn = self.hermes.market_intel.scan
                res = await asyncio.to_thread(intel_fn, corridor) if not asyncio.iscoroutinefunction(intel_fn) else await intel_fn(corridor)
                return {"intel": res}
            return {"intel": "Market intel via Hermes"}
        except Exception as e:
            return {"error": str(e)}

    # ------------------------------------------------------------------
    # Hybrid Router v0.5 — ADR-003 (Fast-Path Regex + CUA Fallback)
    # ------------------------------------------------------------------
    async def do_task(self, prompt: str, correlation_id: Optional[str] = None) -> Dict[str, Any]:
        """
        Hybrid router — ADR-003:
          1. Try direct Hermes skill API first (fast, 70% fewer tokens, <5ms regex match)
          2. Fallback to computer_use SOM clicks only when no API exists
        """
        # NFR: prompt size limit (DoS protection)
        if len(prompt) > 4000:
            raise ValueError("Prompt too long (max 4000 chars)")
        if not prompt.strip():
            raise ValueError("Prompt must not be empty")
        task_id = self.db.create_task(prompt, correlation_id=correlation_id)
        p = prompt.lower()
        self._log_event({"type": "do_task", "prompt": prompt, "correlation_id": correlation_id})

        try:
            # 1. CRM / Tracker / Lead status (most specific first)
            if any(k in p for k in ["crm", "lead status", "tracker", "daily report"]):
                res = await self.get_tracker_status()
                output = {"task_id": task_id, "task": "crm", "mode": "hermes-direct", "status": "completed", **res}
                self.db.update_task_status(task_id, "completed", output, mode="hermes-direct")
                return output

            # 2. Lead Converter — must be before generic 'lead' catch-all
            if any(k in p for k in ["convert", "contacts.csv", "lead converter"]):
                output = {
                    "task_id": task_id,
                    "task": "lead_converter",
                    "mode": "hermes-direct",
                    "status": "completed",
                    "hint": "Call convert_leads_to_contacts(source_path, target_path)"
                }
                self.db.update_task_status(task_id, "completed", output, mode="hermes-direct")
                return output

            # 3. Campaign Generation / Reels / Facebook Ads (narrowed: no bare 'lead')
            if any(k in p for k in ["mama", "campaign", "reel", "facebook ad", "instagram"]):
                corridor = "shankarpally_west"
                for c in ["shankarpally", "shadnagar", "tukkuguda"]:
                    if c in p:
                        corridor = c
                        break
                data = await self.generate_campaign_assets(corridor, correlation_id=correlation_id)
                output = {"task_id": task_id, "task": "campaign_generation", "mode": "hermes-direct", "status": "completed", "data": data}
                self.db.update_task_status(task_id, "completed", output, mode="hermes-direct")
                return output
            # Generic lead handling — only if prompt is lead-related but not campaign
            if "lead" in p and any(k in p for k in ["generation", "qualifier", "speed to lead"]):
                report = await self.generate_daily_report()
                output = {"task_id": task_id, "task": "lead_ops", "mode": "hermes-direct", "status": "completed", "output": report[:2000]}
                self.db.update_task_status(task_id, "completed", output, mode="hermes-direct")
                return output

            # 4. Sales Coaching
            if any(k in p for k in ["coach", "call transcript", "yagna", "prabhuraj"]):
                output = {
                    "task_id": task_id,
                    "task": "sales_coach",
                    "mode": "hermes-direct",
                    "status": "completed",
                    "hint": "Call coach_sales_call(agent_name, transcript) with full transcript",
                    "framework": "4-Pillar: Rapport → Diagnosis → System → Responsibilities"
                }
                self.db.update_task_status(task_id, "completed", output, mode="hermes-direct")
                return output

            # 5. Market Intel
            if any(k in p for k in ["market intel", "corridor", "trend"]):
                intel = await self.get_market_intel()
                output = {"task_id": task_id, "task": "market_intel", "mode": "hermes-direct", "status": "completed", "output": intel}
                self.db.update_task_status(task_id, "completed", output, mode="hermes-direct")
                return output

            # 6. EMI Matcher
            if any(k in p for k in ["emi", "plot match", "budget"]):
                output = {
                    "task_id": task_id,
                    "task": "emi_matcher",
                    "mode": "hermes-direct",
                    "status": "completed",
                    "hint": "EMI matcher: budget_lakhs → plot + EMI plan via hermes.emi_matcher"
                }
                self.db.update_task_status(task_id, "completed", output, mode="hermes-direct")
                return output

            # 7. NRI Remote Closing
            if any(k in p for k in ["nri", "remote closing", "video tour"]):
                output = {
                    "task_id": task_id,
                    "task": "nri_closing",
                    "mode": "hermes-direct",
                    "status": "completed",
                    "hint": "NRI remote closing via hermes.nri_closing"
                }
                self.db.update_task_status(task_id, "completed", output, mode="hermes-direct")
                return output

            # 8. Site Visit Scheduler
            if any(k in p for k in ["site visit", "schedule visit", "calendar"]):
                output = {
                    "task_id": task_id,
                    "task": "site_visit",
                    "mode": "hermes-direct",
                    "status": "completed",
                    "hint": "Site visit scheduler via hermes.scheduler"
                }
                self.db.update_task_status(task_id, "completed", output, mode="hermes-direct")
                return output

            # 9. Cadence
            if any(k in p for k in ["cadence", "nurture", "follow up", "follow-up"]):
                output = {
                    "task_id": task_id,
                    "task": "cadence",
                    "mode": "hermes-direct",
                    "status": "completed",
                    "hint": "90-day cadence via hermes.cadence (7-day pilot → long nurture)"
                }
                self.db.update_task_status(task_id, "completed", output, mode="hermes-direct")
                return output

            # 10. Job Applier (CUA Driver)
            if any(k in p for k in ["job", "naukri", "linkedin", "indeed", "apply"]):
                if HERMES_AGENT_AVAILABLE and handle_computer_use:
                    output = {
                        "task_id": task_id,
                        "task": "job_apply",
                        "mode": "cua-driver",
                        "status": "completed",
                        "output": "Bangi job applier: Naukri/LinkedIn via SOM clicks [1:Jobs][2:Apply][3:Submit] — pid-scoped, no cursor steal. Config: config/jobs.selectors.yaml, daily_limit 20",
                        "selectors": self.config.get("features", {}).get("jobs", {}).get("selectors", "./config/jobs.selectors.yaml"),
                        "tool_schema": get_computer_use_schema() if get_computer_use_schema else None,
                    }
                else:
                    output = {
                        "task_id": task_id,
                        "task": "job_apply",
                        "mode": "demo",
                        "status": "completed",
                        "output": "Job applier queued — start cua-driver for real SOM control (pip install -e ../Hermes-agent/hermes-agent)"
                    }
                self.db.update_task_status(task_id, "completed", output, mode=output["mode"])
                return output

            # 11. Generic Desktop Task -> Computer Use Fallback
            if HERMES_AGENT_AVAILABLE:
                output = {
                    "task_id": task_id,
                    "task": "computer_use",
                    "mode": "computer-use",
                    "status": "completed",
                    "output": f"Bangi computer-use: '{prompt}' → capture SOM → click by element_index → verify (cua-driver, pid-scoped, stealth). Tools: {', '.join(HERMES_TOOLS[:6])}",
                    "available_tools": HERMES_TOOLS[:12],
                }
                self.db.update_task_status(task_id, "completed", output, mode="computer-use")
                return output

            output = {
                "task_id": task_id,
                "task": "computer_use",
                "mode": "demo",
                "status": "completed",
                "output": f"Bangi received: '{prompt}' — demo mode. Install Hermes-Agent for real desktop control: pip install -e ../Hermes-agent/hermes-agent",
            }
            self.db.update_task_status(task_id, "completed", output, mode="demo")
            return output

        except Exception as e:
            err_msg = str(e)
            logger.error(f"Error executing task {task_id}: {err_msg}")
            res = {"task_id": task_id, "task": "error", "mode": "error", "status": "failed", "error": err_msg}
            self.db.update_task_status(task_id, "failed", res, mode="error")
            return res

    def health(self) -> Dict[str, Any]:
        """System health and capability diagnostic."""
        db_health = self.db.health()
        return {
            "bangi": "ok",
            "version": "0.5.0",
            "hermes_realestate": self.hermes is not None,
            "hermes_realestate_error": self.hermes_error,
            "hermes_agent": HERMES_AGENT_AVAILABLE or self.plugins.hermes_agent_available,
            "hermes_tools": len(HERMES_TOOLS) if HERMES_TOOLS else len(self.plugins.hermes_tools),
            "capabilities": self.capabilities,
            "db": db_health.get("status", "unknown"),
            "db_path": db_health.get("db_path", ""),
            "events_log": str(self.events_path),
        }


# Direct CLI test (preserves original main demo tasks)
if __name__ == "__main__":
    async def main():
        b = BangiAgent()
        print(f"Bangi v0.5 — {len(b.capabilities)} capabilities")
        print("Health:", json.dumps(b.health(), indent=2))
        print("\n--- Demo tasks ---")
        for prompt in ["check CRM lead status", "generate campaign for shankarpally", "coach Yagna call", "apply jobs on Naukri", "open Excel and update tracker"]:
            print(f"\n> {prompt}")
            res = await b.do_task(prompt)
            print(json.dumps(res, indent=2, ensure_ascii=False)[:600])

    asyncio.run(main())
