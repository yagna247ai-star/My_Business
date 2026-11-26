import { prisma } from '@/lib/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, CalendarDays, Check, CheckCircle2, Info, ListChecks, Lock, SkipForward } from 'lucide-react';
import { requirePerm } from '@/lib/server/context';
import { guarded } from '@/lib/server/page';
import { getT } from '@/lib/i18n/server';
import { loadLevelPage } from '@/lib/server/levelPage';
import { activityBrief, levelPrep, levelWords } from '@/lib/domain/levelView';
import { moveOnText } from '@/lib/domain/levelFlowRules';
import { TranslateLesson } from '@/components/learn/TranslateLesson';
import { LevelPrep } from '@/components/learn/LevelPrep';
import { StuckHelper } from '@/components/learn/StuckHelper';
import { Tr } from '@/components/i18n/Tr';
import { Tv } from '@/components/i18n/Tv';

export const dynamic = 'force-dynamic';

type Tab = { idx: number; code: string; title: string; state: string; current: boolean };
function LevelTabs({ tabs, t }: { tabs: Tab[]; t: (s: string, v?: Record<string, string | number>) => string }) {
  return (
    <nav aria-label={t('Levels')} className="card" style={{ display: 'flex', gap: 6, padding: 6, overflowX: 'auto', marginBottom: 16 }}>
      {tabs.map(tb => {
        const inner = <><b style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>{t('Level {n}', { n: tb.idx })}{tb.state === 'locked' && <Lock size={12} aria-hidden="true" />}{tb.state === 'done' && <Check size={13} aria-hidden="true" />}</b><span className="xs" style={{ opacity: 0.8 }}>{tb.state === 'done' ? t('Done') : tb.state === 'locked' ? t('Locked') : t('Open')}</span></>;
        const style = { flex: '1 0 110px', textAlign: 'center' as const, padding: '8px 10px', borderRadius: 12, fontSize: 13, display: 'flex', flexDirection: 'column' as const, gap: 2, background: tb.current ? 'linear-gradient(135deg, var(--gold, #E8B94F), #C9962E)' : undefined, color: tb.current ? '#1b1203' : undefined, opacity: tb.state === 'locked' ? 0.55 : 1 };
        return tb.state === 'locked' ? <span key={tb.idx} style={style} aria-label={`${t('Level {n}', { n: tb.idx })}, ${t('Locked')}`}>{inner}</span>
          : <Link key={tb.idx} href={`/levels/${tb.code}`} style={style} aria-current={tb.current ? 'page' : undefined} title={tb.title}>{inner}</Link>;
      })}
    </nav>
  );
}

const dot = (state: string) => <span aria-hidden="true" style={{ width: 34, height: 34, borderRadius: '50%', flex: 'none', display: 'grid', placeItems: 'center', background: state === 'done' ? 'var(--success, #1f9d55)' : 'var(--surface-2, #fff)', border: state === 'done' ? 0 : '2px solid var(--border)', color: state === 'done' ? '#fff' : 'var(--text-3)' }}>{state === 'done' ? <Check size={18} strokeWidth={3} /> : state === 'skipped' ? <SkipForward size={14} /> : state === 'locked' ? <Lock size={13} /> : null}</span>;

function Timeline({ items }: { items: { key: string; href: string | null; label: string; title: string; get: string; state: string }[] }) {
  return (
    <ol style={{ listStyle: 'none', padding: 0, margin: 0, position: 'relative' }}>
      {items.map((it, i) => (
        <li key={it.key} className="row gap-12" style={{ alignItems: 'flex-start', position: 'relative', paddingBottom: 14 }}>
          {i < items.length - 1 && <span aria-hidden="true" style={{ position: 'absolute', left: 16, top: 34, bottom: 0, width: 2, background: 'var(--border)' }} />}
          {dot(it.state)}
          {it.href ? <Link href={it.href} className="card card-pad lift" style={{ flex: 1, display: 'block', padding: 14, position: 'relative', borderLeft: it.state === 'done' ? '4px solid var(--success, #1f9d55)' : undefined }}>
            {it.state === 'done' && <CheckCircle2 size={20} aria-hidden="true" style={{ position: 'absolute', top: 12, right: 12, color: 'var(--success, #1f9d55)' }} />}
            <span className="muted xs">{it.label}</span>
            <b style={{ display: 'block', margin: '2px 0' }}><Tv v={it.title} /></b>
            <span className="small" style={{ color: 'var(--gold-ink, #8a6414)' }}>{it.get}</span>
          </Link> : <div className="card card-pad" style={{ flex: 1, padding: 14, opacity: 0.6 }}><span className="muted xs">{it.label}</span><b style={{ display: 'block' }}><Tv v={it.title} /></b></div>}
        </li>
      ))}
    </ol>
  );
}

