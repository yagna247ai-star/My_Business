from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Query
from app.services.myappz_client import MyAppzCRMClient
from app.services.smallest_ai import SmallestAIService
from app.services.crm_webhook import CRMWebhookService

router = APIRouter(prefix="/api/myappz", tags=["MyAppz CRM Ingestion"])

@router.get("/leads")
async def fetch_myappz_leads(stage: Optional[str] = None, limit: int = Query(50, ge=1, le=500)):
    """
    Fetch contacts/leads from MyAppz CRM.
    """
    leads = await MyAppzCRMClient.fetch_contacts(stage=stage, limit=limit)
    return {
        "source": "MyAppz CRM",
        "stage_filter": stage,
        "count": len(leads),
        "leads": leads
    }

@router.post("/trigger-lead-call")
async def trigger_lead_call(payload: Dict[str, Any]):
    """
    Webhook endpoint for MyAppz CRM Workflows.
    When a lead is created/updated in MyAppz, MyAppz posts to this endpoint
    to trigger an automated Smallest AI Voice call immediately.
    """
    lead = MyAppzCRMClient.normalize_crm_trigger_payload(payload)
    if not lead["phone"]:
        raise HTTPException(status_code=400, detail="Lead payload must contain a valid phone number.")

    # 1. Trigger Smallest AI Call
    call_res = await SmallestAIService.trigger_voice_call(lead)

    # 2. Sync call outcome back to MyAppz CRM if completed synchronously
    crm_sync = None
    if call_res.get("success") and call_res.get("result"):
        crm_sync = await CRMWebhookService.dispatch_pipeline_update(call_res["result"])

    return {
        "status": "Accepted",
        "lead_received": lead,
        "call_dispatch": call_res,
        "crm_sync": crm_sync
    }

@router.post("/sync-and-dispatch-batch")
async def sync_and_dispatch_batch(stage: Optional[str] = "Outreach Queue", limit: int = 10):
    """
    Pulls contacts directly from MyAppz CRM and dispatches batch voice calls to Smallest AI.
    """
    leads = await MyAppzCRMClient.fetch_contacts(stage=stage, limit=limit)
    if not leads:
        return {
            "status": "No leads found",
            "stage_filter": stage,
            "dispatched_count": 0,
            "results": []
        }

    results = []
    crm_syncs = []
    for lead in leads:
        call_res = await SmallestAIService.trigger_voice_call(lead)
        results.append(call_res)
        if call_res.get("success") and call_res.get("result"):
            crm_res = await CRMWebhookService.dispatch_pipeline_update(call_res["result"])
            crm_syncs.append(crm_res)

    return {
        "status": "Batch Sync & Dispatch Executed",
        "stage_filter": stage,
        "total_fetched": len(leads),
        "successful_dispatches": len([r for r in results if r.get("success")]),
        "call_results": results,
        "crm_sync_results": crm_syncs
    }
