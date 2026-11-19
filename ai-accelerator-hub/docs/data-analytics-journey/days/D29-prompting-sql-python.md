# Day 29 — Asking AI the Right Way: The Five-Part Question

> **Time:** 4 h 30 min · **Module:** M6 AI for Data · **Shop:** Sunita Stores

## The problem
A staff member asked an AI tool: "Give me top products by branch." The query it wrote used a column called `store`. That column does not exist. The query also added the wrong column. The result looked real but was wrong.

Sunita wants a reliable way to get SQL and Python from AI, and to know when to trust it.

## The big idea
AI cannot see your database. It only sees what you tell it. So you tell it everything it needs, in five parts:

1. **Context**: what the business is.
2. **Schema**: the exact table and column names, with their types.
3. **Task**: what you want back.
4. **Rules**: what to leave out, and how to handle blanks.
5. **Output**: the format you want, for example "SQL only, with a comment on each step".

**Then test the answer.** Run it. Compare one number with a number you worked out by hand.

Think of ordering food: "a dosa" is vague. "A plain masala dosa, no onions, for one, delivered by 8 pm" gets the right food.

## Words to know
- **Schema**: the list of tables and columns in a database.
- **Prompt**: your instruction to the AI.
- **Dialect**: a version of SQL. Different databases have small differences.

## Let's solve it
**Weak prompt:**
> Give me top products by branch.

**Strong prompt:**
```text
Context: Sunita Stores, a grocery shop with 2 branches.
Schema:
  sales_orders(order_id INT, product_id INT, branch TEXT, qty INT, order_date DATE, amount NUMERIC)
  products(product_id INT, name TEXT, category TEXT)
Task: For each branch, return the top 3 products by total amount in October 2026.
Rules: Use only the columns above. Leave out rows where amount is blank. Ties: use RANK.
Output: one SQL query (SQLite), with a comment on each step. Then list your assumptions.
```

Run both. The weak prompt may fail. The strong one should match your hand check.

## Your turn
1. Write the weak prompt. Record what the AI gives back.
2. Write a strong prompt with all five parts, for the same question.
3. Run the answer. Check one branch's top product by hand.
4. Ask the AI for the same thing in Python (pandas), using a CSV. Compare the two answers.
5. Write down one mistake the AI made, and how your prompt fixed it.

**Hand in:** both prompts, both answers, your hand check, and the mistake log.

## Check yourself (trainer's answer key)
1. The schema stops the AI from guessing column names.
2. Context, schema, task, rules, output.
3. Check the total or one row by hand, and check for blank values and repeats.

**Expected:** The strong prompt uses only the given columns, returns the top 3 per branch, and lists its assumptions.

## Why this helps your job
Knowing how to ask AI, and how to test its answer, is now a normal skill for analysts.
