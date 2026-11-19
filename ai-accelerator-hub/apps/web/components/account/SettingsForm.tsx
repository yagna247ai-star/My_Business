'use client';
import { useState } from 'react';
import { Download } from 'lucide-react';
import { api, ApiError } from '@/lib/client/api';

type S = { leaderboardVisibility: string; globalOptIn: boolean; quietHours: boolean; ageBand: string; guardianConsent: string; deletionRequestedAt: string | null };
export function SettingsForm({ initial, language, area: initialArea = '' }: { initial: S; language: string; area?: string }) {
  const [s, setS] = useState(initial); const [lang, setLang] = useState(language); const [area, setArea] = useState(initialArea); const [msg, setMsg] = useState(''); const [err, setErr] = useState('');
  const save = async (patch: Partial<S> & { preferredLanguage?: string; area?: string }) => { setMsg(''); setErr(''); try { const r = await api<S>('/api/v1/settings', { method: 'PATCH', body: patch }); setS({ ...s, ...r }); setMsg('Saved.'); } catch (e) { setErr((e as ApiError).message); } };
  const del = async () => { if (!confirmDel) { setConfirmDel(true); return; } try { const r = await api<{ note: string }>('/api/v1/settings/delete', { body: {} }); setMsg(r.note); setS({ ...s, deletionRequestedAt: new Date().toISOString() }); } catch (e) { setErr((e as ApiError).message); } };
  const [confirmDel, setConfirmDel] = useState(false);
  const sw = (on: boolean, label: string, onClick: () => void, disabled = false) => <button className="switch" type="button" role="switch" aria-checked={on} aria-label={label} onClick={onClick} disabled={disabled} />;
  const minor = s.ageBand === 'minor';
  return (<div className="stack gap-20">
    {msg && <p className="callout ok small" role="status">{msg}</p>}{err && <p className="callout warn small" role="alert">{err}</p>}
    <section className="card card-pad" aria-labelledby="pv"><h2 className="h3" id="pv">Privacy</h2>
      {minor && <p className="callout info small" style={{ marginTop: 10 }}>Because you are under 18, privacy is on by default{s.guardianConsent !== 'granted' ? ' and some settings need your guardian’s approval' : ''}.</p>}
      <div className="set-row"><div><b>Show my name in standings</b><p>Off shows you as “Anonymous learner”. Your XP still counts.</p></div>{sw(s.leaderboardVisibility !== 'private', 'Show my name in standings', () => save({ leaderboardVisibility: s.leaderboardVisibility === 'private' ? 'cohort' : 'private' }))}</div>
      <div className="set-row"><div><b>Share progress beyond my institution</b><p>Explicit consent for cross-institution visibility. Withdraw any time.</p></div>{sw(s.globalOptIn, 'Share progress beyond my institution', () => save({ globalOptIn: !s.globalOptIn }))}</div>
      <div className="set-row"><div><b>Quiet hours</b><p>No reminders between 10 pm and 8 am IST.</p></div>{sw(s.quietHours, 'Quiet hours', () => save({ quietHours: !s.quietHours }))}</div>
      <div className="set-row"><div><b>My area</b><p>Your city or area, for area crowns (top 3 per area). Leave blank to skip.</p></div><form style={{ display: 'flex', gap: 8 }} onSubmit={e => { e.preventDefault(); save({ area }); }}><input className="input" style={{ width: 180 }} value={area} maxLength={60} aria-label="My area" placeholder="e.g. Hyderabad" onChange={e => setArea(e.target.value)} /><button className="btn btn-soft btn-sm" type="submit">Save area</button></form></div>
      <div className="set-row"><div><b>Language</b><p>Your progress never changes when you switch.</p></div><select className="select" style={{ width: 'auto' }} value={lang} aria-label="Language" onChange={e => { setLang(e.target.value); save({ preferredLanguage: e.target.value }); }}>{[['en', 'English'], ['hi', 'हिन्दी'], ['te', 'తెలుగు'], ['ta', 'தமிழ்'], ['kn', 'ಕನ್ನಡ'], ['ml', 'മലയാളം']].map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></div>
    </section>
    <section className="card card-pad" aria-labelledby="dt"><h2 className="h3" id="dt">Your data</h2>
      <div className="set-row"><div><b>Download my data</b><p>Everything we hold about you in this institution, as JSON.</p></div><a className="btn btn-outline btn-sm" href="/api/v1/settings/export"><Download size={14} />Download</a></div>
      <div className="set-row"><div><b>Delete my account</b><p>{s.deletionRequestedAt ? `Requested on ${new Date(s.deletionRequestedAt).toLocaleDateString('en-IN')}. Your institution reviews it within 30 days.` : 'Starts a deletion request. Issued certificates stay verifiable.'}</p></div>{!s.deletionRequestedAt && <button className="btn btn-outline btn-sm" type="button" onClick={del} style={{ color: 'var(--danger)' }}>{confirmDel ? 'Confirm deletion request' : 'Request deletion'}</button>}</div>
    </section>
  </div>);
}
