/**
 * Education — Ikigai analysis of candidate problems, and four learner tracks (Easy, Intermediate, Hard, Critical).
 * All tracks use the same illustrative organisation (Vidyanjali Group of Schools, see education.ts) so the story carries
 * across tracks; each track changes the problem statement, scope, data, steps and solution.
 *
 * Ikigai score = average of the four circles (needs, paid, skills, love), each 1–5. Feasibility breaks ties.
 */
import type { CandidateProblem, IkigaiQuestion, ProblemTrack, TrackLevel } from './types';

export const ikigaiScore = (p: CandidateProblem) => (p.score.needs + p.score.paid + p.score.skills + p.score.love) / 4;

export const EDUCATION_CANDIDATES: CandidateProblem[] = [
  { id: 'early-warning', track: 'hard', title: 'Notice the struggling child in July, not March', hook: 'About 400 children a year leave avoidably; warning signs sit in six systems, unseen.',
    score: { needs: 5, paid: 5, skills: 5, love: 4, feasibility: 4 },
    why: { needs: 'About 400 children a year at one group; 8–11% secondary dropout nationally.', paid: 'Direct fee ROI: about ₹8 crore a year at stake; counsellor rule forces spend.', skills: 'The full modern stack: ingestion, medallion, governance, ML, BI, MLOps.', love: 'A clear villain (the detection gap) and a hero moment (flagging Arjun in week 9).' } },
  { id: 'talent-360', track: 'intermediate', title: 'See every child’s strengths, not just marks', hook: 'Champions like Meghana are invisible to scholarships; competitors recruit them.',
    score: { needs: 4, paid: 4, skills: 4, love: 5, feasibility: 4 },
    why: { needs: 'Every child, every term; the Holistic Progress Card makes it expected.', paid: 'Retains talented children and siblings; needed for HPC compliance.', skills: 'Multi-source integration, history (SCD Type 2), secure dashboards.', love: 'A positive story: discovering talent rather than chasing failure.' } },
  { id: 'safeguarding', track: 'critical', title: 'Same-day escalation when a child may be unsafe', hook: 'A disclosure in a counsellor’s notebook can wait days. It must reach the right adult in hours.',
    score: { needs: 5, paid: 3, skills: 5, love: 4, feasibility: 2 },
    why: { needs: 'Life-safety stakes; 13,044 student suicides in 2022 (NCRB); POCSO reporting duties.', paid: 'Compliance- and trust-driven rather than revenue; budgets follow incidents.', skills: 'Near-real-time pipelines, text signals, strict governance, audit, incident response.', love: 'Deeply meaningful, but emotionally heavy; not for everyone.' } },
  { id: 'catch-up', track: 'easy', title: 'A catch-up plan for every child after an absence', hook: 'In fever season 17 of 48 children are absent; nobody tracks what they missed.',
    score: { needs: 4, paid: 3, skills: 3, love: 4, feasibility: 5 },
    why: { needs: 'Every campus, every fever and exam season.', paid: 'Modest direct ROI; prevents the slide that later becomes attrition.', skills: 'Core SQL, clean data, a useful dashboard: the analyst foundation.', love: 'Quick, visible wins teachers thank you for in week one.' } },
  { id: 'may-exam', title: 'Who should sit the May board exam, in which subjects', hook: 'The optional second Class 10 exam can lift results, if the right students take it.',
    score: { needs: 4, paid: 4, skills: 3, love: 3, feasibility: 4 },
    why: { needs: 'About 1,370 Class 10 students a year at one group.', paid: 'Board results drive next year’s admissions.', skills: 'Trend analysis and simple prediction per subject.', love: 'Seasonal, a once-a-year decision.' } },
  { id: 'fee-distress', title: 'Spot families in financial distress early, and kindly', hook: 'A late instalment is often the first sign of trouble at home.',
    score: { needs: 4, paid: 5, skills: 3, love: 2, feasibility: 4 },
    why: { needs: 'Hundreds of families a year; fee hikes of 10–20% in cities.', paid: 'Finance teams fund it immediately.', skills: 'Ledger analytics and risk scoring.', love: 'Ethical tension: easy to misuse for collections rather than support.' } },
  { id: 'admissions', title: 'Turn more enquiries into admissions', hook: 'About ₹2 crore a year goes on ads and fairs; nobody knows which work.',
    score: { needs: 2, paid: 5, skills: 3, love: 3, feasibility: 4 },
    why: { needs: 'Helps the school, not directly the children.', paid: 'Marketing budgets are large and measurable.', skills: 'Funnel and attribution analytics.', love: 'Familiar marketing analytics.' } },
  { id: 'teacher-time', title: 'Give every teacher back four hours a month', hook: '520 teachers copy registers into Excel every Friday.',
    score: { needs: 3, paid: 3, skills: 3, love: 3, feasibility: 5 },
    why: { needs: 'Teachers spend most of their time on non-teaching work (NIEPA).', paid: 'Savings are real but spread thin (about ₹0.9 crore a year).', skills: 'Automation and reporting.', love: 'Useful, rarely exciting.' } },
];

