"""
Hermes Agent Skill: Speed-to-Lead & Bilingual Qualification Engine
Achieves < 1 min SLA response on incoming leads across WhatsApp, Meta Leads, and Web forms.
Integrates Abhinandhana Avenues legacy & company performance proof.
"""

import json
import os
import logging
from typing import Dict, Any, Tuple

logger = logging.getLogger("hermes.skills.lead_qualifier")

class LeadQualifierSkill:
    def __init__(self, personas_file_path: str, company_file_path: str = None):
        with open(personas_file_path, "r", encoding="utf-8") as f:
            data = json.load(f)
            self.personas = data.get("personas", [])

        if company_file_path and os.path.exists(company_file_path):
            with open(company_file_path, "r", encoding="utf-8") as f:
                self.company_info = json.load(f)
        else:
            self.company_info = {
                "legacy_years": 15,
                "satisfied_customers": 5000,
                "completed_projects": 22,
                "avg_appreciation": "28.5%"
            }

    def generate_instant_response(self, lead_name: str, language: str = "te_en") -> str:
        legacy_text = f"🏆 15+ Years Legacy | 5,000+ Happy Buyers | 100% HMDA & RERA Approved"
        
        if language == "te":
            return (
                f"నమస్కారం {lead_name} 🙏 నేను అభినందన అవెన్యూస్ నుండి మాట్లాడుతున్నాను.\n"
                f"({legacy_text})\n\n"
                f"మా ఓపెన్ ప్లాట్ల వివరాలు 10 నిమిషాల్లో పంపడానికి దయచేసి 2 విషయాలు చెప్పగలరా:\n"
                f"1. మీరు ఏ ఏరియా / కారిడార్ లో ప్లాట్ చూస్తున్నారు (Shankarpally, Shadnagar, Ghatkesar)?\n"
                f"2. మీ బడ్జెట్ అంచనా ఎంత? (Easy 12-60 Months EMI ఆప్షన్లు కూడా ఉన్నాయి)"
            )
        elif language == "en":
            return (
                f"Namaste {lead_name} 🙏 Thank you for reaching out to Abhinandhana Avenues.\n"
                f"({legacy_text})\n\n"
                f"To share verified plot layout brochures within 10 minutes, please reply with:\n"
                f"1. Preferred Location (e.g. Shankarpally, Shadnagar, Ghatkesar)?\n"
                f"2. Preferred Budget Range (e.g. ₹5-15L, ₹15-30L, or ₹30L+)?"
            )
        else:
            return (
                f"Namaste {lead_name} 🙏 / నమస్కారం!\n"
                f"Welcome to Abhinandhana Avenues — {legacy_text}.\n\n"
                f"To send you perfect plot details & brochure PDF in 10 mins, please reply with:\n"
                f"1. Preferred Location / ఏరియా (Shankarpally, Shadnagar, Ghatkesar, Warangal HW)?\n"
                f"2. Budget Range / బడ్జెట్ (Easy 12-60 Month EMI options available)?"
            )

    def classify_persona(self, location: str, budget_lakhs: float, residence: str = "India") -> Dict[str, Any]:
        residence_lower = residence.lower()
        if "gulf" in residence_lower or "uae" in residence_lower or "saudi" in residence_lower or "qatar" in residence_lower or "kuwait" in residence_lower:
            persona_id = "gulf_nri"
        elif "usa" in residence_lower or "uk" in residence_lower or "canada" in residence_lower or "nri" in residence_lower:
            persona_id = "us_uk_nri"
        elif budget_lakhs >= 35.0 or "investor" in location.lower() or "rrr" in location.lower():
            persona_id = "small_investor"
        else:
            persona_id = "salaried_pro"

        matched = next((p for p in self.personas if p["id"] == persona_id), self.personas[2])
        logger.info(f"Classified lead (budget={budget_lakhs}L, loc={location}, res={residence}) as '{matched['name']}'")
        return matched


if __name__ == "__main__":
    base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    personas_p = os.path.join(base_dir, "memory", "buyer_personas.json")
    company_p = os.path.join(base_dir, "memory", "company_profile.json")
    qualifier = LeadQualifierSkill(personas_p, company_p)
    print(qualifier.generate_instant_response("Srinivas", "te_en"))
