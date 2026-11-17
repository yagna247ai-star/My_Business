from fastapi import APIRouter
from pydantic import BaseModel
from app.config import config
from app.redis_engine import redis_engine

router = APIRouter(prefix="/api/config", tags=["Configuration"])

class ConfigUpdateModel(BaseModel):
    smallest_ai_api_key: str
    smallest_ai_agent_id: str
    myapps_crm_webhook_url: str
    rate_limit_per_sec: int = 10
    mock_mode: bool = True

@router.get("")
async def get_config():
    telemetry = await redis_engine.get_cache_telemetry()
    return {
        "smallest_ai_api_key": config.SMALLEST_AI_API_KEY[:6] + "..." if len(config.SMALLEST_AI_API_KEY) > 6 else config.SMALLEST_AI_API_KEY,
        "smallest_ai_agent_id": config.SMALLEST_AI_AGENT_ID,
        "myapps_crm_webhook_url": config.MYAPPS_CRM_WEBHOOK_URL,
        "rate_limit_per_sec": config.RATE_LIMIT_CALLS_PER_SEC,
        "mock_mode": config.MOCK_MODE,
        "redis_telemetry": telemetry
    }

@router.post("")
async def update_config(payload: ConfigUpdateModel):
    config.SMALLEST_AI_API_KEY = payload.smallest_ai_api_key
    config.SMALLEST_AI_AGENT_ID = payload.smallest_ai_agent_id
    config.MYAPPS_CRM_WEBHOOK_URL = payload.myapps_crm_webhook_url
    config.RATE_LIMIT_CALLS_PER_SEC = payload.rate_limit_per_sec
    config.MOCK_MODE = payload.mock_mode
    return {"message": "Configuration updated successfully", "config": payload}
