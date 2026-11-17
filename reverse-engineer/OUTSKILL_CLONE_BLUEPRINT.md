# Reverse-engineering `outskill-ai-learning-portal` — teardown + build blueprint

Source analysed: `https://outskill-ai-learning-portal.programs29111.chatgpt.site/`
Captured: 19 Oct 2026. Evidence files are in `reverse-engineer/raw/` (HTML, RSC payload, JS chunks, CSS, API samples).

---

## 1. Verdict: what this site actually is

It is **not** a multi-page website. It is a **single-page learning application** with hash-based client routing, rendered by React Server Components and hosted on **ChatGPT Sites** (`*.chatgpt.site`).

| Signal | Evidence | What it means |
|---|---|---|
| Next.js App Router + RSC | `/_next/static/...`, `vinext.navigationRuntime`, RSC payload pushed as `rsc.push("1:[...")` | Built with a Next.js-compatible RSC framework (vinext = Vite-based Next runtime) |
| React 19 client app | one `page:/` route in the route manifest; all views are state | Every screen is a component rendered from one entry point |
| Only two server routes | `route:/api/learner`, `route:/api/library` | Content and user state are the only server concerns |
| Hash routing | `location.hash.slice(1)`, `hashchange` listener | `#learn/science-models` never hits the server; no per-lesson URLs |
| 449 catalog records in the first HTML response | RSC payload `catalog` array | The whole catalog is shipped on first load; detail bodies are lazy-fetched |
| `noindex` meta, no `robots.txt`/`sitemap.xml` (both 404) | `<meta name="robots" content="noindex">` | Deliberately a private/program link, not an SEO product |
| "Sign in with ChatGPT" + `/api/learner` cookie session | UI strings + `authenticated: false` in API response | Auth is delegated to the ChatGPT account on the host platform |

**Product shape:** a curated AI-literacy curriculum (280 lessons, 54 projects, 35 workbooks, 30 glossary entries, 23 external resources, 22 troubleshooting entries, 5 capability roadmaps) wrapped in a personalisation wizard, a lesson reader, guided workbooks, and a progress/bookmark/notes layer.

**The important insight:** the visible site is ~15% of the work. The 449-item content model with typed payloads per content kind is the asset. You can clone the UI in days; the content taxonomy is what makes it feel like a product.

---

## 2. Architecture (as built)

```
Browser
  └─ one HTML document, RSC-rendered shell
       ├─ catalog: 449 items (id, kind, title, summary, level, tool, roles, minutes …)
       ├─ hash router: #path | #learn | #practice | #explore | #work | #science | #search | #support
       │                └─ optional /:id  →  reader view
       ├─ GET  /api/library?id=<id>   → full document for one item (lazy, cached in a Map)
       └─ GET  /api/learner           → { profile, progress, work, saved, authenticated }
          POST /api/learner           → { type: "profile" | "progress" | "bookmark" | "work", … }
```

Client state model (from the bundle): `{ profile, progress[], work[], saved[] }`, hydrated once, then mutated optimistically and persisted with a single POST endpoint.

Routing table recovered from the bundle:

| Route | Screen | Notes |
|---|---|---|
| `#path` (default) | Personal path / onboarding | Profile wizard + generated route |
| `#learn` | Five-level curriculum | Level filter, lesson cards |
| `#learn/<id>` | Reader | Sticky index, sections, checks, sources, "mark complete" |
| `#practice` | Workbooks + projects | Role/goal-matched project library |
| `#practice/<id>` | Guided build | Steps, prompts, variants, tests |
| `#explore` | Reference library | Level filter, search, "show more" |
| `#work` | Portfolio | Saved notes tied to a resource |
| `#science` | Model-science lab | Simulated temperature / top-p / retrieval demos |
| `#search` | Global search | Overlay |
| `#support` | Troubleshooting | 22 "I'm stuck" entries |

Anchor handling inside the reader: `overview`, `sample-input`, `step-*`, `section-*`, `evidence`, `sources` are excluded from route parsing, so deep links to sections work.

---

## 3. Content model — the real IP

### 3.1 Catalog record (shipped with the page)

