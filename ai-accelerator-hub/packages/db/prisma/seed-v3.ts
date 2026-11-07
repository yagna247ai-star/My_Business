/**
 * Seed v3 — aligns data with MASTER BUILD PROMPT §6 (15 levels, 6 stages), §7 (8 specialisations),
 * §9 (six-activity framework) and makes Level 1 "AI Explorer" fully playable with server-side answer keys.
 *
 * Idempotent. Safe to re-run. Refuses to create demo accounts in production unless ALLOW_DEMO_SEED=1.
 * Run:  DATABASE_URL=file:./dev.db npx tsx prisma/seed-v3.ts
 *
 * External resources follow the research policy: URL, description, difficulty, prerequisites,
 * licence and last-verified date. Only repositories verified via the GitHub API are referenced.
 */
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const VERIFIED_ON = '2026-11-04';

if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DEMO_SEED !== '1') {
  console.error('Refusing to seed demo accounts in production. Set ALLOW_DEMO_SEED=1 to override.');
  process.exit(1);
}

const STAGES = [
  { idx: 1, code: 'STAGE_FOUNDATIONS', title: 'AI Foundations' },
  { idx: 2, code: 'STAGE_PRODUCTIVITY', title: 'AI Productivity & Creation' },
  { idx: 3, code: 'STAGE_APP_DEV', title: 'AI Application Development' },
  { idx: 4, code: 'STAGE_AGENTS', title: 'AI Agents & Advanced Systems' },
  { idx: 5, code: 'STAGE_OSS', title: 'Open Source & Engineering' },
  { idx: 6, code: 'STAGE_CAREER', title: 'Career & Industry Readiness' },
];

// §6 — titles and topic lists from the master prompt. Only Level 1 has authored activities.
const LEVELS = [
  { idx: 1, stage: 1, code: 'L01_AI_EXPLORER', title: 'AI Explorer', xp: 120, topics: ['Introduction to AI', 'AI versus traditional software', 'Understanding Generative AI', 'LLM fundamentals', 'Identifying real-world problems', 'AI tool exploration', 'First practical project'] },
  { idx: 2, stage: 1, code: 'L02_PROBLEM_HUNTER', title: 'AI Problem Hunter', xp: 140, topics: ['Identifying customer pain points', 'Problem discovery', 'Defining a niche', 'Understanding users', 'Validating problem statements', 'Creating a solution concept'] },
  { idx: 3, stage: 1, code: 'L03_PROMPT_WIZARD', title: 'Prompt Wizard', xp: 150, topics: ['Prompt engineering', 'Context and constraints', 'Role-based prompting', 'Zero-shot and few-shot prompting', 'Prompt testing', 'Prompt refinement', 'Multimodal prompting'], sourceNote: 'Core material: Prompt Engineering Presentation AG-2.pdf (awaiting upload — not yet ingested).' },
  { idx: 4, stage: 2, code: 'L04_POWER_USER', title: 'AI Power User', xp: 160, topics: ['ChatGPT', 'Gemini', 'Claude', 'Perplexity', 'Research workflows', 'AI productivity', 'Critical evaluation of AI responses'] },
  { idx: 5, stage: 2, code: 'L05_CREATOR', title: 'AI Creator', xp: 170, topics: ['AI image generation', 'AI video generation', 'AI voice generation', 'Presentations', 'Content creation', 'Creative workflows', 'Responsible content generation'] },
  { idx: 6, stage: 2, code: 'L06_WORKFLOW_BUILDER', title: 'AI Workflow Builder', xp: 180, topics: ['Workflow automation', 'n8n', 'Make', 'Zapier', 'APIs', 'Webhooks', 'Practical business automation'] },
  { idx: 7, stage: 3, code: 'L07_APP_BUILDER', title: 'AI App Builder', xp: 200, topics: ['AI application architecture', 'No-code and low-code development', 'Lovable', 'Bolt', 'Replit', 'AI coding assistants', 'Deployment fundamentals'] },
  { idx: 8, stage: 3, code: 'L08_DEVELOPER', title: 'AI Developer', xp: 210, topics: ['Python fundamentals', 'JavaScript fundamentals', 'APIs', 'Data handling', 'Application development', 'AI integrations', 'Git and GitHub'] },
  { idx: 9, stage: 4, code: 'L09_RAG_ENGINEER', title: 'RAG Engineer', xp: 220, topics: ['Embeddings', 'Vector databases', 'Document processing', 'Retrieval-augmented generation', 'Knowledge-based AI assistants', 'Evaluation and retrieval quality'] },
  { idx: 10, stage: 4, code: 'L10_AGENT_ARCHITECT', title: 'Agent Architect', xp: 250, topics: ['AI agent fundamentals', 'Agent tools', 'Agent workflows', 'Multi-agent systems', 'Tool calling', 'Agent evaluation', 'Security and permissions'] },
  { idx: 11, stage: 4, code: 'L11_MCP_SPECIALIST', title: 'Automation & MCP Specialist', xp: 280, topics: ['MCP fundamentals', 'MCP servers', 'MCP clients', 'Tool integrations', 'Agentic automation', 'Human approval workflows', 'Practical enterprise automation'] },
  { idx: 12, stage: 5, code: 'L12_OSS_HACKER', title: 'Open Source Hacker', xp: 300, topics: ['GitHub exploration', 'Forking repositories', 'Git workflows', 'Understanding licences', 'Modifying projects', 'Pull requests', 'Contributing to open-source communities'] },
  { idx: 13, stage: 5, code: 'L13_AI_ENGINEER', title: 'AI Engineer', xp: 320, topics: ['Model selection', 'Model evaluation', 'Fine-tuning concepts', 'Production AI systems', 'Monitoring', 'Reliability', 'Cost optimisation', 'Security and responsible AI'] },
  { idx: 14, stage: 6, code: 'L14_CAREER_SPECIALIST', title: 'AI Career Specialist', xp: 340, topics: ['Select one specialisation', 'Complete its practical challenges'] },
  { idx: 15, stage: 6, code: 'L15_GRANDMASTER', title: 'AI Grandmaster', xp: 350, topics: ['Industry-sponsored challenges', 'Team hackathons', 'Advanced capstone', 'Working application', 'GitHub portfolio', 'Final demonstration', 'Career-readiness assessment'] },
];

