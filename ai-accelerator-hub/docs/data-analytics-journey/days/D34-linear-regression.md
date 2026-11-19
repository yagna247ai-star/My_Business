# Day 34 — Drawing the Best Straight Line Through Past Sales

> **Time:** 4 h 30 min · **Module:** M7 Machine Learning · **Shop:** Sunita Stores

## The problem
Sunita wants a rough forecast of next week's revenue, so Sunita can plan stock. Sunita has 52 weeks of data:
- Revenue each week.
- Footfall: how many customers walked in.
- Discount: the percentage off that week.

Sunita asks: how much does each thing change revenue? And how wrong could a forecast be?

## The big idea
**Linear regression** draws the straight line that fits past points best. Like a ruler laid across a scatter of dots on a graph.

The formula looks like this:

**revenue = starting amount + (how much per customer × footfall) + (how much per discount point × discount)**

- **Coefficient**: the "how much per" number. If footfall's coefficient is 40, each extra customer adds about ₹40.
- **Intercept**: the starting amount, when everything else is zero.
- **Error**: how far a forecast is from the real number. **MAE** (mean absolute error) is the typical error, in rupees.

**Important:** Two things moving together does not prove one causes the other. And never predict far outside the data you have.

## Words to know
- **Line of best fit**: the straight line closest to all the points.
- **Coefficient**: how much the answer changes for one step of an input.
- **MAE**: the average size of a forecast mistake.

## Let's solve it
```python
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error

X = weekly[["footfall", "discount_pct"]]     # the clues
y = weekly["revenue"]                         # what we want to predict

X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

model = LinearRegression().fit(X_train, y_train)   # draw the best line
print(dict(zip(X.columns, model.coef_.round(1))))  # how much per footfall, per discount point
print("Starting amount:", round(model.intercept_, 1))

pred = model.predict(X_test)                       # guess the test weeks
print("Typical error (MAE):", round(mean_absolute_error(y_test, pred), 0))
```

## Your turn
1. Fit the model on the 52 weeks, with an 80/20 split.
2. Write down each coefficient. Say in one sentence what it means.
3. Find the typical error (MAE) on the test weeks.
4. Predict next week for two cases: footfall 800 and 1,000, with discount 0% and then 5%.
5. Write two lines for the owner: the forecast, and how far off it might be.

**Hand in:** the program, the coefficients, the MAE, your predictions, and the owner note.

## Check yourself (trainer's answer key)
1. A coefficient of 40 on footfall means about ₹40 more revenue per extra customer.
2. A single "the model works" is not enough. The MAE tells the owner how much to trust it.
3. Footfall of 5,000 is far outside the data. The forecast there is a guess.

**Expected:** Footfall has a positive coefficient, because more customers means more revenue.

## Why this helps your job
A forecast with an honest error range is the first predictive task most junior analysts do.

## Trainer note
The PDF's example predicts house prices with the same steps: area and rooms as clues, price as the answer. Use it as an optional second demo.
