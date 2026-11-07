# Level 12 — Open Source Hacker · Persona Specs

| | |
|---|---|
| Code | `L12_OSS_HACKER` · Stage 5, Open Source & Engineering · 300 XP |
| Topics | GitHub exploration · Forking repositories · Git workflows · Understanding licences · Modifying projects · Pull requests · Contributing to open-source communities |
| Unlock | Level 11 approved |
| Status | Spec only. Target repos are chosen **only from the verified library**, looking for "good first issue" labels and an active maintainer response in the last 90 days, checked when the repo is assigned. |

## Shared and protected
**Outcomes.** The learner can:
- evaluate a repo (activity, licence, contributing guide, code of conduct)
- fork and branch
- make a meaningful change
- open a pull request that follows the project's rules
- respond to review
- explain licence obligations

| # | Activity | Protected rules |
|---|---|---|
| 1 | Mission Briefing | 1 check question |
| 2 | Learn | 5 lessons: reading a repo (README, CONTRIBUTING, issues) · fork → branch → PR · licences (permissive, e.g. MIT and Apache-2.0; copyleft, e.g. GPL; no licence = all rights reserved) · etiquette and AI-generated contributions (follow each project's policy on AI-assisted PRs) · handling review. Quiz at 60% |
| 3 | Explore GitHub | Evaluate 3 library repos on activity, licence, contributing guide and issue response time. 3 questions |
| 4 | Build: Real Contribution | Fields:<br>`repo_eval` (table for the chosen repo)<br>`issue` (link; the learner commented first, per project norms)<br>`pr` (link to an open or merged PR)<br>`change` ≥40 words<br>`review_response` (replies to review, or "awaiting review" with the date)<br>`licence` ≥30 words (what the licence lets them and others do with the change)<br>`ai_use` (whether AI helped, and disclosure per the project's policy) |
| 5 | Submit Proof | PR link. **A merge isn't required** (maintainers' timing isn't under the learner's control). Quality is judged on the PR itself. Fallback: a PR to an instructor-run practice repo, which scores at most "3" on the impact dimension |
| 6 | Evaluation and Boss | 6 licence and contribution situations |

**Boss choices:**
- 0 = Allowed
- 1 = Allowed with conditions (attribution, notice, share-alike)
- 2 = Not allowed or don't do it

**Proposed rubric:**

| Dimension | Weight |
|---|---|
| Repo evaluation | 0.10 |
| Quality of change | 0.25 |
| PR communication | 0.20 |
| Licence understanding | 0.15 |
| Impact | 0.10 |
| Reflection | 0.10 |
| Boss | 0.10 |

---

## Young Coder
- **Briefing:** Their first contribution: fix a typo, improve beginner docs, or add a Python example to a beginner-friendly library repo.
- **Check question:** A repo has no LICENSE file. Can they copy its code into their own project?
  - Yes
  - **No: without a licence, the author keeps all rights**
  - Yes, if they credit it

  Answer: 1.
- **Learn demo:** Fork a repo, branch, edit, and open a PR in the instructor's practice repo, then respond to a review comment.
- **Build:** A docs or example PR to a library repo. The practice-repo fallback is allowed.
- **Boss scenarios:**
  1. Using MIT code with its notice kept [1]
  2. Reading any public repo to learn [0]
  3. Copying a no-licence repo into their game [2]
  4. Fixing a typo in docs [0]
  5. Using GPL code in a project they share [1]
  6. Submitting a classmate's code as their PR [2]
- **Safety:** The GitHub profile shows no real name, school or photo. Use the noreply email. The minimum age follows GitHub's terms (staff confirm), and guardian consent is needed for public activity.

## Student & Career Starter
- **Why it matters:** Open-source PRs are public proof of skill. This is an emphasis level for them.
- **Briefing:** Make a PR that a recruiter can read: a bug fix or test added to an active project from the library.
- **Check question:** A maintainer asks them to split the PR into two. They:
  - Argue
  - **Do it, keep each PR focused, and link them**
  - Close the PR

  Answer: 1.
- **Learn demo:** Reproduce an issue locally, write a failing test, then fix it.
- **Build:** A code or test PR on a real repo with full review interaction, linked from the portfolio.
- **Boss scenarios:**
  1. Apache-2.0 code used with NOTICE kept [1]
  2. Forking to experiment [0]
  3. Opening 20 AI-generated, low-effort PRs for a contribution streak [2]
  4. Adding tests [0]
  5. Using LGPL in an app [1]
  6. Removing a licence header [2]

## Engineering Professional
- **Briefing:** A meaningful contribution, such as a bug fix, performance improvement or feature, to a project their team depends on, done within the employer's open-source policy.
- **Check question:** They want to contribute a fix found at work. First they:
  - Push it
  - **Check the employer's OSS contribution policy, and any CLA or DCO the project requires**
  - Post it anonymously

  Answer: 1.
- **Learn demo:** Bisect a regression, write a minimal repro, and open a PR with a benchmark.
- **Build:** A substantive PR: tests, a changelog entry where the project uses one, and a design discussion in the issue. `licence` covers compatibility with the employer's product.
- **Boss scenarios:**
  1. An MIT dependency in a commercial product, with notices kept [1]
  2. Reading the source to debug [0]
  3. Copying GPL code into proprietary closed source that's distributed [2]
  4. Upstreaming a bug fix under the employer policy [0]
  5. Apache-2.0 with modifications marked [1]
  6. Contributing employer-confidential code [2]

## AI Builder, Enthusiast
- **Briefing:** Contribute to a no-code or low-code or AI tool they used in Levels 6–7: a template, an integration doc or a small fix.
- **Check question:** Their agent wrote the whole PR. Per most project policies, they should:
  - Hide it
  - **Disclose AI assistance where the project asks, and make sure they understand and have tested every line**
  - Refuse to say

  Answer: 1.
- **Learn demo:** Read CONTRIBUTING for the project's AI policy, then open a docs PR.
- **Build:** A template, docs or integration PR, with review interaction and an `ai_use` disclosure.
- **Boss scenarios:**
  1. Using an MIT template in their app [1]
  2. Studying an open-source app's structure [0]
  3. Re-selling a no-licence template [2]
  4. Fixing a broken docs link [0]
  5. A CC BY image in their docs [1]
  6. Taking credit for someone else's PR [2]

## Business Owner
- **Briefing:** Understand open source as a **user and buyer**, and give back once: a translation, a docs improvement or a well-written bug report turned into a PR, for a tool they use.
- **Check question:** A free open-source tool fits their business. Before relying on it, they check:
  - Only the stars
  - **The licence, how active the maintainers are, and whether paid support exists**
  - The logo

  Answer: 1.
- **Learn demo:** Evaluate 3 open-source tools for their business, then write a good issue report.
- **Build:**
  - A docs or translation PR (e.g. a Hindi or Telugu translation where the project accepts them), with repo evaluation and licence notes for business use.
  - The same bar applies: a real PR and review handling.
  - A mentor may pair on the Git steps.
- **Boss scenarios:**
  1. Using an MIT tool in their shop [0]
  2. Self-hosting GPL software for internal use [1]
  3. Removing a project's branding and reselling it as their own when the licence forbids it [2]
  4. Translating docs [0]
  5. Modifying Apache-2.0 software and noting the changes [1]
  6. Using a no-licence app's code for their website [2]
