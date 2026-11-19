# Day 18 — Opening Tables in Python With pandas

> **Time:** 4 h 30 min · **Module:** M4 Python for Data · **Shop:** Sunita Stores and Pinnacle Tools

## The problem
Sunita's two branches each send a sales file. The North branch sends a CSV. The South branch sends an Excel file, with the data on a sheet called "Sales". Sunita wants one table with both branches in it.

Pinnacle Tools' HR file has a title in the first row. That confuses a normal file reader.

## The big idea
**pandas** is a Python toolbox for tables. Its main table is called a **DataFrame**. Think of it as a spreadsheet inside Python.

- A **Series** is one column.
- A **DataFrame** is many columns, lined up by row.
- `read_csv` opens a CSV file.
- `read_excel` opens an Excel file. You can tell it which sheet to use, and how many top rows to skip.
- `concat` stacks two tables, one on top of the other.

**Tip:** Add a `branch` column before stacking, so you always know which branch each row came from.

## Words to know
- **DataFrame**: a table in Python.
- **Series**: one column of a table.
- **Concatenate (concat)**: join tables top to bottom.
- **Header**: the row with the column names.

## Let's solve it
```python
import pandas as pd                       # bring in pandas, called "pd" for short

north = pd.read_csv("sales_north.csv")
south = pd.read_excel("sales_south.xlsx", sheet_name="Sales", skiprows=2)  # skip 2 title rows

north["branch"] = "North"                 # label every North row
south["branch"] = "South"

sales = pd.concat([north, south], ignore_index=True)   # stack them, number rows again
print(sales.shape)                        # (rows, columns)
print(sales.columns.tolist())             # the column names
```

If `skiprows` is wrong, the column names turn into "Unnamed". Always look at the first five rows before you load the whole file.

## Your turn
1. Make two small sales files: one CSV, one Excel. In the Excel file, put a title in row 1 and leave row 2 empty.
2. Load both files correctly, and add a `branch` column to each.
3. Stack them. Print the number of rows and the column names.
4. Load the Pinnacle Tools staff file. Print its first five rows.

**Hand in:** the program, its output, and a note on which options you needed.

## Check yourself (trainer's answer key)
1. A Series is one column. A DataFrame is a whole table.
2. Adding `branch` first lets you tell the rows apart after stacking.
3. `ignore_index=True` gives the rows new numbers from 0, so there are no repeats.

**Check:** The total row count after stacking equals the two files' counts added together.

## Why this helps your job
Loading and combining files from different places is usually the first job on a real analytics task.
