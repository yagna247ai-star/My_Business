from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query
from app.services.myappz_waba import MyAppzWABAService

router = APIRouter(prefix="/api/myappz/waba", tags=["MyAppz WhatsApp Official API (WABA)"])

@router.get("/templates")
async def get_waba_templates():
    """
    Get catalogue of available WhatsApp Official API (WABA) template messages.
    """
    templates = MyAppzWABAService.get_templates()
    return {
        "count": len(templates),
        "templates": templates
    }

@router.post("/send-template")
async def send_waba_template(payload: Dict[str, Any]):
    """
    Dispatch a WhatsApp Official API (WABA) template message to a prospect.
    """
    phone = payload.get("phone")
    template_name = payload.get("template_name", "general_nurture_te")
    parameters = payload.get("parameters", {})
    call_id = payload.get("call_id")

    if not phone:
        raise HTTPException(status_code=400, detail="Phone number is required for WhatsApp dispatch.")

    result = await MyAppzWABAService.dispatch_waba_template(
        phone=phone,
        template_name=template_name,
        parameters=parameters,
        call_id=call_id
    )

    return {
        "status": "Accepted",
        "result": result
    }

@router.get("/logs")
async def get_waba_logs(limit: int = Query(20, ge=1, le=100)):
    """
    Fetch recent WhatsApp WABA delivery logs and message status history.
    """
    logs = await MyAppzWABAService.get_recent_waba_logs(limit=limit)
    return {
        "count": len(logs),
        "logs": logs
    }

@router.post("/webhook")
async def waba_inbound_webhook(payload: Dict[str, Any]):
    """
    Webhook endpoint for receiving incoming WhatsApp message status receipts and customer replies.
    """
    msg_id = payload.get("message_id") or payload.get("waba_msg_id", "waba_inbound")
    event_type = payload.get("event", "message_delivered")
    
    return {
        "status": "Received",
        "event": event_type,
        "message_id": msg_id
    }
