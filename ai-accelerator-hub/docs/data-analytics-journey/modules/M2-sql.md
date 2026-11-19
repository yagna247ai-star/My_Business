# M2 — SQL for Data Analytics · Days 5–11

| | |
|---|---|
| Parent | `../00-INDEX.md` |
| Duration | 7 days (PDF Days 5–11) |
| MSMEs | Sunita Stores (sales, stock), Ravi Textiles (orders, churn), Ganesh Micro-Credit Co-op (loans), Little Scholars (fees) |
| Tools | A free local database (SQLite or PostgreSQL, chosen in D05), a SQL editor |

## Objective
Retrieve, filter, combine and summarise business data with SQL, and answer the owner's question in a single readable query or a short set of CTEs.

## Learning outcomes
- Explain tables, rows, columns, primary keys and foreign keys using the `employees` and `departments` example.
- Write `SELECT`, `WHERE`, `ORDER BY` and `LIMIT` to answer a business question.
- Filter with operators (`AND`, `OR`, `IN`, `BETWEEN`, `LIKE`, `IS NULL`) and explain NULL handling.
- Group and summarise (`GROUP BY`, `HAVING`) and choose the right join type.
- Use subqueries, CTEs, `CASE WHEN` and window functions for ranking and period-on-period comparisons.

## Day plan
| Day | Artifact | MSME problem | Concept |
|---|---|---|---|
| 5 | [D05](../days/D05-databases-rdbms-keys.md) | Sunita Stores keeps sales in one Excel sheet and needs proper tables | Database, keys |
| 6 | [D06](../days/D06-select-where-order.md) | Store manager needs the 10 most recent large orders | SELECT, WHERE, ORDER BY, LIMIT |
| 7 | [D07](../days/D07-sql-operators-filtering.md) | Co-op wants overdue loans, excluding closed ones | Operators, NULL |
| 8 | [D08](../days/D08-aggregates-group-by.md) | Pinnacle Tools needs department-wise payroll | Aggregates, GROUP BY, HAVING |
| 9 | [D09](../days/D09-sql-joins.md) | Clinic lists patients who never returned after a first visit | Joins |
| 10 | [D10](../days/D10-subqueries-ctes-case.md) | Ravi Textiles needs a monthly report with bands for order size | Subqueries, CTE, UNION, CASE |
| 11 | [D11](../days/D11-window-functions.md) | Sunita Stores wants the top seller per branch and month-on-month change | Window functions, date and string functions |

## Checkpoint (SQL assessment, part of the 20% SQL and Python block)
After Day 11, a timed practical: 8 questions on the shared `sales_orders`, `customers` and `products` tables. Pass mark 60%. Each question has one expected result table; the learner's query must return it.

## Job link
SQL Analyst (Trainee) is the most direct match in this journey. The M2 checkpoint is the proof artifact for that role.

## Rubric notes
Correct result (0.35) is weighted highest here. Readability (method, 0.20) includes consistent aliasing and one clause per line.
