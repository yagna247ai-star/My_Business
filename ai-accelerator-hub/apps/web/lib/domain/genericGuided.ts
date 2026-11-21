/**
 * Guided steps for the AI-Powered Data Analytics journey (the generic 45-day syllabus,
 * docs/data-analytics-journey/days). Each day's "Your turn" becomes steps: the idea → what to do → a check → points.
 * Checks use the lesson's own expected results where it has them (the trainer's answer key).
 */
import type { GuidedStep, StepCheck } from './guidedSteps';

const ans = (prompt: string, hint?: string): StepCheck => ({ kind: 'answer', prompt, ...(hint ? { hint } : {}) });
const shot = (prompt: string): StepCheck => ({ kind: 'screenshot', prompt });
const tick = (prompt: string): StepCheck => ({ kind: 'tick', prompt });
const look = (...w: string[]) => w.map(x => `(?=[\\s\\S]*${x})`).join('');
const paste = (prompt: string, pattern: string, sample: string, fail: string): StepCheck => ({ kind: 'paste', prompt, pattern, sample, fail });
const sql = (prompt: string, needs: string[], sample: string, fail: string) => paste(prompt, look('SELECT', ...needs), sample, fail);
const S = (title: string, concept: string, d: string | string[], check: StepCheck): GuidedStep => ({ title, concept, do: Array.isArray(d) ? d : [d], check });

