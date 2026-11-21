'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/client/api';
import { Tr } from '@/components/i18n/Tr';
import { useT } from '@/components/i18n/I18nProvider';
import { Tv } from '@/components/i18n/Tv';

type Item = { id: string; kind: string; body: string; levelCode: string | null; linkUrl: string | null; author: string; mine: boolean; createdAt: string | Date; comments: number; likes: number; celebrates: number; myReacts: string[] };

export function FeedPanels({ initial, nextCursor }: { initial: Item[]; nextCursor: string | null }) {
  const t = useT();
  const router = useRouter();
  const [err, setErr] = useState('');
  const [msg, setMsg] = useState('');
  const [items, setItems] = useState(initial);
  const [cursor, setCursor] = useState(nextCursor);
  const [kind, setKind] = useState('post');
  const [body, setBody] = useState('');
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const [comments, setComments] = useState<Record<string, { id: string; body: string; author: string; mine: boolean }[]>>({});
  const [draft, setDraft] = useState<Record<string, string>>({});
  const call = async (fn: () => Promise<unknown>, ok: string) => { setErr(''); setMsg(''); try { await fn(); setMsg(ok); router.refresh(); } catch (e) { setErr((e as ApiError).message); } };
  const refresh = async (c?: string | null) => {
    const d = await api<{ items: Item[]; nextCursor: string | null }>(`/api/v1/feed${c ? `?cursor=${encodeURIComponent(c)}` : ''}`);
    setItems(prev => c ? [...prev, ...d.items.filter(i => !prev.some(p => p.id === i.id))] : d.items);
    setCursor(d.nextCursor);
  };
  return (<div style={{ display: 'grid', gap: 18, marginTop: 18 }}>
    {err && <p className="callout warn small" role="alert"><Tv v={err} /></p>}
    {msg && <p className="callout ok small" role="status"><Tv v={msg} /></p>}
    <section className="card card-pad" aria-labelledby="new"><h2 className="h3" id="new"><Tr>Share with your cohort</Tr></h2>
      <form onSubmit={e => { e.preventDefault(); call(async () => { const r = await api<{ id: string }>('/api/v1/feed', { body: { kind, body } }); setBody(''); await refresh(); return r; }, 'Posted.'); }} style={{ display: 'grid', gap: 10, marginTop: 10 }}>
        <div style={{ display: 'flex', gap: 8 }} role="group" aria-label={t('Post kind')}>{['post', 'win', 'question'].map(k => <button key={k} type="button" className={`btn btn-sm ${kind === k ? 'btn-gold' : 'btn-outline'}`} aria-pressed={kind === k} onClick={() => setKind(k)}>{k}</button>)}</div>
        <div><label className="field-label" htmlFor="postBody"><Tr>Your post</Tr></label><textarea id="postBody" className="textarea" rows={3} value={body} onChange={e => setBody(e.target.value)} maxLength={2000} required placeholder={t('A question, something you figured out, or a win…')} /></div>
        <div><button className="btn btn-gold btn-sm" type="submit"><Tr>Post</Tr></button></div>
      </form>
    </section>
    {items.map(p => <article key={p.id} className="card card-pad" aria-labelledby={`p-${p.id}`}>
      <div className="row between"><b id={`p-${p.id}`}><Tv v={p.author} />{p.mine ? <Tr>(you)</Tr> : ''}</b><span className="muted small"><Tv v={p.kind} /> · {new Date(p.createdAt).toLocaleString('en-IN')}</span></div>
      <p style={{ whiteSpace: 'pre-wrap', marginTop: 8 }}><Tv v={p.body} /></p>
      {p.linkUrl && <div style={{ marginTop: 8 }}><a href={p.linkUrl} target="_blank" rel="noopener noreferrer nofollow"><Tr>Open link ↗</Tr></a></div>}
      <div className="row" style={{ gap: 8, marginTop: 10 }}>
        <button type="button" className="btn btn-outline btn-sm" aria-pressed={p.myReacts.includes('like')} onClick={() => call(async () => { const r = await api<{ reacted: boolean }>(`/api/v1/feed/${p.id}/react`, { body: { kind: 'like' } }); setItems(prev => prev.map(i => i.id === p.id ? { ...i, likes: i.likes + (r.reacted ? 1 : -1), myReacts: r.reacted ? [...i.myReacts, 'like'] : i.myReacts.filter(k => k !== 'like') } : i)); }, '')}>♡ <Tv v={p.likes} /></button>
        <button type="button" className="btn btn-outline btn-sm" aria-pressed={p.myReacts.includes('celebrate')} onClick={() => call(async () => { const r = await api<{ reacted: boolean }>(`/api/v1/feed/${p.id}/react`, { body: { kind: 'celebrate' } }); setItems(prev => prev.map(i => i.id === p.id ? { ...i, celebrates: i.celebrates + (r.reacted ? 1 : -1), myReacts: r.reacted ? [...i.myReacts, 'celebrate'] : i.myReacts.filter(k => k !== 'celebrate') } : i)); }, '')}>🎉 <Tv v={p.celebrates} /></button>
        <button type="button" className="btn btn-outline btn-sm" aria-expanded={!!open[p.id]} onClick={async () => { const willOpen = !open[p.id]; setOpen(o => ({ ...o, [p.id]: willOpen })); if (willOpen && !comments[p.id]) { const rows = await api(`/api/v1/feed/${p.id}/comments`); setComments(c => ({ ...c, [p.id]: rows as { id: string; body: string; author: string; mine: boolean }[] })); } }}>💬 {p.comments || comments[p.id]?.length || ''}</button>
        {!p.mine && <button type="button" className="btn btn-outline btn-sm" onClick={() => { const reason = window.prompt('What is wrong with this post? (at least 10 characters)'); if (reason) call(() => api(`/api/v1/feed/${p.id}/report`, { body: { targetType: 'post', targetId: p.id, reason } }), 'Reported. Moderators will review it.'); }}><Tr>Report</Tr></button>}
      </div>
      {open[p.id] && <div style={{ marginTop: 10, display: 'grid', gap: 8 }}>
        {(comments[p.id] || []).map(c => <div key={c.id} className="set-row"><div><b><Tv v={c.author} />{c.mine ? <Tr>(you)</Tr> : ''}</b><p><Tv v={c.body} /></p></div></div>)}
        <form onSubmit={e => { e.preventDefault(); const v = draft[p.id] || ''; call(async () => { await api(`/api/v1/feed/${p.id}/comments`, { body: { body: v } }); setDraft(d => ({ ...d, [p.id]: '' })); const rows = await api(`/api/v1/feed/${p.id}/comments`); setComments(c => ({ ...c, [p.id]: rows as { id: string; body: string; author: string; mine: boolean }[] })); }, 'Reply posted.'); }} style={{ display: 'flex', gap: 8 }}>
          <label className="sr-only" htmlFor={`c-${p.id}`}><Tr>Write a reply</Tr></label>
          <input id={`c-${p.id}`} className="input" style={{ flex: 1 }} value={draft[p.id] || ''} onChange={e => setDraft(d => ({ ...d, [p.id]: e.target.value }))} placeholder={t('Write a reply…')} maxLength={1000} required />
          <button className="btn btn-outline btn-sm" type="submit"><Tr>Reply</Tr></button>
        </form>
      </div>}
    </article>)}
    {cursor && <div style={{ textAlign: 'center' }}><button type="button" className="btn btn-outline" onClick={() => refresh(cursor)}><Tr>Load more</Tr></button></div>}
  </div>);
}