/** Candidates ranked by Ikigai score, feasibility breaking ties. */
export const rankedCandidates = () => [...EDUCATION_CANDIDATES].sort((a, b) => ikigaiScore(b) - ikigaiScore(a) || b.score.feasibility - a.score.feasibility);

const M = ['Frame the problem', 'Collect the data', 'Databricks and Unity Catalog', 'Load to Bronze', 'Clean to Silver', 'Build Gold', 'Power BI', 'Predict with ML and AI', 'Go live'];
const steps = (d: string[]) => d.map((deliverable, i) => ({ module: M[i], deliverable }));

export const EDUCATION_TRACKS: ProblemTrack[] = [
  {
    level: 'easy', problemId: 'catch-up', title: 'Catch-up radar for one campus',
    question: 'Every school morning by 7:30, which Kukatpally children missed 3 or more days in the last 10 school days or missed a test, and what do they need to catch up on?',
    situation: 'It is September and viral fever has hit Hyderabad. In Grade 9C, 17 of 48 children are absent on Monday. Attendance lives in a paper register typed into Excel on Fridays; marks in one Excel file per test. Nobody tracks who missed what, so absent children quietly fall behind, and parents hear about it only when marks drop at the half-yearly exam.',
    scope: [{ label: 'Campus', value: 'Kukatpally only' }, { label: 'Children', value: 'About 800 (Grades 6–12)' }, { label: 'Sources', value: '2: attendance, marks' }, { label: 'Refresh', value: 'Daily by 7:30 am' }, { label: 'Users', value: '18 class teachers, 1 principal' }],
    forYou: ['New to data, or comfortable with Excel', 'Want a first portfolio project that teachers actually use', 'Heading for a Data Analyst or BI Analyst role'],
    effort: 'About 1.5 hours a day', xpMultiplier: 1,
    data: [{ table: 'attendance_daily', rows: '≈ 16,000 a month', source: 'Paper register typed into Excel' }, { table: 'test_marks', rows: '≈ 2,400 per test cycle', source: 'Marks Excel' }],
    steps: steps([
      'A one-page canvas: the question, two KPIs (absence days in the last 10 school days; tests missed), and who acts on the list.',
      'Generate attendance_daily and test_marks CSVs with AI (with real mess: “AB”, double-counted holidays) and pass the dataset check.',
      'One catalog (catchup), three schemas, one volume; a teachers group with read access to gold only.',
      'Load both files into bronze with read_files and reconcile row counts.',
      'Clean: one attendance code set (P/A/L/M), “AB” means absent not zero, remove holiday duplicates, cap at 100%.',
      'Gold: absence_last_10_days and missed_tests per child, one row per child per day.',
      'One Power BI page per class: red, amber and green rows, a “missed tests” column, and a print view for the staff room.',
      'A flag rule, plus a simple forecast of next week’s absences tracked in MLflow, so the principal is warned before an absence wave.',
      'A scheduled daily job at 7:00 am, a half-page runbook, and a 5-minute demo to the principal.',
    ]),
    solution: 'A daily catch-up list for every class teacher at one campus, with the tests each child must make up, and an early alert when an absence wave starts.',
    success: ['90% of absent children have a catch-up plan within 3 school days', 'Teacher time on attendance reports down by 2 hours a month', 'List ready by 7:30 am on 95% of school days'],
    whatMakesItHard: 'Messy paper-to-Excel data, and making a list so simple that busy teachers use it every day.',
  },
  {
    level: 'intermediate', problemId: 'talent-360', title: 'Student 360° profile and talent finder',
    question: 'For every child in Grades 6–12 across 12 campuses, what are their strengths and concerns across academics, attendance, sports and culture, and which children deserve a scholarship that marks alone would miss?',
    situation: 'Meghana is the district’s best kabaddi raider and won the inter-school debate, but her marks average 68%, so the scholarship committee never sees her. A competitor school recruits her and her brother. At parent–teacher meetings the only document is a marks card. The new Holistic Progress Card expects much more, and the group cannot produce it.',
    scope: [{ label: 'Campuses', value: 'All 12' }, { label: 'Children', value: '9,600 (Grades 6–12)' }, { label: 'Sources', value: '4: SIS, attendance, marks, sports & cultural app (JSON)' }, { label: 'Refresh', value: 'Daily by 7:00 am' }, { label: 'Users', value: '520 teachers, 12 principals, scholarship committee' }],
    forYou: ['Comfortable with SQL and some Power BI', 'Enjoy joining messy sources into one clear picture', 'Heading for an Analytics Engineer or Senior BI role'],
    effort: 'About 2.5 hours a day', xpMultiplier: 1.25,
    data: [{ table: 'sis_students', rows: '9,600', source: 'SIS export (CSV)' }, { table: 'attendance_daily', rows: '≈ 190,000 a month', source: 'Excel, 12 campuses' }, { table: 'test_marks', rows: '≈ 29,000 per test cycle', source: 'Excel per class' }, { table: 'activity_events', rows: '≈ 40,000 a term', source: 'Sports & cultural app (nested JSON)' }],
    steps: steps([
      'Problem canvas, four sub-scores (academic 45%, attendance 20%, cultural 15%, sports 20%), the scholarship decision, and an HPC mapping.',
      'Generate four synthetic sources including nested JSON; map one student key across all four.',
      'Dev and prod catalogs, campus row filters, masks on name, date of birth and guardian phone.',
      'Load CSV, Excel and nested JSON into bronze; handle the app adding a new field (schema evolution).',
      'One student key across sources, standard sport and event names, pipeline expectations with a quarantine table.',
      'Star schema; dim_student as SCD Type 2 (section changes); gold 360° profile and talent score.',
      'Three pages with row-level security: campus overview, one-page child profile for parent meetings, talent shortlist.',
      'A transparent talent score, plus k-means “learner profiles” tracked in MLflow to spot children who do not fit the marks-only mould.',
      'Daily job, Asset Bundle with dev and prod, runbook, and a scholarship-committee demo.',
    ]),
    solution: 'A trusted 360° profile for every child across 12 campuses, a one-page parent-meeting view aligned to the Holistic Progress Card, and a talent shortlist that puts children like Meghana in front of the scholarship committee.',
    success: ['100% of children have a complete 360° profile', 'At least 15 of 60 scholarships recognise non-academic talent', 'The profile page is used in 80% of parent–teacher meetings'],
    whatMakesItHard: 'Four sources with four different IDs, nested JSON, history that must not be overwritten, and fair weighting of very different strengths.',
  },
  {
    level: 'hard', problemId: 'early-warning', title: 'Early-warning prediction and counsellor allocation',
    question: 'Every Monday at 8:00 am, which 40 children should each counsellor see this week, so that children at risk of failing or leaving are reached at least 6 weeks earlier than today?',
    situation: 'Arjun’s warning signs appeared in week 4 and were recorded in six systems by six adults; nobody saw them together until his family asked for a transfer certificate in week 40. About 400 children a year leave avoidably, costing about ₹8 crore. From 2026–27 the group must employ about 11 counsellors, and the trustees want proof they are working with the right children.',
    scope: [{ label: 'Campuses', value: 'All 12' }, { label: 'Children', value: '9,600, with 3 years of history' }, { label: 'Sources', value: '6: SIS, attendance, marks, sports app, counsellor notes, fee ledger' }, { label: 'Refresh', value: 'Daily by 7:00 am; risk list Mondays 8:00 am' }, { label: 'Users', value: '11 counsellors, 12 principals, trustees' }],
    forYou: ['Comfortable with SQL and Python', 'Want end-to-end ML in production, not just a notebook', 'Heading for a Data Scientist or ML-focused Analytics Engineer role'],
    effort: 'About 3.5 hours a day', xpMultiplier: 1.5,
    data: [{ table: 'six bronze sources', rows: '≈ 2.5 million rows a year', source: 'CSV, Excel, nested JSON, free text, Tally export' }, { table: 'features_risk_band', rows: '≈ 28,800 student-terms (3 years)', source: 'Gold' }, { table: 'labels', rows: '672 leavers last year', source: 'Fee ledger and exit records' }],
    steps: steps([
      'The full case file (Arjun’s timeline), business case with unit economics, SLA, data contracts, DPDP compliance box.',
      'Six synthetic sources including counsellor notes tagged by theme and fee-delay signals; pass the dataset check.',
      'Dev and prod catalogs, group grants, column masks (notes, fees, phone), campus row filters, audit.',
      'Auto Loader with schema evolution for daily uploads; reconcile every file.',
      'Profiling, deduplication across three IDs, Lakeflow expectations and quarantine.',
      'SCD Type 2, the 360° score, the early-warning flag, liquid clustering; reconcile to the SIS.',
      'Power BI with RLS, a Monday risk list, deployment pipeline Dev → Test → Prod, certified model.',
      'Leakage-free features, time-based split, MLflow, a model in Unity Catalog, daily batch scoring, AI/BI Genie, fairness by campus, gender and fee category, a model card.',
      'Back-test on last year (“Arjun flagged in week 9, not week 40”), Databricks job, Asset Bundle, runbook, go-live review with the board.',
    ]),
    solution: 'A daily-scored, explainable risk list that tells each counsellor which 40 children to see this week, with fairness checks and a full production pipeline, proven by a back-test on last year’s leavers.',
    success: ['At least 80% of children who later fail or leave are flagged 6 weeks earlier', 'Time from first warning to first action: 26 weeks → 2 weeks or less', 'Avoidable attrition 4.2% → 2.2% within two years'],
    whatMakesItHard: 'Six sources, label leakage, class imbalance, explaining a model to parents, and fairness across campuses.',
  },
  {
    level: 'critical', problemId: 'safeguarding', title: 'Same-day safeguarding escalation',
    question: 'When the signals around a child suggest they may be unsafe, how do we make sure the Designated Safeguarding Lead knows within 2 hours, every time, without exposing that child’s data to anyone else?',
    situation: 'In March a Grade 10 student told a counsellor something serious. The note sat in a paper notebook over a long weekend before anyone with authority saw it. The same week the student had stopped attending without any call home, and a friend had dropped an anonymous note in the wellbeing box. Each signal was known to someone; none reached the right person in time. Under POCSO, staff who learn of abuse must report it; delays and data leaks both cause real harm.',
    scope: [{ label: 'Campuses', value: 'All 12' }, { label: 'Children', value: '9,600' }, { label: 'Sources', value: 'Attendance (unexplained absence), counsellor notes, anonymous wellbeing box, nurse visits, marks collapse' }, { label: 'Refresh', value: 'Every 15 minutes in school hours' }, { label: 'Users', value: '12 Designated Safeguarding Leads and counsellors only; every view audited' }],
    forYou: ['Strong in SQL and Python; some streaming or text analytics', 'Want to work where data mistakes have real consequences (health, finance, safety)', 'Heading for an ML Engineer or Data Governance role in a regulated industry'],
    effort: 'About 4.5 hours a day', xpMultiplier: 2,
    data: [{ table: 'attendance_events', rows: 'Micro-batches every 15 minutes', source: 'Attendance app or register scans' }, { table: 'wellbeing_notes', rows: '≈ 1,500 a term (synthetic only)', source: 'Counsellor notes, wellbeing box, nurse log' }, { table: 'alerts and audit_log', rows: 'Every alert, acknowledgement and view', source: 'Gold, append-only' }],
    steps: steps([
      'Safeguarding canvas: signals, thresholds, escalation chain, POCSO and DPDP duties, what must never be automated.',
      'Synthetic notes only (never real disclosures), labelled by severity; unexplained-absence events.',
      'A separate restricted catalog; DSL-only access; masks on everything; an audit table for every query.',
      'Incremental ingestion every 15 minutes with Auto Loader or Lakeflow streaming tables.',
      'Text normalisation, de-identification, and expectations that block any note that still contains a name or phone number.',
      'Gold alert table with severity, evidence links, owner, acknowledgement time; append-only audit.',
      'A DSL console (not a general dashboard): open alerts, time since raised, acknowledge and close with reason.',
      'High-recall signal detection: rules plus a text classifier (or ai_query with a governed model); measure misses first; human review always; model card and red-team test.',
      'Alerting with escalation if not acknowledged in 2 hours, incident runbook, access review, and an ethics and go-live review.',
    ]),
    solution: 'A locked-down, audited escalation system that brings every serious safeguarding signal to the right adult within 2 hours, never decides on its own, and never shows a child’s data to anyone who does not need it.',
    success: ['At least 95% of serious synthetic test cases raise an alert (misses matter more than false alarms)', 'Median time from signal to acknowledgement under 2 hours', '100% of views and actions audited; zero unauthorised access in the review'],
    whatMakesItHard: 'Very low tolerance for misses, the most sensitive data a school holds, near-real-time pipelines, and the ethics of what a system should and should not do.',
    gate: 'Unlocks only after the learner passes a short safeguarding and data-ethics check. All data is synthetic. A person always decides; the system never contacts a child or family.',
  },
];

