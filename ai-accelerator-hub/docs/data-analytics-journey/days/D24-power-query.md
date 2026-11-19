# Day 24 — Cleaning Data Inside Power BI, Step by Step

> **Time:** 4 h 30 min · **Module:** M5 Power BI · **Shop:** Sunita Stores

## The problem
Sunita's billing system exports sales with three problems:
- The date column is text, not real dates.
- The header row repeats every 50 rows (someone copy-pasted the data).
- The amount column has the ₹ sign in it.

If the report loads like this, the totals will be wrong. These problems must be fixed before the data loads.

## The big idea
**Power Query** is the cleaning part of Power BI. Each cleaning step is recorded in the **Applied Steps** list. Next time the data refreshes, Power BI runs the same steps again.

So you clean the data **inside Power BI**, not in the original file. The original stays untouched.

Think of it as a recipe card. Every time you cook, you follow the same card, and you get the same dish.

**Data types** tell Power BI what a column holds: a date, a number, or text. Set them early. Maths does not work on text.

## Words to know
- **Power Query**: the tool that cleans and reshapes data inside Power BI.
- **Applied Steps**: the recorded list of cleaning steps.
- **Data type**: what a column holds (date, number, text).
- **Locale**: the date order your country uses (day first, or month first).

## Let's solve it
Steps for the sales export:
1. **Remove repeated headers**: filter out rows where the date column says "Date".
2. **Remove the ₹ sign**: in the amount column, replace "₹" with nothing.
3. **Set the types**: amount to a decimal number. Date to a date, with the day-first locale.
4. **Rename columns**: make them simple: `order_date`, `amount`, `branch`.

**Check the date order.** If the locale is wrong, "03/11/2026" becomes 11 March instead of 3 November. Check three dates by hand.

## Your turn
1. Load the sales export. Do not edit the original CSV.
2. Remove the repeated header rows.
3. Clean the amount column. Set its type to decimal.
4. Set the date column to a date, with the right locale. Check three dates by hand.
5. Add a `month` column (the first day of each month).
6. Close and apply. Write down how many rows loaded.

**Hand in:** the .pbix file, and a screenshot of the Applied Steps list with a one-line note on each step.

## Check yourself (trainer's answer key)
1. Cleaning in Power Query means the original file stays the same, and the steps repeat on every refresh.
2. A date stored as text cannot be sorted by date or counted by month.
3. Set the type first, so that the maths works on numbers.

**Check:** The total of the cleaned amount column matches your hand calculation for one branch.

## Why this helps your job
Power Query is the cleaning layer in most Power BI jobs. The Applied Steps list is your audit trail, which managers and auditors can read.
