/**
 * Difficulty tracks for domain journeys (Easy, Intermediate, Hard, Critical).
 * Each track is its own Journey `da-<domain>-<level>` built by the same curriculum generator from its own DomainSpec,
 * so the problem statement, dataset and validation rules, day steps and expected solution all change per track.
 * The Hard track keeps the domain's original journey slug (`da-<domain>`), so existing learners stay where they are.
 *
 * Rule (product decision): a learner may change track only while Module 1 is not yet complete. From Module 2 to
 * Day 45 the track is fixed for the learner and for staff.
 */
import { DOMAINS } from './catalog';
import type { DomainSpec, TrackInfo, TrackLevelName } from './types';
import { key, str, int, num, date, cat, optional } from './types';
import { EDUCATION_DOSSIER } from './dossiers/education';
import { EDUCATION_TRACKS, EDUCATION_CANDIDATES, IKIGAI_QUIZ, TRACK_LABEL } from './dossiers/education-tracks';
import type { ProblemTrack } from './dossiers/types';

export const TRACK_ORDER: TrackLevelName[] = ['easy', 'intermediate', 'hard', 'critical'];

const info = (of: string, t: ProblemTrack): TrackInfo => ({
  level: t.level, of, label: TRACK_LABEL[t.level], title: t.title, question: t.question,
  deliverables: t.steps.map(s => s.deliverable), solution: t.solution, effort: t.effort, gate: t.gate,
});
const track = (level: TrackLevelName) => EDUCATION_TRACKS.find(t => t.level === level)!;
const EDU = DOMAINS.find(d => d.slug === 'education')!;
const SECTIONS = ['A', 'B', 'C', 'D'];

const educationEasy: DomainSpec = {
  ...EDU, slug: 'education-easy', code: 'EDE', catalog: 'edu_catchup', entity: 'student',
  problem: {
    title: 'Catch-up Radar', statement: track('easy').situation,
    stakeholders: ['Class teachers', 'Principal', 'Subject teachers', 'Parents'],
    decisions: ['Which children need a catch-up plan this week', 'Which missed tests to reschedule', 'When to warn the principal that an absence wave is starting'],
    questions: ['Which children at Kukatpally missed 3 or more of the last 10 school days, by class and section?', 'Which children missed at least one test this month, and in which subjects?', 'Is this week’s daily absence rate above the 7-day average, by grade?'],
  },
  kpis: [
    { name: 'Absence days (last 10 school days)', definition: 'Days marked Absent or Medical in the last 10 school days, per child' },
    { name: 'Tests missed', definition: 'Tests in the current month the child did not sit' },
    { name: 'Catch-up coverage', definition: 'Children with a catch-up plan ÷ children who need one × 100' },
    { name: 'Daily absence rate', definition: 'Children absent today ÷ children on roll × 100' },
  ],
  sources: {
    structured: [{ name: 'Attendance register (typed into Excel)', description: 'Daily present, absent, late or medical per child' }, { name: 'Marks register', description: 'Marks per test, with absence written as “AB”' }],
    semi: [{ name: 'Class timetable and test calendar', format: 'JSON', description: 'Which test happens on which day for each class' }],
    unstructured: [{ name: 'Teacher absence notes and parent messages', description: 'Short notes such as “fever, back Monday”' }],
  },
  dataset: {
    name: 'attendance_record', minRows: 100,
    columns: [key('record_id', 'Unique row ID, e.g. REC00001'), str('student_id', 'Student ID, e.g. STU0001'), int('grade', 6, 12), cat('section', SECTIONS), date('attendance_date'),
      cat('status', ['Present', 'Absent', 'Late', 'Medical']), int('tests_missed', 0, 5), optional(cat('subject_missed', ['Maths', 'Science', 'English', 'Social Science', 'Telugu', 'Hindi', 'None']))],
  },
  gold: {
    name: 'gold_catchup_list', minRows: 50,
    columns: [key('student_id'), int('grade', 6, 12), cat('section', SECTIONS), int('absences_last_10', 0, 10), int('tests_missed', 0, 10), num('attendance_pct', 0, 100), cat('catchup_status', ['Not needed', 'Plan needed', 'Plan in place'])],
  },
  quality: ['Attendance codes written as P, A, Absent, ab and blank', 'Days double-counted after holidays, pushing attendance above 100%', 'Marks entered as “AB” for absent', 'Roll numbers that change every year instead of a fixed student ID', 'Parent phone numbers in teacher notes that must be removed'],
  dashboard: {
    pages: [{ name: 'Today’s catch-up list', visuals: ['Children needing a plan, by class', 'Tests missed by subject', 'Print view for the staff room'] }, { name: 'Absence wave', visuals: ['Daily absence rate against the 7-day average', 'Absence by grade'] }],
    measures: [{ name: 'Needs Catch-up', dax: 'CALCULATE(COUNTROWS(gold_catchup_list), gold_catchup_list[catchup_status] = "Plan needed")' }, { name: 'Avg Attendance %', dax: 'AVERAGE(gold_catchup_list[attendance_pct])' }],
  },
  insight: 'During the September fever week, 23% of Grade 9 children missed 3 or more days and 41 missed the unit test; Monday absence was twice the weekly average in three sections.',
  enterprise: {
    scale: '1 campus · 800 children · about 16,000 attendance rows a month', sla: 'Catch-up list ready by 7:30 am IST every school day',
    regulations: ['DPDP Act 2023 and DPDP Rules 2025 (children’s data used for academic purposes only)', 'CBSE rule of 75% attendance to sit board exams'],
    piiColumns: ['student_name', 'guardian_phone'], scdDimension: 'dim_student (section changes)',
    ml: { target: 'absences_last_10', task: 'regression', features: ['tests_missed', 'attendance_pct', 'grade'], why: 'Forecast each child’s absences over the next 10 school days so the principal can plan catch-up classes before an absence wave' },
  },
  track: info('education', track('easy')),
  situations: undefined,
};

