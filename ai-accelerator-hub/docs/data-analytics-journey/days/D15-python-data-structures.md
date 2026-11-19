# Day 15 — Storing Staff Records the Right Way

> **Time:** 4 h 30 min · **Module:** M3 Python · **Shop:** Pinnacle Tools

## The problem
Pinnacle's HR assistant keeps staff details in a notebook. The assistant needs four things:
- Look up one worker by their ID, quickly.
- Keep a fixed list of shift times that nobody can change by mistake.
- See every skill in the team, with no repeats.
- Keep each worker's details together.

## The big idea
Python has four ways to store a group of things. Pick the one that fits the job:

| Type | Looks like | Think of it as | Use it for |
|---|---|---|---|
| **List** | `[a, b, c]` | a row of school bags, in order | a list of workers |
| **Tuple** | `(a, b)` | a sealed envelope, cannot change | fixed shift times |
| **Set** | `{a, b}` | a bag of unique stickers, no repeats | all skills in the team |
| **Dictionary** | `{"key": value}` | a labelled file box | one worker's record |

A dictionary uses a **key** to find a **value**. Like looking up a student by roll number to find their details.

## Words to know
- **Key**: the label you use to look something up.
- **Value**: what is stored under the key.
- **Immutable**: cannot change after it is made.

## Let's solve it
```python
employees = {                            # a dictionary: ID -> worker record
    101: {"name": "Asha", "dept": "Machining", "skills": {"cnc", "welding"}},
    102: {"name": "Dev",  "dept": "Assembly",  "skills": {"welding", "packing"}},
}
shift = ("06:00", "14:00")               # a tuple: sealed, cannot change

worker = employees.get(101, {})          # look up by ID, safe if missing
print(worker.get("name"), shift[0])      # prints: Asha 06:00

all_skills = set()                       # an empty bag
for w in employees.values():             # go through each worker
    all_skills |= w["skills"]            # add their skills to the bag
print(sorted(all_skills))                # sorted list, no repeats
```

Two things to try:
- `shift[0] = "05:00"` gives an error. Tuples cannot change.
- `employees[999]` gives an error. `employees.get(999)` gives nothing, safely.

## Your turn
1. Store 5 workers as dictionaries, using their IDs as keys.
2. Add a new skill to one worker.
3. Print every skill in the team, sorted, with no repeats.
4. Store the shift times in a tuple. Try changing one time, and write down the error.

**Hand in:** the program, its output, and one sentence: why is a tuple right for shift times?

## Check yourself (trainer's answer key)
1. A set removes repeats for you. A list keeps them.
2. Use a tuple when the values must never change.
3. `d.get("x")` returns nothing, or the default you give, if "x" is missing.

## Why this helps your job
Data from websites and apps often comes as dictionaries. You will meet them again in Module 8.
