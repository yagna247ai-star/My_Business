'use client';
/** Community feed (docs/FEED_ENGAGEMENT_SPEC.md): tabs, day prompt, share-your-win, Q&A with accepted answers, pins, edit/delete, in-page reports. */
import { useState } from 'react';
import { CheckCircle2, HelpCircle, Megaphone, Pin, Sparkles, Trophy } from 'lucide-react';
import { api, ApiError } from '@/lib/client/api';
import { Tr } from '@/components/i18n/Tr';
import { useT } from '@/components/i18n/I18nProvider';
import { Tv } from '@/components/i18n/Tv';

type Item = { id: string; kind: string; body: string; levelCode: string | null; day: number | null; linkUrl: string | null; author: string; authorStaff: boolean; mine: boolean; createdAt: string | Date; editedAt: string | Date | null; pinned: boolean; focused: boolean; answered: boolean; acceptedCommentId: string | null; comments: number; likes: number; celebrates: number; myReacts: string[]; canAccept: boolean; canPin: boolean; canEdit: boolean; canDelete: boolean };
type Reply = { id: string; body: string; author: string; authorStaff: boolean; mine: boolean; accepted: boolean; editedAt: string | Date | null; canDelete: boolean };
type Prompts = { prompt: { title: string; ask: string; levelCode: string; day: number } | null; win: { levelCode: string; text: string; title: string } | null; unanswered: number };
type Engagement = { activePosters: number; posts: number; replies: number; questions: number; answeredPct: number | null; medianFirstReplyMin: number | null } | null;
const TABS = [['all', 'All'], ['questions', 'Questions'], ['unanswered', 'Unanswered'], ['wins', 'Wins'], ['mine', 'Mine']] as const;
const KIND_LABEL: Record<string, string> = { post: 'Post', win: 'Win', question: 'Question', announcement: 'Announcement' };
const ist = (d: string | Date) => new Date(d).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' });

