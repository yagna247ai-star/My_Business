from typing import List, Dict, Any
from fastapi import APIRouter, UploadFile, File, HTTPException
from pydantic import BaseModel

from app.services.csv_sanitizer import CSVSanitizer
from app.services.smallest_ai import SmallestAIService
from app.services.crm_webhook import CRMWebhookService
from app.redis_engine import redis_engine

router = APIRouter(prefix="/api/calls", tags=["Calls Dispatcher"])

class DispatchSingleModel(BaseModel):
    name: str
    phone: str
    business: str = "Solar Inquiry"
    email: str = ""

class DispatchBatchModel(BaseModel):
    leads: List[Dict[str, Any]]

@router.post("/parse-csv")
async def parse_csv(file: UploadFile = File(...)):
    if not file.filename.endswith(".csv"):
        raise HTTPException(status_code=400, detail="Only CSV files are supported")
    content = await file.read()
    text_content = content.decode("utf-8", errors="ignore")

    valid_leads, invalid_leads = CSVSanitizer.parse_and_validate(text_content)
    return {
        "filename": file.filename,
        "total_parsed": len(valid_leads) + len(invalid_leads),
        "valid_count": len(valid_leads),
        "invalid_count": len(invalid_leads),
        "valid_leads": valid_leads,
        "invalid_leads": invalid_leads
    }

@router.post("/dispatch-single")
async def dispatch_single(payload: DispatchSingleModel):
    lead = {
        "id": f"lead_manual_{payload.phone[-4:]}",
        "name": payload.name,
        "phone": CSVSanitizer.sanitize_phone(payload.phone),
        "business": payload.business,
        "email": payload.email
    }
    
    # 1. Trigger Smallest AI Voice Agent
    res = await SmallestAIService.trigger_voice_call(lead)
    
    # 2. If call succeeded, trigger CRM Webhook sync automatically
    crm_res = None
    if res.get("success") and res.get("result"):
        crm_res = await CRMWebhookService.dispatch_pipeline_update(res["result"])

    return {
        "call": res,
        "crm_sync": crm_res
    }

@router.post("/dispatch-batch")
async def dispatch_batch(payload: DispatchBatchModel):
    results = []
    crm_syncs = []

    for lead in payload.leads:
        sanitized_phone = CSVSanitizer.sanitize_phone(lead.get("phone", ""))
        lead["phone"] = sanitized_phone
        
        # Dispatch call
        call_res = await SmallestAIService.trigger_voice_call(lead)
        results.append(call_res)

        # Dispatch CRM sync if completed
        if call_res.get("success") and call_res.get("result"):
            crm_res = await CRMWebhookService.dispatch_pipeline_update(call_res["result"])
            crm_syncs.append(crm_res)

    return {
        "total_dispatched": len(payload.leads),
        "successful_calls": len([r for r in results if r.get("success")]),
        "failed_calls": len([r for r in results if not r.get("success")]),
        "call_results": results,
        "crm_sync_results": crm_syncs
    }

@router.get("/result/{call_id}")
async def get_call_result(call_id: str):
    data = await redis_engine.get_call_result(call_id)
    if not data:
        raise HTTPException(status_code=404, detail=f"Call result for {call_id} not found in Redis cache.")
    return data
