import time
import httpx
import logging
from typing import Dict, Any, List, Optional
from app.config import config
from app.redis_engine import redis_engine

logger = logging.getLogger("myappz_waba_service")

# Official WABA Message Templates Catalogue
WABA_TEMPLATES = {
    "solar_demo_confirmation_te": {
        "name": "solar_demo_confirmation_te",
        "language": "te",
        "category": "UTILITY",
        "header": "Solar Demo Confirmation ☀️",
        "body_template": "Namaste {name} garu! Thank you for speaking with our Smallest AI voice agent. Your solar consultation demo has been scheduled for {business} in {city}. Reply YES to confirm or CALL to reschedule.",
        "buttons": ["Confirm Demo", "Reschedule Call"]
    },
    "solar_quote_details_te": {
        "name": "solar_quote_details_te",
        "language": "te",
        "category": "UTILITY",
        "header": "Solar System Proposal Details 📄",
        "body_template": "Namaste {name} garu! As discussed during our call, we have prepared a custom rooftop solar estimate for {business}. Check details & subsidies available for {city}.",
        "buttons": ["View Proposal", "Speak to Solar Specialist"]
    },
    "dnc_acknowledgement_te": {
        "name": "dnc_acknowledgement_te",
        "language": "te",
        "category": "MARKETING",
        "header": "Do Not Call Registered 🚫",
        "body_template": "Namaste {name} garu! We have registered your request to opt out. You will not receive further automated voice calls or promotional messages. Thank you.",
        "buttons": []
    },
    "general_nurture_te": {
        "name": "general_nurture_te",
        "language": "te",
        "category": "MARKETING",
        "header": "Solar Energy Savings Guide ⚡",
        "body_template": "Namaste {name} garu! Save up to 80% on monthly electricity bills with rooftop solar in {city}. Let us know when you'd like a call back.",
        "buttons": ["Request Call Back", "Calculate Savings"]
    }
}

class MyAppzWABAService:
    @staticmethod
    def get_templates() -> Dict[str, Any]:
        """Returns catalogue of supported WhatsApp Official API (WABA) templates."""
        return WABA_TEMPLATES

    @staticmethod
    def select_template_for_call_outcome(crm_stage: str) -> Optional[str]:
        """
        Maps voice call CRM target stage to appropriate WABA template.
        """
        stage_map = {
            "Demo Scheduled": "solar_demo_confirmation_te",
            "Quote Sent": "solar_quote_details_te",
            "Opted Out": "dnc_acknowledgement_te",
            "Called": "general_nurture_te"
        }
        return stage_map.get(crm_stage, "general_nurture_te")

    @staticmethod
    async def dispatch_waba_template(
        phone: str,
        template_name: str,
        parameters: Dict[str, str],
        call_id: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Dispatches a WhatsApp Official API template message via MyAppz WABA gateway.
        """
        waba_msg_id = f"waba_msg_{int(time.time() * 1000)}"
        template = WABA_TEMPLATES.get(template_name, WABA_TEMPLATES["general_nurture_te"])

        # Format message body
        formatted_body = template["body_template"].format(
            name=parameters.get("name", "Valued Customer"),
            business=parameters.get("business", "Business"),
            city=parameters.get("city", "AP/TS")
        )

        payload = {
            "messaging_product": "whatsapp",
            "recipient_type": "individual",
            "to": phone,
            "type": "template",
            "template": {
                "name": template["name"],
                "language": {"code": template["language"]},
                "components": [
                    {
                        "type": "body",
                        "parameters": [
                            {"type": "text", "text": parameters.get("name", "Valued Customer")},
                            {"type": "text", "text": parameters.get("business", "Business")},
                            {"type": "text", "text": parameters.get("city", "AP/TS")}
                        ]
                    }
                ]
            },
            "waba_phone_number_id": config.MYAPPS_WABA_PHONE_NUMBER_ID,
            "call_id": call_id
        }

        success = True
        status_code = 200
        delivery_status = "Delivered"
        error_msg = None

        # Post to WABA endpoint if live API URL configured and not mock
        if not config.MOCK_MODE and "myapps.crm" not in config.MYAPPS_WABA_API_URL:
            try:
                headers = {
                    "Authorization": f"Bearer {config.MYAPPS_WABA_API_KEY}",
                    "Content-Type": "application/json"
                }
                async with httpx.AsyncClient(timeout=5.0) as client:
                    resp = await client.post(config.MYAPPS_WABA_API_URL, json=payload, headers=headers)
                    status_code = resp.status_code
                    success = resp.status_code in [200, 201, 202]
                    if not success:
                        delivery_status = "Failed"
                        error_msg = f"WABA Gateway error HTTP {resp.status_code}"
            except Exception as e:
                success = False
                delivery_status = "Failed"
                error_msg = str(e)
                logger.error(f"WhatsApp WABA dispatch exception: {e}")

        # Store WABA message record in Redis
        log_record = {
            "waba_msg_id": waba_msg_id,
            "call_id": call_id,
            "phone": phone,
            "template_name": template_name,
            "header": template["header"],
            "formatted_text": formatted_body,
            "status": delivery_status,
            "success": success,
            "status_code": status_code,
            "error": error_msg,
            "timestamp": time.time()
        }

        # Push to Redis list and set key
        try:
            await redis_engine.redis.lpush("waba:logs:list", str(log_record))
            await redis_engine.redis.ltrim("waba:logs:list", 0, 99)
            await redis_engine.redis.set(f"waba:msg:{waba_msg_id}", str(log_record), ex=86400)
        except Exception as err:
            logger.warning(f"Redis log cache warning: {err}")

        return {
            "success": success,
            "waba_msg_id": waba_msg_id,
            "delivery_status": delivery_status,
            "log": log_record
        }

    @staticmethod
    async def get_recent_waba_logs(limit: int = 20) -> List[Dict[str, Any]]:
        """
        Retrieves recent WhatsApp WABA delivery logs from Redis.
        """
        try:
            raw_items = await redis_engine.redis.lrange("waba:logs:list", 0, limit - 1)
            results = []
            for item in raw_items:
                try:
                    import ast
                    results.append(ast.literal_eval(item.decode("utf-8") if isinstance(item, bytes) else item))
                except Exception:
                    pass
            return results
        except Exception as e:
            logger.warning(f"Failed to fetch WABA logs from Redis: {e}")
            return []
