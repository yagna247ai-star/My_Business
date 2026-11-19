# Day 25 — Organising Data Like a Library: The Star Shape

> **Time:** 4 h 30 min · **Module:** M5 Power BI · **Shop:** Sunita Stores

## The problem
Sunita wants to slice Sunita's sales by product category, by branch, by customer city, and by month. With one big flat sales table, every chart is slow, and every total repeats the same words.

## The big idea
A library has books, and it has a catalogue that describes them. The book is the **fact**: something that happened. The catalogue is the **dimension**: who, what, where, and when.

In a **star schema**:
- **One fact table** sits in the middle. It holds the numbers (amount, quantity) and the ID numbers that point outwards.
- **Dimension tables** sit around it. They hold the details: product name, branch name, customer city, date parts.

The picture looks like a star: one centre, with points going out.

- **Relationship**: a line between two tables that share an ID.
- **One-to-many (1:*)**: one product description can match many sales. This is the usual shape.

**Snowflake** is a star where a dimension is split further (product → category → department). It works, but it has more tables to join.

## Words to know
- **Fact table**: the table of events and numbers.
- **Dimension table**: the table of descriptions.
- **Relationship**: a link between two tables.
- **Cardinality**: how many rows on each side can match (one-to-many, for example).
- **Date table**: a table with one row for every day, so you can compare dates easily.

## Let's solve it
Split the flat sales table:
- `fact_sales`: order ID, date ID, product ID, branch ID, customer ID, quantity, amount.
- `dim_product`: product ID, name, category.
- `dim_branch`: branch ID, branch name.
- `dim_date`: date ID, date, month, year.

Draw the links in Power BI's Model view: each dimension links to the fact table, one-to-many, in one direction.

**Check the total.** The total amount in the fact table must match the total of the old flat table. If it does not, a link is wrong.

## Your turn
1. Start from the cleaned sales table from Day 24. Split it into one fact table and three dimension tables.
2. Make a date table with a row for every day in the data.
3. Create the links. Each should be one-to-many, in one direction.
4. Check that the fact table's total amount matches the original total.
5. Draw the star: boxes in a ring around one centre box.

**Hand in:** the .pbix model, your star drawing, and one sentence about the link you were least sure of.

## Check yourself (trainer's answer key)
1. The fact table is on the "many" side, because one product has many sales.
2. Use a snowflake when a category needs its own table, for example to show a hierarchy.
3. Many-to-many links make totals count some sales twice, so totals go wrong.

## Why this helps your job
Drawing a star schema is a common task in Power BI interviews. Practise drawing it on paper.
