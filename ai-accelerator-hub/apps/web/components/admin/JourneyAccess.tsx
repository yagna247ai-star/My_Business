'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, ApiError } from '@/lib/client/api';

type J = { id: string; slug: string; title: string; published: boolean; levels: number; activeMembers: number; isDefault: boolean };

/** Super Admin controls: which journeys are open, and which one new learners join. */
export function JourneyAccess({ journeys, canEdit }: { journeys: J[]; canEdit: boolean }) {
  const router = useRouter(); const [msg, setMsg] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState('');
  const act = async (id: string, body: object, ok: string) => {
    setErr(''); setMsg(''); setBusy(id);
    try { await api(`/api/v1/admin/journeys/${id}`, { method: 'PATCH', body }); setMsg(ok); router.refresh(); } catch (e) { setErr((e as ApiError).message); } finally { setBusy(''); }
  };
  return (
    <section className="card card-pad stack gap-12" aria-labelledby="ja">
      <h2 className="h3" id="ja">Journey access</h2>
      <p className="muted small">New learners are enrolled in the <b>default</b> journey. Only published journeys can be the default or be assigned to people. Move individual people between journeys in <a className="link" href="/settings/people">People</a>; their progress on other journeys is kept.{!canEdit && ' Only a Super Admin can change these settings.'}</p>
      {msg && <p className="callout ok small" role="status">{msg}</p>}{err && <p className="callout warn small" role="alert">{err}</p>}
      <div className="table-wrap"><table className="tbl"><caption className="sr-only">Journeys</caption>
        <thead><tr><th>Journey</th><th>Levels</th><th>Active learners</th><th>Status</th><th>New learners</th></tr></thead>
        <tbody>{journeys.map(j => <tr key={j.id}>
          <td><b>{j.title}</b><div className="muted xs">/{j.slug}</div></td>
          <td className="small">{j.levels}</td>
          <td className="small">{j.activeMembers}</td>
          <td>{canEdit
            ? <button className="btn btn-text btn-sm" type="button" disabled={busy === j.id || (j.isDefault && j.published)} title={j.isDefault && j.published ? 'Make another journey the default first' : undefined} onClick={() => act(j.id, { published: !j.published }, j.published ? `${j.title} unpublished.` : `${j.title} published.`)}>{j.published ? 'Published · Unpublish' : 'Unpublished · Publish'}</button>
            : <span className="small">{j.published ? 'Published' : 'Unpublished'}</span>}</td>
          <td>{j.isDefault
            ? <span className="badge badge-gold">Default</span>
            : canEdit && j.published ? <button className="btn btn-outline btn-sm" type="button" disabled={busy === j.id} onClick={() => act(j.id, { makeDefault: true }, `New learners will now join ${j.title}.`)}>Make default</button> : <span className="muted xs">—</span>}</td>
        </tr>)}</tbody>
      </table></div>
    </section>
  );
}