```ts
type CatalogItem = {
  id: string;                 // "science-models"
  kind: "lesson" | "workbook" | "project" | "roadmap" | "resource" | "glossary" | "help";
  title: string;
  summary: string;
  level: 1 | 2 | 3 | 4 | 5;
  tool: string;               // "Model science", "ChatGPT", "Lovable", "Any chat app"
  roles: Role[];              // ["all"] or one-to-many of 9 role ids
  minutes: number;
  difficulty?: "beginner" | "intermediate" | "advanced";
  resourceType?: "video" | "article" | "course" | "research";
  creator?: string;
};
```

Volume: 449 items — lessons 280, projects 54, workbooks 35, glossary 30, resources 23, help 22, roadmaps 5. Levels 1–5 (146/87/68/74/74). Nine role tracks: leadership & operations, marketing & sales, finance & accounting, data & analytics, product & strategy, design & creative, software & technology, education & consulting, home & personal.

### 3.2 Detail documents, by kind

All kinds share `{ id, kind, title, summary, level, minutes, tool, roles, sources[] }`. Then they diverge — this is the schema you should copy:

| Field | lesson | workbook | project | roadmap / glossary | help | resource |
|---|---|---|---|---|---|---|
| `outcome` | ✓ one-line "by the end" | ✓ | ✓ | — | — | — |
| `sections[{title, body}]` | ✓ 3–5 | ✓ | ✓ | ✓ many | ✓ | — |
| `body` (intro prose) | — | ✓ | ✓ | ✓ | — | — |
| `steps[{title, actions[], expected}]` | — | ✓ 6–8 | ✓ 8–11 | — | ✓ | — |
| `samples[{name, content}]` | — | ✓ fictional data | ✓ | — | — | — |
| `variants{beginner, intermediate, advanced}` | — | ✓ detail level | ✓ | — | — | — |
| `checks[]` | ✓ 2 | ✓ 4 | ✓ 6 | — | — | — |
| `prerequisites[]` | — | ✓ | ✓ | — | — | ✓ |
| `notice` (fictional-data warning) | — | ✓ | ✓ | — | — | — |
| `url`, `exercise`, `limitation`, `creator` | — | — | — | — | — | ✓ |

Two design decisions worth stealing:

1. **`sections[].body` is Markdown** — headings, bullets, tables and fenced prompt blocks are stored as text and rendered by one renderer. No CMS block builder needed.
2. **`variants` changes scaffolding, not content.** Beginner = every instruction shown; intermediate = prompts revealed on demand; advanced = independent attempt first. One document serves three ability levels.

### 3.3 Learner state

```ts
type LearnerState = {
  profile: {
    name: string; role: string; goal: string; task: string;
    input: string; audience: string;
    experience: "new" | "occasional" | "regular" | "builder";
    tools: string[]; pace: "15" | "30" | "60";
    support: "beginner" | "intermediate" | "advanced";
    diagnostics: number[];      // 3 answers, used to downgrade the path
  } | null;
  progress: { id: string; status: "completed" | "independent"; sectionIndex?: number; evidence?: string }[];
  work: { id: string; title: string; text: string; resourceId?: string }[];
  saved: string[];
  authenticated: boolean;
};
```

### 3.4 The personalisation engine is deterministic — no LLM call

This is the cleverest part of the product, and it is a rules engine:

1. Validate the profile (each field against a whitelist).
2. Compute a **capability score** from the 3 diagnostics + self-reported experience → `beginner | intermediate | advanced`.
3. Clamp it by the requested support level (`min(support, computed)`).
4. Pick a primary tool (first recognised of ChatGPT / Claude / Gemini / Grok / DeepSeek).
5. Run a rule list producing ordered entries `{ id, why, phase }`:
   - always `science-models` (model vs app distinction)
   - diagnostics-driven remediation (`science-verification`, `science-prompts`)
   - `tool-<tool>` for the chosen app
   - role-driven first workbook (finance/data → `finance-variance`, marketing/design → `campaign-brief`, home → `household-plan`, else `cedar-feedback`)
   - goal-driven track (research, content, assistants, automation, products)
   - input-driven extras (spreadsheet → `finance-variance`; documents/notes → `science-context`)
   - goal-specific skills (automation → `science-api`, `science-agents`, `mcp-connection-rehearsal`)
   - two tool-matched lessons from the catalog filtered by `level ≤ ceiling` and `roles` includes the user's role
6. Deduplicate by id, keep insertion order, tag each with a **phase label** and a one-sentence "why this is here".

Because it is deterministic, the path is explainable ("How your choices shaped this route"), instant, free, and testable. Copy this. An LLM here would be slower, costlier and less debuggable.

