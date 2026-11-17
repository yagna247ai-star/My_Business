import hmac
import hashlib
import time
import logging
from typing import Dict, Any
from app.redis_engine import redis_engine
from app.services.voice_event_engine import VoiceEventEngine
from app.services.crm_webhook import CRMWebhookService

logger = logging.getLogger("result_processor")

class WebhookResultProcessor:
    @staticmethod
    def verify_signature(payload_bytes: bytes, signature: str, secret: str = "smallest_webhook_secret_key") -> bool:
        if not signature:
            return False
        expected_sig = hmac.new(secret.encode("utf-8"), payload_bytes, hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected_sig, signature.replace("sha256=", ""))

    @classmethod
    async def process_incoming_webhook(cls, payload: Dict[str, Any], raw_bytes: bytes = None, signature: str = None) -> Dict[str, Any]:
        # 1. Validate Signature (if provided)
        if signature and raw_bytes:
            valid_sig = cls.verify_signature(raw_bytes, signature)
            if not valid_sig:
                return {"success": False, "reason": "INVALID_SIGNATURE", "status_code": 401}

        contact_id = payload.get("contact_id") or payload.get("myappz_contact_id")
        if not contact_id:
            return {"success": False, "reason": "MISSING_CONTACT_ID", "status_code": 400}

        session_id = payload.get("voice_session_id") or payload.get("call_id", f"call_{int(time.time())}")

        # 2. Acquire Redis SETNX Idempotency Lock
        acquired_lock = await redis_engine.acquire_idempotency_lock(session_id, ttl_seconds=86400)
        if not acquired_lock:
            logger.warning(f"Duplicate webhook attempt blocked by Redis SETNX for session_id={session_id}")
            return {
                "success": False,
                "reason": "DUPLICATE_EVENT_BLOCKED",
                "session_id": session_id,
                "status_code": 200  # Return 200 to prevent provider retry loop
            }

        # 3. Execute Voice Event Lifecycle Engine
        event_res = await VoiceEventEngine.process_event(payload)

        # 4. Dispatch CRM Pipeline Sync
        crm_res = None
        if event_res.get("success") and event_res.get("summary"):
            crm_res = await CRMWebhookService.dispatch_pipeline_update(event_res["summary"])

        return {
            "success": True,
            "session_id": session_id,
            "contact_id": contact_id,
            "event_processed": event_res,
            "crm_dispatch": crm_res
        }
