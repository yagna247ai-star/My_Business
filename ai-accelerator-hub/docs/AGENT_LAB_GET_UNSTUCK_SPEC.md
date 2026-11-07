# Agent Lab: Get Unstuck (Error Gallery, Fix Finder, AI Coach and Mentor Help) — Specification

| | |
|---|---|
| Version | 1.0, 2026-11-07 |
| Trigger | Learner review of `Agent Lab · AI Accelerator Hub (1).pdf`: *"I get an error and need help right here. Show what the output should be, what errors can happen and how to fix them, so learners don't get stuck. Let them ask the AI agent or a mentor from that step."* |
| Builds on | `docs/AGENT_LAB_SETUP_GUIDE_SPEC.md` (step cards), `lib/ai/coach.ts` (AI coach), `docs/CHILD_SAFETY_POLICY.md` |
| Code | `lib/domain/troubleshoot.ts` (catalogue and matcher, pure) · `lib/domain/help.ts` (mentor help requests) · `components/learn/StuckPanel.tsx` · `app/(app)/review/help` · migration `20261107090000_help_requests` |
| Tests | `apps/web/test/get-unstuck.test.ts` |

---

## 1. Problem
The guide shows what to *do*, but not what *failure* looks like. When a command fails, the learner sees an error they can't read and has to leave the lab to ask for help. Mentors then get "it doesn't work" with no context. And because the AI coach is off in some institutions (no provider key), AI-only help isn't reliable.

## 2. Solution: three levels of help, on every step card
```
┌ Install Kilo Code ──────────────────────────────────────────────┐
│ WHY / DO / YOU SHOULD SEE / IF NOT          (from the guide spec)│
│ ───────────────────────────────────────────────────────────────  │
│ [ 🛟 Stuck on this step? ]                                       │
│   ① Common problems here  (visual error gallery, always works)  │
│      ┌ What you might see ─────────────── (red terminal) ┐      │
│      │ npm error code E404                               │      │
│      └───────────────────────────────────────────────────┘      │
│      Why: …   Fix: [$ npm install -g @kilocode/cli  ⧉]  Source ↗ │
│   ② Paste what your terminal shows → [Find a fix]               │
│      → instant match from the catalogue (no AI, works offline)   │
│   ③ Still stuck?  [🤖 Ask the AI coach]  [🧑‍🏫 Ask a mentor]    │
│      AI reply shown inline · mentor thread with status + replies │
└──────────────────────────────────────────────────────────────────┘
```

| Level | What it is | Works when | Who answers |
|---|---|---|---|
| ① Error gallery | Known errors for *this* step, OS and agent, each with its exact text, cause, fix commands and source | Always | Curated catalogue |
| ② Fix finder | The learner pastes output; a deterministic matcher ranks catalogue entries | Always; runs in the browser with no network | Catalogue |
| ③a AI coach | The existing coach (`code-mentor`), sent the step, agent, OS, method and the redacted error | Only when the institution has an AI key; otherwise it shows "not switched on, ask a mentor" | AI, advice only |
| ③b Mentor help | A help request attached to the step, visible to the institution's mentors, reviewers and instructors | Always | A person |

## 3. Error catalogue (`KNOWN_ERRORS`)
Each entry has:
- `id`
- `title`
- `match` (case-insensitive regex)
- `appliesTo` (step kinds, OS, agents, methods)
- `looksLike` (verbatim text)
- `provenance` (`vendor-doc` or `observed`)
- `cause`
- `fix[]` (text, plus an optional command)
- `source[]`

**Rules:**
- Only errors documented by the vendor, or observed by running the real tool, are included. Observed outputs say which tool version they came from.
- Fix commands are copied from the source. No fix uses `sudo`, and none disables TLS (`strict-ssl false` is never suggested).
- Where an install script must be approved, we read the script first and record what it does.

