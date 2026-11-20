/** Domain catalogue, part A (9 domains). One flagship problem per domain, carried through all 40 days. */
import { type DomainSpec as FullSpec, key, str, int, num, date, cat, bool, optional } from './types';

type DomainSpec = Omit<FullSpec, 'enterprise'>;

export const DOMAINS_A: DomainSpec[] = [
  {
    slug: 'education', code: 'EDU', name: 'Education', catalog: 'edu360', entity: 'student',
    problem: {
      title: 'Student 360° Evaluation',
      statement: 'Schools judge students almost only on exam marks. Teachers, parents and counsellors cannot see the whole child: attendance, academics, cultural activities, sports, behaviour and wellbeing sit in separate registers, apps and notebooks. Build a Student 360° view that combines them, so the school can spot students who need support early and recognise strengths beyond marks.',
      stakeholders: ['Principal', 'Class teachers', 'Counsellor', 'Sports and cultural coordinators', 'Parents'],
      decisions: ['Which students need academic or wellbeing support this term', 'Where to recommend sports, arts or leadership opportunities', 'How to plan parent–teacher meetings'],
      questions: ['Which students have falling academic scores and low attendance in the same term?', 'How do sports and cultural participation relate to academic performance?', 'Which classes have the most students in the high-risk band?'],
    },
    kpis: [
      { name: 'Overall 360° score', definition: 'Weighted score of academic (40%), attendance (20%), co-curricular (15%), sports (15%) and wellbeing (10%), 0–100' },
      { name: 'Attendance %', definition: 'Days present ÷ working days × 100 for the term' },
      { name: 'Academic score', definition: 'Average of subject percentages in the term exams' },
      { name: 'Co-curricular participation rate', definition: 'Students in at least one cultural activity ÷ all students' },
      { name: 'At-risk students', definition: 'Students with 360° score below 50 or attendance below 75%' },
    ],
    sources: {
      structured: [
        { name: 'Student information system (SIS) export', description: 'Student master, class, section, academic year' },
        { name: 'Exam marks register', description: 'Subject-wise marks per term' },
        { name: 'Attendance register', description: 'Daily present/absent by student' },
      ],
      semi: [{ name: 'Sports and events app export', format: 'JSON', description: 'Events, teams, positions, medals and participation by student' }],
      unstructured: [
        { name: 'Teacher remarks and counsellor notes', description: 'Free-text observations on behaviour and wellbeing' },
        { name: 'Certificates and activity photos', description: 'Scanned certificates for cultural and sports achievements' },
      ],
    },
    dataset: {
      name: 'student_term_record', minRows: 100,
      columns: [key('student_id', 'Unique student ID, e.g. STU0001'), int('grade', 6, 12), cat('section', ['A', 'B', 'C', 'D']), cat('term', ['Term 1', 'Term 2', 'Term 3']),
        num('academic_pct', 0, 100, 'Average subject percentage'), num('attendance_pct', 0, 100), int('cultural_events', 0, 20), int('sports_events', 0, 20),
        cat('sport', ['Cricket', 'Football', 'Athletics', 'Kabaddi', 'Badminton', 'None']), int('wellbeing_score', 1, 10, 'Counsellor rating 1–10'), date('record_date')],
    },
    gold: {
      name: 'gold_student_360', minRows: 50,
      columns: [key('student_id'), int('grade', 6, 12), num('academic_score', 0, 100), num('attendance_score', 0, 100), num('cocurricular_score', 0, 100), num('sports_score', 0, 100), num('wellbeing_score', 0, 100), num('overall_360_score', 0, 100), cat('risk_band', ['Low', 'Medium', 'High'])],
    },
    quality: ['Same student with different IDs across the SIS and the sports app', 'Attendance above 100% from double-counted days', 'Marks entered as "AB" for absent', 'Sport names spelled several ways ("Foot ball", "Soccer")', 'Teacher remarks with student phone numbers that must be removed'],
    dashboard: {
      pages: [
        { name: 'School overview', visuals: ['Average 360° score by grade', 'Risk band distribution', 'Attendance trend by month'] },
        { name: 'Student 360° profile', visuals: ['Radar of the five sub-scores', 'Term-on-term change', 'Activities and achievements'] },
        { name: 'Early warning', visuals: ['At-risk students table', 'Attendance vs academic scatter', 'Counsellor follow-up status'] },
      ],
      measures: [{ name: 'Avg 360 Score', dax: 'AVERAGE(gold_student_360[overall_360_score])' }, { name: 'At-Risk Students', dax: 'CALCULATE(COUNTROWS(gold_student_360), gold_student_360[risk_band] = "High")' }, { name: 'Attendance %', dax: 'AVERAGE(gold_student_360[attendance_score])' }],
    },
    insight: 'Students in at least one sport or cultural activity had 9% higher attendance; Grade 9 Section C has the most high-risk students, mostly from low attendance after the October break.',
  },
  {
    slug: 'bfsi', code: 'BFSI', name: 'Banking & Financial Services (BFSI)', catalog: 'bfsi_credit', entity: 'loan account',
    problem: {
      title: 'Loan Default Early Warning',
      statement: 'A retail lender finds out about bad loans only after borrowers miss three EMIs. Repayment history, account balances, bureau scores and collection-call notes are in separate systems. Build an early-warning view that flags loan accounts likely to default in the next 90 days so the collections team can act while recovery is still possible.',
      stakeholders: ['Chief Risk Officer', 'Collections head', 'Branch managers', 'Credit underwriting team'],
      decisions: ['Which accounts the collections team calls first each week', 'Which loan products need tighter underwriting', 'Where to offer restructuring before default'],
      questions: ['Which accounts show a rising days-past-due trend over the last three months?', 'Which products and branches have the highest 30+ DPD rates?', 'How does the bureau score at sanction relate to later delinquency?'],
    },
    kpis: [
      { name: 'Gross NPA %', definition: 'Outstanding of accounts 90+ days past due ÷ total outstanding × 100' },
      { name: '30+ DPD rate', definition: 'Accounts 30 or more days past due ÷ active accounts' },
      { name: 'Roll rate', definition: 'Share of accounts moving to a worse delinquency bucket month on month' },
      { name: 'Collection efficiency', definition: 'EMI collected ÷ EMI due in the month × 100' },
      { name: 'Early-warning hit rate', definition: 'Flagged accounts that became 90+ DPD ÷ all flagged accounts' },
    ],
    sources: {
      structured: [
        { name: 'Core banking loan ledger', description: 'Loan accounts, product, sanction amount, EMI, outstanding' },
        { name: 'Repayment transactions', description: 'EMI due dates, paid dates and amounts' },
        { name: 'Credit bureau extract', description: 'Bureau score at sanction and latest refresh' },
      ],
      semi: [{ name: 'Mobile banking app events', format: 'JSON Lines', description: 'Logins, failed payments, auto-debit changes' }],
      unstructured: [{ name: 'Collection call notes', description: 'Agent notes on promise-to-pay and borrower hardship' }],
    },
    dataset: {
      name: 'loan_account_month', minRows: 100,
      columns: [key('loan_account_id', 'e.g. LN0001'), cat('product', ['Home', 'Personal', 'Vehicle', 'Gold', 'MSME']), str('branch'), num('sanction_amount', 10000, 50000000), num('outstanding_amount', 0, 50000000),
        num('emi_amount', 500, 2000000), int('days_past_due', 0, 720), int('bureau_score', 300, 900), date('snapshot_date'), optional(bool('auto_debit_active'))],
    },
    gold: {
      name: 'gold_loan_risk', minRows: 50,
      columns: [key('loan_account_id'), cat('product', ['Home', 'Personal', 'Vehicle', 'Gold', 'MSME']), str('branch'), num('outstanding_amount', 0, 50000000), int('max_dpd_3m', 0, 720), num('emi_paid_ratio_3m', 0, 1), num('default_probability', 0, 1), cat('risk_bucket', ['Standard', 'Watch', 'Critical'])],
    },
    quality: ['Negative outstanding amounts from reversed entries', 'EMI paid date before due date for advance payments mixed with errors', 'Bureau scores of 0 or 999 used as "not available"', 'Branch names in English and Hindi for the same branch', 'Account numbers and PAN in call notes that must be masked'],
    dashboard: {
      pages: [
        { name: 'Portfolio health', visuals: ['Gross NPA % trend', '30+ DPD by product', 'Collection efficiency by month'] },
        { name: 'Early warning list', visuals: ['Critical accounts table', 'Default probability distribution', 'Accounts by risk bucket and branch'] },
        { name: 'Drivers', visuals: ['DPD by bureau score band', 'Roll-rate matrix', 'Auto-debit vs delinquency'] },
      ],
      measures: [{ name: 'Gross NPA %', dax: 'DIVIDE(CALCULATE(SUM(gold_loan_risk[outstanding_amount]), gold_loan_risk[max_dpd_3m] >= 90), SUM(gold_loan_risk[outstanding_amount]))' }, { name: 'Critical Accounts', dax: 'CALCULATE(COUNTROWS(gold_loan_risk), gold_loan_risk[risk_bucket] = "Critical")' }, { name: 'Avg Default Probability', dax: 'AVERAGE(gold_loan_risk[default_probability])' }],
    },
    insight: 'Personal loans with bureau scores below 650 and auto-debit switched off are four times as likely to reach 90+ DPD; calling them in the first 15 days of delinquency would cover 70% of future defaults.',
  },
  {
    slug: 'insurance', code: 'INS', name: 'Insurance', catalog: 'ins_claims', entity: 'claim',
    problem: {
      title: 'Motor Claims Fraud and Settlement Time',
      statement: 'A general insurer takes weeks to settle honest motor claims while some fraudulent claims are paid quickly. Policy data, claim forms, garage estimates, surveyor reports and accident photos are reviewed by hand. Build an analytics view that scores claims for fraud risk and shows where settlement is delayed, so honest customers are paid faster and suspicious claims get a closer look.',
      stakeholders: ['Head of claims', 'Fraud investigation unit', 'Surveyors', 'Customer service'],
      decisions: ['Which claims go to fast-track settlement', 'Which claims need a fraud investigation', 'Which garages and regions need audits'],
      questions: ['Which claim patterns (timing, garage, amount) are linked to confirmed fraud?', 'Where in the process is settlement delayed?', 'Which garages have unusually high estimates for the same damage?'],
    },
    kpis: [
      { name: 'Average settlement days', definition: 'Days from claim intimation to payment, averaged over settled claims' },
      { name: 'Fraud detection rate', definition: 'Confirmed fraud claims flagged by the score ÷ all confirmed fraud claims' },
      { name: 'Claim ratio', definition: 'Claims paid ÷ premium earned × 100' },
      { name: 'Fast-track share', definition: 'Claims settled within 7 days ÷ all settled claims' },
      { name: 'Estimate deviation', definition: 'Garage estimate ÷ surveyor-approved amount, by garage' },
    ],
    sources: {
      structured: [
        { name: 'Policy administration system', description: 'Policies, vehicles, sum insured, premium' },
        { name: 'Claims register', description: 'Claims, dates, status, amounts claimed and paid' },
      ],
      semi: [{ name: 'Garage estimate API', format: 'JSON', description: 'Line-item estimates for parts and labour' }],
      unstructured: [
        { name: 'Surveyor reports', description: 'PDF reports describing the damage and cause' },
        { name: 'Accident photos', description: 'Images uploaded by customers and surveyors' },
      ],
    },
    dataset: {
      name: 'motor_claim', minRows: 100,
      columns: [key('claim_id', 'e.g. CLM0001'), str('policy_id'), cat('vehicle_type', ['Two-wheeler', 'Car', 'Commercial']), date('intimation_date'), int('days_policy_to_claim', 0, 3650),
        num('claim_amount', 1000, 5000000), num('approved_amount', 0, 5000000), str('garage_id'), cat('status', ['Open', 'Settled', 'Rejected', 'Investigation']), optional(int('settlement_days', 0, 365))],
    },
    gold: {
      name: 'gold_claim_risk', minRows: 50,
      columns: [key('claim_id'), cat('vehicle_type', ['Two-wheeler', 'Car', 'Commercial']), str('garage_id'), num('claim_amount', 1000, 5000000), num('estimate_ratio', 0, 10), int('settlement_days', 0, 365), num('fraud_score', 0, 1), cat('route', ['Fast-track', 'Standard', 'Investigate'])],
    },
    quality: ['Claim dates before the policy start date', 'Same accident claimed twice under different claim IDs', 'Approved amount higher than claim amount', 'Garage names typed differently across regions', 'Customer mobile numbers inside surveyor notes'],
    dashboard: {
      pages: [
        { name: 'Claims overview', visuals: ['Claims by status', 'Average settlement days trend', 'Claim ratio by vehicle type'] },
        { name: 'Fraud risk', visuals: ['Claims to investigate', 'Fraud score distribution', 'Early claims (within 30 days of policy)'] },
        { name: 'Garages', visuals: ['Estimate ratio by garage', 'Top garages by claim value', 'Map of claims by region'] },
      ],
      measures: [{ name: 'Avg Settlement Days', dax: 'AVERAGE(gold_claim_risk[settlement_days])' }, { name: 'Claims to Investigate', dax: 'CALCULATE(COUNTROWS(gold_claim_risk), gold_claim_risk[route] = "Investigate")' }, { name: 'Fast-track %', dax: 'DIVIDE(CALCULATE(COUNTROWS(gold_claim_risk), gold_claim_risk[route] = "Fast-track"), COUNTROWS(gold_claim_risk))' }],
    },
    insight: 'Claims filed within 30 days of a new policy at three specific garages were six times more likely to be fraudulent; low-value two-wheeler claims could be fast-tracked, cutting average settlement from 19 to 6 days.',
  },
  {
    slug: 'healthcare', code: 'HLT', name: 'Healthcare', catalog: 'hosp_flow', entity: 'admission',
    problem: {
      title: 'Hospital Readmissions and Bed Occupancy',
      statement: 'A multi-speciality hospital sees too many patients readmitted within 30 days of discharge, while emergency patients wait for beds. Admission records, lab results, pharmacy data, discharge summaries and nurse notes are in different systems. Build an analytics view that predicts readmission risk and shows bed occupancy by ward, so care teams can plan follow-up and discharges better.',
      stakeholders: ['Medical superintendent', 'Ward in-charges', 'Discharge planning nurses', 'Hospital finance'],
      decisions: ['Which discharged patients get a follow-up call within 72 hours', 'How many beds to keep free for emergencies by ward', 'Which departments need discharge-process changes'],
      questions: ['Which diagnoses and departments have the highest 30-day readmission rate?', 'How does length of stay relate to readmission?', 'At what hours and days does bed occupancy peak by ward?'],
    },
    kpis: [
      { name: '30-day readmission rate', definition: 'Patients readmitted within 30 days ÷ patients discharged × 100' },
      { name: 'Average length of stay (ALOS)', definition: 'Total inpatient days ÷ number of discharges' },
      { name: 'Bed occupancy rate', definition: 'Occupied bed-days ÷ available bed-days × 100' },
      { name: 'ER wait for bed', definition: 'Average hours from admission decision to bed allocation' },
      { name: 'Follow-up completion', definition: 'High-risk discharges contacted within 72 hours ÷ all high-risk discharges' },
    ],
    sources: {
      structured: [
        { name: 'Hospital information system (HIS) admissions', description: 'Admissions, ward, department, admit and discharge times' },
        { name: 'Lab results', description: 'Test codes, values and reference ranges' },
      ],
      semi: [{ name: 'HL7 FHIR encounter export', format: 'JSON', description: 'Encounters, diagnoses (ICD-10) and procedures' }],
      unstructured: [{ name: 'Discharge summaries and nurse notes', description: 'Free-text clinical notes (de-identified for this project)' }],
    },
    dataset: {
      name: 'inpatient_admission', minRows: 100,
      columns: [key('admission_id', 'e.g. ADM0001'), str('patient_ref', 'Pseudonymous patient reference, never a real ID'), cat('department', ['Cardiology', 'Orthopaedics', 'General Medicine', 'Paediatrics', 'Oncology']), str('ward'),
        date('admit_date'), date('discharge_date'), int('length_of_stay', 0, 120), str('icd10_code'), int('age', 0, 110), bool('readmitted_30d')],
    },
    gold: {
      name: 'gold_readmission_risk', minRows: 50,
      columns: [key('admission_id'), cat('department', ['Cardiology', 'Orthopaedics', 'General Medicine', 'Paediatrics', 'Oncology']), int('length_of_stay', 0, 120), int('prior_admissions_12m', 0, 50), num('readmission_risk', 0, 1), cat('risk_band', ['Low', 'Medium', 'High']), bool('followup_done')],
    },
    quality: ['Discharge date before admission date', 'ICD-10 codes with missing dots or lowercase letters', 'Same patient with two references after re-registration', 'Length of stay not matching the dates', 'Names or phone numbers in nurse notes that must be removed (de-identification)'],
    dashboard: {
      pages: [
        { name: 'Readmissions', visuals: ['30-day readmission rate by department', 'Readmission trend', 'Top diagnoses by readmissions'] },
        { name: 'Bed management', visuals: ['Occupancy by ward heatmap (day × hour)', 'ALOS by department', 'ER wait for bed trend'] },
        { name: 'Follow-up', visuals: ['High-risk discharges this week', 'Follow-up completion rate', 'Risk band distribution'] },
      ],
      measures: [{ name: 'Readmission Rate', dax: 'DIVIDE(CALCULATE(COUNTROWS(gold_readmission_risk), gold_readmission_risk[risk_band] = "High"), COUNTROWS(gold_readmission_risk))' }, { name: 'ALOS', dax: 'AVERAGE(gold_readmission_risk[length_of_stay])' }, { name: 'Follow-up %', dax: 'DIVIDE(CALCULATE(COUNTROWS(gold_readmission_risk), gold_readmission_risk[followup_done] = TRUE()), COUNTROWS(gold_readmission_risk))' }],
    },
    insight: 'Cardiology patients over 65 with two or more admissions in a year had a 28% readmission rate; a 72-hour follow-up call for this group would cover a third of all readmissions.',
  },
  {
    slug: 'pharma-life-sciences', code: 'PHA', name: 'Pharma & Life Sciences', catalog: 'pharma_supply', entity: 'stock position',
    problem: {
      title: 'Medicine Availability and Expiry Wastage',
      statement: 'A pharmaceutical company loses sales when essential medicines are out of stock at distributors, while other batches expire unsold in warehouses. Production plans, batch records, distributor stock, secondary sales and field-force reports are not connected. Build a supply analytics view that predicts stock-outs and near-expiry stock by distributor, so supply-chain planners can move stock before it is too late.',
      stakeholders: ['Supply chain head', 'Demand planners', 'Distributor managers', 'Quality assurance'],
      decisions: ['Where to move near-expiry batches', 'Which distributors need urgent replenishment', 'How to adjust production for the next quarter'],
      questions: ['Which products and distributors run out of stock most often?', 'How much stock will expire in the next 90 days, and where?', 'How accurate was last quarter’s demand forecast?'],
    },
    kpis: [
      { name: 'Stock-out rate', definition: 'Distributor-product days with zero stock ÷ all distributor-product days' },
      { name: 'Near-expiry value', definition: 'Value of stock expiring within 90 days' },
      { name: 'Days of cover', definition: 'Current stock ÷ average daily secondary sales' },
      { name: 'Forecast accuracy', definition: '1 − |forecast − actual| ÷ actual, by product and month' },
      { name: 'Expiry write-off %', definition: 'Value written off as expired ÷ value of stock dispatched' },
    ],
    sources: {
      structured: [
        { name: 'ERP batch master', description: 'Products, batches, manufacturing and expiry dates' },
        { name: 'Distributor stock and secondary sales', description: 'Daily stock and sales by distributor and product' },
      ],
      semi: [{ name: 'Distributor portal uploads', format: 'XML', description: 'Stock statements sent by distributors' }],
      unstructured: [{ name: 'Field-force visit reports', description: 'Medical representative notes on shortages and doctor demand' }],
    },
    dataset: {
      name: 'distributor_stock_day', minRows: 100,
      columns: [key('stock_record_id', 'e.g. STK0001'), str('distributor_id'), str('product_code'), cat('therapy_area', ['Cardiac', 'Diabetes', 'Anti-infective', 'Respiratory', 'Pain']), str('batch_no'),
        date('stock_date'), int('stock_units', 0, 1000000), int('sales_units', 0, 100000), date('expiry_date'), num('unit_price', 1, 100000)],
    },
    gold: {
      name: 'gold_stock_health', minRows: 50,
      columns: [key('distributor_product_id'), str('distributor_id'), str('product_code'), num('days_of_cover', 0, 3650), num('near_expiry_value', 0, 100000000), num('stockout_rate', 0, 1), cat('action', ['OK', 'Replenish', 'Move stock'])],
    },
    quality: ['Expiry dates in different formats per distributor', 'Negative stock from returns booked as sales', 'Same product with different codes in ERP and distributor files', 'Batches with expiry before manufacturing date', 'Doctor names and phone numbers in field reports'],
    dashboard: {
      pages: [
        { name: 'Availability', visuals: ['Stock-out rate by therapy area', 'Distributors at risk this week', 'Days of cover distribution'] },
        { name: 'Expiry', visuals: ['Near-expiry value by warehouse', 'Batches expiring in 90 days', 'Write-off trend'] },
        { name: 'Forecast', visuals: ['Forecast vs actual by month', 'Forecast accuracy by product', 'Top under-forecast products'] },
      ],
      measures: [{ name: 'Stock-out Rate', dax: 'AVERAGE(gold_stock_health[stockout_rate])' }, { name: 'Near-Expiry Value', dax: 'SUM(gold_stock_health[near_expiry_value])' }, { name: 'Distributors to Replenish', dax: 'CALCULATE(DISTINCTCOUNT(gold_stock_health[distributor_id]), gold_stock_health[action] = "Replenish")' }],
    },
    insight: 'Anti-infectives stocked out at 18% of distributors during the monsoon, while ₹1.4 crore of the same products sat near expiry in two warehouses; a weekly transfer rule would have covered most of the gap.',
  },
  {
    slug: 'retail-ecommerce', code: 'RET', name: 'Retail & E-commerce', catalog: 'retail_cx', entity: 'customer',
    problem: {
      title: 'Customer Churn and Repeat Purchase',
      statement: 'An online and offline retailer spends heavily on getting new customers, but most first-time buyers never buy again. Orders, returns, website clickstream, loyalty points and product reviews sit in different tools. Build a customer analytics view that shows who is likely to stop buying and why, so marketing can win them back with the right offer at the right time.',
      stakeholders: ['Head of marketing', 'CRM team', 'Category managers', 'Customer support'],
      decisions: ['Which customers get a win-back offer this month', 'Which categories drive repeat purchase', 'Where returns and bad reviews are causing churn'],
      questions: ['What share of first-time buyers buy again within 90 days?', 'Which behaviours (returns, low ratings, slow delivery) come before churn?', 'Which customer segments have the highest lifetime value?'],
    },
    kpis: [
      { name: 'Repeat purchase rate', definition: 'Customers with 2+ orders in 90 days ÷ customers with an order' },
      { name: 'Churn rate', definition: 'Customers with no order in 120 days ÷ active customers at the start' },
      { name: 'Customer lifetime value (CLV)', definition: 'Average order value × purchase frequency × expected lifetime' },
      { name: 'Return rate', definition: 'Returned items ÷ items sold' },
      { name: 'Average order value (AOV)', definition: 'Revenue ÷ number of orders' },
    ],
    sources: {
      structured: [
        { name: 'Orders and returns (POS + e-commerce)', description: 'Orders, items, prices, channel, returns' },
        { name: 'Loyalty programme', description: 'Members, tiers, points earned and redeemed' },
      ],
      semi: [{ name: 'Website clickstream', format: 'JSON Lines', description: 'Page views, searches, cart events by session' }],
      unstructured: [{ name: 'Product reviews and support chats', description: 'Free-text reviews and chat transcripts' }],
    },
    dataset: {
      name: 'customer_order', minRows: 100,
      columns: [key('order_id', 'e.g. ORD0001'), str('customer_id'), date('order_date'), cat('channel', ['Online', 'Store', 'App']), cat('category', ['Fashion', 'Electronics', 'Grocery', 'Home', 'Beauty']),
        num('order_value', 1, 1000000), int('items', 1, 100), bool('returned'), optional(int('rating', 1, 5)), cat('city_tier', ['Tier 1', 'Tier 2', 'Tier 3'])],
    },
    gold: {
      name: 'gold_customer_value', minRows: 50,
      columns: [key('customer_id'), int('orders_12m', 0, 500), num('revenue_12m', 0, 100000000), int('days_since_last_order', 0, 3650), num('return_rate', 0, 1), num('churn_probability', 0, 1), cat('segment', ['Champions', 'Loyal', 'At risk', 'Lost'])],
    },
    quality: ['Guest checkouts creating duplicate customers', 'Order value zero for free samples mixed with errors', 'Returns booked months later against the wrong order', 'Category names differ between store and online systems', 'Customer emails and phone numbers inside reviews and chats'],
    dashboard: {
      pages: [
        { name: 'Customer health', visuals: ['Repeat purchase rate trend', 'Churn rate by segment', 'Customers by segment'] },
        { name: 'Win-back', visuals: ['At-risk customers table', 'Churn probability distribution', 'Days since last order histogram'] },
        { name: 'Drivers', visuals: ['Return rate by category', 'Rating vs repeat purchase', 'CLV by city tier'] },
      ],
      measures: [{ name: 'Churn Rate', dax: 'DIVIDE(CALCULATE(COUNTROWS(gold_customer_value), gold_customer_value[segment] = "Lost"), COUNTROWS(gold_customer_value))' }, { name: 'Revenue 12M', dax: 'SUM(gold_customer_value[revenue_12m])' }, { name: 'At-Risk Customers', dax: 'CALCULATE(COUNTROWS(gold_customer_value), gold_customer_value[segment] = "At risk")' }],
    },
    insight: 'Customers whose first order was returned were three times more likely to churn; fixing sizing information in Fashion would protect the most revenue.',
  },
  {
    slug: 'fmcg-cpg', code: 'FMCG', name: 'FMCG / Consumer Goods', catalog: 'fmcg_sales', entity: 'outlet',
    problem: {
      title: 'Distributor Sales and Retail Out-of-Stock',
      statement: 'A consumer goods company sells through thousands of small retail outlets via distributors. Fast-moving products are often missing from shelves even though distributors have stock, and the sales team cannot see which outlets are under-served. Build a route-to-market analytics view that shows outlet-level availability and secondary sales, so the sales team fixes out-of-stocks and plans beat routes better.',
      stakeholders: ['National sales manager', 'Area sales managers', 'Distributors', 'Trade marketing'],
      decisions: ['Which outlets the salesperson visits first on each beat', 'Which products to push in which regions', 'Where to run trade schemes'],
      questions: ['Which outlets and products have the most out-of-stock days?', 'How does visit frequency relate to outlet sales?', 'Which trade schemes actually increased secondary sales?'],
    },
    kpis: [
      { name: 'Numeric distribution', definition: 'Outlets stocking the product ÷ outlets covered' },
      { name: 'Out-of-stock rate', definition: 'Outlet-product visits with no stock ÷ all outlet-product visits' },
      { name: 'Secondary sales growth', definition: 'Distributor-to-outlet sales vs the same month last year' },
      { name: 'Lines per call', definition: 'Average number of products ordered per outlet visit' },
      { name: 'Scheme ROI', definition: 'Incremental sales ÷ scheme cost' },
    ],
    sources: {
      structured: [
        { name: 'Distributor management system (DMS)', description: 'Invoices from distributors to outlets' },
        { name: 'Outlet master', description: 'Outlets, channel, town, beat' },
      ],
      semi: [{ name: 'Sales force app visit logs', format: 'JSON', description: 'Visits, GPS, orders and shelf checks' }],
      unstructured: [{ name: 'Shelf photos', description: 'Photos of retail shelves taken during visits' }],
    },
    dataset: {
      name: 'outlet_visit', minRows: 100,
      columns: [key('visit_id', 'e.g. VIS0001'), str('outlet_id'), cat('channel', ['Kirana', 'Supermarket', 'Chemist', 'Paan shop']), str('beat'), date('visit_date'),
        str('sku'), int('order_units', 0, 10000), bool('in_stock'), num('order_value', 0, 1000000), cat('region', ['North', 'South', 'East', 'West'])],
    },
    gold: {
      name: 'gold_outlet_performance', minRows: 50,
      columns: [key('outlet_id'), cat('region', ['North', 'South', 'East', 'West']), int('visits_month', 0, 60), num('oos_rate', 0, 1), num('sales_month', 0, 100000000), num('lines_per_call', 0, 100), cat('priority', ['High', 'Medium', 'Low'])],
    },
    quality: ['Visits logged without GPS or with GPS far from the outlet', 'The same outlet registered twice by two distributors', 'SKU codes changed after a pack-size change', 'Order units in cases and pieces mixed', 'Retailer phone numbers in visit comments'],
    dashboard: {
      pages: [
        { name: 'Availability', visuals: ['OOS rate by region and SKU', 'Numeric distribution trend', 'Top outlets with repeated OOS'] },
        { name: 'Beat performance', visuals: ['Sales by beat', 'Lines per call by salesperson', 'Visit compliance'] },
        { name: 'Schemes', visuals: ['Sales before vs during scheme', 'Scheme ROI', 'Outlets joining the scheme'] },
      ],
      measures: [{ name: 'OOS Rate', dax: 'AVERAGE(gold_outlet_performance[oos_rate])' }, { name: 'Monthly Sales', dax: 'SUM(gold_outlet_performance[sales_month])' }, { name: 'High-Priority Outlets', dax: 'CALCULATE(COUNTROWS(gold_outlet_performance), gold_outlet_performance[priority] = "High")' }],
    },
    insight: 'Kirana outlets visited less than twice a month had 3× the out-of-stock rate on the top 10 SKUs; re-planning 40 beats would recover about 6% of monthly secondary sales.',
  },
  {
    slug: 'manufacturing', code: 'MFG', name: 'Manufacturing', catalog: 'mfg_ops', entity: 'machine shift',
    problem: {
      title: 'Overall Equipment Effectiveness (OEE) and Unplanned Downtime',
      statement: 'A component manufacturer misses delivery dates because machines stop unexpectedly and output quality varies by shift. Machine sensor data, production logs, maintenance tickets and operator shift notes are not combined. Build an operations analytics view of OEE that explains where availability, performance and quality are lost, so the plant can plan maintenance before breakdowns.',
      stakeholders: ['Plant head', 'Production supervisors', 'Maintenance engineers', 'Quality team'],
      decisions: ['Which machines get preventive maintenance this week', 'Which shifts and products need process changes', 'Where to invest in spare parts'],
      questions: ['Which machines lose the most OEE, and is it availability, performance or quality?', 'What signals in sensor data come before a breakdown?', 'Which shifts or products have the highest rejection rate?'],
    },
    kpis: [
      { name: 'OEE', definition: 'Availability × Performance × Quality' },
      { name: 'Availability', definition: 'Run time ÷ planned production time' },
      { name: 'Performance', definition: '(Ideal cycle time × total count) ÷ run time' },
      { name: 'Quality', definition: 'Good units ÷ total units' },
      { name: 'Mean time between failures (MTBF)', definition: 'Operating hours ÷ number of breakdowns' },
    ],
    sources: {
      structured: [
        { name: 'MES production log', description: 'Shift, machine, product, planned and actual counts' },
        { name: 'Maintenance tickets (CMMS)', description: 'Breakdowns, start and end times, root cause' },
      ],
      semi: [{ name: 'IoT sensor stream', format: 'JSON Lines', description: 'Temperature, vibration and current readings every minute' }],
      unstructured: [{ name: 'Operator shift notes', description: 'Handwritten or typed notes on issues during the shift' }],
    },
    dataset: {
      name: 'machine_shift', minRows: 100,
      columns: [key('shift_record_id', 'e.g. SHF0001'), str('machine_id'), cat('shift', ['A', 'B', 'C']), date('production_date'), num('planned_minutes', 0, 720),
        num('downtime_minutes', 0, 720), int('total_units', 0, 100000), int('rejected_units', 0, 100000), num('ideal_cycle_seconds', 0.1, 3600), num('avg_vibration_mm_s', 0, 50)],
    },
    gold: {
      name: 'gold_machine_oee', minRows: 50,
      columns: [key('machine_day_id'), str('machine_id'), num('availability', 0, 1), num('performance', 0, 1.5), num('quality', 0, 1), num('oee', 0, 1.5), num('failure_risk', 0, 1), cat('maintenance_flag', ['None', 'Plan', 'Urgent'])],
    },
    quality: ['Downtime longer than the planned shift time', 'Rejected units more than total units', 'Sensor gaps when the network drops', 'Machine IDs renamed after relocation', 'Operator names and phone numbers in shift notes'],
    dashboard: {
      pages: [
        { name: 'Plant OEE', visuals: ['OEE trend', 'OEE by machine', 'Loss waterfall (availability, performance, quality)'] },
        { name: 'Maintenance', visuals: ['Machines flagged Urgent', 'MTBF by machine', 'Vibration vs breakdowns'] },
        { name: 'Quality', visuals: ['Rejection rate by shift', 'Top defect causes', 'Rejection by product'] },
      ],
      measures: [{ name: 'OEE', dax: 'AVERAGE(gold_machine_oee[oee])' }, { name: 'Availability', dax: 'AVERAGE(gold_machine_oee[availability])' }, { name: 'Urgent Machines', dax: 'CALCULATE(DISTINCTCOUNT(gold_machine_oee[machine_id]), gold_machine_oee[maintenance_flag] = "Urgent")' }],
    },
    insight: 'Two CNC machines lost 40% of their OEE to unplanned stops that were preceded by vibration above 7 mm/s for two shifts; planning maintenance at that signal would lift plant OEE by about 5 points.',
  },
  {
    slug: 'automotive', code: 'AUTO', name: 'Automotive', catalog: 'auto_quality', entity: 'warranty claim',
    problem: {
      title: 'Warranty Claims and Defect Hotspots',
      statement: 'A vehicle manufacturer’s warranty costs are rising, but engineering cannot see which parts, suppliers and production batches cause most failures. Dealer claims, vehicle build data, supplier lots, telematics alerts and technician comments are reviewed separately. Build a quality analytics view that finds defect hotspots early, so engineering fixes root causes and suppliers are held to account.',
      stakeholders: ['Head of quality', 'Warranty team', 'Supplier quality engineers', 'Dealer service managers'],
      decisions: ['Which parts and suppliers need a containment action', 'Whether to issue a service campaign', 'How to set supplier recovery claims'],
      questions: ['Which parts have rising claims per 1,000 vehicles?', 'Are failures linked to a production batch, plant or supplier lot?', 'Which telematics alerts come before a warranty claim?'],
    },
    kpis: [
      { name: 'Claims per 1,000 vehicles', definition: 'Warranty claims ÷ vehicles in service × 1,000' },
      { name: 'Warranty cost per vehicle', definition: 'Total warranty cost ÷ vehicles in service' },
      { name: 'Time to detect', definition: 'Days from first failure to containment action' },
      { name: 'Supplier recovery %', definition: 'Cost recovered from suppliers ÷ supplier-caused warranty cost' },
      { name: 'Repeat repair rate', definition: 'Vehicles with the same repair twice within 90 days ÷ repaired vehicles' },
    ],
    sources: {
      structured: [
        { name: 'Dealer warranty claims', description: 'Claims with part number, labour, cost, mileage' },
        { name: 'Vehicle build records', description: 'VIN, plant, build date, supplier lots fitted' },
      ],
      semi: [{ name: 'Telematics alerts', format: 'JSON Lines', description: 'Diagnostic trouble codes from connected vehicles' }],
      unstructured: [{ name: 'Technician comments and failed-part photos', description: 'Free-text comments and photos from dealers' }],
    },
    dataset: {
      name: 'warranty_claim', minRows: 100,
      columns: [key('claim_id', 'e.g. WCL0001'), str('vin_ref', 'Masked vehicle reference'), str('part_number'), str('supplier_id'), cat('plant', ['Pune', 'Chennai', 'Manesar', 'Sanand']),
        date('build_date'), date('claim_date'), int('mileage_km', 0, 500000), num('claim_cost', 0, 1000000), cat('failure_mode', ['Electrical', 'Mechanical', 'Leak', 'Noise', 'Software'])],
    },
    gold: {
      name: 'gold_part_quality', minRows: 50,
      columns: [key('part_supplier_month'), str('part_number'), str('supplier_id'), num('claims_per_1000', 0, 1000), num('warranty_cost', 0, 1000000000), num('trend_vs_3m', -1, 10), cat('status', ['Normal', 'Watch', 'Contain'])],
    },
    quality: ['Claim date before vehicle build date', 'Mileage decreasing for the same vehicle', 'Part numbers with and without supplier suffix', 'Duplicate claims for the same repair', 'Customer names and phone numbers in technician comments'],
    dashboard: {
      pages: [
        { name: 'Warranty overview', visuals: ['Claims per 1,000 trend', 'Warranty cost by failure mode', 'Top 10 parts by cost'] },
        { name: 'Hotspots', visuals: ['Parts in Contain status', 'Claims by supplier lot and plant', 'Build-month vs failure curve'] },
        { name: 'Suppliers', visuals: ['Supplier recovery %', 'Claims by supplier', 'Repeat repair rate'] },
      ],
      measures: [{ name: 'Claims per 1000', dax: 'AVERAGE(gold_part_quality[claims_per_1000])' }, { name: 'Warranty Cost', dax: 'SUM(gold_part_quality[warranty_cost])' }, { name: 'Parts to Contain', dax: 'CALCULATE(COUNTROWS(gold_part_quality), gold_part_quality[status] = "Contain")' }],
    },
    insight: 'One supplier’s alternator lot built in March caused 31% of electrical claims; telematics low-voltage codes appeared on average 23 days before the claim, enough time for a service campaign.',
  },
];
