'use client';
import { useState } from 'react';

const TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];
const MAX_MB = 5;

/** Profile photo: pick an image, upload it, and make it the avatar. The server checks type, size and scan status. */
export function AvatarUploader({ initialUrl }: { initialUrl: string | null }) {
  const [url, setUrl] = useState<string | null>(initialUrl);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    setMsg(null);
    if (!TYPES.includes(f.type)) return setMsg('Choose a PNG, JPEG, WebP or GIF image.');
    if (f.size > MAX_MB * 1024 * 1024) return setMsg(`Photos must be under ${MAX_MB} MB.`);
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', f);
      form.append('entityType', 'avatar');
      const up = await fetch('/api/v1/files', { method: 'POST', body: form });
      const upJson = await up.json();
      if (!up.ok) throw new Error(upJson?.error?.message || 'Upload failed.');
      const set = await fetch('/api/v1/me/avatar', { method: 'PUT', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ fileId: upJson.id }) });
      const setJson = await set.json();
      if (!set.ok) throw new Error(setJson?.error?.message || 'Could not save the photo.');
      setUrl(setJson.avatarUrl);
      setMsg('Profile photo saved.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  async function onRemove() {
    setBusy(true); setMsg(null);
    try {
      const r = await fetch('/api/v1/me/avatar', { method: 'DELETE' });
      if (!r.ok) throw new Error('Could not remove the photo.');
      setUrl(null); setMsg('Profile photo removed.');
    } catch (err) {
      setMsg(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="card card-pad stack gap-12" aria-labelledby="avT">
      <h2 className="h3" id="avT">Profile photo</h2>
      <div className="row gap-12" style={{ alignItems: 'center' }}>
        {url
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={url} alt="Your profile photo" width={80} height={80} style={{ borderRadius: '50%', objectFit: 'cover' }} />
          : <span className="avatar" aria-hidden="true" style={{ width: 80, height: 80, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>No photo</span>}
        <div className="stack gap-8">
          <label className="btn btn-outline btn-sm" style={{ cursor: busy ? 'wait' : 'pointer' }}>
            {busy ? 'Saving…' : url ? 'Change photo' : 'Upload photo'}
            <input type="file" accept={TYPES.join(',')} onChange={onPick} disabled={busy} style={{ display: 'none' }} aria-label="Choose a profile photo" />
          </label>
          {url && <button type="button" className="btn btn-ghost btn-sm" onClick={onRemove} disabled={busy}>Remove photo</button>}
          <p className="muted xs">PNG, JPEG, WebP or GIF, up to {MAX_MB} MB. Shown to people in your institution.</p>
        </div>
      </div>
      {msg && <p className="small" role="status">{msg}</p>}
    </section>
  );
}
