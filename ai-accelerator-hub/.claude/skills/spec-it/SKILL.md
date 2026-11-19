---
name: spec-it
description: Turn a feature request, bug report, or stakeholder feedback into a written spec in docs/ that follows this repo's *_SPEC.md format (header table, problem, solution, code and test pointers, acceptance criteria). Use when the user says "spec it", "write a spec for", "spec this out", or asks for a spec before building.
---

# spec-it

Write a specification for the request in `docs/`, matching the existing `docs/*_SPEC.md` files. Write the spec only. Do not change application code in this skill.

## 1. Gather the facts

Before writing, check the repo so the spec names real files:

- Read the request and any feedback or PDF/document the user points to.
- Look for related specs: `ls docs/*_SPEC.md docs/level-specs`. Link any that this one builds on.
- Find the code this touches (`grep -rn` for the feature's nouns, routes, and components). Only cite paths you have confirmed exist.
- Find existing tests in `apps/web/test/` or the package's test folder, to name where new tests belong.
- If the request depends on a decision only the user can make (for example, who may see the data, or a paid vs free rule), list it under Open questions. Do not stop to ask unless the spec cannot be written without the answer.

## 2. File name and location

- Path: `docs/<TOPIC>_SPEC.md`, with TOPIC in SCREAMING_SNAKE_CASE (for example `AGENT_LAB_GET_UNSTUCK_SPEC.md`).
- If a spec for the same topic exists, update it and bump its Version in the header. Do not create a duplicate.

## 3. Structure

Use this layout, in this order. Drop a section only if it truly does not apply, and say so in one line rather than leaving it empty.

```markdown
# <Title> — Specification

| | |
|---|---|
| Version | 1.0, YYYY-MM-DD |
| Trigger | The request or feedback, quoted or closely paraphrased |
| Builds on | Related specs and files, as links or paths |
| Code | Files to create or change, as paths |
| Tests | Test file(s) to add or extend |

---

## 1. Problem
What is wrong or missing, and who is affected. State it in 2–4 sentences. No solution yet.

## 2. Solution
A short overview, then a diagram or table if the flow has steps or levels.

## 3. Behaviour
Numbered rules a reviewer can check. Cover the happy path, empty and error states, and permissions.

## 4. Data and API
New or changed tables, fields, routes, or events. Include migration names if known.

## 5. UI
Screens and components affected, with the states each one shows.

## 6. Acceptance criteria
A checklist of observable outcomes, each testable:
- [ ] Given …, when …, then …

## 7. Out of scope
What this spec deliberately does not cover.

## 8. Open questions
Decisions still needed, each with a suggested default.
```

## 4. Writing rules

- Write in plain English for the people who will review it. Short sentences, concrete nouns.
- Every rule must be checkable. Replace "fast" or "user-friendly" with a number or an observable behaviour.
- Keep the spec as wide as the request, no wider. Put tangents under Out of scope.
- Follow the project's policies. If the feature touches learners under 18, payments, or personal data, check `docs/CHILD_SAFETY_POLICY.md` and any privacy docs, and add a short Compliance note.
- Do not invent file paths, table names, or APIs. Mark anything proposed but not yet in the code as "(proposed)".

## 5. Finish

1. Re-read the file once for vague words, unchecked claims, and broken links.
2. Reply with the spec's path (full path from the repo root), a three-line summary, and the number of open questions.
3. If the user asked to commit, follow the normal git rules. Do not commit unless asked.
