import Link from 'next/link';
import { Lock, ChevronLeft, ChevronRight, ListChecks } from 'lucide-react';
import { STEP_POINTS } from '@/lib/domain/guidedSteps';
import { prisma } from '@/lib/prisma';
import { requirePerm } from '@/lib/server/context';
import { getEnrollment } from '@/lib/domain/journey';
import { parseMarkdown } from '@/lib/domain/lessonMarkdown';
import { guarded } from '@/lib/server/page';
import { DAY_XP, dayStepsFrom } from '@/lib/domain/levelFlowRules';
import { DayWork } from '@/components/learn/DayWork';
import { GuidedDay } from '@/components/learn/GuidedDay';
import { guidedStepsOf } from '@/lib/domain/journey';
import { TranslateLesson } from '@/components/learn/TranslateLesson';
import { getLocale, getT } from '@/lib/i18n/server';
import { cachedLesson } from '@/lib/i18n/lessonTranslate';
import { Tr } from '@/components/i18n/Tr';
import { Tv } from '@/components/i18n/Tv';

export const dynamic = 'force-dynamic';

import { Render } from '@/components/learn/Markdown';

async function DayPage({ params, searchParams }: { params: Promise<{ code: string; day: string }>; searchParams: Promise<{ orig?: string }> }) {
  const { code, day } = await params; const { orig } = await searchParams;
  const [t, locale] = await Promise.all([getT(), getLocale()]);
  const dayNo = Number(day);
  const ctx = await requirePerm('learn:self');
  const enrollment = await getEnrollment(ctx);
  const level = await prisma.level.findFirst({ where: { tenantId: ctx.tenantId, journeyId: enrollment.journeyId, code } });
  if (!level) return <div className="card empty"><h1 className="h3">{t('Module not found')}</h1></div>;
  const progress = await prisma.progress.findUnique({ where: { enrollmentId_levelId: { enrollmentId: enrollment.id, levelId: level.id } } });
  if (!progress || progress.state === 'locked') {
    return <div className="card empty"><div className="ic-wrap"><Lock size={22} /></div><h1 className="h3">{t('{title} is locked', { title: level.title })}</h1><p className="text-2" style={{ marginTop: 6 }}>{t('Finish the earlier module first.')}</p></div>;
  }
  const content = await prisma.content.findFirst({ where: { levelId: level.id, kind: 'md', position: dayNo } });
  if (!content) return <div className="card empty"><h1 className="h3"><Tr>Day</Tr> <Tv v={dayNo} /> <Tr>is not in</Tr> <Tv v={level.title} /></h1></div>;

  const [prev, next] = await Promise.all([
    prisma.content.findFirst({ where: { kind: 'md', position: dayNo - 1, level: { journeyId: enrollment.journeyId, tenantId: ctx.tenantId } }, select: { position: true, level: { select: { code: true } } } }),
    prisma.content.findFirst({ where: { kind: 'md', position: dayNo + 1, level: { journeyId: enrollment.journeyId, tenantId: ctx.tenantId } }, select: { position: true, level: { select: { code: true } } } }),
  ]);
  const body = (JSON.parse(content.payload || '{}').body as string) || '';
  // The learner's language when a translation is cached ("Read in …" makes one); ?orig=1 shows the English page.
  const translated = orig ? null : await cachedLesson(content.id, body, locale);
  const blocks = parseMarkdown(translated ?? body);
  // Steps to tick: the translated ones when the translation kept the same list, else the English ones.
  const englishSteps = dayStepsFrom(body); const translatedSteps = translated ? dayStepsFrom(translated) : [];
  const steps = translatedSteps.length === englishSteps.length ? translatedSteps : englishSteps;
  const mine = await prisma.dayProgress.findUnique({ where: { enrollmentId_levelId_day: { enrollmentId: enrollment.id, levelId: level.id, day: dayNo } }, select: { state: true, xpEarned: true, steps: true } });
  // Guided days: the task as step cards (concept, do, check, points) instead of a ticklist and one screenshot.
  const guided = guidedStepsOf(content.payload);
  const stepStates = (() => { try { const v = JSON.parse(mine?.steps ?? '[]'); return Array.isArray(v) && v.every(x => x === null || typeof x === 'object') ? v : []; } catch { return []; } })();
  if (guided && mine?.state === 'skipped' && !stepStates.length) guided.forEach((_, i) => { stepStates[i] = { s: 'skipped', xp: 0, at: '' }; });
  // Finished before this day had steps: it stays done (its points were already given), shown as done steps.
  if (guided && mine?.state === 'done' && !stepStates.length) guided.forEach((_, i) => { stepStates[i] = { s: 'done', xp: 0, at: '' }; });

  return (<>
    <section className="ph ph-plain" style={{ marginBottom: 14 }}>
      <span className="eyebrow"><Tv v={level.title} /> · {t('Day {n} of 45', { n: dayNo })}</span>
      <h1 id="pageTitle" className="sr-only"><Tv v={content.title} /></h1>
      <div className="row between wrap gap-12" style={{ marginTop: 6 }}>
        <div className="bar" style={{ flex: 1, minWidth: 200 }} aria-label={`Day ${dayNo} of 45`}><i style={{ width: `${(dayNo / 45) * 100}%` }} /></div>
        <span className="muted small">{t('{n}% of the 45 days', { n: Math.round((dayNo / 45) * 100) })}</span>
      </div>
    </section>
    {translated ? <p className="muted small" style={{ maxWidth: 820, marginBottom: 10 }}>{t('Machine translation. Code, SQL and Excel formulas stay in English.')} <Link className="link" href={`/levels/${code}/days/${dayNo}?orig=1`}>{t('Show the English original')}</Link></p> : <TranslateLesson code={code} day={dayNo} />}
    {guided && (() => {
      // Steps first: say how many there are and jump to the open one, so nobody misses them under a long lesson.
      const doneN = stepStates.filter(Boolean).length; const pts = guided.reduce((n, x) => n + STEP_POINTS[x.check.kind], 0);
      const mins = guided.reduce((n, x) => n + (x.minutes ?? 0), 0);
      return <section className="callout info" style={{ maxWidth: 820, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }} aria-label={t('Your steps today')}>
        <ListChecks size={20} aria-hidden="true" />
        <span style={{ flex: 1, minWidth: 220 }}><b>{t('Today: {n} guided steps for up to {p} points', { n: guided.length, p: pts })}{mins ? ` · ${t('about {n} min', { n: mins })}` : ''}</b><br /><span className="small">{doneN === guided.length ? t('You finished every step of this day.') : t('Read the lesson, then follow the steps one by one. Each step shows what to do, what you should see, and how to fix common problems.')}</span></span>
        {doneN < guided.length && <a className="btn btn-gold btn-sm" href="#steps">{doneN ? t('Continue at step {n}', { n: doneN + 1 }) : t('Start step 1')} ↓</a>}
      </section>;
    })()}
    <article className="card card-pad" style={{ maxWidth: 820 }} aria-label={content.title || `Day ${dayNo}`}>
      {blocks.map((b, i) => <Render key={i} block={b} />)}
    </article>
    {guided ? <GuidedDay code={code} day={dayNo} steps={guided} states={stepStates} /> : <DayWork code={code} day={dayNo} steps={steps} state={(mine?.state as 'done' | 'skipped' | undefined) ?? 'open'} xp={mine?.xpEarned ?? 0} dayXp={DAY_XP} next={next ? { code: next.level.code, day: next.position } : null} levelHref={`/levels/${code}`} />}
    <nav className="row between wrap gap-12" aria-label={t('Day navigation')} style={{ marginTop: 18, maxWidth: 820 }}>
      {prev ? <Link className="btn btn-outline" href={`/levels/${prev.level.code}/days/${prev.position}`}><ChevronLeft size={16} /> {t('Day {n}', { n: prev.position })}</Link> : <span />}
      {next ? <Link className="btn btn-primary" href={`/levels/${next.level.code}/days/${next.position}`}>{t('Day {n}', { n: next.position })} <ChevronRight size={16} /></Link> : <span />}
    </nav>
  </>);
}

export default guarded(DayPage);
