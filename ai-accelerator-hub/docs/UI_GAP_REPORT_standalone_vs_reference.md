# UI Gap Report: `standalone.html` vs. UI Reference PDFs

**Product:** AI Accelerator Hub
**Artefact reviewed:** `ai-accelerator-hub/standalone.html` (552 lines, single page)
**Reference set:** `ai-accelerator-hub/UI-design/` (4 PDFs, one full-page screenshot each)
**Related requirement:** `docs/RTM.md`, REQ-REF-02, "Freedom-With-AI dashboard adaptation (sidebar, unlock, proof, coach, rankings)"
**Date:** 2026-11-04
**Audience:** product owner, designer, and any LLM or engineer who will implement the fixes

---

## 0. How to read this report

### 0.1 Source map: which PDF is which screen

| Ref ID | File | Screen shown | Breadcrumb in capture |
|---|---|---|---|
| **REF-FEED** | `Hackathon · Freedom With AI.pdf` | Community feed (Posts tab) | "You are here **Feed**" |
| **REF-RES** | `Hackathon · Freedom With AI (1).pdf` | Resources library | "You are here **Resources**" |
| **REF-SHOW** | `Hackathon · Freedom With AI (2).pdf` | Project showcase wall | "You are here **The showcase**" |
| **REF-UNSTUCK** | `Hackathon · Freedom With AI (3).pdf` | Help / AI coach | "You are here **Unstuck**" |

### 0.2 Rules this report follows (no hallucination)

1. Every "Reference" statement describes something **visible in the PDFs**. Where I give a size or colour, it was **measured from the rendered PDF**. Colours are pixel samples, accurate to about ±3 per channel because of JPEG/PDF compression.
2. Every "Current" statement cites **line numbers in `standalone.html`**.
3. Screens that appear in the reference **sidebar** but have **no PDF** (Home, Levels, Ranks, Feedback, Certificates, Diamond, the Feed "Wins" tab) are listed in §9 as **not specified**. This report does **not** invent designs for them.
4. The reference is a third-party product ("Freedom With AI"). Copy its **structure, patterns and behaviour**, never its **brand name, founder name, logo or member content**. All sample text in the reference (member names, cities, posts, founder letter) must be replaced with AI Accelerator Hub's own content or seeded demo data.

### 0.3 Severity scale

| Severity | Meaning |
|---|---|
| **P0 – Blocker** | A whole module or core shell element in the reference is missing |
| **P1 – Major** | The module exists, but key behaviour or structure differs from the reference |
| **P2 – Minor** | Visual or detail mismatch, or a polish item |
| **P3 – Hygiene** | Code or accessibility defect found while reviewing |

---

## 1. Executive summary

`standalone.html` is a **dark, space-themed marketing page with a dashboard preview** in one scroll. It contains: hero, metric tiles, journey rail, Neo4j graph, levels grid, Level 1 timeline, leaderboard and tech footer. The reference is a **multi-screen product app** built on a **dark sidebar with light content**. It has four fully designed modules: **Feed, Resources, Showcase and Unstuck**.

**Headline findings**

| # | Finding | Severity |
|---|---|---|
| 1 | **None of the 4 reference modules exist** in the standalone. Sidebar links for Feed, Resources and Unstuck only show a toast ("full app at localhost:3000…", lines 494–508). **Showcase has no link at all.** | P0 |
| 2 | **App shell differs.** The reference has a dark navy sidebar, a **light** content canvas and a utility top bar (breadcrumb, streak × multiplier, rank badge, theme toggle, sound toggle, profile). The standalone is fully dark, with a floating marketing pill nav (anchors, "Live cohort", "Neo4j · bolt://7687", "Start free"). | P0 |
| 3 | **Information architecture differs.** The reference has a short, progress-tiered nav (Home → **GOLD** tier group [Levels, Ranks, Feed, Resources, Showcase] → Unstuck, Feedback, Certificates, Diamond). The standalone has 17 items in 5 functional groups (lines 107–170). | P1 |
| 4 | **No global "Unstuck" floating help button.** The reference shows a persistent bottom-right FAB on Feed and Resources. | P1 |
| 5 | **Engineering internals are shown to learners**: Cypher queries, "TENANT ISOLATION · RLS", "idempotency_key UNIQUE · hash chain", the ZSET/ledger/graph "Source" column, the "idem xxxx" toast, and the stack footer (lines 89, 241–258, 285–286, 317–337, 388–398, 512). The reference shows **zero** implementation detail. | P1 |
| 6 | **Numbers contradict each other** inside the page: XP 23 vs 57, rank #3 vs #2, "15 levels" shown as 12 tiles, "1/15" progress while L01 is not complete (§8). | P1 |
| 7 | **Low-contrast text**: `text-white/20`, `/30` and `/40` on `#080c1a` measure about 1.8:1, 2.6:1 and 3.8:1. That fails WCAG 2.2 AA (4.5:1) and is used widely (§10). | P1 |
| 8 | **Theme conflict with project docs.** The reference is light-canvas, but `MASTER_IMPLEMENTATION_PLAN.md:254` says "light-mode variant not designed (dark-first system)" and `:114` forbids gold on white (1.83:1). A light theme needs new, AA-checked tokens (§2.1). | Decision |

**Recommended direction:** keep the standalone's strong parts (level/activity data model, Level 1 timeline, proof-submission form, collapsible sidebar with rail and drawer). Rebuild the shell to the reference pattern, add the 4 modules as real views, and move all engineering content to an internal or admin view.

---

## 2. Global shell (applies to every screen)

### G-01 · Theme model: dark sidebar plus light canvas (P0)

**Reference (all 4 PDFs)**

- The sidebar is a dark navy vertical gradient: about `#081830` at mid-height, darkening to about `#061229`. There is a subtle blue glow in the upper area, and below the nav the sidebar becomes flat near-black navy.
- The content canvas is light: about `#F4F7FD` on Feed, about `#EDF4FC` on Unstuck, with a very soft radial lightening.
- Cards are white (`#FEFFFF`), with a large radius (visually about 16–20px), a 1px hairline border and a soft, wide, low-opacity shadow.
- The top bar is near-white (about `#FBFCFE`) with a bottom hairline.
- A **theme toggle (sun icon)** sits in the top bar, so the product supports at least light and dark.

**Current**

- The whole page is dark: `body{background:var(--navy)}` (line 14), a nebula gradient (line 64) and a star field (lines 65, 510–511).
- Cards are translucent glass on navy, e.g. `bg-[rgba(18,24,46,0.6)]`.
- There is no theme toggle.

**Required change**

