/**
 * What the level and activity pages say about each piece of work: what you do here, what you leave with, why it
 * matters, how long it takes; the words you will meet in the level; and what to get ready before you start.
 * Derived from each journey's own content, so it works for the generic and every domain journey. Pure module.
 */
/* eslint-disable @typescript-eslint/no-explicit-any */

export type ActivityBrief = { doHere: string; leaveWith: string; why: string; minutes: number };

export function activityBrief(a: { idx: number; title: string; config: any }): ActivityBrief {
  const c = a.config ?? {};
  const minutes = Number(c.estMinutes) || 20;
  switch (c.kind) {
    case 'briefing': return { doHere: `Read the mission: ${String(c.problem ?? '').split('. ')[0]}. Then answer one question to check you have it.`, leaveWith: String(c.outcome ?? 'A clear picture of the problem and how your work will be judged.'), why: 'You start every level knowing exactly what problem you are solving and how your work will be evaluated.', minutes };
    case 'learn': return { doHere: `Read ${c.lessons?.length ?? 'a few'} short lessons, then answer a ${c.quiz?.length ?? 5}-question quiz.`, leaveWith: `The ideas behind this level: ${(c.lessons ?? []).map((l: any) => l.title).slice(0, 3).join(', ')}.`, why: 'The concepts you need before you build, checked so gaps show now instead of in your project.', minutes };
    case 'explore': return { doHere: `Open ${c.repo?.fullName ?? 'a real open-source repository'}, read how it is organised, and answer questions about it.`, leaveWith: 'Confidence reading a real project, which is how you learn from others’ work at a job.', why: 'Most real work starts by understanding code and data someone else wrote.', minutes };
    case 'build': return { doHere: `Use an AI tool to draft your ${a.title.replace(/^Build:\s*/, '').toLowerCase()}, improving your prompt, then save it.`, leaveWith: `Your ${a.title.replace(/^Build:\s*/, '').toLowerCase()}, written in your own words.`, why: 'You practise using AI the way professionals do: draft, check, improve, and own the result.', minutes };
    case 'dataset': return { doHere: `Upload your ${c.schema?.name ?? 'dataset'} file. It is checked for columns, types, keys, allowed values and personal data.`, leaveWith: 'A dataset that passes every quality check, ready for the next stage.', why: 'Every later number depends on this data being right.', minutes };
    case 'screenshot': return { doHere: 'Upload a screenshot that shows your work, and confirm the checklist.', leaveWith: 'Evidence of your work that a reviewer can see.', why: 'A clear screenshot is how reviewers and employers see that you really built it.', minutes };
    case 'proof': return { doHere: 'Share a link to your work and write what you did, what surprised you and what you learned.', leaveWith: 'Your proof, scored on the published rubric.', why: 'Your proof becomes part of your portfolio and earns the level’s review points.', minutes };
    case 'boss': return { doHere: `Choose the right move in ${c.scenarios?.length ?? 3} real situations and say why. You have ${c.attempts ?? 3} attempts; your best counts.`, leaveWith: 'A score that shows you can apply this level under real pressure.', why: 'Knowing the right next step in a messy situation is what makes you hireable.', minutes };
    default: return { doHere: 'This activity is being prepared.', leaveWith: '—', why: '', minutes };
  }
}

/** "Words you will see": the level's key ideas from its lessons, each with a one-line meaning. */
export function levelWords(activities: { config: any }[]): { word: string; meaning: string }[] {
  const lessons = activities.flatMap(a => (a.config?.kind === 'learn' ? a.config.lessons ?? [] : []));
  return lessons.slice(0, 6).map((l: any) => ({ word: String(l.title), meaning: String(l.body ?? '').split(/(?<=\.)\s/)[0].slice(0, 180) }));
}