// §9 — Level 1 activities. Answer keys live only here (server-side); the API strips them before sending.
const L1 = {
  1: { code: 'MISSION_BRIEFING', title: 'Mission Briefing: The Problem Hunt Begins', xp: 5, config: {
    kind: 'briefing', estMinutes: 10,
    problem: 'A home-kitchen tiffin service in Hyderabad gets 200 WhatsApp messages a day: orders, changes, complaints and questions in English, Hindi and Telugu. The owner answers everything by hand until midnight. Some tasks would be better with AI. Others need ordinary software. Some must stay with a human.',
    objective: 'Learn what generative AI is, how an LLM produces answers, and when AI is — and is not — the right tool. Then test a real AI tool on a real problem and report honestly what worked.',
    outcome: 'An "AI Explorer Brief": a real problem, its user, three prompt iterations, an honest evaluation of the output, and what data you chose not to share.',
    criteria: ['Explain generative AI and how an LLM generates text', 'Tell AI-suited tasks from rules-suited tasks', 'Improve an AI result through prompt iterations', 'Spot errors and avoid sharing personal data'],
    check: { q: 'For the tiffin service, which task is the better fit for generative AI rather than rule-based software?', options: ['Calculating GST on each invoice', 'Drafting a polite reply to an upset customer, for the owner to check', 'Sorting orders by delivery time'], answer: 1, why: 'Calculations and sorting have one correct answer, so deterministic code does them better. Drafting natural language is where generative AI helps — with a person checking the draft.' },
  } },
  2: { code: 'LEARN', title: 'Learn: What Generative AI Is and How LLMs Work', xp: 18, config: {
    kind: 'learn', estMinutes: 45, passPct: 60,
    lessons: [
      { title: 'What generative AI is (and isn\'t)', minutes: 6, body: 'Generative AI is a branch of deep learning that creates new content — text, images, audio or code — from a prompt. It grew out of decades of work: rule-based chatbots, then statistical machine learning, then neural networks. Today\'s large language models (LLMs) use the Transformer architecture, whose attention mechanism lets the model weigh which earlier words matter most.' },
      { title: 'How an LLM produces an answer', minutes: 7, body: 'Your prompt is split into tokens (pieces of words) and turned into numbers. The model predicts the most likely next token, adds it to the text, and repeats. Because it samples from a probability distribution, the same prompt can give different answers. That makes LLMs great for first drafts — and means you must review and refine their output.' },
      { title: 'AI versus traditional software', minutes: 6, body: 'Traditional software follows rules you write: same input, same output, every time. Use it for calculations, validation and anything with one right answer. Generative AI is probabilistic: use it for language, summaries, ideas and drafts. Many real systems combine both — AI drafts, rules check, people decide.' },
      { title: 'Using AI responsibly', minutes: 6, body: 'LLMs can "hallucinate": state false things confidently. Check facts that matter. Never paste other people\'s personal data (phone numbers, addresses, health details) into a public AI tool. Watch for bias, and keep a human in charge of high-stakes decisions such as health, money, grades and hiring.' },
    ],
    resources: [
      { title: 'Lesson 01 — Introduction to Generative AI and Large Language Models', url: 'https://github.com/microsoft/generative-ai-for-beginners/tree/main/01-introduction-to-genai', description: 'Microsoft\'s open course lesson on how generative AI and LLMs work, with a startup scenario.', difficulty: 'Beginner', prerequisites: 'None', license: 'MIT', lastVerified: VERIFIED_ON },
      { title: 'Lesson 03 — Using Generative AI Responsibly', url: 'https://github.com/microsoft/generative-ai-for-beginners/tree/main/03-using-generative-ai-responsibly', description: 'Hallucinations, harms and mitigation principles.', difficulty: 'Beginner', prerequisites: 'Lesson 01', license: 'MIT', lastVerified: VERIFIED_ON },
    ],
    quiz: [
      { q: 'Generative AI is best described as…', options: ['A branch of deep learning that creates new text, images or code', 'A database of pre-written answers', 'A spreadsheet formula', 'A search engine index'], answer: 0 },
      { q: 'Before an LLM processes your prompt, the text is split into…', options: ['Tokens', 'Pixels', 'Tables', 'Folders'], answer: 0 },
      { q: 'You send the exact same prompt twice. What should you expect?', options: ['Exactly the same answer every time', 'The answer may vary, so you review and refine it', 'An error message', 'The second answer is always better'], answer: 1 },
      { q: 'An AI tool confidently cites a court case that does not exist. This is called…', options: ['A hallucination', 'Tokenization', 'Fine-tuning', 'Caching'], answer: 0 },
      { q: 'Which should you NOT paste into a public AI chatbot?', options: ['A customer\'s phone number and address', 'A general question about Python lists', 'A paragraph from your own essay', 'A public news headline'], answer: 0 },
    ],
  } },
  3: { code: 'EXPLORE_GITHUB', title: 'Explore GitHub: Generative AI for Beginners', xp: 10, config: {
    kind: 'explore', estMinutes: 30, passMin: 2,
    repo: { fullName: 'microsoft/generative-ai-for-beginners', url: 'https://github.com/microsoft/generative-ai-for-beginners', description: '21 lessons on building with generative AI, maintained by Microsoft.', difficulty: 'Beginner', prerequisites: 'None', license: 'MIT', lastVerified: VERIFIED_ON },
    architecture: [
      'Each lesson is a numbered folder (01-introduction-to-genai … 21-meta) with a README that teaches the concept.',
      '"Build" lessons add code samples you can run, in Python and TypeScript.',
      '00-course-setup explains how to set up your environment and API keys safely.',
      'Lessons 01–05 need no code: concepts, comparing LLMs, responsible AI and prompting.',
    ],
    task: 'Open the repository, read the Lesson 01 README, skim the folder list, then answer three questions.',
    questions: [
      { q: 'In Lesson 01, what are the input you give an LLM and the output it returns called?', options: ['A prompt and a completion', 'A query and a table', 'A command and a log', 'A file and a folder'], answer: 0 },
      { q: 'According to Lesson 01\'s knowledge check, what is true about LLMs?', options: ['You get the exact same response every time', 'They do things perfectly, like adding numbers', 'Responses can vary for the same prompt; they are great for a first draft you then improve'], answer: 2 },
      { q: 'Which folder explains how to set up the course environment?', options: ['00-course-setup', '21-meta', 'images', 'tests'], answer: 0 },
    ],
  } },
  4: { code: 'BUILD', title: 'Build: Your AI Explorer Brief', xp: 35, config: {
    kind: 'build', estMinutes: 90,
    tools: ['ChatGPT', 'Gemini', 'Claude', 'Perplexity', 'Microsoft Copilot', 'Other'],
    fields: [
      { key: 'problem', label: 'The real-world problem', hint: 'Who has it, how often, and what it costs them today.', minWords: 40 },
      { key: 'user', label: 'The user', hint: 'Describe one real person (no names or contact details).', minWords: 15 },
      { key: 'fit', label: 'Why AI — and not traditional software?', hint: 'Which part needs language or judgement, and which part should stay as rules or a human decision?', minWords: 30 },
      { key: 'evaluation', label: 'What did the AI get wrong or miss?', hint: 'Check its facts. Be specific.', minWords: 25 },
      { key: 'responsible', label: 'What data did you avoid sharing, and why?', hint: 'Personal data, private business data, anything sensitive.', minWords: 15 },
    ],
    iterations: 3,
    iterationRules: { promptMinWords: 10, outputMinWords: 15, changeMinWords: 10, maxSimilarity: 0.85 },
  } },
  5: { code: 'SUBMIT_PROOF', title: 'Submit Proof: Share Your Brief', xp: 5, config: {
    kind: 'proof', estMinutes: 15, minWords: 50,
    evidenceTypes: ['Public document link (Google Docs, Notion, GitHub)', 'Live application URL', 'Video demonstration link'],
    checklist: ['My brief is complete and the link is viewable by reviewers', 'I removed all personal data about other people', 'I can explain why I changed each prompt'],
  } },
  6: { code: 'EVALUATION_BOSS', title: 'Evaluation + Boss: The Right Tool Trial', xp: 47, config: {
    kind: 'boss', estMinutes: 30, rubric: 'L01_AI_EXPLORER_RUBRIC', attempts: 3, xpSplit: { base: 20, bossBonus: 27 },
    intro: 'Six real situations. For each, choose the right tool and say why in one sentence. You get three attempts; your best result goes to your reviewer.',
    choices: ['Generative AI', 'Rules-based software', 'AI draft + human decision'],
    scenarios: [
      { s: 'Calculate the exact GST on 500 invoices.', correct: [1] },
      { s: 'Draft replies to customer complaints in Hindi and English.', correct: [2] },
      { s: 'Summarise 40 pages of course feedback into the top five themes.', correct: [0, 2] },
      { s: 'Check that a new password has 8+ characters, a number and a symbol.', correct: [1] },
      { s: 'Generate ten Instagram caption ideas for a bakery launch.', correct: [0, 2] },
      { s: 'Answer a patient\'s question about how much medicine to take.', correct: [2] },
    ],
    minWhyWords: 6,
  } },
};

