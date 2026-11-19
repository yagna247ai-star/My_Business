# AI-Powered Data Analytics Journey — Index and Master Spec

| | |
|---|---|
| Version | 1.0, 2026-11-18 |
| Status | **Spec and content only. No code.** Awaiting review before any seeding or UI work. |
| Source | `Downloads/45_Day_Data_Analytics_Course_Syllabus.pdf` ("45-Day Data Analytics Course — Topic-wise Training Syllabus for Entry-Level Engineers") |
| Sibling journey | `docs/level-specs/00-INDEX.md` (the AI journey, L01–L15). This journey uses the same pattern: shared competence bar, applied proof, human review. |
| Spec method | **GitHub Spec Kit** (official toolkit, `github/spec-kit`, v1.4.3.dev0). Feature spec: `../../specs/001-data-analytics-journey/spec.md`, with its quality checklist in `checklists/requirements.md`. Templates in `../../.specify/`. The Spec Kit MCP server (`@lsendel/spec-kit-mcp`) was **not** installed. |
| Content | 9 module specs in `modules/`, 45 day artifacts in `days/` |
| Practice pack | `practice/`: dataset generator (13 domains, options for size, messiness and seed), 39 labs (beginner, intermediate, advanced) with full problem statements, setup checks, and `SETUP-WINDOWS.md` |
| Traceability | `TRACEABILITY.md`: every spec requirement, user story and success criterion mapped to modules, days and the hub |

---

## 1. Goal

Turn the 45-day syllabus into a **job-ready, applied-learning journey** for entry-level learners (basic computer knowledge, no prior coding needed). Every day teaches one concept set, then has the learner **solve a realistic MSME problem** with it. The learner should finish able to say: "I can take a messy business dataset, answer the owner's question with SQL and Python, show it in Power BI, and explain what I did."

### Principles
1. **Problem first.** Each day opens with a business problem a micro, small or medium enterprise (MSME) actually has. The concept is the tool for solving it, not the topic of the day.
2. **Apply, don't just watch.** Each day has a learner task with a stated expected output. The learner must produce something that can be checked.
3. **One storyline.** Days use a shared set of fictional MSMEs (§4), so later days build on earlier ones and the learner sees the same business grow.
4. **AI is a helper, not a shortcut.** AI tools appear from Day 28. Learners must verify AI output against the data. Module 6 teaches hallucination checks and data privacy.
5. **Honest scope.** The syllabus calls itself entry-level. Advanced ML and production ETL are introduced, not mastered (see §8).

---

## 2. Structure: 9 modules, 45 days

| Module | Name | Days | Spec | Core outcome |
|---|---|---|---|---|
| M1 | Data Analytics Fundamentals | 1–4 | [M1](modules/M1-fundamentals.md) | Explain what data and analytics are for a business owner |
| M2 | SQL for Data Analytics | 5–11 | [M2](modules/M2-sql.md) | Query, filter, join and summarise business data |
| M3 | Python Fundamentals | 12–16 | [M3](modules/M3-python-fundamentals.md) | Write small Python programs with data structures and files |
| M4 | Python for Data Analytics | 17–22 | [M4](modules/M4-python-analytics.md) | Clean, transform and explore a dataset with pandas and NumPy |
| M5 | Power BI | 23–27 | [M5](modules/M5-power-bi.md) | Model data and build an interactive sales dashboard |
| M6 | AI for Data Analytics | 28–31 | [M6](modules/M6-ai-for-analytics.md) | Use AI to draft SQL, Python and reports, and verify them |
| M7 | Machine Learning | 32–36 | [M7](modules/M7-machine-learning.md) | Frame and test a simple prediction (price, churn, segments) |
| M8 | ETL & Data Quality | 37–41 | [M8](modules/M8-etl-data-quality.md) | Move data source → staging → target and validate it |
| M9 | Capstone & Industry Readiness | 42–45 | [M9](modules/M9-capstone-readiness.md) | Deliver one end-to-end project and pass a mock interview |

Day artifacts: `days/D01-…` to `days/D45-…` (listed in §6).

---

## 3. Daily pattern (from the PDF, §5)

| Block | Minutes | What happens in the day artifact |
|---|---|---|
| Concept explanation | 60 | §3 Concept notes |
| Trainer demonstration | 60 | §4 Worked example |
| Hands-on practical | 90 | §5 Applied task on the MSME case |
| Assignment / worksheet | 45 | §5 Deliverable and §6 checks |
| Revision and assessment | 15 | §7 Self-check |

Total: 4 h 30 min per day.

---

## 4. The shared MSME storyline (fictional)

All businesses, people, and figures are invented for teaching. No real organisation or person is named. Data is synthetic.

