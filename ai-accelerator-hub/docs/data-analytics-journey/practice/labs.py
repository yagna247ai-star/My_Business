#!/usr/bin/env python3
"""
Practice labs: 8 domains x 3 levels (Beginner, Intermediate, Advanced) = 24 labs.

  python3 labs.py --write-md   -> writes LABS.md (learner-facing; no solutions)
  python3 labs.py --check      -> runs the teacher's reference SQL on the CLEAN data and compares
                                  with the expected values (teacher use; needs generated/ folder)

Each lab gives: a scenario, the concepts, a SQL task, a Python task, and the expected result.
Intermediate and advanced labs use the DIRTY data, so the learner must clean it first.
The expected result is always the CLEAN answer, so a learner can check their own work.
"""
from __future__ import annotations

import argparse
import csv
import sqlite3
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
GEN = HERE / "generated"

LABS = [
    # ───────────────────────── RETAIL (Sunita Stores) ─────────────────────────
    dict(id="R1", domain="retail", level="Beginner", title="The five most expensive products",
         scenario="Sunita wants a shelf-price list: the five most expensive products, dearest first.",
         concepts="SELECT, ORDER BY, LIMIT",
         sql_task="List product name and unit price of the 5 most expensive products.",
         python_task="Read products.csv with csv.DictReader, sort by unit_price (as a number), print the top 5.",
         data="retail/clean/products.csv (clean)",
         sql_ref="SELECT name, unit_price FROM products ORDER BY CAST(unit_price AS INT) DESC LIMIT 5;",
         expected="5 rows; highest is Atta 10kg at 480 (check the top value)."),
    dict(id="R2", domain="retail", level="Intermediate", title="Revenue by branch from messy bills",
         scenario="Sunita's bills came from two branches with different habits: spelling, text amounts, blanks, bad dates, repeats.",
         concepts="Cleaning, CASE/TRIM, GROUP BY, SUM",
         sql_task="After cleaning (lower-case branch names are 'north'/'south' with extra spaces; amounts like 'Rs 1,200'; blanks; invalid dates; duplicate order_id), total revenue per branch.",
         python_task="Clean the dirty sales_orders.csv in code. Log each fix with a count. Then total revenue per branch.",
         data="retail/sales_orders.csv (dirty); answer_key.json",
         sql_ref="SELECT branch, SUM(CAST(amount AS INT)) AS revenue FROM sales_orders GROUP BY branch ORDER BY branch;",
         expected="North and South totals; they must add up to total_revenue in answer_key.json."),
    dict(id="R3", domain="retail", level="Advanced", title="Best seller in each branch, each month",
         scenario="For the owner's monthly review: the top product in each branch for each month.",
         concepts="CTE, window function ROW_NUMBER, PARTITION BY",
         sql_task="For each branch and month, return the top product by revenue. Use a CTE for the monthly totals and ROW_NUMBER for the ranking.",
         python_task="Group revenue by (branch, month, product), then pick the highest per (branch, month). Print the result.",
         data="retail/clean/sales_orders.csv + products.csv",
         sql_ref=("WITH m AS (SELECT o.branch, substr(o.order_date,1,7) AS ym, p.name, SUM(CAST(o.amount AS INT)) AS rev "
                  "FROM sales_orders o JOIN products p ON p.product_id = o.product_id GROUP BY o.branch, ym, p.name), "
                  "r AS (SELECT *, ROW_NUMBER() OVER (PARTITION BY branch, ym ORDER BY rev DESC) AS rn FROM m) "
                  "SELECT branch, ym, name, rev FROM r WHERE rn = 1 ORDER BY branch, ym;"),
         expected="One row per branch per month. Each month of each branch has exactly one winner."),

    # ───────────────────────── BFSI (Ganesh Micro-Credit Co-op) ─────────────────────────
    dict(id="B1", domain="bfsi", level="Beginner", title="How many loans are still open?",
         scenario="The co-op wants a count of loans that are still open (no closing date).",
         concepts="WHERE, IS NULL, COUNT",
         sql_task="Count the loans where closed_on is empty.",
         python_task="Count rows in loans.csv where the closed_on field is an empty string.",
         data="bfsi/clean/loans.csv (clean)",
         sql_ref="SELECT COUNT(*) FROM loans WHERE closed_on IS NULL;",
         expected="24 open loans (answer_key.json: open_loans)."),
    dict(id="B2", domain="bfsi", level="Intermediate", title="Overdue open loans by branch (dirty data)",
         scenario="Overdue = still open and due before 1 Nov 2026. The file has a negative amount, blank amounts, a bad date and a repeated loan.",
         concepts="Data cleaning, IS NULL, date comparison, GROUP BY",
         sql_task="After cleaning, count overdue open loans per branch.",
         python_task="Remove repeats, drop rows with a bad date, fix the amount (use the absolute value of a negative), then count overdue open loans per branch.",
         data="bfsi/loans.csv (dirty); answer_key.json",
         sql_ref="SELECT branch, COUNT(*) FROM loans WHERE closed_on IS NULL AND due_date < '2026-11-01' GROUP BY branch ORDER BY branch;",
         expected="Branch counts that add up to overdue_open_loans = 10 in answer_key.json."),
    dict(id="B3", domain="bfsi", level="Advanced", title="Recovery rate for closed loans",
         scenario="How much of the money lent to closed loans came back? Show it per branch.",
         concepts="JOIN, aggregation, ratio, DIVIDE safely",
         sql_task="For closed loans only, per branch: total disbursed, total repaid (from repayments), and recovery % = repaid / disbursed x 100, rounded to 1 decimal.",
         python_task="Build a dictionary of repaid totals per loan_id, then compute the same figures per branch.",
         data="bfsi/clean/loans.csv + repayments.csv",
         sql_ref=("SELECT l.branch, SUM(CAST(l.amount AS INT)) AS disbursed, "
                  "(SELECT SUM(CAST(r.amount_paid AS INT)) FROM repayments r JOIN loans x ON x.loan_id = r.loan_id WHERE x.branch = l.branch AND x.closed_on IS NOT NULL) AS repaid "
                  "FROM loans l WHERE l.closed_on IS NOT NULL GROUP BY l.branch ORDER BY l.branch;"),
         expected="Three branches with repaid below disbursed (a recovery % under 100)."),

    # ───────────────────────── HEALTHCARE (Bright Smile Dental Clinic) ─────────────────────────
    dict(id="H1", domain="healthcare", level="Beginner", title="Visits by status",
         scenario="The clinic wants to see how many visits were completed, missed (no-show) or cancelled.",
         concepts="GROUP BY, COUNT",
         sql_task="Count visits for each status.",
         python_task="Count each status value in visits.csv using a dictionary.",
         data="healthcare/clean/visits.csv (clean)",
         sql_ref="SELECT status, COUNT(*) FROM visits GROUP BY status ORDER BY status;",
         expected="Three statuses; they add up to total_visits."),
    dict(id="H2", domain="healthcare", level="Intermediate", title="Revenue by treatment (dirty data)",
         scenario="Completed visits only. Status has a trailing space in some rows, fees are blank in some, and rows repeat.",
         concepts="TRIM, filtering, GROUP BY, SUM",
         sql_task="After cleaning, total fee per treatment for completed visits.",
         python_task="Strip spaces in status, remove repeated visit_id rows, then sum fees per treatment for completed visits.",
         data="healthcare/visits.csv (dirty)",
         sql_ref="SELECT treatment, SUM(CAST(fee AS INT)) FROM visits WHERE status = 'completed' GROUP BY treatment ORDER BY treatment;",
         expected="Treatment totals that add up to revenue_completed = 118100."),
    dict(id="H3", domain="healthcare", level="Advanced", title="Patients who never completed a visit, and no-show rate by age",
         scenario="Find patients with no completed visit. Then find the no-show rate for each age band.",
         concepts="LEFT JOIN anti-join, subquery, rate calculation",
         sql_task="(a) List patients with no completed visit. (b) For each age band, no-show rate % = no-shows / all visits x 100.",
         python_task="Build a set of patients who completed a visit, then list the others. Count no-shows per age band.",
         data="healthcare/clean/patients.csv + visits.csv",
         sql_ref=("SELECT p.age_band, ROUND(100.0 * SUM(CASE WHEN v.status='no_show' THEN 1 ELSE 0 END) / COUNT(v.visit_id), 1) AS no_show_pct "
                  "FROM patients p JOIN visits v ON v.patient_id = p.patient_id GROUP BY p.age_band ORDER BY p.age_band;"),
         expected="No-show % per age band. Overall rate should match no_show_rate_pct in answer_key.json (about 12%)."),

    # ───────────────────────── EDUCATION (Little Scholars) ─────────────────────────
    dict(id="E1", domain="education", level="Beginner", title="Students per class",
         scenario="The tuition centre wants to know how many students are in each class.",
         concepts="GROUP BY, COUNT",
         sql_task="Count students in each class.",
         python_task="Count rows per class value in students.csv.",
         data="education/clean/students.csv (clean)",
         sql_ref="SELECT class, COUNT(*) FROM students GROUP BY class ORDER BY class;",
         expected="Counts for classes 6, 7, 8 and 9 that add up to the number of students."),
    dict(id="E2", domain="education", level="Intermediate", title="Students below 75% attendance (dirty data)",
         scenario="Attendance file has 'yes' instead of 1, bad dates and repeated rows.",
         concepts="Cleaning, aggregation per student, HAVING",
         sql_task="After cleaning, list students whose attendance % is below 75.",
         python_task="Clean the present column (yes=1, no=0), remove repeats, compute each student's %, print those below 75.",
         data="education/attendance.csv (dirty); answer_key.json",
         sql_ref=("SELECT student_id, ROUND(100.0 * SUM(CAST(present AS INT)) / COUNT(*), 1) AS pct FROM attendance "
                  "GROUP BY student_id HAVING pct < 75 ORDER BY student_id;"),
         expected="Count of students below 75% equals students_below_75pct in answer_key.json."),
    dict(id="E3", domain="education", level="Advanced", title="Students who are both behind on fees and on attendance",
         scenario="The owner wants the students who owe fees AND have attendance below 75%.",
         concepts="Two aggregates joined, CTE, filtering on both",
         sql_task="Use two CTEs (attendance % per student, fee owed per student), join them, keep students who are below 75% and owe money.",
         python_task="Build two dictionaries (attendance %, fee owed) and print students who meet both rules.",
         data="education/clean/attendance.csv + fees.csv",
         sql_ref=("WITH att AS (SELECT student_id, 100.0 * SUM(present) / COUNT(*) AS pct FROM attendance GROUP BY student_id), "
                  "fee AS (SELECT student_id, CAST(fee_due AS INT) - CAST(fee_paid AS INT) AS owed FROM fees) "
                  "SELECT a.student_id, ROUND(a.pct,1), f.owed FROM att a JOIN fee f ON f.student_id = a.student_id "
                  "WHERE a.pct < 75 AND f.owed > 0 ORDER BY a.student_id;"),
         expected="A short list. Each row has attendance below 75 and an amount owed above 0."),

    # ───────────────────────── E-COMMERCE ─────────────────────────
    dict(id="C1", domain="ecommerce", level="Beginner", title="Orders by status",
         scenario="The online shop wants a count of delivered, returned and cancelled orders.",
         concepts="GROUP BY, COUNT",
         sql_task="Count orders for each status.",
         python_task="Count each status in orders.csv.",
         data="ecommerce/clean/orders.csv (clean)",
         sql_ref="SELECT status, COUNT(*) FROM orders GROUP BY status ORDER BY status;",
         expected="Three statuses that add up to the total number of orders."),
    dict(id="C2", domain="ecommerce", level="Intermediate", title="Delivered revenue (dirty data)",
         scenario="Some status values are in capitals, some amounts are blank, and some dates are invalid.",
         concepts="UPPER/LOWER, blanks, filtering, SUM",
         sql_task="After cleaning, total revenue of delivered orders.",
         python_task="Lower-case the status, drop blank amounts and invalid dates, then sum delivered amounts.",
         data="ecommerce/orders.csv (dirty); answer_key.json",
         sql_ref="SELECT SUM(CAST(amount AS INT)) FROM orders WHERE status = 'delivered';",
         expected="delivered_revenue = 92712 from answer_key.json."),
    dict(id="C3", domain="ecommerce", level="Advanced", title="Return rate by city",
         scenario="Which city returns the most orders? Ranked highest first.",
         concepts="JOIN, CASE, ratio, ORDER BY",
         sql_task="For each city, return rate % = returned orders / all orders x 100, ranked highest first.",
         python_task="Join orders to customers by customer_id, count returns and totals per city, print sorted by rate.",
         data="ecommerce/clean/orders.csv + customers.csv",
         sql_ref=("SELECT c.city, ROUND(100.0 * SUM(CASE WHEN o.status='returned' THEN 1 ELSE 0 END) / COUNT(*), 1) AS return_pct "
                  "FROM orders o JOIN customers c ON c.customer_id = o.customer_id GROUP BY c.city ORDER BY return_pct DESC;"),
         expected="Four cities, ranked. The overall return rate is return_rate_pct in answer_key.json."),

    # ───────────────────────── HR (Pinnacle Tools) ─────────────────────────
    dict(id="HR1", domain="hr", level="Beginner", title="Active headcount by department",
         scenario="How many people work in each department right now? (Active = no leaving date.)",
         concepts="WHERE IS NULL, GROUP BY, COUNT",
         sql_task="Count active employees in each department.",
         python_task="Count rows where left_on is empty, grouped by dept.",
         data="hr/clean/employees.csv (clean)",
         sql_ref="SELECT dept, COUNT(*) FROM employees WHERE left_on IS NULL GROUP BY dept ORDER BY dept;",
         expected="Counts per department that add up to active = 41."),
    dict(id="HR2", domain="hr", level="Intermediate", title="Average salary by department (dirty data)",
         scenario="Salaries are written like '₹ 32,000'. Some department names have a trailing space. Some salaries are blank.",
         concepts="Text-to-number cleaning, TRIM, AVG",
         sql_task="After cleaning, average salary per department for active employees, rounded to 1 decimal.",
         python_task="Strip the ₹ sign and commas, convert to int, fix department spacing, then average per department.",
         data="hr/employees.csv (dirty); answer_key.json",
         sql_ref="SELECT dept, ROUND(AVG(CAST(salary AS INT)),1) FROM employees WHERE left_on IS NULL GROUP BY dept ORDER BY dept;",
         expected="Matches avg_salary_by_dept in answer_key.json."),
    dict(id="HR3", domain="hr", level="Advanced", title="Attrition by department, ranked",
         scenario="Which department loses the highest share of its staff? Rank them.",
         concepts="CASE, ratio, RANK window function",
         sql_task="For each department: total, left, attrition % (left / total x 100), and RANK by attrition % (1 = highest).",
         python_task="Count total and left per department, compute the %, and sort to create the rank.",
         data="hr/clean/employees.csv",
         sql_ref=("SELECT dept, COUNT(*) AS total, SUM(CASE WHEN left_on IS NOT NULL THEN 1 ELSE 0 END) AS left_n, "
                  "ROUND(100.0 * SUM(CASE WHEN left_on IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*), 1) AS attr_pct, "
                  "RANK() OVER (ORDER BY 100.0 * SUM(CASE WHEN left_on IS NOT NULL THEN 1 ELSE 0 END) / COUNT(*) DESC) AS rnk "
                  "FROM employees GROUP BY dept ORDER BY rnk;"),
         expected="Five departments with ranks 1 to 5 (ties share a rank). Overall attrition is attrition_pct in answer_key.json."),

    # ───────────────────────── LOGISTICS ─────────────────────────
    dict(id="L1", domain="logistics", level="Beginner", title="On time or late?",
         scenario="How many shipments were on time, and how many were late?",
         concepts="GROUP BY, COUNT",
         sql_task="Count shipments by status.",
         python_task="Count each status in shipments.csv.",
         data="logistics/clean/shipments.csv (clean)",
         sql_ref="SELECT status, COUNT(*) FROM shipments GROUP BY status ORDER BY status;",
         expected="Two statuses that add up to total_shipments."),
    dict(id="L2", domain="logistics", level="Intermediate", title="Average delay per route (dirty data)",
         scenario="Route names are written 'Pune-Nashik' in some rows and 'Pune - Nashik' in others. Some costs are blank.",
         concepts="Standardising text, AVG, GROUP BY",
         sql_task="After standardising routes, average delay per route, rounded to 2 decimals.",
         python_task="Replace ' - ' with '-' in route, remove repeats, then average delay_days per route.",
         data="logistics/shipments.csv (dirty)",
         sql_ref="SELECT route, ROUND(AVG(delay_days),2) FROM shipments GROUP BY route ORDER BY route;",
         expected="Four routes. Averages should be close to each other (about 1 to 2 days)."),
    dict(id="L3", domain="logistics", level="Advanced", title="On-time rate per route, ranked, with cost per shipment",
         scenario="Rank routes by on-time %, and show the average cost per shipment for each.",
         concepts="CASE, ratio, window RANK, ROUND",
         sql_task="For each route: on-time %, average cost, and RANK by on-time % (highest first).",
         python_task="Compute on-time count and total per route, the average cost, and sort by on-time % descending.",
         data="logistics/clean/shipments.csv",
         sql_ref=("SELECT route, ROUND(100.0 * SUM(CASE WHEN status='on_time' THEN 1 ELSE 0 END)/COUNT(*),1) AS ontime_pct, "
                  "ROUND(AVG(CAST(cost AS INT)),0) AS avg_cost, "
                  "RANK() OVER (ORDER BY 100.0 * SUM(CASE WHEN status='on_time' THEN 1 ELSE 0 END)/COUNT(*) DESC) AS rnk "
                  "FROM shipments GROUP BY route ORDER BY rnk;"),
         expected="Four routes, ranked. Overall on-time % matches on_time_rate_pct in answer_key.json."),

    # ───────────────────────── MANUFACTURING ─────────────────────────
    dict(id="M1", domain="manufacturing", level="Beginner", title="Units made per line",
         scenario="The plant manager wants the total units made by each production line.",
         concepts="GROUP BY, SUM",
         sql_task="Sum units_made for each line.",
         python_task="Add up units_made per line using a dictionary.",
         data="manufacturing/clean/production.csv (clean)",
         sql_ref="SELECT line, SUM(CAST(units_made AS INT)) FROM production GROUP BY line ORDER BY line;",
         expected="Four lines whose totals add up to total_units."),
    dict(id="M2", domain="manufacturing", level="Intermediate", title="Defect rate per line (dirty data)",
         scenario="Line names have different capitals in some rows. Some units are blank. One date is impossible (31 Nov).",
         concepts="Cleaning, ratio, GROUP BY",
         sql_task="After cleaning, defect rate % per line = defective / made x 100, 2 decimals.",
         python_task="Standardise line names, drop blanks and bad dates, then compute the rate per line.",
         data="manufacturing/production.csv (dirty); answer_key.json",
         sql_ref=("SELECT line, ROUND(100.0 * SUM(CAST(units_defective AS INT)) / SUM(CAST(units_made AS INT)), 2) "
                  "FROM production GROUP BY line ORDER BY line;"),
         expected="Matches defect_rate_pct_by_line in answer_key.json."),
    dict(id="M3", domain="manufacturing", level="Advanced", title="Bad days and running totals",
         scenario="Find the days where a line's defect rate was above 3%. Then show a running total of units made per line.",
         concepts="CTE, HAVING-style filter, window SUM OVER (running total)",
         sql_task="(a) Days and lines with defect rate above 3%. (b) Running total of units_made per line, ordered by date.",
         python_task="Compute the rate for each (date, line). Print those above 3. Then build a running total per line.",
         data="manufacturing/clean/production.csv",
         sql_ref=("WITH d AS (SELECT date, line, 100.0 * CAST(units_defective AS INT) / CAST(units_made AS INT) AS rate, "
                  "CAST(units_made AS INT) AS made FROM production) "
                  "SELECT date, line, ROUND(rate,2) FROM d WHERE rate > 3 ORDER BY date, line;"),
         expected="A list of bad days. Running totals end at total_units when summed per line."),
]