---

## 4. Feature inventory

| Area | Behaviours |
|---|---|
| Shell | 246px sticky dark rail, 84px topbar, breadcrumb, global search, help button, mobile account link |
| Navigation | 5 sections + science lab + search + support; active state; collapse persisted in `localStorage["outskill-nav-collapsed"]` |
| Onboarding | 8-question wizard + 3 diagnostic questions; draft kept in `sessionStorage["outskill-profile-draft"]` for signed-out users; validation messages; back/continue; progress through steps |
| Path | Ordered route with phase labels, "why this is here" reasons, adjust-profile, project suggestions, five-level overview |
| Reader | Sticky 205px index, outcome callout, rendered Markdown sections, "check yourself" list, source list with external links, next-step card, fullscreen-less distraction-free column |
| Progress | `completed` and `independent` (with ≥40-char evidence) states; independent work unlocks harder path entries; save status + retry on failure |
| Library | Level filter, kind filter, text search, "show more" pagination, cards with save/bookmark toggle |
| Practice | Workbook steps with `expected` result per step; "if this did not work" repair panel; sample fictional data; detail-level switch; save my place |
| Projects | Tool picker (ChatGPT/Claude/Gemini), prerequisite checklist, prompt reveal, test sections, checks |
| Science lab | Simulated token sampling (temperature, top-p sliders) and retrieval ranking — explicitly no model calls |
| My Work | Create/edit/delete notes, optional link to a resource, "open related guide" |
| Help | Searchable glossary + troubleshooting entries; "not a live AI chat" |
| Accounts | ChatGPT SSO; anonymous browsing with a "sign in to save" gate; a single API returns/merges everything |

---

## 5. Design system (measured from the CSS)

```css
:root{
  --ink:#17211b; --muted:#607067; --paper:#f5f7f5; --white:#fff;
  --line:#dce3dc; --accent:#c7f764; --accent-soft:#eff9d9;
  --forest:#204b36; --danger:#9f2c2c;
}
/* rail is hard-coded, not tokenised */
.rail{ background:#15251d; border-right:1px solid #293d30; color:#f7fff5; }
```

| Element | Spec |
|---|---|
| Type | Geist + Geist Mono (self-hosted via `@font-face` subsets), wordmark 30px / weight 570 / letter-spacing −1.6px |
| Shell | `grid-template-columns: 246px minmax(0,1fr)`; rail sticky `100dvh`; topbar 84px, `padding:16px 46px` |
| Main | `max-width:1510px`, centred |
| Reader | `grid-template-columns:205px minmax(0,840px); gap:40px` |
| Cards | white, `1px solid var(--line)`, `border-radius:16px`, `padding:34px` |
| Buttons | min-height 46px, radius 9px, weight 550; primary = forest fill; secondary = lime fill |
| Nav item | 13px×15px padding, radius 10px; active = lime background + ink text; hover = `#243c2d` |
| Radius scale | 8 / 9 / 10 / 16 |
| Breakpoints | 600, 720, 900, 1000, 1100, 1200, 1280, 1500, 1650 + `prefers-reduced-motion` |

The aesthetic is "calm editorial dashboard": warm off-white paper, forest green, one high-voltage lime accent used only for states (active nav, "done", soft badges). No gradients, no shadows except borders. That restraint is why it looks expensive.

---

## 6. How to build it — two routes

### Route A — no-code / AI builder (1–2 days, closest to the original)

The original was almost certainly generated inside **ChatGPT Sites**: the bundle's own help content tells users to "open Work and start a new task to build a Site". If you want the same result fastest, build it there (or in Lovable / v0 / Replit Agent) using the spec below.

**Order of work — do not start with the UI:**

1. Write the catalog as a spreadsheet/JSON first: `id, kind, title, summary, level, tool, roles, minutes, difficulty` for your first 30 items.
2. Write 5 full detail documents (one per kind) with the field map from §3.2.
3. Paste the master prompt (§9) with the schema and one sample document.
4. Iterate screen by screen: shell → reader → library → path wizard → work.
5. Add persistence last.

Limits of this route: hash URLs (no shareable lesson links), no SEO, platform-owned auth and storage, and content edits require regeneration unless the builder exposes a data file.

### Route B — production build (recommended if this is a real product)

**Stack**

