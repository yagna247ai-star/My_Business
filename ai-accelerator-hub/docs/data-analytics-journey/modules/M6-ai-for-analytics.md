# M6 — AI for Data Analytics · Days 28–31

| | |
|---|---|
| Parent | `../00-INDEX.md` |
| Duration | 4 days (PDF Days 28–31) |
| MSMEs | Sunita Stores (SQL drafting), Little Scholars (AI-assisted cleaning), Ganesh Micro-Credit Co-op (report generation and privacy) |
| Tools | One approved AI assistant (chosen by the institution), the SQL and Python environments from M2 and M4 |

## Objective
Use AI tools to speed up SQL, Python, cleaning and report writing, and check every AI output against the data. The module treats AI as a fast junior helper that must be reviewed.

## Learning outcomes
- Explain what generative AI and large language models (LLMs) do, and where they fail.
- Write prompts that give the model the schema, the goal, the rules and the expected output format.
- Ask AI for SQL and Python, run them, and fix what breaks.
- Use AI for summaries and pattern finding, then confirm each claim with a query or a chart.
- Spot hallucinations, state data limits, and follow data-privacy rules (no personal data in prompts).

## Day plan
| Day | Artifact | MSME problem | Concept |
|---|---|---|---|
| 28 | [D28](../days/D28-ai-in-analytics.md) | Owner has heard about AI and wants to know what it can safely do | GenAI, LLMs, use cases |
| 29 | [D29](../days/D29-prompting-sql-python.md) | Sunita Stores needs a query for "top products by branch" and gets a wrong one | Prompt engineering for SQL and Python |
| 30 | [D30](../days/D30-ai-cleaning-insight.md) | Little Scholars has a messy attendance file and needs patterns | AI-assisted cleaning and insight |
| 31 | [D31](../days/D31-ai-reports-privacy.md) | Co-op needs a monthly loan summary without exposing borrower names | Report generation, hallucinations, privacy |

## Module assessment
A verification exercise: the learner gets an AI-written report with five claims. The learner marks each claim as supported, unsupported or wrong, and corrects it with evidence. Pass mark: 4 of 5 correct calls.

## Job link
Junior Data Analyst and MIS / Reporting Analyst. Employers increasingly expect analysts to use AI tools responsibly.

## Rubric notes
Data checks (0.10) carries extra weight. A learner who accepts an AI claim without checking it cannot pass this module.

## Safety rules
- No real customer names, phone numbers, Aadhaar-style IDs, or health details in prompts. Use the synthetic datasets in `../00-INDEX.md` §4.
- The institution's approved AI tool only.
