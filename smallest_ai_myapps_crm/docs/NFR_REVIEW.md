# Non-Functional Requirements (NFR) Review

## 1. NFR Specification Matrix

| NFR Metric | Standard Target | Architecture Mechanism | Verification Method |
| :--- | :--- | :--- | :--- |
| **Response Latency** | Sub-50ms cache lookups | Async Redis connection pool (`redis.asyncio`) with FakeRedis fallback | Redis Telemetry Inspector in Angular UI |
| **Throughput & Rate Limiting** | Max 10 calls/sec to Smallest AI API | Token-Bucket rate limiter stored in Redis key `rate_limit:smallest_ai` | Devil's Advocate Rate-Limit 429 Test |
| **Idempotency & Resilience** | Zero duplicate CRM stage moves | 24-hour TTL Redis `SETNX` lock (`webhook:idempotency:{call_id}`) | Devil's Advocate Webhook Replay Simulator |
| **Fault Tolerance** | Automatic retry on CRM server error | Exponential backoff (1s, 2s, 4s, 8s) with jitter + audit log persistence | Devil's Advocate CRM 500 Simulator |
| **Privacy Compliance** | 100% blocking of opt-out leads | Redis Set lookup (`dnc:blacklist`) prior to outbound call dispatch | Devil's Advocate DNC Violation Simulator |
| **Security** | Zero exposed API credentials | Environment variable isolation in FastAPI Gateway (`app/config.py`) | Static code scan & gateway proxy pattern |