1. Introduce semantic tokens rather than raw colours: `--surface-app`, `--surface-card`, `--surface-sidebar`, `--text-primary`, `--text-secondary`, `--text-muted`, `--border-subtle`, `--accent-gold`, `--accent-gold-ink`, `--accent-blue`, `--success`, `--danger`.
2. Light theme (default for the content area, matching the reference):

   | Token | Value |
   |---|---|
   | `--surface-app` | ≈ `#F4F7FD` |
   | `--surface-card` | `#FFFFFF` |
   | `--surface-sidebar` | gradient `#0A1A36 → #061229` |
   | `--text-primary` | ≈ `#0F172A` |
   | `--text-secondary` | ≈ `#475569` |
   | `--border-subtle` | ≈ `#E6EBF5` |

3. Dark theme: keep the existing navy palette (`--navy #080c1a`, `--card #12182e`) as the dark variant, chosen by the sun/moon toggle.
4. **Gold rule (project-mandated):** never use gold as text on white. In the reference, gold always appears as a **fill with dark text on top** (Posts tab, Post button, "General" chip, "Open project" button) or as a **tinted chip with dark brown text**. Use:
   - `--accent-gold-fill`: gradient ≈ `#EBD298 → #B1873D` (sampled from "Open project")
   - `--accent-gold-ink`: dark brown ≈ `#6B4E16` for text on cream chips
   - Verify each pair is at least 4.5:1.
5. Remove the star field and nebula from the app shell. They can stay on a public marketing landing page only (see §7).
6. Persist the theme choice (`localStorage` key, e.g. `ah_theme`, wrapped in try/catch) and respect `prefers-color-scheme` on first visit.

**Acceptance criteria**

- Toggling the theme switches every surface.
- No hard-coded hex values remain in components.
- Every text/background pair is at least 4.5:1 (body) or 3:1 (large text and UI glyphs).

---

### G-02 · Sidebar: structure and information architecture (P1)

**Reference**

Top to bottom:

1. **Brand row:** logo (left) and a square **collapse button** with a "|<" glyph (right), at the top of the sidebar.
2. **Home**: house icon, top-level item.
3. **Tier group "GOLD"**: rendered as a pill containing a medal icon, the uppercase label "GOLD" and a chevron (collapsible). Children are indented with a **vertical tree guide line** on the left:
   - **Levels** (calendar-grid icon)
   - **Ranks** (bar-chart / podium icon)
   - **Feed** (speech-bubbles icon)
   - **Resources** (open-book icon)
   - **Showcase** (trophy icon)
4. **Divider** (1px, low-contrast).
5. Top-level items: **Unstuck** (lifebuoy icon), **Feedback** (megaphone/flag icon), **Certificates** (certificate icon), **Diamond** (diamond icon with a small circular badge, which looks like a lock or "next tier" marker).

Active states (two styles are visible):

- **Child of a tier group** (Feed, Resources, Showcase): a raised dark pill (≈ `#2C303D`), a filled/solid icon, white semibold label and a **small gold dot at the right edge**. There is a soft blue glow beneath the pill.
- **Top-level item** (Unstuck): a vivid **blue-indigo gradient pill** (right side ≈ `#4047D5`), white label and icon, with an outer glow.

Inactive items have light grey-blue text on navy, with outline icons. The tier pill "GOLD" has a dark fill (≈ `#2F323C`) with a thin gold outline when its group holds the active page (Feed, Resources, Showcase captures). It shows as plain text and a chevron when the active page is outside the group (Unstuck capture).

**Current** (lines 98–181)

- 5 functional groups with 17 links:
  - LEARN: Home, My Levels, Learning Missions, AI Playground
  - BUILD: My Projects, GitHub Lab, Hackathons
  - COMMUNITY: Squads, Community Feed, Leaderboard
  - GROW: Resources, AI Career Paths, My Portfolio, Certificates
  - SUPPORT: Unstuck / AI Coach, Feedback, Profile
- Group headers are small uppercase text, not a tier pill.
- The active state is a **white** pill with navy text (line 115). There is no gold dot.
- The collapse control is a **bottom** "Collapse" button (lines 176–179), not a top-right "|<" button.
- A "Neo4j graph · 15 levels · DAG…" info box sits inside the nav (lines 171–174). This is internal detail.
- **Missing compared with the reference:** Showcase, Ranks (the standalone uses "Leaderboard"), Diamond, and the tier-group concept.

**Required change**

1. **Decision needed (§11, D-1):** adopt the reference IA, or keep the 17-item IA. The recommended hybrid:
   - **Primary nav (reference order):** Home · [Tier group: Levels, Ranks, Feed, Resources, Showcase] · divider · Unstuck · Feedback · Certificates · next-tier item.
   - Move the remaining standalone items (Learning Missions, AI Playground, My Projects, GitHub Lab, Hackathons, Squads, AI Career Paths, My Portfolio) **inside Levels or Home** as in-page sections, or behind a "More" group. Do not keep them as top-level clutter.
   - Move **Profile** to the top-bar user chip (G-03), as the reference does.
2. **The tier-group label is data-driven:** it shows the user's current tier name (reference: "GOLD") with a medal icon. The next-tier item ("Diamond") shows a lock badge until it is unlocked. Do **not** hard-code "GOLD".
3. Rename "Community Feed" → **Feed**, "Leaderboard" → **Ranks**, "Unstuck / AI Coach" → **Unstuck**. This follows the reference labels: short, one word.
4. Add the **Showcase** route (trophy icon).
5. Active-state styling: implement both variants from the reference (dark pill with gold dot for children of the tier group, blue-indigo gradient pill for top-level items). Each active item gets `aria-current="page"`.
6. Move the collapse control to the **brand row, top-right**, as a 32×32 square button with the "|<" glyph (and ">|" when collapsed). Keep the existing 64px rail behaviour and `localStorage` persistence (lines 468–493).
7. Delete the Neo4j info box (lines 171–174) from the learner sidebar.
8. Keep the existing mobile drawer, overlay, Esc-to-close and resize handling (lines 427–466). It is good and not contradicted by the reference.

**Acceptance criteria**

- The sidebar order and labels match the reference.
- The tier name comes from user data.
- Exactly one item has `aria-current="page"`.
- The collapse button is at the top-right and keyboard operable.
- The rail mode shows a tooltip (`title` or a custom tooltip) per icon.

---

### G-03 · Top bar (utility header) (P0)

**Reference**

A full-width bar above the content, right of the sidebar, near-white with a bottom hairline.

- **Left:** a breadcrumb in the form "You are here **{Page name}** >". The prefix is muted; the page name is bold dark; a chevron follows.
- **Right**, in order:
  1. **Streak pill:** flame icon, "**0 days ×1.0**" (streak count and XP multiplier). Pale blue fill (≈ `#F2F7FE`), rounded-full.
  2. **Rank badge:** "**ARCHITECT**" in uppercase, letter-spaced, as an outlined pill. Cream fill with gold-brown border and text on Feed, Resources and Showcase (≈ `#F9F5E7` fill); pale blue fill with blue text on Unstuck. The colour may follow the page context; confirm (§11, D-4).
  3. **Theme toggle:** square icon button with a sun glyph.
  4. **Sound toggle:** square icon button with a speaker glyph.
  5. **User chip:** round avatar photo and display name, as a rounded pill with a border.

