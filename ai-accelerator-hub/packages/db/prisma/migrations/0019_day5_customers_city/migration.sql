-- docs/DAY5_SQL_TABLES_SPEC.md: Day 5 (Data Analytics, Level 2) created customers.city in the lesson but
-- inserted phone numbers in the guided steps. Fix every institution's copy of the day page.
-- Content.payload is JSON text, so a newline inside the lesson is the two characters \n (standard strings).
-- Only rows that still hold the old step script are touched; once fixed they no longer match, so this is
-- safe to run twice. Other days that mention sales_orders are never matched.
UPDATE "contents"
SET payload =
  replace(replace(replace(replace(replace(payload,
    'name TEXT NOT NULL, phone TEXT);', 'name TEXT NOT NULL, city TEXT);'),
    '(1,''Mrs. Rao'',''9800000001''),(2,''Imran'',''9800000002''),(3,''Lakshmi'',''9800000003'')',
    '(1,''Mrs. Rao'',''Hyderabad''),(2,''Imran'',''Vijayawada''),(3,''Lakshmi'',''Warangal'')'),
    '  unit_price  NUMERIC NOT NULL', '  price       INTEGER NOT NULL'),
    'CREATE TABLE sales_orders (\n  order_id     INTEGER PRIMARY KEY,', 'CREATE TABLE orders (\n  order_id     INTEGER PRIMARY KEY,'),
    '  qty          INTEGER,\n  order_date   DATE\n', '  qty          INTEGER,\n  ordered_on   TEXT\n')
WHERE kind = 'md'
  AND strpos(payload, 'CREATE TABLE customers (customer_id INTEGER PRIMARY KEY, name TEXT NOT NULL, phone TEXT);') > 0;
