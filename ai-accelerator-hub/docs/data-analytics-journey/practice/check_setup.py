#!/usr/bin/env python3
"""
Setup check for the practice environment. Run it first, on Windows or Mac:

    python check_setup.py        (Windows: py check_setup.py)

It checks, one line each: Python version, SQLite, the datasets, optional pandas,
and then runs one SQL query and one Python check, so you know the whole chain works.
Standard library only. Nothing is installed or changed.
"""
import csv
import sqlite3
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
DATA = HERE / "generated" / "retail" / "clean"
results = []


def report(name: str, ok: bool, detail: str = "") -> None:
    results.append(ok)
    print(f"[{'PASS' if ok else 'FAIL'}] {name}" + (f"  — {detail}" if detail else ""))


def main() -> int:
    v = sys.version_info
    report("Python 3.10 or newer", v >= (3, 10), f"you have {v.major}.{v.minor}.{v.micro}")

    try:
        report("SQLite works", True, f"version {sqlite3.sqlite_version}")
    except Exception as e:  # noqa: BLE001
        report("SQLite works", False, str(e))

    report("Practice datasets found", (DATA / "products.csv").exists(),
           "run: python generate_datasets.py" if not (DATA / "products.csv").exists() else str(DATA))

    try:
        import pandas  # noqa: F401
        report("pandas installed (optional, needed from Module 4)", True, pandas.__version__)
    except ImportError:
        print("[ -- ] pandas not installed yet (optional now). Install from Module 4: pip install pandas")

    # One SQL query on the retail products table
    try:
        con = sqlite3.connect(":memory:")
        rows = list(csv.reader((DATA / "products.csv").open(encoding="utf-8")))
        con.execute("CREATE TABLE products (product_id, name, category, unit_price)")
        con.executemany("INSERT INTO products VALUES (?,?,?,?)", rows[1:])
        top = con.execute("SELECT name FROM products ORDER BY CAST(unit_price AS INT) DESC LIMIT 1").fetchone()
        report("First SQL query runs", top is not None, f"most expensive product: {top[0] if top else 'none'}")
    except Exception as e:  # noqa: BLE001
        report("First SQL query runs", False, str(e))

    # One Python check with the csv module
    try:
        rows = list(csv.DictReader((DATA / "products.csv").open(encoding="utf-8")))
        total = sum(int(r["unit_price"]) for r in rows)
        report("First Python check runs", total > 0, f"{len(rows)} products, sum of prices = {total}")
    except Exception as e:  # noqa: BLE001
        report("First Python check runs", False, str(e))

    print()
    if all(results):
        print("All required checks passed. Start with practice/LABS.md, lab R1.")
        return 0
    print("Some checks failed. Read the line marked FAIL and fix that step, then run again.")
    return 1


if __name__ == "__main__":
    sys.exit(main())
