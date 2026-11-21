'use client';
/**
 * Screenshot proof input (docs/AGENT_LAB_PROOF_SCORING_SPEC.md §2): choose a file, paste (⌘V / Ctrl+V) or drag and drop.
 * Shows a preview and the server's validation (real image, dimensions) before anything is submitted.
 *
 * Robustness rules (each was a real "Choose a file does nothing" report):
 *  - Clicking the drop zone opens the file picker (people expect that); paste works anywhere in this section.
 *  - The picker accepts any image. Formats the server does not take (HEIC, GIF, BMP…) and very large
 *    Retina screenshots are re-encoded in the browser, so they are never silently rejected.
 *  - Every failure (network, timeout, non-JSON error page, server rule) shows a readable message.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { ClipboardPaste, ImageUp, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { MIN_W, MIN_H } from '@/lib/domain/proofScore';
import { Tr } from '@/components/i18n/Tr';
import { useT } from '@/components/i18n/I18nProvider';
import { Tv } from '@/components/i18n/Tv';

export type Shot = { id: string; name: string; width: number | null; height: number | null; preview: string };
const SERVER_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
const SEND_AS_IS_MAX = 6 * 1024 * 1024;   // larger files are re-encoded (server cap is 10 MB)
const MAX_SIDE = 3200;                     // longest side after re-encoding — still sharp, well above MIN_W×MIN_H
const IMAGE_EXT = /\.(png|jpe?g|webp|gif|bmp|heic|heif|tiff?|avif)$/i;

const extFor = (type: string) => (type === 'image/png' ? 'png' : type === 'image/webp' ? 'webp' : 'jpg');
const baseName = (n: string) => (n || 'screenshot').replace(/\.[^.]+$/, '') || 'screenshot';

/** Decode with the browser and re-encode as WebP (or JPEG where WebP encoding is unavailable). */
async function reencode(f: File): Promise<File> {
  let src: CanvasImageSource & { width: number; height: number };
  try { src = await createImageBitmap(f); }
  catch {
    const url = URL.createObjectURL(f);
    try {
      src = await new Promise<HTMLImageElement>((ok, bad) => { const i = new Image(); i.onload = () => ok(i); i.onerror = () => bad(new Error('decode')); i.src = url; });
    } catch {
      throw new Error(/\.hei[cf]$/i.test(f.name)
        ? 'This browser cannot open HEIC photos. Take a screenshot instead (it saves as PNG), or export the photo as JPG.'
        : 'This image could not be opened. Save it as PNG or JPG and try again.');
    } finally { URL.revokeObjectURL(url); }
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(src.width, src.height));
  const c = document.createElement('canvas');
  c.width = Math.round(src.width * scale); c.height = Math.round(src.height * scale);
  const g = c.getContext('2d');
  if (!g) throw new Error('Your browser could not prepare this image. Save it as PNG or JPG and try again.');
  g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height); // transparent areas → white, not black, in JPEG
  g.drawImage(src, 0, 0, c.width, c.height);
  if ('close' in src && typeof src.close === 'function') src.close();
  const toBlob = (type: string, q: number) => new Promise<Blob | null>(r => c.toBlob(r, type, q));
  let blob = await toBlob('image/webp', 0.9);
  if (!blob || blob.type !== 'image/webp') blob = await toBlob('image/jpeg', 0.9); // Safari < 14 cannot encode WebP
  if (!blob) throw new Error('Your browser could not prepare this image. Save it as PNG or JPG and try again.');
  return new File([blob], `${baseName(f.name)}.${extFor(blob.type)}`, { type: blob.type });
}

async function prepare(f: File): Promise<File> {
  const looksImage = f.type.startsWith('image/') || IMAGE_EXT.test(f.name);
  if (!looksImage) throw new Error('That file is not an image. Choose a PNG or JPG screenshot.');
  if (SERVER_TYPES.includes(f.type) && f.size <= SEND_AS_IS_MAX) {
    // Pasted screenshots arrive as "image.png"; give them a clearer name. Keep the extension consistent with the type.
    const name = f.name && f.name !== 'image.png' ? `${baseName(f.name)}.${extFor(f.type)}` : `pasted-screenshot.${extFor(f.type)}`;
    return new File([f], name, { type: f.type });
  }
  return reencode(f);
}

