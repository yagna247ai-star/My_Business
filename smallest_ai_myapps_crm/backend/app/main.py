import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.redis_engine import redis_engine
from app.routers import api_config, calls, webhooks, devils_advocate, myappz_crm, myappz_waba

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("fastapi_main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting FastAPI Gateway & connecting Redis...")
    await redis_engine.connect()
    yield
    logger.info("Shutting down FastAPI Gateway & closing Redis...")
    await redis_engine.close()

app = FastAPI(
    title="Smallest AI & MyApps CRM Gateway",
    description="Enterprise API Gateway with Redis Caching, Idempotency Locks, and Voice Agent Dispatcher",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS for Angular frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_config.router)
app.include_router(calls.router)
app.include_router(webhooks.router)
app.include_router(devils_advocate.router)
app.include_router(myappz_crm.router)
app.include_router(myappz_waba.router)

@app.get("/")
async def root():
    return {
        "status": "online",
        "app": "Smallest AI Integration with MyApps CRM Gateway",
        "version": "1.0.0",
        "docs_url": "/docs"
    }
