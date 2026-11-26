# Day 8 — Adding Up Money by Team

> **Time:** 4 h 30 min · **Module:** M2 SQL · **Shop:** Pinnacle Tools

## The problem
Pinnacle Tools' owner is planning next year's budget. The owner wants:
- The total monthly salary for each department.
- The average salary in each department.
- Only the departments with more than three people.

The owner does not want 300 rows. The owner wants a short summary.

## The big idea
Imagine sorting a box of coloured pencils into piles by colour. Then you count each pile and add up its length. That is **GROUP BY**. It makes one pile per group.

Once the piles exist, you can ask:
- **COUNT**: how many in each pile?
- **SUM**: how much in total?
- **AVG**: what is the average?
- **MIN** and **MAX**: smallest and biggest?

**HAVING** is a filter for the piles. It removes whole piles, not single rows. `WHERE` filters rows before the piles form. `HAVING` filters the piles after.

## Words to know
- **Group**: rows that share the same value, like the same department.
- **Aggregate**: a function that combines many rows into one number (COUNT, SUM, AVG).
- **HAVING**: filters groups, after they are formed.

## Let's solve it
```sql
SELECT d.name        AS department,
       COUNT(*)      AS headcount,      -- how many people
       SUM(e.salary) AS total_salary,   -- add up all salaries
       AVG(e.salary) AS avg_salary      -- average salary
FROM employees e
JOIN departments d ON d.dept_id = e.dept_id   -- link to the department name
WHERE e.status = 'active'                     -- count only current workers
GROUP BY d.name                               -- one pile per department
HAVING COUNT(*) > 3                           -- keep only piles with more than 3 people
ORDER BY total_salary DESC;                   -- biggest total first
```

Try moving the `HAVING` line into a `WHERE` line. The database gives an error. A `WHERE` filter runs before the piles are made, so the count does not exist yet.

## Your turn
1. Find the total active salary for each department.
2. Find the headcount, average, and highest salary for each department.
3. Find departments whose average salary is above 30,000.
4. Count the workers who have left (they have a leaving date), in each department.

**Hand in:** four queries, each with one sentence for the owner about what it shows.

## Check yourself (trainer's answer key)
1. The highest salary is always at least the average, and the average is always at least the lowest salary.
2. `COUNT(*)` counts every row. `COUNT(left_on)` counts only rows where a leaving date exists.
3. A missing salary is skipped by `AVG`. It is not counted as zero.

**Answer key note:** Check one department's total by adding its salaries by hand.

## Why this helps your job
Department summaries are the most common report managers ask for. Learn this and you can answer most of them.