export const TRACK_LABEL: Record<TrackLevel, string> = { easy: 'Easy', intermediate: 'Intermediate', hard: 'Hard', critical: 'Critical' };

/** The learner's Ikigai quiz: what you love, what you are good at, what the world needs, what you want to be paid for, and your time. */
export const IKIGAI_QUIZ: IkigaiQuestion[] = [
  { circle: 'love', question: 'Which of these would you happily work on late into the night?', options: [
    { label: 'Making something simple that busy people use every day', points: { easy: 2, intermediate: 1 } },
    { label: 'Discovering strengths nobody noticed', points: { intermediate: 2 } },
    { label: 'Predicting what will happen before it happens', points: { hard: 2, critical: 1 } },
    { label: 'Protecting people when the stakes are highest', points: { critical: 2, hard: 1 } },
  ] },
  { circle: 'skills', question: 'What can you do today?', options: [
    { label: 'Excel, maybe a little SQL', points: { easy: 3 } },
    { label: 'SQL and some Power BI', points: { intermediate: 3, easy: 1 } },
    { label: 'SQL and Python, some machine learning', points: { hard: 3, intermediate: 1 } },
    { label: 'Python, ML, cloud, and some streaming or text analytics', points: { critical: 3, hard: 2 } },
  ] },
  { circle: 'needs', question: 'Which outcome matters most to you?', options: [
    { label: 'No child falls behind after an absence', points: { easy: 2 } },
    { label: 'Every child’s strengths are recognised', points: { intermediate: 2 } },
    { label: 'No child leaves without anyone noticing', points: { hard: 2 } },
    { label: 'Every child is safe', points: { critical: 2 } },
  ] },
  { circle: 'paid', question: 'Which role do you want in 12 months?', options: [
    { label: 'Data Analyst or BI Analyst', points: { easy: 2, intermediate: 1 } },
    { label: 'Analytics Engineer', points: { intermediate: 2, hard: 1 } },
    { label: 'Data Scientist', points: { hard: 2 } },
    { label: 'ML Engineer or Data Governance lead in a regulated industry', points: { critical: 2, hard: 1 } },
  ] },
  { circle: 'time', question: 'How much time can you give each day?', options: [
    { label: 'About 1–1.5 hours', points: { easy: 3 } },
    { label: 'About 2–3 hours', points: { intermediate: 3 } },
    { label: 'About 3–4 hours', points: { hard: 3 } },
    { label: '4 hours or more', points: { critical: 3, hard: 1 } },
  ] },
];

/** Recommend a track from the quiz answers (index of the chosen option per question). Ties go to the easier track. */
export function recommendTrack(answers: number[]): { level: TrackLevel; points: Record<TrackLevel, number> } {
  const points: Record<TrackLevel, number> = { easy: 0, intermediate: 0, hard: 0, critical: 0 };
  IKIGAI_QUIZ.forEach((q, i) => { const o = q.options[answers[i]]; if (o) for (const [k, v] of Object.entries(o.points)) points[k as TrackLevel] += v ?? 0; });
  const order: TrackLevel[] = ['easy', 'intermediate', 'hard', 'critical'];
  const level = order.reduce((best, l) => (points[l] > points[best] ? l : best), order[0]);
  return { level, points };
}