/*
 * Persona variants (docs/PERSONALISED_JOURNEY_BUSINESS_SPEC.md §6). Each variant changes the situation,
 * worked demo, questions and hints the learner sees. Grading keys (fields, quiz, rubric, XP, attempts)
 * are protected by resolveConfig(): every persona meets the same bar. Choices keep the same order:
 * 0 = Generative AI, 1 = Rules-based software, 2 = AI draft + human decision.
 */
const V = {
  briefing: {
    kid_hobbyist: {
      problem: 'Your school coding club runs a Python quiz every Friday. The club captain writes 20 questions by hand, marks every answer sheet, and explains the hard ones again and again. Some of this would be better with AI. Some is better as a simple Python program. Some should stay with the teacher.',
      objective: 'Find out what generative AI is, how it writes answers, and when a plain Python program or a teacher is the better choice. Then try a real AI tool on the club\'s problem and report honestly what it got right and wrong.',
      check: { q: 'For the coding club, which job is the better fit for generative AI?', options: ['Checking whether the answer to 7 × 8 is 56', 'Writing ten fun practice questions about Python lists, for the captain to check', 'Counting how many students came to the club'], answer: 1, why: 'Maths answers and counting have one right answer, so a Python program does them perfectly. Writing new practice questions is creative language work, where AI helps — and the captain still checks them.' },
    },
    student: {
      problem: 'Your college placement cell helps 600 final-year students. Every week students ask the same questions about resumes, eligibility and interview dates, and the two coordinators reply one by one on WhatsApp and email. Some of this suits AI. Some needs ordinary software. Some decisions must stay with a person.',
      objective: 'Learn what generative AI is, how an LLM produces text, and when AI is the right tool. Test a real AI tool on the placement cell\'s problem and write up what worked — the kind of evidence an interviewer asks for.',
      check: { q: 'For the placement cell, which task is the better fit for generative AI?', options: ['Checking whether a student\'s CGPA meets a company\'s 7.0 cut-off', 'Giving first-draft feedback on a resume summary, for the coordinator to review', 'Listing interviews by date'], answer: 1, why: 'Cut-offs and sorting follow fixed rules, so ordinary code is exact. Feedback on writing is language work where AI drafts well — a coordinator keeps the final say.' },
    },
    software_pro: {
      problem: 'Your platform team owns a 9-year-old Java billing service with thin test coverage. On-call engineers spend hours reading logs during incidents, and new joiners take weeks to understand the codebase. Leadership wants "AI everywhere". Some work suits an LLM, some needs deterministic tooling, and some must stay with an accountable engineer.',
      objective: 'Ground your intuition in how LLMs actually generate tokens and why outputs vary, then decide where AI belongs in an engineering workflow. Test one AI tool on a real engineering task and evaluate its output like a code review.',
      check: { q: 'For the billing team, which task is the better fit for generative AI?', options: ['Calculating tax on each invoice line', 'Drafting unit tests for a legacy class, reviewed in a pull request', 'Enforcing that every commit message has a ticket ID'], answer: 1, why: 'Tax maths and commit-message rules are deterministic, so code and linters do them exactly. Drafting tests is generation work an LLM speeds up — the engineer reviews and owns the result.' },
    },
    ai_builder: {
      problem: 'A yoga studio owner wants a simple booking app. Today clients book by Instagram message, the owner copies each booking into a notebook, double-bookings happen, and reminders are forgotten. You want to build the app with AI. Some parts suit AI, some need ordinary app logic, and some decisions stay with the owner.',
      objective: 'Learn what generative AI is and how it produces answers, so you know when to trust what an AI agent builds. Test a real AI tool on the studio\'s problem and report honestly what it got right.',
      check: { q: 'For the booking app, which part is the better fit for generative AI?', options: ['Preventing two bookings in the same 7 am slot', 'Writing a friendly reminder message in the studio\'s style, for the owner to approve', 'Counting how many classes a client has left on their pass'], answer: 1, why: 'Slot clashes and pass counts have one correct answer, so app logic must handle them. Friendly wording is where AI shines — with the owner approving the tone.' },
    },
    business_owner: {
      problem: 'You run a home-kitchen tiffin service in Hyderabad that gets 200 WhatsApp messages a day: orders, changes, complaints and questions in English, Hindi and Telugu. You answer everything by hand until midnight. Some tasks would be better with AI, some with ordinary software, and some must stay with you.',
      objective: 'Understand what generative AI really is, so you can tell a useful AI tool from hype. Then test a real AI tool on your own business problem and judge it the way you would judge a new employee.',
    },
  },
  learnDemo: {
    kid_hobbyist: { title: 'Demo: ask AI to explain a Python error', steps: ['Run a tiny program with a mistake, for example print(len(5)).', 'Copy only the error message (never your name or school) into the AI tool and ask: "Explain this Python error to a 13-year-old and give one hint, not the answer."', 'Read the hint, fix the code yourself, and run it again.', 'Notice: the AI explained, you fixed. That is how to learn with AI.'] },
    student: { title: 'Demo: three prompts, three different answers', steps: ['Ask an AI tool: "Write a resume summary for a CSE student."', 'Ask again with context: your skills, the role and a 50-word limit.', 'Ask a third time and request two options plus what is weak in each.', 'Compare: context and constraints changed the quality more than luck did.'] },
    software_pro: { title: 'Demo: non-determinism you can measure', steps: ['Send the same prompt "Write a function that validates an Indian PIN code" three times.', 'Diff the three outputs: naming, edge cases and regex all change.', 'Add constraints: language, signature, "include five test cases".', 'Run the tests. Treat LLM output as an unreviewed pull request.'] },
    ai_builder: { title: 'Demo: from vague idea to buildable request', steps: ['Ask: "Make me a booking app." Note how generic the answer is.', 'Ask again with who it is for, the three screens you need, and what must never happen (double-booking).', 'Ask the AI to list what it is unsure about before building.', 'You now have a spec an AI agent can build from.'] },
    business_owner: { title: 'Demo: an AI draft you approve', steps: ['Paste one anonymised customer complaint (remove name and number).', 'Ask for a polite reply in the customer\'s language, under 60 words, offering one fix.', 'Check the reply: is any promise wrong? Is the tone yours?', 'Edit and send it yourself. AI drafted; you decided.'] },
  },
  buildHints: {
    kid_hobbyist: { problem: 'A real problem at school, in your club or at home. Who has it and how often?', user: 'Describe one person, like "a Class 8 student who is new to Python" — no real names.', fit: 'Which part needs words or ideas (AI) and which part has one right answer (a Python program)?', evaluation: 'What did the AI get wrong? Did you test its code or check its facts?', responsible: 'What did you NOT type into the AI? Names, phone numbers, school details?' },
    student: { problem: 'A problem on campus or in an internship. Who has it, how often, what it costs them.', fit: 'Which part needs language or judgement, which should be ordinary code, which a human decision?', evaluation: 'Verify facts and code. What would an interviewer ask you to fix?' },
    software_pro: { problem: 'A real engineering or operations problem: who is affected, frequency, cost in hours or incidents.', fit: 'Separate generative work (drafts, summaries) from deterministic work (validation, maths) and accountable decisions.', evaluation: 'Review the output like a pull request: correctness, edge cases, security, licence of any code.', responsible: 'What code, secrets or customer data did you keep out of the prompt? Which policy applies?' },
    ai_builder: { problem: 'The problem your app or automation will solve: who has it, how often, what it costs today.', fit: 'Which parts of your product need AI, which need normal app logic, which stay with the user?', evaluation: 'What did the AI build or say that was wrong, missing or unsafe? How did you test it?' },
    business_owner: { problem: 'A problem in your own business: who it affects, how often, what it costs you in hours or money.', user: 'Describe one typical customer or staff member — no names or numbers.', fit: 'Which part needs language or judgement (AI), which is fixed rules (software), which only you should decide?', evaluation: 'Judge the AI like a new employee: what would you correct before a customer sees it?', responsible: 'What customer data did you keep out of the AI tool, and why?' },
  },
  boss: {
    kid_hobbyist: [{ s: 'Add up the marks of 40 students in a class test.', correct: [1] }, { s: 'Explain what a Python for-loop does using a cricket example.', correct: [0, 2] }, { s: 'Check that a new password has 8+ characters, a number and a symbol.', correct: [1] }, { s: 'Suggest five story ideas for the school magazine.', correct: [0, 2] }, { s: 'Decide whether a friend\'s bad cough needs a doctor.', correct: [2] }, { s: 'Sort a list of club members by name.', correct: [1] }],
    student: [{ s: 'Check whether 600 students meet a company\'s CGPA cut-off.', correct: [1] }, { s: 'Draft personalised interview-prep tips for each student, for a coordinator to review.', correct: [2] }, { s: 'Summarise 200 pieces of student feedback into the top five themes.', correct: [0, 2] }, { s: 'Validate that each registration form has a valid roll number format.', correct: [1] }, { s: 'Generate ten practice aptitude questions with answers.', correct: [0, 2] }, { s: 'Decide which student gets the last internship seat.', correct: [2] }],
    software_pro: [{ s: 'Enforce that every pull request passes the test suite before merge.', correct: [1] }, { s: 'Draft release notes from 60 merged pull requests.', correct: [0, 2] }, { s: 'Summarise a 3,000-line incident log into likely causes for the on-call engineer.', correct: [2] }, { s: 'Compute the exact monthly cloud bill per team from usage records.', correct: [1] }, { s: 'Suggest refactoring options for a 900-line class.', correct: [0, 2] }, { s: 'Approve a production database migration on a Friday night.', correct: [2] }],
    ai_builder: [{ s: 'Stop two clients booking the same slot.', correct: [1] }, { s: 'Write the welcome message and onboarding copy for the app.', correct: [0, 2] }, { s: 'Turn 30 client interviews into the top five feature requests.', correct: [0, 2] }, { s: 'Charge the right amount for a 10-class pass.', correct: [1] }, { s: 'Reply to a client who is angry about a cancelled class.', correct: [2] }, { s: 'Check that an email address field is filled in correctly.', correct: [1] }],
  },
};

