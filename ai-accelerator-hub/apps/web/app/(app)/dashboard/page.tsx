import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowRight, LifeBuoy, Flame, Snowflake, Clock, Pause, Award } from 'lucide-react';
import { requireCtx, hasPerm, isLearner } from '@/lib/server/context';
import { learnerSummary, leaderboard } from '@/lib/domain/insights';
import { journeyOverview, levelState } from '@/lib/domain/journey';
import { learnerTitle, starsText } from '@/lib/domain/levelTitles';
import { RECOVERY_QUIZ } from '@/lib/domain/streak';
import { StreakRecovery } from '@/components/learn/StreakRecovery';
import { ThisWeek } from '@/components/learn/ThisWeek';
import { learnerWeek } from '@/lib/domain/cohortWeek';
import { CohortWeek } from '@/components/learn/CohortWeek';
import { LevelRibbon } from '@/components/learn/LevelRibbon';
import { getProfile } from '@/lib/domain/profile';
import { guarded } from '@/lib/server/page';
import { getT } from '@/lib/i18n/server';
import { Tr } from '@/components/i18n/Tr';
import { Tv } from '@/components/i18n/Tv';

export const metadata = { title: 'Mission Control' };

function stars(n: number, seed: number) {
  let s = seed * 9301 + 49297; const r = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  return Array.from({ length: n }, (_, i) => { const size = r() < 0.15 ? 2.5 : r() < 0.5 ? 1.5 : 1; return <span key={i} className={`star${r() < 0.45 ? ' tw' : ''}`} style={{ left: `${r() * 100}%`, top: `${r() * 100}%`, width: size, height: size, ['--o' as string]: (0.2 + r() * 0.6).toFixed(2), ['--d' as string]: `${(3 + r() * 4).toFixed(1)}s` }} />; });
}

