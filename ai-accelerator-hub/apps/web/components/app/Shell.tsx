'use client';
import { HelpButton } from '@/components/help/HelpButton';
import Link from 'next/link';
import { Crown } from '@/components/app/Crown';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';

type ThemeName = 'light' | 'dark' | 'sln';
const NEXT_THEME: Record<ThemeName, ThemeName> = { light: 'dark', dark: 'sln', sln: 'light' };
const THEME_LABEL: Record<ThemeName, string> = { light: 'Light', dark: 'Dark', sln: 'SLN heritage' };
const currentTheme = (): ThemeName => { const t = document.documentElement.getAttribute('data-theme'); return t === 'dark' || t === 'sln' ? t : 'light'; };
/** Same storage and attribute as Settings → Appearance (ThemePicker) and the pre-paint script in app/layout.tsx. */
function applyTheme(t: ThemeName) {
  document.documentElement.setAttribute('data-theme', t);
  try { localStorage.setItem('aih_theme', t); } catch { /* private mode: applied for this page only */ }
  window.dispatchEvent(new Event('aih-theme'));
}
import { Bell, Flame, LogOut, Menu, Moon, Sun, Palette, X, Snowflake, Clock, Pause, ChevronRight, Settings, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { api } from '@/lib/client/api';
import { NavIcon } from './icons';
import { useT } from '@/components/i18n/I18nProvider';
import type { T } from '@/lib/i18n/core';
import { Tr } from '@/components/i18n/Tr';
import { InstitutionSwitcher } from './InstitutionSwitcher';

export type NavItem = { href: string; label: string; icon: string; group: string; count?: number };
type Props = { user: { name: string; roleLabel: string; tenant: string; avatarUrl?: string | null; crown?: string | null }; nav: NavItem[]; streak?: { status: string; current: number } | null; xp?: number | null; unread: number; children: React.ReactNode };
type Notif = { id: string; title: string; body?: string; href?: string; tone?: string; read: boolean; at: string };

const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const ago = (t: T, iso: string) => { const s = (Date.now() - Date.parse(iso)) / 1000; if (s < 60) return t('just now'); if (s < 3600) return t('{n} min ago', { n: Math.round(s / 60) }); if (s < 86400) return t('{n} h ago', { n: Math.round(s / 3600) }); return t('{n} d ago', { n: Math.round(s / 86400) }); };

export function Shell({ user, nav, streak, xp, unread: unread0, children, institution }: Props & { institution?: { name: string; logoUrl: string | null; canSwitch: boolean } }) {
  const path = usePathname(); const router = useRouter(); const t = useT();
  const [open, setOpen] = useState(false); const [notifOpen, setNotifOpen] = useState(false); const [menuOpen, setMenuOpen] = useState(false);
  const [notes, setNotes] = useState<Notif[] | null>(null); const [unread, setUnread] = useState(unread0);
  // Top-bar theme switch cycles Light → Dark → SLN heritage, so SLN is never lost by a click (it used to reset to dark/light).
  const [theme, setTheme] = useState<ThemeName>('light');
  // Collapsed ("rail") sidebar on desktop. Stored on <html data-sidebar> (set before paint in app/layout.tsx).
  const [rail, setRail] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null); const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => { setTheme(currentTheme()); const onTheme = () => setTheme(currentTheme()); window.addEventListener('aih-theme', onTheme); setRail(document.documentElement.getAttribute('data-sidebar') === 'rail'); return () => window.removeEventListener('aih-theme', onTheme); }, []);
  const toggleRail = () => setRail(r => {
    const next = !r;
    if (next) document.documentElement.setAttribute('data-sidebar', 'rail'); else document.documentElement.removeAttribute('data-sidebar');
    try { localStorage.setItem('aih_sidebar', next ? 'rail' : 'full'); } catch {}
    return next;
  });
  useEffect(() => {
    // Ctrl/⌘ + B toggles the sidebar, except while typing (where it may mean "bold").
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey) || e.altKey || e.shiftKey || e.key.toLowerCase() !== 'b') return;
      const t = e.target as HTMLElement | null;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
      e.preventDefault(); toggleRail();
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);
  useEffect(() => { setOpen(false); setNotifOpen(false); setMenuOpen(false); }, [path]);
  useEffect(() => { setUnread(unread0); }, [unread0]);
  useEffect(() => {
    const onDoc = (e: MouseEvent) => { if (bellRef.current && !bellRef.current.contains(e.target as Node)) setNotifOpen(false); if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setNotifOpen(false); setMenuOpen(false); setOpen(false); } };
    document.addEventListener('mousedown', onDoc); document.addEventListener('keydown', onKey);
    return () => { document.removeEventListener('mousedown', onDoc); document.removeEventListener('keydown', onKey); };
  }, []);
  const toggleTheme = () => { const t = NEXT_THEME[theme]; setTheme(t); applyTheme(t); };
  const openNotifs = async () => { const next = !notifOpen; setNotifOpen(next); setMenuOpen(false); if (next) { const r = await api<{ items: Notif[] }>('/api/v1/notifications').catch(() => ({ items: [] })); setNotes(r.items); } };
  const markAll = async () => { await api('/api/v1/notifications', { method: 'PATCH', body: { all: true } }); setNotes(n => n?.map(x => ({ ...x, read: true })) || null); setUnread(0); };
  const matches = (href: string) => path === href || (href !== '/dashboard' && path.startsWith(href + '/'));
  // Most specific item wins, so /review/agent-lab does not also light up /review.
  const active = (href: string) => matches(href) && !nav.some(n => n.href !== href && n.href.startsWith(href + '/') && matches(n.href));
  const current = nav.find(n => active(n.href));
  const groups = [...new Set(nav.map(n => n.group))];
  const sv = streak ? ({ active: { I: Flame, cls: '', w: t(streak?.current === 1 ? 'day' : 'days') }, frozen: { I: Snowflake, cls: 'frozen', w: t('frozen') }, grace: { I: Clock, cls: 'grace', w: t('at risk') }, recovery: { I: Pause, cls: 'recovery', w: t('paused') }, new: { I: Flame, cls: 'recovery', w: t('start today') } } as const)[streak.status as 'active'] || { I: Flame, cls: '', w: t('days') } : null;

  return (
    <div className="app">
      <a className="skip" href="#main">{t('Skip to content')}</a>
      <aside className={`sidebar ${open ? 'is-open' : ''}`} id="sidebar" aria-label={t('Primary')}>
        <div className="brand-row">
          <Link className="brand" href="/dashboard" aria-label={t('AI Accelerator Hub home')}>
            <span className="logo" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24"><path d="M12 4 4 21h8z" fill="#3878F6" /><path d="M12 4l8 17h-8z" fill="#8658E8" /><circle cx="12" cy="3.6" r="2.2" fill="#E8B94F" /></svg></span>
            <span className="brand-txt"><b><Tr>AI Accelerator</Tr></b><small>HUB</small></span>
          </Link>
          <button className="rail-btn desk" type="button" onClick={toggleRail} aria-controls="sidebar" aria-expanded={!rail}
            aria-label={t(rail ? 'Expand sidebar' : 'Collapse sidebar')} title={`${rail ? 'Expand' : 'Collapse'} sidebar (Ctrl/⌘ + B)`}>
            {rail ? <PanelLeftOpen size={17} aria-hidden="true" /> : <PanelLeftClose size={17} aria-hidden="true" />}
          </button>
          <button className="rail-btn only-mobile" type="button" aria-label={t('Close menu')} onClick={() => setOpen(false)}><X size={16} /></button>
        </div>
        <nav className="nav" aria-label={t('Main')}>
          {groups.map(g => (
            <div key={g}>
              <div className="side-group-label">{t(g)}</div>
              {nav.filter(n => n.group === g).map(n => (
                <Link key={n.href} href={n.href} className={`nav-item top ${active(n.href) ? 'active' : ''}`} aria-current={active(n.href) ? 'page' : undefined}
                  aria-label={n.count ? `${t(n.label)}, ${t('{n} pending', { n: n.count })}` : t(n.label)} title={rail ? t(n.label) : undefined}>
                  <NavIcon name={n.icon} /><span className="lbl">{t(n.label)}</span>{n.count ? <span className="badge-count" aria-label={t('{n} pending', { n: n.count })}>{n.count}</span> : null}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="side-foot"><b>{user.tenant}</b>{t(user.roleLabel)}</div>
        <div className="side-foot-rail" title={`${user.tenant} · ${t(user.roleLabel)}`} aria-hidden="true">{initials(user.tenant)}</div>
      </aside>
      {open && <div className="overlay" onClick={() => setOpen(false)} />}

      <div className="main-col">
        <header className="topbar">
          <button className="icon-btn only-mobile" type="button" aria-label={t('Open menu')} aria-expanded={open} aria-controls="sidebar" onClick={() => setOpen(true)}><Menu size={18} /></button>
          <nav className="crumb" aria-label={t('Breadcrumb')}><span className="crumb-pre">{t('You are here')}</span><span className="crumb-cur" aria-current="page">{t(current?.label || 'Home')}</span><ChevronRight size={14} aria-hidden="true" /></nav>
          <div className="top-right">
            {institution && <InstitutionSwitcher name={institution.name} logoUrl={institution.logoUrl} canSwitch={institution.canSwitch} />}
            {sv && streak && <Link href="/dashboard#streak" className={`pill pill-streak ${sv.cls}`} title={`Streak: ${streak.current} (${streak.status})`}><sv.I size={15} aria-hidden="true" /><span><b>{streak.current}</b><span className="days-word"> {sv.w}</span></span></Link>}
            {typeof xp === 'number' && <Link href="/achievements" className="pill pill-rank" title={t('Total XP')}>{xp.toLocaleString('en-IN')} XP</Link>}
            <HelpButton />
            <button className="icon-btn" type="button" onClick={toggleTheme} aria-label={t('Theme: {a}. Switch to {b}', { a: t(THEME_LABEL[theme]), b: t(THEME_LABEL[NEXT_THEME[theme]]) })} title={`Theme: ${THEME_LABEL[theme]} (click for ${THEME_LABEL[NEXT_THEME[theme]]})`}>{theme === 'dark' ? <Moon size={18} /> : theme === 'sln' ? <Palette size={18} /> : <Sun size={18} />}</button>
            <div className="user-wrap" ref={bellRef}>
              <button className="icon-btn" type="button" aria-haspopup="true" aria-expanded={notifOpen} aria-label={unread ? t('Notifications, {n} unread', { n: unread }) : t('Notifications')} onClick={openNotifs}><Bell size={18} />{unread > 0 && <span className="count">{unread > 9 ? '9+' : unread}</span>}</button>
              {notifOpen && (
                <div className="popover" role="region" aria-label={t('Notifications')}>
                  <div className="pop-head"><b>{t('Notifications')}</b><button className="btn btn-text btn-sm" type="button" onClick={markAll}>{t('Mark all read')}</button></div>
                  {!notes ? <p className="muted small" style={{ padding: 20 }}>{t('Loading…')}</p> : notes.length === 0 ? <p className="muted small" style={{ padding: 20 }}>{t("You're all caught up.")}</p> : notes.map(n => (
                    <button key={n.id} type="button" className={`notif ${n.read ? '' : 'unread'}`} onClick={() => { setNotifOpen(false); if (n.href) router.push(n.href); }}>
                      <span className={`ni ${n.tone || ''}`} aria-hidden="true"><Bell size={15} /></span>
                      <span style={{ flex: 1, minWidth: 0 }}><b>{t(n.title)}</b>{n.body && <p>{t(n.body)}</p>}<time dateTime={n.at}>{ago(t, n.at)}</time></span>
                      {!n.read && <span className="unread-dot" aria-label={t('Unread')} />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="user-wrap" ref={menuRef}>
              <button className="user-chip" type="button" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => { setMenuOpen(!menuOpen); setNotifOpen(false); }}>
                <span className={`avatar avatar-sm me${user.crown ? " crowned" : ""}`} aria-hidden="true">{user.avatarUrl ? <img src={user.avatarUrl} alt="" width={32} height={32} style={{ borderRadius: "50%", objectFit: "cover", width: "100%", height: "100%" }} /> : initials(user.name)}{user.crown && <span className="crown-mini" aria-hidden="true"><Crown size={18} /></span>}</span><span className="uname">{user.name}</span><span className="role-chip">{t(user.roleLabel)}</span>
              </button>
              {menuOpen && (
                <div className="menu" role="menu">
                  <div className="menu-label">{user.tenant}</div>
                  <Link role="menuitem" href="/settings/profile"><Settings size={15} />{t('Profile & privacy')}</Link><Link role="menuitem" href="/settings"><Settings size={15} />{t('Settings')}</Link>
                  <hr />
                  <button role="menuitem" type="button" onClick={() => signOut({ callbackUrl: '/login' })}><LogOut size={15} />{t('Sign out')}</button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main id="main" tabIndex={-1}>{children}</main>
      </div>
    </div>
  );
}
