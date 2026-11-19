# Day 21 — Sorting, Grouping, and Joining Sales Data

> **Time:** 4 h 30 min · **Module:** M4 Python for Data · **Shop:** Ravi Textiles

## The problem
Ravi Textiles' owner wants sales by region and by customer type (retail, wholesale, online). The sales table does not say the customer type. That is in a separate customer table. The owner also wants the top 10 customers for the last three months.

## The big idea
Four moves solve most data problems:
- **Filter**: keep only some rows. "Only the last three months."
- **Sort**: put rows in order. "Biggest first."
- **Group**: make piles and add each pile up. "Total per region."
- **Merge**: match two tables by a shared key. "Match each sale to its customer's type."

**Merge is like matching a class list to a bus list by roll number.** Check the number of rows before and after. A good merge keeps the same count when each key appears once in the customer table.

## Words to know
- **Merge**: join two tables on a shared column.
- **Key**: the shared column, like `customer_id`.
- **Group**: rows that share the same value.

## Let's solve it
```python
merged = pd.merge(sales, customers, on="customer_id", how="left")  # match each sale to its customer

print(len(sales), len(merged))           # counts should match: a check

last_3 = merged[merged["order_date"].between("2026-09-01", "2026-11-30")]   # last 3 months

by_region = (last_3.groupby(["region", "segment"], as_index=False)["amount"]   # one pile per region+segment
               .sum()                                                          # add each pile up
               .sort_values("amount", ascending=False))                       # biggest first

top10 = (last_3.groupby(["customer_id", "name"], as_index=False)["amount"]
           .sum()
           .nlargest(10, "amount"))              # the 10 biggest customers
```

**Watch for a sneaky bug:** If the customer table has the same customer twice, the merge makes extra rows. The count goes up. Check the count every time.

## Your turn
1. Merge sales with customers. Print the number of rows before and after.
2. Filter to the last three months. Total the revenue for each region and segment.
3. List the top 10 customers by revenue.
4. Stack two months of sales. Check that the row count is the two counts added together.

**Hand in:** the program, the region table, the top 10 list, and the row-count check for each merge.

## Check yourself (trainer's answer key)
1. If the row count goes up after a merge, a key is repeated in the customer table.
2. A left merge keeps every sale, even if no customer matches.
3. `as_index=False` keeps the group names as normal columns, which is easier to read.

**Check:** The totals by region and segment add up to the total revenue for the period.

## Why this helps your job
Grouping and merging make up most analysis work. Interviewers often ask how you check a merge for duplicates.
