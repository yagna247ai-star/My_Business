# Feature Specification: AI-Powered Data Analytics Journey (45 Days)

**Feature Branch**: `001-data-analytics-journey` (no branch created; repo is not on this branch)

**Created**: 2026-11-18

**Status**: Draft

**Input**: User description: "Create a separate AI-powered data analytics journey, modelled on the AI journey, using the 45-Day Data Analytics syllabus PDF as the only source. Design every topic with applied, real-time MSME problems and solutions that use the course concepts, grouped into daily course material. The learner must be job-ready at the end."

**Source document**: `Downloads/45_Day_Data_Analytics_Course_Syllabus.pdf` (9 modules, 45 daily units)

**Companion material already written** (to be reviewed and reconciled with this spec): `docs/data-analytics-journey/00-INDEX.md`, `docs/data-analytics-journey/modules/M1–M9`, `docs/data-analytics-journey/days/D01–D45`

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Learn to query business data with SQL on real MSME problems (Priority: P1)

A beginner works through Days 5–11. Each day starts with a small-business question (for example, the owner of a grocery chain asks which products sell in each branch) and the learner writes the queries that answer it: table design and keys, filtering, aggregation, joins, subqueries, and window functions.

**Why this priority**: SQL is the most common entry skill for junior analyst roles. It is the first applied skill and the base for every later module.

**Independent Test**: Give the learner the synthetic sales, customer and product tables with a set of business questions. The learner's queries return the expected result tables for the M2 checkpoint (8 questions, pass mark 60%).

**Acceptance Scenarios**:

1. **Given** the synthetic `sales_orders`, `customers` and `products` tables, **When** the learner runs the Day 6–11 tasks, **Then** each result matches the answer key for that day.
2. **Given** a query that compares a value with `NULL` using `=`, **When** the learner reviews it, **Then** the learner can explain why it returns the wrong result and fix it.
3. **Given** a join that should keep every customer, **When** the learner uses an inner join by mistake, **Then** the learner detects the missing rows using a row count check.

---

### User Story 2 - Clean and explore messy business data in Python (Priority: P1)

A learner works through Days 12–22. They write small Python programs (eligibility rules, reorder lists, file validation) and then clean and analyse messy files from a small business: wrong types, duplicate records, inconsistent labels, and unclear dates.

**Why this priority**: Cleaning and analysis are the daily work of a junior analyst. Python is the main tool for both.

**Independent Test**: Give the learner a messy employee or sales file with planted problems (about 15). The learner produces a cleaned file, a cleaning log with one count per step, and an exploratory summary with three insights.

**Acceptance Scenarios**:

1. **Given** a file with duplicate IDs, text salaries and inconsistent department names, **When** the learner runs the cleaning steps, **Then** the output has no duplicate IDs, numeric salaries, and one label per department, and the log records each step.
2. **Given** a bad row in an input file, **When** the learner's script runs, **Then** the script continues, writes the bad row with a reason to a reject file, and reports the counts.
3. **Given** an exploratory analysis, **When** the learner writes insights, **Then** each insight has a number and a stated data limit.

---

### User Story 3 - Build a Power BI sales dashboard tied to an owner's question (Priority: P2)

A learner works through Days 23–27: connecting data, cleaning in Power Query, modelling a star schema, writing measures, and publishing a one-page dashboard.

**Why this priority**: Dashboards are how analysis reaches decision-makers. Hiring for Power BI and reporting roles depends on it.

**Independent Test**: The learner's dashboard cards (revenue, orders, average order value) match the SQL results for the same month, and the learner gives a 60-second explanation of one action the owner could take.

**Acceptance Scenarios**:

1. **Given** the cleaned sales data, **When** the learner builds a star schema with one fact table and dimensions, **Then** every relationship runs from a dimension to the fact table, and the fact total equals the flat total.
2. **Given** a KPI measure, **When** a slicer changes the month, **Then** the KPI changes and matches the SQL result for that month.
3. **Given** a chart with no title that states a question, **When** the dashboard is reviewed, **Then** the learner rewrites the title to state the question.

---

### User Story 4 - Use AI tools responsibly for analysis (Priority: P2)

A learner works through Days 28–31: writing prompts for SQL and Python, using AI for cleaning and summaries, and producing a verified business report without exposing personal data.

**Why this priority**: Employers now expect analysts to use AI tools quickly, and to check the output. Unchecked AI output is a common source of wrong reports.

**Independent Test**: The learner receives an AI-written report with five claims. They mark each claim as supported, unsupported or wrong, and correct the wrong ones with evidence. Pass mark: 4 of 5 correct calls.

**Acceptance Scenarios**:

