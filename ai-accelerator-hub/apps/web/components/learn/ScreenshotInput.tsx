'use client';
/**
 * Screenshot proof input (docs/AGENT_LAB_PROOF_SCORING_SPEC.md §2): upload, paste (⌘V / Ctrl+V) or drag and drop.
 * Shows a preview and the server's validation (real image, dimensions) before anything is submitted.
 */
import { useEffect, useRef, useState } from 'react';
import { ClipboardPaste, ImageUp, CheckCircle2, AlertTriangle } from 'lucide-react';
import { MIN_W, MIN_H } from '@/lib/domain/proofScore';

export type Shot = { id: string; name: string; width: number | null; height: number | null; preview: string };
const ACCEPT = ['image/png', 'image/jpeg', 'image/webp'];

export function ScreenshotInput({ runId, value, onChange, error }: { runId: string; value: Shot | null; onChange: (s: Shot | null) => void; error?: string }) {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [over, setOver] = useState(false);
  const zone = useRef<HTMLDivElement>(null); const input = useRef<HTMLInputElement>(null);
  useEffect(() => () => { if (value?.preview) URL.revokeObjectURL(value.preview); }, [value?.preview]);

  const upload = async (f: File, how: string) => {
    setErr('');
    if (!ACCEPT.includes(f.type)) { setErr('Use a PNG, JPG or WebP image.'); return; }
    setBusy(true);
    try {
      const ext = f.type === 'image/png' ? 'png' : f.type === 'image/webp' ? 'webp' : 'jpg';
      const name = f.name && f.name !== 'image.png' ? f.name : `pasted-screenshot.${ext}`;
      const fd = new FormData(); fd.append('file', new File([f], name, { type: f.type })); fd.append('entityType', 'agent_lab'); fd.append('entityId', runId);
      const res = await fetch('/api/v1/files', { method: 'POST', body: fd, credentials: 'same-origin' });
      const d = await res.json();
      if (!res.ok) throw new Error(d?.error?.message || 'Upload failed.');
      onChange({ id: d.id, name: `${name} (${how})`, width: d.width ?? null, height: d.height ?? null, preview: URL.createObjectURL(f) });
    } catch (e) { setErr((e as Error).message); } finally { setBusy(false); }
  };
  const onPaste = (e: React.ClipboardEvent) => {
    const item = Array.from(e.clipboardData.items).find(i => i.kind === 'file' && i.type.startsWith('image/'));
    const f = item?.getAsFile();
    if (f) { e.preventDefault(); upload(f, 'pasted'); } else setErr('Nothing to paste — copy a screenshot to the clipboard first (see the tip below).');
  };
  const small = !!value?.width && !!value?.height && (value.width < MIN_W || value.height < MIN_H);
  const mac = typeof navigator !== 'undefined' && /Mac/i.test(navigator.platform || navigator.userAgent);

  return (<div className="stack gap-8">
    <div ref={zone} tabIndex={0} role="button" aria-label={`Screenshot drop zone. Paste with ${mac ? 'Command' : 'Control'} V, drop an image, or press Enter to choose a file.`}
      className={`shot-zone${over ? ' over' : ''}${value ? ' has' : ''}`}
      onPaste={onPaste} onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); input.current?.click(); } }}
      onDragOver={e => { e.preventDefault(); setOver(true); }} onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files?.[0]; if (f) upload(f, 'dropped'); }}
      onClick={() => zone.current?.focus()}>
      {value ? <img src={value.preview} alt="Your screenshot preview" className="shot-preview" /> : <div className="stack gap-6" style={{ alignItems: 'center', textAlign: 'center' }}>
        <ClipboardPaste size={22} aria-hidden="true" />
        <b className="small">Click here, then paste your screenshot (<kbd className="key">{mac ? '⌘' : 'Ctrl'}</kbd> + <kbd className="key">V</kbd>)</b>
        <span className="muted xs">or drag an image here, or use the button below</span></div>}
      {busy && <span className="shot-busy" role="status">Checking your screenshot…</span>}
    </div>
    <div className="row gap-8 wrap" style={{ alignItems: 'center' }}>
      <button type="button" className="btn btn-outline btn-sm" onClick={() => input.current?.click()} disabled={busy}><ImageUp size={14} />{value ? 'Replace with a file' : 'Choose a file'}</button>
      <input ref={input} type="file" accept={ACCEPT.join(',')} hidden onChange={e => { const f = e.target.files?.[0]; if (f) upload(f, 'uploaded'); e.target.value = ''; }} />
      {value && <span className="small row gap-6" style={{ alignItems: 'center' }}>{small ? <AlertTriangle size={14} aria-hidden="true" style={{ color: 'var(--danger)' }} /> : <CheckCircle2 size={14} aria-hidden="true" style={{ color: 'var(--success)' }} />}
        {value.name}{value.width ? ` · ${value.width}×${value.height}` : ''}{small ? ` — smaller than ${MIN_W}×${MIN_H}; capture the whole window for full points` : value.width ? ' — real image, readable size' : ''}</span>}
    </div>
    <p className="muted xs" style={{ margin: 0 }}><b>Tip:</b> {mac ? 'Press Control + Shift + Command + 4 and select an area — adding Control copies it to the clipboard instead of saving a file. Then paste it here.' : 'Press Windows + Shift + S and select the area; in the Snipping Tool window press Ctrl + C to copy it, then paste it here.'} Crop out API keys, emails and other people’s data first.</p>
    {(err || error) && <p className="field-err" role="alert">{err || error}</p>}
  </div>);
}
