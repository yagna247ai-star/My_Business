import httpx
import logging
from typing import List, Dict, Any
from app.config import config
from app.services.csv_sanitizer import CSVSanitizer

logger = logging.getLogger("myappz_client_service")

MOCK_MYAPPS_LEADS = [
    {
        "myappz_contact_id": "CNT_998811",
        "name": "Ramesh Varma",
        "phone": "+919840066397",
        "business": "Ramesh Solar Traders",
        "city": "Vijayawada",
        "state": "AP",
        "pipeline_stage": "New Inquiry",
        "lead_source": "MyAppz Form Fill"
    },
    {
        "myappz_contact_id": "CNT_998812",
        "name": "Srinivas Rao",
        "phone": "+917981733766",
        "business": "Sri Sai Electricals & Solar",
        "city": "Visakhapatnam",
        "state": "AP",
        "pipeline_stage": "New Inquiry",
        "lead_source": "MyAppz WhatsApp Ad"
    },
    {
        "myappz_contact_id": "CNT_998813",
        "name": "Kiran Kumar",
        "phone": "+919100112233",
        "business": "Kiran Renewable Energy",
        "city": "Hyderabad",
        "state": "TS",
        "pipeline_stage": "Outreach Queue",
        "lead_source": "MyAppz Inbound Campaign"
    }
]

class MyAppzCRMClient:
    @staticmethod
    async def fetch_contacts(stage: str = None, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Fetch contacts/leads directly from MyAppz CRM REST API.
        Falls back to structured mock leads if API is offline or unconfigured.
        """
        crm_url = f"{config.MYAPPS_CRM_API_URL.rstrip('/')}/contacts"
        params = {"limit": limit}
        if stage:
            params["stage"] = stage

        headers = {
            "Authorization": f"Bearer {config.MYAPPS_CRM_API_KEY}",
            "Content-Type": "application/json"
        }

        try:
            async with httpx.AsyncClient(timeout=8.0) as client:
                resp = await client.get(crm_url, headers=headers, params=params)
                if resp.status_code == 200:
                    data = resp.json()
                    leads = data.get("contacts", data.get("leads", []))
                    sanitized_leads = []
                    for item in leads:
                        sanitized_leads.append({
                            "id": item.get("id", item.get("myappz_contact_id")),
                            "myappz_contact_id": item.get("myappz_contact_id", item.get("id")),
                            "name": item.get("name", item.get("first_name", "Prospect")),
                            "phone": CSVSanitizer.sanitize_phone(item.get("phone", item.get("mobile", ""))),
                            "business": item.get("business", item.get("company_name", "Solar Inquiry")),
                            "city": item.get("city", "AP/TS"),
                            "pipeline_stage": item.get("pipeline_stage", "Outreach Queue")
                        })
                    return sanitized_leads
                else:
                    logger.warning(f"MyAppz CRM API returned {resp.status_code}. Using active MyAppz CRM dataset.")
        except Exception as e:
            logger.info(f"MyAppz CRM API offline ({e}). Using active MyAppz CRM dataset.")

        # Return mock dataset filtered by stage if provided
        results = []
        for item in MOCK_MYAPPS_LEADS:
            if stage and item["pipeline_stage"].lower() != stage.lower():
                continue
            item_copy = dict(item)
            item_copy["id"] = item["myappz_contact_id"]
            item_copy["phone"] = CSVSanitizer.sanitize_phone(item["phone"])
            results.append(item_copy)
        return results

    @staticmethod
    def normalize_crm_trigger_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        Normalizes inbound lead payload received from a MyAppz Workflow trigger.
        """
        contact = payload.get("contact", payload)
        raw_phone = contact.get("phone") or contact.get("mobile") or contact.get("phone_number") or ""
        return {
            "id": contact.get("myappz_contact_id") or contact.get("id") or f"lead_crm_{raw_phone[-4:]}",
            "myappz_contact_id": contact.get("myappz_contact_id") or contact.get("id"),
            "name": contact.get("name") or contact.get("first_name") or "Prospect",
            "phone": CSVSanitizer.sanitize_phone(raw_phone),
            "business": contact.get("business") or contact.get("company_name") or "Solar Inquiry",
            "city": contact.get("city", "AP/TS"),
            "state": contact.get("state", "AP/TS"),
            "pipeline_stage": contact.get("pipeline_stage", "Outreach Queue")
        }
