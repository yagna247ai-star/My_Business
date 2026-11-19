# M4 — Python for Data Analytics · Days 17–22

| | |
|---|---|
| Parent | `../00-INDEX.md` |
| Duration | 6 days (PDF Days 17–22) |
| MSMEs | Sunita Stores (sales), Bright Smile Dental Clinic (patient profiling, missing values), Ravi Textiles (customer analysis), Pinnacle Tools (employee cleaning) |
| Tools | Python, pandas, NumPy, Jupyter notebook or script |

## Objective
Load, inspect, clean, reshape and explore a business dataset with NumPy and pandas, and state what the cleaned data can and cannot tell the owner.

## Learning outcomes
- Use NumPy arrays for numerical calculations.
- Read CSV and Excel files into pandas DataFrames and profile them (`head`, `info`, `describe`, `shape`, `dtypes`).
- Clean missing values, duplicates, wrong types and inconsistent labels, and record each change.
- Filter, sort, group, merge, join and concatenate tables.
- Work with dates and strings, and run a basic exploratory data analysis (EDA) that ends in a short written insight.

## Day plan
| Day | Artifact | MSME problem | Concept |
|---|---|---|---|
| 17 | [D17](../days/D17-numpy.md) | Sunita Stores computes margin per product across a price array | NumPy |
| 18 | [D18](../days/D18-pandas-reading-files.md) | Load employee and sales files from two branches | pandas, Series, DataFrame, read_csv, read_excel |
| 19 | [D19](../days/D19-data-inspection.md) | Bright Smile profiles a 500-row patient extract | Inspection and profiling |
| 20 | [D20](../days/D20-data-cleaning.md) | Pinnacle Tools cleans an employee file with bad salary strings and duplicate IDs | Cleaning and standardisation |
| 21 | [D21](../days/D21-manipulation-groupby-merge.md) | Ravi Textiles compares sales by region and joins customer segments | Filter, sort, groupby, merge, concat |
| 22 | [D22](../days/D22-dates-strings-eda.md) | Sunita Stores full EDA on a 12-month sales file | Dates, strings, aggregation, EDA |

## Checkpoint (Python assessment, part of the 20% SQL and Python block)
After Day 22: a notebook or script that takes a raw messy file, cleans it, and produces three tables and a one-paragraph insight. Graded with the shared rubric, plus a check that the learner logs every cleaning step.

## Job link
Python Data Analyst (Trainee) and Data Quality Analyst (Trainee). The Day 20 cleaning log is a strong portfolio item.

## Rubric notes
Data checks (0.10) gets extra weight in this module. A cleaning step without a stated reason loses marks even when the output is correct.
