# Practice Labs — 8 Domains, 3 Levels

Work through them in order inside each domain. Data paths are inside the `generated/` folder. Beginner labs use clean data. Intermediate and advanced labs use the dirty data, so you clean first.

**Setup:** see `SETUP-WINDOWS.md`. **Data:** run `python3 generate_datasets.py` (or pick options, see README). Data paths below are inside `generated/`.

**How to know you are right:** the expected result is given for each lab. Your answer must match it.

## Retail

### R1 · Beginner · The five most expensive products

**Problem statement.**


**Who is asking.** Sunita, who runs Sunita Stores, a grocery shop with two branches (North and South).

**The situation.** Customers keep asking the staff which products are the most expensive. Sunita wants a short price list to print and stick near the till.

**Why it matters.** A clear list helps staff answer questions fast, and helps Sunita see which items bring the highest price per pack.

**The data.** `products.csv` with the columns `product_id`, `name`, `category`, `unit_price` (price in rupees). The data is clean.

**Words to know.** *Sort* means putting rows in order. *Descending* means biggest first. *Limit* means only keeping the first few rows.

**Your goal.** Find the five products with the highest unit price, the most expensive first.

**You are done when.** You have exactly five rows, sorted from the highest price down, and you can say which product is at the top and why it is first.


**Short scenario.** Sunita wants a shelf-price list: the five most expensive products, dearest first.

**You learn:** SELECT, ORDER BY, LIMIT

**Data:** `retail/clean/products.csv (clean)`

**SQL task.** List product name and unit price of the 5 most expensive products.

**Python task.** Read products.csv with csv.DictReader, sort by unit_price (as a number), print the top 5.

**Expected result.** 5 rows; highest is Atta 10kg at 480 (check the top value).

### R2 · Intermediate · Revenue by branch from messy bills

**Problem statement.**


**Who is asking.** Sunita again. Sunita has two branches, and Sunita wants to know which branch earns more money from its bills.

**The situation.** The bills come from two branches that enter their data in different ways. The North branch sometimes writes "north " with a space. Some amounts are written as "Rs 1,200", some are blank, some bill dates do not exist (for example 31 February), and some bills were copied twice.

**Why it matters.** If you add up the messy file as it is, the branch totals will be wrong. Sunita will make decisions on wrong numbers unless the data is cleaned first.

**The data.** `sales_orders.csv` (dirty, with planted problems), with the columns `order_id`, `customer_id`, `product_id`, `branch`, `qty`, `order_date`, `amount`. The clean version is in `clean/`, so you can check your work.

**Words to know.** *Clean* means fixing mistakes before you calculate. *Duplicate* means the same row appears more than once. *Total per group* means adding up the numbers for each branch.

**Your goal.** Clean the file, keep a log of how many rows you fixed or removed for each problem, then add up revenue for North and for South.

**You are done when.** Your two branch totals add up to the `total_revenue` in `answer_key.json`, and your log explains every row you changed.


**Short scenario.** Sunita's bills came from two branches with different habits: spelling, text amounts, blanks, bad dates, repeats.

**You learn:** Cleaning, CASE/TRIM, GROUP BY, SUM

**Data:** `retail/sales_orders.csv (dirty); answer_key.json`

**SQL task.** After cleaning (lower-case branch names are 'north'/'south' with extra spaces; amounts like 'Rs 1,200'; blanks; invalid dates; duplicate order_id), total revenue per branch.

**Python task.** Clean the dirty sales_orders.csv in code. Log each fix with a count. Then total revenue per branch.

**Expected result.** North and South totals; they must add up to total_revenue in answer_key.json.

### R3 · Advanced · Best seller in each branch, each month

**Problem statement.**


**Who is asking.** Sunita, for Sunita's monthly review meeting with the branch managers.

**The situation.** Each month, the managers want to know which product sold the most money in their branch. Sunita wants the list for every branch and every month, not only one winner for the whole period.

**Why it matters.** Knowing the best seller each month helps the stores order more of the right products and plan displays.

**The data.** `sales_orders.csv` (clean) and `products.csv`. Join them with `product_id`. The `order_date` column is a date text like `2026-07-14`.

**Words to know.** *Partition* means splitting the data into separate groups (here: each branch and month). *Rank* means the position in a list. A *CTE* is a named step inside a query.

**Your goal.** For each branch and month, find the single product with the highest total revenue. First add up revenue per branch, month and product. Then pick the top one in each group.

**You are done when.** You have one row for every branch-month pair in the data, and each row names one winner. You can explain why `ROW_NUMBER` is used.


**Short scenario.** For the owner's monthly review: the top product in each branch for each month.

**You learn:** CTE, window function ROW_NUMBER, PARTITION BY

**Data:** `retail/clean/sales_orders.csv + products.csv`

**SQL task.** For each branch and month, return the top product by revenue. Use a CTE for the monthly totals and ROW_NUMBER for the ranking.

**Python task.** Group revenue by (branch, month, product), then pick the highest per (branch, month). Print the result.

**Expected result.** One row per branch per month. Each month of each branch has exactly one winner.

## Bfsi

### B1 · Beginner · How many loans are still open?

**Problem statement.**


**Who is asking.** Ganesh, who runs Ganesh Micro-Credit Co-op. The co-op lends small loans to shop owners and farmers.

**The situation.** The co-op does not yet know how many loans are still running. A loan is still open when it has no closing date.

**Why it matters.** Open loans are the money the co-op still expects to get back. Ganesh needs this number for the monthly board report.

**The data.** `loans.csv` (clean) with the columns `loan_id`, `customer_id`, `branch`, `amount`, `disbursed_on`, `due_date`, `closed_on`. A blank `closed_on` means the loan is open.

**Words to know.** *Disbursed* means the money was given out. *Closed* means the loan was fully finished. *NULL* is a blank value in a database.

**Your goal.** Count the loans with no closing date.

**You are done when.** Your count matches `open_loans` in `answer_key.json`, and you can say how you tested for a blank value.


**Short scenario.** The co-op wants a count of loans that are still open (no closing date).

**You learn:** WHERE, IS NULL, COUNT

**Data:** `bfsi/clean/loans.csv (clean)`

**SQL task.** Count the loans where closed_on is empty.

**Python task.** Count rows in loans.csv where the closed_on field is an empty string.

**Expected result.** 24 open loans (answer_key.json: open_loans).

### B2 · Intermediate · Overdue open loans by branch (dirty data)

**Problem statement.**


**Who is asking.** Ganesh and the credit committee.

