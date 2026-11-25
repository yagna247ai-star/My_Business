'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ArrowLeft, Building2, GraduationCap, KeyRound, Layers, LayoutGrid, Map, PanelLeftClose, PanelLeftOpen, ScrollText, Briefcase, ShieldCheck, UserCog, Users, Trophy } from 'lucide-react';
import { Tv } from '@/components/i18n/Tv';
import { useT } from '@/components/i18n/I18nProvider';

export const SETTINGS_ICONS = { grid: LayoutGrid, profile: UserCog, institute: Building2, people: Users, cohorts: Layers, talent: Briefcase, journeys: Map, hackathons: Trophy, audit: ScrollText, learn: GraduationCap, access: ShieldCheck, password: KeyRound } as const;
export type SettingsIcon = keyof typeof SETTINGS_ICONS;
export type SettingsLink = { href: string; label: string; icon: SettingsIcon; group: string };

/** The Settings side menu. Collapses to icons like the main menu (docs/ACCESS_MODULES_AND_NAV_SPEC.md), remembered as aih_setnav. */
export function SettingsNav({ links }: { links: SettingsLink[] }) {
  const path = usePathname(); const t = useT();
  const [rail, setRail] = useState(false);
  useEffect(() => { setRail(document.documentElement.getAttribute('data-setnav') === 'rail'); }, []);
  const toggle = () => {
    const next = !rail; setRail(next);
    if (next) document.documentElement.setAttribute('data-setnav', 'rail'); else document.documentElement.removeAttribute('data-setnav');
    try { localStorage.setItem('aih_setnav', next ? 'rail' : 'full'); } catch { /* storage blocked: lasts for this page */ }
  };
  const groups = [...new Set(links.map(l => l.group))];
  return (<nav className="set-nav" id="set-nav" aria-label="Settings">
    <div className="set-nav-top">
      <Link href="/dashboard" className="muted" title={t('Back to dashboard')} aria-label={t('Back to dashboard')}><ArrowLeft size={16} aria-hidden="true" /><span className="lbl">{t('Back to dashboard')}</span></Link>
      <button type="button" className="rail-btn" onClick={toggle} aria-controls="set-nav" aria-expanded={!rail} aria-label={t(rail ? 'Expand settings menu' : 'Collapse settings menu')} title={t(rail ? 'Expand settings menu' : 'Collapse settings menu')}>
        {rail ? <PanelLeftOpen size={16} aria-hidden="true" /> : <PanelLeftClose size={16} aria-hidden="true" />}
      </button>
    </div>
    <div className="set-nav-head"><span className="lbl">Settings</span><span className="dot" aria-hidden="true" /></div>
    {groups.map(g => (<div key={g} style={{ display: 'contents' }}>
      {g !== 'Settings' && <div className="set-nav-group"><Tv v={g} /></div>}
      {links.filter(l => l.group === g).map(l => { const I = SETTINGS_ICONS[l.icon]; const on = l.href === '/settings' ? path === '/settings' : path === l.href || path.startsWith(l.href + '/'); return <Link key={l.href} href={l.href} aria-current={on ? 'page' : undefined} title={rail ? t(l.label) : undefined} aria-label={t(l.label)}><I size={17} aria-hidden="true" /><span className="lbl"><Tv v={l.label} /></span></Link>; })}
    </div>))}
  </nav>);
}
