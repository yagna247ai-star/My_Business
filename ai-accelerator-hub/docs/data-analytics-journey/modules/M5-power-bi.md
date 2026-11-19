# M5 — Power BI · Days 23–27

| | |
|---|---|
| Parent | `../00-INDEX.md` |
| Duration | 5 days (PDF Days 23–27) |
| MSMEs | Sunita Stores (sales dashboard), Little Scholars (fees and attendance), Ravi Textiles (regional performance) |
| Tools | Power BI Desktop (Windows). Mac learners use Power BI Service in a browser or a Windows VM (decision in `00-INDEX.md` §9). |

## Objective
Connect to business data, clean it in Power Query, model it as a star schema, write DAX measures, and publish an interactive dashboard that answers the owner's questions.

## Learning outcomes
- Connect to Excel and CSV files and explain the difference between Power BI Desktop and the Service.
- Clean and reshape data in Power Query and set correct data types.
- Model tables with relationships, cardinality and a star schema (and recognise a snowflake).
- Write calculated columns and measures with `SUM`, `COUNT`, `CALCULATE` and `RELATED`.
- Build charts, cards, slicers, filters and drill-through, and publish.

## Day plan
| Day | Artifact | MSME problem | Concept |
|---|---|---|---|
| 23 | [D23](../days/D23-power-bi-intro.md) | Sunita Stores has sales in Excel and fees in CSV | Desktop, Service, connections |
| 24 | [D24](../days/D24-power-query.md) | Store sales have dates as text and duplicated headers | Power Query |
| 25 | [D25](../days/D25-data-modelling-star-schema.md) | Owner wants to slice sales by product, customer and branch | Star schema |
| 26 | [D26](../days/D26-dax-measures.md) | Owner wants "Revenue", "Orders" and "Revenue vs last month" | DAX |
| 27 | [D27](../days/D27-dashboard-design.md) | Owner wants one page to run the store each morning | Dashboard design and publishing |

## Module assessment (10% Power BI dashboard assessment)
The Day 27 dashboard is graded on: correct measures (checked against the answer key numbers), at least one slicer, one drill-through, a one-line business title on each visual, and a 60-second walkthrough recording or live explanation.

## Job link
Power BI Developer (Trainee) and MIS / Reporting Analyst.

## Rubric notes
Business reading (0.25) is the main test. A chart with no stated question loses marks even when it is technically correct.