1. **Given** an AI-written claim such as "overdue loans rose 30%", **When** the learner checks it against the data, **Then** they report the absolute change, the base, and the period, and rewrite the claim accordingly.
2. **Given** a dataset with personal identifiers, **When** the learner prepares a prompt, **Then** the identifiers are removed or aggregated first, and the learner can say why.
3. **Given** an AI-suggested pattern, **When** the learner tests it, **Then** the result is reported as confirmed, not confirmed, or wrong, with the test shown.

---

### User Story 5 - Understand and test a simple prediction (Priority: P3)

A learner works through Days 32–36: deciding whether ML fits a problem, preparing features and labels, avoiding data leakage, fitting regression and classification models, reading metrics, and grouping customers.

**Why this priority**: This is an introduction. Learners should be able to frame and test a simple prediction and explain its limits. Advanced ML is not a target of this journey.

**Independent Test**: The learner writes a one-page model report: business question, label, features, split, metric and reason, result, and one limitation. The report is graded mainly on framing and interpretation.

**Acceptance Scenarios**:

1. **Given** a planted leakage feature, **When** the learner trains a model, **Then** the learner detects the unrealistically high accuracy and removes the feature.
2. **Given** a rare outcome such as customer churn, **When** the learner reports results, **Then** they report precision and recall (not accuracy alone) and explain which error costs more.
3. **Given** a customer grouping, **When** the learner names each group, **Then** each name matches the group's measured profile.

---

### User Story 6 - Build and validate a data pipeline from source to target (Priority: P2)

A learner works through Days 37–41: designing an extract-transform-load flow across four source types, transforming to one standard format, loading full and incremental batches with history, and checking quality by reconciling source and target totals.

**Why this priority**: Testing and data-quality roles are common entry points, and reconciliation is the main quality skill they need.

**Independent Test**: Given a source and target pair with planted issues (missing rows, a duplicate, an amount mismatch, an invalid date), the learner's checks find every issue, and the reconciliation explains the difference between the totals.

**Acceptance Scenarios**:

1. **Given** source and target tables with a known total difference, **When** the learner reconciles them, **Then** the difference equals the sum of the planted issues.
2. **Given** a rerun of an incremental load, **When** the learner checks the target, **Then** no rows are duplicated.
3. **Given** a source file that cannot be read, **When** the pipeline runs, **Then** it logs the failure and loads the other sources.

---

### User Story 7 - Deliver a capstone project and be ready for an entry-level interview (Priority: P1)

A learner works through Days 42–45: chooses one of three capstone projects (retail sales, HR employees, or healthcare records), prepares and analyses the data, builds the dashboard and a predictive element, presents to an owner and a technical reviewer, and prepares for interviews.

**Why this priority**: The capstone is the main evidence of job readiness, and it is 25% of the course grade plus 10% for the final viva.

**Independent Test**: The learner's readiness pack exists: a portfolio of deliverables from Days 6–44, a one-page case study, a mock-interview log, and a skills sheet. The skills sheet claims only skills that appear in the portfolio.

**Acceptance Scenarios**:

1. **Given** a chosen capstone, **When** the learner writes the problem definition, **Then** it names the audience, the decision, the data sources, and a measurable success criterion.
2. **Given** the capstone analysis, **When** the learner presents, **Then** the presentation covers the owner's question, what was done, the finding, the limit, and one action.
3. **Given** a viva question about any step, **When** the learner answers, **Then** the answer gives the reason for the choice.

---

### Edge Cases