| id | Looks like (excerpt) | Fix | Source |
|---|---|---|---|
| `npm-e404` | `npm error code E404` … `404 Not Found - GET https://registry.npmjs.org/<name>` | Use the exact package name and copy the command (e.g. `@kilocode/cli`; a space splits it into two packages). If the name is right, npm says it's usually a temporary registry glitch, so try again later | Observed (npm 11.17.0); docs.npmjs.com/common-errors |
| `npm-allow-scripts` | `npm warn allow-scripts … has install scripts not yet covered by allowScripts` | Re-run with the flag npm prints: `npm install -g --allow-scripts=@kilocode/cli` (or `@opencode/cli`). We reviewed Kilo's `postinstall.mjs`: it copies the platform binary into the package's `bin/` and runs `kilo --version`, and contacts no other service | Observed (npm 11.17.0, @kilocode/cli 7.8.27); docs.npmjs.com config `allow-scripts` |
| `npm-eacces` | `EACCES` / permission denied | Don't use sudo. Reinstall Node with nvm (recommended), or move npm's global folder: `npm config set prefix ~/.local` and add `~/.local/bin` to PATH | docs.npmjs.com (resolving EACCES) |
| `npm-ebadengine` | `EBADENGINE` / `Unsupported engine` | Your Node.js is too old for this package. Install the LTS version (`nvm install --lts`), open a new terminal, check `node -v` | Claude Code setup docs; npm registry `engines` |
| `npm-enospc` | `ENOSPC` | Free some disk space and try again | docs.npmjs.com/common-errors |
| `ps-scripts-disabled` | `running scripts is disabled on this system` | `Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser` | Microsoft Learn |
| `nvm-not-found` | `nvm: command not found` | Close the terminal and open a new one | github.com/nvm-sh/nvm |
| `node-not-found` | `command not found: node` / `'node' is not recognized` | Node.js isn't installed, or the terminal was opened before installing. Do the Node.js step, then open a new terminal | Node step of the guide |
| `agent-not-found` | `command not found: kilo|codex|opencode` | Open a new terminal; check it installed with `npm ls -g <package>`; if it's missing, re-run the install | Observed (zsh); kilo.ai CLI docs |
| `claude-path` | `command not found: claude` | Add `~/.local/bin` to PATH (zsh: `echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc` then `source ~/.zshrc`), then open a new terminal | Claude Code terminal guide |
| `claude-irm-cmd` | `'irm' is not recognized` | You're in CMD; open PowerShell (`Win + X`), or use the CMD installer line | Claude Code setup docs |
| `claude-html` | `syntax error near unexpected token '<'` | The download returned a web page: check that the region is supported, retry, or use Homebrew | Claude Code terminal guide |
| `claude-dyld` | `dyld: cannot load` / `built for Mac OS X 13.0` | macOS older than 13: update macOS | Claude Code terminal guide |
| `claude-tls` | `Could not create SSL/TLS secure channel` | Run the TLS 1.2 line from the docs before the installer | Claude Code terminal guide |
| `claude-32bit` | `does not support 32-bit Windows` | You opened PowerShell (x86): open the entry without (x86) | Claude Code terminal guide |
| `brew-shellenv` | `brew: command not found` (right after installing Homebrew) | Run the "Next steps" lines the installer printed: `eval "$(/opt/homebrew/bin/brew shellenv)"` on Apple silicon | docs.brew.sh/Installation |

**Matcher** (`diagnose(text, scope)`):
1. Redact secrets and personal data first.
2. Test every entry's `match`.
3. Rank entries that match the current step, OS and agent first.
4. Return at most 3.

It's pure and deterministic, so the same text always gives the same result.

**Expected output** (spec addition to the guide): npm methods show a successful-install example, `added 3 packages in 708ms`. That's from a real npm 11.17.0 dry run of `@kilocode/cli`; the numbers vary from run to run.

## 4. AI coach on a step
- `POST /api/v1/coach/code-mentor` with `context.lab = { runId, stepId }`. The server looks up the run (it must be the learner's own) and adds a context line: agent, OS, method, step title, plus the titles of any catalogue matches.
- The learner's pasted text is redacted (existing rules), and the minor rules apply (existing).
- With no AI key, the existing `AI_NOT_CONFIGURED` response is shown as: *AI help isn't switched on for your institution — ask a mentor below.*
- The coach advises only. It can't change the run.

## 5. Mentor help requests
**Data:**
- `help_requests`: id, tenantId, learnerId, source=`agent_lab`, runId, agent, os, method, stepId, stepTitle, errorText (redacted), matchedIds (JSON), state `open → answered → resolved`, createdAt, updatedAt, resolvedAt
- `help_messages`: id, requestId, authorId, authorRole `learner|staff`, body (redacted), createdAt

**Rules:**
| # | Rule |
|---|---|
| H1 | Only the learner who owns the run creates a request, for one of their own runs. The step must be one of that run's guide steps |
| H2 | The error text is 10–4,000 characters, redacted, and **rejected if it contains a secret key** (with an instruction to revoke the key) |
| H3 | At most **3 open** requests per learner (anti-spam); the rate limit is shared with the API |
| H4 | The queue is visible to staff with `review:read` in the **same institution only**, oldest first. Learners see only their own requests |
| H5 | Staff reply (`review:decide`) → state `answered` and the learner is notified. The learner replies → state `open` and the staff who replied are notified |
| H6 | The learner or staff marks a request **resolved**. A resolved request can't take new messages (the learner opens a new one instead) |
| H7 | Under-18s: requests go to the institution's staff queue (supervised support, never a private chat between peers); emails and phone numbers are rejected, as in the feed |
| H8 | Audit: `help.requested`, `help.replied`, `help.resolved`. Requests and messages are included in **Download my data** |

**UI:**
- **Learner:** inside the step card's Stuck panel, showing their requests for that step (status chip, conversation, reply box, "Mark resolved").
- **Staff:** a **Help requests** page (`/review/help`) with a nav entry and an open-count badge. Each card shows the learner, agent and OS, step, method, the error in a terminal block, the matched catalogue fixes, the conversation, a reply box and "Mark resolved".

## 6. Acceptance criteria → tests
| # | Criterion |
|---|---|
| U1 | Every catalogue entry has a looks-like sample its own regex matches, at least one fix and an https source; no fix contains `sudo` or `strict-ssl` |
| U2 | `diagnose` finds `npm-e404` for the real E404 output and `npm-allow-scripts` for the real warning; it ranks step-specific entries first; it returns nothing for unrelated text |
| U3 | The gallery for Kilo CLI on macOS, Install step, includes E404 and allow-scripts; the Windows Node step includes the execution-policy entry |
| U4 | A help request: own run only, valid step only, secret rejected, contact details rejected for minors, at most 3 open |
| U5 | Staff in the same institution see the queue; other institutions get 404; learners can't open the queue |
| U6 | Reply, answered, notification; learner reply, open; resolve; no messages after resolve; audit rows |
| U7 | The AI coach with lab context: without an AI key it returns `AI_NOT_CONFIGURED` and spends no credit; another learner's run gives 404 |
| U8 | Data export includes help requests and messages |