const educationIntermediate: DomainSpec = {
  ...EDU, slug: 'education-intermediate', code: 'EDI', catalog: 'edu_talent', entity: 'student',
  problem: {
    title: 'Student 360° Profile and Talent Finder', statement: track('intermediate').situation,
    stakeholders: ['Scholarship committee', 'Class teachers', 'Principals', 'Sports and cultural coordinators', 'Parents'],
    decisions: ['Who gets the 60 scholarships, including children with non-academic talent', 'What to tell each parent at the parent–teacher meeting', 'Which children to put forward for district and state events'],
    questions: ['Which children in Grades 6–12 reached district level or higher in sport or culture but have marks below 75%, by campus?', 'How does the 360° score of children in at least one activity compare with children in none, by grade?', 'Which campuses have the lowest share of children with a complete 360° profile this term?'],
  },
  kpis: [
    { name: 'Overall 360° score', definition: 'Academic 45%, attendance 20%, cultural 15%, sports 20%, scaled 0–100 (four parts; wellbeing is covered on the Hard and Critical tracks)' },
    { name: 'Talent score', definition: 'Highest achievement level (School 1 … National 4) × 20 + events in the term, capped at 100' },
    { name: 'Profile completeness', definition: 'Children with all four sub-scores ÷ all children × 100' },
    { name: 'Non-academic scholarships', definition: 'Scholarships awarded for sport or culture ÷ all scholarships × 100' },
  ],
  sources: {
    structured: [{ name: 'Student information system (SIS) export', description: 'Student master, class and section' }, { name: 'Marks register', description: 'Subject marks per term' }, { name: 'Attendance register', description: 'Daily attendance' }],
    semi: [{ name: 'Sports and cultural events app export', format: 'JSON', description: 'Events, teams, positions, medals and achievement level per student' }],
    unstructured: [{ name: 'Certificates and coach remarks', description: 'Scanned certificates and short notes from coaches' }],
  },
  dataset: {
    name: 'student_profile_record', minRows: 100,
    columns: [key('student_id', 'Unique student ID, e.g. STU0001'), int('grade', 6, 12), cat('section', SECTIONS), cat('term', ['Term 1', 'Term 2', 'Term 3']),
      num('academic_pct', 0, 100), num('attendance_pct', 0, 100), int('sports_events', 0, 20), int('cultural_events', 0, 20),
      cat('sport', ['Cricket', 'Football', 'Athletics', 'Kabaddi', 'Badminton', 'None']), cat('cultural_activity', ['Music', 'Dance', 'Debate', 'Drama', 'Art', 'None']),
      cat('achievement_level', ['None', 'School', 'District', 'State', 'National']), date('record_date')],
  },
  gold: {
    name: 'gold_student_profile', minRows: 50,
    columns: [key('student_id'), int('grade', 6, 12), num('academic_score', 0, 100), num('attendance_score', 0, 100), num('sports_score', 0, 100), num('cultural_score', 0, 100), num('talent_score', 0, 100), num('overall_360_score', 0, 100), cat('talent_flag', ['Yes', 'No'])],
  },
  quality: [...EDU.quality.slice(0, 4), 'Achievement levels typed as “dist”, “District level” and “DL”'],
  dashboard: {
    pages: [{ name: 'Campus overview', visuals: ['Average 360° score by grade and campus', 'Profile completeness by campus'] }, { name: 'Child profile for parent meetings', visuals: ['Radar of the four sub-scores', 'Achievements this year', 'Term-on-term change'] }, { name: 'Talent shortlist', visuals: ['Children flagged for talent with marks below 75%', 'Achievement level by sport and activity'] }],
    measures: [{ name: 'Avg 360 Score', dax: 'AVERAGE(gold_student_profile[overall_360_score])' }, { name: 'Talent Shortlist', dax: 'CALCULATE(COUNTROWS(gold_student_profile), gold_student_profile[talent_flag] = "Yes")' }],
  },
  insight: 'Of 214 children at district level or above in sport or culture, 61 have marks below 75% and were never considered for a scholarship; children in at least one activity score 11 points higher on the 360° scale.',
  enterprise: {
    scale: '12 campuses · 9,600 children · about 190,000 attendance rows a month and 40,000 activity events a term', sla: 'Profiles refreshed by 7:00 am IST every school day',
    regulations: ['DPDP Act 2023 and DPDP Rules 2025', 'NEP 2020 Holistic Progress Card (PARAKH)', 'UDISE+ reporting'],
    piiColumns: ['student_name', 'guardian_phone', 'date_of_birth'], scdDimension: 'dim_student (section changes)',
    ml: { target: 'talent_flag', task: 'classification', features: ['sports_events', 'cultural_events', 'achievement_level', 'attendance_pct'], why: 'Find children whose achievements outside the classroom show scholarship-level talent that marks alone would miss' },
  },
  track: info('education', track('intermediate')),
  situations: undefined,
};

