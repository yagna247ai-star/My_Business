# AI Suite — Create Custom Agent — Build Approach
**Source screen:** `FullPagePlus-admin.myappzbackend.com-v2-s-653aef23-...ai-suite-agent-2026-08-19T07-57-31-976Z.jpg` (Admin → AI Suite → AI Agents → Create Custom Agent)

> Replicates the exact 3-step Guided Setup + Identity + Autonomy + Knowledge Brains flow seen in the screenshot, mapped 1:1 to BANGI_Agent (FastAPI :8000 + Gateway :8001 + Next.js :3000) so you can build the agent locally and also push it to MyAppz backend.

---

## 1. What the Screen Shows (Reverse-Engineered)

| Area | UI Element | Value in Screenshot |
|------|------------|---------------------|
| **Header** | Breadcrumb | `Agents > Create Custom Agent` |
| | Title | `Create Custom Agent — Define identity, attach knowledge brains, and assign skills` |
| | Actions | `Advanced` / `Test Agent` / `Create Agent` (top-right) |
| **Guided Setup Step 1/3** | Progress bar 33% | `What should it do?` textarea placeholder `Describe what this agent should handle (e.g., 'Onboard new customers...')` |
| **Identity** | Agent Name* | `e.g. Onboarding Agent` (required) |
| | Communication Tone | Dropdown `Professional` |
| | Description | `What does this agent do?` |
| | Primary Goal | `e.g. Onboard new customers within 24 hours` |
| | Autonomy Level | 4 cards: `Observe` (Only logs, never acts), `Suggest` (**selected**, *Recommends actions, human approves*), `Act + Notify` (Executes, notifies human), `Full Auto` (Silent) |
| | Action Type Matrix | Rows: `Read/query`, `Write/update`, `Outbound message`, `Destructive` → Columns Observe/Suggest/Act+Notify/Full Auto: `Logs / Runs / Approval / Runs+notify` |
| **Knowledge Brains*** | Pills (10 selected) | `Solar buisness`, `Module: Email Marketing`, `Module: WhatsApp`, `Module: Workflows & Chatflows`, `Module: Inbox`, `Module: Prospecting`, `Module: Chat Widget`, `Sales Brain`, `Marketing Brain`, `Finance Brain` (green = active) — control `10 brains selected` + `+ Create Brain` |

**Left nav context:** `Dashboard / Lead Generation / Lead Management / Lead Automation / Sales / AI Suite (active) / Operations / Inbox(6) / Calendar / Finance / Community / Settings`

---

## 2. Architecture to Build (Matches Screenshot)

```
Next.js :3000 (app/ai-suite/agents/create/page.tsx)
   ↓ POST /api/agents  (via next.config.js rewrites → :8001)
Gateway :8001 (gateway/server.py — /api/agents, /api/brains, /api/agents/test)
   ↓ (in-process) vs proxy BANGI_BACKEND_URL
Backend :8000 (backend/app.py — BangiAgent + AgentRegistry)
   ↓
SQLite bangi.db (agents, agent_brains, tasks) + events.jsonl
   ↓
Hermes + BANGI plugins (10 brains = hermes skills + modules)
```

**Same stack as existing BANGI v0.5** — reuse `BangiAgent`, `BangiDB`, `PluginRegistry`.

---

## 3. Data Model (SQLite WAL)

```sql
-- agents table (1 row = 1 custom agent)
CREATE TABLE agents (
  id TEXT PRIMARY KEY,              -- uuid, shown as 653aef23... in URL
  name TEXT NOT NULL,               -- Agent Name*
  description TEXT,
  primary_goal TEXT,
  communication_tone TEXT NOT NULL DEFAULT 'Professional', -- Professional|Friendly|Concise|Formal
  guided_prompt TEXT,               -- "What should it do?" textarea
  autonomy_level TEXT NOT NULL CHECK (autonomy_level IN ('observe','suggest','act_notify','full_auto')),
  status TEXT DEFAULT 'draft',      -- draft|active|paused
  created_at TEXT, updated_at TEXT
);

-- agent ↔ brains many-to-many
CREATE TABLE agent_brains (
  agent_id TEXT REFERENCES agents(id) ON DELETE CASCADE,
  brain_id TEXT NOT NULL,           -- e.g. 'solar_business' , 'module:email_marketing'
  brain_label TEXT,                 -- display pill
  PRIMARY KEY (agent_id, brain_id)
);

-- test runs
CREATE TABLE agent_tests (
  id TEXT PRIMARY KEY,
  agent_id TEXT REFERENCES agents(id),
  prompt TEXT, result TEXT, created_at TEXT
);
```

**Seed brains** (match screenshot pills):
```
solar_business, module:email_marketing, module:whatsapp, module:workflows_chatflows,
module:inbox, module:prospecting, module:chat_widget, sales_brain, marketing_brain, finance_brain
```

---

## 4. Autonomy → Action Matrix (Implement exactly as screenshot table)

