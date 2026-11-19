# Day 26 — Teaching Power BI to Do the Maths

> **Time:** 4 h 30 min · **Module:** M5 Power BI · **Shop:** Sunita Stores

## The problem
Sunita needs three numbers on Sunita's dashboard that Sunita can trust:
- Total revenue.
- Number of orders.
- Revenue compared with the same month last year.

Each number must change when Sunita picks a branch or a month from a slicer.

## The big idea
**DAX** is the formula language of Power BI. There are two kinds of formulas:
- **Calculated column**: a value worked out for every row, and stored. Like a label on each sale: "Small" or "Large".
- **Measure**: a total that is worked out when you look at the chart. It changes with the slicer. Like a score that updates as the match goes on.

**Use a measure for totals.** A column total would not change when someone picks a branch.

**CALCULATE** changes what the formula looks at. "Revenue, but for last year." It is like looking through a different window.

## Words to know
- **DAX**: the formula language for Power BI.
- **Measure**: a total or ratio that updates with filters.
- **Filter context**: the choices (slicers, rows) that decide which data the measure looks at.

## Let's solve it
```dax
Revenue = SUM ( fact_sales[amount] )          -- add up all amounts you can see

Orders = DISTINCTCOUNT ( fact_sales[order_id] )   -- count each order once

Revenue LY =
CALCULATE ( [Revenue], SAMEPERIODLASTYEAR ( dim_date[date] ) )   -- same period, last year

Revenue Change % =
DIVIDE ( [Revenue] - [Revenue LY], [Revenue LY] )   -- DIVIDE avoids errors when last year is zero
```

**Test it.** Put a branch slicer on the page. The Revenue number should change. If it does not, you made a column, not a measure.

## Your turn
1. Create four measures: Revenue, Orders, Revenue LY, Revenue Change %.
2. Create a calculated column called `size_band` on the sales table: Small, Medium, Large. Use the amount limits from Day 10.
3. Create Avg Order Value = Revenue divided by Orders. Use DIVIDE.
4. Pick a month on a slicer. Check each number against your SQL total for that month.

**Hand in:** the .pbix file, a list of your measures and their formulas, and your check table.

## Check yourself (trainer's answer key)
1. A measure updates with the slicer. A column total does not.
2. CALCULATE changes which dates the formula looks at.
3. DIVIDE returns blank instead of an error when you divide by zero.

**Check:** Revenue for a month matches the SQL total for the same month from Module 2.

## Why this helps your job
Measures are the heart of a Power BI report. Interviewers often ask for one measure and check that it changes with the filters.