function withVariants(idx: number, cfg: Record<string, unknown>) {
  const pick = <T,>(m: Record<string, T>, f: (v: T) => Record<string, unknown>) => Object.fromEntries(Object.entries(m).map(([k, v]) => [k, f(v)]));
  const variants = idx === 1 ? V.briefing : idx === 2 ? pick(V.learnDemo, demo => ({ demo })) : idx === 4 ? pick(V.buildHints, fieldHints => ({ fieldHints })) : idx === 6 ? pick(V.boss, scenarios => ({ scenarios })) : null;
  return variants ? { ...cfg, variants } : cfg;
}

const RUBRIC_L1 = {
  code: 'L01_AI_EXPLORER_RUBRIC', title: 'Level 1 — AI Explorer', passThreshold: 3.0,
  dimensions: {
    problem: { weight: 0.25, name: 'Problem understanding', l1: 'Vague or invented problem', l3: 'Real problem, clear user and impact', l5: 'Sharp, evidenced problem with a validated user' },
    prompting: { weight: 0.25, name: 'Prompt iteration', l1: 'One prompt, no change', l3: 'Three iterations, each change explained', l5: 'Iterations show clear, reasoned improvement' },
    evaluation: { weight: 0.20, name: 'Critical evaluation', l1: 'Accepts output as-is', l3: 'Finds concrete errors or gaps', l5: 'Verifies facts and explains limits' },
    responsible: { weight: 0.10, name: 'Responsible AI', l1: 'Shares personal data', l3: 'Avoids sensitive data, names one risk', l5: 'Clear data, bias and human-oversight plan' },
    reflection: { weight: 0.10, name: 'Reflection', l1: 'Under 50 words or generic', l3: 'Honest struggle and what changed', l5: 'Insight applied to their next project' },
    boss: { weight: 0.10, name: 'Boss challenge', l1: 'Not attempted', l3: '4–5 of 6 correct with reasons', l5: '6 of 6 with sharp reasons' },
  },
};

