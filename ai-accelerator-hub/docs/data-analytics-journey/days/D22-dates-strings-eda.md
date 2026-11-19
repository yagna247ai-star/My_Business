# Day 22 — Telling the Story of a Year of Sales

> **Time:** 4 h 30 min · **Module:** M4 Python for Data · **Shop:** Sunita Stores

## The problem
Sunita has 12 months of sales for two branches. Sunita asks four questions:
1. Which months were strongest?
2. Do some weekdays sell more?
3. Which product categories are growing?
4. Is anything strange in the data?

Sunita wants a short note with three clear points. Not a spreadsheet.

## The big idea
**Exploratory data analysis (EDA)** means looking at data from many angles before deciding what it says. It is like a detective walking around a crime scene. You look at:
- **Shape**: how are the numbers spread out?
- **Trend**: do they go up or down over time?
- **Comparison**: which group is bigger?
- **Surprises**: what looks odd?

**Outliers** are values far away from the rest. A ₹2,00,000 bill in a shop where most bills are ₹500 is an outlier. It might be real (a bulk order), or a typing error. Do not delete it until you know why it is there.

## Words to know
- **Date parsing**: turning text like "03-11-2026" into a real date.
- **Outlier**: a value far outside the normal range.
- **Trend**: a pattern over time.

## Let's solve it
```python
sales["order_date"] = pd.to_datetime(sales["order_date"], dayfirst=True, errors="coerce")
# dayfirst=True: "03-11-2026" means 3 November. errors="coerce": bad dates become blank.

sales["month"] = sales["order_date"].dt.to_period("M")     # e.g. 2026-11
sales["weekday"] = sales["order_date"].dt.day_name()        # e.g. Monday

monthly = sales.groupby("month", as_index=False)["amount"].sum()
weekday = sales.groupby("weekday")["amount"].mean().sort_values(ascending=False)

# Find outliers: values far from the middle
q1, q3 = sales["amount"].quantile([0.25, 0.75])
iqr = q3 - q1                                   # the middle half's width
outliers = sales[(sales["amount"] < q1 - 1.5 * iqr) | (sales["amount"] > q3 + 1.5 * iqr)]
print(len(outliers), "possible outliers")
```

**Watch out for dates.** "03/11/2026" can mean 3 November or 11 March. `dayfirst=True` picks one. Choosing wrongly moves sales to the wrong month.

## Your turn
1. Convert the dates. Count how many failed. Explain why they failed.
2. Build the monthly revenue table. Name the strongest and weakest month.
3. Compare the average sale for each weekday.
4. Find category names that differ only in capitals or spaces. Clean them.
5. Find outliers. For each one, say whether it looks real or like a typing error.
6. Write three insights for the owner. Each insight needs a number and one limit of the data.

**Hand in:** your program and a one-page note with the three insights.

## Check yourself (trainer's answer key)
1. `dayfirst=True` reads "03-11-2026" as 3 November.
2. Do not delete outliers automatically. Check each one first.
3. Example of a limit: "Only 12 months of data, so a seasonal pattern cannot be proven."

**Check:** Every insight has a number from your table and a limit you can name.

## Why this helps your job
A short, honest note with numbers and limits is the usual analyst test. Practise it now.

## Checkpoint
Day 22's notebook and Day 20's cleaning log make up your Module 4 checkpoint.
