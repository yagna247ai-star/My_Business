# Day 19 — Looking Before You Touch: Checking a New Table

> **Time:** 4 h 30 min · **Module:** M4 Python for Data · **Shop:** Bright Smile Dental Clinic

## The problem
The clinic manager sent a file with 500 patient visits. Before any analysis, the team must know:
- How many rows and columns there are.
- What type each column is.
- Where values are missing.
- Whether the numbers look believable.

## The big idea
Before you cook, you look at the ingredients. Before you analyse, you look at the data. This is called **profiling**.

- `shape`: how many rows and columns.
- `head()` and `tail()`: the first and last few rows. Look at both. Problems often hide at the bottom.
- `info()`: the type of each column, and how many values are filled in.
- `describe()`: the smallest, biggest, and average value for number columns.
- `dtypes`: the type of each column.

**Warning sign:** a number column that Python thinks is text. The usual cause is a comma or a currency sign inside the number.

## Words to know
- **Profiling**: a first look at data to see its shape and problems.
- **Missing value**: a blank that should have a value.
- **Type**: what kind of value a column holds.

## Let's solve it
```python
import pandas as pd

visits = pd.read_csv("bright_smile_visits.csv")
print(visits.shape)                 # rows and columns
print(visits.dtypes)                # type of each column
print(visits.info())                # types and filled-in counts
print(visits.describe(include="all"))   # summary of every column
print(visits.isna().sum())          # how many blanks in each column
```

In this data, `fee` may show as text. One row might say "4,500" with a comma. A computer cannot add that. `describe()` alone would not show this clearly.

## Your turn
Profile the patient file:
1. Write down the number of rows, the column names, and each column's type.
2. Count the blanks in each column. Which column has the most?
3. Find any number column stored as text. Say why.
4. Find the earliest and latest visit dates. Are any in the future, or before the clinic opened in 2018?

**Hand in:** a one-page profile with these four answers and a table: column, type, number of blanks.

## Check yourself (trainer's answer key)
1. `tail()` shows problems that `head()` does not, like rows added at the end.
2. A lower count in `info()` means blanks in that column.
3. `describe()` gives a number summary. For text, it does not tell you whether a number column is stored wrongly.

**Check:** Every number in your profile should match what you see in the file.

## Why this helps your job
Data quality work always starts with a profile like this one. Keep yours as a template.