**Current** (lines 69–93)

- A floating glass "pill" nav, `sticky top-4`, max-width 1160px, centred over the page.
- Contents: hamburger (mobile), "AH" monogram, "AI ACCELERATOR HUB / LEARN · BUILD · PROVE", anchor tabs (Journey, Levels, Graph), "Live cohort" badge, "Neo4j · bolt://7687" badge and a "Start free →" CTA.
- Missing: breadcrumb, streak × multiplier, rank badge, theme toggle, sound toggle and user chip.

**Required change**

1. Replace the pill nav with a **full-width app header** (height about 64px, sticky, `--surface-card`, bottom border `--border-subtle`) that spans the content column.
2. **Breadcrumb:** `<nav aria-label="Breadcrumb">` with "You are here" (muted) and the current page title (semibold). It updates per route.
3. **Streak pill:** shows `{current_streak} days ×{multiplier}` from `GET /api/v1/gamification/me` (the endpoint is defined in `ai-accelerator-hub-architecture.md:434`). Use a tooltip to explain the multiplier. This replaces the hero "DAILY STREAK" float card (lines 246–250).
4. **Rank badge:** shows the user's rank-tier name. The feed meta in REF-FEED uses the values Newcomer, Operator, Engineer and Architect (§3), so the badge shows one of these. Do not hard-code it.
5. **Theme toggle:** wires to G-01. `aria-label="Switch to dark theme"` / `"Switch to light theme"`, with `aria-pressed`.
6. **Sound toggle:** enables or mutes UI sound effects (XP gain, level-up). Persist it; `aria-pressed`; default **off** unless product decides otherwise (§11, D-5).
7. **User chip:** avatar (or initials fallback) and name; opens a menu with Profile, Settings and Sign out. This is where "Profile" moves to from the sidebar.
8. Remove "Live cohort", "Neo4j · bolt://7687", the anchor tabs and "Start free" from the in-app header. "Start free" belongs only on the public landing page (§7).
9. Mobile (<1024px): hamburger on the left, then the breadcrumb, which may truncate to the page name. Collapse the streak and rank into one compact pill, and keep the avatar visible.

**Acceptance criteria**

- The header shows the correct breadcrumb on every route.
- Streak, multiplier and rank come from the API.
- All 4 right-side controls are reachable by keyboard, with visible focus.
- There is no horizontal scroll at 360px width.

---

### G-04 · Global "Unstuck" floating action button (P1)

**Reference:** a dark navy pill (≈ `#0E1737`) fixed at the **bottom-right**, with a lifebuoy icon and the white label "**Unstuck**". It is visible on REF-FEED and REF-RES. It is not visible in REF-UNSTUCK, which is expected because you are already on that page; REF-SHOW is cropped before the bottom.

**Current:** absent.

**Required change**

- Render the FAB on every route except `/unstuck`, at `position:fixed; right:24px; bottom:24px; z-index` above content and below modals.
- On click, open the Unstuck coach. The recommended pattern is a right-side drawer containing the same chat as G-UNSTUCK, keeping the current page context. Alternatively, navigate to `/unstuck`.
- The reference text on REF-UNSTUCK says the coach on an activity "sees which step you are on". Pass `{route, levelId, activityId}` as context when opened from an activity.
- `aria-label="Open Unstuck help"`. On mobile, leave a safe-area inset and do not cover the Post or Send buttons.

**Acceptance criteria**

- The FAB is present on all non-Unstuck routes.
- It opens the coach with page context.
- Esc closes the drawer, and focus returns to the FAB.

---

### G-05 · Page hero ("section header card") pattern (P1)

**Reference**

Every module page starts with a header block. There are three variants:

| Variant | Used on | Description |
|---|---|---|
| **Cream hero card** | REF-FEED, REF-RES | Near-white/cream fill (≈ `#FDFDFA`) fading to a warm gold tint at the right. Decorative fine **wavy line pattern** top-right and a **dot grid** bottom-right. Contents: optional uppercase eyebrow in gold-brown, letter-spaced (e.g. "FEED"); a large bold H1 (e.g. "What everyone is working on"); a 1–2 line muted description. |
| **Navy hero card** | REF-SHOW | Deep navy gradient (≈ `#0E1646` → `#123C5E` toward the top-right). Eyebrow "THE SHOWCASE"; a very large H1 with a **highlighted count in mint/teal** ("**85** projects built for real business owners"); subtitle "Every member who submitted a project is on the wall. Newest first." |
| **Plain header** | REF-UNSTUCK | No card. H1 "Unstuck" and a one-line muted subtitle directly on the canvas. |

**Current:** section titles are small uppercase labels inside dark cards (e.g. lines 292, 321, 341). There is no hero-card component.

**Required change:** build a reusable `<PageHeader variant="cream|navy|plain" eyebrow title highlight description />`. Use decorative SVG for the waves and dots, `aria-hidden="true"`. The H1 is about 32–40px desktop and 26–28px mobile, weight 700–800, with tight letter-spacing. Exactly one H1 per page.

---

### G-06 · Typography and component tokens (P2)

**Reference:** a geometric sans-serif throughout. Headings are bold, with tight tracking and dark navy text. Body text is about 15–16px with relaxed line-height. Muted meta text is slate grey. Uppercase eyebrows are letter-spaced. The **Unstuck founder note** uses a **handwritten/script face** for the salutation and signature.

**Current:** Plus Jakarta Sans and JetBrains Mono (line 8). Much text is set at 10–12px (`text-[10px]`, `text-[11px]`, `text-xs`).

**Required change**

- Keep Plus Jakarta Sans (it is close to the reference look).
- Set the body minimum to **14px**, preferably 15–16px for post and chat content. Meta text should be at least 12px.
- Reserve 10–11px only for non-essential badges.
- Add one script font for the note signature only, e.g. a Google Font such as "Caveat". Keep it decorative and give the text a real-text alternative.
- Remove JetBrains Mono from learner views once the Cypher blocks are removed (§7).

---

## 3. Module 1: FEED (REF-FEED)

### 3.1 Reference anatomy, top to bottom

**F-1 · Page header (cream variant)**

- Eyebrow "FEED".
- H1 "What everyone is working on".
- Description: "Ask when you are stuck, share what worked, and put your wins on the wall. Only people in this hackathon can see it."

**F-2 · Tab switcher**

- A segmented control in a white rounded container with two tabs:
  - **Posts** (speech-bubbles icon): active, gold gradient fill (≈ `#E2C88A`), dark text.
  - **Wins** (trophy icon): inactive, transparent.
- The Wins content is not captured (§9).

