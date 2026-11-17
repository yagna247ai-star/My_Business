import time
import logging
from typing import Dict, Any
from app.redis_engine import redis_engine
from app.services.pipeline_router import PipelineScoreRouter

logger = logging.getLogger("voice_event_engine")

class VoiceEventEngine:
    @staticmethod
    async def process_event(event_payload: Dict[str, Any]) -> Dict[str, Any]:
        event_type = event_payload.get("event")
        contact_id = event_payload.get("contact_id") or event_payload.get("myappz_contact_id", "CNT_UNKNOWN")
        session_id = event_payload.get("voice_session_id") or event_payload.get("call_id", f"call_{int(time.time())}")

        if not event_type:
            return {"success": False, "reason": "MISSING_EVENT_TYPE"}

        # 1. Event 1: call_queued
        if event_type == "call_queued":
            await redis_engine.redis.hset(f"contact:status:{contact_id}", mapping={
                "voice_call_status": "QUEUED",
                "voice_session_id": session_id,
                "updated_at": str(time.time())
            })
            return {"success": True, "event": "call_queued", "status": "QUEUED", "contact_id": contact_id}

        # 2. Event 2: call_started
        elif event_type == "call_started":
            now_str = str(time.time())
            await redis_engine.redis.hset(f"contact:status:{contact_id}", mapping={
                "voice_call_status": "IN PROGRESS",
                "last_voice_call_at": now_str,
                "voice_session_id": session_id
            })
            return {"success": True, "event": "call_started", "status": "IN PROGRESS", "contact_id": contact_id}

        # 3. Event 3: call_completed
        elif event_type == "call_completed":
            duration = event_payload.get("duration_seconds", 0)
            await redis_engine.redis.hset(f"contact:status:{contact_id}", mapping={
                "voice_call_status": "COMPLETED",
                "call_duration_seconds": str(duration),
                "voice_session_id": session_id
            })
            return {"success": True, "event": "call_completed", "status": "COMPLETED", "duration": duration}

        # 4. Event 4: qualification_completed
        elif event_type == "qualification_completed":
            scoring = event_payload.get("scoring", {})
            total_score = scoring.get("total")
            if total_score is None:
                total_score = PipelineScoreRouter.calculate_score(
                    scoring.get("motivation", 2),
                    scoring.get("business_fit", 2),
                    scoring.get("commitment", 2),
                    scoring.get("capital_readiness", 2),
                    scoring.get("local_network", 2)
                )

            call_outcome = event_payload.get("call_outcome", "BOOKED")
            route = PipelineScoreRouter.route_pipeline_stage(total_score, call_outcome)

            result_summary = {
                "contact_id": contact_id,
                "voice_session_id": session_id,
                "qualification": event_payload.get("qualification", {}),
                "scoring": {**scoring, "total": total_score},
                "lead_temperature": route["lead_temperature"],
                "target_pipeline_stage": route["pipeline_stage"],
                "summary": event_payload.get("summary", "Call completed with AI analysis."),
                "dispatched_at": time.time()
            }

            # Cache qualification result in Redis
            await redis_engine.cache_call_result(session_id, result_summary)

            return {
                "success": True,
                "event": "qualification_completed",
                "contact_id": contact_id,
                "total_score": total_score,
                "route": route,
                "summary": result_summary
            }

        return {"success": False, "reason": "UNKNOWN_EVENT_TYPE"}
