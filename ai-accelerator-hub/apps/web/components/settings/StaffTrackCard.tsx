'use client';
/** Staff view of a learner's track, with "Move to another track" (allowed roles only, and only until Module 1 is complete). */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/client/api';
import type { TrackView } from '@/components/learn/TrackPanel';

export function StaffTrackCard({ userId, name, track }: { userId: string; name: string; track: TrackView & { canChange: boolean } }) {
  const router = useRouter();
  const [level, setLevel] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const submit = async () => {
    setBusy(true); setMsg(null);
    try {
      await api(`/api/v1/settings/people/${userId}/track`, { body: { level, reason } });
      setMsg({ ok: true, text: `${name} has been asked to start the new track. They choose whether to keep their Module 1 work or restart Module 1; their points are kept.` });
      setLevel(''); setReason(''); router.refresh();
    } catch (e) { setMsg({ ok: false, text: e instanceof ApiError ? e.message : 'Something went wrong. Please try again.' }); }
    finally { setBusy(false); }
  };

  return (
    <section className="card card-pad" style={{ marginTop: 16 }} aria-labelledby="trackCardTitle">
      <h2 className="h3" id="trackCardTitle">Learning track</h2>
      <p style={{ margin: '4px 0 0' }}><b>{track.levelName}</b>: {track.title}</p>
      {track.pending && <p className="small callout info" style={{ marginTop: 8 }}>Waiting for {name} to start the {track.pending.name} track (requested by {track.pending.by}).</p>}
      {!track.changeable && <p className="small text-2" style={{ marginTop: 8 }}>{name} has finished Module 1, so the track is fixed until Day 45.</p>}
      {track.changeable && !track.canChange && <p className="small text-2" style={{ marginTop: 8 }}>Your role cannot change tracks. An admin or program manager can allow it in Settings → Learning tracks.</p>}
      {track.changeable && track.canChange && (
        <div className="stack gap-8" style={{ marginTop: 12 }}>
          <label className="field-label" htmlFor="staffTrack">Move to another track</label>
          <select id="staffTrack" className="select" value={level} onChange={e => setLevel(e.target.value)} disabled={busy}>
            <option value="">Choose a track…</option>
            {track.options.filter(o => !o.current).map(o => <option key={o.level} value={o.level}>{o.name}: {o.title}</option>)}
          </select>
          <label className="field-label" htmlFor="staffTrackReason">Reason (shown to the learner)</label>
          <textarea id="staffTrackReason" className="input" rows={2} maxLength={500} value={reason} onChange={e => setReason(e.target.value)} disabled={busy} placeholder="For example: your SQL work in Module 1 shows you are ready for the Hard track." />
          <div><button type="button" className="btn btn-gold btn-sm" disabled={busy || !level} onClick={submit}>{busy ? 'Saving…' : 'Move learner'}</button></div>
          <span className="small text-2">Allowed only until the learner finishes Module 1. The learner chooses whether to keep their Module 1 work or restart Module 1, and their points are always kept.</span>
        </div>
      )}
      {msg && <p className={msg.ok ? 'small callout success' : 'field-err'} role={msg.ok ? 'status' : 'alert'} style={{ marginTop: 8 }}>{msg.text}</p>}
    </section>
  );
}
