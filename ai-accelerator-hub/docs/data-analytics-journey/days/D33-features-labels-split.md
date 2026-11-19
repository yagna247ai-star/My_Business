# Day 33 — Teaching a Model With Practice and a Test Paper

> **Time:** 4 h 30 min · **Module:** M7 Machine Learning · **Shop:** Ravi Textiles

## The problem
Ravi Textiles' owner wants to know which customers will order again in the next 60 days. The owner has two years of orders. The owner asks for a clean dataset, and a way to check that the model works on customers it has never seen.

## The big idea
Teaching a model is like a school exam:
- **Training set**: practice questions with answers. The model learns from these.
- **Testing set**: a hidden test paper. The model never sees it while learning. You use it to check the model honestly.
- **Features**: the clues. Recent orders, how many orders, average order size.
- **Label**: the answer. "Did this customer order again in 60 days? Yes or no."

**Split** the customers into practice and test, usually 80% and 20%.

**Leakage** is cheating. It happens when a clue already contains the answer. For example, "orders in the next 60 days" tells the model the answer. It makes the model look great, but it fails on real new customers. Remove any clue that comes from after the outcome.

## Words to know
- **Feature**: a clue the model uses.
- **Label**: the answer the model learns to predict.
- **Leakage**: a clue that secretly contains the answer.
- **Seed**: a number that makes a random split the same every time you run it.

## Let's solve it
```python
from sklearn.model_selection import train_test_split

X = customers[["recency_days", "orders_last_year", "avg_order_value"]]   # the clues
y = customers["reordered_60d"]                                           # the answer: 1 = yes, 0 = no

X_train, X_test, y_train, y_test = train_test_split(
    X, y,
    test_size=0.2,        # 20% kept as the hidden test paper
    random_state=42,      # same split every time
    stratify=y)           # keep the yes/no mix the same in both sets

print(X_train.shape, X_test.shape)
```

Now try adding a leaky clue, called `orders_next_60d`. The accuracy jumps near 100%. That is too good to be true. Remove it.

## Your turn
1. Build one row per customer: days since last order, orders last year, average order value, and the label.
2. For every clue, check: was it known before the 60 days started? Write yes or no.
3. Split into practice and test sets, 80/20, with the same random number (42).
4. Print the share of "yes" answers in each set. Explain any difference.
5. Add one leaky clue on purpose. Write down how much the accuracy jumps. Then remove it.

**Hand in:** the prepared file, your clue list with yes/no, the split output, and your leak test.

## Check yourself (trainer's answer key)
1. Leakage is a clue that secretly holds the answer. Spot it by asking: could I know this before the outcome?
2. The test set stays hidden until the end, so the result is honest.
3. Stratify keeps the yes/no mix equal, so a rare "yes" is not missed in the test set.

**Expected:** About 20% of rows in the test set. The leaky clue gives a suspicious jump.

## Why this helps your job
Preparing data is most of the work in ML. Leakage is a classic interview question.
