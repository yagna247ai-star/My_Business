# Day 10 — Building a Report in Steps

> **Time:** 4 h 30 min · **Module:** M2 SQL · **Shop:** Ravi Textiles

## The problem
Ravi Textiles' owner wants one monthly report with three parts:
1. Revenue for each month.
2. How many orders are small, medium, or large.
3. The customers who spent more than an average customer.

The accountant has to read it, so it must be easy to follow.

## The big idea
Big problems are easier when you solve them in small named steps. It is like a cricket scoreboard: first you count runs per over, then you add the overs.

- **CTE** (called `WITH`): a named step. You can check each step on its own.
- **Subquery**: a question inside another question. "Find the average, then find who beats it."
- **CASE WHEN**: an if-then sorting rule. "If the order is under 5,000, it is small."
- **UNION ALL**: stacks two small result tables, one under the other.

**Always add an ELSE** in CASE WHEN. Otherwise, anything that matches no rule becomes blank.

## Words to know
- **Step**: one named part of a bigger query.
- **Band**: a group of values, like "small", "medium", "large".
- **Average**: total divided by how many there are.

## Let's solve it
Sort orders into bands, one step at a time:

```sql
WITH order_bands AS (                    -- step 1: name each order's size
  SELECT order_id, amount,
         CASE WHEN amount < 5000  THEN 'Small'
              WHEN amount <= 20000 THEN 'Medium'
              ELSE 'Large' END AS band   -- ELSE catches everything else
  FROM sales_orders
)
SELECT band, COUNT(*) AS orders          -- step 2: count each band
FROM order_bands
GROUP BY band;
```

Customers who spent more than average:
```sql
SELECT c.name, a.total_spend
FROM (SELECT customer_id, SUM(amount) AS total_spend
      FROM sales_orders GROUP BY customer_id) a   -- each customer's total
JOIN customers c ON c.customer_id = a.customer_id
WHERE a.total_spend > (SELECT AVG(total_spend)     -- the subquery: the average
                       FROM (SELECT SUM(amount) AS total_spend
                             FROM sales_orders GROUP BY customer_id));
```

## Your turn
1. Count the orders in each size band.
2. Find customers whose total spend is above the average customer's spend.
3. Work out monthly revenue, then find the month with the highest revenue.
4. Use UNION ALL to stack two results: "small orders" and "large orders", with two columns: `metric` and `value`.

**Hand in:** four queries and one paragraph for the accountant about what the report shows.

## Check yourself (trainer's answer key)
1. The three band counts should add up to the total number of orders. Use that as a check.
2. The average is one number. The list of customers is shorter than the full customer list.
3. The top month is the one with the biggest total.
4. UNION ALL gives exactly two rows.

**Quick test:** What happens to a CASE WHEN with no ELSE, when no rule matches? (It returns blank, NULL.)

## Why this helps your job
Named steps and CASE WHEN show up in almost every analyst test. They also make your work easy for others to check.
