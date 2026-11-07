# Level 9 — RAG Engineer · Persona Specs

| | |
|---|---|
| Code | `L09_RAG_ENGINEER` · Stage 4, AI Agents & Advanced Systems · 220 XP |
| Topics | Embeddings · Vector databases · Document processing · Retrieval-augmented generation · Knowledge-based AI assistants · Evaluation and retrieval quality |
| Unlock | Level 8 approved. Levels 9 and 13 are the prerequisite for the **Generative AI Engineer** track. |
| Status | Spec only. No vector database vendor is mandated; the learner picks one from the library and records its licence. |

## Shared and protected
**Outcomes.** The learner can:
- chunk and embed documents
- store and retrieve them
- generate answers grounded in cited chunks
- refuse when the answer isn't in the documents
- measure retrieval and answer quality

| # | Activity | Protected rules |
|---|---|---|
| 1 | Mission Briefing | 1 check question |
| 2 | Learn | 5 lessons: what embeddings are · chunking · vector search and top-k · grounded prompts with citations and "I don't know" · evaluation (hit rate, faithfulness). Quiz at 60% |
| 3 | Explore GitHub | The RAG lesson of `microsoft/generative-ai-for-beginners` (verified), or another verified repo from the library. 3 questions |
| 4 | Build: Knowledge Assistant + Eval | Fields:<br>`corpus` (≥10 documents the learner may use: own or openly licensed, with the licence stated)<br>`pipeline` (diagram plus ≥40 words, with the chunk size and why)<br>`eval_set` (**≥10 questions**: ≥8 answerable and ≥2 not in the corpus, each with an expected source)<br>`results` (retrieval hit@k, answers with citations, correct refusals)<br>`improvement` (one change, with before and after numbers)<br>`limits` ≥30 words |
| 5 | Submit Proof | Repo or app link, the eval table and a demo video |
| 6 | Evaluation and Boss | 6 situations |

**Boss choices:**
- 0 = RAG over documents
- 1 = A plain prompt is enough
- 2 = Use a database query or search, not an LLM

**Proposed rubric:**

| Dimension | Weight |
|---|---|
| Pipeline correctness | 0.20 |
| Evaluation set quality | 0.20 |
| Measured results | 0.20 |
| Grounding and refusals | 0.15 |
| Improvement evidence | 0.05 |
| Reflection | 0.10 |
| Boss | 0.10 |

---

## Young Coder
- **Briefing:** A "study buddy" that answers only from their own class notes (typed by them) and says "not in my notes" otherwise.
- **Check question:** They ask about a topic that isn't in the notes. The best answer is:
  - Make something up
  - **"I couldn't find this in your notes"**
  - A random fact

  Answer: 1.
- **Learn demo:** Embed 3 short paragraphs, ask a question, and print which paragraph was retrieved and its score.
- **Build:** A notebook or simple app over ≥10 pages of their own notes, with 10 questions (2 unanswerable) and a measured hit rate. The low-code path uses a guided notebook.
- **Boss scenarios:**
  1. "What did my notes say about photosynthesis?" [0]
  2. "Write a poem about rain" [1]
  3. "How many students are in my class?" (there's a list) [2]
  4. "Explain the chapter 3 definitions" [0]
  5. "Tell me a joke" [1]
  6. "Sort my test scores" [2]
- **Safety:** Use only their own notes, not textbooks scanned in breach of copyright and not classmates' notes.

## Student & Career Starter
- **Briefing:** A "syllabus and placement FAQ assistant" over college documents that are public or that they wrote.
- **Check question:** The answer is right but cites the wrong chunk. What does that mean?
  - It's fine
  - **A grounding or faithfulness problem: fix retrieval or the citation mapping**
  - A model bug only

  Answer: 1.
- **Learn demo:** Compare chunk sizes of 200 and 800 tokens on the same 10 questions and see how the hit rate changes.
- **Build:** An assistant over ≥10 public documents, an eval of ≥10 questions, one measured improvement, and a public repo with a README.
- **Boss scenarios:**
  1. "What's the attendance rule in the handbook?" [0]
  2. "Write my SOP intro" [1]
  3. "How many students got placed in 2025?" (a database) [2]
  4. "Which electives need a prerequisite?" [0]
  5. "Motivate me to study" [1]
  6. "List students with CGPA > 8" [2]

## Engineering Professional
- **Why it matters:** RAG is the most common enterprise GenAI pattern. This is an emphasis level for them.
- **Briefing:** "Ask the runbooks". Engineers need cited answers from 200 runbooks, with access control by team.
- **Check question:** A user from team A retrieves team B's restricted runbook. Where's the fix?
  - In the prompt
  - **Filter by permission at retrieval time, using metadata filters that come from the user's identity**
  - Tell users not to ask

  Answer: 1.
- **Learn demo:** Hybrid search (keyword plus vector) versus vector only on 10 queries that include exact error codes. Measure both.
- **Build:**
  - A pipeline with metadata and access filters, an eval of ≥10 questions (a stretch goal is ≥30), hit@k, faithfulness scored by rubric, latency and cost per query, and one improvement backed by numbers.
  - Use synthetic or sanitised documents.
- **Boss scenarios:**
  1. "How do I rotate the X certificate?" from runbooks [0]
  2. "Draft a postmortem template" [1]
  3. "Count incidents by service last month" [2]
  4. "What does error E1042 mean?" (hybrid search) [0]
  5. "Rewrite this message politely" [1]
  6. "Which hosts are on version 2.3?" (an inventory DB) [2]
- **Safety:** No real internal documents in a public repo. Treat prompt injection inside documents as a threat.

## AI Builder, Enthusiast
- **Briefing:** Add a "help centre" assistant to the Level 7 app, answering from the app's own FAQ and docs.
- **Check question:** A user asks about pricing, and the docs are 3 months old. The assistant should:
  - Answer confidently
  - **Answer from the docs with the date shown, or say it isn't sure**
  - Guess

  Answer: 1.
- **Learn demo:** Upload 10 FAQ pages in a low-code RAG builder, ask 10 questions and log which ones fail.
- **Build:** A help assistant over ≥10 of their own docs, with 10 questions (2 unanswerable), citations shown in the UI, and one improvement.
- **Boss scenarios:**
  1. "How do I reset my booking?" (FAQ) [0]
  2. "Write a welcome tweet" [1]
  3. "How many bookings today?" (database) [2]
  4. "What's the cancellation policy?" [0]
  5. "Suggest a class name" [1]
  6. "Show my last 5 payments" [2]

## Business Owner
- **Briefing:** A WhatsApp or website FAQ assistant answering from the menu, timings, delivery areas and policies.
- **Check question:** A customer asks "is the paneer dish nut-free?" and the menu doesn't say. The assistant should:
  - Say yes
  - **Say it doesn't know and pass the question to the owner (allergy questions always go to a human)**
  - Say no

  Answer: 1.
- **Learn demo:** A no-code RAG over their menu PDF. Ask 10 real customer questions and mark them right or wrong.
- **Build:** An FAQ assistant over ≥10 business documents, a 10-question eval taken from **real past customer questions** (anonymised), a handoff rule for allergy, refund and complaint questions, and one improvement.
- **Boss scenarios:**
  1. "What are Sunday timings?" [0]
  2. "Write a Diwali greeting" [1]
  3. "How many orders did I get this week?" (sheet) [2]
  4. "Do you deliver to Kondapur?" [0]
  5. "Suggest a new combo name" [1]
  6. "Total revenue in October" [2]
- **Safety:** Allergy and health questions always go to a person.
