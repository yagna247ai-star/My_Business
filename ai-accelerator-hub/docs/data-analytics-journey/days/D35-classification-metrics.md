# Day 35 — Predicting Who Will Leave, and Measuring How Good Your Guess Is

> **Time:** 4 h 30 min · **Module:** M7 Machine Learning · **Shop:** Ravi Textiles

## The problem
Ravi Textiles' online customers sometimes stop buying without a word. The owner wants a list of customers who are likely to stop in the next 90 days. Then the team can send them a special offer.

An offer costs money. Missing a customer who was about to leave costs more than one unneeded offer.

## The big idea
A **classifier** sorts things into groups: "will leave" or "will stay".

Two simple classifiers:
- **Logistic regression**: gives each customer a score between 0 and 1. Above a set line, the customer is flagged.
- **Decision tree**: asks a series of yes/no questions. "Last order more than 60 days ago? If yes, flag." Easy to explain to an owner.

**Measuring the guess** uses four counts:
- **Caught**: flagged, and did leave.
- **False alarm**: flagged, but stayed.
- **Missed**: not flagged, but did leave.
- **Correct stay**: not flagged, and stayed.

From these:
- **Precision**: of the customers I flagged, how many really left?
- **Recall**: of the customers who really left, how many did I flag?

**Accuracy can lie.** If only 10% leave, a model that says "everyone stays" is 90% accurate and catches nobody.

## Words to know
- **Classifier**: a model that picks a group.
- **Confusion matrix**: a 2×2 table of the four counts.
- **Precision and recall**: two ways to measure a guess.
- **F1 score**: a balance of precision and recall.

## Let's solve it
```python
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier
from sklearn.metrics import confusion_matrix, precision_score, recall_score, f1_score

log  = LogisticRegression(max_iter=1000).fit(X_train, y_train)
tree = DecisionTreeClassifier(max_depth=3, random_state=42).fit(X_train, y_train)

for name, m in [("logistic", log), ("tree", tree)]:
    p = m.predict(X_test)
    print(name,
          confusion_matrix(y_test, p).ravel(),       # caught, false alarm, missed, correct stay
          round(precision_score(y_test, p), 2),
          round(recall_score(y_test, p), 2),
          round(f1_score(y_test, p), 2))
```

Try the "everyone stays" guess. It gets high accuracy but recall of 0. That is why accuracy is not enough.

## Your turn
1. Build the churn data: label = no order in the next 90 days.
2. Train both models on the same split.
3. Print the confusion matrix, precision, recall, and F1 for each.
4. Pick one model and one cut-off. Say why, using a made-up cost for an offer and for a missed customer.
5. Write a short note: how many customers are flagged, and roughly how many will be real.

**Hand in:** the program, your metric table, your choice and reason, and your note.

## Check yourself (trainer's answer key)
1. Precision: of those I flagged, how many were right. Recall: of those who left, how many I found.
2. An "everyone stays" model can have high accuracy and still find no one who leaves.
3. A decision tree shows its questions, so the owner can follow the reasoning.

**Fairness rule:** Do not use personal traits like caste, religion, or gender as clues. If a clue might stand in for one of these, name it and remove it.

## Why this helps your job
Explaining why accuracy is not enough is a standard interview question. This day teaches the answer.