| Action Type | Observe | Suggest | Act + Notify | Full Auto |
|-------------|---------|---------|--------------|-----------|
| **Read/query** (lookup contacts, fetch revenue, search KB) | Logs | **Runs** | Runs | Runs |
| **Write/update** (create contact, tag, move deal, schedule task) | Logs | **Approval** | Runs + notify | Runs |
| **Outbound message** (email, WhatsApp, SMS, social post, payment link) | Logs | **Approval** | Runs + notify | Runs |
| **Destructive** (refund, mass-delete, irreversible) | Logs | **Approval** | Approval | Approval |

**Implementation:** `autonomy_check(agent, action_type)` → returns `allow|require_approval|log_only|notify`. For `Suggest` (selected in screenshot), Read runs immediately, others queue to `Approvals` tab (`/ai/logs` → `Approvals`).

---

## 5. API Contract (Gateway unified `/api/*` — same as existing BANGI)

```http
POST   /api/agents
  Body: { name, description, primary_goal, communication_tone, guided_prompt, autonomy_level, brain_ids: string[] }
  → 201 { id, name, status:"draft" }

GET    /api/agents            → list
GET    /api/agents/{id}       → detail + brains
PATCH  /api/agents/{id}       → update (Advanced)
POST   /api/agents/{id}/test  → { prompt } → runs BangiAgent.do_task with agent context
POST   /api/brains            → { label, description } → create brain
GET    /api/brains            → list all brains
DELETE /api/agents/{id}

WS     /ws  { prompt, agent_id } → ack → progress → result (same as existing TaskBar)
```

**Backend mirrors without `/api`:** `POST /agents`, `POST /agents/{id}/test` on `:8000`.

---

## 6. Step-by-Step Build Procedure

### Step 0 — Prereqs (1 min)
```bash
cd /Users/apple/Documents/My_Business/BANGI_Agent
cp .env.example .env  # already live: BANGI_BACKEND_URL=http://localhost:8000 GATEWAY_PORT=8001 CORS=...
uv sync               # fastapi, pydantic, python-dotenv, pyyaml, pandas
npm --prefix apps/web --cache /tmp/npm-cache install
```

### Step 1 — Backend: Add Agent Registry (30 min)
1. Create `backend/agents.py`:
   ```python
   from backend.db import BangiDB
   class AgentRegistry:
     def create_agent(self, data): ... # insert into agents + agent_brains, log event
     def list_agents(self): ...
     def test_agent(self, agent_id, prompt): 
       # loads agent + its brains → builds system prompt:
       # "You are {name} ({tone}), Goal: {primary_goal}, Brains: {brain_ids}, Autonomy: {level}"
       # calls bangi_agent.do_task(prompt) with autonomy_check
   ```
2. Add `backend/schemas.py`:
   ```python
   class CreateAgentRequest(BaseModel):
     name: str = Field(min_length=1, max_length=80)
     description: Optional[str] = None
     primary_goal: Optional[str] = None
     communication_tone: str = "Professional"
     guided_prompt: str = Field(min_length=1)  # "What should it do?"
     autonomy_level: Literal["observe","suggest","act_notify","full_auto"] = "suggest"
     brain_ids: List[str] = Field(min_length=1)  # at least 1
   ```
3. Wire in `backend/app.py`:
   ```python
   from backend.agents import AgentRegistry
   registry = AgentRegistry(bangi.db)
   @app.post("/agents") ...
   @app.post("/agents/{id}/test") ...
   @app.get("/brains")  # returns seeded 10 brains matching screenshot
   ```
4. Extend `backend/db.py._init_db()` with `agents`, `agent_brains`, `agent_tests` tables above.

### Step 2 — Gateway: Proxy + In-Process (15 min)
Add to `gateway/server.py`:
```python
BACKEND_URL = os.getenv("BANGI_BACKEND_URL", "http://localhost:8000")
@app.post("/api/agents")
async def api_create_agent(payload: Dict[str,Any], _:None=Depends(require_auth)):
  if IN_PROCESS and _bangi: return registry.create_agent(payload)
  r = await _get_http_client().post(f"{BACKEND_URL}/agents", json=payload); return r.json()
# same for /api/agents/{id}/test, /api/brains
```