**The situation.** The committee wants to know how many loans are overdue in each branch. A loan is overdue when it is still open and its due date is before 1 November 2026. The loan file has been copied several times and has errors: a negative loan amount, blank amounts, an impossible date, and a repeated loan.

**Why it matters.** Overdue loans need a visit from a field officer. If the list is wrong, officers visit the wrong members and the real overdue loans are missed.

**The data.** `loans.csv` (dirty). Use `answer_key.json` to check your total. The clean data is in `clean/`.

**Words to know.** *Overdue* means late. *Negative amount* means a number below zero, which cannot be a loan. *Absolute value* means the number without its minus sign.

**Your goal.** Clean the file (remove repeats, drop rows with bad dates, fix the amount), then count overdue open loans per branch.

**You are done when.** The branch counts add up to `overdue_open_loans` in the answer key, and your log lists each fix with the number of rows changed.


**Short scenario.** Overdue = still open and due before 1 Nov 2026. The file has a negative amount, blank amounts, a bad date and a repeated loan.

**You learn:** Data cleaning, IS NULL, date comparison, GROUP BY

**Data:** `bfsi/loans.csv (dirty); answer_key.json`

**SQL task.** After cleaning, count overdue open loans per branch.

**Python task.** Remove repeats, drop rows with a bad date, fix the amount (use the absolute value of a negative), then count overdue open loans per branch.

**Expected result.** Branch counts that add up to overdue_open_loans = 10 in answer_key.json.

### B3 · Advanced · Recovery rate for closed loans

**Problem statement.**


**Who is asking.** Ganesh, for a board paper on how well the co-op gets its money back.

**The situation.** The co-op lent money on many loans that are now closed. Ganesh wants to know how much of that money came back, for each branch. This is called the recovery rate.

**Why it matters.** A low recovery rate in one branch is a warning sign for the credit policy in that branch.

**The data.** `loans.csv` and `repayments.csv` (clean). A repayment is linked to a loan by `loan_id`.

**Words to know.** *Recovery rate* means the money paid back divided by the money lent, shown as a percentage. *JOIN* links two tables with a shared key.

**Your goal.** For closed loans only, per branch: add up the amount lent, add up the repayments linked to those loans, and calculate the percentage.

**You are done when.** You have one row for each branch, the two totals, and a recovery % rounded to one decimal place. You can say why you only use closed loans.


**Short scenario.** How much of the money lent to closed loans came back? Show it per branch.

**You learn:** JOIN, aggregation, ratio, DIVIDE safely

**Data:** `bfsi/clean/loans.csv + repayments.csv`

**SQL task.** For closed loans only, per branch: total disbursed, total repaid (from repayments), and recovery % = repaid / disbursed x 100, rounded to 1 decimal.

**Python task.** Build a dictionary of repaid totals per loan_id, then compute the same figures per branch.

**Expected result.** Three branches with repaid below disbursed (a recovery % under 100).

## Healthcare

### H1 · Beginner · Visits by status

**Problem statement.**


**Who is asking.** Divya, the manager of Bright Smile Dental Clinic.

**The situation.** Divya wants to know how the visits this quarter ended. Some patients came, some did not come (no-show), and some cancelled in advance.

**Why it matters.** A high no-show rate costs the clinic money, because the dentist's time is wasted. Divya needs the count before deciding on reminder messages.

**The data.** `visits.csv` (clean) with `visit_id`, `patient_id`, `visit_date`, `treatment`, `fee`, `status`. The status is one of `completed`, `no_show` or `cancelled`.

**Words to know.** *Status* is the state of a visit. *GROUP BY* puts rows into piles with the same value.

**Your goal.** Count how many visits there are for each status.

**You are done when.** The three counts add up to `total_visits` in the answer key.


**Short scenario.** The clinic wants to see how many visits were completed, missed (no-show) or cancelled.

**You learn:** GROUP BY, COUNT

**Data:** `healthcare/clean/visits.csv (clean)`

**SQL task.** Count visits for each status.

**Python task.** Count each status value in visits.csv using a dictionary.

**Expected result.** Three statuses; they add up to total_visits.

### H2 · Intermediate · Revenue by treatment (dirty data)

**Problem statement.**


**Who is asking.** Divya, to decide which treatments earn the most.

**The situation.** Divya wants the money from completed visits only, for each treatment. The file has problems: the word "completed" sometimes has a space after it, some fees are blank, and some visit records were copied twice.

**Why it matters.** The fees show where the clinic's income comes from. A wrong total can lead to a bad decision about which equipment to buy.

**The data.** `visits.csv` (dirty). Check your result with `answer_key.json` (clean data).

**Words to know.** *Trim* removes spaces at the start and end of text. *Filter* keeps only some rows.

**Your goal.** Clean the status text, remove repeated visit IDs, then add up the fees for completed visits per treatment.

**You are done when.** Your treatment totals add up to `revenue_completed` in the answer key, and your log shows the fixes.


**Short scenario.** Completed visits only. Status has a trailing space in some rows, fees are blank in some, and rows repeat.

**You learn:** TRIM, filtering, GROUP BY, SUM

**Data:** `healthcare/visits.csv (dirty)`

**SQL task.** After cleaning, total fee per treatment for completed visits.

**Python task.** Strip spaces in status, remove repeated visit_id rows, then sum fees per treatment for completed visits.

**Expected result.** Treatment totals that add up to revenue_completed = 118100.

### H3 · Advanced · Patients who never completed a visit, and no-show rate by age

**Problem statement.**


**Who is asking.** Divya, for a patient care review.

**The situation.** Two questions. First: which patients never completed a visit? They may have been booked but never treated, and the clinic should call them. Second: what is the no-show rate in each age group?

**Why it matters.** Patients who never came back may be unhappy, or may have moved away. Age groups with high no-show rates may need reminders in a different way.

**The data.** `patients.csv` and `visits.csv` (clean). Link them by `patient_id`.

**Words to know.** *Anti-join* means finding rows in one table that have no match in another. *No-show rate* means no-shows divided by all visits.

**Your goal.** (a) List patients who have no completed visit. (b) For each age band, work out the no-show rate as a percentage.

**You are done when.** Both lists are complete, and the overall no-show rate is close to `no_show_rate_pct` in the answer key. You can explain how you found the patients with no match.


**Short scenario.** Find patients with no completed visit. Then find the no-show rate for each age band.

**You learn:** LEFT JOIN anti-join, subquery, rate calculation

**Data:** `healthcare/clean/patients.csv + visits.csv`

