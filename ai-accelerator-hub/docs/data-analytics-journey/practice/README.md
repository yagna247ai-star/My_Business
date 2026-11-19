# Practice Pack — Datasets, Labs and Checks

This folder gives you everything to practise: datasets you can generate for 13 domains, 39 labs (three levels in each domain), and checks that tell you whether you are right.

| File | What it is |
|---|---|
| `generate_datasets.py` | Creates the practice datasets for 13 domains. Options below. |
| `LABS.md` | The 39 labs (beginner, intermediate, advanced), each with a full problem statement. Learner-facing. |
| `labs.py` | Source of the labs. Teacher use: `--check` runs the reference queries. |
| `check_setup.py` | Checks your computer is ready. Run it first. |
| `SETUP-WINDOWS.md` | Step-by-step setup on Windows. |
| `generated/` | Output of the generator (created when you run it). |

## 1. Pick your dataset options

Run from this folder:

```text
python generate_datasets.py                                   # all 8 domains, medium, some problems
python generate_datasets.py --domain bfsi --size small --dirty none
python generate_datasets.py --domain all --size large --dirty lots --seed 7 --out my_data
```

| Option | Choices | What it changes |
|---|---|---|
| `--domain` | `retail` `bfsi` `healthcare` `education` `ecommerce` `hr` `logistics` `manufacturing` `all` | Which business to generate |
| `--size` | `small` (about 100 rows), `medium` (about 500), `large` (about 2,000) | How much data |
| `--dirty` | `none` (clean), `some` (about 3% problems), `lots` (about 10%) | How messy the data is |
| `--seed` | any whole number | Same seed, same data every time. Change it for a fresh set. |
| `--out` | any folder | Where the files go |

Every run writes, for each domain:
- `<table>.csv`: the data you work on (may be messy).
- `clean/<table>.csv`: the clean version, to check your cleaning.
- `answer_key.json`: the correct totals, and how many problems were planted.

**Which setting to use:**
- Beginners: `--size small --dirty none`.
- Cleaning practice: `--size medium --dirty some` (the default).
- Realistic messy work: `--size large --dirty lots`.

## 2. Domains covered

| Domain | Business (fictional) | Tables | Typical questions |
|---|---|---|---|
| Retail / MSME | Sunita Stores | products, customers, sales_orders | Top products, revenue by branch |
| BFSI (lending) | Ganesh Micro-Credit Co-op | customers, loans, repayments | Open and overdue loans, recovery rate |
| Healthcare | Bright Smile Dental Clinic | patients, visits | Revenue by treatment, no-show rate |
| Education | Little Scholars Tuition Centre | students, attendance, fees | Attendance %, fees owed |
| E-commerce | Online shop | customers, orders | Delivered revenue, return rate by city |
| HR | Pinnacle Tools | employees | Headcount, salary by department, attrition |
| Logistics | Delivery routes | shipments | On-time rate, delay by route |
| Manufacturing | Production lines | production | Units made, defect rate |
| Agriculture | Kisan Agro Co-op (fictional) | farmers, harvests | Quintals per crop, revenue, average farmer income |
| Telecom | NetLink (fictional mobile operator) | subscribers, bills | Churn, monthly billing, unpaid bills |
| Insurance | Shield General (fictional) | policyholders, claims | Claims by type, payouts, settlement ratio |
| Public sector | Sahay welfare scheme (fictional) | beneficiaries, payments | Enrolment, paid and failed payments |
| Real estate | Homeline Realty (fictional) | properties, sales | Sales value, price per sqft, days on market |


## 3. Bring your own data (optional)

You can also use your own CSV files, for example from a public dataset or your own shop records.
Rules before you start:
- One header row. One record per row. No totals inside the data.
- Remove personal details (names, phone numbers, ID numbers) before you use real data.
- Keep a note of where the data came from and its licence.

## 4. How to work through the labs

1. Run `check_setup.py`. All required lines must say PASS.
2. Generate the data you need (section 1).
3. Open `LABS.md` and start with the beginner lab for a domain.
4. For each lab: write the SQL, then the Python. Compare your answer with the expected result.
5. For intermediate and advanced labs, clean the dirty file first, and keep a log of each fix.
6. If your answer does not match, check the cleaning log before you change the query.

## 5. Rules for the practice data

- All names, people, and numbers are invented. No real person or organisation is represented.
- Do not put real customer data into the practice folder.
- The answer keys are for checking your work. Try the lab first, then check.
