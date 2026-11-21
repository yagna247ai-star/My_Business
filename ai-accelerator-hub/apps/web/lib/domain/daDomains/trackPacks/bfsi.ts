/**
 * BFSI: four tracks from the same retail lender (Hyderabad), from a one-branch call list to real-time mule-account
 * detection. Hard is the original "Loan Default Early Warning" journey (slug da-bfsi), so existing learners stay put.
 */
import type { DomainSpec } from '../types';
import { key, str, int, num, date, cat } from '../types';
import { steps, type TrackPackUi } from './types';

const BRANCHES = ['Ameerpet', 'Kukatpally', 'Secunderabad', 'Warangal', 'Vijayawada', 'Guntur'];
const PRODUCTS = ['Home', 'Personal', 'Vehicle', 'Gold', 'MSME'];

export const BFSI_PACK: TrackPackUi = {
  domain: 'bfsi',
  org: 'lender',
  criticalAck: 'I understand the Critical track rules: I will use synthetic data only, never real customer or transaction data; a person always decides before any account is frozen, and the analysis never contacts a customer; customer data is shown only to the fraud desk.',
  love: {
    easy: 'Making a simple daily list that a busy branch actually uses',
    intermediate: 'Finding the good customers a bank overlooks',
    hard: 'Predicting which loans will go bad before they do',
    critical: 'Stopping fraud in minutes, when money is moving',
  },
  need: {
    easy: 'No borrower misses an EMI just because nobody called',
    intermediate: 'Good borrowers get fair credit offers',
    hard: 'Bad loans are caught early and handled kindly',
    critical: 'Victims’ money is stopped before it disappears',
  },
  tracks: [
    {
      level: 'easy', problemId: 'emi-bounce-list', title: 'EMI bounce call list for one branch',
      question: 'Every morning by 9:00, which borrowers at the Ameerpet branch had an EMI bounce yesterday, or have an EMI due in 3 days without auto-debit, so the branch calls them first?',
      situation: 'At the Ameerpet branch, 38 EMIs bounced last Monday. The branch manager found out on Thursday from a printed report, by which time 11 accounts had a second bounce and a penal charge. The officers have time for 40 calls a day but no list of whom to call first.',
      scope: [{ label: 'Branches', value: '1 (Ameerpet)' }, { label: 'Loans', value: '2,400 active' }, { label: 'Sources', value: '2: EMI schedule, bank statement debits' }, { label: 'Refresh', value: 'Daily by 9:00 am' }, { label: 'Users', value: 'Branch manager, 3 loan officers' }],
      forYou: ['New to data, comfortable with Excel', 'Want a quick, visible win', 'Heading for a Data or BI Analyst role'],
      effort: 'About 1.5 hours a day', xpMultiplier: 1,
      data: [{ table: 'emi_schedule', rows: '≈ 2,400 a month', source: 'Loan system export (CSV)' }, { table: 'debit_returns', rows: '≈ 150 a month', source: 'Bank statement returns (Excel)' }],
      steps: steps([
        'A one-page canvas: the call-list question, two KPIs (bounce rate; same-day cure rate) and who calls whom.',
        'Generate the EMI schedule CSV, load it into Excel and a SQL database, and count bounces per day.',
        'Dev and prod catalogs; mask borrower name and mobile number.',
        'Load the daily EMI file and the returns file into bronze.',
        'Standard EMI status codes, one row per EMI, no duplicate debits.',
        'Gold call list: one row per borrower with bounces in 3 months, days late and call priority.',
        'One Power BI page the branch opens at 9:00: today’s call list and the bounce trend.',
        'A simple model of who is likely to bounce next week, checked against last month.',
        'Daily job and a demo to the branch manager.',
      ]),
      solution: 'A 9:00 am call list for the Ameerpet branch that puts yesterday’s bounces and next week’s risky EMIs first, so the officers’ 40 calls go to the right borrowers.',
      success: ['Bounce rate down from 6% to 4% in a quarter', 'Every bounced EMI is called within 1 working day', 'Same-day cure rate above 50%'],
      whatMakesItHard: 'EMI status codes typed differently by each officer, and a list simple enough that the branch uses it every morning.',
    },
    {
      level: 'intermediate', problemId: 'borrower-360', title: 'Borrower 360 and fair top-up offers',
      question: 'For every borrower across 6 branches, what do loans, deposits, repayments and app use say about them, and which good borrowers deserve a pre-approved top-up loan that the branch never offered?',
      situation: 'Ravi, a bus conductor, has paid 47 of 48 car-loan EMIs on time and keeps a steady balance, but nobody offers him a top-up, so he borrows from a digital lender at 36%. Meanwhile the branch pushes personal loans to customers already over-borrowed elsewhere.',
      scope: [{ label: 'Branches', value: '6' }, { label: 'Customers', value: '58,000' }, { label: 'Sources', value: '4: loan ledger, deposits, bureau, mobile app events (JSON)' }, { label: 'Refresh', value: 'Daily by 7:00 am' }, { label: 'Users', value: 'Branch managers, product team, credit team' }],
      forYou: ['Comfortable with SQL and some Power BI', 'Enjoy joining messy sources into one clear picture', 'Heading for an Analytics Engineer or Senior BI role'],
      effort: 'About 2.5 hours a day', xpMultiplier: 1.25,
      data: [{ table: 'loan_ledger', rows: '≈ 70,000', source: 'Core banking (CSV)' }, { table: 'deposit_balances', rows: '≈ 1.7 million a month', source: 'Core banking (CSV)' }, { table: 'bureau_refresh', rows: '≈ 58,000 a quarter', source: 'Credit bureau file' }, { table: 'app_events', rows: '≈ 2 million a month', source: 'Mobile app (JSON Lines)' }],
      steps: steps([
        'Problem canvas, the 360° score (repayment 40%, balance 25%, tenure 15%, engagement 20%), the offer rules and fairness rules.',
        'Generate the customer profile CSV and the app events JSON; map one customer key across sources.',
        'Dev and prod catalogs, branch row filters, masks on name, PAN and mobile.',
        'Load CSV, bureau file and app JSON into bronze; handle a new app field (schema evolution).',
        'One customer key, standard segments, expectations with a quarantine table.',
        'Star schema; dim_customer as SCD Type 2; gold 360° profile and offer eligibility.',
        'Three pages with row-level security: branch overview, one-page customer profile, offer list.',
        'A transparent eligibility score plus customer segments (k-means) tracked in MLflow, with a fairness check by segment.',
        'Daily job, Asset Bundle, runbook and a product-committee demo.',
      ]),
      solution: 'A trusted 360° view of every borrower, a one-page profile for branch staff, and a fair, explainable list of pre-approved top-up offers for customers like Ravi.',
      success: ['100% of active borrowers have a 360° profile', 'Top-up offers convert at 8% or more', 'Default rate on top-ups stays below the portfolio average'],
      whatMakesItHard: 'Four sources with different customer IDs, history that must not be overwritten, and offers that are fair across segments.',
    },
    {
      level: 'hard', problemId: 'default-early-warning', title: 'Loan default early warning',
      question: 'Every morning by 8:00, which loan accounts are most likely to reach 90+ days past due in the next 3 months, so collections calls them first and offers restructuring early?',
      situation: 'The lender finds out about bad loans only after borrowers miss three EMIs. Repayment history, balances, bureau scores and collection-call notes sit in separate systems, so collections always calls too late.',
      scope: [{ label: 'Accounts', value: '4 million' }, { label: 'Sources', value: '5: loan ledger, repayments, bureau, app events (JSON Lines), call notes' }, { label: 'Refresh', value: 'Daily by 8:00 am' }, { label: 'Users', value: 'Chief Risk Officer, collections, branch managers' }],
      forYou: ['Comfortable with SQL and Python', 'Want to build and explain a real risk model', 'Heading for a Data Scientist role'],
      effort: 'About 3.5 hours a day', xpMultiplier: 1.5,
      data: [{ table: 'loan_account_month', rows: '≈ 4 million a month', source: 'Core banking' }, { table: 'repayments', rows: '≈ 25 million a month', source: 'Repayment system' }, { table: 'app_events', rows: '≈ 30 million a month', source: 'Mobile app (JSON Lines)' }],
      steps: steps([
        'Problem canvas, KPI tree (Gross NPA, 30+ DPD, roll rate) and the business case.',
        'Generate the loan account CSV, app events and call notes; Excel and SQL checks.',
        'Dev and prod catalogs, masks on PAN and mobile, branch row filters.',
        'Auto Loader ingestion of ledger, repayments and app events into bronze.',
        'Clean silver with expectations, DPD buckets and one account key.',
        'Gold risk mart with 3-month DPD trend and EMI-paid ratio.',
        'Portfolio, early-warning list and drivers pages with row-level security.',
        'A default model tracked in MLflow, with explainability and fairness checks.',
        'Daily scoring job, monitoring and a risk-committee demo.',
      ]),
      solution: 'A daily early-warning list that ranks accounts by default risk with reasons, so collections calls the right borrowers in the first 15 days of delinquency.',
      success: ['Early-warning hit rate above 40%', '30+ DPD down 1.5 points in two quarters', 'List ready by 8:00 am on 95% of days'],
      whatMakesItHard: 'Many sources at scale, leakage-free model design, and explaining every flag to the risk committee.',
    },
    {
      level: 'critical', problemId: 'mule-accounts', title: 'Real-time mule-account and UPI fraud detection',
      question: 'Within 30 minutes of money arriving, which accounts are behaving like mule accounts (many new senders, money in and straight out), so the fraud desk can review and request a freeze before victims’ money disappears?',
      situation: 'A retired teacher in Warangal lost ₹4.2 lakh to a “digital arrest” call. Her money landed in a 9-day-old account at the bank and was withdrawn across 14 ATMs within 2 hours. The signs were in the data: a brand-new account, 37 new senders in a day, and every rupee leaving within minutes.',
      scope: [{ label: 'Accounts', value: '1.2 million savings accounts' }, { label: 'Sources', value: '4: UPI/IMPS transactions, account master, device logs (JSON), cyber-crime complaints' }, { label: 'Refresh', value: 'Every 5 minutes' }, { label: 'Users', value: 'Fraud desk, AML officer, branch managers' }],
      forYou: ['Strong SQL and Python; curious about streaming', 'Want work where minutes matter and ethics are strict', 'Heading for an ML Engineer or Fraud/AML analytics role'],
      effort: 'About 4.5 hours a day', xpMultiplier: 1.75,
      data: [{ table: 'payment_txn', rows: '≈ 40 million a month', source: 'UPI/IMPS switch (stream)' }, { table: 'account_master', rows: '1.2 million', source: 'Core banking' }, { table: 'device_events', rows: '≈ 10 million a month', source: 'Mobile app (JSON Lines)' }, { table: 'cyber_complaints', rows: '≈ 300 a month', source: 'National cyber-crime portal referrals' }],
      steps: steps([
        'Problem canvas: mule patterns, the 30-minute SLA, who may freeze, and the legal duties (STR to FIU-IND).',
        'Generate synthetic transactions with mule patterns; Excel and SQL checks of inflow and outflow per account.',
        'Strict catalogs: fraud data visible only to the fraud desk; masks on name, mobile and account number.',
        'Streaming-style ingestion of transactions every 5 minutes into bronze.',
        'Silver with one account key, de-duplicated transactions and expectations.',
        'Gold mule features: inflow, outflow, pass-through ratio, new senders in 24 hours.',
        'A fraud-desk queue page with reasons for every alert, and a daily STR summary.',
        'A risk model measured first on missed mules (recall), with a person always deciding.',
        'A 5-minute job, alerting, an incident runbook and a fraud-committee demo.',
      ]),
      solution: 'A fraud-desk queue that flags likely mule accounts within 30 minutes with clear reasons, so a person can review and request a freeze before the money is gone, and STRs are filed on time.',
      success: ['Median time from first suspicious credit to review under 30 minutes', 'At least 80% of confirmed mule accounts flagged before the money leaves', 'Every STR filed within the legal deadline'],
      whatMakesItHard: 'Near-real-time data, rare events, the cost of wrongly freezing an honest customer, and strict legal and privacy rules.',
      gate: 'Confirm the Critical track rules (synthetic data only; a person always decides) before you start.',
    },
  ],
};

