"""
BANGI Plugin & Skill Loader v0.5
================================
Dynamic skill registry using importlib. Safely discovers, loads, and executes skills
from Hermes-RealEstate, Hermes-Agent, or custom skill packages with fallback adapters.
"""
import os
import sys
import logging
import importlib.util
from pathlib import Path
from typing import Dict, Any, List, Optional, Callable, Type

logger = logging.getLogger("bangi.plugins")


class BaseSkill:
    """Abstract Base Class for Bangi Skills."""
    name: str = "base_skill"
    description: str = ""
    capabilities: List[str] = []

    def can_handle(self, prompt: str) -> bool:
        return False

    async def execute(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        raise NotImplementedError


class PluginRegistry:
    """
    Dynamic Plugin Loader & Registry for Bangi Agent.
    Manages module loading from configured filesystem paths.
    """

    def __init__(self, root_dir: Optional[Path] = None):
        self.root_dir = root_dir or Path(__file__).parent.parent
        self.skills: Dict[str, BaseSkill] = {}
        self.hermes_realestate_agent = None
        self.hermes_realestate_error = None
        self.hermes_agent_available = False
        self.hermes_tools: List[str] = []
        
        self.discover_plugins()

    def discover_plugins(self):
        """Discover and load external modules (Hermes-RealEstate and Hermes-Agent)."""
        # 1. Load Hermes-RealEstate
        re_path = (self.root_dir.parent / "RealEstate" / "hermes_automation").resolve()
        if re_path.exists():
            if str(re_path) not in sys.path:
                sys.path.insert(0, str(re_path))
            try:
                mod = importlib.import_module("main")
                if hasattr(mod, "HermesRealEstateAgent"):
                    self.hermes_realestate_agent = mod.HermesRealEstateAgent()
                    logger.info("✓ Plugin Loader: HermesRealEstateAgent successfully initialized")
            except Exception as e:
                self.hermes_realestate_error = str(e)
                logger.warning(f"Plugin Loader: Hermes-RealEstate import failed: {e}")
        else:
            self.hermes_realestate_error = f"Directory not found: {re_path}"

        # 2. Load Hermes-Agent / CUA Driver
        agent_path = (self.root_dir.parent / "Hermes-agent" / "hermes-agent").resolve()
        if agent_path.exists():
            if str(agent_path) not in sys.path:
                sys.path.insert(0, str(agent_path))
            try:
                reg_mod = importlib.import_module("tools.registry")
                if hasattr(reg_mod, "registry") and hasattr(reg_mod.registry, "_tools"):
                    self.hermes_tools = list(reg_mod.registry._tools.keys())
                else:
                    self.hermes_tools = ["computer_use", "file_operations", "browser_tool", "code_execution", "mcp_tool"]
                self.hermes_agent_available = True
                logger.info(f"✓ Plugin Loader: Hermes-Agent loaded ({len(self.hermes_tools)} tools)")
            except Exception as e:
                logger.warning(f"Plugin Loader: Hermes-Agent import failed: {e}")
                self.hermes_tools = []
                self.hermes_agent_available = False

    def register_skill(self, skill: BaseSkill):
        """Register a custom skill instance."""
        self.skills[skill.name] = skill
        logger.info(f"Registered skill: {skill.name}")

    def get_capabilities(self) -> List[str]:
        """Aggregate list of active system capabilities."""
        caps = []
        if self.hermes_realestate_agent:
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
        if self.hermes_agent_available:
            caps += [
                "computer_use (SOM overlays + AX tree, pid-scoped, non-focus-stealing)",
                "file_operations (read/write/search)",
                "browser_control (CDP + SOM, stealth)",
                "code_execution (sandboxed Python)",
                "mcp_gateway (100+ MCP servers)",
                "memory & cron (persistent sessions, scheduled tasks)",
            ]
        for name, skill in self.skills.items():
            caps += skill.capabilities

        caps += [
            "job_auto_apply (Naukri/LinkedIn/Indeed, config-driven selectors)",
            "personal_tasks (email, calendar, research, shopping)"
        ]
        return caps
