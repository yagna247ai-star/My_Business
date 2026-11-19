# Day 17 — Doing Maths on a Whole Shelf at Once

> **Time:** 4 h 30 min · **Module:** M4 Python for Data · **Shop:** Sunita Stores

## The problem
Sunita stocks 500 products. Sunita wants three things:
- The selling price after a 5% discount, for every product.
- The profit on each product (price minus cost).
- The average profit margin.

Doing this one product at a time, in a loop, is slow and easy to get wrong.

## The big idea
A **NumPy array** is a row of numbers that can all be changed at once. It is like a tray of 500 cups. You can pour water into all of them with one movement, instead of filling each cup separately.

Multiplying an array by 0.95 gives 95% of every number. That is called a **vectorised** operation.

**Margin %** = profit ÷ price × 100. If an item costs 80 and sells for 100, profit is 20, and margin is 20%.

## Words to know
- **Array**: a list of numbers that can be worked on together.
- **Vectorised**: one operation applied to every number at once.
- **Mean**: the average.

## Let's solve it
```python
import numpy as np                       # bring in the NumPy toolbox

cost  = np.array([120.0, 45.0, 300.0, 80.0])
price = np.array([150.0, 60.0, 340.0, 85.0])

profit     = price - cost                # subtract every pair at once
disc_price = price * 0.95                # 5% off every price at once
margin_pct = profit / price * 100        # margin for every product

print("Profit per item:", profit)
print("Average margin %:", round(margin_pct.mean(), 2))
print("Items under 10% margin:", np.sum(margin_pct < 10))   # counts True values
```

A plain Python list cannot do `price * 0.95` at all. That is why arrays are used.

## Your turn
1. Make two arrays with 10 products each: cost and price.
2. Work out the price after a 5% discount for all of them, in one line.
3. Work out the margin % for each product. Print the average.
4. Find and print the products with margin below 10%.

**Hand in:** the program and its printed output. In one sentence, say which products to look at first.

## Check yourself (trainer's answer key)
1. The discounted array has the same number of items as the original.
2. `arr[arr > 50]` gives only the numbers bigger than 50.
3. A 2 by 3 array has 2 rows and 3 columns. It holds 6 numbers.

**Check:** Pick one product and work out its profit by hand. It should match the array.

## Why this helps your job
Working on whole columns at once is faster and cleaner. Interviewers often ask why it is faster.