**F-3 · Composer card**

- A card with a thin **gold top border accent** and a warm cream background.
  - Title: "Share something with everyone in this hackathon"
  - Helper: "A question you are stuck on, or something you figured out. It does not have to be finished. Wins go on the Wins tab."
  - Row: user avatar (round photo), label "**Your post**", then a large multi-line textarea. The placeholder is personalised: "What are you working on, {FirstName}?" An **emoji button** sits at the bottom-right inside the textarea, and the textarea has a resize handle.
  - "**Tag it**" label with single-select chips: **General** (selected, gold fill), Level 1, Level 2, Level 3, Level 4 (pale blue-grey fill ≈ `#F2F7FE`, rounded-full).
  - Divider.
  - Footer row, right-aligned: helper text "**Write something to post.**" (a disabled-state hint) and the **Post** button (gold gradient, paper-plane icon, dark text).
  - Policy line under the footer: "Only people in this hackathon see it. Posts that look like selling, crypto or spam also go to a moderator to check."

**F-4 · Filter bar**

- Uppercase label "SHOW", then single-select chips: **Everything** (active, gold), Level 1, Level 2, Level 3, Level 4.

**F-5 · Post card** (repeated)

- White card, large radius, hairline border.
- **Header:** avatar (photo, or **initials on a cream circle with a gold-brown ring**, e.g. "SS", "RN", "KB", "NM"), then name (semibold). The meta line is "**{City} · {Rank} · {relative time}**", e.g. "Hyderabad · Architect · 2 days ago". The current user's own post shows the name "**You**".
- **Tag badge**, top-right: "General" (neutral grey-blue pill) or "Level N" (cream pill, gold-brown text).
- **Body:** plain text, 15–16px, preserves line breaks and paragraphs, wraps long URLs, and shows hashtags inline (e.g. "#FWAI #Hackathon10 #n8n").
- **Divider.**
- **Action row:**
  - Left: **Like** (heart icon) pill button. When likes are more than 0 it shows the count instead of the word (e.g. "♡ 4", "♡ 1").
  - Left: **Reply** pill button (speech-bubble icon). When replies exist it shows "Reply (2)".
  - Right: **Report** (flag icon, muted text link) on others' posts, or **Delete** (trash icon) on **your own** post.
- **Reply thread** (when present): indented under the action row, with a **vertical guide line** on the left. Each reply has a smaller avatar, name, meta "{Rank} · {time}" (no city), body, a **Like** button and a right-aligned **Report**. There is no nested Reply on replies (one level deep).

**F-6 · Pagination**

- A centred "**Load more posts**" button (cream fill, gold-brown text) after the list.

**F-7 · FAB** "Unstuck" (G-04).

### 3.2 Current state in `standalone.html`

- Only a sidebar link: "Community Feed" → `/feed` (line 141). It shows a toast on `file://` (lines 494–508).
- No feed view, composer, filter, post card, reply, like, report or pagination exists.
- RTM REQ-COM-01 is marked "⏳ Feed stub".

### 3.3 Required implementation (P0)

| ID | Item | Specification |
|---|---|---|
| FEED-01 | Route & header | `/feed`, breadcrumb "Feed", PageHeader cream (F-1). Replace the reference's "hackathon" wording with the product's cohort term (e.g. "Only people in your cohort can see it"). The visibility scope is the tenant or cohort (RLS already planned). |
| FEED-02 | Tabs | Posts / Wins, built with `role="tablist"`. Arrow-key navigation. The URL reflects the tab (`/feed?tab=wins`). |
| FEED-03 | Composer | As F-3. Rules: Post is **disabled** while the trimmed text is empty, and the hint "Write something to post." is shown. When text is present the hint hides and Post is enabled. Exactly one tag is required, defaulting to General. Emoji picker is optional (can be phase 2, but keep the button slot). Submitting does an optimistic insert at the top, then the server confirms. On failure, roll back and show an inline error. Show a character limit or counter if a maximum is defined. |
| FEED-04 | Moderation notice & flow | Show the policy line verbatim in meaning. Posts flagged by the server (selling, crypto, spam) show to the author as "Pending review" and are hidden from others until approved. |
| FEED-05 | Filter | "SHOW" chips: Everything + one chip per level that exists. Generate the chips from level config, not a hard-coded 4 (the product has 15 levels; see §11, D-2). Filtering changes the query and the URL (`?level=2`). |
| FEED-06 | Post card | As F-5. Avatar fallback is initials on a cream circle. Relative time comes from `Intl.RelativeTimeFormat`, with the absolute date in `title`/`<time datetime>`. Linkify URLs (`rel="noopener noreferrer nofollow"`, `target="_blank"`). Never render HTML from users; escape all text. |
| FEED-07 | Like | Toggle with an optimistic count. `aria-pressed`. The label is the word "Like" when the count is 0 and the number otherwise. The accessible name is always "Like, 4 likes". |
| FEED-08 | Reply | Clicking expands an inline reply box under the post. The thread is one level deep. The "Reply (n)" count includes replies. Replies have Like and Report. |
| FEED-09 | Report / Delete | Report opens a small dialog (reason select + optional note) built as an accessible in-page modal, **not** `window.confirm`. Delete appears only on the viewer's own items and needs a confirmation dialog; soft delete server-side. |
| FEED-10 | Pagination | "Load more posts" uses **cursor pagination**, which is already specified in `ai-accelerator-hub-architecture.md:389`. Show a loading state on the button and hide it when there are no more items. |
| FEED-11 | States | **Empty:** "No posts yet. Be the first to share what you're working on." with the composer focused. **Loading:** 3 skeleton cards. **Error:** inline retry. **Filter-empty:** "Nothing tagged Level 3 yet." |
| FEED-12 | Meta rank values | The meta line uses the user's rank tier (reference values: Newcomer, Operator, Engineer, Architect). Map these to the product's rank ladder (§11, D-3). |

**Acceptance criteria**

- A user can post, tag, filter, like, reply, report and delete their own post, and load more.
- Every interaction works by keyboard.
- Screen readers announce like and reply counts.
- No raw HTML injection is possible (test with `<img onerror>`).

---

## 4. Module 2: RESOURCES (REF-RES)

### 4.1 Reference anatomy

**R-1 · Page header (cream variant, no eyebrow)**

- H1 "Everything from your activities".
- Description: "The prompts, the pages and the things you have made, kept with the activity they came from. More lands here as you open each Level."

**R-2 · Accordion list**

- Full-width white rows (cards) separated by small gaps.
- Each row has a **title** on the left (semibold), then on the right an optional **Level badge** ("Level 1", small muted bold), an **item count** ("10 items", "1 item", correct singular and plural) and a **chevron-down**.
- **All rows are collapsed** in the capture. The expanded content is not shown (§9).

**R-3 · Row order observed**