**SQL task.** (a) List patients with no completed visit. (b) For each age band, no-show rate % = no-shows / all visits x 100.

**Python task.** Build a set of patients who completed a visit, then list the others. Count no-shows per age band.

**Expected result.** No-show % per age band. Overall rate should match no_show_rate_pct in answer_key.json (about 12%).

## Education

### E1 · Beginner · Students per class

**Problem statement.**


**Who is asking.** Arjun, who runs Little Scholars Tuition Centre.

**The situation.** Arjun is planning the timetable for next term. Arjun needs to know how many students are in each class (6, 7, 8 and 9).

**Why it matters.** Class sizes decide how many teachers and rooms are needed.

**The data.** `students.csv` (clean) with `student_id`, `name`, `class`, `section`.

**Words to know.** *Count* means the number of rows in a group.

**Your goal.** Count the students in each class.

**You are done when.** The class counts add up to the number of students in the file.


**Short scenario.** The tuition centre wants to know how many students are in each class.

**You learn:** GROUP BY, COUNT

**Data:** `education/clean/students.csv (clean)`

**SQL task.** Count students in each class.

**Python task.** Count rows per class value in students.csv.

**Expected result.** Counts for classes 6, 7, 8 and 9 that add up to the number of students.

### E2 · Intermediate · Students below 75% attendance (dirty data)

**Problem statement.**


**Who is asking.** Arjun, for the parents' meeting.

**The situation.** Arjun wants to contact the parents of students who attend less than 75% of their school days. The attendance file is messy: some values say "yes" instead of 1, some dates are invalid, and some rows are repeated.

**Why it matters.** A student who misses too many classes falls behind. Early contact helps the family and the teacher.

**The data.** `attendance.csv` (dirty) with `student_id`, `date`, `present` (1 for present, 0 for absent). Check with `answer_key.json`.

**Words to know.** *Attendance %* is the days present divided by all days, times 100. *HAVING* filters groups after they are made.

**Your goal.** Clean the file (present must be 1 or 0, dates must be valid, repeats removed), then find each student's attendance % and list those below 75.

**You are done when.** The number of students below 75% equals `students_below_75pct` in the answer key.


**Short scenario.** Attendance file has 'yes' instead of 1, bad dates and repeated rows.

**You learn:** Cleaning, aggregation per student, HAVING

**Data:** `education/attendance.csv (dirty); answer_key.json`

**SQL task.** After cleaning, list students whose attendance % is below 75.

**Python task.** Clean the present column (yes=1, no=0), remove repeats, compute each student's %, print those below 75.

**Expected result.** Count of students below 75% equals students_below_75pct in answer_key.json.

### E3 · Advanced · Students who are both behind on fees and on attendance

**Problem statement.**


**Who is asking.** Arjun, to decide which families to call first.

**The situation.** A student who owes fees AND has low attendance is the most urgent case: the family may be struggling, and the child may be falling behind.

**Why it matters.** The centre must treat both problems together, not one at a time.

**The data.** `attendance.csv` and `fees.csv` (clean). The fees file has `fee_due` and `fee_paid`. Link both by `student_id`.

**Words to know.** *CTE* is a named step inside a query. *Outstanding* means money still owed.

**Your goal.** Calculate attendance % for each student, calculate fee owed for each student, then list students who meet both rules: attendance below 75% and fee owed above zero.

**You are done when.** Each student on your list shows an attendance % and an amount owed, and both rules are true for every row.


**Short scenario.** The owner wants the students who owe fees AND have attendance below 75%.

**You learn:** Two aggregates joined, CTE, filtering on both

**Data:** `education/clean/attendance.csv + fees.csv`

**SQL task.** Use two CTEs (attendance % per student, fee owed per student), join them, keep students who are below 75% and owe money.

**Python task.** Build two dictionaries (attendance %, fee owed) and print students who meet both rules.

**Expected result.** A short list. Each row has attendance below 75 and an amount owed above 0.

## Ecommerce

### C1 · Beginner · Orders by status

**Problem statement.**


**Who is asking.** Meera, who runs an online clothing shop.

**The situation.** Meera wants to see how many orders were delivered, returned, or cancelled in the last period.

**Why it matters.** Returns cost money and time. A quick count tells Meera whether the problem is growing.

**The data.** `orders.csv` (clean) with `order_id`, `customer_id`, `order_date`, `amount`, `status`.

**Words to know.** *Status* is the stage of an order.

**Your goal.** Count the orders for each status.

**You are done when.** The three counts add up to the total number of orders.


**Short scenario.** The online shop wants a count of delivered, returned and cancelled orders.

**You learn:** GROUP BY, COUNT

**Data:** `ecommerce/clean/orders.csv (clean)`

**SQL task.** Count orders for each status.

**Python task.** Count each status in orders.csv.

**Expected result.** Three statuses that add up to the total number of orders.

### C2 · Intermediate · Delivered revenue (dirty data)

**Problem statement.**


**Who is asking.** Meera, for the monthly sales review.

**The situation.** Meera wants the money from delivered orders only. The file has problems: some status words are in capitals (DELIVERED), some amounts are blank, and some order dates are impossible (30 February).

**Why it matters.** Revenue from delivered orders is the money the shop has actually earned. Including returned or cancelled orders would make the sales look too high.

**The data.** `orders.csv` (dirty). Check with `answer_key.json`.

**Words to know.** *Upper and lower case* means capitals and small letters. Computers treat "DELIVERED" and "delivered" as different words unless you change them.

**Your goal.** Make the status text the same case, drop blank amounts and impossible dates, then add up delivered amounts.

**You are done when.** Your total matches `delivered_revenue` in the answer key.


**Short scenario.** Some status values are in capitals, some amounts are blank, and some dates are invalid.

**You learn:** UPPER/LOWER, blanks, filtering, SUM

**Data:** `ecommerce/orders.csv (dirty); answer_key.json`

**SQL task.** After cleaning, total revenue of delivered orders.

**Python task.** Lower-case the status, drop blank amounts and invalid dates, then sum delivered amounts.

**Expected result.** delivered_revenue = 92712 from answer_key.json.

### C3 · Advanced · Return rate by city

**Problem statement.**


**Who is asking.** Meera, who wants to fix returns in the cities that return the most.

**The situation.** Some cities return more items than others. Meera wants a list of cities, ranked from the highest return rate to the lowest.

**Why it matters.** If one city returns many items, the sizing, the packing, or the delivery partner there may need a check.