from labs_new import NEW_LABS  # noqa: E402  (five more domains)
from problems import PROBLEMS  # noqa: E402  (full problem statements)

LABS += NEW_LABS
for _lab in LABS:
    _lab["problem"] = PROBLEMS[_lab["id"]]
assert len({l["id"] for l in LABS}) == len(LABS), "duplicate lab id"


def write_md() -> None:
    out = ["# Practice Labs — 8 Domains, 3 Levels", "",
           "Work through them in order inside each domain. Data paths are inside the `generated/` folder. Beginner labs use clean data. Intermediate and advanced labs use the dirty data, so you clean first.",
           "", "**Setup:** see `SETUP-WINDOWS.md`. **Data:** run `python3 generate_datasets.py` (or pick options, see README). Data paths below are inside `generated/`.",
           "", "**How to know you are right:** the expected result is given for each lab. Your answer must match it.", ""]
    for domain in dict.fromkeys(l["domain"] for l in LABS):
        out.append(f"## {domain.title()}")
        out.append("")
        for lab in [l for l in LABS if l["domain"] == domain]:
            out += [f"### {lab['id']} · {lab['level']} · {lab['title']}", "",
                    f"**Problem statement.**", "", lab["problem"], "",
                    f"**Short scenario.** {lab['scenario']}", "",
                    f"**You learn:** {lab['concepts']}", "",
                    f"**Data:** `{lab['data']}`", "",
                    f"**SQL task.** {lab['sql_task']}", "",
                    f"**Python task.** {lab['python_task']}", "",
                    f"**Expected result.** {lab['expected']}", ""]
    (HERE / "LABS.md").write_text("\n".join(out), encoding="utf-8")
    print(f"✓ wrote {HERE / 'LABS.md'} ({len(LABS)} labs)")


