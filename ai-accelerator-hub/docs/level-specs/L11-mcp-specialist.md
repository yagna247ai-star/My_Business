# Level 11 — Automation & MCP Specialist · Persona Specs

| | |
|---|---|
| Code | `L11_MCP_SPECIALIST` · Stage 4, AI Agents & Advanced Systems · 280 XP |
| Topics | MCP fundamentals · MCP servers · MCP clients · Tool integrations · Agentic automation · Human approval workflows · Practical enterprise automation |
| Unlock | Level 10 approved. Levels 10–11 are the prerequisite for the **Agent Developer** track. |
| Status | Spec only. The Model Context Protocol (MCP) is an open protocol. Its spec and SDK links come from the verified library. The Agent Lab agents (Claude Code, Codex CLI, OpenCode, Kilo Code) are the MCP clients, but MCP support per agent version must be **re-checked each cohort** and isn't asserted here. |

## Shared and protected
**Outcomes.** The learner can:
- explain the MCP client, server and tool model
- connect a client to an existing MCP server
- build a small MCP server with ≥2 tools
- scope permissions (read-only vs. write)
- run an agentic automation with a human approval log

| # | Activity | Protected rules |
|---|---|---|
| 1 | Mission Briefing | 1 check question |
| 2 | Learn | 5 lessons: what MCP is (client, server, tools, resources) · connecting a server to a client · writing a server · scopes and trust (only install servers you trust; review what each tool does) · approval workflows and audit. Quiz at 60% |
| 3 | Explore GitHub | The official MCP specification or SDK repo, from the verified library: find how a tool is declared. 3 questions |
| 4 | Build: MCP Server + Approved Automation | Fields:<br>`server` (repo with ≥2 tools: ≥1 read-only and ≥1 write that needs approval)<br>`client` (which agent, its config with **no secrets** in it, a screenshot of the tools listed)<br>`automation` (a 3+ step task run end to end)<br>`approval_log` (≥3 approval decisions with a timestamp and what was approved)<br>`trust` ≥40 words (what the server can access, how credentials are scoped) |
| 5 | Submit Proof | Repo, a video of the agent calling the tools and the approval prompt, and the approval log |
| 6 | Evaluation and Boss | 6 integration decisions |

**Boss choices:**
- 0 = Connect with read-only scope
- 1 = Connect with write access, approval required
- 2 = Don't connect

**Proposed rubric:**

| Dimension | Weight |
|---|---|
| Working server | 0.25 |
| Client integration | 0.15 |
| Scoping and trust | 0.20 |
| Approval workflow | 0.15 |
| Automation value | 0.05 |
| Reflection | 0.10 |
| Boss | 0.10 |

---

## Young Coder
- **Briefing:** An MCP server for their own "Python practice tracker", with the tools `list_exercises` (read) and `mark_done` (write, with approval).
- **Check question:** A random MCP server online says it "makes your agent super smart" and wants access to all their files. They:
  - Install it
  - **Don't install it: they can't verify what it does, and it asks for too much access**
  - Ask a friend

  Answer: 1.
- **Learn demo:** Connect a local server to Kilo Code or another Agent Lab agent and call `list_exercises`.
- **Build:** A local-only server with 2 tools over their own data, approval for `mark_done`, and an approval log.
- **Boss decisions:**
  1. Read their own practice list [0]
  2. Mark an exercise done [1]
  3. An unknown server wanting the whole disk [2]
  4. Read the public Python docs [0]
  5. Edit their own code file [1]
  6. A server that posts on social media [2]
- **Safety:** Local only, with no third-party accounts unless a guardian consents.

## Student & Career Starter
- **Briefing:** An MCP server for their "application tracker" (from Level 6) that lets an agent query and update applications.
- **Check question:** Where do the server's API credentials go?
  - In the client config committed to Git
  - **In environment variables or the OS keychain, with `.env` git-ignored**
  - In the README

  Answer: 1.
- **Learn demo:** Read the MCP spec's tool definition, then write a server with one read tool in Python or TypeScript.
- **Build:** A server with ≥2 tools, used by an agent, a 3-step automation such as "find stale applications, draft follow-ups, then wait for approval", and a public repo.
- **Boss decisions:**
  1. Read the tracker sheet [0]
  2. Update an application's status [1]
  3. Send recruiter emails without review [2]
  4. Search their notes [0]
  5. Create a calendar reminder [1]
  6. A server from an unknown author asking for their email password [2]

## Engineering Professional
- **Briefing:** Expose internal tools (ticketing, docs search, deploy status) to engineers' agents through MCP, with enterprise controls.
- **Check question:** Which MCP server design is safest for `create_ticket`?
  - Use one shared admin token
  - **Per-user, least-privilege credentials, an approval step, and audit logging of the tool's inputs and outputs**
  - No auth on localhost

  Answer: 1.
- **Learn demo:** Build a server with typed tool schemas, input validation and rate limits. Then connect it to Claude Code or Codex and test an injection through a tool result.
- **Build:**
  - A server with ≥3 tools, tests for each tool, scoped tokens, an audit log, and an approval workflow.
  - A threat model covering tool poisoning and over-broad scopes.
  - It runs against sandbox services.
- **Boss decisions:**
  1. Docs search [0]
  2. Deploy status [0]
  3. Create a ticket [1]
  4. Trigger a deploy [1]
  5. Rotate secrets through the agent [2]
  6. A community server with unpinned dependencies and shell access [2]

## AI Builder, Enthusiast
- **Briefing:** Let their AI agent operate the Level 7 app's admin tasks through an MCP server instead of clicking around.
- **Check question:** The agent wants to call `delete_user`. The server should:
  - Allow it
  - **Not expose that tool, or require typed confirmation and approval**
  - Hide the log

  Answer: 1.
- **Learn demo:** Install a trusted, well-known MCP server, review its tools list, and turn off the tools they don't need.
- **Build:** A server for their app with ≥2 tools, used by their Agent Lab agent, a 3-step admin automation, and an approval log.
- **Boss decisions:**
  1. List today's bookings [0]
  2. Update a booking [1]
  3. Delete all test users in production [2]
  4. Read analytics [0]
  5. Send a broadcast email [1]
  6. A server needing their cloud root credentials [2]

## Business Owner
- **Briefing:** Connect their AI assistant to the order sheet and the calendar through MCP, so they can ask "what's due tomorrow?" and "draft the supplier order".
- **Check question:** A vendor's MCP connector asks for "full access to your Google account". They:
  - Accept
  - **Choose the narrowest scope that's offered, or ask the vendor what each permission is for**
  - Share their password

  Answer: 1.
- **Learn demo:** Connect an assistant to a sheet through a trusted server, read only, and ask 3 questions.
- **Build:** An automation using ≥2 tools (read the sheet, draft or write a calendar entry with approval), 3+ steps, and an approval log. A mentor can scaffold the server code; the learner explains it.
- **Boss decisions:**
  1. Read the orders sheet [0]
  2. Add a delivery to the calendar [1]
  3. Let the agent make payments [2]
  4. Read the menu file [0]
  5. Send a customer message [1]
  6. A connector from an unknown company wanting their bank login [2]
