# 02 — AI coach assistants

**Status:** not set up. Learners see "AI coaches are not set up for this institution yet."

## Current state

- `apps/web/lib/ai/coach.ts`
  - The only provider is `anthropicProvider` (line 45). It is configured when `ANTHROPIC_API_KEY` or `ANTHROPIC_AUTH_TOKEN` is set. Neither is set on production.
  - `PROVIDERS` contains only Anthropic. A comment says self-hosted and OSS adapters go here.
  - When no provider is active, `coach.ts:96` throws `notConfigured('AI', …)` before any credit is spent. Nothing is mocked and nothing is faked.
  - Each message spends one `ai_credits` entitlement atomically and refunds on failure. Input is redacted before it reaches the model. Guardrails are appended to the system prompt.
  - Models in `PRICE`: `claude-opus-5-5`, `claude-sonnet-5-5`, `claude-haiku-5-5`. Requests use the beta header `server-side-fallback-2026-07-01`.
- `GEMINI_API_KEY` is set on production. **No code reads it.** `LITELLM_*` and `OPENAI_API_KEY` are also unread.

## Gap

- No provider key is wired, so the assistants are off.
- Gemini is not supported. Adding it requires a new adapter that implements the `AiProvider` interface.
- Model IDs and beta parameters have not been checked against a live account.

## Risk

- Low: the assistants are off, not broken.
- Medium once enabled: cost controls (`AI_TENANT_MONTHLY_BUDGET_USD`, `AI_USER_DAILY_BUDGET_USD`) are set, but spend tracking has not been tested end to end.

## Decision needed

- Which provider: Anthropic (ready in code, needs one key) or Gemini (needs a new adapter, which I can write).

## Steps to close

**If Anthropic:**
1. Add `ANTHROPIC_API_KEY` to Vercel Production. Remove the unused `GEMINI_API_KEY` if you do not want Gemini.
2. Redeploy. Sign in as a learner and send a message to a coach.
3. Confirm the response is live and a credit is spent. Confirm a refused or failed call refunds the credit.

**If Gemini:**
1. Write `geminiProvider` implementing `AiProvider`, add it to `PROVIDERS`, and add a unit test.
2. Set `GEMINI_API_KEY` (already present) and redeploy.
3. Run the same checks as above.