export function ScreenshotInput({ runId, value, onChange, error }: { runId: string; value: Shot | null; onChange: (s: Shot | null) => void; error?: string }) {
  const t = useT();
  const [busy, setBusy] = useState(''); const [err, setErr] = useState(''); const [over, setOver] = useState(false);
  const wrap = useRef<HTMLDivElement>(null); const input = useRef<HTMLInputElement>(null);
  useEffect(() => () => { if (value?.preview?.startsWith('blob:')) URL.revokeObjectURL(value.preview); }, [value?.preview]);

  const upload = useCallback(async (raw: File, how: string) => {
    if (busy) return;
    setErr(''); setBusy('Preparing your screenshot…');
    try {
      const f = await prepare(raw);
      setBusy('Uploading and checking…');
      const fd = new FormData(); fd.append('file', f); fd.append('entityType', 'agent_lab'); fd.append('entityId', runId);
      const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 60_000);
      let res: Response;
      try { res = await fetch('/api/v1/files', { method: 'POST', body: fd, credentials: 'same-origin', signal: ctrl.signal }); }
      catch { throw new Error(ctrl.signal.aborted ? 'The upload took too long. Check your connection and try again.' : 'Could not reach the server. Check your connection and try again.'); }
      finally { clearTimeout(t); }
      const text = await res.text(); let d: { id?: string; width?: number; height?: number; error?: { message?: string } } = {};
      try { d = text ? JSON.parse(text) : {}; } catch { /* HTML error page */ }
      if (!res.ok || !d.id) {
        throw new Error(d.error?.message
          || (res.status === 401 ? 'Your session has ended. Sign in again, then add the screenshot.'
          : res.status === 413 ? 'That image is too large. Capture a smaller area and try again.'
          : 'The upload failed. Please try again in a moment.'));
      }
      onChange({ id: d.id, name: `${f.name} (${how})`, width: d.width ?? null, height: d.height ?? null, preview: URL.createObjectURL(f) });
    } catch (e) { setErr((e as Error).message || 'The upload failed. Please try again.'); }
    finally { setBusy(''); }
  }, [busy, onChange, runId]);

  // Paste anywhere on the page — no need to click the box first. Text fields keep their normal paste.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (!wrap.current || (t && (t.isContentEditable || /^(INPUT|TEXTAREA)$/.test(t.tagName)))) return;
      const item = Array.from(e.clipboardData?.items || []).find(i => i.kind === 'file' && i.type.startsWith('image/'));
      const f = item?.getAsFile();
      if (f) { e.preventDefault(); upload(f, 'pasted'); }
      else if (wrap.current.contains(document.activeElement)) setErr('Nothing to paste — copy a screenshot to the clipboard first (see the tip below).');
    };
    document.addEventListener('paste', onPaste);
    return () => document.removeEventListener('paste', onPaste);
  }, [upload]);

  const pick = () => { if (!busy) input.current?.click(); };
  const small = !!value?.width && !!value?.height && (value.width < MIN_W || value.height < MIN_H);
  // Detect the OS after mount: reading navigator during render made the server ("Ctrl") and a Mac browser ("⌘")
  // disagree, which is a hydration error that makes React throw away and rebuild this whole step.
  const [mac, setMac] = useState(false);
  useEffect(() => { setMac(/Mac|iPhone|iPad/i.test(navigator.userAgent)); }, []);

  return (<div className="stack gap-8" ref={wrap}>
    <div tabIndex={0} role="button" aria-busy={!!busy}
      aria-label={`Add a screenshot. Press Enter to choose a file, paste with ${mac ? 'Command' : 'Control'} V, or drop an image here.`}
      className={`shot-zone${over ? ' over' : ''}${value ? ' has' : ''}`}
      onClick={pick}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } }}
      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setOver(true); }} onDragLeave={() => setOver(false)}
      onDrop={e => { e.preventDefault(); setOver(false); const f = e.dataTransfer.files?.[0]; if (f) upload(f, 'dropped'); }}>
      {value ? <img src={value.preview} alt={t('Your screenshot preview')} className="shot-preview" /> : <div className="stack gap-6" style={{ alignItems: 'center', textAlign: 'center' }}>
        <ImageUp size={22} aria-hidden="true" />
        <b className="small"><Tr>Click to choose a screenshot</Tr></b>
        <span className="muted xs"><Tr>or paste it (</Tr><kbd className="key">{mac ? '⌘' : 'Ctrl'}</kbd> + <kbd className="key">V</kbd><Tr>), or drag an image here</Tr></span></div>}
      {busy && <span className="shot-busy" role="status"><Tv v={busy} /></span>}
    </div>
    <div className="row gap-8 wrap" style={{ alignItems: 'center' }}>
      <button type="button" className="btn btn-outline btn-sm" onClick={pick} disabled={!!busy}><ImageUp size={14} aria-hidden="true" />{value ? <Tr>Replace screenshot</Tr> : <Tr>Choose a file</Tr>}</button>
      <span className="muted xs row gap-4" style={{ alignItems: 'center' }}><ClipboardPaste size={13} aria-hidden="true" /><Tr>Paste works too</Tr></span>
      {value && !busy && <button type="button" className="btn btn-text btn-sm" onClick={() => { onChange(null); setErr(''); }}><X size={14} aria-hidden="true" /><Tr>Remove</Tr></button>}
      {/* Visually hidden but still in the layout — some browsers ignore .click() on display:none inputs. */}
      <input ref={input} type="file" accept="image/*,.heic,.heif" className="sr-only" tabIndex={-1} aria-hidden="true"
        onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) upload(f, 'uploaded'); }} />
    </div>
    {value && <p className="small row gap-6" style={{ alignItems: 'center', margin: 0 }}>{small ? <AlertTriangle size={14} aria-hidden="true" style={{ color: 'var(--danger)' }} /> : <CheckCircle2 size={14} aria-hidden="true" style={{ color: 'var(--success)' }} />}
      <span>{value.name}{value.width ? ` · ${value.width}×${value.height}` : ''}{small ? ` — smaller than ${MIN_W}×${MIN_H}; capture the whole window for full points` : value.width ? <Tr>— real image, readable size</Tr> : ''}</span></p>}
    <p className="muted xs" style={{ margin: 0 }}><b><Tr>Tip:</Tr></b> {mac ? <Tr>Press Control + Shift + Command + 4 and select an area — adding Control copies it to the clipboard instead of saving a file. Then paste it here.</Tr> : <Tr>Press Windows + Shift + S and select the area; in the Snipping Tool window press Ctrl + C to copy it, then paste it here.</Tr>} <Tr>Crop out API keys, emails and other people’s data first.</Tr></p>
    {(err || error) && <p className="field-err" role="alert" style={{ margin: 0 }}>{err || error}</p>}
  </div>);
}
