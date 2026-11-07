'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, ApiError } from '@/lib/client/api';

export function StreakRecovery({ q, options }: { q: string; options: string[] }) {
  const router = useRouter(); const [choice, setChoice] = useState<number | null>(null); const [msg, setMsg] = useState(''); const [busy, setBusy] = useState(false);
  const go = async () => { if (choice === null) return; setBusy(true); setMsg(''); try { await api('/api/v1/streak/recover', { body: { answer: choice } }); router.refresh(); } catch (e) { setMsg((e as ApiError).message); } finally { setBusy(false); } };
  return (
    <fieldset className="q" style={{ border: 0 }}>
      <legend>{q}</legend>
      {options.map((o, i) => <label key={i} className="opt"><input type="radio" name="rq" checked={choice === i} onChange={() => setChoice(i)} />{o}</label>)}
      {msg && <p className="q-feedback no" role="alert">{msg}</p>}
      <button className="btn btn-gold btn-sm" style={{ marginTop: 12 }} type="button" disabled={choice === null || busy} onClick={go}>Recover my streak</button>
    </fieldset>
  );
}
