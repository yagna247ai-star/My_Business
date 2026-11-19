# Day 7 — Picking Only the Loans That Need Attention

> **Time:** 4 h 30 min · **Module:** M2 SQL · **Shop:** Ganesh Micro-Credit Co-op

## The problem
The co-op's credit committee wants a list of loans that are:
- Late (the due date has passed, and the loan is not closed).
- Above ₹50,000.
- In the branches of Pune, Nashik or Solapur.

The current list is missing some loans. Some loans have no "closed on" date yet, and the filter quietly skips them.

## The big idea
Filters are like rules in a school canteen queue:
- **AND**: all rules must be true. "I want a samosa AND I have money."
- **OR**: one rule must be true. "I want tea OR coffee."
- **NOT**: flips a rule. "NOT spicy."
- **IN**: a short list. `branch IN ('Pune','Nashik')` means "Pune or Nashik".
- **BETWEEN**: a range, both ends included. `BETWEEN 10 AND 20` includes 10 and 20.

**The trap:** "nothing" is not the same as zero. In SQL, a missing value is called `NULL`. It means "we do not know". You cannot check for it with `= NULL`. You must write `IS NULL`.

## Words to know
- **NULL**: a missing value, shown as "we don't know".
- **Operator**: a word or sign that compares things, like `=`, `>`, or `AND`.

## Let's solve it
```sql
SELECT loan_id, branch, amount, due_date
FROM loans
WHERE closed_on IS NULL                       -- still open (no closing date)
  AND due_date < '2026-11-01'                 -- the due date has passed
  AND amount > 50000                          -- bigger than 50,000
  AND branch IN ('Pune', 'Nashik', 'Solapur');
```

The wrong way looks like this:
```sql
WHERE closed_on = NULL   -- returns nothing, even when many loans are open
```

## Your turn
1. Find loans with an amount from 20,000 to 50,000 (both ends included).
2. Find open loans with a due date before 2026-11-01, in any branch except Solapur.
3. Find branches whose name starts with "S" or "N".
4. In one sentence, explain why `= NULL` gives a wrong answer.

**Hand in:** four queries, how many rows each returns, and your sentence.

## Check yourself (trainer's answer key)
1. Use `BETWEEN 20000 AND 50000`.
2. Use `closed_on IS NULL` plus `branch <> 'Solapur'`.
3. Use `branch LIKE 'S%' OR branch LIKE 'N%'`.
4. Because a missing value is not equal to anything, even another missing value. So `= NULL` is never true.

**Quick test:** With `AND`, fewer rows come back than with `OR`, because more rules must be true at once.

## Why this helps your job
Handling missing values wrongly is a top reason reports are wrong. Interviewers test this often.