There are two kinds of rows, interleaved by level:

- "**Level N sessions**": no Level badge, only a count (session recordings or materials for that level).
- **Per-activity rows**, each with a Level badge.

| Row | Badge | Count |
|---|---|---|
| Level 1 sessions | – | 10 items |
| Find your business niche | Level 1 | 1 item |
| Talk to AI and get good answers | Level 1 | 8 items |
| Set up your AI agent | Level 1 | 16 items |
| Level 2 sessions | – | 10 items |
| Save hours every week with AI | Level 2 | 4 items |
| Build your first automation | Level 2 | 7 items |
| Build a chatbot for your business | Level 2 | 7 items |
| Level 3 sessions | – | 6 items |
| Build your first app | Level 3 | 7 items |
| Put your app live | Level 3 | 3 items |
| Level 4 sessions | – | 6 items |
| Make your AI agent work on its own | Level 4 | 4 items |
| Make your brand kit | Level 4 | 10 items |
| Find where AI can help a real business | Level 4 | 5 items |

**R-4 · Sidebar and FAB**

- Sidebar: Resources is active (dark pill with gold dot).
- FAB "Unstuck" at the bottom-right.

### 4.2 Current state

- Only a sidebar link "Resources" → `/resources` (line 152), which shows a toast.
- No resources view exists.

### 4.3 Required implementation (P0)

| ID | Item | Specification |
|---|---|---|
| RES-01 | Route & header | `/resources`, breadcrumb "Resources", PageHeader cream (R-1). |
| RES-02 | Data model | Group by level, in level order. For each level: first a "Level N sessions" group (session assets), then one group per **activity** of that level, in activity order. Each group holds items with type (prompt, page/doc, artifact the user made, recording, link), title, source activity, created date and URL. The reference copy says items "land here as you open each Level", so **only show groups for levels the user has unlocked or opened.** |
| RES-03 | Accordion | Built from `<button aria-expanded aria-controls>` headers. The chevron rotates 180° when open. Several groups can be open at once (not exclusive). The open/closed state persists per user in `localStorage`. |
| RES-04 | Row header | Title · Level badge (activity rows only) · count with correct pluralisation ("1 item", "N items") · chevron. |
| RES-05 | Expanded content (not in reference; minimum spec) | A list of items, each with a type icon, title, short meta (type · date) and a primary action (Open / Copy prompt / Download). This is **not shown in the PDF**; confirm the design (§9). |
| RES-06 | Map to product content | The reference levels are 4 business-oriented levels. AI Accelerator Hub has 15 levels with 6 activities each (Mission Briefing, Learn, Explore GitHub, Build, Submit Proof, Evaluation + Boss; lines 361–379). Generate rows from **your** level and activity config, e.g. "Level 1 sessions", "Learn — Classes, Objects, Attributes", "Explore GitHub — Cookie Demo"… Do **not** copy the reference row titles. |
| RES-07 | States | **Empty** (no level opened): "Open Level 1 to start collecting your prompts and builds." with a link to Levels. **Loading:** 6 skeleton rows. |
| RES-08 | Search (optional, recommended) | Not in the reference. Add one only if the product owner agrees, because of the 15 levels × 6 activities = 90 groups at full progress. Mark it as an enhancement, not parity. |

**Acceptance criteria**

- Groups appear only for unlocked levels.
- The counts equal the actual item counts.
- The accordion is keyboard and screen-reader operable.
- The state persists across reloads.

---

## 5. Module 3: SHOWCASE (REF-SHOW)

### 5.1 Reference anatomy

**S-1 · Page header (navy variant)**

- Eyebrow "THE SHOWCASE".
- H1 "**85** projects built for real business owners". The number is a **live count** in mint/teal; the rest is white.
- Subtitle: "Every member who submitted a project is on the wall. Newest first."

**S-2 · Call-to-action banner**

- A full-width **emerald green** card (≈ `#137A5D`) with a rocket icon on the left.
- Bold white line: "Submit your project in Level 5 to join the wall."
- Sub-line: "Your project and your name will show here for every member."
- (Shown to users who have not yet submitted.)

**S-3 · Project grid**

- **2 columns** on desktop, gap about 24–28px. Cards have equal width and the height depends on content.

**S-4 · Project card**

- **Cover band** (top, about 30% of the card height): a gradient fill whose colour **varies per card**. The observed palette is deep green (≈ `#168767`), mint (≈ `#DAF4EA`), light periwinkle blue, pale gold/sand and deep navy. Centred in the band is a large **initials ring** (circle outline with initials, e.g. "SD", "SM", "MK"). The ring and text colour contrast with the band (white on dark bands, dark green or navy on light bands).
- **Chip 1, category:** cream pill with gold-brown text (e.g. "CRM", "T-shirt design").
- **Chip 2, brief:** cream pill "**Built for {brief title}**" (e.g. "Built for A CRM for Ram Prasad").
- **Author row:** small avatar (photo or initials) and the author name (bold, about 20px).
- **Meta row:** location-pin icon, city and relative time (e.g. "Hyderabad   10 days ago"). The city is **optional**: one card shows only "3 weeks ago".
- **Project title** (optional): bold, 2 lines max (e.g. "AI-powered business automation systems for growing companies").
- **Description:** muted text with the problem statement / brief (several cards share the same brief text).
- **Actions:**
  - Primary "**Open project ↗**" (gold gradient, full width, external-link icon). Opens the deployed project.
  - Optional secondary "**▶ Video**" (cream outline pill), shown only when a demo video exists. When present, the primary shrinks and both sit on one row.

**S-5 · Ordering:** newest first, as stated in the subtitle. The capture shows "10 days ago" → "2 weeks" → "3 weeks" → "4 weeks" → "5 weeks".

**S-6 · Not visible in the capture:** filters, search, pagination and footer. The capture ends mid-grid.

### 5.2 Current state

- **No Showcase link, route or section.** The nearest concepts are "My Portfolio" (line 154), "Hackathons" (line 130) and "My Projects" (line 128), which are all toast-only links.
- RTM REQ-GIT-01 references "GitHub Lab Explore→Fork→Modify→Build→Deploy→**Showcase**".

### 5.3 Required implementation (P0)