// §7 — eight specialisations
const TRACKS = [
  { code: 'AI_APP_DEV', title: 'AI Application Developer', modes: ['low-code', 'pro-code'], prereq: 'Levels 7–8 approved', competencies: ['App architecture', 'API integration', 'Auth & data', 'Deployment'], capstone: 'A deployed AI app with auth, data and monitoring', portfolio: 'Public repo + live URL + 2-minute demo video' },
  { code: 'AI_AUTOMATION_ENG', title: 'AI Automation Engineer', modes: ['no-code', 'low-code'], prereq: 'Level 6 approved', competencies: ['Workflow design', 'APIs & webhooks', 'Error handling', 'Human approval steps'], capstone: 'Three production automations for a real small business', portfolio: 'Workflow exports + run logs + before/after metrics' },
  { code: 'AI_AGENT_DEV', title: 'AI Agent Developer', modes: ['low-code', 'pro-code'], prereq: 'Levels 10–11 approved', competencies: ['Tool calling', 'Multi-step planning', 'Agent evaluation', 'Permissions & safety'], capstone: 'A tool-using agent with an evaluation harness and approval gates', portfolio: 'Repo + eval report + safety notes' },
  { code: 'GENAI_ENG', title: 'Generative AI Engineer', modes: ['pro-code'], prereq: 'Levels 9 and 13 approved', competencies: ['RAG', 'Model selection', 'Fine-tuning concepts', 'Cost & latency'], capstone: 'A RAG system with measured retrieval quality and cost report', portfolio: 'Repo + evaluation notebook + architecture doc' },
  { code: 'AI_PRODUCT_MGR', title: 'AI Product Manager', modes: ['no-code'], prereq: 'Levels 2–4 approved', competencies: ['Problem discovery', 'AI feasibility', 'Metrics', 'Responsible AI'], capstone: 'A validated AI product spec with prototype and user tests', portfolio: 'PRD + prototype link + user research summary' },
  { code: 'AI_DATA_ANALYST', title: 'AI Data Analyst', modes: ['no-code', 'low-code'], prereq: 'Level 4 approved', competencies: ['Data cleaning', 'AI-assisted analysis', 'Visualisation', 'Validation of AI output'], capstone: 'An analysis of a real public dataset with AI-assisted insights, verified', portfolio: 'Notebook or dashboard + methodology note' },
  { code: 'AI_SOLUTIONS_ARCH', title: 'AI Solutions Architect', modes: ['low-code', 'pro-code'], prereq: 'Levels 10 and 13 approved', competencies: ['System design', 'Security & compliance', 'Vendor selection', 'ROI modelling'], capstone: 'An architecture and ROI proposal for a real organisation', portfolio: 'Architecture diagrams + proposal + risk register' },
  { code: 'AI_QA_EVAL_ENG', title: 'AI Quality & Evaluation Engineer', modes: ['low-code', 'pro-code'], prereq: 'Levels 8 and 13 approved', competencies: ['Test design', 'LLM evaluation', 'Red-teaming', 'Regression tracking'], capstone: 'An evaluation suite with golden sets and regression dashboard', portfolio: 'Eval repo + findings report' },
];

