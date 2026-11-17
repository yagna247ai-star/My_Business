# Ecosystem Documentation Index

Welcome to the documentation suite for the **Smallest AI Voice Agent × MyApps CRM Integration Ecosystem**.

## 📑 Artifact Index

1. 🗺️ **[Full Integration Blueprint](file:///Users/apple/Documents/My_Business/smallest_ai_myapps_crm/docs/FULL_INTEGRATION_BLUEPRINT.md)**: End-to-end 6-sprint implementation blueprint for MyAppz Gen 2 × Smallest AI.
2. 🏛️ **[High-Level Architecture Design (HLD)](file:///Users/apple/Documents/My_Business/smallest_ai_myapps_crm/docs/HLD.md)**: System topology, sequence diagrams, and 3-layer architecture.
3. ⚖️ **[Architecture Review Board (ARB) Review](file:///Users/apple/Documents/My_Business/smallest_ai_myapps_crm/docs/ARB_REVIEW.md)**: Decoupling principles, gateway patterns, and idempotency directives.
4. ⚡ **[Non-Functional Requirements (NFR) Review](file:///Users/apple/Documents/My_Business/smallest_ai_myapps_crm/docs/NFR_REVIEW.md)**: Latency SLAs, Token Bucket rate limiting, and failure recovery matrices.
5. 📄 **[Data Contracts & API Specification](file:///Users/apple/Documents/My_Business/smallest_ai_myapps_crm/docs/DATA_CONTRACTS_AND_API_SPEC.md)**: API-01 to API-04 schemas and identity contracts.
6. 🔄 **[Workflows & Conversation State Machine](file:///Users/apple/Documents/My_Business/smallest_ai_myapps_crm/docs/WORKFLOWS_AND_STATE_MACHINE.md)**: MyApps CRM Workflows (WF-01 to WF-08) and Smallest AI voice conversation state machine.

---

## 🚀 Running the System

```bash
cd /Users/apple/Documents/My_Business/smallest_ai_myapps_crm
./dev.sh
```

- **Angular 20 Frontend**: `http://localhost:4200`
- **FastAPI Gateway**: `http://localhost:8000/docs`
