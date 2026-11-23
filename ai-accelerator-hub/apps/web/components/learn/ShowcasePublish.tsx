'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, ApiError } from '@/lib/client/api';
import { Tr } from '@/components/i18n/Tr';
import { Tv } from '@/components/i18n/Tv';

export function ShowcasePublish({ items }: { items: { submissionId: string; level: string; published: boolean }[] }) {
  const router = useRouter(); const open = items.filter(i => !i.published);
  const [sel, setSel] = useState(open[0]?.submissionId || ''); const [title, setTitle] = useState(''); const [desc, setDesc] = useState('');
  const [err, setErr] = useState(''); const [fe, setFe] = useState<Record<string, string>>({}); const [busy, setBusy] = useState(false);
  if (!open.length) return null;
  const go = async () => { setBusy(true); setErr(''); setFe({}); try { await api('/api/v1/showcase', { body: { submissionId: sel, title, description: desc } }); setTitle(''); setDesc(''); router.refresh(); } catch (e) { const a = e as ApiError; setErr(a.message); if (a.details) setFe(a.details); } finally { setBusy(false); } };
  return (
    <section className="card card-pad stack gap-12" aria-labelledby="pubT" style={{ marginBottom: 20 }}>
      <h2 className="h3" id="pubT"><Tr>Publish your approved work</Tr></h2>
      <p className="muted small"><Tr>Optional. Only people in your institution can see the showcase, and you can remove your project any time. Your project link must open for everyone (“Anyone with the link can view”), or others will see “Request access”.</Tr></p>
      <div><label className="field-label" htmlFor="pubSub"><Tr>Approved submission</Tr></label><select className="select" id="pubSub" value={sel} onChange={e => setSel(e.target.value)}>{open.map(o => <option key={o.submissionId} value={o.submissionId}>{o.level}</option>)}</select>{fe.submissionId && <div className="field-err" role="alert"><Tv v={fe.submissionId} /></div>}</div>
      <div><label className="field-label" htmlFor="pubT2"><Tr>Project title</Tr></label><input className="input" id="pubT2" value={title} onChange={e => setTitle(e.target.value)} aria-invalid={!!fe.title} />{fe.title && <div className="field-err"><Tv v={fe.title} /></div>}</div>
      <div><label className="field-label" htmlFor="pubD"><Tr>What it does and who it helps</Tr></label><textarea className="textarea" id="pubD" rows={3} value={desc} onChange={e => setDesc(e.target.value)} aria-invalid={!!fe.description} />{fe.description ? <div className="field-err"><Tv v={fe.description} /></div> : <div className="field-hint">{desc.trim().length}<Tr>/30–600 characters</Tr></div>}</div>
      {err && !Object.keys(fe).length && <p className="field-err" role="alert"><Tv v={err} /></p>}
      <div><button className="btn btn-gold" type="button" disabled={busy || !sel} onClick={go}><Tr>Publish to showcase</Tr></button></div>
    </section>
  );
}
