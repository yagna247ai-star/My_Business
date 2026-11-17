import json
import time
import logging
from typing import Optional, Dict, Any, List
import redis.asyncio as aioredis
import fakeredis.aioredis as fakeaioredis

from app.config import config

logger = logging.getLogger("redis_engine")

class RedisEngine:
    def __init__(self):
        self.redis: Optional[aioredis.Redis] = None
        self.is_fake: bool = False

    async def connect(self):
        try:
            r = aioredis.Redis(host=config.REDIS_HOST, port=config.REDIS_PORT, decode_responses=True)
            await r.ping()
            self.redis = r
            self.is_fake = False
            logger.info("Connected to real Redis instance.")
        except Exception as e:
            logger.warning(f"Could not connect to Redis server ({e}). Falling back to in-memory fakeredis.")
            self.redis = fakeaioredis.FakeRedis(decode_responses=True)
            self.is_fake = True

    async def _ensure_connected(self):
        if self.redis is None:
            await self.connect()

    async def close(self):
        if self.redis:
            if hasattr(self.redis, "aclose"):
                await self.redis.aclose()
            else:
                await self.redis.close()

    # --- Token Bucket Rate Limiter ---
    async def acquire_rate_limit_token(self, bucket_key: str = "rate_limit:smallest_ai", max_tokens: int = 10, fill_rate_per_sec: float = 10.0) -> bool:
        await self._ensure_connected()
        now = time.time()
        pipe = self.redis.pipeline()
        pipe.hget(bucket_key, "tokens")
        pipe.hget(bucket_key, "last_updated")
        res = await pipe.execute()

        current_tokens = float(res[0]) if res[0] is not None else float(max_tokens)
        last_updated = float(res[1]) if res[1] is not None else now

        # Refill tokens based on elapsed time
        elapsed = now - last_updated
        refill = elapsed * fill_rate_per_sec
        current_tokens = min(float(max_tokens), current_tokens + refill)

        if current_tokens >= 1.0:
            current_tokens -= 1.0
            await self.redis.hset(bucket_key, mapping={"tokens": str(current_tokens), "last_updated": str(now)})
            return True
        else:
            await self.redis.hset(bucket_key, mapping={"tokens": str(current_tokens), "last_updated": str(now)})
            return False

    # --- SETNX Webhook Idempotency Lock ---
    async def acquire_idempotency_lock(self, call_id: str, ttl_seconds: int = 86400) -> bool:
        await self._ensure_connected()
        lock_key = f"webhook:idempotency:{call_id}"
        is_acquired = await self.redis.set(lock_key, "LOCKED", nx=True, ex=ttl_seconds)
        return bool(is_acquired)

    # --- Call Result Caching ---
    async def cache_call_result(self, call_id: str, data: Dict[str, Any], ttl_seconds: int = 86400):
        await self._ensure_connected()
        cache_key = f"call:result:{call_id}"
        await self.redis.set(cache_key, json.dumps(data), ex=ttl_seconds)

    async def get_call_result(self, call_id: str) -> Optional[Dict[str, Any]]:
        await self._ensure_connected()
        cache_key = f"call:result:{call_id}"
        val = await self.redis.get(cache_key)
        if val:
            return json.loads(val)
        return None

    # --- Blacklist / DNC Management ---
    async def add_to_dnc(self, phone: str):
        await self._ensure_connected()
        await self.redis.sadd("dnc:blacklist", phone)

    async def is_dnc(self, phone: str) -> bool:
        await self._ensure_connected()
        return await self.redis.sismember("dnc:blacklist", phone)

    # --- TRAI Anti-Spam Frequency Cap & Cooldown Tracking ---
    async def record_call_attempt(self, phone: str):
        await self._ensure_connected()
        now = time.time()
        key_count = f"trai:attempts:{phone}"
        key_last = f"trai:last_time:{phone}"
        pipe = self.redis.pipeline()
        pipe.incr(key_count)
        pipe.expire(key_count, 86400)  # 24h sliding window
        pipe.set(key_last, str(now), ex=86400)
        await pipe.execute()

    async def get_call_attempt_stats(self, phone: str) -> Dict[str, Any]:
        await self._ensure_connected()
        now = time.time()
        key_count = f"trai:attempts:{phone}"
        key_last = f"trai:last_time:{phone}"
        pipe = self.redis.pipeline()
        pipe.get(key_count)
        pipe.get(key_last)
        res = await pipe.execute()

        attempts = int(res[0]) if res[0] is not None else 0
        last_time = float(res[1]) if res[1] is not None else 0.0
        elapsed_sec = (now - last_time) if last_time > 0 else 999999.0

        return {
            "attempts": attempts,
            "last_time": last_time,
            "elapsed_seconds": elapsed_sec
        }

    # --- Telemetry & Redis Inspector ---
    async def get_cache_telemetry(self) -> Dict[str, Any]:
        await self._ensure_connected()
        keys = await self.redis.keys("*")
        key_details = []
        for k in keys[:50]:
            k_type = await self.redis.type(k)
            ttl = await self.redis.ttl(k)
            key_details.append({"key": k, "type": k_type, "ttl": ttl})
        
        dnc_members = list(await self.redis.smembers("dnc:blacklist"))
        
        return {
            "engine": "In-Memory FakeRedis Engine" if self.is_fake else "Localhost Redis Engine",
            "total_keys": len(keys),
            "keys_sample": key_details,
            "dnc_blacklist": dnc_members
        }

redis_engine = RedisEngine()
