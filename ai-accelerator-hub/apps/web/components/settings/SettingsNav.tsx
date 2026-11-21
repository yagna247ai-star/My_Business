'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowLeft, Building2, GraduationCap, Layers, LayoutGrid, Map, ScrollText, Briefcase, UserCog, Users, Trophy } from 'lucide-react';
import { Tv } from '@/components/i18n/Tv';

export const SETTINGS_ICONS = { grid: LayoutGrid, profile: UserCog, institute: Building2, people: Users, cohorts: Layers, talent: Briefcase, journeys: Map, hackathons: Trophy, audit: ScrollText, learn: GraduationCap } as const;
export type SettingsIcon = keyof typeof SETTINGS_ICONS;
export type SettingsLink = { href: string; label: string; icon: SettingsIcon; group: string };

export function SettingsNav({ links }: { links: SettingsLink[] }) {
  const path = usePathname();
  const groups = [...new Set(links.map(l => l.group))];
  return (<nav className="set-nav" aria-label="Settings">
    <Link href="/dashboard" className="muted"><ArrowLeft size={16} aria-hidden="true" />Back to dashboard</Link>
    <div className="set-nav-head"><span>Settings</span><span className="dot" aria-hidden="true" /></div>
    {groups.map(g => (<div key={g} style={{ display: 'contents' }}>
      {g !== 'Settings' && <div className="set-nav-group"><Tv v={g} /></div>}
      {links.filter(l => l.group === g).map(l => { const I = SETTINGS_ICONS[l.icon]; const on = l.href === '/settings' ? path === '/settings' : path === l.href || path.startsWith(l.href + '/'); return <Link key={l.href} href={l.href} aria-current={on ? 'page' : undefined}><I size={17} aria-hidden="true" /><Tv v={l.label} /></Link>; })}
    </div>))}
  </nav>);
}
