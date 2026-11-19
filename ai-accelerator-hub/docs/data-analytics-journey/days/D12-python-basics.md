# Day 12 — Your First Python Program: A Shop Cash Counter

> **Time:** 4 h 30 min · **Module:** M3 Python · **Shop:** Sunita Stores

## The problem
At the end of every day, Sunita's staff add up cash, card, and UPI sales with a calculator. It takes 20 minutes, and mistakes happen. Sunita wants a short program. It asks for the three amounts, then prints the total and the share of cash.

## The big idea
Python is a language a computer understands. A program is a list of instructions that run from top to bottom.

- **Variable**: a labelled box that holds a value. `cash = 4200` puts 4200 in a box called `cash`.
- **Type**: what kind of value it is. Numbers with decimals are `float`. Whole numbers are `int`. Words are `str`.
- **input()**: asks the user to type something. It always gives you text.
- **float()**: turns that text into a decimal number, so you can do maths.
- **print()**: shows a message.

Think of a school canteen bill: you write each item's price in a box, then add the boxes.

## Words to know
- **Variable**: a named box that stores a value.
- **Type**: the kind of value (number, decimal, word, yes-or-no).
- **Program**: a list of instructions for the computer.

## Let's solve it
```python
cash = float(input("Cash sales: "))    # ask, then turn the text into a decimal number
card = float(input("Card sales: "))
upi  = float(input("UPI sales: "))

total = cash + card + upi              # add the three boxes together
print(f"Total sales: {total:.2f}")     # show 2 decimal places
print(f"Cash share: {cash / total * 100:.1f}%")  # share of cash, as a percent
```

Try removing `float(` and `)` from the first line. The program adds text, and crashes. That shows why types matter.

## Your turn
1. Install Python. Run `print("Hello, Sunita")` to check it works.
2. Type the program above and run it.
3. Add a check: if the total is zero, print "No sales today" and skip the share line. (Dividing by zero crashes the program.)
4. Run it three times: a normal day, a day with card sales only, and a day with zero sales. Write down what each prints.

**Hand in:** the program and the output of each run.

## Check yourself (trainer's answer key)
1. `input()` always gives text. You need `float()` to do maths.
2. Dividing by zero crashes the program. The check stops that.
3. Using `int()` instead would reject decimal amounts like 100.50.

**Example:** cash 4200, card 1800, UPI 3000 gives a total of 9000.00 and a cash share of 46.7%.

## Why this helps your job
Your first program is the start of your portfolio. Every Python job begins with small programs like this one.
