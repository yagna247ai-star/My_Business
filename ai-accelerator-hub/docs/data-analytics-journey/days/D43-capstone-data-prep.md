# Day 43 — Getting Your Data Ready Before You Analyse It

> **Time:** 4 h 30 min · **Module:** M9 Capstone · **Shop:** Your chosen capstone

## The problem
Your question from Day 42 needs data. The raw data has the same problems you have already fixed in earlier days: mixed date formats, repeated rows, blank values, and numbers stored as text.

Before you analyse anything, the data must be clean, and you must be able to show how you cleaned it.

## The big idea
Prepare the data in three moves, like cooking:
1. **Pick only what you need in the database** (SQL). Choose the rows and columns first. Less data means less mess.
2. **Clean it in Python**, in a fixed order, and count each change. (You did this on Day 20.)
3. **Freeze it**. Save one final file, with a version number, and only analyse that file. If you keep changing the raw data, your answers will change too.

Write a **data dictionary**: a list of each column, what it means, its type, and where it came from. It is like the label on a jam jar.

## Words to know
- **Freeze**: save a final version that never changes.
- **Data dictionary**: a list that explains each column.
- **Version**: a number that tells you which copy you are looking at.

## Let's solve it
Example for the retail capstone. First, pick the data in SQL:
```sql
SELECT o.order_id, o.order_date, o.branch, o.product_id, o.qty, o.amount,
       p.name, p.category
FROM sales_orders o
JOIN products p ON p.product_id = o.product_id
WHERE o.order_date BETWEEN '2026-10-01' AND '2026-12-31';   -- only the quarter we need
```

Then clean it in Python, and freeze it:
```python
raw = pd.read_csv("capstone_extract.csv")
clean = raw.drop_duplicates("order_id")                          # one row per order
clean["amount"] = pd.to_numeric(clean["amount"], errors="coerce")  # text to numbers
clean = clean.dropna(subset=["amount"])                          # drop rows with no amount
clean.to_csv("analysis_v1.csv", index=False)                     # the frozen file
```

Write down the number of rows before and after each line. That is your log.

## Your turn
1. Write at least two SQL queries that pull the data you need.
2. Clean it in Python with at least five steps. Log the row count after each one.
3. Make at least two new columns that your analysis needs. Example: `month`, or `size_band`.
4. Save `analysis_v1.csv` and the data dictionary.
5. Check that the final row count matches the log.

**Hand in:** the SQL file, the Python script, the log, the frozen file, and the data dictionary.

## Check yourself (trainer's answer key)
1. Filtering in SQL first makes the Python work faster and easier to check.
2. Analyse only the frozen file, so your answers stay the same if the raw data changes.
3. Name the step you would most want the owner to know about, and why.

**Expected:** The final row count matches the log. Every column in the file is in the dictionary.

## Why this helps your job
A frozen, documented dataset is what makes your work repeatable. Employers check for this.
