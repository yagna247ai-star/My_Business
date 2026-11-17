from typing import Dict, Any
from app.models.crm_custom_fields import LeadTemperature, CallOutcome

class PipelineScoreRouter:
    @staticmethod
    def calculate_score(motivation: int, business_fit: int, commitment: int, capital: int, network: int) -> int:
        """Sum sub-scores (0-3 each) into aggregate lead score (0-15)."""
        m = max(0, min(3, motivation))
        b = max(0, min(3, business_fit))
        c = max(0, min(3, commitment))
        cap = max(0, min(3, capital))
        net = max(0, min(3, network))
        return m + b + c + cap + net

    @classmethod
    def route_pipeline_stage(cls, score: int, call_outcome: str) -> Dict[str, Any]:
        """Route pipeline stage, temperature rating, and automation actions based on score & call outcome."""
        outcome_upper = call_outcome.upper()

        # 1. Permanent Opt-Out / DNC Exception
        if outcome_upper in ["DNC", "DO_NOT_CALL", "OPTED_OUT"]:
            return {
                "pipeline_stage": "DO NOT CALL",
                "lead_temperature": LeadTemperature.LOW,
                "dnc_flag": True,
                "priority": "None",
                "target_action": "STOP_ALL_WORKFLOWS",
                "waba_nurture": False,
                "create_human_task": False
            }

        # 2. Callback Exception
        if outcome_upper in ["CALLBACK", "BUSY"]:
            return {
                "pipeline_stage": "CALLBACK QUEUE",
                "lead_temperature": LeadTemperature.MEDIUM,
                "dnc_flag": False,
                "priority": "Medium",
                "target_action": "SCHEDULE_CALLBACK_WAIT",
                "waba_nurture": False,
                "create_human_task": False
            }

        # 3. Score-based Classification
        if score >= 11:
            temperature = LeadTemperature.HOT
            stage = "HUMAN CALL REQUIRED"
            priority = "High"
            action = "CREATE_CLOSER_TASK"
            waba = True
            create_task = True
        elif score >= 8:
            temperature = LeadTemperature.WARM
            stage = "WARM NURTURE"
            priority = "Medium"
            action = "TRIGGER_WABA_SEQUENCE"
            waba = True
            create_task = False
        elif score >= 5:
            temperature = LeadTemperature.MEDIUM
            stage = "NURTURE"
            priority = "Low"
            action = "STANDARD_NURTURE"
            waba = False
            create_task = False
        else:
            temperature = LeadTemperature.LOW
            stage = "NOT NOW / NO FIT"
            priority = "Low"
            action = "ARCHIVE_LEAD"
            waba = False
            create_task = False

        return {
            "pipeline_stage": stage,
            "lead_temperature": temperature,
            "dnc_flag": False,
            "priority": priority,
            "target_action": action,
            "waba_nurture": waba,
            "create_human_task": create_task
        }