**The data.** `orders.csv` and `customers.csv` (clean). Link them by `customer_id` to get each customer's city.

**Words to know.** *Return rate* is returned orders divided by all orders, times 100. *Rank* means the position of a row in the sorted list.

**Your goal.** For each city, calculate the return rate as a percentage, then sort from highest to lowest.

**You are done when.** You have one row for each city, and the top of the list is the city with the highest return rate. The overall return rate matches `return_rate_pct` in the answer key.


**Short scenario.** Which city returns the most orders? Ranked highest first.

**You learn:** JOIN, CASE, ratio, ORDER BY

**Data:** `ecommerce/clean/orders.csv + customers.csv`

**SQL task.** For each city, return rate % = returned orders / all orders x 100, ranked highest first.

**Python task.** Join orders to customers by customer_id, count returns and totals per city, print sorted by rate.

**Expected result.** Four cities, ranked. The overall return rate is return_rate_pct in answer_key.json.

## Hr

### HR1 · Beginner · Active headcount by department

**Problem statement.**


**Who is asking.** Meena, the operations manager at Pinnacle Tools, a workshop with several departments.

**The situation.** Meena wants to know how many people are working right now in each department. A worker who has left has a leaving date. A worker who is still there has a blank leaving date.

**Why it matters.** Headcount is needed for shift planning and for safety rules on how many people can work in each area.

**The data.** `employees.csv` (clean) with `emp_id`, `name`, `dept`, `salary`, `joined_on`, `left_on`.

**Words to know.** *Headcount* means the number of people. *Active* means still working here.

**Your goal.** Count the people with a blank `left_on` in each department.

**You are done when.** The department counts add up to `active` in the answer key.


**Short scenario.** How many people work in each department right now? (Active = no leaving date.)

**You learn:** WHERE IS NULL, GROUP BY, COUNT

**Data:** `hr/clean/employees.csv (clean)`

**SQL task.** Count active employees in each department.

**Python task.** Count rows where left_on is empty, grouped by dept.

**Expected result.** Counts per department that add up to active = 41.

### HR2 · Intermediate · Average salary by department (dirty data)

**Problem statement.**


**Who is asking.** Meena, for the salary review.

**The situation.** Meena wants the average salary per department for active workers. The salary column is messy: some salaries are written like "₹ 32,000" (with a rupee sign and a comma), some department names have an extra space, and some salaries are blank.

**Why it matters.** Average pay by department helps the company see where pay is out of line with other departments.

**The data.** `employees.csv` (dirty). Check with `answer_key.json`.

**Words to know.** *Average* means the total divided by the number of values. Blank values must be dropped, not counted as zero.

**Your goal.** Turn salaries into plain numbers, fix department spacing, keep only active workers, then find the average per department.

**You are done when.** Your five averages match `avg_salary_by_dept` in the answer key.


**Short scenario.** Salaries are written like '₹ 32,000'. Some department names have a trailing space. Some salaries are blank.

**You learn:** Text-to-number cleaning, TRIM, AVG

**Data:** `hr/employees.csv (dirty); answer_key.json`

**SQL task.** After cleaning, average salary per department for active employees, rounded to 1 decimal.

**Python task.** Strip the ₹ sign and commas, convert to int, fix department spacing, then average per department.

**Expected result.** Matches avg_salary_by_dept in answer_key.json.

### HR3 · Advanced · Attrition by department, ranked

**Problem statement.**


**Who is asking.** Meena, for the workforce plan.

**The situation.** Some departments lose more people than others. The company is spending a lot on hiring and training in those departments. Meena wants to know which department has the highest share of people leaving, ranked from the highest.

**Why it matters.** A high attrition rate (share of people leaving) can mean poor management, poor pay or hard work. Knowing where it happens is the first step to fixing it.

**The data.** `employees.csv` (clean). Attrition % = people who left divided by all people in the department, times 100.

**Words to know.** *Attrition* means people leaving. *RANK* gives the position in a list, where equal values share a position.

**Your goal.** For each department, count the total people and the people who left, work out the percentage, and rank them with 1 as the highest.

**You are done when.** You have five departments with ranks, and the overall attrition matches `attrition_pct` in the answer key.


**Short scenario.** Which department loses the highest share of its staff? Rank them.

**You learn:** CASE, ratio, RANK window function

**Data:** `hr/clean/employees.csv`

**SQL task.** For each department: total, left, attrition % (left / total x 100), and RANK by attrition % (1 = highest).

**Python task.** Count total and left per department, compute the %, and sort to create the rank.

**Expected result.** Five departments with ranks 1 to 5 (ties share a rank). Overall attrition is attrition_pct in answer_key.json.

## Logistics

### L1 · Beginner · On time or late?

**Problem statement.**


**Who is asking.** Rahul, who manages deliveries for a regional courier company.

**The situation.** Rahul wants to know how many shipments arrived on time and how many were late. A shipment is "on time" when its delay is one day or less.

**Why it matters.** The on-time rate is a key service measure. Customers and the company both watch it.

**The data.** `shipments.csv` (clean) with `shipment_id`, `route`, `dispatched_on`, `delay_days`, `cost`, `status`.

**Words to know.** *On time* and *late* are the two status values here.

**Your goal.** Count the shipments in each status.

**You are done when.** The two counts add up to `total_shipments` in the answer key.


**Short scenario.** How many shipments were on time, and how many were late?

**You learn:** GROUP BY, COUNT

**Data:** `logistics/clean/shipments.csv (clean)`

**SQL task.** Count shipments by status.

**Python task.** Count each status in shipments.csv.

**Expected result.** Two statuses that add up to total_shipments.

### L2 · Intermediate · Average delay per route (dirty data)

**Problem statement.**


**Who is asking.** Rahul, who wants to know which routes have the longest delays.

**The situation.** Route names are written in two ways: "Pune-Nashik" in some rows and "Pune - Nashik" in others. The computer sees these as two different routes. Some costs are blank.

**Why it matters.** If the route names are not the same, the averages are split into the wrong groups, and a bad route can hide.

**The data.** `shipments.csv` (dirty).

**Words to know.** *Standardise* means making the text look the same in every row. *Average delay* means the total delay days divided by the number of shipments.

**Your goal.** Fix the route names so each route has one name, remove repeated rows, then find the average delay for each route, to 2 decimal places.

**You are done when.** You have exactly four routes, and each average is a number you can explain.


**Short scenario.** Route names are written 'Pune-Nashik' in some rows and 'Pune - Nashik' in others. Some costs are blank.

**You learn:** Standardising text, AVG, GROUP BY