| MSME | Type | Owner's question | Used in |
|---|---|---|---|
| **Sunita Stores** (2 branches, 12 staff) | Grocery retail | Which products sell, where, and when do we run out? | M1–M5, M8, M9 |
| **Bright Smile Dental Clinic** | Healthcare (small clinic) | Which treatments earn most, and where do patients drop off? | M1, M4 (profiling), M8 (quality) |
| **Little Scholars Tuition Centre** | Education | Which students are falling behind, and are fees paid on time? | M1, M3, M5 |
| **Ganesh Micro-Credit Co-op** | Micro-lending | Which loans are at risk of default? | M2, M7 (classification), M8 |
| **Ravi Textiles** (wholesale and online) | Wholesale and e-commerce | Why did last month's sales fall, and which customers have stopped ordering? | M2, M4, M7 (churn) |
| **Pinnacle Tools** (12-person workshop) | Light manufacturing | Why are good staff leaving, and which teams are most affected? | M4, M7 (attrition), M9 |

Shared tables (synthetic, defined per MSME; learners will not need to memorise them):

| Table | Typical columns |
|---|---|
| `customers` | customer_id, name, city, joined_on, segment |
| `products` | product_id, name, category, unit_price |
| `sales_orders` | order_id, customer_id, product_id, branch, qty, order_date, amount |
| `departments` | dept_id, dept_name |
| `employees` | emp_id, name, dept_id, salary, joined_on, left_on, status |

The PDF's "Employee and Department tables" (Day 9) are the `employees` and `departments` tables above, so the M2 joins reuse them.

---

## 5. Assessment and certification (from the PDF, §6)

| Assessment | Weight | Where in the journey |
|---|---|---|
| Daily practical assignments | 20% | Every day's §5 deliverable |
| SQL and Python assessments | 20% | Checkpoints after Days 11 and 22 |
| Module-wise examinations | 15% | End of each module (M1–M8) |
| Power BI dashboard assessment | 10% | Day 27 dashboard, re-graded in M9 |
| Capstone project | 25% | M9 Days 42–44 |
| Final viva and presentation | 10% | Day 45 |

