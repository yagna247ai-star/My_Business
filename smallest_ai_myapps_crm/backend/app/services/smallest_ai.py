import uuid
import random
import time
import httpx
import logging
from typing import Dict, Any
from app.config import config
from app.redis_engine import redis_engine

logger = logging.getLogger("smallest_ai_service")

SYNTHETIC_TRANSCRIPTS = [
    {
        "sentiment": "Positive",
        "interest_level": "High",
        "crm_target_stage": "Demo Scheduled",
        "transcript": "Agent: Hi, this is Alex from Solar Solutions. Am I speaking with {name}?\nLead: Yes, this is {name}.\nAgent: Great! I saw you requested a quick quote for rooftop solar installation. Is this a good time?\nLead: Yes! We've been paying over $450/month in electric bills. I want a 10kW system with battery storage.\nAgent: Wonderful. I have scheduled an engineer on-site visit for Tuesday at 10 AM. Sound good?\nLead: Perfect, thank you!",
        "summary": "Customer confirmed high electricity bill ($450/mo) and requested 10kW solar system with battery. Appointment set for Tuesday 10 AM.",
        "action_items": ["Send calendar invite for Tuesday 10 AM", "Prepare 10kW preliminary design doc"]
    },
    {
        "sentiment": "Neutral",
        "interest_level": "Medium",
        "crm_target_stage": "Quote Sent",
        "transcript": "Agent: Hello {name}, following up regarding your energy audit inquiry.\nLead: Hi. Can you just email me the price estimates first before calling?\nAgent: Absolutely! What system capacity are you considering?\nLead: Around 5kW or 8kW. Send the breakdown to my email.\nAgent: Will do right away!",
        "summary": "Lead requested preliminary pricing breakdown via email for 5kW vs 8kW solar options.",
        "action_items": ["Email pricing breakdown matrix", "Schedule follow-up call in 3 days"]
    }
]

from app.services.outbound_validator import OutboundCallValidator

class SmallestAIService:
    @staticmethod
    async def trigger_voice_call(lead: Dict[str, Any], api_key: str = None, agent_id: str = None) -> Dict[str, Any]:
        api_key = api_key or config.SMALLEST_AI_API_KEY
        agent_id = agent_id or config.SMALLEST_AI_AGENT_ID

        # 1. Run TRAI & DNC Outbound Validation Rules
        val_res = await OutboundCallValidator.validate_and_build_payload(lead)
        if not val_res["valid"]:
            return {
                "success": False,
                "call_id": f"call_blocked_{uuid.uuid4().hex[:8]}",
                "status": "Blocked",
                "reason": val_res["message"],
                "action": val_res.get("action")
            }

        # 2. Acquire Rate Limit Token from Redis
        allowed = await redis_engine.acquire_rate_limit_token()
        if not allowed:
            return {
                "success": False,
                "call_id": f"call_rejected_{uuid.uuid4().hex[:8]}",
                "status": "Throttled",
                "reason": "Smallest AI API Rate Limit (429) reached. Token Bucket empty."
            }

        # Record call attempt for TRAI frequency cap tracking
        await redis_engine.record_call_attempt(lead["phone"])

        call_id = f"call_sai_{uuid.uuid4().hex[:12]}"

        # 3. Live Atoms API Outbound Dispatch
        if not config.MOCK_MODE:
            outbound_endpoint = "https://atoms-api.smallest.ai/api/v1/conversation/outbound"
            payload = {
                "agentId": agent_id,
                "phoneNumber": lead["phone"],
                "variables": {
                    "name": lead.get("name", "Prospect"),
                    "business": lead.get("business", "Solar Inquiry"),
                    "COMPANYNAME_1": lead.get("company_1", "Solar Outreach"),
                    "COMPANYNAME_2": lead.get("company_2", "Solar Solutions")
                }
            }
            if getattr(config, "SMALLEST_AI_FROM_NUMBER", None):
                payload["fromNumber"] = config.SMALLEST_AI_FROM_NUMBER
            try:
                async with httpx.AsyncClient(timeout=12.0) as client:
                    resp = await client.post(
                        outbound_endpoint,
                        headers={
                            "Authorization": f"Bearer {api_key}",
                            "Content-Type": "application/json"
                        },
                        json=payload
                    )
                    if resp.status_code in [200, 201]:
                        data = resp.json()
                        return {
                            "success": True,
                            "call_id": data.get("conversation_id", call_id),
                            "status": "Dialing",
                            "message": f"Live outbound call initiated to {lead['phone']} via Smallest AI Atoms API."
                        }
                    else:
                        error_detail = resp.text
                        logger.error(f"Smallest AI API error ({resp.status_code}): {error_detail}")
                        return {
                            "success": False,
                            "call_id": call_id,
                            "status": "API_Error",
                            "status_code": resp.status_code,
                            "reason": f"Smallest AI API returned HTTP {resp.status_code}: {error_detail}",
                            "endpoint_used": outbound_endpoint
                        }
            except Exception as e:
                logger.error(f"Smallest AI network error: {e}")
                return {
                    "success": False,
                    "call_id": call_id,
                    "status": "Network_Error",
                    "reason": str(e)
                }

        # Simulated sandbox call execution
        outcome = random.choice(SYNTHETIC_TRANSCRIPTS)
        formatted_transcript = outcome["transcript"].format(name=lead["name"])
        
        result_payload = {
            "call_id": call_id,
            "lead_id": lead["id"],
            "lead_name": lead["name"],
            "phone": lead["phone"],
            "agent_id": agent_id,
            "status": "Completed",
            "duration_seconds": random.randint(45, 180),
            "sentiment": outcome["sentiment"],
            "interest_level": outcome["interest_level"],
            "crm_target_stage": outcome["crm_target_stage"],
            "transcript": formatted_transcript,
            "summary": outcome["summary"],
            "action_items": outcome["action_items"],
            "timestamp": time.time()
        }

        await redis_engine.cache_call_result(call_id, result_payload)

        return {
            "success": True,
            "call_id": call_id,
            "status": "Completed",
            "result": result_payload
        }