/** What to have ready before the level starts, by module topic. Ticks are kept on the learner's device. */
export function levelPrep(level: { code: string; title: string }): { item: string; why?: string }[] {
  const k = `${level.code} ${level.title}`.toUpperCase();
  const base = [{ item: 'Laptop charged and internet working' }, { item: 'A notes app or notebook open' }];
  if (/FRAMING|FUNDAMENTAL|PROBLEM/.test(k)) return [...base, { item: 'The problem statement read once, slowly' }, { item: 'Your AI tool open (ChatGPT, Gemini or Claude)', why: 'You use it in the Build activity.' }];
  if (/COLLECTION|DATA COLLECT|SQL/.test(k)) return [...base, { item: 'Excel 365 / 2021, Excel on the web, or Google Sheets', why: 'Day 7–8 load your CSV and use COUNTIFS, UNIQUE and FILTER.' }, { item: 'Rights to install software, or use SQLite / PGlite', why: 'Day 9 installs MySQL, PostgreSQL or SQLite; PGlite needs no install.' }];
  if (/UNITY_CATALOG|DATABRICKS/.test(k)) return [...base, { item: 'A Databricks Free Edition account', why: 'Sign up with your email; no payment needed.' }, { item: 'Your CSV, JSON and text files from Module 2' }];
  if (/BRONZE|SILVER|GOLD|ETL|PYTHON/.test(k)) return [...base, { item: 'Databricks workspace open and serverless compute available' }, { item: 'Your catalog and schemas from Module 3' }];
  if (/POWER_BI|POWER BI/.test(k)) return [...base, { item: 'Power BI Desktop installed (Windows) or Power BI service access', why: 'Power BI Desktop runs on Windows; on a Mac use a Windows VM or the web service.' }, { item: 'Your SQL warehouse server and HTTP path' }];
  if (/ML_AI|MACHINE|AI_FOR/.test(k)) return [...base, { item: 'Your gold tables ready in Databricks' }, { item: 'MLflow open in your workspace' }];
  if (/CAPSTONE/.test(k)) return [...base, { item: 'Your dashboard and model working end to end' }, { item: 'A screen recorder for your presentation' }];
  return base;
}

/**
 * What the AI coach should know about one activity: its own content, never its answers (no correct options, no answer
 * keys, no boss solutions), so the coach can explain and hint without doing the graded work. Plain text, capped.
 */
export function activityCoachContext(title: string, config: any, max = 2500): string {
  const c = config || {};
  const list = (xs: unknown, n = 8) => (Array.isArray(xs) ? xs.slice(0, n).map(x => `- ${typeof x === 'string' ? x : (x as any)?.label ?? (x as any)?.title ?? ''}`).filter(x => x.length > 2).join('\n') : '');
  const parts: string[] = [`Activity: ${title}`];
  switch (c.kind) {
    case 'briefing':
      parts.push(`Business problem: ${c.problem ?? ''}`, `Objective: ${c.objective ?? ''}`, `Expected outcome: ${c.outcome ?? ''}`);
      if (c.criteria?.length) parts.push(`Evaluated on:\n${list(c.criteria)}`);
      if (c.check?.q) parts.push(`Check question (the learner must answer it; do not say which option is right): ${c.check.q}\nOptions:\n${list(c.check.options)}`);
      break;
    case 'learn':
      for (const l of (c.lessons ?? []).slice(0, 6)) parts.push(`Lesson "${l.title}": ${String(l.body ?? '').slice(0, 350)}`);
      parts.push('The learner then takes a short quiz on these lessons; explain ideas, do not give quiz answers.');
      break;
    case 'explore':
      parts.push(`Repository: ${c.repo?.fullName ?? ''} — ${c.repo?.description ?? ''}`, `Task: ${c.task ?? ''}`);
      break;
    case 'build':
      parts.push(`The learner builds this with an AI tool and fills in: ${(c.fields ?? []).map((f: any) => f.label ?? f.key).join('; ')}`);
      break;
    case 'dataset':
      parts.push(`The learner uploads a CSV or Excel file that must pass a dataset check.${c.instructions ? ` ${c.instructions}` : ''}`);
      if (c.schema?.columns) parts.push(`Expected columns: ${c.schema.columns.map((x: any) => x.name ?? x).join(', ')}`);
      break;
    case 'screenshot':
      parts.push(`The learner uploads a screenshot that shows:\n${list(c.shows)}`, `Checklist:\n${list(c.checklist)}`);
      break;
    case 'proof':
      parts.push(`The learner submits a link to their work and a reflection. Checklist:\n${list(c.checklist)}`, `Good places for the link: ${(c.evidenceTypes ?? []).join('; ')}`);
      break;
    case 'boss':
      parts.push(`Boss challenge: ${c.intro ?? ''}`, 'The learner picks the right move for each scenario and explains why; do not reveal the right choices.');
      break;
  }
  const s = parts.filter(Boolean).join('\n');
  return s.length > max ? `${s.slice(0, max)}…` : s;
}