- A learner's query returns the right number by accident (for example, a wrong join that duplicates and then cancels out). The check must use an independent count or a hand calculation before the result is accepted.
- An AI tool returns a column name that does not exist in the schema. The learner must detect it by running the query, not by reading the output.
- A dataset has no records for a period or a branch. Analysis must state the gap, not present a trend across it as complete.
- A date column mixes two formats (for example, day-first and month-first). The parse must be checked for failures, and the learner must say which format was assumed.
- A learner is asked to predict a sensitive attribute (for example, a protected personal characteristic) or to use personal data in a prompt. The journey must stop the task and explain the rule.
- An output value is zero or missing (for example, a day with no sales). Ratios and averages must not divide by zero or treat a missing value as zero without saying so.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The journey MUST contain 9 modules and 45 daily units, using the PDF's module names, day ranges (Days 1–4, 5–11, 12–16, 17–22, 23–27, 28–31, 32–36, 37–41, 42–45) and topics.
- **FR-002**: Each daily unit MUST open with a realistic small-business problem and close with a learner task that has a named deliverable and an answer key the learner can check without a human.
- **FR-003**: Every business problem MUST use a fictional business and synthetic data. No real person, organisation, or personal identifier may appear.
- **FR-004**: Every applied deliverable MUST be graded with the shared rubric: correct result 0.35, business reading 0.25, method 0.20, data checks 0.10, reflection 0.10, with a pass mark of 3.0 out of 5.
- **FR-005**: Course assessment weights MUST match the source PDF: daily practical assignments 20%, SQL and Python assessments 20%, module examinations 15%, Power BI dashboard 10%, capstone project 25%, final viva and presentation 10%.
- **FR-006**: The journey MUST state that advanced machine learning and production ETL are introduced, not mastered, in its certificate and job-readiness text.
- **FR-007**: Any AI-assisted output used in a deliverable MUST be checked against the data, and the check MUST be recorded.
- **FR-008**: Prompts, examples and datasets MUST NOT contain real personal identifiers, health details, bank details or protected personal characteristics as features.
- **FR-009**: Each module MUST end with an applied checkpoint or assessment that uses one of the MSME cases.
- **FR-010**: Each job role in the source PDF (Junior Data Analyst, SQL Analyst (Trainee), Python Data Analyst (Trainee), Power BI Developer (Trainee), Data Quality Analyst (Trainee), ETL Tester (Trainee), MIS / Reporting Analyst) MUST be linked to the daily units that build its skills.
- **FR-011**: The journey MUST include the PDF's three recommended capstone projects (Retail Sales, HR Employee, Healthcare Data), and the learner MUST complete one of them in Days 42–44.
- **FR-012**: The journey MUST be delivered as course content only in this feature. No application code, database seeding, or user-interface changes are part of this specification.

### Key Entities

- **Module**: a named group of daily units with an objective, a checkpoint and a job link. Nine in total, from the PDF.
- **Daily unit**: one day of course material, with its source topics, MSME case, concepts, worked example, learner task, answer key, self-check and job link. Forty-five in total.
- **MSME case**: a fictional small business with an owner question and the synthetic tables that support it. Shared across days so later days build on earlier ones.
- **Synthetic dataset**: a generated table set with planted issues where a day requires them. Described here; generated in a later, separately approved step.
- **Rubric**: the shared grading dimensions, weights and pass mark applied to every applied deliverable.
- **Capstone project**: one of three PDF-recommended projects, with a fixed deliverable set (SQL pack or cleaning log, dashboard, data-quality or model report, and presentation).
- **Readiness pack**: the learner's portfolio, one-page case study, mock-interview log and skills sheet, produced in Module 9.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 45 daily units and 9 module specifications exist, and every internal link in the journey resolves.
- **SC-002**: Each daily unit's answer key lets a learner, or a reviewer without analytics expertise, decide whether a submitted result is correct, in under 10 minutes per unit.
- **SC-003**: Every module has at least one applied checkpoint that uses a named MSME case.
- **SC-004**: At least 90% of daily units use a business problem from one of the six MSME cases in the storyline, not a generic example.
- **SC-005**: A learner who completes the course can produce a portfolio containing at least one SQL pack, one cleaning log, one dashboard and one capstone, each with a written business reading.
- **SC-006**: Each job role in the source PDF is linked to at least five daily units in which its core skill is practised.
- **SC-007**: The capstone can be completed within the four Module 9 days using only skills taught in Modules 1–8, as confirmed by a dry run against the capstone brief.
- **SC-008**: No personal identifier, real organisation name, or protected characteristic appears in any prompt, dataset description or example in the journey (verified by search).

## Assumptions

- **One unit per PDF day.** The brief said "almost 7 days" and the PDF has 45 daily units. This spec uses one unit per PDF day and treats each module as a 4–7 day block. Reviewers can change the unit later without changing the topic order.
- **Entry-level learners** have basic computer skills and no prior coding. The PDF's target audience is used as-is.
- **Windows for Power BI.** Power BI Desktop runs on Windows. Mac learners use a Windows machine or VM. A non-Power-BI alternative track is not in scope for v1.
- **One approved AI tool** is provided by the institution. The journey does not depend on a specific vendor.
- **Synthetic data only.** All businesses, people, and figures are invented. Dataset generation is a separate, approved step.
- **Certificate wording** is drafted later with the program team. This spec requires only that it state the introductory scope of ML and ETL (FR-006).
- **The AI journey pattern** (`docs/level-specs/`) is the structural reference: an index, module specs and per-unit artifacts. This feature does not change the AI journey.
- **No new application code.** Seeding the journey into the app is a later feature (FR-012).

## Open Questions for Review

These are not blockers. Each has a default in use (above), and the reviewer can change it:

1. Confirm one unit per PDF day (default in use).
2. Confirm Windows-only Power BI for v1 (default in use).
3. Confirm the certificate wording owner.
