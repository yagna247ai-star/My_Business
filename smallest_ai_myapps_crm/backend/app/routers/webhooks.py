from typing import Dict, Any
from fastapi import APIRouter, Header, HTTPException
from app.services.crm_webhook import CRMWebhookService
from app.redis_engine import redis_engine

router = APIRouter(prefix="/api/webhooks", tags=["Webhooks Engine"])

@router.post("/smallest-ai")
async def smallest_ai_webhook(payload: Dict[str, Any], x_signature: str = Header(None)):
    call_id = payload.get("call_id")
    if not call_id:
        raise HTTPException(status_code=400, detail="Missing call_id in webhook payload")

    # Cache payload in Redis
    await redis_engine.cache_call_result(call_id, payload)

    # Dispatch to MyApps CRM
    crm_res = await CRMWebhookService.dispatch_pipeline_update(payload)
    return {
        "status": "Webhook Received",
        "call_id": call_id,
        "crm_dispatch": crm_res
    }

@router.post("/myapps-crm")
async def myapps_crm_webhook_destination(payload: Dict[str, Any]):
    # Simulated CRM Webhook Receiver
    return {
        "status": "Accepted",
        "crm_deal_id": f"deal_crm_{payload.get('call_id', 'unknown')[-6:]}",
        "updated_pipeline_stage": payload.get("pipeline_stage"),
        "lead_name": payload.get("lead_name")
    }

@router.get("/idempotency-check/{call_id}")
async def idempotency_check(call_id: str):
    lock_key = f"webhook:idempotency:{call_id}"
    exists = await redis_engine.redis.exists(lock_key)
    ttl = await redis_engine.redis.ttl(lock_key) if exists else -1
    return {
        "call_id": call_id,
        "lock_active": bool(exists),
        "lock_key": lock_key,
        "ttl_seconds_remaining": ttl
    }
