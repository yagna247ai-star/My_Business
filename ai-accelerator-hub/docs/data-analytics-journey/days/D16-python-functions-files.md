# Day 16 — A Checker Robot for Loan Files

> **Time:** 4 h 30 min · **Module:** M3 Python · **Shop:** Ganesh Micro-Credit Co-op

## The problem
Each month, branch staff send a loan file. It is a CSV with one loan per row. Some rows have a missing amount, a date in the wrong format, or a word where a number should be. The program stops at the first bad row. Staff then fix the file by hand.

The co-op wants a program that:
- Checks every row.
- Writes the good rows to one file.
- Writes the bad rows, with the reason, to another file.
- Never stops in the middle.

## The big idea
This program is a **robot** made of three parts:
- **A function**: a small helper that does one job. It takes a row, checks it, and returns the answer. Like a cashier who checks one bill at a time.
- **try and except**: a safety net. If something goes wrong, the program catches it and keeps going, instead of crashing.
- **File handling**: reading the input file and writing two output files.

A **function** is a recipe: `def check_row(row):`. You give it ingredients (`row`). It gives back a result with `return`.

## Words to know
- **Function**: a named set of steps you can run many times.
- **Parameter**: the ingredient you pass into a function.
- **Return**: the result a function gives back.
- **Exception**: an error. `try` and `except` catch it.
- **CSV reader**: a helper that turns each CSV line into a dictionary, so you can use `row["amount"]`.

## Let's solve it
```python
import csv

def check_row(row):
    try:
        amount = float(row["amount"])          # try to turn the text into a number
    except (ValueError, KeyError):             # if it fails, catch the error
        return None, "amount is missing or not a number"
    if amount <= 0:
        return None, "amount must be above zero"
    return {**row, "amount": amount}, None     # good row: return it, no error

good, bad = [], []
with open("loans.csv", newline="", encoding="utf-8") as f:   # open, and close safely
    for row in csv.DictReader(f):              # one row at a time
        clean, error = check_row(row)
        if error:
            bad.append({**row, "reason": error})
        else:
            good.append(clean)

print(f"Good: {len(good)}, bad: {len(bad)}")
```

## Your turn
1. Make a CSV with 12 loan rows. Put 3 bad rows in it: one missing amount, one with a word, one negative.
2. Use `check_row` as above. Add a second check: the date must look like 2026-11-18.
3. Write the good rows to `clean_loans.csv`. Write the bad rows, with the reason, to `rejects.csv`.
4. Print a summary: rows read, good, bad.
5. In two sentences, explain why `try` and `except` is better than letting the program crash.

**Hand in:** your program, the input CSV, both output CSVs, and the summary.

## Check yourself (trainer's answer key)
1. The function returns two things: the cleaned row (or nothing), and the reason (or nothing). Two answers means the caller can handle both.
2. Without the safety net, one bad row stops the whole run.
3. `with open(...)` closes the file for you, even when an error happens.

**Expected:** 12 rows in, 3 bad. The summary says good 9, bad 3.

## Why this helps your job
This program is your first real tool. It reads a file, checks it, and reports what is wrong. It is the checkpoint for Module 3, and it goes into your portfolio.