**Data:** `logistics/shipments.csv (dirty)`

**SQL task.** After standardising routes, average delay per route, rounded to 2 decimals.

**Python task.** Replace ' - ' with '-' in route, remove repeats, then average delay_days per route.

**Expected result.** Four routes. Averages should be close to each other (about 1 to 2 days).

### L3 · Advanced · On-time rate per route, ranked, with cost per shipment

**Problem statement.**


**Who is asking.** Rahul, for a contract review with the transport partners.

**The situation.** Rahul wants to compare the four routes on two things: the on-time rate and the average cost of each shipment. The routes should be ranked by on-time rate, best first.

**Why it matters.** A route that is cheap but late may cost more in lost customers. A route that is on time but expensive may need a better price.

**The data.** `shipments.csv` (clean).

**Words to know.** *On-time rate* is shipments on time divided by all shipments, times 100. *Average cost* is the total cost divided by the number of shipments.

**Your goal.** For each route, calculate the on-time rate, the average cost (rounded to whole rupees), and a rank by on-time rate, with 1 for the best.

**You are done when.** You have four routes ranked. The overall on-time rate matches `on_time_rate_pct` in the answer key.


**Short scenario.** Rank routes by on-time %, and show the average cost per shipment for each.

**You learn:** CASE, ratio, window RANK, ROUND

**Data:** `logistics/clean/shipments.csv`

**SQL task.** For each route: on-time %, average cost, and RANK by on-time % (highest first).

**Python task.** Compute on-time count and total per route, the average cost, and sort by on-time % descending.

**Expected result.** Four routes, ranked. Overall on-time % matches on_time_rate_pct in answer_key.json.

## Manufacturing

### M1 · Beginner · Units made per line

**Problem statement.**


**Who is asking.** Kavita, the plant manager at a factory with four production lines.

**The situation.** Kavita wants a simple total: how many units each line made in the period.

**Why it matters.** Output per line tells Kavita which line is busiest, and whether the lines are balanced.

**The data.** `production.csv` (clean) with `date`, `line`, `units_made`, `units_defective`.

**Words to know.** *Units made* is the total output. *Sum* means adding up all the values in a group.

**Your goal.** Add up `units_made` for each line.

**You are done when.** The four totals add up to `total_units` in the answer key.


**Short scenario.** The plant manager wants the total units made by each production line.

**You learn:** GROUP BY, SUM

**Data:** `manufacturing/clean/production.csv (clean)`

**SQL task.** Sum units_made for each line.

**Python task.** Add up units_made per line using a dictionary.

**Expected result.** Four lines whose totals add up to total_units.

### M2 · Intermediate · Defect rate per line (dirty data)

**Problem statement.**


**Who is asking.** Kavita, for the quality review.

**The situation.** The defect rate is the share of units that failed quality checks. Kavita wants the rate for each line. The file has problems: line names have different capital letters, some units are blank, and one date is impossible (31 November).

**Why it matters.** A line with a higher defect rate needs a check on its machines or its operators.

**The data.** `production.csv` (dirty). Check with `answer_key.json`.

**Words to know.** *Defect rate* is defective units divided by units made, times 100. *Standardise* means making text look the same in every row.

**Your goal.** Make the line names the same, drop blank units and impossible dates, then calculate the defect rate per line, to 2 decimal places.

**You are done when.** Your four rates match `defect_rate_pct_by_line` in the answer key.


**Short scenario.** Line names have different capitals in some rows. Some units are blank. One date is impossible (31 Nov).

**You learn:** Cleaning, ratio, GROUP BY

**Data:** `manufacturing/production.csv (dirty); answer_key.json`

**SQL task.** After cleaning, defect rate % per line = defective / made x 100, 2 decimals.

**Python task.** Standardise line names, drop blanks and bad dates, then compute the rate per line.

**Expected result.** Matches defect_rate_pct_by_line in answer_key.json.

### M3 · Advanced · Bad days and running totals

**Problem statement.**


**Who is asking.** Kavita, to find the bad days.

**The situation.** Kavita wants a list of the days on which a line's defect rate was above 3%. Kavita also wants a running total of units made for each line, so Kavita can see the output build up over time.

**Why it matters.** A bad day can point to a single event (a machine fault, a new worker, a new batch of material). Knowing the exact day helps find the cause.

**The data.** `production.csv` (clean).

**Words to know.** *Running total* adds each day's value to the total of the days before. *Window function* is a way to do this in SQL without losing rows.

**Your goal.** (a) Find each date and line where the defect rate is above 3%. (b) For each line, show a running total of units made, ordered by date.

**You are done when.** You have a list of bad days, and the running total at the end of each line equals that line's total from lab M1.


**Short scenario.** Find the days where a line's defect rate was above 3%. Then show a running total of units made per line.

**You learn:** CTE, HAVING-style filter, window SUM OVER (running total)

**Data:** `manufacturing/clean/production.csv`

**SQL task.** (a) Days and lines with defect rate above 3%. (b) Running total of units_made per line, ordered by date.

**Python task.** Compute the rate for each (date, line). Print those above 3. Then build a running total per line.

**Expected result.** A list of bad days. Running totals end at total_units when summed per line.

## Agriculture

### AG1 · Beginner · Quintals harvested per crop

**Problem statement.**


**Who is asking.** Kisan Agro Co-op, a fictional farmers' co-operative. The manager, Sanjay, is planning the storage needs for the season.

**The situation.** Members sell their harvest at the local market (mandi). Sanjay wants to know how much of each crop was harvested in total, to plan storage space.

**Why it matters.** Storage must be booked before the harvest. Too little space means crops spoil; too much means wasted rent.

**The data.** `harvests.csv` (clean) with `harvest_id`, `farmer_id`, `crop`, `season`, `quintal`, `mandi`, `price_per_quintal`, `sold_on`. One quintal is 100 kilograms.

**Words to know.** *Quintal* is a unit of weight (100 kg). *Season* is kharif (monsoon crop) or rabi (winter crop).

**Your goal.** Add up the quintals for each crop.

**You are done when.** The crop totals add up to `total_quintals` in the answer key.


**Short scenario.** How much of each crop did member farmers harvest in total?

**You learn:** GROUP BY, SUM

**Data:** `agriculture/clean/harvests.csv (clean)`

**SQL task.** Sum the quintal column for each crop.

**Python task.** Add up quintal for each crop in harvests.csv using a dictionary.

**Expected result.** One row per crop. The totals add up to total_quintals in answer_key.json.

