'use client';
/**
 * The day page's side panel (docs/DAY_SIDE_PANEL_SPEC.md): what a learner reaches for while reading a lesson.
 * 1. Ask the AI mentor about today (it already knows the lesson). 2. Today's materials, one tap to open.
 * 3. Classmates on this day: their questions, and "Ask the class". 4. Go deeper: open-source repos for this module.
 */
import { useState } from 'react';
import Link from 'next/link';
import { Bot, BookOpen, CheckCircle2, ExternalLink, GitFork, MessageCircle, Paperclip, Send } from 'lucide-react';
import { api, ApiError } from '@/lib/client/api';
import { CoachChat } from '@/components/learn/CoachChat';
import { useT } from '@/components/i18n/I18nProvider';
import { Tv } from '@/components/i18n/Tv';

type Post = { id: string; kind: string; body: string; author: string; mine: boolean; answered: boolean; replies: number; at: string };
type Props = {
  code: string; day: number; dayTitle: string;
  coach: { assistants: { code: string; name: string }[]; configured: boolean; creditsLeft: number } | null;
  materials: { id: string; title: string }[];
  feed: { items: Post[]; total: number } | null;
  repos: { repo: string; title: string; why: string; url: string }[];
};

const ago = (iso: string) => { const m = Math.max(1, Math.round((Date.now() - Date.parse(iso)) / 60_000)); return m < 60 ? `${m} min` : m < 1440 ? `${Math.round(m / 60)} h` : `${Math.round(m / 1440)} d`; };

export function DaySide({ code, day, dayTitle, coach, materials, feed: initialFeed, repos }: Props) {
  const t = useT();
  const [feed, setFeed] = useState(initialFeed);
  const [draft, setDraft] = useState(''); const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [sent, setSent] = useState(false);
  const ask = async () => {
    const body = draft.trim(); if (body.length < 5 || busy) return;
    setBusy(true); setErr('');
    try {
      const r = await api<{ id: string }>('/api/v1/feed', { body: { kind: 'question', body: `Day ${day} · ${dayTitle}: ${body}`, levelCode: code, day } });
      setFeed(f => ({ total: (f?.total ?? 0) + 1, items: [{ id: r.id, kind: 'question', body: `Day ${day} · ${dayTitle}: ${body}`.slice(0, 160), author: t('You'), mine: true, answered: false, replies: 0, at: new Date().toISOString() }, ...(f?.items ?? [])].slice(0, 3) }));
      setDraft(''); setSent(true);
    } catch (e) { setErr((e as ApiError).message); } finally { setBusy(false); }
  };
  return (
    <div className="stack gap-12 day-side">
      {coach && (
        <section className="card card-pad stack gap-8" aria-labelledby="dsCoach">
          <h2 className="h4 row gap-8" id="dsCoach" style={{ alignItems: 'center', margin: 0 }}><Bot size={16} aria-hidden="true" />{t('Ask the AI mentor')}</h2>
          <p className="muted xs" style={{ margin: 0 }}>{t('It has read today’s lesson. It explains and gives hints, not the answers.')}</p>
          <CoachChat compact assistants={coach.assistants} configured={coach.configured} creditsLeft={coach.creditsLeft} context={{ levelCode: code, day }}
            prompts={['Explain today’s idea in simple words', 'Give me a hint for the step I am on', 'Show me where this is used at work']} />
        </section>
      )}

      {materials.length > 0 && (
        <section className="card card-pad stack gap-6" aria-labelledby="dsMat">
          <h2 className="h4 row gap-8" id="dsMat" style={{ alignItems: 'center', margin: 0 }}><Paperclip size={16} aria-hidden="true" />{t('Today’s materials')}</h2>
          <ul className="ds-list">{materials.map(m => <li key={m.id}><a className="link small" href={`/api/v1/materials/${m.id}/open`} target="_blank" rel="noopener noreferrer"><BookOpen size={12} aria-hidden="true" /> <Tv v={m.title} /> <ExternalLink size={10} aria-hidden="true" /></a></li>)}</ul>
          <a className="link xs" href="#materials">{t('Tick Studied / Practised')} ↑</a>
        </section>
      )}

      {feed && (
        <section className="card card-pad stack gap-8" aria-labelledby="dsFeed">
          <h2 className="h4 row gap-8" id="dsFeed" style={{ alignItems: 'center', margin: 0 }}><MessageCircle size={16} aria-hidden="true" />{t('Classmates on Day {n}', { n: day })}</h2>
          {feed.items.length ? (
            <ul className="ds-list">{feed.items.map(p => (
              <li key={p.id}><Link className="ds-post" href={`/feed?post=${p.id}`}>
                <span className="small"><Tv v={p.body} /></span>
                <span className="muted xs">{p.mine ? t('You') : <Tv v={p.author} />} · {ago(p.at)} · {p.answered ? <span className="wk-ok"><CheckCircle2 size={11} aria-hidden="true" /> {t('Answered')}</span> : t('{n} replies', { n: p.replies })}</span>
              </Link></li>))}
            </ul>
          ) : <p className="muted xs" style={{ margin: 0 }}>{t('No questions about this day yet. Be the first: someone else is stuck on the same thing.')}</p>}
          {feed.total > feed.items.length && <Link className="link xs" href="/feed?tab=questions">{t('See all {n} posts', { n: feed.total })} →</Link>}
          <form className="stack gap-6" onSubmit={e => { e.preventDefault(); void ask(); }}>
            <label className="sr-only" htmlFor="dsAsk">{t('Ask the class')}</label>
            <textarea id="dsAsk" className="textarea" rows={2} maxLength={1500} placeholder={t('Ask the class about today…')} value={draft} onChange={e => { setDraft(e.target.value); setSent(false); }} />
            {err && <p className="field-err" role="alert"><Tv v={err} /></p>}
            {sent && <p className="wk-ok xs" role="status" style={{ margin: 0 }}>{t('Posted to the feed. You get a notification when someone replies.')}</p>}
            <div><button className="btn btn-outline btn-sm" type="submit" disabled={busy || draft.trim().length < 5}><Send size={13} aria-hidden="true" /> {busy ? t('Posting…') : t('Ask the class')}</button></div>
          </form>
        </section>
      )}

      {repos.length > 0 && (
        <section className="card card-pad stack gap-6" aria-labelledby="dsRepos">
          <h2 className="h4 row gap-8" id="dsRepos" style={{ alignItems: 'center', margin: 0 }}><GitFork size={16} aria-hidden="true" />{t('Go deeper: open-source practice')}</h2>
          <ul className="ds-list">{repos.map(r => (
            <li key={r.repo}><a className="ds-post" href={r.url} target="_blank" rel="noopener noreferrer">
              <span className="small bold"><Tv v={r.title} /> <ExternalLink size={10} aria-hidden="true" /></span>
              <span className="muted xs"><Tv v={r.why} /></span>
              <span className="xs" style={{ fontFamily: 'var(--font-mono)', opacity: .7 }}>{`github.com/${r.repo}`}</span>
            </a></li>))}
          </ul>
          <p className="muted xs" style={{ margin: 0 }}>{t('Free and open source. Optional: today’s steps are all you need for points.')}</p>
        </section>
      )}
    </div>
  );
}
