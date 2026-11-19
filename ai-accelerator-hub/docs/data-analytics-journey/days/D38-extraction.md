# Day 38 — Collecting Parcels From Four Different Places

> **Time:** 4 h 30 min · **Module:** M8 ETL and Data Quality · **Shop:** Bright Smile Dental Clinic

## The problem
Bright Smile wants one table. Each row should show an appointment, its bill, and whether a reminder was sent. But the data lives in four places:
- Appointments: a CSV file.
- Bills: an Excel workbook.
- Patient status: a database.
- Reminders: a web service that sends back data as JSON (a structured text format).

## The big idea
**Extraction** means collecting data from each place without changing it. Write one small function per source. Each function does three things:
1. Opens the source, but never writes to it.
2. Adds a tag: where it came from, and when.
3. Writes down how many rows it read.

**Reading is safe. Writing to the source is not.** Your extract must never change the original.

**A web service** can be down. Check the answer code. If it is an error, log it, and keep the other sources.

## Words to know
- **Extract**: copy data from a source, without changing it.
- **JSON**: a text format with labels, used by web services.
- **Status code**: a number a web service sends back. 200 means "OK".
- **Tag**: a label you add to each row, such as its source.

## Let's solve it
```python
import pandas as pd, sqlite3, requests
from datetime import datetime, timezone

def tag(df, source):                       # add the source and time to every row
    df["source"] = source
    df["extracted_at"] = datetime.now(timezone.utc).isoformat()
    print(f"{source}: {len(df)} rows")     # log how many rows we read
    return df

appts = tag(pd.read_csv("appointments.csv"), "csv:appointments")
bills = tag(pd.read_excel("billing.xlsx", sheet_name="Bills"), "xlsx:billing")

with sqlite3.connect("clinic.db") as conn:              # reading only
    patients = tag(pd.read_sql("SELECT patient_id, status FROM patients", conn), "db:patients")

resp = requests.get("https://example.com/sample-reminders.json", timeout=10)
resp.raise_for_status()                                  # error if the service failed
reminders = tag(pd.json_normalize(resp.json()), "api:reminders")
```

## Your turn
1. Write four extract functions: CSV, Excel, database, and a JSON file (use a sample file in place of the web service).
2. Add the source and time tags to each.
3. Print the row count for each source.
4. Break one source on purpose, by typing a wrong file name. Make the program log the error and keep going with the other three.

**Hand in:** the program, the row counts, and the output from the broken-source test.

## Check yourself (trainer's answer key)
1. Limit to the columns and dates you need. Less data is faster, and it is safer.
2. Log the error, then keep the other sources.
3. The time tag shows when the data was collected, which matters if it changes later.

**Expected:** Each source prints a count. All rows have a tag. The broken test logs one error and still loads the rest.

## Why this helps your job
Testers and engineers check that data is read safely from each source. This is the first thing they look at.
