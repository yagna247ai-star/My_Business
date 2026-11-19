#!/usr/bin/env python3
"""
Synthetic dataset generator for the AI-Powered Data Analytics practice labs.

Standard library only (csv, random, datetime, json, pathlib). No pandas needed.
All names, people and numbers are invented. No real person or organisation is represented.

Examples
--------
  python3 generate_datasets.py                          # all 8 domains, medium, dirty=some
  python3 generate_datasets.py --domain bfsi --size small --dirty none
  python3 generate_datasets.py --domain all --size large --dirty lots --seed 7 --out ./my_data

Options
-------
  --domain   retail | bfsi | healthcare | education | ecommerce | hr | logistics | manufacturing | all
  --size     small (about 100 rows) | medium (about 500) | large (about 2,000)
  --dirty    none (clean) | some (about 3% problems) | lots (about 10% problems)
  --seed     integer; the same seed always gives the same files
  --out      output folder (default: ./generated)

Each run writes, per domain:
  <out>/<domain>/<table>.csv          the data learners work on
  <out>/<domain>/answer_key.json      the expected answers, computed from the CLEAN data,
                                      plus the number of problems planted in the dirty data
  <out>/<domain>/clean/<table>.csv    the clean version, for checking your cleaning work
"""
from __future__ import annotations

import argparse
import csv
import json
import random
from datetime import date, timedelta
from pathlib import Path

SIZE_ROWS = {"small": 100, "medium": 500, "large": 2000}
DIRTY_RATE = {"none": 0.0, "some": 0.03, "lots": 0.10}
START = date(2026, 7, 1)
AS_OF = date(2026, 11, 1)  # "today" for overdue and attrition questions


def rand_date(rng: random.Random, start: date = START, days: int = 150) -> date:
    return start + timedelta(days=rng.randint(0, days))