**Proposed rubric for the applied tasks** (applies to every day's deliverable; the pass mark is 3.0 of 5):

| Dimension | Weight | What "good" looks like |
|---|---|---|
| Correct result | 0.35 | Output matches the expected result in the day's answer key |
| Business reading | 0.25 | The learner states what the number means for the owner, in one or two sentences |
| Method | 0.20 | Query or code is readable, uses the taught concept, has no hard-coded magic numbers |
| Data checks | 0.10 | Learner states at least one data limitation (missing values, duplicates, sample size) |
| Reflection | 0.10 | Learner names one thing they would do differently or ask the owner next |

---

## 6. Day artifacts

| Day | Module | Title | Artifact |
|---|---|---|---|
| 1 | M1 | What Is Data, and How Do We Use It? | [D01](days/D01-introduction-to-data-analytics.md) |
| 2 | M1 | Three Kinds of Data: Table, Almost-Table, and Messy | [D02](days/D02-types-of-data.md) |
| 3 | M1 | The Five Steps From Messy Records to a Clear Answer | [D03](days/D03-analytics-lifecycle.md) |
| 4 | M1 | Spreadsheets That Count: Excel and CSV | [D04](days/D04-domains-excel-csv.md) |
| 5 | M2 | One Big Sheet Becomes Three Small Tables | [D05](days/D05-databases-rdbms-keys.md) |
| 6 | M2 | Asking the Database for Exactly What You Need | [D06](days/D06-select-where-order.md) |
| 7 | M2 | Picking Only the Loans That Need Attention | [D07](days/D07-sql-operators-filtering.md) |
| 8 | M2 | Adding Up Money by Team | [D08](days/D08-aggregates-group-by.md) |
| 9 | M2 | Matching Two Lists Together | [D09](days/D09-sql-joins.md) |
| 10 | M2 | Building a Report in Steps | [D10](days/D10-subqueries-ctes-case.md) |
| 11 | M2 | Ranking Inside Groups Without Losing Rows | [D11](days/D11-window-functions.md) |
| 12 | M3 | Your First Python Program: A Shop Cash Counter | [D12](days/D12-python-basics.md) |
| 13 | M3 | Teaching the Program to Decide | [D13](days/D13-python-conditionals.md) |
| 14 | M3 | Checking Every Product on the Shelf | [D14](days/D14-python-loops.md) |
| 15 | M3 | Storing Staff Records the Right Way | [D15](days/D15-python-data-structures.md) |
| 16 | M3 | A Checker Robot for Loan Files | [D16](days/D16-python-functions-files.md) |
| 17 | M4 | Doing Maths on a Whole Shelf at Once | [D17](days/D17-numpy.md) |
| 18 | M4 | Opening Tables in Python With pandas | [D18](days/D18-pandas-reading-files.md) |
| 19 | M4 | Looking Before You Touch: Checking a New Table | [D19](days/D19-data-inspection.md) |
| 20 | M4 | Cleaning a Messy Staff List | [D20](days/D20-data-cleaning.md) |
| 21 | M4 | Sorting, Grouping, and Joining Sales Data | [D21](days/D21-manipulation-groupby-merge.md) |
| 22 | M4 | Telling the Story of a Year of Sales | [D22](days/D22-dates-strings-eda.md) |
| 23 | M5 | Power BI: Connecting Your Data to a Picture | [D23](days/D23-power-bi-intro.md) |
| 24 | M5 | Cleaning Data Inside Power BI, Step by Step | [D24](days/D24-power-query.md) |
| 25 | M5 | Organising Data Like a Library: The Star Shape | [D25](days/D25-data-modelling-star-schema.md) |
| 26 | M5 | Teaching Power BI to Do the Maths | [D26](days/D26-dax-measures.md) |
| 27 | M5 | A One-Page Morning Dashboard | [D27](days/D27-dashboard-design.md) |
| 28 | M6 | What AI Can and Cannot Do for Your Data Work | [D28](days/D28-ai-in-analytics.md) |
| 29 | M6 | Asking AI the Right Way: The Five-Part Question | [D29](days/D29-prompting-sql-python.md) |
| 30 | M6 | Using AI to Tidy a Messy Class Register | [D30](days/D30-ai-cleaning-insight.md) |
| 31 | M6 | Writing a Report With AI, Without Breaking Trust | [D31](days/D31-ai-reports-privacy.md) |
| 32 | M7 | Can a Computer Learn From Past Shop Days? | [D32](days/D32-intro-to-ml.md) |
| 33 | M7 | Teaching a Model With Practice and a Test Paper | [D33](days/D33-features-labels-split.md) |
| 34 | M7 | Drawing the Best Straight Line Through Past Sales | [D34](days/D34-linear-regression.md) |
| 35 | M7 | Predicting Who Will Leave, and Measuring How Good Your Guess Is | [D35](days/D35-classification-metrics.md) |
| 36 | M7 | Sorting Customers Into Friend Groups by How They Shop | [D36](days/D36-clustering-evaluation.md) |
| 37 | M8 | Moving Data From Where It Lives to Where It Helps | [D37](days/D37-etl-elt-pipelines.md) |
| 38 | M8 | Collecting Parcels From Four Different Places | [D38](days/D38-extraction.md) |
| 39 | M8 | Translating Two Languages Into One | [D39](days/D39-transformation.md) |
| 40 | M8 | Filing Each Order Under the Right Customer, Even After a Move | [D40](days/D40-loading-facts-dimensions.md) |
| 41 | M8 | Checking the Shop Totals Match the Bank Book | [D41](days/D41-data-quality-reconciliation.md) |
| 42 | M9 | Choosing Your Big Project and Defining the Problem | [D42](days/D42-capstone-problem-definition.md) |
| 43 | M9 | Getting Your Data Ready Before You Analyse It | [D43](days/D43-capstone-data-prep.md) |
| 44 | M9 | Answering Your Question and Showing the Answer | [D44](days/D44-capstone-analysis-dashboard.md) |
| 45 | M9 | Telling Your Story to an Owner and an Interviewer | [D45](days/D45-capstone-presentation-interview.md) |

---

## 7. Capstone projects (from the PDF, §4)

The PDF gives three capstones. Each has an MSME owner and a fixed deliverable set:

| Capstone | MSME case | Key question | Deliverables |
|---|---|---|---|
| 1. Retail Sales Analytics | Sunita Stores | Top products, monthly and regional performance | SQL pack, cleaned dataset, Power BI dashboard |
| 2. HR Employee Analytics | Pinnacle Tools | Attrition patterns and department statistics | Cleaned HR data, department stats, HR dashboard, attrition classifier (simple) |
| 3. Healthcare Data Analytics | Bright Smile Dental Clinic | Admission and visit patterns, data quality | Data profiling report, quality checks, insight note |

Learners choose one. Days 42–45 are built around it.

---

## 8. Job readiness

Target roles (from the PDF, §8): Junior Data Analyst, SQL Analyst (Trainee), Python Data Analyst (Trainee), Power BI Developer (Trainee), Data Quality Analyst (Trainee), ETL Tester (Trainee), MIS / Reporting Analyst.

Each role gets a "proof bundle" in M9: a portfolio of the learner's deliverables from Days 6–44, a one-page case study, and a mock-interview log. Advanced ML and production ETL are **not** claimed as mastered. The journey says so in its completion certificate text.

---

## 9. Open decisions for review

These need your decision before any build:

1. **Day unit.** The brief says "almost 7 days" per module. The PDF has 45 daily units. This spec uses **one artifact per PDF day** and treats each module as a 4–7 day block. Confirm or give a different unit.
2. **Datasets.** This spec describes the synthetic datasets (§4) but does not generate CSV files. Generating them is a separate, approved step.
3. **Persona variants.** The AI journey has five personas per level. This spec has one MSME case per day. Persona variants can be added later.
4. **Platform.** Power BI needs Windows, or a Power BI Desktop alternative for Mac learners. Confirm which path to document.
5. **Spec Kit MCP.** Not installed. The feature spec was written with the official Spec Kit toolkit. The MCP server is still awaiting approval.
6. **Certification wording.** The PDF gives the course a "certificate format". The journey needs its own wording, approved by the program team.
