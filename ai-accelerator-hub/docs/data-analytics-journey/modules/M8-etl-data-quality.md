# M8 — ETL & Data Quality · Days 37–41

| | |
|---|---|
| Parent | `../00-INDEX.md` |
| Duration | 5 days (PDF Days 37–41) |
| MSMEs | Ganesh Micro-Credit Co-op (banking transactions), Bright Smile Dental Clinic (patient records), Sunita Stores (branch sales consolidation) |
| Tools | Python with pandas and SQLite (or PostgreSQL), CSV and Excel sources, one API sample (a public, read-only JSON file) |

## Objective
Move data from source systems into a target store reliably, and prove that the target matches the source. Learners build a small pipeline by hand, understand what production tools automate, and validate quality with explicit checks.

## Learning outcomes
- Draw an end-to-end ETL architecture (source, staging, transformation, warehouse, reporting).
- Extract from CSV, Excel, a database and a JSON API, and record what was read.
- Transform: map columns, filter, join, aggregate and convert types.
- Load full and incremental batches into fact and dimension tables, and explain basic slowly changing dimension (SCD) types.
- Check completeness, accuracy, consistency, uniqueness, validity, reconciliation and duplicates, and report each failure.

## Day plan
| Day | Artifact | MSME problem | Concept |
|---|---|---|---|
| 37 | [D37](../days/D37-etl-elt-pipelines.md) | Co-op receives transactions from three branch systems in three formats | ETL, ELT, staging, warehouse |
| 38 | [D38](../days/D38-extraction.md) | Clinic combines appointment CSV, billing Excel and a reminder-service API | Extraction |
| 39 | [D39](../days/D39-transformation.md) | Sunita Stores consolidates two branch sales files into one standard format | Transformation |
| 40 | [D40](../days/D40-loading-facts-dimensions.md) | Ravi Textiles loads monthly orders into a sales fact table with a customer dimension | Full vs incremental load, facts, dimensions, SCD |
| 41 | [D41](../days/D41-data-quality-reconciliation.md) | Co-op's monthly total does not match the core banking extract | Data quality, reconciliation |

## Module assessment
A source-to-target validation pack: the row counts, control totals and quality-check results for one load, plus a written note on the one issue found and fixed. Graded on whether the checks would have caught the seeded errors (the synthetic datasets include planted issues, listed in each day's answer key).

## Job link
ETL Tester (Trainee), Data Quality Analyst (Trainee) and Python Data Analyst (Trainee). The M8 validation pack is the main proof item for the testing roles.

## Safety rules
- Financial data is synthetic. No real account numbers, even masked.
- Pipelines are local teaching pipelines. Production scheduling, secrets management and monitoring are discussed, not built.