### Step 3 — Frontend: Replicate Screenshot Exactly (60 min)
Create `apps/web/app/ai-suite/agents/create/page.tsx`:
- Copy layout from existing `apps/web/app/page.tsx` (Antigravity theme ink #070A12 gold #C9A86A, Tailwind)
- **Top:** Breadcrumb `Agents > Create Custom Agent`, title + `Advanced` (ghost), `Test Agent` (outline), `Create Agent` (blue bg #3B82F6) — as screenshot
- **Guided Setup card:** light blue bg `bg-blue-50/50`, progress bar 33%, textarea `What should it do?` + `Back`/`Next`
- **Identity card:** 2-col grid (Agent Name* + Communication Tone select), Description textarea, Primary Goal input, Autonomy 4 cards (radio, `Suggest` selected blue border), matrix table (as screenshot, green `Runs`, amber `Approval`)
- **Knowledge Brains card:** `*` required, pill list (purple bg, `×` remove), `+ Create Brain` button, `10 brains selected` dropdown — seed with 10 labels above; Finance Brain green = `bg-green-50`
- **Footer:** `Cancel` + `Create Agent` (calls `fetch("/api/agents", {method:"POST", body: JSON.stringify({...})})` via `lib/api.ts` helper `apiCreateAgent`)

Add to `lib/api.ts`:
```ts
export const apiCreateAgent = (d:any)=> fetch(`${base}/api/agents`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)}).then(r=>r.json())
export const apiTestAgent = (id:string,prompt:string)=> fetch(`${base}/api/agents/${id}/test`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({prompt})}).then(r=>r.json())
```

### Step 4 — Validation & Test (15 min)
```bash
# Backend
.venv/bin/python -m py_compile backend/agents.py
curl -X POST http://localhost:8001/api/agents -H "Content-Type: application/json" \
  -d '{"name":"Solar Onboarding Agent","communication_tone":"Professional","guided_prompt":"Onboard new solar customers and answer product questions","autonomy_level":"suggest","brain_ids":["solar_business","module:email_marketing","module:whatsapp","module:workflows_chatflows","module:inbox","module:prospecting","module:chat_widget","sales_brain","marketing_brain","finance_brain"]}'
# Expect 201 {id: "653aef23-..."}

# Test agent (Suggest → Read runs, Write needs approval)
curl -X POST http://localhost:8001/api/agents/653aef23/test -d '{"prompt":"Show me last 5 leads"}'

# Frontend
npm --prefix apps/web --cache /tmp/npm-cache run build  # expect ✓ Compiled 5.32kB /
```

### Step 5 — Optional: Sync to MyAppz Backend (if you need parity)
MyAppz admin at `admin.myappzbackend.com` v2 uses same `POST /v2/s-653aef23.../ai-suite/agent` REST. Mirror `gateway/server.py` proxy:
```python
MYAPPZ_URL = os.getenv("MYAPPZ_ADMIN_URL", "https://admin.myappzbackend.com")
MYAPPZ_TOKEN = os.getenv("MYAPPZ_TOKEN", "")
# on create, also POST to MyAppz for parity
```

---

## 7. ENV Additions (already live, just extend)

Add to `[BANGI_Agent/.env](/Users/apple/Documents/My_Business/BANGI_Agent/.env)`:
```
# AI Suite Agents
AGENT_DEFAULT_AUTONOMY=suggest
AGENT_DEFAULT_TONE=Professional
MYAPPZ_ADMIN_URL=https://admin.myappzbackend.com
MYAPPZ_TOKEN=  # leave empty in dev
```

Web already has `NEXT_PUBLIC_GATEWAY_URL=` (empty = rewrites).

---

## 8. File Checklist to Create/Modify

| File | Action |
|------|--------|
| `backend/agents.py` | **Create** — AgentRegistry + autonomy_check |
| `backend/schemas.py` | **Modify** — add CreateAgentRequest, AgentResponse |
| `backend/app.py` | **Modify** — add /agents, /agents/{id}/test, /brains routes + dotenv already live |
| `backend/db.py` | **Modify** — add agents tables + _init_db |
| `gateway/server.py` | **Modify** — add /api/agents proxy (already has require_auth, CORS, rate limit) |
| `apps/web/app/ai-suite/agents/create/page.tsx` | **Create** — replicate screenshot pixel-perfect |
| `apps/web/lib/api.ts` | **Modify** — add apiCreateAgent, apiTestAgent |
| `BANGI_Agent/.env` | **Modify** — add AGENT_* vars (already verified live 11 vars) |
| `tests/test_agents.py` | **Create** — test create, test, autonomy matrix, brains 10 |

---

## 9. Test Plan (matches prior BANGI 4-test pattern)

```python
def test_create_agent_suggest_10_brains(): POST with 10 brains → 201, autonomy=suggest
def test_autonomy_matrix_suggest(): Read=runs, Write=approval, Destructive=approval
def test_guided_prompt_required(): missing guided_prompt → 422
def test_knowledge_brains_seed(): GET /api/brains → contains 10 labels including Finance Brain
```

Run: `.venv/bin/python -m pytest tests/test_agents.py -v` → `4 passed`

---

## 10. Deployment

```bash
# Local (3 terminals)
uv run bangi      # :8000
uv run gateway    # :8001
npm --prefix apps/web --cache /tmp/npm-cache run dev  # :3000 → http://localhost:3000/ai-suite/agents/create

# Prod (Docker — already in repo)
docker build -t bangi-mvp . && docker compose up -d  # :8000, :8001, :3000
./deploy_bangi_oci.sh  # → OCI 140.245.194.223
```

Open `http://localhost:3000/ai-suite/agents/create` — should pixel-match the screenshot (Observe/Suggest selected, 10 purple pills, Finance Brain green).

---

*Generated for BANGI v0.5 — Hermes 10 skills + 70 tools + Next+Flutter+Gateway. Screenshot v2-s-653aef23... mapped 1:1. Previous .env live fixes (CORS, validation, WAL, rate-lock) preserved.*