- Next.js 15 App Router + React 19 + TypeScript
- Tailwind v4 **or** plain CSS with the token block above (the original is plain semantic CSS — easier to match)
- Postgres (Neon/Supabase) + Drizzle ORM
- Auth.js (Google/email magic link) or Clerk
- Zod for every content file and API payload
- Content as JSON/Markdown in the repo, validated at build time (a CMS only when non-engineers edit)
- Vercel + Postgres; `revalidate` for content, no cache for learner state

**Repo layout**

```
app/
  (studio)/
    layout.tsx                 # rail + topbar, server component
    path/page.tsx              # onboarding + generated path
    learn/page.tsx             # curriculum index
    learn/[id]/page.tsx        # reader (generateStaticParams from catalog)
    practice/page.tsx
    practice/[id]/page.tsx
    explore/page.tsx
    work/page.tsx
  api/
    catalog/route.ts           # GET, cacheable
    learner/route.ts           # GET/POST single state endpoint
    work/route.ts              # POST/PATCH/DELETE
components/
  rail.tsx  topbar.tsx  search-dialog.tsx
  content-card.tsx  reader.tsx  markdown.tsx
  path-wizard.tsx  path-list.tsx  step-list.tsx
  progress-button.tsx  note-editor.tsx
content/
  catalog.json
  lessons/*.json  workbooks/*.json  projects/*.json  glossary/*.json
lib/
  schema.ts        # zod schemas per kind
  content.ts       # load + validate + index
  path-engine.ts   # deterministic route builder
  db.ts  auth.ts
```

**Schema (Postgres)**

```sql
create table content_items (
  id            text primary key,
  kind          text not null,
  title         text not null,
  summary       text not null,
  level         smallint not null check (level between 1 and 5),
  minutes       int not null default 10,
  tool          text,
  difficulty    text,
  resource_type text,
  creator       text,
  roles         text[] not null default '{all}',
  outcome       text,
  body          text,
  sections      jsonb not null default '[]',
  samples       jsonb not null default '[]',
  steps         jsonb not null default '[]',
  variants      jsonb,
  checks        jsonb not null default '[]',
  sources       jsonb not null default '[]',
  prerequisites jsonb not null default '[]',
  notice        text,
  url           text,
  published     boolean not null default true,
  updated_at    timestamptz not null default now()
);

create table profiles (
  user_id     text primary key,
  name        text, role text, goal text, task text,
  input       text, audience text, experience text,
  tools       text[], pace text, support text,
  diagnostics jsonb,
  updated_at  timestamptz not null default now()
);

create table progress (
  user_id       text not null,
  item_id       text not null references content_items(id) on delete cascade,
  status        text not null check (status in ('started','completed','independent')),
  section_index int,
  evidence      text,
  updated_at    timestamptz not null default now(),
  primary key (user_id, item_id)
);

create table bookmarks (
  user_id text not null, item_id text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, item_id)
);

create table work_notes (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  item_id text references content_items(id) on delete set null,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

**API contract** (keep it as small as theirs — one state endpoint beats five)

```
GET  /api/catalog                 → { items: CatalogItem[] }        // public, s-maxage=3600
GET  /api/content/:id             → DetailDocument                  // public, per-id cache
GET  /api/learner                 → LearnerState                    // private, no-store
POST /api/learner
  { type: "profile",  profile: Profile }
  { type: "progress", id, status, sectionIndex?, evidence? }
  { type: "bookmark", id, saved: boolean }
  { type: "work",     id?, title, text, resourceId? }
