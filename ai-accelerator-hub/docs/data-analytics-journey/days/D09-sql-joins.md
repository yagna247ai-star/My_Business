# Day 9 — Matching Two Lists Together

> **Time:** 4 h 30 min · **Module:** M2 SQL · **Shop:** Bright Smile Dental Clinic

## The problem
The clinic manager, Divya (a made-up name), wants two lists:
1. Patients who came once in September and never came back.
2. Treatments that nobody booked this quarter. The clinic should stop advertising them.

The patient list and the visit list are in two different tables. Divya needs to match them.

## The big idea
A **join** matches rows from two tables using a shared number. Think of matching a class list with a bus list using the student's roll number.

There are four ways to join:
- **INNER JOIN**: only the rows that match on both sides. Like students who are on both lists.
- **LEFT JOIN**: all rows from the left list, even if nothing matches on the right. Non-matches get a blank (NULL).
- **RIGHT JOIN**: all rows from the right list. Most people write a LEFT JOIN with the tables swapped, because it is easier to read.
- **FULL OUTER JOIN**: all rows from both lists, matched where possible.

**Finding who is missing:** Do a LEFT JOIN, then keep only the rows where the right side is blank (NULL). This finds things that have no match.

## Words to know
- **Join**: combining two tables by matching a shared number.
- **Match**: two rows that share the same key.
- **Blank (NULL)**: no match was found on that side.

## Let's solve it
Find patients who never came back after their first visit:

```sql
SELECT p.patient_id, p.name, p.first_visit
FROM patients p
LEFT JOIN visits v                     -- keep every patient
  ON v.patient_id = p.patient_id       -- match on patient number
 AND v.visit_date > p.first_visit      -- only visits after the first one
WHERE v.visit_id IS NULL;              -- no matching visit found
```

If you used `INNER JOIN` instead, you would get the patients who did come back. That is the opposite answer. Check which join matches the question.

## Your turn
1. List every patient, with the number of visits each one has (include zero).
2. Find patients who had only their first visit.
3. Find treatments that appear in the treatment list but never in the visits.
4. In two sentences, explain why INNER JOIN and LEFT JOIN give different numbers of rows.

**Hand in:** four queries, the row counts, and your two sentences.

## Check yourself (trainer's answer key)
1. A LEFT JOIN keeps patients with zero visits.
2. The "no matching visit" check finds them.
3. Use a LEFT JOIN from treatments to visits, then keep the rows where the visit is blank.
4. INNER JOIN drops the rows with no match. LEFT JOIN keeps them, with a blank on the other side.

**Quick test:** Why does putting `v.visit_date > p.first_visit` in `WHERE` instead of `ON` give a different answer? (Hint: `WHERE` removes the blank rows that LEFT JOIN kept.)

## Why this helps your job
Finding records that are missing from another table is a core data-quality skill. You will use it again on Day 41.
