# Day 39 — Translating Two Languages Into One

> **Time:** 4 h 30 min · **Module:** M8 ETL and Data Quality · **Shop:** Sunita Stores

## The problem
Sunita's North branch exports its sales with the columns `Bill No`, `Dt`, `Item Name`, and `Amt (Rs)`. The South branch uses `invoice_id`, `date`, `product`, and `amount`. The owner wants one table in one shared format. Test bills, marked "TEST", must be removed. Each product needs its category.

## The big idea
Two branches speak two languages. **Transformation** is the translator. You do four things:
1. **Map**: write down that "Bill No" means "order_id", and "Dt" means "order_date".
2. **Convert**: change "Rs 1,200" into the number 1200.
3. **Filter**: remove rows you do not want, like TEST bills.
4. **Join**: add the category from a second table, by matching the product name.

**Do the translation before joining.** If you join first, you may match the wrong columns.

**Count what you remove.** A silent removal hides problems.

## Words to know
- **Mapping**: a list that says which old name means which new name.
- **Conversion**: changing a value's type, like text to number.
- **Filter**: keeping only some rows.
- **Left join**: keep every row from the main table, even if no category matches.

## Let's solve it
```python
MAP = {
    "north": {"Bill No": "order_id", "Dt": "order_date", "Item Name": "product", "Amt (Rs)": "amount"},
    "south": {"invoice_id": "order_id", "date": "order_date", "product": "product", "amount": "amount"},
}

def to_standard(df, source):
    out = df.rename(columns=MAP[source])[["order_id", "order_date", "product", "amount"]].copy()
    out["branch"] = source.title()                                  # North or South
    out["order_date"] = pd.to_datetime(out["order_date"], dayfirst=True, errors="coerce")
    out["amount"] = pd.to_numeric(                                  # "Rs 1,200" -> 1200
        out["amount"].astype(str).str.replace(r"[^\d.]", "", regex=True), errors="coerce")
    return out

std = pd.concat([to_standard(north, "north"), to_standard(south, "south")], ignore_index=True)
std = std[~std["order_id"].astype(str).str.upper().str.contains("TEST")]   # remove TEST bills
std = std.merge(categories, on="product", how="left")                       # add the category
```

If a product is not in the categories table, its category is blank. That is fine, but you must count and list those products.

## Your turn
1. Write the mapping for both branch files.
2. Convert the dates and amounts. Count the values that failed.
3. Remove TEST bills. Log how many you removed.
4. Add the categories. List the products that have no category.
5. Make a daily table of revenue by branch and category.

**Hand in:** your program, a log with a count for each step, the list of products with no category, and the daily table.

## Check yourself (trainer's answer key)
1. Map first, so both branches have the same column names before you combine them.
2. A left join keeps every sale. An inner join would silently drop sales with no category.
3. A check: the total of the daily table must equal the total of the cleaned table.

**Expected:** Both branches have the same columns. Failed conversions are counted. TEST bills are removed and counted.

## Why this helps your job
Mapping columns and checking totals after a transformation is the core of a data pipeline.