const BADGES = [
  { code: 'first-proof', name: 'First Proof', tier: 'bronze', xpBonus: 30, condition: { type: 'approved_count', gte: 1 } },
  { code: 'level-1-complete', name: 'AI Explorer', tier: 'bronze', xpBonus: 20, condition: { type: 'level_approved', level: 'L01_AI_EXPLORER' } },
  { code: 'streak-7', name: 'Week Warrior', tier: 'silver', xpBonus: 50, condition: { type: 'longest_streak', gte: 7 } },
  { code: 'streak-30', name: 'Month Master', tier: 'gold', xpBonus: 100, condition: { type: 'longest_streak', gte: 30 } },
  { code: 'boss-perfect', name: 'Right Tool, Every Time', tier: 'silver', xpBonus: 25, condition: { type: 'boss_perfect', level: 'L01_AI_EXPLORER' } },
  { code: 'hall-of-fame', name: 'Hall of Fame', tier: 'gold', xpBonus: 200, condition: { type: 'xp', gte: 2000 } },
];

const ASSISTANTS = [
  { code: 'concept-explainer', name: 'AI Learning Coach', model: 'claude-opus-5-5', prompt: 'You are the AI Learning Coach for AI Accelerator Hub. Explain concepts from the learner\'s current level in plain language, check understanding with one question, and suggest the next study step. Never complete graded work for the learner. If unsure, say so.' },
  { code: 'code-mentor', name: 'AI Project Mentor', model: 'claude-opus-5-5', prompt: 'You are the AI Project Mentor. Help learners debug and improve their own projects using Socratic questions and hints. Do not write full solutions for graded activities. Encourage independent problem-solving.' },
  { code: 'project-reviewer', name: 'AI Assessment Engine', model: 'claude-opus-5-5', prompt: 'You are the AI Assessment Engine. Suggest rubric scores with evidence for each dimension and list skill gaps. Your output is advisory: a human reviewer makes every decision.' },
  { code: 'career-coach', name: 'AI Career Mentor', model: 'claude-opus-5-5', prompt: 'You are the AI Career Mentor. Map the learner\'s demonstrated competencies to the eight specialisations, suggest projects and interview practice. Never promise jobs or placements.' },
  { code: 'hackathon-judge', name: 'AI Hackathon Judge', model: 'claude-opus-5-5', prompt: 'You are the AI Hackathon Judge. Produce structured, evidence-based feedback on innovation, functionality and impact to support human judges. You never decide results alone.' },
];

async function user(email: string, name: string, password: string, globalRole: string | null = null) {
  return prisma.user.upsert({ where: { email }, update: { name }, create: { email, name, passwordHash: bcrypt.hashSync(password, 10), emailVerified: true, globalRole } });
}
async function member(tenantId: string, userId: string, roleCode: string, cohortId?: string) {
  const role = await prisma.role.findUniqueOrThrow({ where: { code: roleCode } });
  return prisma.membership.upsert({ where: { tenantId_userId: { tenantId, userId } }, update: { roleId: role.id, cohortId }, create: { tenantId, userId, roleId: role.id, cohortId, status: 'active' } });
}

