"""
BANGI Core Schemas v0.5
=======================
Pydantic data models for REST API requests, task definitions, system health, and events.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class TaskRequest(BaseModel):
    prompt: str = Field(..., min_length=1, max_length=4000, description="User prompt or task instruction")
    correlation_id: Optional[str] = Field(None, description="Optional request correlation ID")
    metadata: Optional[Dict[str, Any]] = Field(default_factory=dict, description="Arbitrary task metadata")


class TaskResponse(BaseModel):
    task_id: str
    task: str
    mode: str
    status: str = "completed"
    output: Optional[Any] = None
    data: Optional[Dict[str, Any]] = None
    hint: Optional[str] = None
    framework: Optional[str] = None
    correlation_id: Optional[str] = None
    via: str = "backend"
    in_process: bool = True
    error: Optional[str] = None


class LeadPayload(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    source: Optional[str] = "web"
    corridor: Optional[str] = "shankarpally_west"
    notes: Optional[str] = None


class CoachPayload(BaseModel):
    agent_name: str = "Yagna"
    transcript: str


class CampaignPayload(BaseModel):
    corridor_id: str = "shankarpally_west"


class HealthResponse(BaseModel):
    bangi: str = "ok"
    version: str = "0.5.0"
    in_process: bool = True
    hermes_realestate: bool = False
    hermes_realestate_error: Optional[str] = None
    hermes_agent: bool = False
    hermes_tools: int = 0
    capabilities: List[str] = []
    cua: bool = False
    db: str = "ok"
    events_log: str = ""
    now: str = Field(default_factory=lambda: datetime.utcnow().isoformat())
