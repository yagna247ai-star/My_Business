# Architecture Review Board (ARB) Review

## 1. Executive Architecture Assessment

| Architecture Domain | Evaluation | Status |
| :--- | :--- | :--- |
| **System Boundary & Decoupling** | MyApps CRM remains the sole Source of Truth. Smallest AI acts strictly as the voice execution runtime. | **APPROVED** |
| **API Gateway Layer** | FastAPI Gateway (`uv` managed) abstracts API keys, handles token-bucket throttling, and standardizes payload schemas. | **APPROVED** |
| **State Management** | Transient execution state is stored in Redis; zero local file lock-in. Gateway is fully stateless. | **APPROVED** |
| **Idempotency Control** | Redis `SETNX` lock key (`webhook:idempotency:{call_id}`) guarantees exact-once CRM pipeline moves. | **APPROVED** |
| **Compliance & Privacy** | Pre-call DNC registry lookup prevents calling opt-out numbers. | **APPROVED** |

---

## 2. ARB Architectural Directives

1. **Correlation Key Primacy**: Every API request and webhook MUST transmit `myappz_contact_id`. Phone numbers are strictly secondary fallback identifiers.
2. **Gateway Isolation**: Direct browser-to-Smallest AI call dispatches are prohibited in production to prevent exposure of voice agent API keys.
3. **Webhook Security**: All inbound webhooks from Smallest AI must pass HMAC-SHA256 signature verification before processing.
4. **Idempotency Guard**: Webhook processors must acquire Redis `SETNX` lock before mutating CRM pipeline state.
