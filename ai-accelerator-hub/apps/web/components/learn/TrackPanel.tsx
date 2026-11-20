'use client';
/**
 * The learner's track on the journey page. During Module 1 the learner can change track (or accept a change made by
 * staff) and chooses whether to keep their Module 1 work or restart Module 1. After Module 1 the track is fixed.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api, ApiError } from '@/lib/client/api';

type Opt = { level: string; name: string; title: string; current: boolean };
export type TrackView = { level: string; levelName: string; title: string; changeable: boolean; options: Opt[]; pending: { id: string; level: string; name: string; title: string; reason: string | null; by: string } | null };

const ACK = 'I understand the Critical track rules: synthetic data only, never real disclosures; a person always decides and the system never contacts a child or family; children’s data is shown only to people who need it.';

function ModeChoice({ value, onChange, disabled }: { value: 'continue' | 'restart'; onChange: (m: 'continue' | 'restart') => void; disabled: boolean }) {
  return (
    <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="stack gap-8">
      <legend className="field-label">How do you want to continue?</legend>
      {([['continue', 'Keep my Module 1 work', 'Activities you finished in Module 1 stay done on the new track.'], ['restart', 'Restart Module 1 from Day 1', 'Start the new track fresh. Useful if the new problem is very different.']] as const).map(([m, label, hint]) => (
        <label key={m} className="small" style={{ display: 'flex', gap: 8, alignItems: 'flex-start', cursor: 'pointer' }}>
          <input type="radio" name="trackMode" value={m} checked={value === m} onChange={() => onChange(m)} disabled={disabled} style={{ marginTop: 3, flex: 'none' }} />
          <span><b>{label}</b><span className="text-2" style={{ display: 'block' }}>{hint}</span></span>
        </label>
      ))}
      <span className="small text-2">Your points are kept either way.</span>
    </fieldset>
  );
}

export function TrackPanel({ track }: { track: TrackView }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [level, setLevel] = useState('');
  const [mode, setMode] = useState<'continue' | 'restart'>('continue');
  const [ack, setAck] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const target = track.pending?.level ?? level;

  const go = async (url: string, body: Record<string, unknown>) => {
    setBusy(true); setMsg('');
    try { await api(url, { body }); setOpen(false); router.refresh(); }
    catch (e) { setMsg(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.'); }
    finally { setBusy(false); }
  };

  return (
    <section className="card card-pad" style={{ marginBottom: 24 }} aria-labelledby="trackTitle">
      <div style={{ display: 'flex', gap: 12, alignItems: 'baseline', flexWrap: 'wrap', justifyContent: 'space-between' }}>
        <div><span className="eyebrow">Your track</span><h2 className="h3" id="trackTitle" style={{ margin: '2px 0 0' }}>{track.levelName}: {track.title}</h2></div>
        {track.changeable && !track.pending && !open && <button type="button" className="btn btn-ghost btn-sm" onClick={() => setOpen(true)}>Change track</button>}
      </div>
      <p className="small text-2" style={{ margin: '6px 0 0' }}>
        {track.changeable ? 'You can change your track until you finish Module 1. After that it stays fixed until Day 45.' : 'You finished Module 1, so your track is fixed until Day 45.'}
      </p>

      {track.pending && (
        <div className="callout info" role="status" style={{ marginTop: 12, display: 'block' }}>
          <p style={{ margin: 0 }}><b>{track.pending.by} moved you to the {track.pending.name} track: {track.pending.title}.</b>{track.pending.reason ? ` Reason: ${track.pending.reason}` : ''}</p>
          <div className="stack gap-8" style={{ marginTop: 10 }}>
            <ModeChoice value={mode} onChange={setMode} disabled={busy} />
            {target === 'critical' && <label className="small" style={{ display: 'flex', gap: 8 }}><input type="checkbox" id="trackAck" checked={ack} onChange={e => setAck(e.target.checked)} disabled={busy} style={{ flex: 'none', marginTop: 3 }} /><span>{ACK}</span></label>}
            <div><button type="button" className="btn btn-gold btn-sm" disabled={busy} onClick={() => go(`/api/v1/me/track/${track.pending!.id}`, { mode, ack })}>{busy ? 'Moving…' : `Start the ${track.pending.name} track`}</button></div>
          </div>
        </div>
      )}

      {open && !track.pending && (
        <div className="stack gap-12" style={{ marginTop: 12 }}>
          <fieldset style={{ border: 0, padding: 0, margin: 0 }} className="stack gap-8">
            <legend className="field-label">Choose a track</legend>
            {track.options.filter(o => !o.current).map(o => (
              <label key={o.level} className="small" style={{ display: 'flex', gap: 8, alignItems: 'flex-start', cursor: 'pointer' }}>
                <input type="radio" name="newTrack" value={o.level} checked={level === o.level} onChange={() => { setLevel(o.level); setAck(false); }} disabled={busy} style={{ marginTop: 3, flex: 'none' }} />
                <span><b>{o.name}</b>: {o.title}</span>
              </label>
            ))}
          </fieldset>
          {level && <ModeChoice value={mode} onChange={setMode} disabled={busy} />}
          {level === 'critical' && <label className="small" style={{ display: 'flex', gap: 8 }}><input type="checkbox" id="trackAck" checked={ack} onChange={e => setAck(e.target.checked)} disabled={busy} style={{ flex: 'none', marginTop: 3 }} /><span>{ACK}</span></label>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="btn btn-gold btn-sm" disabled={busy || !level} onClick={() => go('/api/v1/me/track', { level, mode, ack })}>{busy ? 'Moving…' : 'Move to this track'}</button>
            <button type="button" className="btn btn-ghost btn-sm" disabled={busy} onClick={() => { setOpen(false); setLevel(''); }}>Cancel</button>
          </div>
        </div>
      )}
      {msg && <p className="field-err" role="alert" style={{ marginTop: 8 }}>{msg}</p>}
    </section>
  );
}