async function LevelPage({ params, searchParams }: { params: Promise<{ code: string }>; searchParams: Promise<{ a?: string }> }) {
  const { code } = await params; const { a } = await searchParams;
  if (a && /^\d$/.test(a)) redirect(`/levels/${code}/activities/${a}`); // old links (?a=6) open the activity page
  const ctx = await requirePerm('learn:self');
  const [d, t] = await Promise.all([loadLevelPage(ctx, code), getT()]);
  const { tabs } = d;
  if (d.locked) return <><LevelTabs tabs={tabs} t={t} /><div className="card empty"><div className="ic-wrap"><Lock size={22} /></div><h1 className="h3">{t('{title} is locked', { title: d.st.level.title })}</h1><p className="text-2" style={{ marginTop: 6 }}>{t('It opens when every activity and day of the previous level is done or skipped.')}</p><Link className="btn btn-gold btn-sm" style={{ marginTop: 14 }} href="/levels">{t('Back to journey')}</Link></div></>;
  const st = d.st;
  const level = st.level;
  const acts = d.activities as { id: string; idx: number; title: string; xp: number; state: string; config: Record<string, unknown> }[];
  const days = st.days;
  // Day materials per day (docs/DAY_MATERIALS_SPEC.md v1.1), so learners see where the study links are.
  const dayContents = await prisma.content.findMany({ where: { levelId: level.id, kind: 'md' }, select: { id: true, position: true } });
  const matCounts = await prisma.dayMaterial.groupBy({ by: ['contentId'], where: { tenantId: ctx.tenantId, contentId: { in: dayContents.map(c => c.id) } }, _count: { _all: true } });
  const materialsOn = new Map(dayContents.map(c => [c.position, matCounts.find(m => m.contentId === c.id)?._count._all ?? 0]));
  const actDone = acts.filter(x => ['completed', 'in_review', 'skipped'].includes(x.state)).length;
  const words = levelWords(acts);
  const next = tabs.find(x => x.idx === level.idx + 1);
  const session = d.sessions[0];
  const stateOf = (s: string) => (s === 'completed' || s === 'done' || s === 'in_review' ? 'done' : s === 'skipped' ? 'skipped' : s === 'locked' ? 'locked' : 'open');
  const label = (s: string) => s === 'in_review' ? `✓ ${t('Submitted · in review')}` : s === 'needs_changes' ? t('Changes requested') : ({ done: `✓ ${t('Done')}`, skipped: t('Skipped'), locked: t('Locked'), open: t('Open') } as Record<string, string>)[stateOf(s)];

  return (<>
    <LevelTabs tabs={tabs} t={t} />
    {d.locale !== 'en' && !d.translated && <TranslateLesson endpoint={`/api/v1/levels/${code}/translate`} />}
    {words.length > 0 && <section className="card card-pad" aria-labelledby="wordsT" style={{ marginBottom: 16 }}>
      <h2 className="section-label" id="wordsT" style={{ margin: 0 }}><Tr>Words you will see</Tr></h2>
      <dl className="grid2" style={{ gap: '10px 24px', margin: '10px 0 0' }}>{words.map(w => <div key={w.word} className="small"><dt style={{ display: 'inline', fontWeight: 700 }}><Tv v={w.word} />:</dt> <dd style={{ display: 'inline', margin: 0 }}><Tv v={w.meaning} /></dd></div>)}</dl>
    </section>}

    <section className="card card-pad" aria-labelledby="pageTitle" style={{ marginBottom: 16, background: 'linear-gradient(120deg, var(--gold-tint, #fff8e6), transparent 70%)' }}>
      <div className="row gap-16 wrap" style={{ alignItems: 'center' }}>
        <span aria-hidden="true" style={{ width: 64, height: 64, borderRadius: 16, display: 'grid', placeItems: 'center', fontSize: 30, fontWeight: 800, background: 'linear-gradient(135deg, #E8B94F, #C9962E)', color: '#1b1203', flex: 'none' }}>{level.idx}</span>
        <div style={{ flex: 1, minWidth: 220 }}>
          <span className="badge badge-gold">{t('Level {a} of {b}', { a: level.idx, b: tabs.length })}{days.length ? ` · ${t('Days {a}–{b}', { a: days[0].day, b: days[days.length - 1].day })}` : ''}</span>
          <h1 className="h2" id="pageTitle" style={{ margin: '6px 0 2px' }}><Tv v={level.title} /></h1>
          <p className="text-2 small" style={{ margin: 0 }}><Tv v={level.summary ?? ''} /></p>
        </div>
        <div className="ring" style={{ ['--p' as string]: Math.round((actDone / Math.max(1, acts.length)) * 100) }} role="img" aria-label={t('{n} of 6 activities complete', { n: actDone })}><span>{actDone}/{acts.length}<small>{t('DONE')}</small></span></div>
      </div>
    </section>

    {st.completion.complete && <div className="callout ok" role="status" style={{ marginBottom: 16, display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      <CheckCircle2 size={18} /><span style={{ flex: 1, minWidth: 220 }}><b>{t('Level complete.')}</b> {moveOnText(t, st.completion.earned, st.completion.total, st.completion.next?.title ?? null)}</span>
      {st.completion.next && <Link className="btn btn-gold btn-sm" href={`/levels/${st.completion.next.code}`}>{t('Go to {title}', { title: st.completion.next.title })} <ArrowRight size={14} /></Link>}
    </div>}

    <div className="grid-12" style={{ alignItems: 'start' }}>
      <div className="span-8 stack gap-16">
        {!level.isPublished ? <section className="card card-pad"><h2 className="h3"><Tr>Activities coming soon</Tr></h2><p className="text-2 small"><Tr>Your program team publishes each level’s activities after review. You can already read this level’s lessons below.</Tr></p></section> : null}
        {days.length > 0 && <section aria-labelledby="daysT">
          <h2 className="h3 row gap-8" id="daysT" style={{ alignItems: 'center', marginBottom: 4 }}><CalendarDays size={18} aria-hidden="true" /><Tr>Your days</Tr></h2>
          <p className="small text-2" style={{ margin: '0 0 12px' }}><Tr>Each day teaches one step of the project. Follow its steps; each step explains the idea, tells you what to do, and checks your work.</Tr></p>
          <Timeline items={days.map(x => ({ key: `d${x.day}`, href: `/levels/${code}/days/${x.day}`, label: `${t('Day {n}', { n: x.day })} · ${x.state === 'in_progress' ? t('In progress') : label(x.state === 'done' ? 'done' : x.state)}`, title: x.title.replace(/^Day \d+\s+—\s+/, ''), get: `${x.state === 'done' ? t('Done · +{xp} points', { xp: x.xp }) : x.stepCount ? t('{n} guided steps · up to {xp} points', { n: x.stepCount, xp: x.points }) : t('You get: up to {xp} points', { xp: x.points })}${materialsOn.get(x.day) ? ` · 📎 ${t('{n} materials', { n: materialsOn.get(x.day)! })}` : ''}`, state: stateOf(x.state) }))} />
        </section>}
        {level.isPublished && <section aria-labelledby="actsT">
          <h2 className="h3 row gap-8" id="actsT" style={{ alignItems: 'center', marginBottom: 4 }}><ListChecks size={18} aria-hidden="true" /><Tr>Your activities</Tr></h2>
          <p className="small text-2" style={{ margin: '0 0 12px' }}><Tr>These activities build on each other: the mission, the ideas, your build, your evidence, your proof, and a final challenge.</Tr></p>
          <Timeline items={acts.map(x => ({ key: `a${x.idx}`, href: x.state === 'locked' ? null : `/levels/${code}/activities/${x.idx}`, label: `${t('Activity {n}', { n: x.idx })} · ${label(x.state)}`, title: x.title, get: `${t('You get')}: ${activityBrief(x).leaveWith}`, state: stateOf(x.state) }))} />
        </section>}
      </div>
      <aside className="span-4 stack gap-16">
        <LevelPrep code={code} items={levelPrep(level)} />
        {session && <section className="card card-pad stack gap-8" aria-labelledby="classT">
          <h2 className="h3 row gap-8" id="classT" style={{ margin: 0, alignItems: 'center' }}><Info size={18} aria-hidden="true" /><Tr>Class info</Tr></h2>
          <b><Tv v={session.title} /> · {t('{n} min', { n: session.durationMin })}</b>
          <span className="small row gap-8" style={{ alignItems: 'center' }}><CalendarDays size={15} aria-hidden="true" />{new Date(session.startsAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', weekday: 'long', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })} IST</span>
          {Date.parse(session.startsAt) < Date.now() ? <span className="muted small"><Tr>This class has run.</Tr></span> : session.liveLink ? <a className="btn btn-gold btn-sm" href={session.liveLink} target="_blank" rel="noopener noreferrer"><Tr>Join link</Tr></a> : null}
          {session.agenda?.length ? <><span className="section-label"><Tr>In this class</Tr></span>{session.agenda.map((g, i) => <div key={i} className="row between small"><Tv v={g.title} /><span className="muted">{t('{n} min', { n: g.minutes })}</span></div>)}</> : null}
        </section>}
        <StuckHelper code={code} />
      </aside>
    </div>
    {next && next.state !== 'locked' && <div className="row" style={{ justifyContent: 'flex-end', marginTop: 8 }}><Link className="btn btn-outline" href={`/levels/${next.code}`}>{t('Level {n}', { n: next.idx })} <ArrowRight size={15} /></Link></div>}
  </>);
}

export default guarded(LevelPage);