const educationHard: DomainSpec = {
  ...EDU,
  problem: { ...EDU.problem, statement: `${EDUCATION_DOSSIER.oneLine} ${track('hard').situation}` },
  track: info('education', track('hard')),
  situations: EDUCATION_DOSSIER.days,
};

const CAMPUSES = ['Kukatpally', 'Miyapur', 'Uppal', 'Warangal', 'Karimnagar', 'Nizamabad'];
const educationCritical: DomainSpec = {
  ...EDU, slug: 'education-critical', code: 'EDC', catalog: 'edu_safeguard', entity: 'safeguarding signal',
  problem: {
    title: 'Same-day Safeguarding Escalation', statement: track('critical').situation,
    stakeholders: ['Designated Safeguarding Lead', 'Counsellors', 'Principal', 'Legal adviser', 'Trustees'],
    decisions: ['Which alerts the safeguarding lead must act on today', 'Whether a case must be reported under POCSO or referred to a helpline', 'Whether any alert waited too long, and why'],
    questions: ['How many Urgent and High alerts were raised this week, by campus, and how many were acknowledged within 2 hours?', 'Which signal types most often come before an Urgent alert, by grade?', 'Which alerts are still open after 24 hours, by campus and owner?'],
  },
  kpis: [
    { name: 'Acknowledged within 2 hours', definition: 'Urgent and High alerts acknowledged within 2 hours ÷ all Urgent and High alerts × 100' },
    { name: 'Median hours to acknowledge', definition: 'Median of hours from alert to acknowledgement' },
    { name: 'Open urgent alerts', definition: 'Urgent alerts not yet acknowledged' },
    { name: 'Audit coverage', definition: 'Views and actions logged ÷ all views and actions × 100 (must be 100%)' },
  ],
  sources: {
    structured: [{ name: 'Attendance events', description: 'Unexplained absences with no call from home' }, { name: 'Nurse visit log', description: 'Visits, reasons and frequency' }],
    semi: [{ name: 'Wellbeing box submissions', format: 'JSON', description: 'Anonymous or named concerns submitted on a tablet form' }],
    unstructured: [{ name: 'Counsellor notes', description: 'Free-text notes; the most sensitive data the school holds (synthetic only in this course)' }],
  },
  dataset: {
    name: 'wellbeing_signal', minRows: 100,
    columns: [key('signal_id', 'Unique signal ID, e.g. SIG00001'), str('student_ref', 'Pseudonymous reference, never a name, e.g. REF0001'), cat('campus', CAMPUSES), int('grade', 6, 12),
      cat('signal_type', ['Unexplained absence', 'Counsellor note', 'Wellbeing box', 'Nurse visit', 'Marks collapse']), cat('severity', ['Low', 'Medium', 'High', 'Urgent']),
      date('signal_date'), optional(num('hours_to_ack', 0, 168, 'Hours until the safeguarding lead acknowledged it'))],
  },
  gold: {
    name: 'gold_safeguarding_alerts', minRows: 50,
    columns: [key('alert_id'), str('student_ref'), cat('campus', CAMPUSES), cat('severity', ['Low', 'Medium', 'High', 'Urgent']), int('signals_count', 1, 20), date('raised_date'), num('hours_to_ack', 0, 168), cat('status', ['Open', 'Acknowledged', 'Closed'])],
  },
  quality: ['Notes that still contain a child’s name or a phone number', 'The same concern logged twice by two staff members', 'Severity written as “urgent!!”, “HIGH” and “sev 1”', 'Absences with no reason code', 'Times recorded in the wrong time zone'],
  dashboard: {
    pages: [{ name: 'Open alerts (safeguarding lead only)', visuals: ['Open alerts by severity and hours waiting', 'Acknowledge and close with a reason'] }, { name: 'Response times', visuals: ['Share acknowledged within 2 hours by campus', 'Median hours to acknowledge by week'] }],
    measures: [{ name: 'Ack Within 2h %', dax: 'DIVIDE(CALCULATE(COUNTROWS(gold_safeguarding_alerts), gold_safeguarding_alerts[hours_to_ack] <= 2), COUNTROWS(gold_safeguarding_alerts)) * 100' }, { name: 'Open Urgent', dax: 'CALCULATE(COUNTROWS(gold_safeguarding_alerts), gold_safeguarding_alerts[severity] = "Urgent", gold_safeguarding_alerts[status] = "Open")' }],
  },
  insight: 'Before the new system, Urgent signals took a median of 31 hours to reach the safeguarding lead; three of five Urgent cases were preceded by two or more unexplained absences in the same week.',
  enterprise: {
    scale: '12 campuses · 9,600 children · signals every 15 minutes in school hours', sla: 'Every Urgent or High signal acknowledged by the safeguarding lead within 2 hours',
    regulations: ['POCSO Act 2012 (mandatory reporting, sections 19 and 21)', 'DPDP Act 2023 and DPDP Rules 2025', 'CBSE counselling and wellness requirements', 'Tele-MANAS national mental health helpline (14416) as a referral route'],
    piiColumns: ['student_name', 'guardian_phone', 'note_text'], scdDimension: 'dim_student (campus and section changes)',
    ml: { target: 'severity', task: 'classification', features: ['signal_type', 'signals_count', 'grade', 'campus'], why: 'Rank incoming signals so no Urgent case waits, measuring missed cases first, with a person always deciding' },
  },
  track: info('education', track('critical')),
  situations: undefined,
};

/** Every journey the seed builds: all 17 domains (Education as its Hard track) plus the extra Education tracks. */
export const JOURNEY_SPECS: DomainSpec[] = [
  ...DOMAINS.map(d => (d.slug === 'education' ? educationHard : d)),
  educationEasy, educationIntermediate, educationCritical,
];

/** Domains that offer tracks, with what the registration form needs. */
export const TRACKED_DOMAINS: Record<string, { tracks: ProblemTrack[]; quiz: typeof IKIGAI_QUIZ; candidates: typeof EDUCATION_CANDIDATES }> = {
  education: { tracks: EDUCATION_TRACKS, quiz: IKIGAI_QUIZ, candidates: EDUCATION_CANDIDATES },
};

export { trackChangeAllowed } from '../trackRules';