def write_csv(path: Path, header: list[str], rows: list[list]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(header)
        w.writerows(rows)


def plant(rng: random.Random, rows: list[list], rate: float, kinds: dict[str, callable]) -> tuple[list[list], dict[str, int]]:
    """Return a dirty copy of rows, and a count of each planted problem.

    kinds maps a problem name to a function(row) -> row that breaks the row in that way.
    Duplicates are appended as extra rows (kind 'duplicate' is handled by the caller).
    """
    counts = {k: 0 for k in kinds}
    out = [list(r) for r in rows]
    # Plant at least 2 of every problem type, so each lab has something to find.
    total = max(2 * len(kinds), round(len(rows) * rate))
    names = list(kinds)
    chosen = rng.sample(range(len(out)), k=min(total, len(out)))
    for i, idx in enumerate(chosen):
        name = names[i % len(names)]
        out[idx] = kinds[name](out[idx])
        counts[name] += 1
    return out, counts


# ---------- Domain generators: each returns (clean_tables, answer_key_fn) ----------

def retail(rng, n):
    products = [[i + 1, name, cat, price] for i, (name, cat, price) in enumerate([
        ("Rice 5kg", "Grocery", 320), ("Sugar 1kg", "Grocery", 48), ("Atta 10kg", "Grocery", 480),
        ("Milk 1L", "Dairy", 60), ("Curd 500g", "Dairy", 35), ("Butter 100g", "Dairy", 55),
        ("Soap bar", "Personal care", 40), ("Shampoo 200ml", "Personal care", 180),
        ("Biscuits", "Snacks", 30), ("Chips", "Snacks", 20), ("Tea 250g", "Grocery", 140),
        ("Oil 1L", "Grocery", 165), ("Dal 1kg", "Grocery", 130), ("Paneer 200g", "Dairy", 90),
        ("Toothpaste", "Personal care", 95)])]
    customers = [[i + 1, f"Customer {i + 1:03d}", rng.choice(["Pune", "Nashik", "Solapur"]),
                  rng.choice(["retail", "wholesale", "online"])] for i in range(80)]
    orders = []
    for i in range(n):
        p = rng.choice(products)
        qty = rng.randint(1, 6)
        orders.append([i + 1, rng.randint(1, 80), p[0], rng.choice(["North", "South"]), qty,
                       rand_date(rng).isoformat(), qty * p[3]])
    tables = {
        "products": (["product_id", "name", "category", "unit_price"], products),
        "customers": (["customer_id", "name", "city", "segment"], customers),
        "sales_orders": (["order_id", "customer_id", "product_id", "branch", "qty", "order_date", "amount"], orders),
    }
    key = {
        "total_orders": len(orders),
        "total_revenue": sum(o[6] for o in orders),
        "revenue_by_branch": {b: sum(o[6] for o in orders if o[3] == b) for b in ["North", "South"]},
    }
    dirty_kinds = {
        "branch_spelling": lambda r: [*r[:3], r[3].lower() + " ", *r[4:]],
        "amount_text": lambda r: [*r[:6], f"Rs {r[6]:,}"],
        "amount_blank": lambda r: [*r[:6], ""],
        "bad_date": lambda r: [*r[:5], "31/02/2026", r[6]],
    }
    return tables, key, dirty_kinds, "sales_orders"


def bfsi(rng, n):
    customers = [[i + 1, f"Member {i + 1:03d}", rng.choice(["Pune", "Nashik", "Solapur"]),
                  rng.choice(["shop owner", "farmer", "driver", "tailor", "teacher"])] for i in range(max(40, n // 3))]
    loans, repayments = [], []
    for i in range(n // 3 if n >= 300 else n // 2):
        disb = rand_date(rng, START, 90)
        due = disb + timedelta(days=rng.choice([60, 90, 120]))
        amount = rng.choice([20000, 30000, 50000, 75000, 100000])
        closed = ""
        if rng.random() < 0.5:
            closed = (due - timedelta(days=rng.randint(0, 20))).isoformat()
        loans.append([i + 1, rng.randint(1, len(customers)), rng.choice(["Pune", "Nashik", "Solapur"]),
                      amount, disb.isoformat(), due.isoformat(), closed])
        if closed:
            for k in range(rng.randint(1, 3)):
                repayments.append([len(repayments) + 1, i + 1, (disb + timedelta(days=30 * (k + 1))).isoformat(),
                                   amount // 3])
    tables = {
        "customers": (["customer_id", "name", "city", "occupation"], customers),
        "loans": (["loan_id", "customer_id", "branch", "amount", "disbursed_on", "due_date", "closed_on"], loans),
        "repayments": (["repayment_id", "loan_id", "paid_on", "amount_paid"], repayments),
    }
    open_loans = [l for l in loans if l[6] == ""]
    key = {
        "total_loans": len(loans),
        "total_disbursed": sum(l[3] for l in loans),
        "open_loans": len(open_loans),
        "overdue_open_loans": sum(1 for l in open_loans if date.fromisoformat(l[5]) < AS_OF),
        "total_repaid": sum(r[3] for r in repayments),
    }
    dirty_kinds = {
        "amount_negative": lambda r: [*r[:3], -abs(int(r[3])), *r[4:]],
        "amount_blank": lambda r: [*r[:3], "", *r[4:]],
        "bad_date": lambda r: [*r[:5], "2026-13-01", r[6]],
        "duplicate_row": lambda r: r,  # handled as an appended duplicate below
    }
    return tables, key, dirty_kinds, "loans"


def healthcare(rng, n):
    patients = [[i + 1, f"Patient {i + 1:03d}", rng.choice(["0-17", "18-40", "41-65", "65+"]),
                  rng.choice(["Pune", "Nashik", "Solapur"])] for i in range(max(40, n // 2))]
    treatments = [("Check-up", 500), ("Cleaning", 800), ("Filling", 1500), ("Root canal", 4500), ("Extraction", 1200)]
    visits = []
    for i in range(n):
        t = rng.choice(treatments)
        status = rng.choices(["completed", "no_show", "cancelled"], weights=[80, 12, 8])[0]
        fee = t[1] if status == "completed" else 0
        visits.append([i + 1, rng.randint(1, len(patients)), rand_date(rng).isoformat(), t[0], fee, status])
    tables = {
        "patients": (["patient_id", "name", "age_band", "city"], patients),
        "visits": (["visit_id", "patient_id", "visit_date", "treatment", "fee", "status"], visits),
    }
    completed = [v for v in visits if v[5] == "completed"]
    key = {
        "total_visits": len(visits),
        "completed_visits": len(completed),
        "revenue_completed": sum(v[4] for v in completed),
        "no_show_rate_pct": round(100 * sum(1 for v in visits if v[5] == "no_show") / len(visits), 1),
    }
    dirty_kinds = {
        "status_spelling": lambda r: [*r[:5], "Completed " if r[5] == "completed" else r[5]],
        "fee_blank": lambda r: [*r[:4], "", r[5]],
        "bad_date": lambda r: [*r[:2], "32-10-2026", *r[3:]],
        "duplicate_row": lambda r: r,
    }
    return tables, key, dirty_kinds, "visits"


def education(rng, n):
    students = [[i + 1, f"Student {i + 1:03d}", rng.choice(["6", "7", "8", "9"]), rng.choice(["A", "B"])]
                for i in range(max(20, n // 20))]
    days = [START + timedelta(days=d) for d in range(0, max(40, n // len(students)))]
    attendance = []
    for s in students:
        for d in days:
            if d.weekday() < 5:  # school days only
                attendance.append([s[0], d.isoformat(), 1 if rng.random() < 0.85 else 0])
    fees = []
    for s in students:
        due = 5000
        paid = rng.choice([5000, 5000, 3000, 0])
        fees.append([s[0], "Term 1", due, paid, "" if paid < due else (START + timedelta(days=20)).isoformat()])
    tables = {
        "students": (["student_id", "name", "class", "section"], students),
        "attendance": (["student_id", "date", "present"], attendance),
        "fees": (["student_id", "term", "fee_due", "fee_paid", "paid_on"], fees),
    }
    pct = {}
    for s in students:
        rows = [a for a in attendance if a[0] == s[0]]
        pct[s[0]] = 100 * sum(a[2] for a in rows) / len(rows)
    key = {
        "students": len(students),
        "students_below_75pct": sum(1 for v in pct.values() if v < 75),
        "fee_outstanding_total": sum(f[2] - f[3] for f in fees),
    }
    dirty_kinds = {
        "present_bad_value": lambda r: [r[0], r[1], "yes"],
        "bad_date": lambda r: [r[0], "2026/07/xx", r[2]],
        "duplicate_row": lambda r: r,
    }
    return tables, key, dirty_kinds, "attendance"


def ecommerce(rng, n):
    customers = [[i + 1, f"Shopper {i + 1:03d}", rng.choice(["Pune", "Mumbai", "Delhi", "Chennai"])]
                 for i in range(max(40, n // 4))]
    orders = []
    for i in range(n):
        status = rng.choices(["delivered", "returned", "cancelled"], weights=[85, 10, 5])[0]
        orders.append([i + 1, rng.randint(1, len(customers)), rand_date(rng).isoformat(),
                       rng.choice([299, 499, 799, 1299, 2499]), status])
    tables = {
        "customers": (["customer_id", "name", "city"], customers),
        "orders": (["order_id", "customer_id", "order_date", "amount", "status"], orders),
    }
    delivered = [o for o in orders if o[4] == "delivered"]
    buyers = {}
    for o in delivered:
        buyers[o[1]] = buyers.get(o[1], 0) + 1
    key = {
        "delivered_orders": len(delivered),
        "delivered_revenue": sum(o[3] for o in delivered),
        "return_rate_pct": round(100 * sum(1 for o in orders if o[4] == "returned") / len(orders), 1),
        "customers_with_one_delivery": sum(1 for v in buyers.values() if v == 1),
    }
    dirty_kinds = {
        "status_case": lambda r: [*r[:4], str(r[4]).upper()],
        "amount_blank": lambda r: [*r[:3], "", r[4]],
        "bad_date": lambda r: [*r[:2], "2026-02-30", *r[3:]],
        "duplicate_row": lambda r: r,
    }
    return tables, key, dirty_kinds, "orders"


def hr(rng, n):
    depts = ["Machining", "Assembly", "Packing", "Quality", "Stores"]
    employees = []
    for i in range(n // 4 if n >= 200 else n // 2):
        joined = rand_date(rng, date(2019, 1, 1), 2400)
        left = ""
        if rng.random() < 0.2:
            left = (joined + timedelta(days=rng.randint(120, 1500))).isoformat()
            if date.fromisoformat(left) > AS_OF:
                left = ""
        employees.append([i + 1, f"Worker {i + 1:03d}", rng.choice(depts), rng.randint(180, 520) * 100,
                          joined.isoformat(), left])
    tables = {
        "employees": (["emp_id", "name", "dept", "salary", "joined_on", "left_on"], employees),
    }
    active = [e for e in employees if e[5] == ""]
    by_dept = {}
    for e in active:
        by_dept.setdefault(e[2], []).append(e[3])
    key = {
        "total_employees": len(employees),
        "active": len(active),
        "left": len(employees) - len(active),
        "attrition_pct": round(100 * (len(employees) - len(active)) / len(employees), 1),
        "avg_salary_by_dept": {d: round(sum(v) / len(v), 1) for d, v in sorted(by_dept.items())},
    }
    dirty_kinds = {
        "salary_text": lambda r: [*r[:3], f"₹ {r[3]:,}", *r[4:]],
        "dept_spelling": lambda r: [*r[:2], r[2].lower() + " ", *r[3:]],
        "salary_blank": lambda r: [*r[:3], "", *r[4:]],
        "duplicate_row": lambda r: r,
    }
    return tables, key, dirty_kinds, "employees"


def logistics(rng, n):
    routes = ["Pune-Nashik", "Pune-Solapur", "Nashik-Mumbai", "Solapur-Hyderabad"]
    ships = []
    for i in range(n):
        delay = rng.choices([0, 0, 0, 1, 2, 3, 5], k=1)[0]
        status = "on_time" if delay <= 1 else "late"
        ships.append([i + 1, rng.choice(routes), rand_date(rng).isoformat(), delay,
                      rng.randint(800, 6000), status])
    tables = {"shipments": (["shipment_id", "route", "dispatched_on", "delay_days", "cost", "status"], ships)}
    key = {
        "total_shipments": len(ships),
        "on_time_rate_pct": round(100 * sum(1 for s in ships if s[5] == "on_time") / len(ships), 1),
        "total_cost": sum(s[4] for s in ships),
    }
    dirty_kinds = {
        "status_spelling": lambda r: [*r[:5], "On Time" if r[5] == "on_time" else r[5]],
        "cost_blank": lambda r: [*r[:4], "", r[5]],
        "route_spelling": lambda r: [r[0], r[1].replace("-", " - "), *r[2:]],
        "duplicate_row": lambda r: r,
    }
    return tables, key, dirty_kinds, "shipments"


def manufacturing(rng, n):
    lines = ["Line A", "Line B", "Line C", "Line D"]
    days = max(10, n // len(lines))
    rows = []
    for d in range(days):
        for ln in lines:
            made = rng.randint(800, 1200)
            defective = max(0, int(made * rng.uniform(0.005, 0.06)))
            rows.append([(START + timedelta(days=d)).isoformat(), ln, made, defective])
    tables = {"production": (["date", "line", "units_made", "units_defective"], rows)}
    by_line = {}
    for r in rows:
        m, dfx = by_line.get(r[1], (0, 0))
        by_line[r[1]] = (m + r[2], dfx + r[3])
    key = {
        "total_units": sum(r[2] for r in rows),
        "defect_rate_pct_by_line": {ln: round(100 * d / m, 2) for ln, (m, d) in sorted(by_line.items())},
    }
    dirty_kinds = {
        "line_spelling": lambda r: [r[0], r[1].lower(), *r[2:]],
        "units_blank": lambda r: [*r[:2], "", r[3]],
        "bad_date": lambda r: ["2026-11-31", *r[1:]],
        "duplicate_row": lambda r: r,
    }
    return tables, key, dirty_kinds, "production"


def agriculture(rng, n):
    crops = [("Wheat", 2100), ("Rice", 2300), ("Soybean", 4300), ("Onion", 1200), ("Tomato", 900)]
    villages = ["Kanher", "Lonavla", "Otur", "Baramati"]
    farmers = [[i + 1, f"Farmer {i + 1:03d}", rng.choice(villages), rng.randint(1, 12) / 2,
                rng.choice([c[0] for c in crops])] for i in range(max(30, n // 4))]
    harvests = []
    for i in range(n):
        f = rng.choice(farmers)
        crop = rng.choice(crops)
        quintal = rng.randint(5, 60)
        price = int(crop[1] * rng.uniform(0.85, 1.2))
        harvests.append([i + 1, f[0], crop[0], rng.choice(["kharif", "rabi"]), quintal,
                         rng.choice(["Pune APMC", "Nashik APMC", "Solapur APMC"]), price,
                         rand_date(rng).isoformat()])
    tables = {
        "farmers": (["farmer_id", "name", "village", "land_acres", "main_crop"], farmers),
        "harvests": (["harvest_id", "farmer_id", "crop", "season", "quintal", "mandi", "price_per_quintal", "sold_on"], harvests),
    }
    revenue = {}
    qty = {}
    for h in harvests:
        revenue[h[2]] = revenue.get(h[2], 0) + h[4] * h[6]
        qty[h[2]] = qty.get(h[2], 0) + h[4]
    key = {
        "total_quintals": sum(h[4] for h in harvests),
        "total_revenue": sum(h[4] * h[6] for h in harvests),
        "revenue_by_crop": dict(sorted(revenue.items())),
        "avg_price_by_crop": {c: round(revenue[c] / qty[c], 1) for c in sorted(qty)},
    }
    dirty_kinds = {
        "price_text": lambda r: [*r[:6], f"₹ {r[6]:,}", r[7]],
        "crop_spelling": lambda r: [r[0], r[1], r[2].lower() + " ", *r[3:]],
        "quintal_blank": lambda r: [*r[:4], "", *r[5:]],
        "bad_date": lambda r: [*r[:7], "2026-02-30"],
        "duplicate_row": lambda r: r,
    }
    return tables, key, dirty_kinds, "harvests"


def telecom(rng, n):
    plans = ["Basic 1GB", "Standard 2GB", "Unlimited"]
    subs = []
    for i in range(max(40, n // 4)):
        status = "churned" if rng.random() < 0.15 else "active"
        subs.append([i + 1, f"Subscriber {i + 1:03d}", rng.choice(["Pune", "Nashik", "Solapur", "Mumbai"]),
                     rng.choice(plans), rand_date(rng, date(2024, 1, 1), 900).isoformat(), status])
    bills = []
    for i in range(n):
        s = rng.choice(subs)
        gb = round(rng.uniform(0.5, 30), 1)
        amount = int(120 + gb * 12)
        paid = "" if rng.random() < 0.1 else (START + timedelta(days=rng.randint(0, 30))).isoformat()
        bills.append([i + 1, s[0], rng.choice(["2026-08", "2026-09", "2026-10", "2026-11"]), gb, amount, paid])
    tables = {
        "subscribers": (["sub_id", "name", "city", "plan", "activated_on", "status"], subs),
        "bills": (["bill_id", "sub_id", "month", "data_gb", "amount", "paid_on"], bills),
    }
    churned = [s for s in subs if s[5] == "churned"]
    key = {
        "subscribers": len(subs),
        "churned": len(churned),
        "churn_pct": round(100 * len(churned) / len(subs), 1),
        "total_billed": sum(b[4] for b in bills),
        "unpaid_bills": sum(1 for b in bills if b[5] == ""),
    }
    dirty_kinds = {
        "amount_text": lambda r: [*r[:4], f"Rs {r[4]}", r[5]],
        "amount_blank": lambda r: [*r[:4], "", r[5]],
        "month_format": lambda r: [*r[:2], "Aug 2026", *r[3:]],
        "amount_negative": lambda r: [*r[:4], -abs(int(r[4])), r[5]],
        "duplicate_row": lambda r: r,
    }
    return tables, key, dirty_kinds, "bills"


def insurance(rng, n):
    types = ["motor", "health", "home"]
    holders = [[i + 1, f"Holder {i + 1:03d}", rng.choice(["Pune", "Nashik", "Solapur"]),
                rng.choice(["18-30", "31-50", "51-70"])] for i in range(max(40, n // 3))]
    claims = []
    for i in range(n):
        h = rng.choice(holders)
        t = rng.choice(types)
        claimed = rng.choice([5000, 12000, 25000, 60000, 150000])
        status = rng.choices(["approved", "rejected", "pending"], weights=[70, 20, 10])[0]
        approved = int(claimed * rng.uniform(0.6, 1.0)) if status == "approved" else 0
        claims.append([i + 1, h[0], t, claimed, approved, status, rand_date(rng).isoformat()])
    tables = {
        "policyholders": (["holder_id", "name", "city", "age_band"], holders),
        "claims": (["claim_id", "holder_id", "policy_type", "claimed_amount", "approved_amount", "status", "filed_on"], claims),
    }
    decided = [c for c in claims if c[5] != "pending"]
    approved = [c for c in claims if c[5] == "approved"]
    key = {
        "total_claims": len(claims),
        "total_claimed": sum(c[3] for c in claims),
        "approval_rate_pct": round(100 * len(approved) / len(decided), 1),
        "pending": sum(1 for c in claims if c[5] == "pending"),
        "settlement_ratio_pct": round(100 * sum(c[4] for c in approved) / sum(c[3] for c in approved), 1),
    }
    dirty_kinds = {
        "status_case": lambda r: [*r[:5], str(r[5]).capitalize()],
        "amount_text": lambda r: [*r[:3], f"₹{r[3]:,}", *r[4:]],
        "approved_blank": lambda r: [*r[:4], "", *r[5:]],
        "bad_date": lambda r: [*r[:6], "2026-11-31"],
        "duplicate_row": lambda r: r,
    }
    return tables, key, dirty_kinds, "claims"


def public_sector(rng, n):
    districts = ["Pune", "Nashik", "Solapur", "Satara"]
    ben = [[i + 1, f"Beneficiary {i + 1:03d}", rng.choice(districts), rng.choice(["Group A", "Group B", "Group C"]),
            rand_date(rng, date(2025, 1, 1), 600).isoformat()] for i in range(max(40, n // 3))]
    pays = []
    for i in range(n):
        b = rng.choice(ben)
        status = rng.choices(["paid", "failed"], weights=[92, 8])[0]
        pays.append([i + 1, b[0], rng.choice(["2026-08", "2026-09", "2026-10"]),
                     rng.choice([1000, 1500, 2000]), status])
    tables = {
        "beneficiaries": (["ben_id", "name", "district", "scheme_group", "enrolled_on"], ben),
        "payments": (["pay_id", "ben_id", "month", "amount", "status"], pays),
    }
    failed = [p for p in pays if p[4] == "failed"]
    paid = [p for p in pays if p[4] == "paid"]
    key = {
        "total_payments": len(pays),
        "paid_total": sum(p[3] for p in paid),
        "failed_count": len(failed),
        "failed_rate_pct": round(100 * len(failed) / len(pays), 1),
    }
    dirty_kinds = {
        "status_spelling": lambda r: [*r[:4], "PAID" if r[4] == "paid" else r[4]],
        "amount_blank": lambda r: [*r[:3], "", r[4]],
        "month_format": lambda r: [*r[:2], "Aug-2026", *r[3:]],
        "amount_text": lambda r: [*r[:3], f"Rs {r[3]}", r[4]],
        "duplicate_row": lambda r: r,
    }
    return tables, key, dirty_kinds, "payments"


def real_estate(rng, n):
    localities = ["Koregaon Park", "Baner", "Hadapsar", "Wakad"]
    props = [[i + 1, rng.choice(localities), rng.choice([1, 2, 3]), rng.randint(450, 1800)]
             for i in range(max(40, n // 3))]
    sales = []
    for i in range(n):
        p = rng.choice(props)
        ppsf = rng.randint(7000, 14000)
        price = p[3] * ppsf
        sales.append([i + 1, p[0], rand_date(rng).isoformat(), price, rng.randint(10, 160)])
    tables = {
        "properties": (["prop_id", "locality", "bhk", "area_sqft"], props),
        "sales": (["sale_id", "prop_id", "sold_on", "sale_price", "days_on_market"], sales),
    }
    by_loc = {}
    for s in sales:
        loc = next(p[1] for p in props if p[0] == s[1])
        area = next(p[3] for p in props if p[0] == s[1])
        t, a, d = by_loc.get(loc, (0, 0, []))
        by_loc[loc] = (t + s[3], a + area, d + [s[4]])
    key = {
        "total_sales": len(sales),
        "total_sale_value": sum(s[3] for s in sales),
        "avg_days_on_market_by_locality": {k: round(sum(v[2]) / len(v[2]), 1) for k, v in sorted(by_loc.items())},
        "avg_price_per_sqft_by_locality": {k: round(v[0] / v[1], 1) for k, v in sorted(by_loc.items())},
    }
    dirty_kinds = {
        "price_text": lambda r: [*r[:3], f"Rs {r[3]:,}", r[4]],
        "days_blank": lambda r: [*r[:4], ""],
        "bad_date": lambda r: [*r[:2], "2026-06-31", *r[3:]],
        "price_negative": lambda r: [*r[:3], -abs(int(r[3])), r[4]],
        "duplicate_row": lambda r: r,
    }
    return tables, key, dirty_kinds, "sales"


DOMAINS = {
    "retail": retail, "bfsi": bfsi, "healthcare": healthcare, "education": education,
    "ecommerce": ecommerce, "hr": hr, "logistics": logistics, "manufacturing": manufacturing,
    "agriculture": agriculture, "telecom": telecom, "insurance": insurance,
    "public_sector": public_sector, "real_estate": real_estate,
}


def build(domain: str, size: str, dirty: str, seed: int, out: Path) -> dict:
    rng = random.Random(f"{domain}-{seed}")
    n = SIZE_ROWS[size]
    tables, key, dirty_kinds, main_table = DOMAINS[domain](rng, n)
    folder = out / domain
    # Clean copies (answer-key source)
    for name, (header, rows) in tables.items():
        write_csv(folder / "clean" / f"{name}.csv", header, rows)

    # Dirty copies: plant problems in the main table only, so labs stay focused.
    planted = {}
    rate = DIRTY_RATE[dirty]
    for name, (header, rows) in tables.items():
        if name == main_table and rate > 0:
            kinds = {k: v for k, v in dirty_kinds.items() if k != "duplicate_row"}
            new_rows, counts = plant(rng, rows, rate, kinds)
            dups = max(1, int(len(rows) * rate / 3))
            for _ in range(dups):
                new_rows.append(list(rng.choice(rows)))  # exact duplicate rows
            counts["duplicate_row"] = dups
            planted[name] = counts
            write_csv(folder / f"{name}.csv", header, new_rows)
        else:
            write_csv(folder / f"{name}.csv", header, rows)

    answer = {
        "domain": domain, "size": size, "dirty": dirty, "seed": seed,
        "main_table": main_table, "tables": sorted(tables),
        "answer_key_from_clean_data": key,
        "planted_problems_in_dirty_data": planted,
        "note": "Answer keys are computed from the clean tables. Compare your dirty-data results after cleaning.",
    }
    (folder / "answer_key.json").write_text(json.dumps(answer, indent=2, ensure_ascii=False), encoding="utf-8")
    return answer


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--domain", default="all", choices=[*DOMAINS, "all"])
    ap.add_argument("--size", default="medium", choices=list(SIZE_ROWS))
    ap.add_argument("--dirty", default="some", choices=list(DIRTY_RATE))
    ap.add_argument("--seed", type=int, default=42)
    ap.add_argument("--out", default="generated", type=Path)
    a = ap.parse_args()
    domains = list(DOMAINS) if a.domain == "all" else [a.domain]
    for d in domains:
        res = build(d, a.size, a.dirty, a.seed, a.out)
        print(f"✓ {d}: {', '.join(res['tables'])} -> {a.out / d}")
    print("Done. Start with the labs in practice/LABS.md.")


if __name__ == "__main__":
    main()