| ID | Item | Specification |
|---|---|---|
| SHOW-01 | Route & nav | `/showcase`, trophy icon, inside the tier group (G-02). Breadcrumb "The showcase". |
| SHOW-02 | Header | PageHeader navy, with the count highlighted from `COUNT(approved showcase projects in tenant)`. Pluralise correctly ("1 project"). Replace "real business owners" with the product's framing if needed (§11, D-6). |
| SHOW-03 | CTA banner | Shown only when the viewer **has not** submitted a showcase project. The text references the **actual level** where showcase submission happens. In the reference that is Level 5. In AI Accelerator Hub it is likely L10 Capstone or the level the PO defines (§11, D-2). The banner links to that level's submit activity; if that level is locked, it shows the lock state and the unlock requirement. Hide the banner once the user has submitted. |
| SHOW-04 | Grid | CSS grid: 2 columns ≥1024px, 1 column below. Cards are `<article>`. Image or cover first, then content. |
| SHOW-05 | Card | As S-4. The cover colour is chosen **deterministically** from the project ID (hash → one of 5 palette entries) so it is stable across reloads. Ring and text contrast must meet at least 3:1 against the band. If the project has a screenshot, show it in the cover band (`object-fit: cover`, with alt text = project title) instead of the initials ring. *Note: this screenshot option is an enhancement; the reference shows only initials.* |
| SHOW-06 | Actions | "Open project" opens the `deploy_url` in a new tab with `rel="noopener noreferrer"`. Its accessible name includes the project or author ("Open project by {name}, opens in new tab"). Render "Video" only if `video_url` exists; it opens a modal player or new tab. |
| SHOW-07 | Ordering & paging | Newest first (`approved_at DESC`). Use cursor pagination with "Load more projects", matching the Feed's "Load more posts" pattern, or infinite scroll with a sentinel. The reference does not show which; the "Load more" button is recommended for consistency with the Feed. |
| SHOW-08 | Moderation | Only reviewer-approved projects appear. This ties to the existing proof-submission and review flow (lines 369–378 and `reviews` in the architecture doc). |
| SHOW-09 | States | **Empty:** "No projects on the wall yet." with the CTA banner. **Loading:** 4 skeleton cards. |
| SHOW-10 | Optional filters | Category chips (CRM, T-shirt design… derived from the data). **Not in the reference.** Mark as an enhancement. |

**Acceptance criteria**

- The count matches the number of cards available.
- The CTA appears only for non-submitters.
- Cover colours are stable.
- External links are safe.
- The page is responsive at 360, 768 and 1280px.

---

## 6. Module 4: UNSTUCK (REF-UNSTUCK)

### 6.1 Reference anatomy

**U-1 · Header (plain variant)**

- H1 "Unstuck".
- Subtitle: "Coach: help with a step. Avi AI: help with your business."

**U-2 · Assistant card** (one large white card)

- **Mode switcher:** two large selectable tiles side by side, inside a pale blue-grey track (≈ `#EBF2FA`).
  - **Coach** (selected: white raised tile with shadow). Headset icon in a blue-tinted rounded square. Title "Coach". Description "Help with this app: steps, points, proof".
  - **Avi AI** (unselected: tile blends into the track). Brain icon in a gold-tinted rounded square. Title "Avi AI". Description "Help with your business: niche, offer, next move".
- **Intro line (muted):** "Ask about the app, your points, or whatever has you stuck. You can add a screenshot too."
- **Conversation area:**
  - **User message:** right-aligned, **dark navy bubble** with white text (e.g. "Where do I find today's activities?").
  - **Assistant message:** left-aligned, **light blue-grey bubble** with a hairline border and dark text. Multi-paragraph, and it can reference app labels in quotes ("Home", "Levels", "Milestones").
  - The thread area **scrolls internally**: the assistant reply is clipped under the composer in the capture, so it is a fixed-height scroll region.
- **Composer**, docked at the bottom of the card:
  1. **Image attach** button (square, image icon), for the screenshot.
  2. **Auto-growing textarea**, placeholder "Ask Coach…" (it changes with the mode; for Avi AI, presumably "Ask Avi AI…").
  3. **Microphone** button (voice input).
  4. **Send** button (dark navy square ≈ `#0E1737`, white paper-plane icon).
- A divider sits below the composer.

**U-3 · Two help cards** (2-column row below the assistant card)

- **Card A:** lightbulb icon (blue-grey tile). Title "**Stuck on a step?**". Body "Press 'Ask Coach' on the activity. Same Coach, and there it sees which step you are on." Link "**How this app works →**" (blue).
- **Card B:** chat-bubble icon (gold-tinted tile). Title "**Found a bug, or got an idea?**". Body "Tell us what broke, or what would make this easier. We read every note you send." Link "**Tell us on Feedback →**" (blue, goes to the Feedback route).

**U-4 · Founder note card**

- A white card with a **gold top border** (≈ `#D6BC85`, about 3px, slightly curved at the corners).
- Eyebrow "A NOTE FROM {FOUNDER}" in gold-brown uppercase.
- Salutation in **script font**: "{UserName},".
- 3–4 lines of motivational body text.
- Signature in **script font**, then the role line "Founder, {Company}".

**U-5 · Sidebar:** Unstuck is active, with the **blue-indigo gradient pill**.

### 6.2 Current state

- Only a sidebar link "Unstuck / AI Coach" → `/coach` (line 165), which shows a toast.
- No chat UI, mode switch, composer, help cards or note exist.
- The project plans 5 assistants (`code-mentor`, `career-coach`, `project-reviewer`, `concept-explainer`, `debug-assistant`; architecture doc line 359). RTM REQ-AI-01 is the "AI Learning Coach".

### 6.3 Required implementation (P0)

| ID | Item | Specification |
|---|---|---|
| UNS-01 | Route | `/unstuck` (rename from `/coach` or add a redirect). Breadcrumb "Unstuck". |
| UNS-02 | Mode switcher | Built as `role="radiogroup"` with 2 options. Reference modes: **App coach** (how the platform works: steps, XP, proof) and **Business/Career AI**. For AI Accelerator Hub, map them to existing assistants: Coach → `concept-explainer` + platform FAQ RAG; second mode → `career-coach` (§11, D-7). Name the modes yourself; do not use "Avi AI". Each mode has its own thread history. Switching modes keeps both threads. |
| UNS-03 | Thread | Fixed-height scroll region (`min(60vh, 520px)`), auto-scrolls to the newest message, and has `aria-live="polite"` on the assistant stream. User bubbles are right-aligned on dark navy. Assistant bubbles are left-aligned on light blue-grey with a border. Render assistant markdown safely (sanitised). Show a typing/streaming indicator. Message actions such as copy are optional. |
| UNS-04 | Composer | Image attach (accept `image/png, image/jpeg, image/webp`; show a preview thumbnail with a remove "×"; enforce a size limit, e.g. 5 MB; upload via the presigned `files` flow already in the plan). Auto-grow textarea up to 6 lines. **Enter sends, Shift+Enter adds a newline.** Mic uses the Web Speech API if available; otherwise hide it (do not show a dead button). Send is disabled while empty or streaming. Show a Stop button while streaming. |
| UNS-05 | Context | When opened from an activity ("Ask Coach" on an activity) or from the FAB, pass `{levelId, activityId, route}`. Show a small context chip above the composer, e.g. "About: Level 1 · Build — Your Cookie Class", with a "×" to clear it. |
| UNS-06 | Intro/empty state | Show the intro line and 3–4 suggested-question chips for the selected mode (e.g. "Where do I find today's activities?", "How do I submit proof?", "Why is Level 2 locked?"). The chips are an enhancement; the reference shows only the intro line. |
| UNS-07 | Help cards | As U-3. Link A goes to a "How this app works" page or guide (not specified; §9). Link B goes to `/feedback`. |
| UNS-08 | Founder/mentor note | As U-4. The content must be **your own** (program lead or mentor), personalised with the user's display name. The script font is for the salutation and signature only. Make the note editable by admins (CMS field). |
| UNS-09 | Add "Ask Coach" to activities | REF-UNSTUCK copy says each activity has an "Ask Coach" button. Add a secondary "Ask Coach" button to every activity row in the Level timeline (standalone lines 365–379). It opens the coach drawer with context (UNS-05). |
| UNS-10 | Safety & errors | Rate-limit messages (show a friendly "You've reached today's limit" with the reset time). Handle network errors with a retry on the failed message. Keep keys and secrets out of the client. |