### AG2 · Intermediate · Crop revenue from messy mandi records

**Problem statement.**


**Who is asking.** Sanjay, who wants to know the money each crop brings in.

**The situation.** Revenue for a sale is quintals multiplied by the price per quintal. The mandi records are messy: prices are written as "₹ 2,150", crop names have an extra space or capital letters, some quintal values are blank, and some sale dates are impossible (30 February).

**Why it matters.** The co-op decides which crops to promote to members based on this income.

**The data.** `harvests.csv` (dirty). Check with `answer_key.json`.

**Words to know.** *Multiply inside a sum* means working out each sale's value first, then adding them up.

**Your goal.** Clean the prices and crop names, drop blank and bad rows, then add up quintal times price for each crop.

**You are done when.** The crop totals add up to `total_revenue` in the answer key.


**Short scenario.** Revenue = quintal x price per quintal. The mandi records have ₹ signs in prices, crop names with extra spaces, blank quintals and bad dates.

**You learn:** Cleaning text and numbers, arithmetic inside SUM, GROUP BY

**Data:** `agriculture/harvests.csv (dirty); answer_key.json`

**SQL task.** After cleaning, total revenue per crop (quintal x price_per_quintal).

**Python task.** Clean prices (remove ₹ and commas), trim crop names, drop blank quintals and bad dates, then add up quintal x price per crop.

**Expected result.** Crop totals that add up to total_revenue in answer_key.json.

### AG3 · Advanced · Average farmer income by village

**Problem statement.**


**Who is asking.** Sanjay, for a report to the co-op board on how the four villages compare.

**The situation.** The board wants to know how much income a typical farmer earns in each village. Some villages have many farmers who sell a lot, others have fewer.

**Why it matters.** Villages with low incomes may need help with better seeds, storage or market access.

**The data.** `farmers.csv` and `harvests.csv` (clean). Link them by `farmer_id`.

**Words to know.** *Average per farmer* means you first add up each farmer's income, then average those totals. This is different from averaging each sale, because a farmer with many sales would count more.

**Your goal.** Work out each farmer's total income. Then find the average of those totals for each village. Ignore farmers with no sales.

**You are done when.** You have one average per village, and you can explain why the average is per farmer.


**Short scenario.** The co-op wants to compare villages by how much a typical farmer earns from sales. Average over farmers who sold something.

**You learn:** Two-level aggregation (per farmer, then per village), CTE, JOIN

**Data:** `agriculture/clean/farmers.csv + harvests.csv`

**SQL task.** Step 1: revenue per farmer. Step 2: average of that revenue for farmers in each village. Ignore farmers with no harvest.

**Python task.** Build revenue per farmer_id, then group farmers by village and average. Print villages sorted by average.

**Expected result.** Four villages with an average income each. Explain why you average per farmer, not per harvest row.

## Telecom

### TC1 · Beginner · Subscribers by plan and status

**Problem statement.**


**Who is asking.** Priya, who runs marketing for NetLink, a fictional mobile operator.

**The situation.** NetLink has three plans. Priya wants to know how many customers are on each plan, and how many have left (churned) in each plan.

**Why it matters.** A plan with many leavers needs a better offer. A plan with many customers is the one to protect.

**The data.** `subscribers.csv` (clean) with `sub_id`, `name`, `city`, `plan`, `activated_on`, `status` (`active` or `churned`).

**Words to know.** *Churn* means customers stopping the service. *Combination* means grouping by two columns at once.

**Your goal.** Count the subscribers for each pair of plan and status.

**You are done when.** The counts add up to the number of subscribers in the file.


**Short scenario.** Marketing wants to know how many customers are on each plan, and how many have left (churned).

**You learn:** GROUP BY with two columns, COUNT

**Data:** `telecom/clean/subscribers.csv (clean)`

**SQL task.** Count subscribers for each combination of plan and status.

**Python task.** Count (plan, status) pairs in subscribers.csv.

**Expected result.** Counts for each plan and status. All counts add up to the number of subscribers.

### TC2 · Intermediate · Monthly billing totals (dirty bills)

**Problem statement.**


**Who is asking.** Priya, for the monthly revenue report.

**The situation.** NetLink wants the total billed amount per month. The billing file is messy: some amounts have "Rs" in front, some are blank, some amounts are negative (a credit that was typed wrongly), some months are written as "Aug 2026" and not "2026-08", and some bills are repeated.

**Why it matters.** Revenue must be correct for the finance team and for the board.

**The data.** `bills.csv` (dirty). Check with `answer_key.json`.

**Words to know.** *Standardise dates* means making every month look the same, like 2026-08. *Negative bill* is not a normal bill, and must be checked, not added in.

**Your goal.** Clean the months and amounts, decide what to do with negative and blank rows (write down your choice), remove repeats, then add up the amounts for each month.

**You are done when.** The totals add up to `total_billed` in the answer key, or your log explains each difference.


**Short scenario.** Bills are messy: some amounts have 'Rs', some are blank, some are negative (credits recorded wrongly), some months use 'Aug 2026' instead of '2026-08', and some rows repeat.

**You learn:** Cleaning, date formats, GROUP BY by month

**Data:** `telecom/bills.csv (dirty); answer_key.json`

**SQL task.** After cleaning, total billed amount per month, in month order.

**Python task.** Standardise month to YYYY-MM, convert amounts to int, drop blanks, remove repeats, sum by month.

**Expected result.** Four months. Totals add up to total_billed in answer_key.json.

### TC3 · Advanced · Churn and unpaid bills by city, without double counting

**Problem statement.**


**Who is asking.** Priya, for a city-by-city review of churn and payment problems.

**The situation.** For each city, Priya wants two numbers: the churn % (share of subscribers who left) and the number of bills that are still unpaid. A common mistake is to join the two tables first, which makes the counts too big.

**Why it matters.** Cities with high churn and many unpaid bills may need a visit from the sales team.

**The data.** `subscribers.csv` and `bills.csv` (clean). Link them by `sub_id`.

**Words to know.** *Fan-out* means a join multiplies rows, so a count gives the wrong answer. *COALESCE* replaces a blank with a value, like 0.

**Your goal.** Calculate the churn % per city and the unpaid count per city in separate steps, then put them side by side. Show 0 where a city has no unpaid bills.

**You are done when.** You have one row per city, and the total unpaid count matches `unpaid_bills` in the answer key.


**Short scenario.** For each city: churn % among subscribers, and the number of unpaid bills. A naive JOIN double counts, so compute each figure separately.

