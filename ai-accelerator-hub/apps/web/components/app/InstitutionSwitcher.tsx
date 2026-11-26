'use client';
/** Header institution switcher (docs/INSTITUTIONS_SPEC.md): Super Admin → any institution; others → their memberships. */
import { useEffect, useRef, useState } from 'react';
import { Building2, Check, ChevronDown } from 'lucide-react';
import { api } from '@/lib/client/api';
import { useT } from '@/components/i18n/I18nProvider';

type Inst = { id: string; name: string; code: string | null; logoUrl: string | null; current: boolean };

export function InstitutionSwitcher({ name, logoUrl, canSwitch }: { name: string; logoUrl: string | null; canSwitch: boolean }) {
  const t = useT();
  const [open, setOpen] = useState(false); const [list, setList] = useState<Inst[] | null>(null); const [q, setQ] = useState(''); const [busy, setBusy] = useState(''); const [err, setErr] = useState('');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { const f = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); }; document.addEventListener('mousedown', f); return () => document.removeEventListener('mousedown', f); }, []);
  const logo = (url: string | null, n: string, size = 22) => url ? <img src={url} alt="" width={size} height={size} style={{ width: size, height: size, borderRadius: 6, objectFit: 'cover' }} /> : <span aria-hidden="true" style={{ width: size, height: size, borderRadius: 6, display: 'inline-grid', placeItems: 'center', background: 'var(--surface-3)', fontSize: 11, fontWeight: 800 }}>{n.slice(0, 2).toUpperCase()}</span>;
  const label = <span className="row gap-6" style={{ alignItems: 'center', maxWidth: 220 }}>{logo(logoUrl, name)}<span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 700, fontSize: 13.5 }}>{name}</span></span>;
  if (!canSwitch) return <span className="pill" title={name}>{label}</span>;
  const toggle = async () => { const n = !open; setOpen(n); if (n && !list) { try { setList((await api<{ institutions: Inst[] }>('/api/v1/me/tenants')).institutions); } catch (e) { setErr((e as Error).message); } } };
  const pick = async (id: string) => { setBusy(id); setErr(''); try { await api('/api/v1/me/tenant', { method: 'POST', body: { tenantId: id } }); window.location.assign('/dashboard'); } catch (e) { setErr((e as Error).message); setBusy(''); } };
  const shown = (list ?? []).filter(i => !q || `${i.name} ${i.code ?? ''}`.toLowerCase().includes(q.toLowerCase()));
  return (
    <div className="user-wrap" ref={ref}>
      <button type="button" className="pill" aria-haspopup="listbox" aria-expanded={open} onClick={toggle} title={t('Switch institution')}>{label}<ChevronDown size={14} aria-hidden="true" /></button>
      {open && <div className="menu" role="dialog" aria-label={t('Switch institution')} style={{ minWidth: 280, maxHeight: 420, overflow: 'auto' }}>
        <div style={{ padding: 8 }}><input className="input" type="search" autoFocus placeholder={t('Search institutions…')} aria-label={t('Search institutions')} value={q} onChange={e => setQ(e.target.value)} /></div>
        {err && <p className="callout warn small" role="alert" style={{ margin: 8 }}>{err}</p>}
        {!list ? <p className="muted small" style={{ padding: 10 }}>{t('Loading…')}</p> : <ul role="listbox" aria-label={t('Institutions')} style={{ listStyle: 'none', margin: 0, padding: 4 }}>
          {shown.map(i => <li key={i.id}><button type="button" role="option" aria-selected={i.current} disabled={!!busy || i.current} onClick={() => pick(i.id)} className="btn btn-text btn-block btn-sm" style={{ justifyContent: 'flex-start', gap: 8, height: 'auto', padding: '8px 10px' }}>
            {logo(i.logoUrl, i.name, 26)}<span style={{ textAlign: 'left', flex: 1, minWidth: 0 }}><b style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>{i.name}</b>{i.code && <span className="muted xs">{i.code}</span>}</span>
            {i.current ? <Check size={15} aria-label={t('Current')} /> : busy === i.id ? <span className="xs">…</span> : null}
          </button></li>)}
          {!shown.length && <li className="muted small" style={{ padding: 10 }}><Building2 size={14} aria-hidden="true" /> {t('No institutions match.')}</li>}
        </ul>}
      </div>}
    </div>
  );
}
