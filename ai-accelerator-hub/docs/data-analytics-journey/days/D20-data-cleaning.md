# Day 20 — Cleaning a Messy Staff List

> **Time:** 4 h 30 min · **Module:** M4 Python for Data · **Shop:** Pinnacle Tools

## The problem
Pinnacle's HR file has problems:
- Salaries are written as "₹ 32,000", "32k", and "32000". A computer sees three different things.
- The same worker appears twice, with two spellings of the department.
- Departments are written as "Machining", "machining ", and "MACHINING".
- Some joining dates are blank.

The HR head needs a clean file to count workers and average pay.

## The big idea
Cleaning is like tidying a room before a visitor comes. Do it in a fixed order, and write down what you did.

1. **Standardise the text**: remove extra spaces, make the spelling the same.
2. **Convert the types**: change text like "32k" into the number 32000.
3. **Handle blanks**: decide to fill, drop, or flag each one.
4. **Remove repeats**: keep one copy of each worker.
5. **Write a log**: for each step, write how many rows changed.

**Never clean silently.** If you change data and do not write it down, nobody can check your work.

## Words to know
- **Standardise**: make values look the same way.
- **Convert**: change from one type to another.
- **Duplicate**: the same record more than once.
- **Log**: a written record of each step.

## Let's solve it
```python
import pandas as pd

emp = pd.read_csv("pinnacle_employees.csv")
log = []                                              # our written record

emp["dept"] = emp["dept"].str.strip().str.title()    # remove spaces, one spelling
log.append(("standardise dept", len(emp)))

emp["salary"] = (emp["salary"].astype(str)
                 .str.replace(r"[₹,\s]", "", regex=True)   # remove ₹, commas, spaces
                 .str.replace("k", "000", regex=False))    # "32k" -> "32000"
emp["salary"] = pd.to_numeric(emp["salary"], errors="coerce")  # text -> number, bad -> blank
log.append(("salary to number", emp["salary"].isna().sum()))

before = len(emp)
emp = emp.drop_duplicates(subset=["emp_id"], keep="last")      # keep the newest copy
log.append(("duplicates removed", before - len(emp)))
print(log)
```

`errors="coerce"` means "if it cannot be converted, make it blank". Count those blanks. Never hide them.

## Your turn
Clean `pinnacle_employees.csv`. It has about 15 planted problems.
1. Standardise the department names.
2. Turn salaries into numbers. Count how many could not be converted, and list them.
3. Remove repeated employee IDs. Keep the most recent row.
4. Fill blank departments with "Unassigned". Add a new column that marks blank joining dates.
5. Save the cleaned file and the log: step, what you did, rows changed.

**Hand in:** the script, the cleaned CSV, and the log.

## Check yourself (trainer's answer key)
1. Clean the text first, so that "Machining" and "machining " become the same before you look for repeats.
2. `errors="coerce"` makes bad values blank. The risk is that you lose them silently, so count them.
3. Drop a row only when the missing value makes the row useless. Fill it when a default is safe.

**Check:** Rows after cleaning equal the rows before, minus the duplicates you removed.

## Why this helps your job
Cleaning with a log is one of the strongest items in a junior analyst's portfolio. It shows care and proof.
