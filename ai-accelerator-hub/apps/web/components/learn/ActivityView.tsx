'use client';
/**
 * One activity on its own page: what you do here, what you leave with, why it matters, the activity itself,
 * "Was this useful?", and Back / Skip / Next activity with what comes next.
 */
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronDown, Clock, SkipForward, ThumbsDown, ThumbsUp } from 'lucide-react';
import { api, ApiError } from '@/lib/client/api';
import { useT } from '@/components/i18n/I18nProvider';
import { Tv } from '@/components/i18n/Tv';
import { Briefing, Learn, Explore, Build, Proof, Boss, type Act, type Props as WorkspaceProps } from '@/components/learn/LevelWorkspace';
import { DatasetCheckPanel, ScreenshotPanel } from '@/components/learn/EvidencePanels';
import type { ActivityBrief } from '@/lib/domain/levelView';

type Ref = { idx: number; title: string } | null;
type P = {
  code: string; level: { idx: number; title: string }; act: Act; count: number; brief: ActivityBrief;
  latest: WorkspaceProps['latest']; boss: WorkspaceProps['boss']; rubric: WorkspaceProps['rubric'];
  prev: Ref; next: Ref; vote: boolean | null;
};

export function ActivityView(p: P) {
  const router = useRouter(); const t = useT();
  const [msg, setMsg] = useState(''); const [err, setErr] = useState(''); const [vote, setVote] = useState<boolean | null>(p.vote); const [busy, setBusy] = useState(false); const [why, setWhy] = useState(false);
  const a = p.act;
  const onDone = (m: string) => { setMsg(m); router.refresh(); };
  const canSkip = ['available', 'needs_changes'].includes(a.state) && !(a.idx === 5 && p.latest && ['pending', 'approved'].includes(p.latest.state));
  const skip = async () => { setBusy(true); setErr(''); try { await api(`/api/v1/levels/${p.code}/skip`, { body: { idx: a.idx } }); router.push(p.next ? `/levels/${p.code}/activities/${p.next.idx}` : `/levels/${p.code}`); router.refresh(); } catch (e) { setErr((e as ApiError).message); } finally { setBusy(false); } };
  const rate = async (useful: boolean) => { setVote(useful); try { await api(`/api/v1/levels/${p.code}/feedback`, { body: { target: `activity:${a.idx}`, useful } }); } catch { /* a missed vote is not worth an error */ } };
  const panel = { a, code: p.code, onDone };
  const status = a.state === 'completed' ? t('Done') : a.state === 'skipped' ? t('Skipped') : a.state === 'locked' ? t('Locked') : a.state === 'in_review' ? t('In review') : a.state === 'needs_changes' ? t('Changes requested') : t('Open');

  return (
    <div className="stack gap-16" style={{ maxWidth: 860, margin: '0 auto' }}>
      <section className="card card-pad stack gap-12" aria-labelledby="pageTitle">
        <Link className="link small" href={`/levels/${p.code}`}><ArrowLeft size={14} /> {t('Level {n}', { n: p.level.idx })}</Link>
        <div className="row gap-8 wrap" style={{ alignItems: 'center' }}>
          <span className="eyebrow" style={{ margin: 0 }}>{t('Level {n}', { n: p.level.idx })} · {t('Activity {a} of {b}', { a: a.idx, b: p.count })}</span>
          <span className="badge badge-neutral row gap-4" style={{ alignItems: 'center' }}><Clock size={12} aria-hidden="true" /> {t('{n} min', { n: p.brief.minutes })}</span>
          <span className={`badge ${a.state === 'completed' ? 'badge-success' : 'badge-neutral'}`}>{status}</span>
          <span className="badge badge-gold">+{a.xp} XP</span>
        </div>
        <h1 className="h2" id="pageTitle" style={{ margin: 0 }}><Tv v={a.title} /></h1>
        <div className="callout info" style={{ display: 'block' }}><span className="section-label" style={{ display: 'block', marginBottom: 4 }}>{t('What you do here')}</span><Tv v={p.brief.doHere} /></div>
        <div className="callout ok" style={{ display: 'block' }}><span className="section-label" style={{ display: 'block', marginBottom: 4 }}>{t('You leave with')}</span><Tv v={p.brief.leaveWith} /></div>
        {p.brief.why && <div><button type="button" className="btn btn-text btn-sm" aria-expanded={why} onClick={() => setWhy(w => !w)}>{t('What this activity is for')} <ChevronDown size={14} style={{ transform: why ? 'rotate(180deg)' : undefined }} /></button>{why && <p className="small text-2" style={{ margin: '6px 0 0' }}><Tv v={p.brief.why} /></p>}</div>}
      </section>

      <section className="card card-pad" aria-label={a.title}>
        {msg && <div className="callout ok" role="status" style={{ marginBottom: 14 }}><CheckCircle2 size={18} /><span>{msg}</span></div>}
        {a.state === 'skipped' && <p className="callout info small" style={{ marginBottom: 14 }}><SkipForward size={16} /><span>{t('You skipped this activity. Do it any time below to earn its {xp} points.', { xp: a.xp })}</span></p>}
        {a.state === 'locked' ? <p className="text-2">{t('Finish or skip the previous activity first.')}</p>
          : a.config.kind === 'briefing' ? <Briefing {...panel} />
          : a.config.kind === 'learn' ? <Learn {...panel} />
          : a.config.kind === 'explore' ? <Explore {...panel} />
          : a.config.kind === 'build' ? <Build {...panel} />
          : a.config.kind === 'dataset' ? <DatasetCheckPanel a={a} code={p.code} onDone={onDone} />
          : a.config.kind === 'screenshot' ? <ScreenshotPanel a={a} code={p.code} onDone={onDone} />
          : a.config.kind === 'proof' ? <Proof {...panel} latest={p.latest} />
          : a.config.kind === 'boss' ? <Boss a={a} code={p.code} latest={p.latest} boss={p.boss} rubric={p.rubric} onDone={onDone} />
          : <p className="text-2">{t('This activity has not been published yet.')}</p>}
        {err && <p className="field-err" role="alert" style={{ marginTop: 10 }}>{err}</p>}
        {canSkip && <div className="row gap-8 wrap" style={{ marginTop: 16, alignItems: 'center' }}><button className="btn btn-ghost btn-sm" type="button" disabled={busy} onClick={skip}><SkipForward size={15} />{busy ? t('Skipping…') : t('Skip for now')}</button><span className="muted xs">{t('You move on now; this activity earns its points when you come back and finish it.')}</span></div>}
      </section>

      <section className="row gap-8 wrap" aria-label={t('Was this useful?')} style={{ alignItems: 'center' }}>
        <span className="small text-2">{t('Was this useful?')}</span>
        <button type="button" className={`btn btn-sm ${vote === true ? 'btn-gold' : 'btn-outline'}`} aria-pressed={vote === true} onClick={() => rate(true)} aria-label={t('Yes, useful')}><ThumbsUp size={15} /></button>
        <button type="button" className={`btn btn-sm ${vote === false ? 'btn-gold' : 'btn-outline'}`} aria-pressed={vote === false} onClick={() => rate(false)} aria-label={t('Not useful')}><ThumbsDown size={15} /></button>
        {vote !== null && <span className="muted xs">{t('Thanks. Your team uses this to improve the content.')}</span>}
      </section>

      <nav className="row between wrap gap-12" aria-label={t('Activity navigation')}>
        {p.prev ? <Link className="btn btn-outline" href={`/levels/${p.code}/activities/${p.prev.idx}`}><ArrowLeft size={15} /> {t('Previous activity')}</Link> : <Link className="btn btn-outline" href={`/levels/${p.code}`}><ArrowLeft size={15} /> {t('Back to Level {n}', { n: p.level.idx })}</Link>}
        {p.next ? <span className="stack" style={{ alignItems: 'flex-end', gap: 4 }}><Link className="btn btn-gold" href={`/levels/${p.code}/activities/${p.next.idx}`}>{t('Next activity')} <ArrowRight size={15} /></Link><span className="muted xs">{t('Up next')}: <Tv v={p.next.title} /></span></span>
          : <Link className="btn btn-gold" href={`/levels/${p.code}`}>{t('Back to Level {n}', { n: p.level.idx })} <ArrowRight size={15} /></Link>}
      </nav>
    </div>
  );
}