**You learn:** Avoiding fan-out in JOINs, LEFT JOIN, COALESCE, CTEs

**Data:** `telecom/clean/subscribers.csv + bills.csv`

**SQL task.** Use two CTEs (churn % per city, unpaid bills per city) and join them. Show zero where a city has no unpaid bills.

**Python task.** Compute churn % per city and unpaid bill count per city separately, then print one row per city.

**Expected result.** One row per city. The unpaid total equals unpaid_bills in answer_key.json.

## Insurance

### IN1 · Beginner · Claims by type and decision

**Problem statement.**


**Who is asking.** Ravi, a claims manager at Shield General Insurance, a fictional company.

**The situation.** Claims come in for three types of policy: motor (cars and bikes), health, and home. Ravi wants to see how many of each type were approved, rejected or are still pending.

**Why it matters.** A high rejection rate for one type may mean customers do not understand the policy, and the wording needs to change.

**The data.** `claims.csv` (clean) with `claim_id`, `holder_id`, `policy_type`, `claimed_amount`, `approved_amount`, `status`, `filed_on`.

**Words to know.** *Pending* means no decision yet. *Rejected* means the company did not pay.

**Your goal.** Count the claims for each policy type and status.

**You are done when.** The counts add up to `total_claims` in the answer key.


**Short scenario.** How many claims were filed for motor, health and home policies, and how many were approved, rejected or are still pending?

**You learn:** GROUP BY two columns, COUNT

**Data:** `insurance/clean/claims.csv (clean)`

**SQL task.** Count claims for each policy_type and status.

**Python task.** Count each (policy_type, status) pair in claims.csv.

**Expected result.** Counts per type and status that add up to total_claims.

### IN2 · Intermediate · Money paid out by policy type (dirty claims)

**Problem statement.**


**Who is asking.** Ravi, for the monthly payout report.

**The situation.** Ravi needs the total money paid out (approved amounts) for each policy type. The claims file is messy: status words have different capitals, amounts have rupee signs, some approved claims have a blank approved amount, and one filed date is impossible (31 November).

**Why it matters.** The payout total must match the money the finance team sends out.

**The data.** `claims.csv` (dirty). Check with `answer_key.json`.

**Words to know.** *Payout* is money the company pays to customers. *Approved amount* is the amount the company agreed to pay, which can be less than the claimed amount.

**Your goal.** Clean the status and amounts, decide what to do with approved claims that have no approved amount (write down your choice), then add up approved amounts per policy type.

**You are done when.** Your three totals match the clean totals in the answer key, or your log explains the difference.


**Short scenario.** The claims file has 'approved'/'Approved' spelling mixed up, amounts with ₹ signs, blank approved amounts for approved claims, and an impossible date (31 Nov).

**You learn:** Cleaning, filtering on a status, SUM by group

**Data:** `insurance/claims.csv (dirty); answer_key.json`

**SQL task.** After cleaning, total approved_amount for approved claims, per policy type.

**Python task.** Standardise status, convert amounts, drop approved claims with blank approved amounts, then sum by policy_type.

**Expected result.** Three totals that add up to the approved money. Check the method, not only the number.

### IN3 · Advanced · Settlement ratio by age band

**Problem statement.**


**Who is asking.** Ravi, for a fairness review of claims by age group.

**The situation.** When a claim is approved, the company does not always pay the full amount. The settlement ratio is the approved amount divided by the claimed amount. Ravi wants to know this ratio for each age band, using only approved claims.

**Why it matters.** If one age group gets much lower settlements, the company must check whether the rules are applied fairly.

**The data.** `claims.csv` and `policyholders.csv` (clean). Link them by `holder_id` to get each policyholder's age band.

**Words to know.** *Ratio of sums* means adding up all approved amounts, adding up all claimed amounts, then dividing. *Average of ratios* means averaging each row's ratio. The two can give different answers. The correct one here is the ratio of sums, because big claims should count more.

**Your goal.** For approved claims only, work out the settlement % for each age band.

**You are done when.** You have one percentage for each age band, and you can explain why you did not average the row ratios.


**Short scenario.** For approved claims, what share of the claimed amount was actually paid (settlement ratio), for each age band?

**You learn:** JOIN to a second table, ratio of sums (not average of ratios), GROUP BY

**Data:** `insurance/clean/claims.csv + policyholders.csv`

**SQL task.** Join claims to policyholders. For approved claims, per age band: settlement % = sum(approved) / sum(claimed) x 100, 1 decimal.

**Python task.** Join by holder_id, sum approved and claimed per age band, then divide. Explain why you do not average the row ratios.

**Expected result.** Three age bands with a settlement % each. The overall figure matches settlement_ratio_pct in answer_key.json.

## Public_Sector

### PS1 · Beginner · Enrolled beneficiaries by district

**Problem statement.**


**Who is asking.** Anita, an officer at the district welfare office running the fictional "Sahay" scheme.

**The situation.** Anita wants to know how many people are enrolled in each of the four districts. This tells the office where the next awareness drive is needed.

**Why it matters.** Benefits are only useful if people know about them. Low enrolment in a district means more outreach is needed there.

**The data.** `beneficiaries.csv` (clean) with `ben_id`, `name`, `district`, `scheme_group`, `enrolled_on`.

**Words to know.** *Beneficiary* is a person who receives help from the scheme. *Enrolled* means registered in the scheme.

**Your goal.** Count the beneficiaries in each district.

**You are done when.** The district counts add up to the number of beneficiaries in the file.


**Short scenario.** How many people are enrolled in the scheme in each district?

**You learn:** GROUP BY, COUNT

**Data:** `public_sector/clean/beneficiaries.csv (clean)`

**SQL task.** Count beneficiaries in each district.

**Python task.** Count rows per district in beneficiaries.csv.

**Expected result.** Four districts whose counts add up to the number of beneficiaries.

### PS2 · Intermediate · Money paid per month (dirty payments)

**Problem statement.**


**Who is asking.** Anita, for the monthly report to the state office.

**The situation.** The scheme pays money to beneficiaries each month. Anita needs the total paid, month by month. The payments file is messy: "PAID" and "paid" are both used, some amounts have "Rs", some are blank, months are written as "Aug-2026" in some rows, and some rows are repeated.

**Why it matters.** The state office checks these totals against the bank statements. A wrong total causes an audit query.

**The data.** `payments.csv` (dirty). Check with `answer_key.json`.

**Words to know.** *Paid* is a payment that reached the beneficiary's bank account. Failed payments must not be added to the paid total.

