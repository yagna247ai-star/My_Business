# Day 36 — Sorting Customers Into Friend Groups by How They Shop

> **Time:** 4 h 30 min · **Module:** M7 Machine Learning · **Shop:** Ravi Textiles

## The problem
Ravi Textiles has 3,000 customers. The marketing team sends the same message to all of them. The owner wants to group customers by how they shop: how often, how much, and what they buy. Then each group can get a different message.

## The big idea
**Clustering** puts similar things into groups, with no answers given. Like a teacher sorting a class into sports teams by what each child enjoys, without a list telling the teacher the answer.

**K-Means** is the most common method:
1. Pick a number of groups, called **k** (for example, 4).
2. Place k centre points at random.
3. Put each customer with the nearest centre.
4. Move each centre to the middle of its group.
5. Repeat until nothing changes.

**Scaling first:** If spend is in rupees (thousands) and orders are counted (tens), spend will dominate. Scale all the features to the same size before grouping.

**Choosing k:** Try several values. The **elbow** is the bend where adding one more group stops helping much. But also ask: can I describe each group, and send it a different message?

## Words to know
- **Cluster**: a group of similar things.
- **Centre**: the middle point of a group.
- **Scale**: change numbers so they are on the same size range.
- **Elbow**: the bend in a graph that suggests a good k.

## Let's solve it
```python
from sklearn.preprocessing import StandardScaler
from sklearn.cluster import KMeans

X = customers[["orders_per_year", "avg_spend", "share_of_wholesale"]]
Xs = StandardScaler().fit_transform(X)                  # make every feature the same size

# How tight are the groups for each k? Look for the elbow.
inertia = {k: KMeans(n_clusters=k, n_init=10, random_state=42).fit(Xs).inertia_ for k in range(2, 8)}
print(inertia)

km = KMeans(n_clusters=4, n_init=10, random_state=42).fit(Xs)
customers["cluster"] = km.labels_                       # which group each customer is in
print(customers.groupby("cluster")[["orders_per_year", "avg_spend", "share_of_wholesale"]].mean().round(1))
```

**Test the groups.** Run it again with a different random seed. If the same kinds of groups appear, they are stable.

## Your turn
1. Build a table of customer behaviour with at least three features.
2. Scale the features. Compute the values for k = 2 to 7. Pick a k and say why.
3. Fit the groups with your k. Print each group's averages.
4. Name each group in two or three words. Write the message you would send it.
5. Run it again with another seed. Are the groups similar?
6. If you have a column showing who replied to a campaign, work out the reply rate for each group.

**Hand in:** the program, the elbow values, each group's name and message, the stability check, and the reply rates if you have them.

## Check yourself (trainer's answer key)
1. Scale first, so spend in rupees does not dominate.
2. The elbow is a guide. You also need a group you can describe and act on.
3. With no answers, you judge clusters by how stable they are and whether they help the business.

**Expected:** Groups with clear names that match their averages. Reply rates that differ between groups, if you have the data.

## Why this helps your job
Grouping customers and naming each group in plain words is a skill employers look for.

## Module 7 checkpoint
Your cluster report from today and your model report from Day 35 make up the Module 7 model report.
