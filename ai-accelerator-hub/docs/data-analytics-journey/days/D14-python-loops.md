# Day 14 — Checking Every Product on the Shelf

> **Time:** 4 h 30 min · **Module:** M3 Python · **Shop:** Sunita Stores

## The problem
Sunita has 30 products. For each one Sunita knows: how many are in stock, how many sell each day, and how many days the delivery takes. Sunita wants a list of products that will run out before the next delivery arrives. Then Sunita can order today.

## The big idea
A **loop** repeats a job for each item. Checking 30 shelves one by one is a loop.

- **for loop**: go through each item in a list. "For each product, check it."
- **while loop**: repeat while something is true. "While stock is above zero, sell one."
- **break**: stop the loop now. "I have found 5 urgent items. Stop."
- **continue**: skip this item and go to the next. "This product is discontinued. Skip it."
- **pass**: do nothing. A placeholder.

**How to find days left:** stock divided by daily sales. If you have 40 bags and sell 6 a day, you have 40 ÷ 6 ≈ 6.7 days.

## Words to know
- **Loop**: a job repeated many times.
- **List**: a row of items, in order.
- **Placeholder**: something that holds a spot until the real thing is added.

## Let's solve it
```python
products = [
    {"name": "Rice 5kg",  "stock": 40, "daily": 6, "lead": 3, "active": True},
    {"name": "Sugar 1kg", "stock": 12, "daily": 5, "lead": 4, "active": True},
    {"name": "Old brand", "stock": 9,  "daily": 1, "lead": 2, "active": False},
]

for p in products:                       # go through each product
    if not p["active"]:
        continue                         # skip discontinued items
    days_left = p["stock"] / p["daily"]  # how many days the stock lasts
    if days_left < p["lead"]:            # runs out before delivery?
        print(f"ORDER NOW: {p['name']} lasts {days_left:.1f} days, delivery takes {p['lead']}")
```

**Watch out for a while loop that never ends.** If the stock never reaches zero, the loop runs forever. Always make sure something inside it changes.

## Your turn
1. Make a list of 30 products. Use the example above, or your own numbers.
2. Print the reorder list.
3. Use `break` so the program stops after the first 5 urgent items. Print how many it found.
4. Print the 7 times table using a loop: 7, 14, 21, up to 70.

**Hand in:** the program and its printed output.

## Check yourself (trainer's answer key)
1. `continue` skips one item and keeps going. `break` stops the whole loop.
2. A while loop runs forever if its condition never becomes False.
3. `range(2, 8)` gives 2, 3, 4, 5, 6, 7. That is 6 numbers. The end number is not included.

**Check:** A discontinued product must never appear on the reorder list.

## Why this helps your job
Loops are how you check every record. Later you will use pandas, which does the same job faster, but you must understand the loop first.