def check() -> int:
    if not GEN.exists():
        print("Run generate_datasets.py first (creates practice/generated/).")
        return 2
    failures = 0
    con_cache: dict[str, sqlite3.Connection] = {}

    def db(domain: str) -> sqlite3.Connection:
        if domain not in con_cache:
            con = sqlite3.connect(":memory:")
            for csv_path in sorted((GEN / domain / "clean").glob("*.csv")):
                rows = list(csv.reader(csv_path.open(encoding="utf-8")))
                cols = rows[0]
                con.execute(f"CREATE TABLE {csv_path.stem} ({', '.join(c + ' TEXT' for c in cols)})")
                con.executemany(f"INSERT INTO {csv_path.stem} VALUES ({','.join('?' * len(cols))})",
                                [[None if v == '' else v for v in r] for r in rows[1:]])
            con_cache[domain] = con
        return con_cache[domain]

    for lab in LABS:
        try:
            rows = db(lab["domain"]).execute(lab["sql_ref"]).fetchall()
            status = "RUNS" if rows else "EMPTY"
            if not rows:
                failures += 1
            print(f"{status:5} {lab['id']:4} {lab['title'][:48]:48} rows={len(rows)} first={rows[0] if rows else None}")
        except Exception as e:  # noqa: BLE001
            failures += 1
            print(f"ERROR {lab['id']}: {e}")
    print(f"\n{len(LABS) - failures}/{len(LABS)} reference queries run and return rows.")
    return 1 if failures else 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--write-md", action="store_true")
    ap.add_argument("--check", action="store_true")
    a = ap.parse_args()
    if a.write_md:
        write_md()
    if a.check:
        sys.exit(check())
    if not (a.write_md or a.check):
        ap.print_help()
