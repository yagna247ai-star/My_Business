# Day 5 — One Big Sheet Becomes Three Small Tables

> **Time:** 4 h 30 min · **Module:** M2 SQL · **Shop:** Sunita Stores

## The problem
Sunita keeps every sale in one big Excel sheet. The same customer is typed three ways: "Mrs. Rao", "rao madam", "Rao". The same product price is copied on every row. When a price changes, staff must edit hundreds of rows by hand.

## The big idea
Split the big sheet into three small tables, like three school registers:
- **Customers register**: one row per customer.
- **Products register**: one row per product.
- **Orders register**: one row per sale. It only stores the customer's number and the product's number.

A **primary key** is the unique number on each row, like a roll number. No two students have the same roll number. The customer number is the customers table's primary key.

A **foreign key** is a number in one table that points to a row in another table. An order points to a customer roll number.

Now a price change happens in one place only.

## Words to know
- **Table**: a set of rows about one kind of thing.
- **Row**: one record, like one student.
- **Column**: one kind of information, like "name".
- **Database**: a set of tables that work together.
- **RDBMS**: the software that keeps tables linked (examples: SQLite, PostgreSQL, MySQL).
- **Primary key**: a unique number for each row.
- **Foreign key**: a number that points to a row in another table.

## Let's solve it
Build the three tables:

```sql
CREATE TABLE customers (
  customer_id INTEGER PRIMARY KEY,   -- unique number for each customer
  name        TEXT NOT NULL,         -- name cannot be empty
  city        TEXT
);

CREATE TABLE products (
  product_id  INTEGER PRIMARY KEY,
  name        TEXT NOT NULL,
  unit_price  NUMERIC NOT NULL
);

CREATE TABLE sales_orders (
  order_id     INTEGER PRIMARY KEY,
  customer_id  INTEGER REFERENCES customers(customer_id),  -- must be a real customer
  product_id   INTEGER REFERENCES products(product_id),    -- must be a real product
  qty          INTEGER,
  order_date   DATE
);
```

Now try to add an order for customer 999, who does not exist. The database says no. That is the foreign key protecting your data.

## Your turn
1. Create these three tables in a free database (SQLite is enough).
2. Add 3 customers, 4 products, and 5 orders.
3. Try to add an order for customer 999. Write down the error message.
4. Draw the three tables as boxes, with arrows from the orders box to the other two.

**Hand in:** the CREATE script, the error message, and your drawing.

## Check yourself (trainer's answer key)
1. A name can repeat or be typed differently. A number never repeats.
2. The orders table is on the "many" side. One customer has many orders.
3. The price is stored once in the products table, so one change updates every future sale.

**Answer key note:** SQLite may need foreign keys turned on with `PRAGMA foreign_keys = ON;`.

## Why this helps your job
Database design is the first thing SQL interviewers ask about. Your drawing from this day is a good item for your portfolio.
