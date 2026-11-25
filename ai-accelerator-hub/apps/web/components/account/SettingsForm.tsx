'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { rememberLocale, useT } from '@/components/i18n/I18nProvider';
import { isLocale } from '@/lib/i18n/core';
import { Download } from 'lucide-react';
import { api, ApiError } from '@/lib/client/api';
import { Tr } from '@/components/i18n/Tr';
import { Tv } from '@/components/i18n/Tv';
import { AreaPicker } from '@/components/settings/AreaPicker';
import { DEFAULT_AREA } from '@/lib/domain/areas';

type S = { leaderboardVisibility: string; globalOptIn: boolean; quietHours: boolean; ageBand: string; guardianConsent: string; deletionRequestedAt: string | null };
export function SettingsForm({ initial, language, area: initialArea = DEFAULT_AREA }: { initial: S; language: string; area?: string }) {
  const router = useRouter(); const t = useT();
  const [s, setS] = useState(initial); const [lang, setLang] = useState(language); const [area, setArea] = useState(initialArea); const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const save = async (patch: Partial<S> & { preferredLanguage?: string; area?: string }) => { setMsg(''); setErr(''); try { const r = await api<S>('/api/v1/settings', { method: 'PATCH', body: patch }); setS({ ...s, ...r }); setMsg(t('Saved.')); } catch (e) { setErr((e as ApiError).message); } };
  const del = async () => { if (!confirmDel) { setConfirmDel(true); return; } try { const r = await api<{ note: string }>('/api/v1/settings/delete', { body: {} }); setMsg(r.note); setS({ ...s, deletionRequestedAt: new Date().toISOString() }); } catch (e) { setErr((e as ApiError).message); } };
  const [confirmDel, setConfirmDel] = useState(false);
  const sw = (on: boolean, label: string, onClick: () => void, disabled = false) => <button className="switch" type="button" role="switch" aria-checked={on} aria-label={label} onClick={onClick} disabled={disabled} />;
  const minor = s.ageBand === 'minor';
  return (<div className="stack gap-20">
    {msg && <p className="callout ok small" role="status"><Tv v={msg} /></p>}{err && <p className="callout warn small" role="alert"><Tv v={err} /></p>}
    <section className="card card-pad" aria-labelledby="pv"><h2 className="h3" id="pv"><Tr>Privacy</Tr></h2>
      {minor && <p className="callout info small" style={{ marginTop: 10 }}><Tr>Because you are under 18, privacy is on by default</Tr>{s.guardianConsent !== 'granted' ? <Tr>and some settings need your guardian’s approval</Tr> : ''}.</p>}
      <div className="set-row"><div><b><Tr>Show my name in standings</Tr></b><p><Tr>Off shows you as “Anonymous learner”. Your XP still counts.</Tr></p></div>{sw(s.leaderboardVisibility !== 'private', 'Show my name in standings', () => save({ leaderboardVisibility: s.leaderboardVisibility === 'private' ? 'cohort' : 'private' }))}</div>
      <div className="set-row"><div><b><Tr>Share progress beyond my institution</Tr></b><p><Tr>Explicit consent for cross-institution visibility. Withdraw any time.</Tr></p></div>{sw(s.globalOptIn, 'Share progress beyond my institution', () => save({ globalOptIn: !s.globalOptIn }))}</div>
      <div className="set-row"><div><b><Tr>Quiet hours</Tr></b><p><Tr>No reminders between 10 pm and 8 am IST.</Tr></p></div>{sw(s.quietHours, 'Quiet hours', () => save({ quietHours: !s.quietHours }))}</div>
      <div className="set-row"><div><b><Tr>My area</Tr></b><p><Tr>Pick your district or city. Used for area crowns and City / State ranks.</Tr></p></div><form style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }} onSubmit={e => { e.preventDefault(); save({ area }); }}><AreaPicker value={area} onChange={setArea} /><button className="btn btn-soft btn-sm" type="submit"><Tr>Save area</Tr></button></form></div>
      <div className="set-row"><div><b>{t('Language')}</b><p>{t('Your progress never changes when you switch.')}</p></div><select className="select" style={{ width: 'auto' }} value={lang} aria-label={t('Language')} onChange={async e => { const v = e.target.value; setLang(v); await save({ preferredLanguage: v }); if (isLocale(v)) rememberLocale(v); router.refresh(); }}>{[['en', 'English'], ['hi', 'हिन्दी'], ['te', 'తెలుగు'], ['ta', 'தமிழ்'], ['kn', 'ಕನ್ನಡ'], ['ml', 'മലയാളം']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
    </section>
    <section className="card card-pad" aria-labelledby="dt"><h2 className="h3" id="dt"><Tr>Your data</Tr></h2>
      <div className="set-row"><div><b><Tr>Download my data</Tr></b><p><Tr>Everything we hold about you in this institution, as JSON.</Tr></p></div><a className="btn btn-outline btn-sm" href="/api/v1/settings/export"><Download size={14} /><Tr>Download</Tr></a></div>
      <div className="set-row"><div><b><Tr>Delete my account</Tr></b><p>{s.deletionRequestedAt ? `Requested on ${new Date(s.deletionRequestedAt).toLocaleDateString('en-IN')}. Your institution reviews it within 30 days.` : <Tr>Starts a deletion request. Issued certificates stay verifiable.</Tr>}</p></div>{!s.deletionRequestedAt && <button className="btn btn-outline btn-sm" type="button" onClick={del} style={{ color: 'var(--danger)' }}>{confirmDel ? <Tr>Confirm deletion request</Tr> : <Tr>Request deletion</Tr>}</button>}</div>
    </section>
  </div>);
}