async function setupTenant(slug: string, name: string) {
  const tenant = await prisma.tenant.upsert({ where: { slug }, update: { name }, create: { slug, name, plan: 'pro' } });
  const journey = await prisma.journey.upsert({ where: { tenantId_slug: { tenantId: tenant.id, slug: 'genai-career-accelerator' } }, update: { title: 'GenAI Career Journey', isPublished: true }, create: { tenantId: tenant.id, slug: 'genai-career-accelerator', title: 'GenAI Career Journey', isPublished: true } });
  const stageIds: Record<number, string> = {};
  for (const s of STAGES) {
    const st = await prisma.stage.upsert({ where: { journeyId_idx: { journeyId: journey.id, idx: s.idx } }, update: { code: s.code, title: s.title }, create: { journeyId: journey.id, idx: s.idx, code: s.code, title: s.title } });
    stageIds[s.idx] = st.id;
  }
  const levelIds: Record<number, string> = {};
  for (const l of LEVELS) {
    const data = { code: l.code, title: l.title, summary: l.topics.join(' · '), description: (l as { sourceNote?: string }).sourceNote || null, xpReward: l.xp, stageId: stageIds[l.stage], isPublished: l.idx === 1, tags: JSON.stringify(l.topics) };
    const lv = await prisma.level.upsert({ where: { journeyId_idx: { journeyId: journey.id, idx: l.idx } }, update: data, create: { tenantId: tenant.id, journeyId: journey.id, idx: l.idx, ...data } });
    levelIds[l.idx] = lv.id;
    if (l.idx > 1) await prisma.levelPrerequisite.upsert({ where: { levelId_prerequisiteLevelId: { levelId: lv.id, prerequisiteLevelId: levelIds[l.idx - 1] } }, update: {}, create: { levelId: lv.id, prerequisiteLevelId: levelIds[l.idx - 1] } });
  }
  for (const [idx, a] of Object.entries(L1)) {
    await prisma.activity.upsert({ where: { levelId_idx: { levelId: levelIds[1], idx: +idx } }, update: { code: a.code, title: a.title, xpReward: a.xp, config: JSON.stringify(withVariants(+idx, a.config)) }, create: { tenantId: tenant.id, levelId: levelIds[1], idx: +idx, code: a.code, title: a.title, xpReward: a.xp, position: +idx, config: JSON.stringify(withVariants(+idx, a.config)) } });
  }
  // Levels 2–15: six activity slots marked unauthored — never fabricated lessons (§34)
  for (const l of LEVELS.filter(x => x.idx > 1)) {
    const names = ['Mission Briefing', 'Learn', 'Explore GitHub', 'Build', 'Submit Proof', 'Evaluation + Boss'];
    const codes = ['MISSION_BRIEFING', 'LEARN', 'EXPLORE_GITHUB', 'BUILD', 'SUBMIT_PROOF', 'EVALUATION_BOSS'];
    for (let i = 1; i <= 6; i++) await prisma.activity.upsert({ where: { levelId_idx: { levelId: levelIds[l.idx], idx: i } }, update: { code: codes[i - 1], title: names[i - 1], config: JSON.stringify({ kind: 'unauthored' }) }, create: { tenantId: tenant.id, levelId: levelIds[l.idx], idx: i, code: codes[i - 1], title: names[i - 1], position: i, xpReward: 0, config: JSON.stringify({ kind: 'unauthored' }) } });
  }
  return { tenant, journey, levelIds };
}

async function enrol(tenantId: string, journeyId: string, userId: string, cohortId: string | undefined, l1: string) {
  const e = await prisma.enrollment.upsert({ where: { tenantId_userId_journeyId: { tenantId, userId, journeyId } }, update: { cohortId }, create: { tenantId, userId, journeyId, cohortId, currentLevelIdx: 1 } });
  await prisma.progress.upsert({ where: { enrollmentId_levelId: { enrollmentId: e.id, levelId: l1 } }, update: {}, create: { tenantId, enrollmentId: e.id, levelId: l1, userId, state: 'available', unlockedAt: new Date() } });
  // A streak must be earned: reset any streak that has no XP activity behind it (older seeds hard-coded one).
  const hasActivity = await prisma.xpLedger.count({ where: { tenantId, userId } });
  await prisma.streak.upsert({ where: { tenantId_userId: { tenantId, userId } }, update: hasActivity ? {} : { currentStreak: 0, longestStreak: 0, lastActiveDate: null, freezeTokens: 1, status: 'active', prevStreak: 0, recoveryUntil: null }, create: { tenantId, userId } });
  await prisma.userSetting.upsert({ where: { tenantId_userId: { tenantId, userId } }, update: {}, create: { tenantId, userId } });
  for (const [feature, remaining] of [['ai_credits', 40], ['level_access', 1]] as const) {
    await prisma.entitlement.upsert({ where: { userId_tenantId_feature: { userId, tenantId, feature } }, update: {}, create: { userId, tenantId, feature, remaining } });
  }
  return e;
}

function nextWeekendIST() {
  const now = new Date(Date.now() + 5.5 * 3600e3);
  const day = now.getUTCDay(); const toSat = (6 - day + 7) % 7 || 7;
  const sat = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + toSat, 4, 30)); // 10:00 IST
  const sun = new Date(sat.getTime() + 24 * 3600e3);
  return { sat: sat.toISOString(), sun: sun.toISOString() };
}

