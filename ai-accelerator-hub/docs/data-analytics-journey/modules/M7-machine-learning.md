# M7 — Machine Learning · Days 32–36

| | |
|---|---|
| Parent | `../00-INDEX.md` |
| Duration | 5 days (PDF Days 32–36) |
| MSMEs | Sunita Stores and Ravi Textiles (price and churn), Ganesh Micro-Credit Co-op (default risk), Pinnacle Tools (attrition), Ravi Textiles (customer groups) |
| Tools | Python with scikit-learn (introduced in D33), pandas, the synthetic datasets |

## Objective
Understand what machine learning is for a small business, frame a prediction problem correctly, prepare the data, train and evaluate a simple model, and explain its limits. This module is **introductory**. It does not claim the learner can build production models.

## Learning outcomes
- Separate AI, machine learning and rules, and pick the right one for a problem.
- Tell supervised from unsupervised learning, and regression from classification from clustering.
- Build features and labels, split train and test data, and avoid leaking the answer into the features.
- Fit and read a linear regression, a logistic regression and a decision tree.
- Use accuracy, precision, recall and F1, and explain which one matters for a given business cost.
- Run K-Means and describe each cluster in plain words.

## Day plan
| Day | Artifact | MSME problem | Concept |
|---|---|---|---|
| 32 | [D32](../days/D32-intro-to-ml.md) | Sunita Stores asks whether ML can help, and the team must decide if it should | AI vs ML, supervised vs unsupervised |
| 33 | [D33](../days/D33-features-labels-split.md) | Ravi Textiles wants to predict repeat orders | Features, labels, train/test split |
| 34 | [D34](../days/D34-linear-regression.md) | Estimate house prices for a real-estate-agent client example, then a shop's delivery time | Linear regression |
| 35 | [D35](../days/D35-classification-metrics.md) | Predict which e-commerce customers will churn | Logistic regression, decision tree, metrics |
| 36 | [D36](../days/D36-clustering-evaluation.md) | Group Ravi Textiles customers by buying behaviour | K-Means, evaluation |

Note on Day 34: the PDF's example is house prices. The MSME version uses a shop-sales example, and the house-price example is kept as a worked demo.

## Module assessment
A short model report (one page): the business question, the label, the features, the split, the metric chosen and why, the result, and one limit. Graded on framing and interpretation (0.45) more than on model score.

## Job link
Junior Data Analyst (predictive reporting) and Python Data Analyst (Trainee). Learners are told plainly that production ML needs more training.

## Safety rules
- Never use protected attributes (for example, caste or religion) as features. The co-op scenario in D35 must include a short fairness note.
- Models are advice for a human decision, not an automatic decision about a person.