export function FeedPanels({ initial, nextCursor, prompts, engagement, canLead, initialTab }: { initial: Item[]; nextCursor: string | null; prompts: Prompts; engagement: Engagement; canLead: boolean; initialTab: string }) {
  const t = useT();
  const [err, setErr] = useState(''); const [msg, setMsg] = useState('');
  const [items, setItems] = useState(initial); const [cursor, setCursor] = useState(nextCursor); const [tab, setTab] = useState(initialTab);
  const [kind, setKind] = useState('post'); const [body, setBody] = useState(''); const [tag, setTag] = useState<{ levelCode: string; day?: number } | null>(null);
  const [open, setOpen] = useState<Record<string, boolean>>(Object.fromEntries(initial.filter(i => i.focused).map(i => [i.id, true])));
  const [replies, setReplies] = useState<Record<string, Reply[]>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<{ id: string; text: string; reply?: boolean } | null>(null);
  const [reporting, setReporting] = useState<{ id: string; type: 'post' | 'comment'; postId: string; reason: string } | null>(null);
  const [winDismissed, setWinDismissed] = useState(false);
  const [armed, setArmed] = useState<string | null>(null);
  const run = async <T,>(fn: () => Promise<T>, ok?: string) => { setErr(''); setMsg(''); try { const r = await fn(); if (ok) setMsg(ok); return r; } catch (e) { setErr((e as ApiError).message); return undefined; } };
  const load = async (nextTab: string, c?: string | null) => {
    const d = await api<{ items: Item[]; nextCursor: string | null }>(`/api/v1/feed?tab=${nextTab}${c ? `&cursor=${encodeURIComponent(c)}` : ''}`);
    setItems(prev => c ? [...prev, ...d.items.filter(i => !prev.some(p => p.id === i.id))] : d.items); setCursor(d.nextCursor);
  };
  const loadReplies = async (postId: string) => { const rows = await api<Reply[]>(`/api/v1/feed/${postId}/comments`); setReplies(r => ({ ...r, [postId]: rows })); };
  const patch = (id: string, p: Partial<Item>) => setItems(xs => xs.map(x => x.id === id ? { ...x, ...p } : x));
  const compose = (k: string, text: string, t2: { levelCode: string; day?: number } | null) => { setKind(k); setBody(text); setTag(t2); document.getElementById('postBody')?.focus(); };
  const react = (p: Item, k: 'like' | 'celebrate') => run(async () => { const r = await api<{ reacted: boolean }>(`/api/v1/feed/${p.id}/react`, { body: { kind: k } }); patch(p.id, { myReacts: r.reacted ? [...p.myReacts, k] : p.myReacts.filter(x => x !== k), [k === 'like' ? 'likes' : 'celebrates']: (k === 'like' ? p.likes : p.celebrates) + (r.reacted ? 1 : -1) }); });

  return (<div style={{ display: 'grid', gap: 16, marginTop: 18 }}>
    {err && <p className="callout warn small" role="alert"><Tv v={err} /></p>}
    {msg && <p className="callout ok small" role="status"><Tv v={msg} /></p>}

    {engagement && <section className="card card-pad" aria-label={t('This week in the community')}>
      <div className="row gap-16 wrap small"><b><Tr>This week</Tr>:</b>
        <span>{t('{n} active people', { n: engagement.activePosters })}</span><span>{t('{n} posts', { n: engagement.posts })}</span><span>{t('{n} replies', { n: engagement.replies })}</span>
        <span>{t('{n} questions', { n: engagement.questions })}{engagement.answeredPct !== null ? ` · ${t('{n}% answered', { n: engagement.answeredPct })}` : ''}</span>
        {engagement.medianFirstReplyMin !== null && <span>{t('first reply in {n} min (median)', { n: engagement.medianFirstReplyMin })}</span>}
      </div>
    </section>}

    {prompts.win && !winDismissed && <section className="card card-pad feed-win" aria-label={t('Share your win')}>
      <div className="row between wrap gap-8"><span><Trophy size={18} aria-hidden="true" /> <b>{t('You finished')} <Tv v={prompts.win.title} />!</b> <span className="muted small"><Tr>Your classmates would love to hear how you did it.</Tr></span></span>
        <span className="row gap-8"><button className="btn btn-gold btn-sm" type="button" onClick={() => compose('win', prompts.win!.text, { levelCode: prompts.win!.levelCode })}><Tr>Share your win</Tr></button><button className="btn btn-text btn-sm" type="button" onClick={() => setWinDismissed(true)}><Tr>Later</Tr></button></span></div>
    </section>}

    <section className="card card-pad" aria-labelledby="new"><h2 className="h3" id="new"><Tr>Share with your cohort</Tr></h2>
      {prompts.prompt && <div className="feed-prompt"><Sparkles size={15} aria-hidden="true" /> <span><b><Tv v={prompts.prompt.title} /></b> · <Tv v={prompts.prompt.ask} /></span>
        <span className="row gap-8"><button className="btn btn-outline btn-sm" type="button" onClick={() => compose('question', '', { levelCode: prompts.prompt!.levelCode, day: prompts.prompt!.day })}><Tr>Ask about it</Tr></button><button className="btn btn-outline btn-sm" type="button" onClick={() => compose('post', '', { levelCode: prompts.prompt!.levelCode, day: prompts.prompt!.day })}><Tr>Share what worked</Tr></button></span></div>}
      <form onSubmit={e => { e.preventDefault(); void run(async () => { await api('/api/v1/feed', { body: { kind, body, ...(tag ? { levelCode: tag.levelCode, ...(tag.day ? { day: tag.day } : {}) } : {}) } }); setBody(''); setTag(null); setTab('all'); await load('all'); }, kind === 'question' ? 'Question posted. You will get a notification when someone replies.' : 'Posted.'); }} style={{ display: 'grid', gap: 10, marginTop: 10 }}>
        <div className="row gap-8 wrap" role="group" aria-label={t('Post kind')}>{['post', 'question', 'win', ...(canLead ? ['announcement'] : [])].map(k => <button key={k} type="button" className={`btn btn-sm ${kind === k ? 'btn-gold' : 'btn-outline'}`} aria-pressed={kind === k} onClick={() => setKind(k)}>{t(KIND_LABEL[k])}</button>)}
          {tag && <span className="badge badge-neutral">{tag.levelCode}{tag.day ? ` · ${t('Day {n}', { n: tag.day })}` : ''} <button type="button" className="btn btn-text btn-sm" aria-label={t('Remove tag')} onClick={() => setTag(null)}>×</button></span>}</div>
        <div><label className="field-label" htmlFor="postBody"><Tr>Your post</Tr></label><textarea id="postBody" className="textarea" rows={3} value={body} onChange={e => setBody(e.target.value)} maxLength={2000} required placeholder={kind === 'question' ? t('What are you stuck on? Say what you tried and what you expected.') : t('A question, something that worked, or a win to celebrate…')} /></div>
        <div><button className="btn btn-gold btn-sm" type="submit" disabled={!body.trim()}><Tr>Post</Tr></button></div>
      </form>
    </section>

    {prompts.unanswered > 0 && tab !== 'unanswered' && <button type="button" className="feed-help" onClick={() => { setTab('unanswered'); void run(() => load('unanswered')); }}>
      <HelpCircle size={16} aria-hidden="true" /> {t('{n} classmate question(s) have no reply yet. Help one: an accepted answer earns 10 XP.', { n: prompts.unanswered })} →</button>}

    <div className="row gap-8 wrap" role="tablist" aria-label={t('Feed filters')}>{TABS.map(([k, l]) => <button key={k} type="button" role="tab" aria-selected={tab === k} className={`btn btn-sm ${tab === k ? 'btn-gold' : 'btn-outline'}`} onClick={() => { setTab(k); void run(() => load(k)); }}>{t(l)}</button>)}</div>

    {!items.length && <p className="muted small" style={{ textAlign: 'center' }}>{tab === 'unanswered' ? t('Every question has a reply. Nice work, everyone!') : t('Nothing here yet. Be the first to post.')}</p>}

    {items.map(p => <article key={p.id} className={`card card-pad ${p.pinned ? 'feed-pinned' : ''} ${p.focused ? 'feed-focus' : ''}`} aria-labelledby={`p-${p.id}`}>
      <div className="row between wrap gap-8"><b id={`p-${p.id}`}><Tv v={p.author} />{p.authorStaff && <span className="badge badge-neutral xs" style={{ marginLeft: 6 }}><Tr>Mentor</Tr></span>}{p.mine ? <span className="muted"> <Tr>(you)</Tr></span> : ''}</b>
        <span className="muted small">{p.pinned && <><Pin size={12} aria-hidden="true" /> <Tr>Pinned</Tr> · </>}{p.kind === 'announcement' && <Megaphone size={12} aria-hidden="true" />} {t(KIND_LABEL[p.kind] ?? 'Post')}{p.kind === 'question' && p.answered && <span className="wk-ok bold"> · <CheckCircle2 size={12} aria-hidden="true" /> <Tr>Answered</Tr></span>}{p.levelCode ? ` · ${p.levelCode}${p.day ? ` ${t('Day {n}', { n: p.day })}` : ''}` : ''} · {ist(p.createdAt)}{p.editedAt ? ` · ${t('edited')}` : ''}</span></div>
      {editing?.id === p.id && !editing.reply ? <form style={{ display: 'grid', gap: 8, marginTop: 8 }} onSubmit={e => { e.preventDefault(); void run(async () => { await api(`/api/v1/feed/${p.id}`, { method: 'PATCH', body: { body: editing.text } }); patch(p.id, { body: editing.text.trim(), editedAt: new Date().toISOString() }); setEditing(null); }, 'Saved.'); }}>
        <textarea className="textarea" rows={3} value={editing.text} maxLength={2000} onChange={e => setEditing({ ...editing, text: e.target.value })} aria-label={t('Edit your post')} />
        <div className="row gap-8"><button className="btn btn-gold btn-sm" type="submit"><Tr>Save</Tr></button><button className="btn btn-text btn-sm" type="button" onClick={() => setEditing(null)}><Tr>Cancel</Tr></button></div></form>
        : <p style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}><Tv v={p.body} /></p>}
      {p.linkUrl && <div style={{ marginTop: 8 }}><a href={p.linkUrl} target="_blank" rel="noopener noreferrer nofollow"><Tr>Open link ↗</Tr></a></div>}
      <div className="row wrap" style={{ gap: 8, marginTop: 10 }}>
        <button type="button" className="btn btn-outline btn-sm" aria-pressed={p.myReacts.includes('like')} onClick={() => react(p, 'like')}>👍 {p.likes}</button>
        <button type="button" className="btn btn-outline btn-sm" aria-pressed={p.myReacts.includes('celebrate')} onClick={() => react(p, 'celebrate')}>🎉 {p.celebrates}</button>
        <button type="button" className="btn btn-outline btn-sm" aria-expanded={!!open[p.id]} onClick={() => { const o = !open[p.id]; setOpen(x => ({ ...x, [p.id]: o })); if (o && !replies[p.id]) void run(() => loadReplies(p.id)); }}>{p.kind === 'question' ? t('Answers') : t('Replies')} ({p.comments})</button>
        {p.canEdit && <button type="button" className="btn btn-text btn-sm" onClick={() => setEditing({ id: p.id, text: p.body })}><Tr>Edit</Tr></button>}
        {p.canDelete && <button type="button" className="btn btn-text btn-sm" onClick={() => { if (confirmDelete(p.id)) void run(async () => { await api(`/api/v1/feed/${p.id}`, { method: 'DELETE' }); setItems(xs => xs.filter(x => x.id !== p.id)); }, 'Deleted.'); }}><Tr>Delete</Tr></button>}
        {p.canPin && <button type="button" className="btn btn-text btn-sm" onClick={() => run(async () => { await api(`/api/v1/feed/${p.id}/pin`, { body: { pinned: !p.pinned } }); patch(p.id, { pinned: !p.pinned }); }, p.pinned ? 'Unpinned.' : 'Pinned to the top.')}>{p.pinned ? t('Unpin') : t('Pin')}</button>}
        {!p.mine && <button type="button" className="btn btn-text btn-sm" onClick={() => setReporting({ id: p.id, type: 'post', postId: p.id, reason: '' })}><Tr>Report</Tr></button>}
      </div>
      {reporting?.postId === p.id && <ReportForm r={reporting} setR={setReporting} onSend={() => run(async () => { await api(`/api/v1/feed/${p.id}/report`, { body: { targetType: reporting.type, targetId: reporting.id, reason: reporting.reason } }); setReporting(null); }, 'Thanks. A moderator will review it.')} />}
      {open[p.id] && <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
        {(replies[p.id] || []).map(c => <div key={c.id} className={`set-row ${c.accepted ? 'feed-accepted' : ''}`}><div style={{ flex: 1 }}>
          <b><Tv v={c.author} />{c.authorStaff && <span className="badge badge-neutral xs" style={{ marginLeft: 6 }}><Tr>Mentor</Tr></span>}{c.mine ? <span className="muted"> <Tr>(you)</Tr></span> : ''}</b>{c.accepted && <span className="wk-ok bold small"> · <CheckCircle2 size={12} aria-hidden="true" /> <Tr>Accepted answer</Tr></span>}{c.editedAt && <span className="muted xs"> · <Tr>edited</Tr></span>}
          {editing?.id === c.id && editing.reply ? <form className="row gap-8" style={{ marginTop: 6 }} onSubmit={e => { e.preventDefault(); void run(async () => { await api(`/api/v1/feed/comments/${c.id}`, { method: 'PATCH', body: { body: editing.text } }); setEditing(null); await loadReplies(p.id); }, 'Saved.'); }}><input className="input" style={{ flex: 1 }} value={editing.text} maxLength={1000} onChange={e => setEditing({ ...editing, text: e.target.value })} aria-label={t('Edit your reply')} /><button className="btn btn-gold btn-sm" type="submit"><Tr>Save</Tr></button></form>
            : <p><Tv v={c.body} /></p>}
          <div className="row gap-8 wrap">
            {p.canAccept && !c.accepted && !c.mine && <button type="button" className="btn btn-outline btn-sm" onClick={() => run(async () => { await api(`/api/v1/feed/${p.id}/accept`, { body: { commentId: c.id } }); patch(p.id, { answered: true, acceptedCommentId: c.id }); await loadReplies(p.id); }, 'Marked as the answer. Thank you for closing the loop!')}><CheckCircle2 size={13} aria-hidden="true" /> <Tr>Accept answer</Tr></button>}
            {c.mine && <button type="button" className="btn btn-text btn-sm" onClick={() => setEditing({ id: c.id, text: c.body, reply: true })}><Tr>Edit</Tr></button>}
            {c.canDelete && <button type="button" className="btn btn-text btn-sm" onClick={() => { if (confirmDelete(c.id)) void run(async () => { await api(`/api/v1/feed/comments/${c.id}`, { method: 'DELETE' }); patch(p.id, { comments: Math.max(0, p.comments - 1), ...(c.accepted ? { answered: false, acceptedCommentId: null } : {}) }); await loadReplies(p.id); }, 'Deleted.'); }}><Tr>Delete</Tr></button>}
            {!c.mine && <button type="button" className="btn btn-text btn-sm" onClick={() => setReporting({ id: c.id, type: 'comment', postId: p.id, reason: '' })}><Tr>Report</Tr></button>}
          </div>
        </div></div>)}
        <form onSubmit={e => { e.preventDefault(); const v = draft[p.id] || ''; void run(async () => { await api(`/api/v1/feed/${p.id}/comments`, { body: { body: v } }); setDraft(d => ({ ...d, [p.id]: '' })); patch(p.id, { comments: p.comments + 1 }); await loadReplies(p.id); }); }} className="row gap-8">
          <label className="sr-only" htmlFor={`c-${p.id}`}><Tr>Write a reply</Tr></label>
          <input id={`c-${p.id}`} className="input" style={{ flex: 1 }} value={draft[p.id] || ''} onChange={e => setDraft(d => ({ ...d, [p.id]: e.target.value }))} placeholder={p.kind === 'question' ? t('Share how you would solve it…') : t('Write a reply…')} maxLength={1000} required />
          <button className="btn btn-outline btn-sm" type="submit"><Tr>Reply</Tr></button>
        </form>
      </div>}
    </article>)}
    {cursor && <div style={{ textAlign: 'center' }}><button type="button" className="btn btn-outline" onClick={() => run(() => load(tab, cursor))}><Tr>Load more</Tr></button></div>}
  </div>);

  /** In-page two-step delete: the first tap arms it, a second tap within 4 s confirms (no browser dialog). */
  function confirmDelete(id: string) {
    if (armed === id) { setArmed(null); return true; }
    setArmed(id); setMsg(t('Tap Delete again to confirm.')); setTimeout(() => setArmed(a => (a === id ? null : a)), 4000); return false;
  }
}

function ReportForm({ r, setR, onSend }: { r: { id: string; type: 'post' | 'comment'; postId: string; reason: string }; setR: (v: { id: string; type: 'post' | 'comment'; postId: string; reason: string } | null) => void; onSend: () => void }) {
  const t = useT();
  return (<form className="stack gap-8 feed-report" style={{ marginTop: 10 }} onSubmit={e => { e.preventDefault(); onSend(); }}>
    <label className="field-label" htmlFor={`rep-${r.id}`}>{r.type === 'post' ? t('What is wrong with this post?') : t('What is wrong with this reply?')}</label>
    <textarea id={`rep-${r.id}`} className="textarea" rows={2} minLength={10} maxLength={1000} required value={r.reason} onChange={e => setR({ ...r, reason: e.target.value })} placeholder={t('At least 10 characters, e.g. it shares someone’s phone number.')} />
    <div className="row gap-8"><button className="btn btn-gold btn-sm" type="submit" disabled={r.reason.trim().length < 10}><Tr>Send report</Tr></button><button className="btn btn-text btn-sm" type="button" onClick={() => setR(null)}><Tr>Cancel</Tr></button></div>
  </form>);
}
