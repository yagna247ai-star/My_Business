# Day 13 — Teaching the Program to Decide

> **Time:** 4 h 30 min · **Module:** M3 Python · **Shop:** Little Scholars Tuition Centre

## The problem
Little Scholars gives each student a grade from their test average:
- 85 or more: **A**
- 70 to 84: **B**
- 50 to 69: **C**
- Below 50: **Fail**

A student can join the next batch only if they did not fail and their fees are fully paid.

## The big idea
A program makes decisions with **if**, **elif** (else if), and **else**. It is like a school gate rule: "If you have a pass, enter. Else if you have a visitor slip, check with the office. Else, stay outside."

Python checks the rules from top to bottom. It runs the first one that is true, then stops checking.

Comparisons give True or False:
- `==` means "is equal to".
- `>=` means "is at least".
- `and` needs both sides to be True.

**Indentation** matters. The four spaces before a line tell Python which block it belongs to.

## Words to know
- **Condition**: a question that is True or False.
- **Branch**: one path the program can take.
- **Indentation**: the spaces at the start of a line that group it into a block.

## Let's solve it
```python
average = float(input("Test average: "))
fees_paid = input("Fees fully paid? (yes/no): ").strip().lower() == "yes"  # True or False

if average >= 85:        # check the top rule first
    grade = "A"
elif average >= 70:
    grade = "B"
elif average >= 50:
    grade = "C"
else:                    # everything else
    grade = "Fail"

eligible = grade != "Fail" and fees_paid   # both must be True
print(f"Grade: {grade}, eligible for next batch: {eligible}")
```

**Order matters.** If you check `>= 70` before `>= 85`, a student with 90 gets a B. The first True rule wins.

## Your turn
1. Type the program and run it.
2. Test these averages: 85, 84.9, 70, 50, 49.5. Write the grade for each.
3. Add a rule: a student with 90 and unpaid fees is not eligible. Show the output.
4. In one sentence, explain why the order of `elif` checks matters.

**Hand in:** the program, your table of grades, and your sentence.

## Check yourself (trainer's answer key)
| Average | Grade |
|---|---|
| 85 | A |
| 84.9 | B |
| 70 | B |
| 50 | C |
| 49.5 | Fail |

1. `17 % 5` is 2. The `%` sign gives the remainder after dividing.
2. `==` asks a question. `=` gives a box a value.
3. A student with exactly 70 gets a B, because 70 is "at least 70".

## Why this helps your job
Sorting data into groups (grades, bands, flags) is something you will do in almost every project.
