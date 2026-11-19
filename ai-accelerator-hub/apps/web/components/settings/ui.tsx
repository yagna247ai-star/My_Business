'use client';
import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { Trash2, X } from 'lucide-react';
import { ApiError } from '@/lib/client/api';

/** Runs an API call, shows a success or error line, then refreshes the server data on the page. */
export function useRun() {
  const router = useRouter();
  const [msg, setMsg] = useState(''); const [err, setErr] = useState(''); const [fieldErrs, setFieldErrs] = useState<Record<string, string>>({}); const [busy, setBusy] = useState(false);
  const run = async (fn: () => Promise<unknown>, ok: string) => {
    setErr(''); setMsg(''); setFieldErrs({}); setBusy(true);
    try { await fn(); setMsg(ok); router.refresh(); return true; }
    catch (e) { const a = e as ApiError; setErr(a.message || 'Something went wrong.'); if (a.details && typeof a.details === 'object') setFieldErrs(a.details); return false; }
    finally { setBusy(false); }
  };
  const Status = () => (<>{msg && <p className="callout ok small" role="status">{msg}</p>}{err && <p className="callout warn small" role="alert">{err}</p>}</>);
  return { run, busy, msg, err, fieldErrs, setMsg, setErr, Status };
}

export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const id = useId(); const ref = useRef<HTMLDivElement>(null);
  // Callers pass a fresh onClose on every render (e.g. `() => setForm(null)`). Keep the latest in a ref so the
  // effect below runs once per opening: re-running it on each keystroke stole focus back to the first field.
  const closeRef = useRef(onClose);
  closeRef.current = onClose;
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('input,select,textarea,button')?.focus();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeRef.current(); };
    document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('keydown', onKey); prev?.focus?.(); };
  }, []);
  return (<div className="backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div ref={ref} className={`dialog${wide ? ' dialog-wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={id}>
      <div className="row between gap-12" style={{ marginBottom: 14 }}><h2 id={id}>{title}</h2><button type="button" className="btn btn-text btn-sm" aria-label="Close" onClick={onClose}><X size={16} /></button></div>
      {children}
    </div>
  </div>);
}

/** Two-step delete: first click asks, second click does it. No browser confirm() pop-up. */
export function ConfirmDelete({ label, confirmText, onConfirm, disabled }: { label: string; confirmText: string; onConfirm: () => void; disabled?: boolean }) {
  const [asking, setAsking] = useState(false);
  useEffect(() => { if (!asking) return; const t = setTimeout(() => setAsking(false), 6000); return () => clearTimeout(t); }, [asking]);
  return asking
    ? <span className="row gap-8"><button type="button" className="btn btn-danger btn-sm" disabled={disabled} onClick={() => { setAsking(false); onConfirm(); }}>{confirmText}</button><button type="button" className="btn btn-text btn-sm" onClick={() => setAsking(false)}>Cancel</button></span>
    : <button type="button" className="btn btn-danger-soft btn-sm" disabled={disabled} aria-label={label} title={label} onClick={() => setAsking(true)}><Trash2 size={14} /></button>;
}

export function Field({ label, error, hint, children, full }: { label: string; error?: string; hint?: string; children: ReactNode; full?: boolean }) {
  return (<label className={full ? 'full' : undefined} style={{ display: 'block' }}>
    <span className="field-label">{label}</span>{children}
    {error ? <span className="field-err" style={{ display: 'block' }}>{error}</span> : hint ? <span className="field-hint" style={{ display: 'block' }}>{hint}</span> : null}
  </label>);
}

export const fmtDate = (d: string | Date | null | undefined) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '—';
/** <input type="date"> value from an ISO string. */
export const dateInput = (d: string | Date | null | undefined) => d ? new Date(d).toISOString().slice(0, 10) : '';