POST /api/work/:id/delete
```

Rules that matter: validate with Zod, return the full new state from POST (the client replaces state, no drift), key everything by `user_id`, and make progress `upsert` on `(user_id, item_id)`.

**Build order (5 working days for the app, excluding content)**

| Phase | Deliverable | Est. |
|---|---|---|
| 1 | Tokens, shell, rail, topbar, responsive breakpoints | 0.5 d |
| 2 | Content schema + 5 seed documents + catalog loader | 1 d |
| 3 | Reader (sticky index, Markdown, checks, sources, complete) | 1 d |
| 4 | Library + filters + search (MiniSearch over 449 items is fine client-side) | 0.5 d |
| 5 | Path wizard + deterministic engine + path view | 1 d |
| 6 | Auth, progress/bookmark/notes persistence, empty & error states | 1 d |

Then: accessibility pass (skip link, focus rings, `aria-current`, reduced motion), real URLs + metadata + sitemap if public, and analytics events (`lesson_open`, `lesson_complete`, `check_pass`, `path_generated`).

---

## 7. Decisions to make before you build

1. **Hash routes or real URLs?** They chose hash. You should choose real routes (`/learn/science-models`) unless you are shipping inside a builder that cannot do it. You get shareable links, SEO, and per-page caching for free.
2. **Deterministic path or LLM?** Deterministic. It is explainable, instant and free. If you add an LLM later, use it only to *phrase* the "why", never to choose the order.
3. **Content as code or CMS?** Under ~500 items, content-as-code with Zod validation is faster and safer. Move to a CMS when a non-engineer owns the curriculum.
4. **Signed-out behaviour.** Match theirs: browse everything, keep the profile draft in `sessionStorage`, gate only persistence.
5. **How much content can you actually produce?** 449 items is a content team, not a weekend. Ship 30 items across all five levels before adding a sixth feature.

---

## 8. What not to copy

- **No per-lesson URLs.** Their `#learn/<id>` is invisible to crawlers and to link previews.
- **One giant catalog in the initial HTML.** 209KB of RSC payload on first load. Yours should be paginated or fetched after paint.
- **`localStorage` for nav state only.** Fine. But never put progress there — it silently dies on device change.
- **A single POST endpoint with no optimistic-rollback.** They show a retry; design the failed-write path deliberately.
- **Their lesson copy.** Structure and taxonomy are fair game; the text is theirs. Write your own.

---

## 9. Master prompt for an AI site builder

> Build a personal AI-learning portal called **[NAME]**.
>
> **Shell:** fixed 246px dark sidebar (`#15251d`) containing a wordmark, five nav items (My Path, Learn, Practice, Explore, My Work), an "I'm stuck" button, and an account block. Main area has an 84px topbar with breadcrumb and a search button. Content max-width 1510px. Off-white background `#f5f7f5`, white cards, 1px `#dce3dc` borders, 16px radius. Accent lime `#c7f764`, forest `#204b36`, ink `#17211b`. Font Geist; wordmark 30px, weight 570, letter-spacing −1.6px.
>
> **Data:** a catalog of items `{id, kind, title, summary, level 1–5, tool, roles[], minutes}` where kind ∈ lesson | workbook | project | roadmap | resource | glossary | help. Detail documents add `outcome`, `sections[{title, body}]` (Markdown), `checks[]`, `sources[{title,url}]`, and for workbooks/projects `body`, `samples[{name,content}]`, `steps[{title, actions[], expected}]`, `variants{beginner,intermediate,advanced}`, `prerequisites[]`, `notice`.
>
> **Screens:** (1) My Path: an 8-question wizard (role, goal, first task, input material, audience, experience, tools, pace, support) plus 3 diagnostic questions, then a generated ordered path with phase labels and a one-sentence reason per item. (2) Learn: 5 level sections with cards. (3) Reader: 205px sticky index + 840px article, outcome callout at top, Markdown sections, "check yourself" list, sources, next-step card, "Mark as completed". (4) Practice: workbooks and projects, step-by-step with an expected result per step and a detail-level switch. (5) Explore: filterable library with search and "show more". (6) My Work: notes tied to a resource. (7) Model-science lab: simulated sliders, explicitly no model calls.
>
> **Behaviour:** signed-out users can browse; the profile draft is kept in sessionStorage and only persisted after sign-in. Path generation must be deterministic (rule-based), never an LLM call. Persist profile, progress, bookmarks and notes in Postgres; one `GET/POST /api/learner` endpoint returns the whole learner state.
>
> **Quality:** keyboard accessible, skip link, visible focus, `aria-current` on nav, reduced-motion support, real URLs per item, loading and error states for every fetch. Seed with 5 complete documents (one per kind), not placeholder Lorem Ipsum.

---

## 10. Starter scaffold in this workspace

`outskill-clone-starter/` is a source-complete Next.js 15 scaffold implementing the shell, content schema, catalog, reader, library, path wizard and localStorage progress. It is the §6 architecture in miniature.

It has **not** been dependency-installed or built in this workspace (the machine was out of disk space), so treat the first commands below as the smoke test:

```bash
cd outskill-clone-starter
npm install
npm run dev      # http://localhost:3000
```

What is deliberately stubbed: auth, Postgres, and the science lab. The report sections above give you the exact contracts to drop in. Swap `lib/progress.ts` for the API calls in §6 and the UI does not change.
