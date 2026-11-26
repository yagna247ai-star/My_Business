'use client';
/** docs/INSTITUTION_SHARING_SPEC.md AC-8: where a course runs, and "Share with all institutions" (Super Admin). */
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Share2 } from 'lucide-react';
import { api, ApiError } from '@/lib/client/api';

type Result = { copied: string[]; skipped: { institution: string; reason: string }[]; already: number };
export function JourneyShare({ journeyId, places, total }: { journeyId: string; places: string[]; total: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false); const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const share = async () => {
    setBusy(true); setMsg(''); setErr('');
    try {
      const r = await api<Result>(`/api/v1/admin/journeys/${journeyId}/share`, { method: 'POST', timeoutMs: 120_000 });
      setMsg([r.copied.length ? `Copied to ${r.copied.join(', ')}.` : 'Every institution already runs it.', ...r.skipped.map(s => `${s.institution}: ${s.reason}`)].join(' '));
      router.refresh();
    } catch (e) { setErr((e as ApiError).message); } finally { setBusy(false); }
  };
  return (
    <span className="xs">
      <span className="muted"> · in {places.join(', ') || '—'}</span>
      {places.length < total && <button className="btn btn-text btn-sm" type="button" disabled={busy} onClick={share}><Share2 size={12} aria-hidden="true" /> {busy ? 'Sharing…' : 'Share with all institutions'}</button>}
      {msg && <span className="wk-ok" role="status"> {msg}</span>}{err && <span className="wk-warn" role="alert"> {err}</span>}
    </span>
  );
}