**Your goal.** Clean the status, month and amounts, remove blanks and repeats, then add up paid amounts per month.

**You are done when.** The totals add up to `paid_total` in the answer key.


**Short scenario.** Payment records: status written as 'PAID' or 'paid', some amounts with 'Rs', some blank, some months as 'Aug-2026', and repeated rows.

**You learn:** Cleaning, filtering on status, GROUP BY by month

**Data:** `public_sector/payments.csv (dirty); answer_key.json`

**SQL task.** After cleaning, total of paid amounts per month, in month order.

**Python task.** Lower-case status, standardise month, convert amounts, drop blanks and repeats, then sum paid amounts per month.

**Expected result.** Three months. Totals add up to paid_total in answer_key.json.

### PS3 · Advanced · Failed payment rate by district

**Problem statement.**


**Who is asking.** Anita, who wants to find where payments are failing.

**The situation.** Some payments fail, for example because a bank account number is wrong. Anita wants the failed-payment rate for each district, ranked from the highest. The district with the highest rate is the first place to check bank details.

**Why it matters.** Failed payments mean people wait for their money. This can cause real hardship for families who depend on the scheme.

**The data.** `payments.csv` and `beneficiaries.csv` (clean). Link them by `ben_id` to find each payment's district.

**Words to know.** *Failed rate* is failed payments divided by all payments, times 100.

**Your goal.** Join the two tables. For each district, work out the failed %, then sort from the highest.

**You are done when.** You have four districts ranked, and the overall rate matches `failed_rate_pct` in the answer key.


**Short scenario.** Payments fail sometimes. Which districts have the highest failed-payment rate? This tells the team where to check bank details first.

**You learn:** JOIN to a second table, CASE for counting, rate, ORDER BY

**Data:** `public_sector/clean/payments.csv + beneficiaries.csv`

**SQL task.** Join payments to beneficiaries. For each district: failed % = failed payments / all payments x 100, 1 decimal, highest first.

**Python task.** Map each ben_id to its district, count failed and total payments per district, compute the %, then sort.

**Expected result.** Four districts ranked. The overall rate matches failed_rate_pct in answer_key.json.

## Real_Estate

### RE1 · Beginner · Properties by locality and size

**Problem statement.**


**Who is asking.** Kiran, a listings manager at Homeline Realty, a fictional agency.

**The situation.** The agency lists homes in four localities, with different numbers of bedrooms (BHK means bedrooms, hall and kitchen). Kiran wants to see the mix: how many properties of each size are listed in each locality.

**Why it matters.** If one locality has few 3 BHK homes, buyers looking for family homes will go elsewhere. The agency can then list more homes of that kind.

**The data.** `properties.csv` (clean) with `prop_id`, `locality`, `bhk`, `area_sqft`.

**Words to know.** *BHK* means the number of bedrooms. *sqft* means square feet (the area of the home).

**Your goal.** Count the properties for each pair of locality and BHK.

**You are done when.** The counts add up to the number of properties in the file.


**Short scenario.** How many properties does the agency list in each locality, for each number of bedrooms (BHK)?

**You learn:** GROUP BY two columns, COUNT

**Data:** `real_estate/clean/properties.csv (clean)`

**SQL task.** Count properties for each locality and bhk.

**Python task.** Count (locality, bhk) pairs in properties.csv.

**Expected result.** Counts per locality and BHK that add up to the number of properties.

### RE2 · Intermediate · Sales value by locality (dirty sales)

**Problem statement.**


**Who is asking.** Kiran, for the quarterly sales report.

**The situation.** Kiran wants the total value of sales in each locality. The sales file is messy: some prices are written like "Rs 1,23,000" (with Indian comma style), some prices are negative (a typing mistake), some days-on-market values are blank, and one sale date is impossible (31 June). Each sale links to a property, which has the locality.

**Why it matters.** The total sale value is reported to the owners of the agency. It must be right.

**The data.** `sales.csv` (dirty) and `properties.csv` (clean). Link them by `prop_id`. Check with `answer_key.json`.

**Words to know.** *Negative price* cannot be right for a sale, so the row must be checked, not added in. *Indian comma style* means commas in the pattern 1,23,000.

**Your goal.** Clean the prices and dates, remove the negative and impossible rows (write down the reason), join to get the locality, then add up sale prices per locality.

**You are done when.** The four totals add up to `total_sale_value` in the answer key.


**Short scenario.** Sales records have prices written as 'Rs 1,23,000', some negative prices (a data entry mistake), blank days-on-market and an impossible date (31 June).

**You learn:** Cleaning, JOIN to a second table, SUM by group

**Data:** `real_estate/sales.csv (dirty) + properties.csv; answer_key.json`

**SQL task.** After cleaning, total sale_price per locality. Join sales to properties to get the locality.

**Python task.** Clean prices, drop negative and bad-date rows, map prop_id to locality, sum prices per locality.

**Expected result.** Four localities whose totals add up to total_sale_value in answer_key.json.

### RE3 · Advanced · Price per square foot and time to sell, by locality

**Problem statement.**


**Who is asking.** Kiran, for the pricing review.

**The situation.** Kiran wants two numbers for each locality: the price per square foot (the total value of sales divided by the total area sold), and the average number of days a home stayed on the market before it sold.

**Why it matters.** Price per square foot lets buyers compare homes of different sizes. Days on market shows how fast a locality is selling.

**The data.** `sales.csv` and `properties.csv` (clean). Link by `prop_id`. Use `answer_key.json` to check.

**Words to know.** *Price per sqft* is the total price divided by the total area. *Days on market* is the number of days from listing to sale.

**Your goal.** Join the two tables. For each locality, calculate the average days on market (1 decimal) and the price per square foot (1 decimal). Use the total price divided by the total area, not the average of each home's price per square foot.

**You are done when.** You have one row per locality, and both numbers match the answer key. You can explain why you divide totals and do not average the individual prices per square foot.


**Short scenario.** The agency wants two numbers per locality: price per square foot (total value / total area sold) and average days on market.

**You learn:** JOIN, ratio of sums, AVG, why ratio of sums is correct

**Data:** `real_estate/clean/sales.csv + properties.csv`

**SQL task.** Join sales to properties. Per locality: average days_on_market (1 decimal) and price per sqft = sum(sale_price) / sum(area_sqft) (1 decimal).

**Python task.** Build totals per locality from the joined rows, then compute the two figures. Compare with answer_key.json.

**Expected result.** Four localities. Price per sqft and days on market match answer_key.json.
