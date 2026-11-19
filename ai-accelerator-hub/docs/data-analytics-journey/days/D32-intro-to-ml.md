# Day 32 — Can a Computer Learn From Past Shop Days?

> **Time:** 4 h 30 min · **Module:** M7 Machine Learning · **Shop:** Sunita Stores

## The problem
Sunita has read that machines can "predict sales". Sunita has 12 months of data for two branches. Before anyone builds anything, Sunita asks: is machine learning the right tool for each question I have?

## The big idea
**Machine learning (ML)** is a way for a computer to find patterns in past examples, then use them on new cases.

Think of a school teacher who shows a student 100 solved maths problems. The student then solves new ones using the same pattern.

There are three kinds of question:
- **Rule**: you know the answer. "Reorder when stock is below 10." No learning needed.
- **Learn from labelled examples** (supervised): past examples have the answer written on them. Example: past months with their real revenue.
  - If the answer is a **number**, it is called **regression**. Example: next month's revenue.
  - If the answer is a **category**, it is called **classification**. Example: "will this customer come back? yes or no".
- **Find groups with no answers** (unsupervised): the computer groups similar things. This is **clustering**.

**The first question to ask:** "Do I have past examples with the answer already written?" If yes, supervised learning. If no, a rule or clustering.

## Words to know
- **Label**: the answer written on a past example.
- **Supervised**: learning from examples with answers.
- **Unsupervised**: finding groups without answers.

## Let's solve it
| Question | Answer known in the past? | Type |
|---|---|---|
| Reorder when stock is below 10 | No need, it is a rule | Rule |
| Predict next month's revenue | Yes, past monthly revenue | Supervised, number |
| Will this customer buy again? | Yes, past customers and what they did | Supervised, category |
| Group customers by buying habit | No answers | Clustering |

**A fair question:** Is ML better than the stock rule? For reorders, the simple rule is better. It is easier to explain, and it works.

## Your turn
1. For Sunita Stores, write eight questions the owner might ask.
2. Mark each one: rule, number prediction, category prediction, grouping, or not worth ML.
3. Pick one supervised question. Write its label: the answer you would learn from.
4. Pick one question where ML is not worth it. Say why in two sentences.

**Hand in:** your table of eight questions, the labels, and your two justifications.

## Check yourself (trainer's answer key)
1. A number prediction is regression. A category prediction is classification.
2. A rule is better when the answer is simple and fixed.
3. The label is the answer you already know for each past example.

**Expected:** Stock reorder: rule. Next month's revenue: regression, label = past monthly revenue. Repeat purchase: classification. Customer groups: clustering.

## Why this helps your job
Knowing when ML is not needed is valued more than building a model for its own sake.