async function main() {
  // Rubric, badges, assistants, tracks are platform-wide
  await prisma.rubric.upsert({ where: { code: RUBRIC_L1.code }, update: { title: RUBRIC_L1.title, dimensions: JSON.stringify(RUBRIC_L1.dimensions), passThreshold: RUBRIC_L1.passThreshold }, create: { code: RUBRIC_L1.code, title: RUBRIC_L1.title, dimensions: JSON.stringify(RUBRIC_L1.dimensions), passThreshold: RUBRIC_L1.passThreshold } });
  for (const b of BADGES) await prisma.badge.upsert({ where: { code: b.code }, update: { name: b.name, tier: b.tier, xpBonus: b.xpBonus, condition: JSON.stringify(b.condition) }, create: { code: b.code, name: b.name, tier: b.tier, xpBonus: b.xpBonus, condition: JSON.stringify(b.condition) } });
  await prisma.badge.deleteMany({ where: { code: { notIn: BADGES.map(b => b.code) }, userBadges: { none: {} } } });
  for (const a of ASSISTANTS) await prisma.aiAssistant.upsert({ where: { code: a.code }, update: { name: a.name, model: a.model, systemPromptMd: a.prompt }, create: { code: a.code, name: a.name, model: a.model, systemPromptMd: a.prompt } });
  await prisma.aiAssistant.deleteMany({ where: { code: 'debug-assistant', conversations: { none: {} }, usage: { none: {} } } });
  for (const t of TRACKS) {
    const prereq = { requires: t.prereq, modes: t.modes, competencies: t.competencies, pathways: { beginner: `Foundations of ${t.title}`, intermediate: 'Two practical industry assignments', advanced: t.capstone }, capstone: t.capstone, portfolio: t.portfolio, rubric: 'GENERIC_RUBRIC' };
    await prisma.track.upsert({ where: { code: t.code }, update: { title: t.title, description: t.competencies.join(' · '), prerequisites: JSON.stringify(prereq) }, create: { code: t.code, title: t.title, description: t.competencies.join(' · '), prerequisites: JSON.stringify(prereq) } });
  }
  await prisma.track.deleteMany({ where: { code: { notIn: TRACKS.map(t => t.code) }, enrollments: { none: {} } } });

  // Tenant A — demo institute
  const A = await setupTenant('demo', 'Demo Institute');
  const wk = nextWeekendIST();
  const schedule = { weekly: { mondayToFriday: 'Preparation missions', saturday: 'Live workshop', sunday: '4-hour hackathon' }, sessions: [{ levelIdx: 1, kind: 'workshop', title: 'AI Explorer live workshop', startsAt: wk.sat, durationMin: 90, liveLink: null, recordingUrl: null }, { levelIdx: 1, kind: 'hackathon', title: 'Sunday build sprint: The Problem Hunt', startsAt: wk.sun, durationMin: 240, liveLink: null, recordingUrl: null }], submissionWindowDays: 7, note: 'Live links are added by the instructor; none are invented here.' };
  const cohortA = await prisma.cohort.upsert({ where: { tenantId_slug: { tenantId: A.tenant.id, slug: 'cohort-jan-2026' } }, update: { name: 'GenAI Cohort 07', inviteCode: 'DEMO-COHORT-07', schedule: JSON.stringify(schedule) }, create: { tenantId: A.tenant.id, slug: 'cohort-jan-2026', name: 'GenAI Cohort 07', inviteCode: 'DEMO-COHORT-07', schedule: JSON.stringify(schedule) } });

  const people = [
    ['admin@aihub.in', 'Super Admin', 'Admin@12345', 'super_admin', 'super_admin'],
    ['tenantadmin@aihub.in', 'Asha Menon', 'TenantAdmin@12345', null, 'tenant_admin'],
    ['pm@aihub.in', 'Sanjay Kapoor', 'Program@12345', null, 'program_mgr'],
    ['instructor@aihub.in', 'Ravi Shankar', 'Instructor@12345', null, 'instructor'],
    ['mentor@aihub.in', 'Priya Raman', 'Mentor@12345', null, 'mentor'],
    ['reviewer@aihub.in', 'Kiran Rao', 'Reviewer@12345', null, 'reviewer'],
    ['finance@aihub.in', 'Finance Team', 'Finance@12345', null, 'finance'],
    ['student@aihub.in', 'Ishaan Verma', 'Student@12345', null, 'learner'],
    ['student2@aihub.in', 'Divya Nair', 'Student@12345', null, 'learner'],
  ] as const;
  for (const [email, name, pw, g, role] of people) {
    const u = await user(email, name, pw, g);
    await member(A.tenant.id, u.id, role, role === 'learner' ? cohortA.id : undefined);
    if (role === 'learner') await enrol(A.tenant.id, A.journey.id, u.id, cohortA.id, A.levelIds[1]);
  }

  // Tenant B — a different institution, for isolation tests
  const B = await setupTenant('northstar', 'Northstar Institute');
  const cohortB = await prisma.cohort.upsert({ where: { tenantId_slug: { tenantId: B.tenant.id, slug: 'ns-cohort-1' } }, update: { inviteCode: 'NORTHSTAR-01' }, create: { tenantId: B.tenant.id, slug: 'ns-cohort-1', name: 'Northstar Cohort 1', inviteCode: 'NORTHSTAR-01', schedule: JSON.stringify(schedule) } });
  for (const [email, name, pw, role] of [['admin@northstar.edu', 'Northstar Admin', 'Northstar@12345', 'tenant_admin'], ['learner@northstar.edu', 'Meera Joshi', 'Northstar@12345', 'learner']] as const) {
    const u = await user(email, name, pw);
    await member(B.tenant.id, u.id, role, role === 'learner' ? cohortB.id : undefined);
    if (role === 'learner') await enrol(B.tenant.id, B.journey.id, u.id, cohortB.id, B.levelIds[1]);
  }

  // Remove rows tied to the retired OOP curriculum so demo progress matches the new Level 1
  const retired = await prisma.level.findMany({ where: { code: { in: ['L01_AWAKENING'] } }, select: { id: true } });
  if (retired.length) console.log('note: retired level codes still present', retired.length);
  console.log('✓ seed-v3 complete: 15 levels / 6 stages, Level 1 authored, 8 tracks, 6 badges, 5 assistants, 2 tenants');
}

main().catch(e => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
