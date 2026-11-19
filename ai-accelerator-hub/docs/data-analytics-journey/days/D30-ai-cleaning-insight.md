# Day 30 — Using AI to Tidy a Messy Class Register

> **Time:** 4 h 30 min · **Module:** M6 AI for Data · **Shop:** Little Scholars Tuition Centre

## The problem
Little Scholars' attendance file has 2,000 rows from six teachers. Names are spelled several ways. Some dates use two formats. Some classes appear twice. The owner wants to know which students may fall below 75% attendance, and why.

## The big idea
AI is a fast helper for three jobs:
- Suggesting a list of problems in a messy file.
- Writing a plain-English summary.
- Suggesting patterns to test.

AI is weak at three jobs:
- Exact counts.
- Percentages on large data.
- Being sure that a pattern is real.

**The rule is simple: AI suggests. Code applies. Counts confirm. A person decides.**

A pattern from AI is only a guess until you test it. Compare a group with a baseline, and count.

## Words to know
- **Baseline**: a normal value to compare against.
- **Hypothesis**: a guess you still need to test.
- **Summary**: a short version of the main points.

## Let's solve it
Give the AI 20 sample rows, with the names removed. Ask: "What problems do you see in these rows?"

The AI may say:
- Name spelling is different in different rows.
- Two date formats are used.
- Some rows are repeated.

Now do the fixing in code, and count each change:
```python
attendance["name"] = attendance["name"].str.strip().str.title()     # one spelling per name
attendance["date"] = pd.to_datetime(attendance["date"], dayfirst=True, errors="coerce")
before = len(attendance)
attendance = attendance.drop_duplicates()                           # remove exact repeats
print("Duplicates removed:", before - len(attendance))
```

The AI also suggests: "Attendance drops on Fridays." Test it. Compare the Friday average with the others. Maybe it is only 4% lower. With three weeks of data, that may not mean anything.

## Your turn
1. Send the AI 20 sample rows, with no real names.
2. Apply its suggestions in code. Log the count for each change.
3. Ask the AI for three patterns. For each, write a test: group the data, count, and compare with a baseline.
4. Ask the AI for a summary of students below 75%. Check its numbers against your own query.
5. Mark each AI claim: confirmed, not confirmed, or wrong.

**Hand in:** your cleaning log, the three pattern tests, the summary, and the claim table.

## Check yourself (trainer's answer key)
1. AI can invent numbers. Counting is a job for code.
2. Test the pattern before you put it in a report. A small difference from a short period proves little.
3. Keep the prompt and the answer, so someone else can check your work.

**Expected:** The cleaning log has a count for each rule. At least one AI claim is marked "not confirmed" or "small effect".

## Why this helps your job
Using AI with a written log, and showing which claims you checked, is a strong skill to show in an interview.
