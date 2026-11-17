import os
from pydantic import BaseModel

class AppConfig(BaseModel):
    SMALLEST_AI_API_KEY: str = os.getenv("SMALLEST_AI_API_KEY", "sk_fffeb5a9e6295873f876bdacb175c629")
    SMALLEST_AI_AGENT_ID: str = os.getenv("SMALLEST_AI_AGENT_ID", "6a9d8ed1fe578a2a3bacfea7")
    SMALLEST_AI_FROM_NUMBER: str = os.getenv("SMALLEST_AI_FROM_NUMBER", "")
    MYAPPS_CRM_API_URL: str = os.getenv("MYAPPS_CRM_API_URL", "https://api.myapps.crm/v1")
    MYAPPS_CRM_API_KEY: str = os.getenv("MYAPPS_CRM_API_KEY", "")
    MYAPPS_CRM_WEBHOOK_URL: str = os.getenv("MYAPPS_CRM_WEBHOOK_URL", "https://api.myapps.crm/v1/webhooks/pipeline-update")
    MYAPPS_WABA_API_URL: str = os.getenv("MYAPPS_WABA_API_URL", "https://api.myapps.crm/v1/waba")
    MYAPPS_WABA_API_KEY: str = os.getenv("MYAPPS_WABA_API_KEY", "")
    MYAPPS_WABA_PHONE_NUMBER_ID: str = os.getenv("MYAPPS_WABA_PHONE_NUMBER_ID", "waba_num_998811")
    REDIS_HOST: str = os.getenv("REDIS_HOST", "localhost")
    REDIS_PORT: int = int(os.getenv("REDIS_PORT", "6379"))
    RATE_LIMIT_CALLS_PER_SEC: int = 10
    MOCK_MODE: bool = False  # Set to False to trigger real dispatch / voice campaign call

config = AppConfig()
