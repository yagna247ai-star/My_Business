# Day 4 — Spreadsheets That Count: Excel and CSV

> **Time:** 4 h 30 min · **Module:** M1 Fundamentals · **Shop:** Little Scholars Tuition Centre

## The problem
Little Scholars' owner, Arjun (a made-up name), keeps school fees in one Excel file. Attendance is in a paper register. Test marks are in a WhatsApp group. Arjun wants one file that shows which students fall behind on both marks and fees.

## The big idea
A spreadsheet is good to look at. But a computer can only count a spreadsheet that follows some simple rules.

A **CSV** file is the simplest kind. It is plain text. Each line is one record. Each comma separates one column.

Think of a school roll call sheet: one name per line, with columns for class, date, and present or absent.

## Words to know
- **Spreadsheet**: a grid of cells, like a big table.
- **CSV**: a plain text file where commas split the columns. It opens in any app.
- **Header**: the first row that names each column.
- **Record**: one row, about one thing (one student, one fee).

## Let's solve it
Arjun's fee sheet has problems. A computer cannot count it yet:
1. A **total row** at the bottom. This looks like a student, so it will be counted as one.
2. A **merged title** cell across the top. This shifts the header.
3. The "Paid?" column has "Yes", "yes", "Y", and "1". The computer sees four different answers.

The fix:
- Keep one header row.
- One record per row.
- One value per cell, with the same spelling every time.
- No totals inside the data. Put totals in a separate place.

The clean CSV starts like this:
```text
student_id,term,fee_due,fee_paid,paid_on
S-101,Term 1,5000,5000,2026-06-03
S-102,Term 1,5000,3000,
```

## Your turn
1. Make a small fee sheet with 10 students (Excel or Google Sheets).
2. Save it as a CSV. Open the CSV in Notepad. What changed?
3. Find three problems that would break a count.
4. Write one question for each of these: a bank, a clinic, a school, a shop, and an online store.

**Hand in:** the CSV file, three problems, and five questions.

## Check yourself (trainer's answer key)
1. A total row looks like a student, so it gets counted by mistake.
2. Excel keeps the look (colours, formulas). A CSV keeps only the numbers and words.
3. Fix "Yes/Y/1" by picking one spelling, such as "Yes", and using it every time.

**Answer key note:** Typical questions: bank ("Which borrowers missed two repayments?"), clinic ("How long do surgery patients stay?"), school ("Which students came to under 75% of classes?"), shop ("Which branch sold the most of product X?"), online store ("Who ordered in March but not in April?").

## Why this helps your job
Most real data arrives as a messy Excel file. Cleaning it into a CSV is one of the first jobs you will do.
