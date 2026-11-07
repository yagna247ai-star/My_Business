# M05 — GitHub Lab (BRD-06 · §13 §2 · REQ-GIT-01/02)

## 1. Objective
Build Explore → Fork → Modify → Build → Deploy → Showcase with verified, licensed OSS.

## 2. Prerequisites
- M02 complete (Activity 3 Explore GitHub consumes the library).
- Read `apps/web/app/api/github/route.ts` (curated list with license/lastVerified).

## 3. Build steps
1. Implement GitHub OAuth (incremental scopes) linking `githubId`.
2. Implement repo linking + commit history (authorized) + PR submissions + showcase.
3. Curate library across voice/STT/TTS/OSS LLMs/agents/RAG/n8n/image/video/multimodal.
4. Record per repo: URL, description, difficulty, prereqs, license, lastVerified. Verify each.
5. Never list a repo as OSS without a confirmed license (e.g. Voicebox = research-only, Whisper = MIT).

## 4. ARB gate
- Is license the gate for listing (no license → not listed as OSS)?
- Is repo verification a recorded check (URL reachable, license file seen, date stamped)?
- Are tokens scoped minimally and stored server-side?
- Is showcase data derived from real API/events, not hand-typed?

## 5. NFR gate
- Cache curated list; refresh verification on schedule.
- Validate all user-submitted URLs server-side (SSRF-safe, no trust).
- Rate-limit GitHub API calls; handle revocation gracefully.

## 6. Red-team review
- Try linking a repo you do not own and reading private commits. Must block.
- Try submitting `http://evil.internal` as repo URL. Must reject (SSRF guard).
- Try listing a public-but-proprietary repo as OSS. Must fail license check.
- Try forging commit history in showcase. Must reconcile against API.

## 7. Acceptance
- `GET /api/github` returns curated repos with license + lastVerified + showcase.
- `verify.mjs` learning/GitHub items green; no fabricated repos in library.

## 8. Done criteria
OAuth + linking + verified curated library with licenses and dates. No fake repos.