**Acceptance criteria**

- Both modes work with separate threads.
- Screenshot attach, preview and remove work.
- Enter and Shift+Enter behave as specified.
- Context chip appears when the coach is launched from an activity.
- The FAB drawer and the full page share the same component.

---

## 7. Existing standalone sections: keep, move or remove

None of these sections appear in the reference PDFs. Each recommendation keeps product value while matching the reference's learner-facing, implementation-free tone.

| Section (lines) | What it is | Recommendation | Severity |
|---|---|---|---|
| Floating pill nav (69–93) | Marketing nav | **Replace** with the app header (G-03). Keep a marketing nav only on a separate public landing page. | P0 |
| Hero "Learn AI like a space mission" + orbit + float cards (183–260) | Marketing hero | **Move** to the public landing page. In-app **Home** (no PDF) should open on the user's next action instead. Float cards: streak → top bar (G-03); rank → Ranks page; the "+5 XP" demo button (244, 512) → **remove** (client-side XP awarding contradicts "server XP only", RTM REQ-GAME-01/02). | P1 |
| "Trusted by BITS · IIIT · KITS" (210) | Social proof | Landing page only. **Verify you have permission** to show these names. | P1 |
| Dashboard metric tiles (263–287) | Home widgets | **Keep for Home**, restyled to light cards. **Remove** the "TENANT ISOLATION · RLS + Neo4j label · ap-south-1" tile (286) and the Cypher text in "TEAM ACTIVITY" (285); show the team name and member activity instead. | P1 |
| Journey play rail (290–315) | Level progress rail | **Keep** (good gamification) on Home or Levels. Fix the missing levels (§8, DATA-03). Remove the dev note "Linear DAG · canUnlock = REQUIRES* minus COMPLETED · no time gates" (293); replace it with "Complete a level to unlock the next". | P1 |
| Neo4j graph + Cypher cards (318–337) | Engineering demo | **Remove from learner UI.** Move to an internal `/admin/graph` or a docs page. The vis-network script (line 9) should then load only there. | P1 |
| Levels grid (340–357) | Level picker | **Keep for the Levels page.** Show all 15 tiles (§8, DATA-03). Use clear lock/available/done states with an icon and text, not opacity alone. Remove the footer dev note (356). | P1 |
| L01 activity timeline + proof form (360–382) | Core learning flow | **Keep — the strongest part.** Restyle to light cards. Add "Ask Coach" per activity (UNS-09). Show validation errors inline next to the field, with `aria-describedby`. Stop exposing "POST /api/submissions" and "idempotent" in success text (513); say "Submitted for review. You'll get +5 XP when it's approved." | P1 |
| Leaderboard table (385–396) | Ranks preview | Belongs to the **Ranks** page (no PDF, §9). Remove the "Source" column (ZSET/ledger/graph) and the anti-abuse footnote (395). Highlight the current user's row. | P1 |
| Stack footer (398) | Tech info | **Remove** from all learner views (README or admin only). | P1 |
| Star field / nebula (63–65, 510–511) | Decoration | Landing page only (G-01). | P2 |

---

## 8. Data-consistency defects in the current page

These make a demo look broken to stakeholders. Fix them regardless of the redesign.

| ID | Defect | Evidence | Fix |
|---|---|---|---|
| DATA-01 | XP shown as **23** in the hero card, but the JS state starts at **57** and the leaderboard shows "Demo Learner 57". | Lines 242–243 vs 512 and 391 | Use one source (`/gamification/me`) and bind every display to it. |
| DATA-02 | Rank card says "**#3 in cohort**", but the leaderboard lists Demo Learner at **#2**. | Line 253 vs 391 | Bind to one value. |
| DATA-03 | The section says "15-LEVEL CAREER JOURNEY · All 15 published", but the grid shows **12** tiles (L12–L14 missing). The rail shows **9** nodes (L08, L09, L12–L14 missing). The graph has all 15. | Lines 341–355, 300–310, 515–531 | Render all 15 from config. On small screens, use horizontal scroll or a "Show all" control instead of silently dropping levels. |
| DATA-04 | "WEEKLY PROGRESS 7% · 1/15" while L01 status is "available" (not completed) and only activity 1 of 6 is done. | Lines 277, 268–271, 365 | Define the metric (levels completed vs activities completed) and compute it. Correct value given the state shown: 0/15 levels, or 1/90 activities. |
| DATA-05 | The leaderboard has 1,340 XP for #1, but the hero says "2,970 XP to Grandmaster". That is plausible, but "Live from DB" badges sit on static numbers. | Lines 241, 247, 252 | Remove "Live from DB" badges (internal). Show real values or clearly labelled demo data. |
| DATA-06 | Streak: hero "3 days · ❄ 1 · Longest 7", but the reference top bar pattern is "0 days ×1.0". | Lines 246–250 | Move to the top-bar pill (G-03), from one source. |
| DATA-07 | Token drift: the HTML uses gold `#f0c75e` (line 11); the master plan specifies `#E8B94F` (plan line 114). | Line 11 | Use the plan token (or update the plan). One source of truth. |

---

## 9. Not specified by the reference (do not invent; get designs)

These appear in the reference navigation but have **no PDF**. An implementer must **not** guess their layout. Use the product's existing designs, or request references.

