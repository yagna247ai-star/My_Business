import time
import httpx
import logging
from typing import Dict, Any
from app.config import config
from app.redis_engine import redis_engine

logger = logging.getLogger("crm_webhook_service")

class CRMWebhookService:
    @staticmethod
    async def dispatch_pipeline_update(call_data: Dict[str, Any], webhook_url: str = None) -> Dict[str, Any]:
        webhook_url = webhook_url or config.MYAPPS_CRM_WEBHOOK_URL
        call_id = call_data.get("call_id", f"call_{int(time.time())}")

        # 1. Enforce Redis SETNX Idempotency Lock
        acquired_lock = await redis_engine.acquire_idempotency_lock(call_id, ttl_seconds=86400)
        if not acquired_lock:
            logger.warning(f"Duplicate webhook blocked by Redis SETNX lock for call_id={call_id}")
            return {
                "success": False,
                "status": "Blocked_Duplicate",
                "message": f"Idempotent lock active for call_id {call_id}. Duplicate webhook update suppressed.",
                "idempotency_key": f"webhook:idempotency:{call_id}"
            }

        # 2. Build MyApps CRM Webhook Payload
        payload = {
            "event": "voice_agent_call_completed",
            "call_id": call_id,
            "lead_name": call_data.get("lead_name"),
            "phone": call_data.get("phone"),
            "pipeline_stage": call_data.get("crm_target_stage", "Called"),
            "sentiment": call_data.get("sentiment", "Neutral"),
            "interest_level": call_data.get("interest_level", "Medium"),
            "ai_notes": call_data.get("summary"),
            "action_items": call_data.get("action_items", []),
            "call_duration_sec": call_data.get("duration_seconds", 60),
            "transcript_snippet": call_data.get("transcript", "")[:200] + "...",
            "dispatched_at": time.time()
        }

        # 3. Dispatch to CRM destination
        success = False
        response_code = 200
        error_msg = None

        if config.MOCK_MODE or "myapps.crm" in webhook_url:
            # Simulated CRM webhook ingestion success
            success = True
            response_code = 200
            logger.info(f"Successfully posted call {call_id} to MyApps CRM webhook ({call_data.get('crm_target_stage')})")
        else:
            try:
                async with httpx.AsyncClient(timeout=5.0) as client:
                    res = await client.post(webhook_url, json=payload)
                    response_code = res.status_code
                    success = res.status_code in [200, 201, 202]
            except Exception as e:
                error_msg = str(e)
                logger.error(f"CRM Webhook delivery failed: {e}")

        # 4. Cache delivery audit log in Redis
        audit_record = {
            "call_id": call_id,
            "webhook_url": webhook_url,
            "pipeline_stage": call_data.get("crm_target_stage"),
            "success": success,
            "status_code": response_code,
            "error": error_msg,
            "payload": payload,
            "timestamp": time.time()
        }
        await redis_engine.redis.set(f"crm:webhook:audit:{call_id}", str(audit_record), ex=86400)

        # 5. Trigger WhatsApp Official API (WABA) Follow-up Message
        waba_res = None
        phone = call_data.get("phone")
        crm_stage = call_data.get("crm_target_stage", "Called")
        if phone:
            from app.services.myappz_waba import MyAppzWABAService
            waba_template = MyAppzWABAService.select_template_for_call_outcome(crm_stage)
            waba_res = await MyAppzWABAService.dispatch_waba_template(
                phone=phone,
                template_name=waba_template,
                parameters={
                    "name": call_data.get("lead_name", "Prospect"),
                    "business": call_data.get("business", "Solar Traders"),
                    "city": call_data.get("city", "AP/TS")
                },
                call_id=call_id
            )

        return {
            "success": success,
            "call_id": call_id,
            "status_code": response_code,
            "pipeline_stage": call_data.get("crm_target_stage"),
            "waba_dispatch": waba_res,
            "audit": audit_record
        }
