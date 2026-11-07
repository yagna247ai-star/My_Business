# M04 — AI Ecosystem, 5 Assistants (BRD-05 · §14 §25 §27 · REQ-AI-01..05)

## 1. Objective
Ship 5 scoped assistants (Learning Coach, Project Mentor, Assessment, Career Mentor, Hackathon Judge) via LiteLLM gateway.

## 2. Prerequisites
- M01, M02 complete (quotas attach to tenant/user; context attaches to level/project).
- Read `apps/web/app/api/ai/chat/route.ts`, seed `AiAssistant` x5.

## 3. Build steps
1. Route all calls through LiteLLM proxy (OpenAI → Anthropic → Gemini → Ollama fallback).
2. Enforce budgets: tenant $100/mo, user $5/day via `ai_usage_ledger` + entitlements.
3. Scope context per assistant (lesson/project/rubric only). No cross-student data.
4. Stream responses (SSE). On provider outage, return TEST MODE badge mock — never fake success.
5. Log usage per call for cost reporting.

## 4. ARB gate
- Are keys server-side only (never in bundle, storage, or logs)?
- Is there one gateway (LiteLLM) with routing/fallback, not per-route keys?
- Does each assistant have a least-privilege context contract in writing?
- Are consequential actions (grade/publish/pay/hire) blocked without human approval?

## 5. NFR gate
- Rate limits + abuse prevention per user/tenant. Budgets decrement atomically.
- Graceful degradation when providers are down (mock clearly labeled).
- PII redaction on inputs/outputs. No repo/API-key access without explicit grant.

## 6. Red-team review
- Try prompt injection to exfiltrate another student's data. Must refuse + log.
- Try exhausting quota then calling again. Must block with 402/quota message.
- Try getting Assessment Engine to change a grade directly. Must refuse (human gate).
- Try reading `process.env` or secrets via assistant. Must never expose.

## 7. Acceptance
- `POST /api/ai/chat` streams or returns labeled mock when keys absent.
- `verify.mjs` AI group green (providers, secret safety, quotas, graceful failure).

## 8. Done criteria
5 assistants live behind gateway with quotas, scoping, and human-approval gates.