| Item | Where it is referenced | What we know | What is missing |
|---|---|---|---|
| Home | Sidebar | REF-UNSTUCK coach text: "'Home' shows what to do next right away." | Layout |
| Levels | Sidebar | Coach text: "To see the full list of activities for a Level in order, press 'Levels' (which might show as 'Milestones')." | Layout. The standalone grid and timeline can serve. |
| Ranks | Sidebar | Nothing beyond the name | Layout, filters (city/cohort; Feed posts mention "Rank of 6 out of 187, in Hyderabad" and "#1 Rank in my City", which suggests city-level ranks, but this is user text, not a spec) |
| Feedback | Sidebar, Unstuck card B | "Tell us what broke, or what would make this easier." | Form design |
| Certificates | Sidebar | Name only | Layout |
| Diamond | Sidebar | Diamond icon with a badge; likely the next tier (inferred, unconfirmed) | Behaviour, locked state |
| Feed → Wins tab | REF-FEED tabs | Composer helper: "Wins go on the Wins tab." | Wins card design, composer differences |
| Resources → expanded group | REF-RES | Collapsed rows only | Item row design |
| "How this app works" | Unstuck card A link | Link label only | Destination page |
| Dark theme of the reference | Sun toggle | A toggle exists | Dark palette of the light canvas (use the existing navy palette, G-01) |
| Mobile layouts | – | Desktop captures only | Mobile designs (this report gives responsive rules but they are not from the reference) |

---

## 10. Accessibility and code-quality defects (current HTML)

| ID | Issue | Evidence | Fix |
|---|---|---|---|
| A11Y-01 | Text contrast fails AA. On `#080c1a`: `text-white/20` ≈ 1.8:1, `/30` ≈ 2.6:1, `/40` ≈ 3.8:1 (computed from the alpha blend; minimum 4.5:1 for normal text). `/50` ≈ 5.3:1 passes. | Used across lines 89–398 (e.g. 201, 205–210, 293, 356, 395, 398) | Minimum `/60` for secondary text on navy. On the light theme use `--text-secondary` (≥ 4.5:1). |
| A11Y-02 | State conveyed by opacity only (locked levels at `opacity-60/70`). | Lines 303–354 | Add a lock icon and text ("Locked — complete L01"). |
| A11Y-03 | Several `<svg>` icons lack `aria-hidden="true"` (sidebar link icons, lines 115–167). | – | Add `aria-hidden="true"` to decorative icons. |
| A11Y-04 | Animations ignore `prefers-reduced-motion` (float, orbit, pulse, `animate-pulse`). | Lines 19–26, 234, 301, 366 | Wrap them in `@media (prefers-reduced-motion: no-preference)`. |
| A11Y-05 | Form inputs have only placeholders as labels. | Lines 373, 375 | Add visible `<label>`s. Show errors with `aria-describedby` and `aria-invalid`. |
| A11Y-06 | The active nav item lacks `aria-current="page"`. | Line 115 | Add it (G-02). |
| CODE-01 | Duplicate `#sidebar{transition…}` rule. | Lines 34 and 43 | Remove one. |
| CODE-02 | The "Expand" icon path draws a diagonal line, not a chevron: `M9 18l6-6 6-6`. | Line 480 | Use `M9 18l6-6-6-6` / `M15 18l6-6-6-6`. |
| CODE-03 | Tailwind via CDN (`cdn.tailwindcss.com`, line 7) is not for production. | Line 7 | Build Tailwind at compile time (the Next.js app already exists per the footer). |
| CODE-04 | `vis-network` is loaded on every page view. | Line 9 | Load it only on the admin graph page (§7). |
| CODE-05 | Page `<title>` is marketing copy. | Line 6 | Use the per-route title pattern "{Page} · AI Accelerator Hub". |

---

## 11. Decisions the product owner must make before build

| ID | Decision | Options | Recommendation |
|---|---|---|---|
| D-1 | Sidebar IA | (a) Reference IA exactly; (b) keep 17 items; (c) hybrid | **(c) Hybrid** (G-02) |
| D-2 | Level count in Feed tags, Resources and Showcase CTA | The reference uses 4–5 levels; the product has 15 | Generate everything from level config. The Showcase CTA level is the Capstone level (L10) unless the PO says otherwise. |
| D-3 | Rank ladder names | Reference: Newcomer, Operator, Engineer, Architect | Define the product's ladder and map it to the XP thresholds in `JOURNEY_GAMIFICATION_MODEL.md` §7.3 |
| D-4 | Rank-badge colour per page | Gold on 3 pages, blue on Unstuck in the captures | Pick one consistent style (gold-ink on cream) unless the colour encodes something |
| D-5 | Sound effects | On or off by default | Off by default |
| D-6 | Showcase framing | "projects built for real business owners" | Use the product's own framing |
| D-7 | Two Unstuck modes | App coach + business AI | App coach (`concept-explainer` + platform FAQ) and Career coach (`career-coach`) |
| D-8 | Default theme | Light (reference) vs dark (current brand) | Light content + dark sidebar per reference, with dark as an option. Requires new light tokens and an AA check (G-01). |

---

## 12. Implementation order and definition of done

### 12.1 Order

1. **Tokens & theme** (G-01, G-06). Prerequisite for everything else.
2. **Shell:** sidebar IA + top bar + FAB + PageHeader (G-02 to G-05).
3. **Unstuck** (Section 6): highest learner value and reused by the FAB.
4. **Feed** (Section 3).
5. **Showcase** (Section 5): depends on the approved-submission data.
6. **Resources** (Section 4).
7. **Clean-up** of the existing sections (Section 7), data fixes (Section 8), and a11y/code fixes (Section 10).

### 12.2 Definition of done (each module)

- [ ] Matches the reference anatomy in this report (sections, order, labels, states).
- [ ] All copy is the product's own; no reference brand, founder or member names.
- [ ] Data comes from APIs, not hard-coded; empty, loading and error states are implemented.
- [ ] Keyboard-only walkthrough passes; visible focus everywhere; screen-reader labels on icon buttons.
- [ ] WCAG 2.2 AA contrast verified with a checker for both themes.
- [ ] Responsive at 360 / 768 / 1024 / 1440px with no horizontal scroll.
- [ ] `prefers-reduced-motion` respected.
- [ ] No internal or engineering text visible to learners.

---

## 13. Hand-off prompt for an implementing LLM

> You are implementing UI changes for "AI Accelerator Hub". Read `docs/UI_GAP_REPORT_standalone_vs_reference.md` fully, and view the four PDFs in `UI-design/` as visual ground truth.
>
> Rules:
> 1. Implement Sections 2–6 in the order of §12.1.
> 2. Do not invent designs for anything listed in §9; leave a clearly marked placeholder instead.
> 3. Never copy the reference's brand ("Freedom With AI"), founder name, logo, or member names and posts; use the product's own names and seeded demo data.
> 4. Respect the gold rule: no gold text on white; gold is a fill with dark text, or a dark-brown "ink" on cream.
> 5. Keep the existing sidebar collapse, rail and drawer logic and the Level 1 activity timeline and proof form.
> 6. Remove every engineering detail listed in §7 from learner-facing views.
> 7. Fix every row in §8 and §10.
> 8. Where §11 lists a decision, use the "Recommendation" column unless told otherwise, and list the choices you made in your final summary.
> 9. Before finishing, check every item in §12.2 and report any that fail.