const track = (level: 'easy' | 'intermediate' | 'critical') => BFSI_PACK.tracks.find(t => t.level === level)!;

/** The three new journeys. Hard is the domain's original spec. */
export function bfsiTrackSpecs(base: DomainSpec): Record<'easy' | 'intermediate' | 'critical', DomainSpec> {
  return {
    easy: {
      ...base, slug: 'bfsi-easy', code: 'BFE', catalog: 'bfsi_branch', entity: 'EMI',
      problem: {
        title: 'EMI Bounce Call List', statement: track('easy').situation,
        stakeholders: ['Branch manager', 'Loan officers', 'Collections head', 'Borrowers'],
        decisions: ['Whom the branch calls first each morning', 'Which borrowers to remind before the due date', 'When to escalate repeated bounces to collections'],
        questions: ['Which borrowers at Ameerpet had an EMI bounce yesterday, by product?', 'Which EMIs are due in the next 3 days without auto-debit?', 'Is this week’s bounce rate above the 4-week average, by product?'],
      },
      kpis: [
        { name: 'Bounce rate', definition: 'EMIs bounced ÷ EMIs due in the period × 100' },
        { name: 'Same-day cure rate', definition: 'Bounced EMIs paid within 3 days ÷ bounced EMIs × 100' },
        { name: 'Call coverage', definition: 'Bounced EMIs called within 1 working day ÷ bounced EMIs × 100' },
        { name: 'Collection efficiency', definition: 'EMI amount collected ÷ EMI amount due × 100' },
      ],
      sources: {
        structured: [{ name: 'EMI schedule export', description: 'One row per EMI: due date, amount, status' }, { name: 'Debit returns file', description: 'Auto-debit returns with reason codes' }],
        semi: [{ name: 'SMS reminder log', format: 'JSON', description: 'Reminders sent and delivery status per borrower' }],
        unstructured: [{ name: 'Officer call notes', description: 'Short notes such as “salary late, will pay Friday”' }],
      },
      dataset: {
        name: 'emi_schedule', minRows: 100,
        columns: [key('emi_id', 'Unique EMI ID, e.g. EMI00001'), str('loan_account_id', 'e.g. LN0001'), cat('product', PRODUCTS), date('due_date'), num('emi_amount', 500, 500000),
          cat('status', ['Paid', 'Paid late', 'Bounced', 'Due']), int('days_late', 0, 90), cat('auto_debit', ['Yes', 'No'])],
      },
      gold: {
        name: 'gold_branch_call_list', minRows: 50,
        columns: [key('loan_account_id'), cat('product', PRODUCTS), int('bounces_3m', 0, 3), int('max_days_late', 0, 90), date('next_due_date'), cat('call_priority', ['Call today', 'This week', 'No call'])],
      },
      quality: ['EMI status typed as Bounced, bounce, RTN and returned', 'The same EMI debited twice after a retry', 'Due dates on Sundays that the bank moved to Monday', 'Loan numbers with and without the “LN” prefix', 'Borrower mobile numbers in officer notes that must be removed'],
      dashboard: {
        pages: [{ name: 'Today’s call list', visuals: ['Borrowers to call today, by priority', 'EMIs due in 3 days without auto-debit', 'Print view for the officers'] }, { name: 'Bounce trend', visuals: ['Daily bounce rate against the 4-week average', 'Bounces by product'] }],
        measures: [{ name: 'Call Today', dax: 'CALCULATE(COUNTROWS(gold_branch_call_list), gold_branch_call_list[call_priority] = "Call today")' }, { name: 'Bounce Rate', dax: 'DIVIDE(CALCULATE(COUNTROWS(emi_schedule), emi_schedule[status] = "Bounced"), COUNTROWS(emi_schedule))' }],
      },
      insight: 'Bounces cluster on EMIs due on the 5th for borrowers without auto-debit; calling them two days before the due date would prevent about a third of bounces.',
      enterprise: {
        scale: '1 branch · 2,400 loans · about 2,400 EMIs a month', sla: 'Call list ready by 9:00 am IST every working day',
        regulations: ['DPDP Act 2023', 'RBI Fair Practices Code for lenders', 'RBI guidelines on recovery agents and collection conduct'],
        piiColumns: ['borrower_name', 'mobile_number'], scdDimension: 'dim_loan (auto-debit mandate changes)',
        ml: { target: 'call_priority', task: 'classification', features: ['days_late', 'auto_debit', 'emi_amount', 'product'], why: 'Predict which borrowers are likely to bounce next week so the branch reminds them before the due date' },
      },
      track: undefined, situations: undefined,
    },
    intermediate: {
      ...base, slug: 'bfsi-intermediate', code: 'BFI', catalog: 'bfsi_360', entity: 'customer',
      problem: {
        title: 'Borrower 360 and Top-up Offers', statement: track('intermediate').situation,
        stakeholders: ['Branch managers', 'Retail product team', 'Credit team', 'Customers'],
        decisions: ['Which borrowers get a pre-approved top-up offer this month', 'What branch staff say in a customer meeting', 'Which customers must not be offered more credit'],
        questions: ['Which borrowers paid at least 95% of EMIs on time with a bureau score above 720, by branch?', 'How does the 360° score differ between customers with one product and with three or more?', 'Which branches have the lowest share of customers with a complete profile?'],
      },
      kpis: [
        { name: 'Customer 360° score', definition: 'Repayment 40%, balance 25%, tenure 15%, engagement 20%, scaled 0–100' },
        { name: 'Offer conversion rate', definition: 'Top-up offers accepted ÷ offers made × 100' },
        { name: 'Products per customer', definition: 'Active products ÷ active customers' },
        { name: 'Top-up default rate', definition: 'Top-up loans 90+ days past due ÷ top-up loans × 100' },
      ],
      sources: {
        structured: [{ name: 'Loan ledger', description: 'Loans, EMIs and repayment history' }, { name: 'Deposit balances', description: 'Monthly average balance per account' }, { name: 'Bureau refresh', description: 'Quarterly bureau score per customer' }],
        semi: [{ name: 'Mobile app events', format: 'JSON Lines', description: 'Logins, bill payments, offer clicks' }],
        unstructured: [{ name: 'Relationship-manager notes', description: 'Meeting notes such as “planning daughter’s wedding next year”' }],
      },
      dataset: {
        name: 'customer_profile_month', minRows: 100,
        columns: [key('customer_id', 'Unique customer ID, e.g. CUS0001'), cat('branch', BRANCHES), cat('segment', ['Salaried', 'Self-employed', 'MSME', 'Farmer']), int('products_held', 1, 6),
          num('total_outstanding', 0, 20000000), num('on_time_emi_pct', 0, 100), num('avg_balance', 0, 5000000), int('bureau_score', 300, 900), int('app_logins_month', 0, 200), date('record_date')],
      },
      gold: {
        name: 'gold_customer_360', minRows: 50,
        columns: [key('customer_id'), cat('segment', ['Salaried', 'Self-employed', 'MSME', 'Farmer']), num('repayment_score', 0, 100), num('balance_score', 0, 100), num('engagement_score', 0, 100), num('overall_360_score', 0, 100), cat('offer_eligible', ['Yes', 'No']), num('offer_amount', 0, 2000000)],
      },
      quality: ['The same customer with different IDs in loans and deposits', 'Bureau scores of 0 or 999 used for “not available”', 'Segments typed as Salaried, salaried and SAL', 'Balances in rupees and in lakhs in the same column', 'PAN numbers in relationship-manager notes that must be removed'],
      dashboard: {
        pages: [{ name: 'Branch overview', visuals: ['Average 360° score by branch and segment', 'Profile completeness by branch'] }, { name: 'Customer profile', visuals: ['Radar of the four sub-scores', 'Products held and repayment history', 'Offer and reason'] }, { name: 'Offer list', visuals: ['Eligible customers with offer amount', 'Offers by segment (fairness view)'] }],
        measures: [{ name: 'Avg 360 Score', dax: 'AVERAGE(gold_customer_360[overall_360_score])' }, { name: 'Eligible Customers', dax: 'CALCULATE(COUNTROWS(gold_customer_360), gold_customer_360[offer_eligible] = "Yes")' }],
      },
      insight: 'About 3,900 borrowers with on-time repayment above 95% and stable balances were never offered a top-up; a third of them later borrowed from digital lenders at higher rates.',
      enterprise: {
        scale: '6 branches · 58,000 customers · about 2 million app events a month', sla: 'Profiles and offer list refreshed by 7:00 am IST daily',
        regulations: ['DPDP Act 2023', 'RBI Master Direction on Digital Lending (2025)', 'RBI Fair Practices Code', 'Credit Information Companies (Regulation) Act 2005'],
        piiColumns: ['customer_name', 'pan_number', 'mobile_number'], scdDimension: 'dim_customer (segment and branch changes)',
        ml: { target: 'offer_eligible', task: 'classification', features: ['on_time_emi_pct', 'avg_balance', 'bureau_score', 'products_held'], why: 'Find borrowers who deserve a fair top-up offer, with reasons a branch officer can explain, and check the offers are fair across segments' },
      },
      track: undefined, situations: undefined,
    },
    critical: {
      ...base, slug: 'bfsi-critical', code: 'BFC', catalog: 'bfsi_fraud', entity: 'account',
      problem: {
        title: 'Mule-account and UPI Fraud Detection', statement: track('critical').situation,
        stakeholders: ['Fraud desk', 'AML officer (Principal Officer)', 'Branch managers', 'Victims and customers'],
        decisions: ['Which accounts the fraud desk reviews first', 'When to request a freeze (always decided by a person)', 'Which cases to report to FIU-IND as suspicious transactions'],
        questions: ['Which accounts under 30 days old received money from 10 or more new senders in 24 hours?', 'Which accounts sent out more than 90% of what came in within 2 hours?', 'How long, in minutes, from the first suspicious credit to a fraud-desk review, by day?'],
      },
      kpis: [
        { name: 'Time to review', definition: 'Minutes from the first suspicious credit to a fraud-desk decision' },
        { name: 'Mules caught before cash-out', definition: 'Confirmed mule accounts flagged before the money left ÷ all confirmed mule accounts × 100' },
        { name: 'False positive rate', definition: 'Alerts closed as genuine customers ÷ all alerts × 100' },
        { name: 'STR on time', definition: 'Suspicious transaction reports filed within the legal deadline ÷ all STRs × 100' },
      ],
      sources: {
        structured: [{ name: 'UPI and IMPS transactions', description: 'Every credit and debit with time, amount and counterparty' }, { name: 'Account master', description: 'Account opening date, KYC type and branch' }],
        semi: [{ name: 'Device and login events', format: 'JSON Lines', description: 'Device changes, SIM changes and logins per account' }],
        unstructured: [{ name: 'Cyber-crime complaint referrals', description: 'Complaint text from the 1930 helpline and portal' }],
      },
      dataset: {
        name: 'payment_txn', minRows: 100,
        columns: [key('txn_id', 'Unique transaction ID, e.g. TXN000001'), str('account_id', 'e.g. AC0001'), date('txn_date'), int('txn_hour', 0, 23), num('amount', 1, 500000),
          cat('direction', ['Credit', 'Debit']), cat('channel', ['UPI', 'IMPS', 'NEFT', 'ATM withdrawal']), int('account_age_days', 0, 3650), int('new_senders_24h', 0, 500), cat('alert_level', ['None', 'Low', 'High', 'Urgent'])],
      },
      gold: {
        name: 'gold_mule_alerts', minRows: 50,
        columns: [key('account_id'), num('inflow_24h', 0, 50000000), num('outflow_24h', 0, 50000000), num('pass_through_ratio', 0, 1), int('new_senders_24h', 0, 500), num('risk_score', 0, 100), cat('action', ['Monitor', 'Review', 'Freeze request'])],
      },
      quality: ['The same transaction twice after a switch retry', 'Transaction times in UTC and IST mixed', 'Reversed transactions still counted as credits', 'Account numbers with and without leading zeros', 'Victim names and phone numbers in complaint text that must never leave the fraud desk'],
      dashboard: {
        pages: [{ name: 'Fraud-desk queue', visuals: ['Alerts by risk and age in minutes', 'Reasons for each alert', 'Review outcome'] }, { name: 'Speed and accuracy', visuals: ['Time to review by hour', 'Mules caught before cash-out', 'False positives by rule'] }, { name: 'STR summary', visuals: ['Suspicious cases this month', 'Filed on time'] }],
        measures: [{ name: 'Urgent Alerts', dax: 'CALCULATE(COUNTROWS(gold_mule_alerts), gold_mule_alerts[action] = "Freeze request")' }, { name: 'Avg Pass-through', dax: 'AVERAGE(gold_mule_alerts[pass_through_ratio])' }],
      },
      insight: 'Accounts under 30 days old that received money from 10 or more new senders and sent over 90% out within 2 hours were 60 times more likely to be confirmed mules; reviewing them within 30 minutes would have stopped about 70% of losses.',
      enterprise: {
        scale: '1.2 million accounts · about 40 million transactions a month · alerts every 5 minutes', sla: 'Every High or Urgent alert reviewed by a person within 30 minutes, 24×7',
        regulations: ['Prevention of Money Laundering Act 2002 and PML Rules (STR to FIU-IND)', 'RBI Master Directions on Fraud Risk Management (2024)', 'RBI Master Direction on KYC', 'DPDP Act 2023', 'National Cyber Crime Reporting Portal and 1930 helpline referrals'],
        piiColumns: ['customer_name', 'mobile_number', 'account_number'], scdDimension: 'dim_account (KYC and status changes)',
        ml: { target: 'alert_level', task: 'classification', features: ['account_age_days', 'new_senders_24h', 'amount', 'txn_hour'], why: 'Rank suspicious accounts so no Urgent case waits, measuring missed mules first, with a person always deciding before any freeze' },
      },
      track: undefined, situations: undefined,
    },
  };
}
