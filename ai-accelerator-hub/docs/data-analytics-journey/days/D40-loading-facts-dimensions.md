# Day 40 — Filing Each Order Under the Right Customer, Even After a Move

> **Time:** 4 h 30 min · **Module:** M8 ETL and Data Quality · **Shop:** Ravi Textiles

## The problem
Ravi Textiles loads its orders into a small warehouse every month. The first load copied all the orders again, every time. It now takes too long.

There is a second problem. A customer moved from Pune to Nashik. Old orders must still show Pune. New orders must show Nashik. If the table only stores the latest city, the history is wrong.

## The big idea
Two ideas solve this:

**1. Load only what is new.** An **incremental load** adds only the orders after the last load date. The last date is called a **watermark**. It is like a bookmark in a book: you start reading where you stopped.

**2. Keep history for customers.** A **slowly changing dimension (SCD) Type 2** keeps a new row each time a customer changes. Each row has a start date and an end date. Old orders match the old row. New orders match the new row.

**Full load** copies everything, every time. It is simple but slow.

**Fact** tables hold events and numbers (orders). **Dimension** tables hold descriptions (customers).

**Safe reruns:** If you run the same load twice, it must not add the orders twice.

## Words to know
- **Watermark**: the last date or ID you loaded up to.
- **Fact table**: the table of events and numbers.
- **Dimension table**: the table of descriptions.
- **SCD Type 2**: a dimension that keeps history with start and end dates.
- **Idempotent**: safe to run again, with the same result.

## Let's solve it
```sql
-- The customer moves from Pune to Nashik on 1 November
UPDATE dim_customer
SET valid_to = '2026-10-31', is_current = 0          -- close the old row
WHERE customer_id = 'C-204' AND is_current = 1;

INSERT INTO dim_customer (customer_key, customer_id, city, valid_from, valid_to, is_current)
VALUES (9051, 'C-204', 'Nashik', '2026-11-01', '9999-12-31', 1);   -- open the new row

-- Load only new orders, matched to the customer's city on the order date
INSERT INTO fact_orders (order_id, customer_key, order_date, amount)
SELECT s.order_id, c.customer_key, s.order_date, s.amount
FROM stg_orders s
JOIN dim_customer c ON c.customer_id = s.customer_id
 AND s.order_date BETWEEN c.valid_from AND c.valid_to
WHERE s.order_date > (SELECT MAX(order_date) FROM fact_orders);   -- only after the watermark
```

Now run the last statement a second time. A good load adds zero rows, because the watermark has moved on. To make this safe for real, also give each order ID a unique rule, so a repeat is refused.

## Your turn
1. Create `fact_orders` and `dim_customer`. Give the customer table the start date, end date, and current flag.
2. Run a full load of the first month. Write down the row count.
3. Change one customer's city, using the close-and-open pattern.
4. Run an incremental load for the second month.
5. Run the same incremental load again. Show that no rows are added.

**Hand in:** your table definitions, the load scripts, the row counts before and after each step, and the rerun result.

## Check yourself (trainer's answer key)
1. An incremental load is faster. Its risk is the watermark: if it is wrong, you miss or repeat rows.
2. SCD Type 2 keeps history. Type 1 overwrites it, so history is lost.
3. A load is safe to rerun when it skips rows it has already loaded.

**Expected:** After the move, the customer has two rows. Old orders match the Pune row, and new orders match the Nashik row.

## Why this helps your job
Testing a load for missing and repeated rows, and checking history, is a standard task for ETL testers.
