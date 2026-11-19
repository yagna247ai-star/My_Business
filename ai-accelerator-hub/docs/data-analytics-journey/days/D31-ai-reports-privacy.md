# Day 31 — Writing a Report With AI, Without Breaking Trust

> **Time:** 4 h 30 min · **Module:** M6 AI for Data · **Shop:** Ganesh Micro-Credit Co-op

## The problem
The co-op's board wants a one-page monthly summary of loans: how much was lent, how much was repaid, how much is late, and which branch has the most late loans.

A staff member asked an AI tool to write it. The draft said: "Late loans rose 30% after the new policy." Nobody checked it. The member names were also pasted into the prompt. That is a privacy problem.

## The big idea
Use three checkpoints for any AI report:
1. **Privacy gate**: remove names and ID numbers before any AI sees the data. Share totals, not people.
2. **Draft**: let the AI write from the totals only.
3. **Claim check**: every number and every claim is checked against a query before it is published.

**"30% higher" can be misleading.** If late loans went from 10 to 13, that is three more loans. The share of all loans may have moved only a little. Always ask: 30% of what, and over what time?

## Words to know
- **Claim**: a statement in the report, such as "late loans rose".
- **Limitation**: something the data cannot tell you.
- **Privacy**: keeping personal details of real people private.
- **Aggregate**: a total or count, not a list of people.

## Let's solve it
Check the AI's claim, step by step:
- Late loans: 10 last month, 13 this month. That is +3 loans, which is +30%.
- Total loans: 400 last month, 420 this month.
- Late share: 10 ÷ 400 = 2.5%. 13 ÷ 420 = 3.1%.
- The policy started halfway through the month.

**Verdict:** "Late loans rose by 3, from 2.5% to 3.1% of all loans. The policy was only in place for half the month, so we cannot say it caused the rise."

## Your turn
1. Count loans by branch and month. Remove names and ID numbers first.
2. Ask the AI for a one-page draft, using only this table.
3. Mark each claim in the draft: supported, not supported, or wrong. Write the query for each.
4. Rewrite any claim that is not supported, or remove it.
5. Add a "limitations" section with at least three points.
6. Write one privacy line for the bottom of the report.

**Hand in:** the summary table, the AI draft, the claim check (at least five claims), the final report, and the privacy line.

## Check yourself (trainer's answer key)
1. "30%" hides the size of the change. Give the counts too.
2. Names, phone numbers, and ID numbers must be removed.
3. A limitation is a gap in the data. A hallucination is a claim the data does not support.

**Expected:** Each claim has a query. At least one claim was changed or removed. The limits mention the period, the sample size, and any missing branch.

## Why this helps your job
A checked report with a privacy line is what reporting jobs ask for. Keep it in your portfolio.