export const GENERIC_GUIDED: Record<number, GuidedStep[]> = {
  1: [
    S('What a shop records', 'Data is a record of something that happened. A bill records what was bought, how much it cost and when. Every shop creates data all day, often without noticing.', 'Write 10 things a grocery shop records in one day, for example a bill or a stock count.', ans('Ten things a grocery shop records in one day', 'bills, stock counts, supplier invoices')),
    S('Data in your own day', 'You create data too: calls, payments, messages. Seeing it in your own life makes it easier to spot in a business.', 'Write 5 things you record in your own day.', ans('Five things you record in your own day', 'a UPI payment, a phone call')),
    S('A measurable question', 'A question data can answer has a measure (what you count), a time period and a breakdown. “Are sales slow?” has none; “What was each branch’s revenue per week in October?” has all three.', 'Take one of Sunita’s problems and rewrite it as a measurable question.', ans('Sunita’s question with a measure, a time period and a breakdown', 'revenue per branch per week in October')),
  ],
  2: [
    S('Three shapes of data', 'Structured data fits a table with fixed columns (a timetable). Semi-structured data has labels but a changing shape (JSON). Unstructured data has no fixed shape (chat, photos). Quick test: can it be one row per visit?', 'Label each of the clinic’s four sources: paper form, appointment spreadsheet, WhatsApp, X-ray photos.', ans('Each source with its type: structured, semi-structured or unstructured', 'spreadsheet: structured; WhatsApp: unstructured')),
    S('Numbers and words', 'Quantitative values are numbers you can add (fees, visits). Qualitative values are words that name groups (treatment, comment). Every analysis needs both: a number to measure and a word to group by.', 'For each source, mark one number you can add up and one word that names a group.', ans('For each source: one number and one group word', 'fee; treatment name')),
    S('Turning chat into a table', 'Unstructured data must be turned into a table before you can count it. You copy out the facts you need.', 'For the WhatsApp message, write the two facts you would copy out before you could count the money.', ans('The two facts you would copy out of the WhatsApp message', 'patient name and amount')),
  ],
  3: [
    S('Six steps from data to answer', 'Every answer goes through collect, clean, process, analyse, visualise and report. Skipping cleaning is how the co-op counted payments twice and listed paid members as late.', 'For a small shop you pick, write one place the data comes from at each of the six steps.', ans('Where the data comes from at each of the six steps', 'collect: billing book; clean: …')),
    S('A check at every step', 'A check is a quick test that catches a mistake, like “the bill total equals the sum of its items” or “the app count matches the register count”.', 'For each step, write one check that would catch a mistake.', ans('One check for each of the six steps', 'bill total equals the sum of its items')),
    S('The hardest mistake to notice', 'Some mistakes look fine on the report: the shape is right but the input is wrong. Knowing where they hide tells you where to check hardest.', 'Which step would be hardest to notice a mistake in? Explain in two sentences.', ans('The hardest step to notice a mistake in, and why')),
  ],
  4: [
    S('A clean fee sheet', 'A computer can count a sheet only if it follows simple rules: one header row, one record per row, one kind of value per column.', 'Make a fee sheet with 10 students in Excel or Google Sheets.', shot('Your fee sheet with 10 students and a header row')),
    S('Save it as CSV', 'A CSV is plain text: one line per record, commas between columns. It keeps the values and drops colours and formulas.', ['Save the sheet as CSV.', 'Open the CSV in Notepad (or TextEdit) and copy the first three lines.'], paste('Paste the first three lines of your CSV', '^[^,\\n]+(,[^,\\n]*)+\\n[^\\n]+,', 'name,class,fee\nAsha,7,1200', 'Paste the header line and two data lines; they should have commas between columns.')),
    S('What breaks a count', 'A total row looks like one more student; “Yes / Y / 1” in one column is three different values to a computer. Finding these early saves wrong reports later.', 'Find three problems that would break a count.', ans('Three problems in a sheet that would break a count', 'a total row; Yes/Y/1 mixed')),
    S('Questions for five businesses', 'Every domain has its own measurable questions. Practising across domains trains you to see the measure, period and breakdown anywhere.', 'Write one question for a bank, a clinic, a school, a shop and an online store.', ans('One measurable question each for a bank, clinic, school, shop and online store', 'bank: which borrowers missed two repayments this quarter?')),
  ],
  5: [
    S('Three linked tables', 'A database splits one messy sheet into tables that each hold one kind of thing. A primary key is a unique number on each row, like a roll number.', 'Create the customers, products and orders tables in SQLite (or any free database).', paste('Paste your CREATE TABLE statements', look('CREATE TABLE', 'PRIMARY KEY'), 'CREATE TABLE customers (id INTEGER PRIMARY KEY, name TEXT);', 'Paste the CREATE TABLE statements; each table needs a PRIMARY KEY.')),
    S('Add rows', 'An order stores only the customer’s number and the product’s number. A price change then happens in one place only.', 'Add 3 customers, 4 products and 5 orders.', paste('Paste SELECT COUNT(*) FROM orders and its result', '\\b5\\b', '5', 'The orders table should have 5 rows.')),
    S('Foreign keys stop bad data', 'A foreign key points to a row in another table. The database refuses an order for a customer who does not exist. In SQLite turn it on with PRAGMA foreign_keys = ON;', 'Try to add an order for customer 999.', paste('Paste the error message you got', 'FOREIGN KEY|foreign key|constraint', 'FOREIGN KEY constraint failed', 'Paste the error. If there was none, run PRAGMA foreign_keys = ON; and try again.')),
    S('Draw the tables', 'A drawing of boxes and arrows (an ER diagram) is how analysts explain a database in one glance.', 'Draw the three tables as boxes, with arrows from orders to customers and products.', shot('Your drawing of the three tables and their arrows')),
  ],
  6: [
    S('SELECT and WHERE', 'SELECT chooses columns, FROM the table, WHERE keeps only some rows. Text values need quotes: WHERE status = \'active\'.', 'Show the name, department number and salary of every active worker.', sql('Paste your query and how many rows it returned', ['WHERE', '\\d'], "SELECT name, dept_id, salary FROM staff WHERE status = 'active'; -- 212 rows", 'Paste the query (with WHERE) and the row count.')),
    S('DISTINCT', 'DISTINCT removes repeats, like writing each class name once on the board.', 'List each department that has at least one active worker, once each.', sql('Paste your query and how many rows it returned', ['DISTINCT'], "SELECT DISTINCT dept_id FROM staff WHERE status = 'active';", 'The query should use DISTINCT.')),
    S('ORDER BY and LIMIT', 'LIMIT only makes sense with ORDER BY; otherwise the rows come back in any order.', 'Show the 10 newest active workers.', sql('Paste your query', ['ORDER BY', 'LIMIT'], 'SELECT … ORDER BY joined_on DESC LIMIT 10;', 'Use ORDER BY and LIMIT.')),
    S('Combine filters', 'Several conditions in WHERE narrow the list to exactly what the manager asked for.', 'Show active workers in department 3 who earn more than 25,000, and write one sentence for Meena about the result.', sql('Paste your query, the row count and your sentence for Meena', ['WHERE', '25000|25,000'], "SELECT … WHERE status = 'active' AND dept_id = 3 AND salary > 25000;", 'The query should filter on salary above 25000.')),
  ],
  7: [
    S('BETWEEN', 'BETWEEN 20000 AND 50000 includes both ends. It reads like the range you mean.', 'Find loans with an amount from 20,000 to 50,000, both ends included.', sql('Paste your query and the row count', ['BETWEEN'], 'SELECT … WHERE amount BETWEEN 20000 AND 50000;', 'Use BETWEEN.')),
    S('NULL means unknown', 'A missing value is NULL, “we do not know”. = NULL is never true; you must write IS NULL. That is why the committee’s list was missing open loans.', 'Find open loans (closed_on is blank) with a due date before 2026-11-01, in any branch except Solapur.', sql('Paste your query and the row count', ['IS NULL'], "SELECT … WHERE closed_on IS NULL AND due_date < '2026-11-01' AND branch <> 'Solapur';", 'Open loans need closed_on IS NULL.')),
    S('LIKE and OR', 'LIKE \'S%\' means “starts with S”; % stands for any letters. OR keeps a row when either rule is true.', 'Find branches whose name starts with S or N.', sql('Paste your query', ['LIKE'], "SELECT DISTINCT branch FROM loans WHERE branch LIKE 'S%' OR branch LIKE 'N%';", 'Use LIKE.')),
    S('Why = NULL fails', 'Explaining a trap in your own words is how you make sure you will not fall into it.', 'In one sentence, explain why = NULL gives a wrong answer.', ans('Why = NULL gives a wrong answer', 'a missing value is not equal to anything')),
  ],
  8: [
    S('GROUP BY and SUM', 'GROUP BY makes one pile per group; SUM adds each pile. The owner gets a short summary instead of 300 rows.', 'Find the total active salary for each department.', sql('Paste your query and one sentence for the owner', ['GROUP BY', 'SUM'], 'SELECT dept_id, SUM(salary) FROM staff WHERE … GROUP BY dept_id;', 'Use GROUP BY and SUM.')),
    S('COUNT, AVG and MAX', 'Several aggregates can describe each group at once. The highest is always at least the average.', 'Find the headcount, average and highest salary for each department.', sql('Paste your query', ['COUNT', 'AVG', 'MAX'], 'SELECT dept_id, COUNT(*), AVG(salary), MAX(salary) FROM staff GROUP BY dept_id;', 'Use COUNT, AVG and MAX.')),
    S('HAVING filters groups', 'WHERE filters rows before the piles form; HAVING removes whole piles after.', 'Find departments whose average salary is above 30,000.', sql('Paste your query', ['HAVING'], 'SELECT dept_id, AVG(salary) FROM staff GROUP BY dept_id HAVING AVG(salary) > 30000;', 'Use HAVING.')),
    S('COUNT of a column', 'COUNT(*) counts every row; COUNT(left_on) counts only rows where a leaving date exists.', 'Count the workers who have left, in each department.', sql('Paste your query and one sentence for the owner', ['COUNT'], 'SELECT dept_id, COUNT(left_on) FROM staff GROUP BY dept_id;', 'Use COUNT on the leaving date.')),
  ],
  9: [
    S('LEFT JOIN keeps everyone', 'A LEFT JOIN keeps every row on the left even with no match on the right, so patients with zero visits still appear.', 'List every patient with their number of visits, including zero.', sql('Paste your query and the row count', ['LEFT JOIN', 'COUNT'], 'SELECT p.id, COUNT(v.id) FROM patients p LEFT JOIN visits v ON … GROUP BY p.id;', 'Use LEFT JOIN with COUNT.')),
    S('Only one visit', 'Grouping after a join lets you filter on how many visits each patient had.', 'Find patients who had only their first visit.', sql('Paste your query and the row count', ['JOIN'], 'SELECT p.id FROM patients p JOIN visits v ON v.patient_id = p.id GROUP BY p.id HAVING COUNT(v.id) = 1;', 'Join patients to visits.')),
    S('Find what is missing', 'LEFT JOIN, then keep rows where the right side IS NULL: that finds things with no match, like treatments nobody booked.', 'Find treatments that never appear in the visits.', sql('Paste your query and the row count', ['LEFT JOIN', 'IS NULL'], 'SELECT t.name FROM treatments t LEFT JOIN visits v ON … WHERE v.id IS NULL;', 'Use LEFT JOIN and IS NULL.')),
    S('INNER vs LEFT', 'INNER JOIN drops rows with no match; LEFT JOIN keeps them with blanks. That is why their row counts differ.', 'In two sentences, explain why INNER JOIN and LEFT JOIN give different numbers of rows.', ans('Why INNER JOIN and LEFT JOIN return different row counts', 'INNER drops rows with no match')),
  ],
  10: [
    S('CASE WHEN bands', 'CASE WHEN sorts rows into bands with if-then rules. Always add ELSE, or rows that match no rule become blank.', 'Count the orders in each size band (small, medium, large).', sql('Paste your query', ['CASE', 'ELSE'], "SELECT CASE WHEN amount < 5000 THEN 'small' … ELSE 'large' END AS band, COUNT(*) …", 'Use CASE WHEN with an ELSE.')),
    S('A subquery', 'A subquery is a question inside a question: find the average first, then who beats it.', 'Find customers whose total spend is above the average customer’s spend.', sql('Paste your query', ['AVG'], 'SELECT customer_id, SUM(amount) … HAVING SUM(amount) > (SELECT AVG(total) FROM …);', 'Compare with the average using AVG.')),
    S('A CTE step', 'WITH names a step you can check on its own: first monthly revenue, then the top month.', 'Work out monthly revenue, then find the month with the highest revenue.', sql('Paste your query', ['WITH'], 'WITH monthly AS (SELECT …) SELECT * FROM monthly ORDER BY revenue DESC LIMIT 1;', 'Use WITH for the monthly step.')),
    S('UNION ALL', 'UNION ALL stacks two small results into one report table.', 'Stack “small orders” and “large orders” as two rows with columns metric and value, then write a paragraph for the accountant.', sql('Paste your query and your paragraph', ['UNION ALL'], "SELECT 'small orders' AS metric, COUNT(*) AS value … UNION ALL SELECT 'large orders', …", 'Use UNION ALL.')),
  ],
  11: [
    S('Rank within a group', 'A window function adds a rank to each row and keeps every row. PARTITION BY makes a separate ranking per branch and month. Filter the rank in a later step, not in WHERE.', 'Find the top product in each branch, each month.', sql('Paste your query', ['OVER', 'PARTITION BY'], 'WITH r AS (SELECT …, ROW_NUMBER() OVER (PARTITION BY branch, month ORDER BY revenue DESC) AS rn …) SELECT * FROM r WHERE rn = 1;', 'Use a window function with PARTITION BY.')),
    S('RANK vs DENSE_RANK', 'RANK gives 1, 2, 2, 4; DENSE_RANK gives 1, 2, 2, 3. Ties show the difference.', 'Create a tie and compare RANK and DENSE_RANK on it.', paste('Paste the result showing both ranks', look('RANK|rank'), 'product | rank | dense_rank\nA | 1 | 1\nB | 2 | 2\nC | 2 | 2\nD | 4 | 3', 'Paste the rows with both RANK and DENSE_RANK.')),
    S('LAG for change', 'LAG gives the value from the row before, so you can show the change from last month. The first month has no previous value.', 'For each branch, show revenue and the change from last month.', sql('Paste your query', ['LAG'], 'SELECT branch, month, revenue, revenue - LAG(revenue) OVER (PARTITION BY branch ORDER BY month) …', 'Use LAG.')),
    S('Clean names', 'TRIM removes spaces at the ends; UPPER makes the case the same. Counting changes proves the cleaning did something.', 'Clean product names with TRIM and UPPER and count how many changed. Write the two-sentence note for the owner.', ans('How many names changed, and the strongest and weakest branch-month', 'TRIM, UPPER, 7 names changed')),
  ],
  12: [
    S('Run Python', 'Python runs instructions from top to bottom. Printing a line is the simplest proof it works.', 'Install Python and run print("Hello, Sunita").', paste('Paste what it printed', 'Hello, Sunita', 'Hello, Sunita', 'It should print Hello, Sunita.')),
    S('Variables and float()', 'input() always gives text; float() turns it into a number you can add. A variable is a labelled box.', 'Type the day-total program and run it with cash 4200, card 1800, UPI 3000.', paste('Paste the output', '9,?000', 'Total: 9000.00  Cash share: 46.7%', 'With 4200, 1800 and 3000 the total should be 9000.')),
    S('Avoid dividing by zero', 'Dividing by zero crashes a program. A check before the division keeps it running.', 'Add the check: if the total is zero, print “No sales today”. Run it with all zeros.', paste('Paste the output for a zero-sales day', 'No sales today', 'No sales today', 'The zero-sales run should print No sales today.')),
  ],
  13: [
    S('if, elif, else', 'Python checks rules top to bottom and runs the first true one. Indentation (four spaces) tells Python which lines belong to which rule.', 'Type the grade program and run it.', tick('The program runs without errors')),
    S('Test the edges', 'Bugs hide at the edges: 84.9 vs 85, exactly 70, 49.5. Testing the edges is how you trust a rule.', 'Test the averages 85, 84.9, 70, 50 and 49.5.', paste('Paste the grade for each average', look('49\\.5[^\\n]*Fail', '84\\.9[^\\n]*B', '85[^\\n.]*A'), '85 A\n84.9 B\n70 B\n50 C\n49.5 Fail', 'Expected: 85 A, 84.9 B, 70 B, 50 C, 49.5 Fail.')),
    S('Two conditions with and', 'and needs both sides true: not failed and fees paid.', 'Add the rule: a student with 90 and unpaid fees is not eligible. Show the output.', paste('Paste the output for 90 with unpaid fees', 'not eligible|Not eligible|False|NOT', 'Grade A - not eligible (fees unpaid)', 'The output should say the student is not eligible.')),
    S('Why order matters', 'If “at least 50” were checked before “at least 85”, everyone would get C.', 'In one sentence, explain why the order of elif checks matters.', ans('Why the order of elif checks matters')),
  ],
  14: [
    S('A list of products', 'A list holds many items in order; a loop does the same job for each one.', 'Make a list of 30 products with stock, daily sales and delivery days.', tick('My list has 30 products')),
    S('A for loop', 'Days left = stock ÷ daily sales. If that is less than the delivery days, reorder now.', 'Print the reorder list.', paste('Paste the reorder list', '\\w+', 'Rice 5kg: 4.2 days left (delivery 6)', 'Paste the products your program printed.')),
    S('break', 'break stops the loop at once; continue skips just one item.', 'Use break so the program stops after the first 5 urgent items, and print how many it found.', paste('Paste the output', '\\b5\\b', 'Found 5 urgent items', 'It should report 5 urgent items.')),
    S('range()', 'range(1, 11) gives 1 to 10; the end number is not included.', 'Print the 7 times table with a loop: 7, 14, … 70.', paste('Paste the output', look('\\b7\\b', '\\b63\\b', '\\b70\\b'), '7 14 21 28 35 42 49 56 63 70', 'Expected the 7 times table up to 70.')),
  ],
  15: [
    S('Dictionaries', 'A dictionary finds a value by its key, like a student’s record by roll number.', 'Store 5 workers as dictionaries, using their IDs as keys.', tick('I stored 5 workers keyed by ID')),
    S('Change one record', 'Lists inside dictionaries can grow: add a skill to one worker.', 'Add a new skill to one worker and print that worker.', paste('Paste the printed worker', '\\[|\\{', "{'name': 'Ravi', 'skills': ['welding', 'CNC']}", 'Paste the printed worker record.')),
    S('Sets remove repeats', 'A set keeps only unique items, so every skill appears once.', 'Print every skill in the team, sorted, with no repeats.', paste('Paste the output', '\\w+', "['CNC', 'drilling', 'welding']", 'Paste the sorted skills.')),
    S('Tuples cannot change', 'A tuple is sealed: changing it raises an error. That protects values like shift times.', 'Store the shift times in a tuple and try to change one.', paste('Paste the error', 'does not support item assignment|TypeError', "TypeError: 'tuple' object does not support item assignment", 'Paste the TypeError you got.')),
  ],
  16: [
    S('A test file', 'Good test data has known problems in it, so you can prove your program catches them.', 'Make a CSV with 12 loan rows, including 3 bad rows: a missing amount, a word, a negative.', tick('My CSV has 12 rows with 3 planted problems')),
    S('A checking function', 'A function does one job: take a row, return the cleaned row or a reason. Add a date check for the format 2026-11-18.', 'Write check_row with the amount and date checks.', paste('Paste your function', 'def\\s+\\w+\\(', 'def check_row(row):\n    …', 'Paste the def of your function.')),
    S('try and except, two files', 'try/except catches an error and keeps going, so one bad row never stops the run.', 'Write good rows to clean_loans.csv and bad rows with the reason to rejects.csv. Print the summary.', paste('Paste the summary', look('9', '3'), 'Rows read: 12, good: 9, bad: 3', 'Expected: 12 read, 9 good, 3 bad.')),
    S('Why a safety net', 'A program that stops at the first bad row makes staff fix and re-run all day.', 'In two sentences, explain why try and except is better than letting the program crash.', ans('Why try/except is better than crashing')),
  ],
  17: [
    S('Arrays', 'A NumPy array changes all its numbers in one move, like pouring water into 500 cups at once.', 'Make two arrays of 10 products: cost and price.', tick('I made the cost and price arrays')),
    S('A vectorised discount', 'price * 0.95 gives 95% of every price in one line, with no loop.', 'Work out the price after a 5% discount, in one line.', paste('Paste the discounted array', '\\[', '[95. 190. …]', 'Paste the printed array.')),
    S('Margin %', 'Margin % = profit ÷ price × 100. Cost 80 and price 100 gives 20%.', 'Work out each product’s margin % and print the average.', paste('Paste the average margin', '\\d+(\\.\\d+)?', 'Average margin: 18.4%', 'Paste the average margin number.')),
    S('Filter with a condition', 'arr[arr < 10] keeps only the values that match, here the weak products.', 'Print the products with margin below 10%, and say which to look at first.', ans('The products below 10% margin and which to look at first')),
  ],
  18: [
    S('Two file types', 'read_csv opens a CSV; read_excel opens an Excel sheet and can skip a title row.', 'Make a CSV and an Excel sales file; put a title in row 1 of the Excel file and leave row 2 empty.', tick('Both files are ready')),
    S('Load both correctly', 'skiprows and sheet_name tell pandas where the real table starts. A branch column keeps the source.', 'Load both files and add a branch column to each.', paste('Paste the code you used to load the Excel file', 'read_excel', "pd.read_excel('south.xlsx', sheet_name='Sales', skiprows=2)", 'Use read_excel.')),
    S('Stack and check', 'concat stacks tables. The stacked count must equal the two counts added.', 'Stack them and print the number of rows and the column names.', paste('Paste the row count and columns', look('\\d+', 'branch'), "(24, 4) ['date', 'item', 'amount', 'branch']", 'Show the row count and a branch column.')),
    S('A real messy file', 'Real files have titles and notes above the table; reading them correctly is a daily task.', 'Load the Pinnacle Tools staff file and print its first five rows.', paste('Paste the first five rows', '\\w+', 'emp_id name dept …', 'Paste the printed rows.')),
  ],
  19: [
    S('Shape and types', 'Profiling first: shape gives rows and columns, info() gives types and filled values.', 'Write down the rows, column names and each column’s type.', paste('Paste the output of shape and info()', '\\(\\d+,\\s*\\d+\\)|entries', '(500, 8) … RangeIndex: 500 entries', 'Paste shape and info() output.')),
    S('Blanks', 'isna().sum() counts blanks per column. The worst column tells you what to fix first.', 'Count the blanks in each column.', ans('Blanks per column and which column has the most')),
    S('Numbers stored as text', 'A number column read as text usually has a comma or ₹ inside. It must be cleaned before maths.', 'Find any number column stored as text and say why.', ans('Which number column is stored as text, and why', 'fee has ₹ and commas')),
    S('Believable dates', 'Dates in the future, or before the clinic opened in 2018, are signs of typing errors.', 'Find the earliest and latest visit dates and any impossible ones.', ans('Earliest and latest dates, and any impossible ones')),
  ],
  20: [
    S('Standardise text first', 'Clean text first so “Machining”, “machining ” and “MACHINING” become one value before you look for repeats.', 'Standardise the department names.', tick('Department names are standardised')),
    S('Convert salaries', '“₹ 32,000”, “32k” and “32000” must all become 32000. errors="coerce" blanks the ones that fail, so count them.', 'Turn salaries into numbers; count and list the ones that could not be converted.', ans('How many salaries could not be converted, and which')),
    S('Remove repeats', 'Keep the most recent row per employee ID. Rows after = rows before − duplicates removed.', 'Remove repeated employee IDs, keeping the most recent row.', paste('Paste the row counts before and after', '\\d+\\D+\\d+', 'before 312, after 300', 'Paste both counts.')),
    S('Blanks and the log', 'Never clean silently: a log of each step and rows changed lets anyone check your work.', 'Fill blank departments with “Unassigned”, flag blank joining dates, and save the cleaned file and the log.', paste('Paste your cleaning log', '\\d', 'standardise depts | 23 rows\nsalary convert | 4 failed\ndedupe | 12 removed', 'Paste the log with a count for each step.')),
  ],
  21: [
    S('Merge and count', 'A merge matches two tables by a key. If the row count goes up, a key is repeated in the customer table.', 'Merge sales with customers and print the rows before and after.', paste('Paste the counts before and after', '\\d+\\D+\\d+', 'before 4,820 after 4,820', 'Paste both counts.')),
    S('Filter and group', 'Filter to the last three months, then group by region and segment.', 'Total revenue for each region and segment.', paste('Paste the region table', '\\d', 'North retail 1,20,000 …', 'Paste the totals.')),
    S('Top 10', 'Sort by revenue and take the first ten rows.', 'List the top 10 customers by revenue.', paste('Paste the top 10', '\\d', '1 Sri Textiles 2,40,000 …', 'Paste the list.')),
    S('Stack and check', 'Stacked rows must equal the two months added together.', 'Stack two months of sales and check the row count.', ans('Your row-count check for the stacked months', 'March 2,410 + April 2,390 = 4,800')),
  ],
  22: [
    S('Dates', 'pd.to_datetime with dayfirst=True reads 03-11-2026 as 3 November. Count the dates that fail.', 'Convert the dates, count the failures and explain why they failed.', ans('How many dates failed and why')),
    S('Monthly and weekday views', 'Grouping by month shows the trend; grouping by weekday shows the pattern inside a week.', 'Build the monthly revenue table and the average sale per weekday.', paste('Paste the strongest and weakest month', '\\d', 'Strongest: Oct ₹6.2L; weakest: Jun ₹3.1L', 'Paste the two months with their revenue.')),
    S('Outliers', 'An outlier is far from the rest. It may be real (a bulk order) or a typing error; check before deleting.', 'Clean category names, then find outliers and say for each whether it looks real.', ans('Each outlier and whether it looks real or like a typing error')),
    S('Three insights', 'An insight has a number and a limit, for example “only 12 months, so seasonality is not proven”.', 'Write three insights for the owner, each with a number and a limit.', ans('Three insights, each with a number and one limit of the data')),
  ],
  23: [
    S('Install and connect', 'Power BI Desktop (Windows) builds reports; the Service shares and refreshes them. Connect links the file so refresh reads it again.', 'Open Power BI Desktop and connect the Excel sales file and the CSV store list.', shot('Power BI with both tables in the Data pane')),
    S('Check the data', 'Row and column counts confirm the data loaded fully.', 'In Data view, note the rows and columns of each table.', ans('Rows and columns of each table')),
    S('Refresh', 'Change the source and refresh: the report updates without copying.', 'Change one value in the source file, refresh, and note what changed.', ans('What changed after the refresh')),
  ],
  24: [
    S('Load without editing the source', 'Power Query cleans inside Power BI; the original file stays untouched and the steps repeat on every refresh.', 'Load the sales export and remove the repeated header rows.', tick('Repeated header rows are removed')),
    S('Types', 'Maths does not work on text. Remove the ₹ sign and set the amount to decimal; set the date type with the right locale.', 'Clean the amount (decimal) and the date (with locale); check three dates by hand.', ans('Three dates you checked by hand, before and after')),
    S('Applied Steps', 'Each cleaning step is recorded in Applied Steps, like a recipe card.', 'Add a month column, close and apply, and note how many rows loaded.', shot('The Applied Steps list, with the row count noted')),
  ],
  25: [
    S('Fact and dimensions', 'A star schema has one fact table of numbers in the middle and dimension tables of descriptions around it.', 'Split the cleaned sales table into one fact table and three dimension tables, plus a date table.', tick('I have one fact table, three dimensions and a date table')),
    S('One-to-many links', 'Each link should be one-to-many, in one direction; many-to-many links count sales twice.', 'Create the relationships.', shot('Model view with the star of relationships')),
    S('Totals still match', 'After splitting, the fact table’s total must equal the original total.', 'Check the total amount, then write one sentence about the link you were least sure of.', ans('Original total, fact total, and the link you were least sure of')),
  ],
  26: [
    S('Measures', 'A measure is calculated when the chart is drawn, so it changes with the slicer. Use measures for totals.', 'Create Revenue and Orders measures.', paste('Paste your Revenue measure', 'SUM|COUNTROWS', 'Revenue = SUM(Sales[amount])', 'Paste a DAX measure using SUM.')),
    S('CALCULATE for last year', 'CALCULATE changes what the formula looks at, for example the same period last year.', 'Create Revenue LY and Revenue Change %.', paste('Paste your Revenue LY measure', 'CALCULATE', 'Revenue LY = CALCULATE([Revenue], SAMEPERIODLASTYEAR(Dates[date]))', 'Use CALCULATE.')),
    S('DIVIDE', 'DIVIDE returns blank instead of an error when dividing by zero.', 'Create Avg Order Value = Revenue ÷ Orders with DIVIDE, and the size_band column.', paste('Paste your Avg Order Value measure', 'DIVIDE', 'AOV = DIVIDE([Revenue], [Orders])', 'Use DIVIDE.')),
    S('Check against SQL', 'A measure is trusted when it matches an independent total.', 'Pick a month on a slicer and compare each number with your SQL total.', ans('Your check table: measure, Power BI value, SQL value')),
  ],
  27: [
    S('One question per chart', 'Cards for one number, lines for trends, bars for comparisons, tables for detail. Each chart title is the question it answers.', 'Build the one-page dashboard with question titles.', shot('Your dashboard page')),
    S('Slicers and drill-through', 'Slicers let the owner choose; drill-through carries the chosen branch to a detail page.', 'Add month and branch slicers and the drill-through page, and test them.', shot('The drill-through page for one branch')),
    S('Share and explain', 'A dashboard is useful only if someone acts on it.', 'Publish (or export a PDF) and record a 60-second walkthrough with one action for the owner.', ans('The one action you recommend in your walkthrough, and why')),
  ],
  28: [
    S('Weekly tasks', 'AI is a fast intern that writes well but never checks numbers. List the real tasks first.', 'List six data tasks Sunita does in a normal week.', ans('Six weekly data tasks')),
    S('Who does what', 'Each task is: AI drafts and a person checks, AI should not, or only a person (money, legal, pay decisions).', 'Mark each task with one group.', ans('Each task with its group')),
    S('The check and the never-paste list', 'Always check AI numbers by running the query; never paste names, phone numbers or ID numbers.', 'Write the check for one “AI drafts” task and three things never to paste.', ans('One check, and three things never to paste into an AI tool', 'customer names, phone numbers, Aadhaar numbers')),
  ],
  29: [
    S('A weak prompt', 'AI cannot see your database; a vague prompt makes it guess column names.', 'Write the weak prompt and record what the AI gives back.', ans('Your weak prompt and what the AI returned')),
    S('A strong prompt', 'Five parts: context, schema (exact columns), task, rules, output format.', 'Write a strong prompt with all five parts for the same question.', ans('Your strong prompt with context, schema, task, rules and output', 'context, schema, task, rules, output')),
    S('Test the answer', 'Run the AI’s answer and check one branch by hand. Then compare SQL with pandas.', 'Run it, check one branch’s top product by hand, and log one mistake the AI made.', ans('Your hand check and the mistake the AI made')),
  ],
  30: [
    S('Sample, not names', 'Send AI 20 sample rows with no real names. AI suggests; code applies; counts confirm.', 'Ask AI for cleaning suggestions, apply them in code and log a count for each change.', paste('Paste your cleaning log', '\\d', 'name spelling fixes | 37 rows', 'Paste the log with counts.')),
    S('Test the patterns', 'An AI pattern is a guess until you group, count and compare with a baseline.', 'Ask AI for three patterns and write a test for each.', ans('The three patterns and the test and result for each')),
    S('Check the claims', 'Mark every AI claim: confirmed, not confirmed or wrong. At least one usually fails.', 'Ask AI for a summary of students below 75% and check its numbers against your query.', ans('Your claim table: claim, your number, confirmed / not confirmed / wrong')),
  ],
  31: [
    S('Privacy gate', 'Remove names and ID numbers before any AI sees data. Share totals, not people.', 'Count loans by branch and month, with no names or IDs.', paste('Paste the summary table', '\\d', 'Pune | Oct | 142 loans | 18 late', 'Paste the counts.')),
    S('Claim check', '“30% higher” can hide a change from 10 to 13. Every claim needs a query and the counts.', 'Get an AI draft from the table and check at least five claims, rewriting any that fail.', ans('Five claims, each supported / not supported / wrong, with its query')),
    S('Limits and privacy line', 'Limits name the period, sample size and gaps. A privacy line tells readers no personal data was used.', 'Add three limitations and one privacy line.', ans('Your three limitations and the privacy line')),
  ],
  32: [
    S('Rule or learning?', 'If the answer is simple and fixed, a rule is better than machine learning. Learning needs past examples with answers.', 'Write eight questions Sunita might ask.', ans('Eight questions the owner might ask')),
    S('Name the type', 'Number answer: regression. Category answer: classification. Groups with no answers: clustering.', 'Mark each: rule, number prediction, category prediction, grouping, or not worth ML.', ans('Each question with its type', 'reorder: rule; next month revenue: regression')),
    S('The label', 'The label is the answer you already know for each past example.', 'Pick one supervised question and write its label; pick one not worth ML and say why.', ans('One label, and one question not worth ML with the reason')),
  ],
  33: [
    S('Features and label', 'Features are clues known before the outcome; the label is the answer.', 'Build one row per customer: days since last order, orders last year, average order value, label.', tick('One row per customer with three features and the label')),
    S('Leakage', 'A clue that contains the answer is leakage: the model looks great and fails in real life. Ask “could I know this before?”', 'For every clue, write yes or no: known before the 60 days started?', ans('Each clue with yes or no')),
    S('Split 80/20', 'The test set stays hidden until the end; random_state=42 makes the split repeatable.', 'Split 80/20 with random state 42 and print the share of yes in each set.', paste('Paste the split output', '\\d', 'train yes 0.31, test yes 0.30', 'Paste the shares.')),
    S('Prove leakage', 'Adding a leaky clue on purpose shows how a suspicious jump looks.', 'Add one leaky clue, note how much accuracy jumps, then remove it.', ans('Accuracy before and after the leaky clue')),
  ],
  34: [
    S('Fit the line', 'Linear regression finds the straight line that fits past points best. Split 80/20 first.', 'Fit the model on the 52 weeks.', tick('The model is fitted on the training weeks')),
    S('Coefficients', 'A coefficient of 40 on footfall means about ₹40 more revenue per extra customer.', 'Write each coefficient and what it means.', paste('Paste the coefficients', '\\d', 'footfall: 41.2, discount: 950.0, intercept: 12000', 'Paste the coefficient numbers.')),
    S('How wrong', 'MAE is the typical error in rupees; it tells the owner how much to trust a forecast.', 'Find the MAE on the test weeks.', paste('Paste the MAE', '\\d', 'MAE: 3,420', 'Paste the MAE number.')),
    S('Forecast with care', 'Never predict far outside the data; give the forecast with its likely error.', 'Predict next week for footfall 800 and 1,000 at 0% and 5% discount, and write two lines for the owner.', ans('Your four predictions and the two-line owner note')),
  ],
  35: [
    S('Churn label', 'The label is “no order in the next 90 days”. Missing a leaver costs more than an extra offer.', 'Build the churn data and train logistic regression and a decision tree on the same split.', tick('Both models are trained on the same split')),
    S('Precision and recall', 'Precision: of those flagged, how many left. Recall: of those who left, how many were flagged. Accuracy can lie when leavers are rare.', 'Print the confusion matrix, precision, recall and F1 for each model.', paste('Paste your metrics', look('[Pp]recision', '[Rr]ecall'), 'precision 0.42 recall 0.71 f1 0.53', 'Paste precision and recall.')),
    S('Choose and explain', 'Pick the model and cut-off with costs in mind, and never use personal traits like caste, religion or gender as clues.', 'Choose a model and cut-off and write the note: how many flagged, roughly how many real.', ans('Your model, cut-off, reason, and the note for the owner')),
  ],
  36: [
    S('Scale first', 'K-Means groups by distance; scale features first so rupees do not dominate counts.', 'Build a behaviour table with three features and scale it.', tick('Features are scaled')),
    S('Choose k', 'The elbow is where adding a group stops helping much; you must also be able to describe each group.', 'Compute the values for k = 2 to 7 and pick k.', paste('Paste the elbow values', '\\d', 'k=2 5400, k=3 3900, k=4 3100, …', 'Paste the values for each k.')),
    S('Name the groups', 'A cluster is useful only if you can name it and act on it.', 'Fit with your k, print each group’s averages, name each group and write its message.', ans('Each group’s name, averages and message')),
    S('Stability', 'Clusters you can trust come back similar with another seed.', 'Run again with another seed and compare.', ans('Were the groups similar with another seed?')),
  ],
  37: [
    S('The route', 'ETL moves data in three stops: extract, transform, load. Staging keeps raw copies so you can restart without going back to the branch.', 'Draw the co-op’s full route and mark staging, transform and the warehouse.', shot('Your drawing of the route')),
    S('ETL or ELT', 'ETL cleans before storing; ELT stores first and cleans in a strong warehouse.', 'Choose ETL or ELT and give two reasons.', ans('ETL or ELT, with two reasons')),
    S('What to log', 'Logs at every stop show where a problem started.', 'Write what each stop should log.', ans('What each stop logs', 'source, rows read, rows rejected, time, run ID')),
  ],
  38: [
    S('One function per source', 'Extraction reads without changing the source, tags each row with source and time, and counts rows.', 'Write four extract functions: CSV, Excel, database, JSON.', paste('Paste the row count printed for each source', look('\\d', '\\d'), 'appointments 1200, bills 1180, status 950, reminders 1100', 'Paste the four row counts.')),
    S('Survive a broken source', 'If one source fails, log it and keep the others.', 'Break one source with a wrong file name and run again.', paste('Paste the output of the broken-source run', 'error|Error|failed|not found|No such file', 'ERROR reminders: file not found; loaded 3 of 4 sources', 'Paste the logged error and the sources that still loaded.')),
  ],
  39: [
    S('Map the columns', 'Translate both branches to the same names before combining: “Bill No” → order_id.', 'Write the mapping for both branch files.', ans('Your column mapping for both branches', 'Bill No → order_id, Dt → order_date')),
    S('Convert and filter', 'Convert dates and amounts and count failures; remove TEST bills and count them. Silent removal hides problems.', 'Convert, filter and log each step.', paste('Paste your log', '\\d', 'dates failed 3 | TEST bills removed 12', 'Paste the counts.')),
    S('Join and summarise', 'A left join keeps every sale; list products with no category.', 'Add categories, list products with none, and build the daily table.', ans('Products with no category, and your total check', 'daily total equals cleaned total')),
  ],
  40: [
    S('Facts and history', 'A fact table holds events; a dimension with start date, end date and current flag (SCD Type 2) keeps history.', 'Create fact_orders and dim_customer and run a full load of month 1.', paste('Paste the row counts after the full load', '\\d', 'fact_orders 1,240; dim_customer 310', 'Paste the counts.')),
    S('Close and open', 'When a customer moves, close the old row and add a new current row, so old orders keep the old city.', 'Change one customer’s city with close-and-open.', paste('Paste that customer’s rows', look('\\d{4}-\\d{2}-\\d{2}'), 'C042 | Pune | 2025-01-01 | 2026-10-31 | 0\nC042 | Nashik | 2026-11-01 | | 1', 'Paste both rows with their dates.')),
    S('Incremental and safe reruns', 'An incremental load adds only rows after the watermark; running it twice must add nothing.', 'Run the month-2 incremental load, then run it again.', paste('Paste how many rows the second run added', '\\b0\\b', 'rows added: 0', 'The second run should add 0 rows.')),
  ],
  41: [
    S('Compare totals', 'Reconciliation first: source total vs target total. Other checks explain the gap.', 'Compare row counts and totals and write the difference.', paste('Paste both totals and the difference', '\\d+[\\s\\S]*\\d+', 'source 48,20,300; target 43,38,000; difference 4,82,300', 'Paste both totals.')),
    S('Find each problem', 'LEFT JOIN … IS NULL finds missing rows; GROUP BY id HAVING COUNT > 1 finds duplicates; joining on id finds wrong amounts.', 'Find the missing rows, duplicates, wrong amounts, an invalid date and inconsistent branch codes.', ans('Each check, what it found, pass or fail')),
    S('Explain the gap', 'A good summary explains the whole difference with the problems found.', 'Write the summary: source total, target total, difference and what explains it.', ans('Your reconciliation summary')),
  ],
  42: [
    S('Pick your capstone', 'Choose the one you can finish in four days: Retail Sales, HR Employees or Healthcare.', 'Read the three briefs and pick one.', ans('Which capstone you picked and why')),
    S('Problem definition', 'Six parts: question, audience, decision, data, success, out of scope.', 'Write the one-page problem definition.', ans('Your question, audience, decision, data, success measure and out of scope')),
    S('Data and first questions', 'Know your sources’ period, size and gaps before you start.', 'List your sources with period, rows and one gap, and answer the three questions the owner would ask first.', ans('Your sources table and three owner questions with answers')),
  ],
  43: [
    S('Pull with SQL', 'Choose rows and columns in the database first; less data means less mess.', 'Write at least two SQL queries that pull your data.', sql('Paste one of your queries', ['FROM'], 'SELECT … FROM sales WHERE order_date >= …', 'Paste a SELECT query.')),
    S('Clean with a log', 'At least five cleaning steps, each with a row count, as on Day 20.', 'Clean in Python and log the row count after each step; add two new columns.', paste('Paste your log', '\\d[\\s\\S]*\\d', 'dedupe 2,410 → 2,398 …', 'Paste the log with counts.')),
    S('Freeze it', 'Analyse only one frozen, versioned file, with a data dictionary describing every column.', 'Save analysis_v1.csv and the data dictionary; check the final row count matches the log.', ans('Your final row count and the data dictionary')),
  ],
  44: [
    S('Three findings', 'Each finding needs a number, the query that made it, and a limit.', 'Write your three findings.', ans('Three findings, each with a number, its query and a limit')),
    S('The dashboard', 'At least 3 cards, 2 charts, 1 table and 2 slicers, each answering part of the question.', 'Build the dashboard.', shot('Your capstone dashboard')),
    S('Prediction vs baseline', 'A prediction is useful only if it beats a plain guess like “same as last month”.', 'Add one prediction, compare it with a baseline, and check every AI-drafted claim.', ans('Your prediction, the baseline, which is better, and one AI claim you fixed')),
  ],
  45: [
    S('The five-minute talk', 'Tell the owner’s story: question, what you did, what you found, how sure you are, what to do next.', 'Prepare the talk with one slide per step.', shot('The first slide of your talk')),
    S('Viva and timed test', 'Each answer should give a reason for your choice.', 'Answer five viva questions and do the timed test (a join, a cleaning task, a chart choice).', ans('Your timed test score and the hardest viva question with your answer')),
    S('Practice interviews', 'Use STAR (situation, task, action, result) and a number or example from your project in each answer.', 'Do three recorded practice interviews.', ans('Your STAR answer to “Tell me about a time an AI tool gave you a wrong answer”', 'Situation, Task, Action, Result')),
  ],
};
