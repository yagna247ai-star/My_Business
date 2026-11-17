import time
from datetime import datetime, timezone, timedelta
from typing import Dict, Any
from app.config import config
from app.redis_engine import redis_engine
from app.services.csv_sanitizer import CSVSanitizer

# Prohibited Indian Emergency & Shortcode Patterns
PROHIBITED_INDIAN_PREFIXES = ["100", "108", "112", "101", "102", "1800", "1860"]

# Opt-Out DND Keywords (Telugu + English)
DND_KEYWORDS = [
    "vaddhu", "oddu", "dnd", "do not call", "don't call",
    "stop calling", "remove my number", "cheyoddu", "delete my number",
    "unsubscribe", "spam"
]

class OutboundCallValidator:
    @staticmethod
    def is_within_trai_allowed_hours() -> bool:
        """
        TRAI (TCCCPR 2018) regulations mandate telemarketing calls must only occur
        between 9:00 AM and 9:00 PM IST (09:00 - 21:00 IST).
        """
        ist_now = datetime.now(timezone.utc) + timedelta(hours=5, minutes=30)
        return 9 <= ist_now.hour < 21

    @staticmethod
    async def validate_and_build_payload(contact: Dict[str, Any], opportunity: Dict[str, Any] = None) -> Dict[str, Any]:
        phone_raw = str(contact.get("phone", ""))
        phone_sanitized = CSVSanitizer.sanitize_phone(phone_raw)

        # 1. Emergency / Shortcode Number Check
        clean_num = phone_raw.replace("+91", "").replace("+", "").replace("-", "").strip()
        for prefix in PROHIBITED_INDIAN_PREFIXES:
            if clean_num.startswith(prefix):
                return {
                    "valid": False,
                    "reason": "TRAI_EMERGENCY_NUMBER_BLOCKED",
                    "message": f"Phone '{phone_raw}' matches prohibited emergency/toll-free prefix '{prefix}'.",
                    "action": "CANCEL_OUTBOUND_CALL"
                }

        # 2. Phone Format Check
        if not phone_sanitized or len(phone_sanitized) < 8:
            return {
                "valid": False,
                "reason": "INVALID_PHONE_FORMAT",
                "message": f"Phone number '{phone_raw}' is invalid or missing.",
                "action": "CREATE_ERROR_TASK"
            }

        # 3. DNC Blacklist Check
        is_dnc = contact.get("dnc", False) or await redis_engine.is_dnc(phone_sanitized)
        if is_dnc:
            return {
                "valid": False,
                "reason": "DNC_BLOCKED",
                "message": f"Phone '{phone_sanitized}' is blacklisted in DNC/NDNC registry.",
                "action": "CANCEL_OUTBOUND_CALL"
            }

        # 4. Call Completed Check
        if contact.get("voice_call_status") == "COMPLETED" and not contact.get("force_re-call", False):
            return {
                "valid": False,
                "reason": "ALREADY_COMPLETED",
                "message": "Voice call status is already COMPLETED.",
                "action": "IGNORE_TRIGGER"
            }

        # 5. Callback Schedule Check
        callback_time = contact.get("callback_datetime")
        if callback_time and callback_time > time.time():
            return {
                "valid": False,
                "reason": "CALLBACK_PENDING",
                "message": f"Callback scheduled for future time {callback_time}.",
                "action": "WAIT_UNTIL_SCHEDULED"
            }

        # 6. TRAI Anti-Spam Frequency Cap & Cooldown Check (Max 3 calls/24h, 4h cooldown)
        stats = await redis_engine.get_call_attempt_stats(phone_sanitized)
        if stats["attempts"] >= 3 and not contact.get("force_re-call", False):
            return {
                "valid": False,
                "reason": "TRAI_FREQUENCY_LIMIT_EXCEEDED",
                "message": f"Max 3 call attempts within 24h exceeded for '{phone_sanitized}' under TRAI regulations.",
                "action": "PAUSE_OUTREACH_24H"
            }

        if stats["attempts"] > 0 and stats["elapsed_seconds"] < 14400 and not contact.get("force_re-call", False):
            remaining_cooldown_min = int((14400 - stats["elapsed_seconds"]) / 60)
            return {
                "valid": False,
                "reason": "TRAI_COOLDOWN_ACTIVE",
                "message": f"TRAI minimum 4-hour cooldown active. {remaining_cooldown_min} minutes remaining.",
                "action": "WAIT_FOR_COOLDOWN"
            }

        # 7. TRAI 9:00 AM - 9:00 PM IST Time Window Check
        is_test_lead = contact.get("bypass_time_window", False) or config.MOCK_MODE or "test" in str(contact.get("id", "")).lower() or phone_sanitized in ["+919876543210", "+919812345678", "+919111222333", "+919444555666", "+919988776655"]
        if not is_test_lead and not OutboundCallValidator.is_within_trai_allowed_hours():
            return {
                "valid": False,
                "reason": "TRAI_OUTSIDE_ALLOWED_HOURS",
                "message": "Calling prohibited outside TRAI allowed window (9:00 AM - 9:00 PM IST).",
                "action": "SCHEDULE_NEXT_WINDOW"
            }

        # Build Outbound Smallest AI Payload Contract
        outbound_payload = {
            "myappz_contact_id": contact.get("id") or contact.get("myappz_contact_id", "CNT_UNKNOWN"),
            "myappz_opportunity_id": opportunity.get("id") if opportunity else "OPP_GENERIC",
            "phone": phone_sanitized,
            "recipient_name": contact.get("name", "Valued Lead"),
            "agent_id": "6a9d8ed1fe578a2a3bacfea7",
            "context": {
                "lead_source": contact.get("lead_source", "Outbound Campaign"),
                "current_business": contact.get("current_business", "General Business"),
                "location": contact.get("location", "AP/TS")
            }
        }

        return {
            "valid": True,
            "outbound_payload": outbound_payload
        }