async function Dashboard() {
  const ctx = await requireCtx();
  if (!isLearner(ctx)) redirect(hasPerm(ctx, 'analytics:read') ? '/admin' : hasPerm(ctx, 'review:read') ? '/review' : '/settings');
  const [sum, journey, lb, profile, t] = await Promise.all([learnerSummary(ctx), journeyOverview(ctx), leaderboard(ctx, 'cohort'), getProfile(ctx), getT()]);
  // The furthest level the learner has opened: with free progression, Level 1 can stay "submitted" while Level 2 is open.
  const opened = journey.levels.filter(l => l.state !== 'locked');
  const current = [...opened].reverse().find(l => l.state !== 'approved') ?? opened[opened.length - 1] ?? journey.levels[0];
  const [st, week] = await Promise.all([levelState(ctx, current.code), learnerWeek(ctx, { id: current.id, code: current.code }).catch(() => null)]);
  const acts = st.locked ? [] : st.activities;
  const done = acts.filter(a => a.state === 'completed').length;
  const next = acts.find(a => ['available', 'needs_changes'].includes(a.state)) || acts.find(a => a.state === 'in_review');
  const nba = !profile ? { title: 'Shape the journey around you', body: 'Two minutes: tell us whether you are a student, young coder, engineer, builder or business owner. We personalise examples, demos, questions, pace and your AI agent.', href: '/onboarding', cta: 'Build my path' }
    : !current.published ? { title: `${current.title} is unlocked`, body: 'Its activities appear as soon as your program team publishes them. You will get a notification.', href: '/library', cta: 'Explore the library' }
    : next?.state === 'in_review' ? { title: 'Your proof is with a reviewer', body: 'While you wait, take on the Boss challenge — your best result goes to your reviewer.', href: `/levels/${current.code}?a=6`, cta: 'Open the Boss challenge' }
    : next ? { title: `${next.title}`, body: t('{title} · activity {n} of 6 · +{xp} XP', { title: current.title, n: next.idx, xp: next.xp }), href: `/levels/${current.code}?a=${next.idx}`, cta: t(next.state === 'needs_changes' ? 'See reviewer feedback' : 'Continue') }
    : { title: `${current.title} complete`, body: 'Great work. Your next level opens when it is published.', href: '/levels', cta: t('Open journey') };
  const sv = sum.streak; const SI = { active: Flame, frozen: Snowflake, grace: Clock, recovery: Pause, new: Flame }[sv.status] || Flame;
  const first = ctx.name.split(' ')[0];
  return (
    <>
      <section className="ph ph-plain"><h1 id="pageTitle">{t('Welcome back, {name}', { name: first })}</h1><p className="desc">{sum.cohort ? `${sum.cohort} · ` : ''}{ctx.tenantName} · {current.stage?.title || ''}{profile ? ` · ${profile.plan.label} path` : ''}</p></section>
      <div className="grid-12" style={{ marginTop: 20 }}>
        <section className="card ag-hero span-12" aria-labelledby="nbaT">
          <div className="ag-left">
            <div className="section-label">{t('Next best action')}</div>
            <div className="nba"><span className="ic-tile" aria-hidden="true"><ArrowRight size={18} /></span><div><h2 className="h2" id="nbaT"><Tv v={nba.title} /></h2><p className="text-2 small" style={{ marginTop: 4 }}><Tv v={nba.body} /></p></div></div>
            <div className="row gap-12 wrap"><Link className="btn btn-gold" href={nba.href}><Tv v={nba.cta} /> <ArrowRight size={15} /></Link><Link className="btn btn-outline" href={`/coach?level=${current.code}`}><LifeBuoy size={15} />{t('Ask a coach')}</Link></div>
            <div className="stack gap-12" style={{ marginTop: 'auto', paddingTop: 18, borderTop: '1px solid var(--border)' }}>
              <div><div className="row between small"><span className="bold">{t('{title} activities', { title: current.title })}</span><span className="muted">{t('{n} of 6', { n: done })}</span></div><div className="bar" style={{ marginTop: 6 }} role="progressbar" aria-valuemin={0} aria-valuemax={6} aria-valuenow={done} aria-label={t('Level activities')}><i style={{ width: `${(done / 6) * 100}%` }} /></div></div>
              <div><div className="row between small"><span className="bold">{t('Journey')}</span><span className="muted">{t('{a} of {b} levels approved', { a: journey.levels.filter(l => l.state === 'approved').length, b: journey.levels.length })}</span></div><div className="bar blue" style={{ marginTop: 6 }} role="progressbar" aria-valuemin={0} aria-valuemax={15} aria-valuenow={journey.levels.filter(l => l.state === 'approved').length} aria-label={t('Journey progress')}><i style={{ width: `${Math.max(2, (journey.levels.filter(l => l.state === 'approved').length / 15) * 100)}%` }} /></div></div>
            </div>
          </div>
          <div className="ag-space">
            <div className="stars" aria-hidden="true">{stars(50, 11)}</div>
            <div className="ag-glow" aria-hidden="true" /><div className="ag-ring r1" aria-hidden="true" /><div className="ag-ring r2" aria-hidden="true" />
            <div className="ag-orbit" aria-hidden="true">{journey.levels.map((l, i) => <i key={l.idx} className={l.code === current.code ? 'cur' : ''} style={{ transform: `rotate(${(i / 15) * 360}deg) translateY(-150px)` }} />)}</div>
            <div className="ag-planet-wrap" aria-hidden="true"><div className="ag-planet"><div><div className="k">{current.state === 'approved' ? 'COMPLETE' : 'CURRENT'}</div><div className="lv">L{String(current.idx).padStart(2, '0')}</div><div className="nm">{current.title.toUpperCase()}</div><div className="xp">{current.xp} XP</div></div></div></div>
            <div className="ag-card ag-c1"><div className="k">{t('XP balance')}</div><div className="v">{sum.xp.toLocaleString('en-IN')}<small>XP</small></div><div className="mbar"><i style={{ width: `${sum.nextTier ? Math.max(3, ((sum.xp - sum.tier.min) / (sum.nextTier.min - sum.tier.min)) * 100) : 100}%` }} /></div><div className="s">{sum.tier.name} <Tr>tier</Tr>{sum.nextTier ? ` · ${sum.nextTier.min - sum.xp} to ${sum.nextTier.name}` : ''}</div></div>
            <div className="ag-card ag-c2"><div className="k">{t('Streak')}</div><div className="v"><span className="flame"><SI size={15} /></span>{sv.current}<small>{t('days')}</small></div><div className="s"><Tr>Longest</Tr> {sv.longest} · {sv.freezes} <Tr>freeze</Tr>{sv.freezes === 1 ? '' : 's'}</div></div>
            <div className="ag-card ag-c3"><div className="k">{t('Cohort standing')}{lb.course ? <> · <Tv v={lb.course.title} /></> : null}</div><div className="v">#{lb.me?.pos ?? '—'}<small><Tr>of</Tr> {lb.total}</small></div><div className="mbar blue"><i style={{ width: `${lb.me ? Math.max(3, ((lb.total - lb.me.pos + 1) / lb.total) * 100) : 3}%` }} /></div><Link href={lb.course ? `/ranks?tab=cohort&course=${lb.course.id}` : '/ranks?tab=cohort'}>{t('View standings')} <ArrowRight size={13} /></Link></div>
          </div>
        </section>
        {(() => { const tt = learnerTitle(journey.levels, journey.levels.filter(l => l.state === 'approved').map(l => l.idx)); return (
          <section className="card card-pad span-12 row gap-12 wrap" aria-label={t('Your title')} style={{ marginTop: 12, alignItems: 'center' }}>
            <span style={{ fontSize: 26 }} aria-hidden="true">🏅</span>
            <div style={{ flex: 1, minWidth: 200 }}><div className="muted xs bold">{t('Your title')}</div><div className="h3" style={{ margin: 0 }}><Tv v={tt.current} /> {tt.stars > 0 && <span style={{ color: 'var(--gold, #E8B94F)' }} aria-label={t('{n} of 5 stars', { n: tt.stars })}>{starsText(tt.stars)}</span>}</div></div>
            <div className="small">{tt.isMax ? <Tr>Top title of this course. Brilliant work!</Tr> : <><Tr>Next:</Tr> <b><Tv v={tt.next ?? ''} /></b> · {t('{n} level(s) to go', { n: tt.levelsToNext })}</>}</div>
          </section>); })()}

        {week?.kind === 'cohort' ? <CohortWeek w={JSON.parse(JSON.stringify(week.w))} /> : week?.kind === 'plan' ? <ThisWeek w={week.w} /> : null}

        <section className="card card-pad span-6 stack gap-12" id="streak" aria-labelledby="stT">
          <h2 className="section-label" id="stT">{t('Streak')}</h2>
          <div className="row gap-12"><span className={`pill pill-streak ${sv.status === 'active' ? '' : sv.status}`} style={{ height: 40 }}><SI size={15} aria-hidden="true" /><b>{sv.current}</b></span><div><b>{{ active: 'On a roll', frozen: 'Protected by a freeze', grace: 'At risk — grace window', recovery: 'Paused, not lost', new: 'Start your streak' }[sv.status]}</b><p className="muted small"><Tv v={sv.message} /></p></div></div>
          {sv.status === 'recovery' && 'prev' in sv && (sv.prev || 0) > 0 && <StreakRecovery q={RECOVERY_QUIZ.q} options={RECOVERY_QUIZ.options} />}
          <p className="muted xs"><Tr>A day counts when you finish a real activity (IST). Missed days use freeze tokens first; you are never reset without a chance to recover.</Tr></p>
        </section>
        <section className="card card-pad span-6 stack gap-12" aria-labelledby="bdT">
          <h2 className="section-label" id="bdT">{t('Recent achievements')}</h2>
          {sum.badges.length ? sum.badges.slice(0, 3).map(b => <div key={b.code} className="row gap-12"><span className="avatar" aria-hidden="true"><Award size={18} /></span><div><b>{b.name}</b><p className="muted small"><Tv v={b.tier} /> <Tr>badge</Tr></p></div></div>) : <p className="text-2 small"><Tr>Your first badge arrives when a reviewer approves your first proof.</Tr></p>}
          <Link className="link small" href="/achievements">{t('All achievements')} <ArrowRight size={13} /></Link>
        </section>

        <section className="card card-pad span-12" aria-labelledby="jrT">
          <div className="row between wrap gap-8"><h2 className="h3" id="jrT">{t('Your {n}-level journey', { n: journey.levels.length })}</h2><Link className="link small" href="/levels">{t('Open journey')} <ArrowRight size={13} /></Link></div>
          <LevelRibbon levels={journey.levels} />
        </section>
      </div>
    </>
  );
}

export default guarded(Dashboard);
