/**
 * Enterprise problem dossier — Education · Student 360° Evaluation.
 * The school group, people and internal figures are ILLUSTRATIVE (a representative mid-size CBSE chain in Telangana),
 * built so learners understand the problem the way the people inside it do. Every rupee figure shows its working.
 * The national facts in `evidence` are real and carry their public source.
 */
import type { ProblemDossier } from './types';

export const EDUCATION_DOSSIER: ProblemDossier = {
  oneLine: 'Every year about 400 children leave Vidyanjali’s 12 schools for reasons the school could have seen months earlier: the warning signs were recorded, but in six different places by six different adults, and nobody ever saw them together. It costs the group about ₹8 crore a year, and it costs the children much more.',

  role: {
    title: 'You are the group’s first Data & Analytics Lead',
    from: 'K. Srinivas Rao, Managing Trustee, Vidyanjali Group of Schools',
    brief: [
      'Welcome. I will be direct about why you were hired.',
      'Last year 672 children left our schools before finishing Grade 12. Our exit forms say “personal reasons”. Our counsellors, teachers and coaches say most of them were struggling for months, and that each of them knew a piece of it. Nobody had the whole picture until the family asked for a transfer certificate.',
      'At the same time, children like Meghana, a district kabaddi champion with average marks, are invisible to our scholarship committee, and competitor schools are taking them.',
      'From this academic year CBSE expects a counsellor for every 500 senior students, a holistic progress card, and decisions about who should take the second board exam in May. We cannot do any of that from Excel files and paper registers.',
      'I want one trusted, private and up-to-date picture of every child, academic, attendance, sports, cultural, wellbeing and fees, on every principal’s and counsellor’s screen by 7:00 am each school day. I want us to notice an Arjun in July, not in March.',
      'You have 45 working days to show the board it works on our real systems. The board meets on Day 45.',
    ],
  },

  organisation: {
    name: 'Vidyanjali Group of Schools (illustrative)',
    profile: [
      '12 CBSE schools: 5 in Hyderabad (Kukatpally, Miyapur, Uppal, Kompally, LB Nagar) and 7 in tier-2 towns (Warangal ×2, Karimnagar, Nizamabad, Khammam, Siddipet, Mahabubnagar).',
      '9,600 students in Grades 6–12 (about 1,370 per grade, about 5,500 in Grades 9–12); average class size 46; 520 teachers; 12 principals; 1 academic head.',
      'Fees: ₹55,000 a year in tier-2 towns to ₹1,40,000 in Hyderabad; average ₹95,000; fees rise about 8% a year.',
      'Fee revenue about ₹91 crore a year (9,600 × ₹95,000); operating margin about 14% (≈ ₹12.8 crore).',
      '3 counsellors for the whole group, one for every 3,200 students. 1 sports and 1 cultural coordinator per school.',
      'Systems: a student information system (SIS) for admissions; Tally for fees; paper attendance registers in 7 schools (typed into Excel every Friday); an Excel marks file per class per test; a sports-events app used by coordinators; counsellors’ paper notebooks; WhatsApp groups for parents.',
    ],
  },

  timeline: {
    title: 'Arjun, Grade 9C, Kukatpally campus: academic year 2025–26',
    rows: [
      { when: 'Week 1 · 12 Jun', signal: 'Starts Grade 9. Grade 8 average 82%, attendance 96%, in the Under-15 football squad.', source: 'SIS, marks Excel', sawIt: 'Class teacher', action: 'None needed: a strong student.' },
      { when: 'Week 4 · 3 Jul', signal: 'Quarter-1 fee instalment paid 19 days late, and only in part. His father has lost his job.', source: 'Tally fee ledger', sawIt: 'Accounts clerk', action: 'Automatic reminder SMS. Nobody else told.' },
      { when: 'Week 6 · 21 Jul', signal: 'Absent three Mondays in a row.', source: 'Paper register', sawIt: 'Class teacher (Mr Imran)', action: 'None. “Lots of children miss Mondays.”' },
      { when: 'Week 9 · 9 Aug', signal: 'Misses 4 of 5 football practices; dropped from the squad.', source: 'Sports app', sawIt: 'Sports coordinator', action: 'Replaced him in the team.' },
      { when: 'Week 11 · 26 Aug', signal: 'Maths unit test 11/40 (it was 33/40 in March).', source: 'Marks Excel', sawIt: 'Maths teacher', action: '“Work harder” written on the paper.' },
      { when: 'Week 14 · 12 Sep', signal: 'Fever season: absent 6 days. Attendance since July falls to 79%, below the 80% early-warning line, together with a failing maths score.', source: 'Paper register → Friday Excel', sawIt: 'Class teacher, 4 days later', action: 'None. No catch-up plan for absent students.' },
      { when: 'Week 15 · 18 Sep', signal: 'Counsellor writes: “9C Arjun. quiet in corridor, says tired. father’s job changed? follow up after exams.”', source: 'Counsellor’s notebook', sawIt: 'Counsellor (1 of 3 for 9,600 children)', action: 'Follow-up never happens: 61 referrals ahead of him.' },
      { when: 'Week 16 · 30 Sep', signal: 'Half-yearly exams: 54% overall.', source: 'Marks Excel', sawIt: 'All his teachers', action: 'Printed on the report card.' },
      { when: 'Week 18 · 14 Oct', signal: 'Parent–teacher meeting: 4 minutes. His mother asks, “Why did nobody tell me in July?”', source: 'None recorded', sawIt: 'Class teacher, mother', action: '“He needs to focus.”' },
      { when: 'Week 27 · 15 Dec', signal: 'Quarter-3 instalment unpaid. Attendance 71%.', source: 'Tally, register', sawIt: 'Accounts clerk', action: 'Two more reminder SMS.' },
      { when: 'Week 40 · 20 Mar', signal: 'Family asks for a transfer certificate; Arjun moves to a lower-fee state-board school.', source: 'Principal’s office', sawIt: 'Principal, for the first time', action: 'Exit form: “Reason: personal.”' },
    ],
    gap: 'The first warning came in week 4. Seven warning signs were recorded in six different systems by six different adults. The pattern that research uses as an early-warning flag (attendance below 80% plus a failing core subject) was visible in week 14, 26 weeks before he left. Nobody saw the whole picture until week 40. One phone call in August would probably have kept him, and with him about ₹4.6 lakh of future fees.',
  },

  story: [
    'Meghana, Grade 9B at the same campus, is the best kabaddi raider in the district and won the inter-school debate in July. Her marks average 68%. The scholarship committee looks at marks only, so she is not shortlisted. In January a competitor school offers her a sports scholarship. Her family moves her and her younger brother: two fee-paying children lost, and neither name appears in any report as a loss.',
    'In the second week of September, viral fever hits Hyderabad. In Grade 9C, 17 of 48 children are absent on Monday. Mr Imran marks the paper register at 8:10 am, teaches four periods, and spends his lunch break copying last week’s attendance into the Excel file the principal must send to head office every Friday.',
    'At the October parent–teacher meeting 230 parents queue for 4 minutes each. The only document on the table is the marks card. Sports, cultural events, attendance trends and the counsellor’s concerns are not on it.',
    'Head office produces a “monthly MIS” from 12 schools’ Excel files. It has 41 tabs, takes an analyst 9 working days to consolidate, and arrives after the month it describes has ended. The board looks at one number in it: enrolment.',
    'In March, 14 families in Grade 9 at Kukatpally alone ask for transfer certificates. Mrs Lakshmi Rao, the principal, hears about most of them from the fee team when the April instalment does not arrive.',
  ],

  voices: [
    { who: 'Mrs Lakshmi Rao, Principal, Kukatpally', quote: 'I find out a child is leaving when the fee team tells me the April instalment didn’t come. By then the family has already paid an admission fee somewhere else.' },
    { who: 'Mr Imran, Class teacher, 9C', quote: 'I have 48 children, a paper register and an Excel file due every Friday. I knew Arjun was missing Mondays. I didn’t know he’d left football, or that the counsellor had spoken to him.' },
    { who: 'Ms Farah, Counsellor (one of three)', quote: 'I see the children who are sent to me after something has gone wrong. I have no list of the ones who are quietly sinking.' },
    { who: 'Mr Ravi, Sports coordinator, Kukatpally', quote: 'Meghana is the best raider I have coached in ten years. Her name has never appeared on a report card.' },
    { who: 'Arjun’s mother', quote: 'We were going through a hard time at home. One phone call in August and we would have managed. Nobody called.' },
    { who: 'Meghana', quote: 'In this school you are your maths marks. The other school asked me what I was good at.' },
    { who: 'Mr Prakash, Head of Finance', quote: 'I can tell you to the rupee how much fee we lost last year. I cannot tell you why.' },
    { who: 'K. Srinivas Rao, Managing Trustee', quote: 'We spend about two crore a year on advertising and admission fairs to fill seats we lost because nobody noticed.' },
  ],

  evidence: [
    { fact: 'Even after years of improvement, about 1 in 12 Indian students drops out at the secondary stage: 8.2% in 2024–25 in the UDISE+ report (a Ministry reply in Parliament gives 11.5%).', source: 'UDISE+ 2024–25, Ministry of Education (analysis by Education for All in India)', url: 'https://educationforallinindia.com/state-of-dropout-transition-and-retention-rates-based-on-udiseplus-2024-25-data/' },
    { fact: '81% of 3.8 lakh students in Classes 6–12 named studies, exams and results as a major cause of anxiety, and satisfaction with school life fell from 81% in middle school to 68% in secondary.', source: 'NCERT Manodarpan national survey, 2022', url: 'https://manodarpan.education.gov.in/assets/downloads/Mental_Health_WSS_A_Survey.pdf' },
    { fact: '13,044 students died by suicide in India in 2022; student suicides have grown about 4% a year, twice the rate of all suicides, and are believed to be under-reported.', source: 'NCRB data, IC3 report “Student Suicides: An Epidemic Sweeping India”, 2024', url: 'https://www.business-standard.com/india-news/student-suicides-in-india-soar-4-annually-exceeding-national-average-124082900397_1.html' },
    { fact: 'CBSE schools are reported to need one counselling and wellness teacher for every 500 students in Classes 9–12, plus a career counsellor, from the 2026–27 session.', source: 'CBSE affiliation bye-law amendment, as reported by Careers360', url: 'https://news.careers360.com/cbse-directs-schools-appoint-counselors-wellness-teachers-for-every-500-students-classes-9-12-affiliation-by-laws-land-schools' },
    { fact: 'NCERT’s Holistic Progress Card for the secondary stage records disciplinary understanding, critical thinking, emotional intelligence and civic engagement, not only marks.', source: 'NCERT PARAKH, 2025', url: 'https://parakh.ncert.gov.in/blog/hpc-secondary-stage' },
    { fact: 'From 2026, Class 10 has two board exams: the February exam is compulsory and an optional May exam lets students improve up to three subjects; the better score counts.', source: 'CBSE notice, reported by The Tribune', url: 'https://www.tribuneindia.com/news/india/cbse-class-10-second-board-exams-to-be-held-from-may-15-21/' },
    { fact: 'The DPDP Rules (notified November 2025) require verifiable parental consent for under-18s, with an exemption that lets schools process children’s data for academic activities, behavioural monitoring and safety; most duties phase in over 18 months.', source: 'DPDP Rules 2025, reported by Storyboard18', url: 'https://www.storyboard18.com/digital/dpdp-rules-carve-out-key-exemptions-for-healthcare-providers-schools-and-childcare-services-processing-childrens-data-84208.htm' },
    { fact: 'About 26.35 crore verified APAAR IDs (the national “one student, one ID”) had been generated by July 2026, giving schools a common key for student records.', source: 'Ministry of Education factsheet, reported by Telangana Today', url: 'https://telanganatoday.com/26-35-crore-verified-apaar-ids-generated-across-india' },
    { fact: 'A NIEPA study reported that Indian teachers spend only about 19% of their time on teaching and teaching-related work; the rest goes to administration and other duties.', source: 'NIEPA study, reported by ThePrint', url: 'https://theprint.in/opinion/why-delhis-government-school-teachers-feel-they-are-not-doing-the-job-they-were-hired-for/254061' },
    { fact: 'Research by Johns Hopkins (Balfanz) found that young students with attendance below 80%, a poor behaviour grade or a failing maths or English grade had about a 75% chance of not finishing school (Philadelphia, without intervention). Attendance, behaviour and course performance are now the standard early-warning signals worldwide.', source: 'PBS Frontline, “What is the middle school moment”', url: 'https://www.pbs.org/wgbh/frontline/article/what-is-the-middle-school-moment' },
    { fact: 'Hyderabad parents report private-school fee hikes of 10–20% a year, and CBSE has sought explanations from schools over fee complaints. Families compare schools and switch.', source: 'Telangana Today, 2026', url: 'https://telanganatoday.com/cbse-seeks-explanation-from-hyderabad-public-school-ramanthapur-over-fee-hike-complaints' },
    { fact: 'Private schools now teach about 4 in 10 Indian schoolchildren, so they compete hard for every family.', source: 'UDISE+ 2025–26 analysis, Education for All in India', url: 'https://educationforallinindia.com/private-schools-cross-the-40-enrolment-mark-the-government-to-private-shift-in-udise-2025-26/' },
  ],

  pains: [
    { who: 'Principals (12)', pain: 'Get a marks-only picture once a term, assembled by hand 3 weeks after exams.', consequence: 'Discover struggling children and unhappy families after the family has decided to leave.' },
    { who: 'Class teachers (520)', pain: 'Spend about 6 hours a month copying attendance, marks and remarks between paper and Excel.', consequence: 'Less time teaching; Friday reports are late and full of copy errors.' },
    { who: 'Counsellors (3 for 9,600)', pain: 'Work only on children referred after a crisis; have no list of who is quietly declining.', consequence: 'Wellbeing problems are found late; one serious incident becomes a crisis for the whole group.' },
    { who: 'Sports and cultural coordinators', pain: 'Achievements live in a separate app and a certificates folder.', consequence: 'Talented children feel invisible and are recruited by competitors.' },
    { who: 'Academic head', pain: 'Cannot see, per student and subject, who should take the optional May board exam.', consequence: 'Students who could improve miss the chance; board results suffer.' },
    { who: 'Parents', pain: 'Receive a marks card and a 4-minute meeting; hear about problems months late.', consequence: 'Lose trust, complain in WhatsApp groups, move their children.' },
    { who: 'Students', pain: 'Judged on one number; strengths in sport, arts and leadership are not recognised.', consequence: 'Disengagement, falling attendance, lower results.' },
    { who: 'Finance and management', pain: 'See attrition only as missing instalments, with no reasons.', consequence: 'Revenue loss, rising marketing spend, and no way to target retention.' },
  ],

  customerImpact: [
    'Parents learn their child is struggling at the term-end meeting, months after the first warning signs.',
    'Children who shine outside academics get no recognition or scholarships, and competitor schools recruit them.',
    'Absent children (during fever season or family trouble) get no catch-up plan; parents are told only when marks fall.',
    'Report cards do not meet the Holistic Progress Card that parents increasingly see at other schools.',
    'One unhappy parents’ WhatsApp group can cost a campus dozens of admission enquiries the next year.',
  ],

  unitEconomics: [
    'Average fee ₹95,000 a year, rising about 8% a year.',
    'A child who leaves after Grade 8 takes Grades 9–12 with them: ₹95,000 × (1.08 + 1.08² + 1.08³ + 1.08⁴) ≈ ₹4.6 lakh of future fees.',
    '3 in 10 leaving families also move a sibling, so each leaving family costs about ₹4.6 lakh × 1.3 ≈ ₹6 lakh.',
    'Replacing a child costs about ₹40,000 in marketing and admissions, and a seat that empties mid-year usually stays empty until June.',
    'A counsellor costs about ₹4.8 lakh a year (₹40,000 a month). Keeping one family a year pays for that counsellor.',
  ],

  revenue: {
    lines: [
      { item: 'Fees lost to avoidable attrition (first year only)', working: '9,600 students × 7% leave each year = 672; exit interviews and teacher reviews suggest about 60% were avoidable = 403 children × ₹95,000', annual: '≈ ₹3.8 crore' },
      { item: 'Siblings who leave with them', working: '30% of those families move a sibling ≈ 121 children × ₹95,000', annual: '≈ ₹1.1 crore' },
      { item: 'Cost of refilling seats', working: '≈ 524 replacement admissions × ₹40,000 marketing and admission cost', annual: '≈ ₹2.1 crore' },
      { item: 'Teacher time spent on manual reporting', working: '520 teachers × 6 hours a month × 10 months = 31,200 hours × ₹280 an hour (₹50,000 a month ÷ 180 hours)', annual: '≈ ₹0.9 crore' },
      { item: 'Board results and reputation', working: 'Students who should have taken the May improvement exam, and lower results from disengaged students; not costed here', annual: 'Not costed' },
    ],
    total: 'About ₹8 crore a year (₹7.95 crore), 8.7% of ₹91 crore revenue and more than half of the group’s ₹12.8 crore operating profit. Counted over the years those children would have stayed, about ₹15 crore of future fees walks out each year. Cutting avoidable attrition from 4.2% to 2.2% (192 fewer children leaving) protects about ₹1.8 crore of fees a year, before siblings.',
  },

  costOfDelay: 'Every month without an early-warning view, about 34 more children start the slide that ends in a transfer certificate, and about ₹41 lakh of annual fee revenue walks out of the door (₹5 crore of avoidable fee loss ÷ 12).',

  whyNow: [
    'The counsellor rule: one per 500 students in Classes 9–12 means about 11 counsellors for 5,500 senior students, 8 more than today (≈ ₹38 lakh a year). The trustees will approve it only if those counsellors spend their time on the right children.',
    'The Holistic Progress Card for Grades 9–10 needs attendance, co-curricular, sports and wellbeing data. The group cannot produce one today.',
    'Two Class 10 board exams: early each year the academic head must decide, per student and subject, who should take the optional May exam (up to three subjects).',
    'DPDP Rules 2025: schools may use children’s data for academic activities, behavioural monitoring and safety, but must protect it and limit its use. It is cheaper to build privacy in now than to retrofit it.',
    'APAAR IDs finally give every child a national ID that can join records across systems.',
    'Competition: with fee hikes of 10–20% in Hyderabad, parents are shopping around and comparing what each school shows them about their child.',
  ],

  triedAndFailed: [
    { what: 'ERP attendance module (2023, ₹18 lakh)', why: 'Tablets reached only the 5 Hyderabad schools; tier-2 teachers kept paper. Abandoned after 7 months, leaving attendance in two systems.' },
    { what: 'Google Form wellbeing survey', why: '31% response, and anonymous, so counsellors could not act on any single child.' },
    { what: 'WhatsApp class groups', why: 'About 600 messages a week; important notices are lost and parents of struggling children mute the group.' },
    { what: 'Head office “monthly MIS” Excel template', why: '41 tabs, filled differently by each school, 9 days to consolidate by hand, and out of date on arrival.' },
  ],

  decisions: [
    { decision: 'Which 40 children should each counsellor see this week?', owner: 'Counsellors', when: 'Every Monday, 8:00 am', needs: 'A ranked risk list combining attendance trend, marks drop, participation, fees and counsellor notes' },
    { decision: 'What do I tell this parent in 4 minutes?', owner: 'Class teachers', when: 'Before each parent–teacher meeting', needs: 'A one-page 360° profile per child: strengths, risks, trend' },
    { decision: 'Which children need a catch-up plan after an absence?', owner: 'Class teachers', when: 'Daily in fever and exam seasons', needs: 'Absences in the last 10 school days, with tests missed' },
    { decision: 'Which students should take the May board exam, in which subjects?', owner: 'Academic head', when: 'Each February', needs: 'February scores per subject against each student’s trend and target' },
    { decision: 'Who gets the 60 scholarships?', owner: 'Scholarship committee', when: 'Each January', needs: 'Talent across academics, sports and cultural achievement, not marks alone' },
    { decision: 'Which campus needs help, and is it working?', owner: 'Principals and Managing Trustee', when: 'Monthly', needs: 'At-risk counts, interventions opened and closed, fee at risk by campus' },
  ],

  rootCauses: [
    'No single student key: the SIS uses admission numbers, the sports app its own player IDs, and Excel files roll numbers that change every year.',
    'Data lives on paper and in silos; consolidation is manual, weekly at best, and error-prone.',
    'Only marks are measured systematically; attendance trends, participation and wellbeing are not.',
    'No early-warning rule: nobody is alerted when several weak signals appear together.',
    'Fear of privacy breaches keeps useful signals (counsellor notes, fee distress) locked away instead of shared safely.',
  ],

  constraints: [
    'Children’s data: DPDP Act 2023 and Rules 2025 (purpose limitation, security, parental consent where it applies). Counsellor notes and fee distress are sensitive and must be masked for most users.',
    'Regulatory reporting continues: UDISE+, CBSE, APAAR, the Holistic Progress Card.',
    'Tier-2 campuses have slow internet and few devices; teachers need simple, mobile-friendly screens and a paper fallback.',
    'Budget: no new ERP. Use existing systems and a pay-as-you-go platform; under ₹25 lakh in year one.',
    'Teachers will adopt it only if it saves them time in the first month.',
    'The board will judge it on Day 45 using the group’s real data, not a demo.',
  ],

  dataSamples: [
    { source: 'SIS export (admissions)', format: 'CSV, one row per student', sample: 'adm_no,student_name,class,sec,dob,guardian_mobile,category\nKKP/2019/0417,ARJUN K,9,C,14-03-2011,9XXXXXX412,General\nKKP/2019/0418,meghana reddy ,9,c,2011/07/22,,Staff ward\nWGL/2020/1102,S. Rahul,9,A,07/11/2010,9XXXXXX977,RTE', issues: ['Names in capitals, lower case and initials', 'Three date formats in one column', 'Section “c” vs “C”; trailing spaces', 'Guardian phone numbers: personal data that must be masked'] },
    { source: 'Attendance (paper register typed into Excel on Fridays)', format: 'Excel, one sheet per class per month', sample: 'Roll | Name     | Jun   | Jul   | Aug   | Sep   | Total%\n17   | Arjun K  | 18/18 | 21/24 | 20/23 | 14/22 | 83.9\n23   | Meghana  | 18/18 | 24/24 | 23/23 | 22/22 | 100\n31   | Rahul S  | 18/18 | 24/24 | 25/23 | 22/22 | 102.3', issues: ['Roll numbers change every year', 'Days double-counted after holidays push attendance above 100%', 'The running total (83.9%) hides the trend: since July Arjun is at 79%, and in September alone 64%'] },
    { source: 'Marks register', format: 'Excel per class per test', sample: 'RollNo,Name,Maths(40),Science(40),English(40)\n17,Arjun,11,AB,24\n23,Meghana,27,29,31\n31,Rahul,Absent,0,18', issues: ['Absence written as “AB”, “Absent” and 0, which mean different things', 'Maximum marks in the header, not in the data', 'No subject codes; Science is Physics + Biology at some campuses'] },
    { source: 'Sports-events app', format: 'JSON export, nested', sample: '{"player_id":"SP-KKP-0931","name":"Arjun Kumar",\n "events":[{"date":"2025-07-19","sport":"Foot ball","team":"U15","attended":true},\n           {"date":"2025-08-09","sport":"Football","attended":false}]}', issues: ['Its own player ID, not the admission number', 'Nested events must become rows', '“Foot ball”, “Football”, “Soccer” for the same sport'] },
    { source: 'Counsellor notes', format: 'Handwritten notebook, typed up by an assistant', sample: '18/9 — 9C Arjun K. quiet in corridor, says tired. father’s job changed? follow up after exams. mother 9XXXXXX412', issues: ['Free text: must be tagged (tiredness, family change, anxiety, bullying, positive)', 'Contains a phone number that must never leave the school', 'Most sensitive data in the system: counsellors only'] },
    { source: 'Fee ledger (Tally)', format: 'CSV export', sample: 'voucher,adm_no,instalment,due,paid_on,amount_due,amount_paid\nR-2025-08812,KKP/2019/0417,Q1,2025-06-15,2025-07-04,35000,18000', issues: ['Late or partial payment is a strong early signal of family distress', 'Finance data is sensitive: show counsellors a flag, never the amount'] },
  ],

  statement: {
    situation: 'Vidyanjali runs 12 CBSE schools with 9,600 students and ₹91 crore of fee revenue. Everything it knows about a child is spread across six systems: the SIS, paper attendance registers, marks spreadsheets, a sports app, counsellors’ notebooks and the fee ledger.',
    complication: 'About 672 children leave each year, roughly 403 of them avoidably. Their warning signs were recorded months earlier but never combined, so nobody acted in time, while talented children outside academics go unrecognised. This costs about ₹8 crore a year, and new CBSE and DPDP requirements make the current manual, marks-only approach untenable.',
    question: 'How can the group combine academic, attendance, co-curricular, sports, wellbeing and fee signals into one trusted, privacy-safe Student 360° view, refreshed by 7:00 am every school day, that flags at-risk children at least 6 weeks earlier and recognises talent beyond marks, so that counsellors, teachers and principals act in time?',
    inScope: ['Grades 6–12 at all 12 schools', 'The six data sources above', 'Daily risk list, 360° profile, campus dashboard, talent view', 'Privacy controls for children’s data', 'A risk model with fairness checks'],
    outOfScope: ['Replacing the SIS or Tally', 'Grades 1–5', 'Automatic messages to parents (a person always decides)', 'Any use of data for marketing'],
  },

  success: [
    { metric: 'Time from first warning sign to first action', baseline: '26 weeks (reconstructed from last year’s 672 leavers)', target: '≤ 2 weeks', how: 'Flag date compared with the date in the counsellor’s action log' },
    { metric: 'Children flagged at least 6 weeks before they fail or leave', baseline: '≈ 0%', target: '≥ 80%', how: 'Back-test on last year’s data, then measure live each term' },
    { metric: 'Avoidable attrition', baseline: '4.2% a year (403 children)', target: '≤ 2.2% within two years', how: 'Fee ledger and exit interviews, by campus' },
    { metric: 'Counsellor sessions spent on the top-risk list', baseline: 'Not measured (referrals only)', target: '≥ 70%', how: 'Counsellor action log' },
    { metric: 'Teacher time on reporting', baseline: '≈ 6 hours a month', target: '≤ 2 hours a month', how: 'Monthly two-question teacher survey' },
    { metric: 'Children with a complete 360° profile', baseline: '0%', target: '100% of Grades 6–12', how: 'Profile completeness check in the gold layer' },
    { metric: 'Scholarships recognising non-academic talent', baseline: '0 of 60', target: '≥ 15 of 60', how: 'Scholarship committee records' },
    { metric: 'Data freshness', baseline: 'Monthly, by hand', target: 'By 7:00 am IST on 99% of school days', how: 'Job run history and freshness monitor' },
  ],

  days: {
    1: { scene: 'Your first morning. The Managing Trustee hands you a file: 14 transfer certificates from Grade 9 at Kukatpally alone, every one marked “personal reasons”, and Arjun’s 40-week timeline.', pain: 'The group loses about ₹8 crore a year and about 400 children, and does not know why.', task: 'Read the dossier. Mark every point on Arjun’s timeline where someone could have acted, and name who and what data they would have needed.', doneWhen: 'You can tell Arjun’s and Meghana’s stories in two minutes, including the week the warning became visible.' },
    2: { scene: 'At the leadership meeting the trustee asks, “Are our children doing badly?” The principal says yes, the academic head says no; both are using different spreadsheets.', pain: 'Vague questions start month-long Excel exercises that settle nothing.', task: 'Turn the six decisions in the dossier into measurable questions, e.g. “Which Grade 9 students have attendance below 80% this term and a fall of more than 10 marks in a core subject?”', doneWhen: 'Each question names a measure, a period, a breakdown and the source that can answer it.' },
    3: { scene: 'The finance head says a “360° project” is nice to have. The trustee says: show me the money, and tell me when the data will be ready each day.', pain: 'Without a rupee value and a service promise the project will not be funded.', task: 'Build the KPI tree (360° score = academic 40%, attendance 20%, co-curricular 15%, sports 15%, wellbeing 10%), write the business case from the unit economics, and set the SLA: data ready by 7:00 am IST every school day.', doneWhen: 'Your business case shows ₹1.8 crore protected by a 2-point cut in avoidable attrition, with every assumption written down.' },
    4: { scene: 'The IT head lists six sources. Each has a different owner; none has a promised refresh time. Last year the sports coordinator renamed a column and the MIS was wrong for two months before anyone noticed.', pain: 'Pipelines break silently when a source changes.', task: 'Write a one-page data contract per source: owner, columns, refresh time, quality rules, and who to call when it breaks.', doneWhen: 'All six sources have a named owner and a refresh time.' },
    5: { scene: 'The legal adviser reads the plan and stops at “counsellor notes” and “fee payments”. These are children’s data, and some of it is highly sensitive.', pain: 'A privacy mistake with children’s data would hurt the group far more than attrition does.', task: 'Complete the problem canvas, including the compliance box: DPDP purpose (academic activities, behavioural monitoring, safety), who may see what, fields to mask (name, date of birth, guardian phone, fee amounts, note text), and the Holistic Progress Card and UDISE+ obligations.', doneWhen: 'Every sensitive field has a rule, and the course uses synthetic data only.' },
    6: { scene: 'Mr Imran puts three things on his desk: a paper register, a printout of the sports app’s JSON, and a pile of counsellor notes such as “quiet, says tired, father’s job changed?”. “Arjun is in all three,” he says, “but not as the same person.”', pain: 'Structured, semi-structured and unstructured data about the same child never meet, and the earliest signals are free text nobody counts.', task: 'Classify all six sources, then create a sample of the sports JSON (each event linked to a student) and 20 synthetic counsellor notes with five tags: tiredness, family change, anxiety, bullying, positive.', doneWhen: 'You can show the key that joins a sports event to a student, and every note maps to a tag.' },
    7: { scene: 'Real student data cannot leave the schools until the privacy review is signed, but the board meets in 45 days. Mrs Rao, the principal, says: “Send me something I can open in Excel.”', pain: 'Waiting for approvals would cost a whole term, and a badly saved file shows wrong dates and loses leading zeros.', task: 'Generate a synthetic student-term CSV of at least 100 rows with the same mess as the real registers (duplicates, “AB”, over-100% attendance), save it as UTF-8, and load it into Excel as tbl_student_term_record.', doneWhen: 'Excel shows the table with its name, and you have written down the row count.' },
    8: { scene: 'Mrs Rao asks three things before Friday: the average attendance, how many children were absent on each day of the fever week, and why one Monday looks so bad.', pain: 'Without formulas, every answer is a guess that changes each time someone counts.', task: 'Write an Excel formula for every KPI, build the Daily sheet with COUNTIFS and AVERAGEIFS, and use XLOOKUP, FILTER and a PivotTable to explain the worst day by section.', doneWhen: 'You can say in three sentences which day was worst, which section drove it, and how you know.' },
    9: { scene: 'The IT head refuses to email Excel files any more: “Last year an intern overwrote the live marks file. Put it in a database.”', pain: 'Spreadsheets on laptops get lost, conflict and cannot be queried by many people at once.', task: 'Install MySQL, PostgreSQL, SQLite or PGlite, check the version, create the edu360 database, and run the DDL for the raw and clean student tables.', doneWhen: 'You can list both tables and describe every column of the clean table.' },
    10: { scene: 'A new analyst asks: “Is attendance_pct for the term or the year? Does medical leave count?” Two principals give two answers, and the database count is three rows short of Excel.', pain: 'Undocumented columns and silently lost rows produce two numbers for the same child.', task: 'Load the CSV, prove the row count matches Excel, find duplicates and “AB” values with SQL, keep the clean rows, match every KPI to Excel, then write the data dictionary and pass the dataset check.', doneWhen: 'Every SQL number equals Excel for the clean rows, and nobody needs to ask you what a column means.' },
    11: { scene: 'Today the group’s “data platform” is 600 Excel files on teachers’ laptops and a shared drive.', pain: 'Laptops get lost, files conflict, and there is no single version of the truth.', task: 'Create a Databricks workspace and find Catalog Explorer, the SQL editor, Workspace and Compute.', doneWhen: 'You run your first query in the SQL editor.' },
    12: { scene: 'Last year an IT intern overwrote the live marks file while “testing a formula”. Two classes lost a term of marks.', pain: 'Testing on live data destroys real records.', task: 'Create edu360_dev for building and edu360_prod for what principals see, and explain the promotion path between them.', doneWhen: 'You can show why a test in dev can never overwrite production.' },
    13: { scene: 'Principals want clean numbers. Auditors want the original files. Today both live in the same folder.', pain: 'When raw and cleaned data are mixed, every number can be argued about.', task: 'Create bronze, silver and gold schemas and document each one’s purpose in its comment.', doneWhen: 'Anyone can tell from the comment what belongs in each layer.' },
    14: { scene: 'Every Friday 12 campuses email attendance and marks files to head office. They sit in inboxes.', pain: 'Raw files are scattered, uncontrolled and sometimes lost.', task: 'Create a Unity Catalog volume and upload the six source files.', doneWhen: 'All files are in /Volumes/edu360/bronze/raw_files/ with the campus in the path.' },
    15: { scene: 'A teacher in Warangal can currently open any spreadsheet on the shared drive, including Kukatpally’s counsellor notes and guardian phone numbers.', pain: 'One leaked note or phone number breaks parents’ trust and the law.', task: 'Grant access to groups, not people. Add column masks for name, date of birth, guardian phone and fee amounts, and a row filter so each campus sees only its own children.', doneWhen: 'A Warangal teacher sees only Warangal children, and **** for guardian_phone.' },
    16: { scene: 'A parent disputes Arjun’s 79% attendance in September. The school cannot show what the register originally said.', pain: 'Without the original record every number can be challenged.', task: 'Design bronze as an append-only copy of each source with _ingested_at and _source_file.', doneWhen: 'Any number can be traced back to the exact file and time it arrived.' },
    17: { scene: 'This Friday’s attendance and marks files have arrived from all 12 campuses.', pain: 'Loading them by hand takes an analyst a full day every week.', task: 'Load the structured files into bronze with read_files, keeping lineage columns.', doneWhen: 'Row counts in bronze match each file exactly.' },
    18: { scene: 'This month the sports app added a “team captain” field without telling anyone.', pain: 'Fixed-format loads break when nested JSON changes.', task: 'Load the sports JSON into bronze with its nested structure intact.', doneWhen: 'You can query events.sport and events.attended for any student.' },
    19: { scene: 'In exam weeks campuses upload every evening. Reloading everything takes hours and would miss the 7:00 am promise.', pain: 'Full reloads cannot meet the SLA.', task: 'Switch attendance loading to Auto Loader with schema evolution so only new files are processed; load the counsellor notes.', doneWhen: 'Dropping one new file and re-running loads only that file.' },
    20: { scene: 'Karimnagar’s file had 312 rows. Bronze shows 290.', pain: '22 missing children would vanish from every report, and their risks with them.', task: 'Reconcile row counts per file and inspect the table history.', doneWhen: 'Every file reconciles exactly, or the gap is explained in writing.' },
    21: { scene: 'Your first profile of bronze: 6% of children above 100% attendance, marks recorded as “AB”, “Absent” and 0.', pain: 'Bad data makes good students look at risk, and at-risk students look fine.', task: 'Profile nulls, duplicates, ranges and distinct values in every bronze table.', doneWhen: 'You have the top five data problems, each with a count.' },
    22: { scene: 'Arjun appears three times: ARJUN K (SIS), Arjun (marks) and Arjun Kumar (sports app).', pain: 'Duplicates split one child’s story into fragments, which is exactly why nobody saw his.', task: 'Write and apply the cleansing rules: one student key (admission number, later APAAR), dedupe, “AB” as absent not zero, attendance capped at 100%, one date format.', doneWhen: 'Arjun is one row per term, and every rule is written and applied in SQL.' },
    23: { scene: 'The sport column contains “Foot ball”, “Football”, “Soccer” and “footbal”.', pain: 'Football participation looks a third of what it really is.', task: 'Map every value to the allowed list (Cricket, Football, Athletics, Kabaddi, Badminton, None) and send unknown values to quarantine.', doneWhen: 'Only allowed values remain in silver.' },
    24: { scene: 'Next term a new campus joins and sends files in a slightly different format.', pain: 'Without automatic rules, bad data reaches the principal’s dashboard silently.', task: 'Build a Lakeflow pipeline with expectations (valid student key, attendance 0–100, known campus) and a quarantine table.', doneWhen: 'The pipeline shows how many rows failed each rule, and why.' },
    25: { scene: 'Principals ask for one trusted student table instead of 12 versions of “cleaned” Excel.', pain: 'Every team keeps its own truth.', task: 'Build edu360.silver.student_term_record with lineage columns and pass the silver dataset check.', doneWhen: 'No duplicate keys, no empty required values, only allowed categories.' },
    26: { scene: 'The principal wants one row per child with five scores. The counsellor wants every term’s history.', pain: 'The wrong grain double-counts or hides children.', task: 'Design the star schema: the student-term fact; student, campus and date dimensions; and the gold 360° mart.', doneWhen: 'You can state the grain of every table in one sentence.' },
    27: { scene: 'Meghana moved from 9B to 9D in October. Reports for September must still say 9B.', pain: 'Overwriting history makes past reports wrong.', task: 'Build dim_student as a Type 2 slowly changing dimension with MERGE INTO (valid_from, valid_to, is_current).', doneWhen: 'Meghana has two rows: 9B (closed) and 9D (current).' },
    28: { scene: 'The board agrees the weights: academic 40%, attendance 20%, co-curricular 15%, sports 15%, wellbeing 10%.', pain: 'If each campus calculates the score its own way, comparisons are meaningless.', task: 'Implement each sub-score and the 360° score once, in gold, plus the early-warning flag (attendance below 80% and a core subject below 40%).', doneWhen: 'Arjun’s week-14 flag and score can be recalculated by hand from his sub-scores.' },
    29: { scene: '520 teachers will open the dashboard between 7:45 and 8:15 am.', pain: 'A slow dashboard is an unused dashboard.', task: 'Build edu360.gold.gold_student_360 with liquid clustering and OPTIMIZE.', doneWhen: 'student_id is unique and “Which Grade 9 students are high risk at Kukatpally?” answers in seconds.' },
    30: { scene: 'Finance asks why gold shows 9,588 children when the SIS says 9,600.', pain: 'A 12-child gap destroys trust in everything else.', task: 'Reconcile silver and gold, explain every difference, and pass the gold dataset check.', doneWhen: 'Totals reconcile, or each difference has a reason (for example, transfers out).' },
    31: { scene: 'Principals already use Power BI for fee reports; they will not learn another tool.', pain: 'A new tool nobody opens changes nothing.', task: 'Connect Power BI Desktop to the gold tables through the SQL warehouse.', doneWhen: 'gold_student_360 is visible in Power BI.' },
    32: { scene: 'The Warangal principal must never see Kukatpally children; class teachers only their own sections; counsellors everything except fee amounts.', pain: 'One wrong share exposes children’s data across campuses.', task: 'Build the model with relationships and a date table, and add row-level security roles by campus and section.', doneWhen: '“View as Warangal principal” shows only Warangal children.' },
    33: { scene: 'The trustee wants three numbers on the first screen: average 360° score, children at risk, and fee at risk.', pain: 'Numbers calculated inside visuals disagree from page to page.', task: 'Create DAX measures: Avg 360 Score, At-Risk Children, Attendance %, Fee at Risk.', doneWhen: 'Every measure matches the gold value.' },
    34: { scene: 'Three audiences: principals (campus view), counsellors (Monday risk list), class teachers (one-page profile for the parent meeting).', pain: 'One crowded page serves nobody.', task: 'Build three pages: Campus overview, Student 360° profile, Early warning.', doneWhen: 'Each page answers one of the six decisions in the dossier.' },
    35: { scene: 'Last month a change broke the fee dashboard during a board meeting.', pain: 'Untested changes reach principals directly.', task: 'Publish through a deployment pipeline (Dev → Test → Prod), schedule refresh before 7:00 am, and certify the semantic model.', doneWhen: 'A change can be tested without touching what principals see.' },
    36: { scene: 'With 11 counsellors and 5,500 senior students, each counsellor can see about 40 children a week. Which 40?', pain: 'A rule of thumb catches children who are already failing, not those about to.', task: 'Frame the prediction: risk band next term from attendance trend, marks trend, participation, wellbeing tags and fee delays, using only data known at the time.', doneWhen: 'Your feature list contains nothing that leaks the outcome.' },
    37: { scene: 'Last year’s data shows who later failed or left: the 672 leavers are your labelled examples.', pain: 'Without one feature table, every experiment uses different numbers.', task: 'Build edu360.gold.features_risk_band and split it by time: train on older terms, test on the latest.', doneWhen: 'The split is by term, never random.' },
    38: { scene: 'Two analysts claim different accuracy for “the same” model.', pain: 'Untracked experiments cannot be trusted or audited.', task: 'Train a baseline, track runs in MLflow, and register edu360.gold.risk_band_model in Unity Catalog.', doneWhen: 'Two runs are compared and the better one is registered with its metrics.' },
    39: { scene: 'Counsellors want Monday’s list ready at 8:00 am. The principal wants to type “Which Grade 9 girls stopped sports this term?”', pain: 'A model in a notebook helps no child.', task: 'Batch-score every child daily into gold and set up an AI/BI Genie space on the gold tables.', doneWhen: 'Genie answers the principal’s question and you have checked its SQL.' },
    40: { scene: 'A parent asks why her daughter was flagged. A trustee asks if the model is unfair to tier-2 campuses or to girls.', pain: 'An unexplained or unfair model would be switched off, and could harm children.', task: 'Compare performance by campus, gender and fee category; explain the top drivers in plain words; add drift monitoring; write a model card.', doneWhen: 'You can explain any child’s flag to a parent and show the fairness results to the board.' },
    41: { scene: 'Back-test: if the system had existed last year, when would Arjun have been flagged?', pain: 'The board will believe a story about their own children, not an accuracy score.', task: 'Run the model on last year’s data and answer each measurable question with a number, e.g. how many of the 403 avoidable leavers would have been flagged 6 weeks early.', doneWhen: 'You can say “Arjun would have been flagged in week 9, not week 40” and give the group-wide figure.' },
    42: { scene: 'The trustees ask: “So what do we do on Monday, and what is it worth?”', pain: 'Insights without decisions change nothing.', task: 'Recommend actions per stakeholder (Monday counsellor list, catch-up plans after absences, a sports and arts scholarship track, 360° parent-meeting pages, May-exam shortlist) with the KPI and rupee value each moves.', doneWhen: 'Every recommendation has an owner, a KPI, a date and an expected value.' },
    43: { scene: 'The pilot ran by hand for one campus. Now 12 campuses need it every morning.', pain: 'A manual pipeline will miss 7:00 am within a week.', task: 'Create a Databricks job (bronze → silver → gold → scoring → refresh), schedule it, add failure alerts, and package it as an Asset Bundle with dev and prod targets.', doneWhen: 'The job runs on schedule and the same bundle deploys to dev and prod.' },
    44: { scene: '6:15 am Monday: the job fails because Nizamabad uploaded a corrupt file. Counsellors open their lists at 8:00.', pain: 'Without a runbook nobody knows what to do before the school day starts.', task: 'Write the runbook (rerun, backfill, owners, contacts), add a freshness monitor, and rehearse the board presentation.', doneWhen: 'A colleague can recover a failed run using only your runbook.' },
    45: { scene: 'Board meeting. The Managing Trustee, finance head, academic head and legal adviser are in the room.', pain: 'Launching without proof risks children’s privacy and the group’s reputation.', task: 'Present Arjun’s timeline again, this time showing the week your system would have flagged him, then pass the go-live checklist: SLA, quality, masking, access, alerts, runbook, cost, owners, fairness and DPDP.', doneWhen: 'The board approves rollout to all 12 campuses, with every checklist item evidenced.' },
  },
};
