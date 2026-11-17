'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useEffect, useRef, useState } from 'react';
import { Bell, Flame, LogOut, Menu, Moon, Sun, X, Snowflake, Clock, Pause, ChevronRight, Settings, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { api } from '@/lib/client/api';
import { NavIcon } from './icons';

export type NavItem = { href: string; label: string; icon: string; group: string; count?: number };
type Props = { user: { name: string; roleLabel: string; tenant: string }; nav: NavItem[]; streak?: { status: string; current: number } | null; xp?: number | null; unread: number; children: React.ReactNode };
type Notif = { id: string; title: string; body?: string; href?: string; tone?: string; read: boolean; at: string };

const initials = (n: string) => n.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const ago = (iso: string) => { const s = (Date.now() - Date.parse(iso)) / 1000; if (s < 60) return 'just now'; if (s < 3600) return `${Math.round(s / 60)} min ago`; if (s < 86400) return `${Math.round(s / 3600)} h ago`; return `${Math.round(s / 86400)} d ago`; };

export function Shell({ user, nav, streak, xp, unread: unread0, children }: Props) {
  const path = usePathname(); const router = useRouter();
  const [open, setOpen] = useState(false); const [notifOpen, setNotifOpen] = useState(false); const [menuOpen, setMenuOpen] = useState(false);
  const [notes, setNotes] = useState<Notif[] | null>(null); const [unread, setUnread] = useState(unread0);
  const [dark, setDark] = useState(false);
  // Collapsed ("rail") sidebar on desktop. Stored on <html data-sidebar> (set before paint in app/layout.tsx).
  const [rail, setRail] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null); const menuRef = useRef<HTMLDivElement>(null);
  useEffect(() => { setDark(document.documentElement.getAttribute('data-theme') === 'dark'); setRail(document.documentElement.getAttribute('data-sidebar') === 'rail'); }, []);
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
  const toggleTheme = () => { const d = !dark; setDark(d); document.documentElement.setAttribute('data-theme', d ? 'dark' : 'light'); try { localStorage.setItem('aih_theme', d ? 'dark' : 'light'); } catch {} };
  const openNotifs = async () => { const next = !notifOpen; setNotifOpen(next); setMenuOpen(false); if (next) { const r = await api<{ items: Notif[] }>('/api/v1/notifications').catch(() => ({ items: [] })); setNotes(r.items); } };
  const markAll = async () => { await api('/api/v1/notifications', { method: 'PATCH', body: { all: true } }); setNotes(n => n?.map(x => ({ ...x, read: true })) || null); setUnread(0); };
  const matches = (href: string) => path === href || (href !== '/dashboard' && path.startsWith(href + '/'));
  // Most specific item wins, so /review/agent-lab does not also light up /review.
  const active = (href: string) => matches(href) && !nav.some(n => n.href !== href && n.href.startsWith(href + '/') && matches(n.href));
  const current = nav.find(n => active(n.href));
  const groups = [...new Set(nav.map(n => n.group))];
  const sv = streak ? ({ active: { I: Flame, cls: '', w: streak?.current === 1 ? 'day' : 'days' }, frozen: { I: Snowflake, cls: 'frozen', w: 'frozen' }, grace: { I: Clock, cls: 'grace', w: 'at risk' }, recovery: { I: Pause, cls: 'recovery', w: 'paused' }, new: { I: Flame, cls: 'recovery', w: 'start today' } } as const)[streak.status as 'active'] || { I: Flame, cls: '', w: 'days' } : null;

  return (
    <div className="app">
      <a className="skip" href="#main">Skip to content</a>
      <aside className={`sidebar ${open ? 'is-open' : ''}`} id="sidebar" aria-label="Primary">
        <div className="brand-row">
          <Link className="brand" href="/dashboard" aria-label="AI Accelerator Hub home">
            <span className="logo" aria-hidden="true"><svg width="22" height="22" viewBox="0 0 24 24"><path d="M12 4 4 21h8z" fill="#3878F6" /><path d="M12 4l8 17h-8z" fill="#8658E8" /><circle cx="12" cy="3.6" r="2.2" fill="#E8B94F" /></svg></span>
            <span className="brand-txt"><b>AI Accelerator</b><small>HUB</small></span>
          </Link>
          <button className="rail-btn desk" type="button" onClick={toggleRail} aria-controls="sidebar" aria-expanded={!rail}
            aria-label={rail ? 'Expand sidebar' : 'Collapse sidebar'} title={`${rail ? 'Expand' : 'Collapse'} sidebar (Ctrl/⌘ + B)`}>
            {rail ? <PanelLeftOpen size={17} aria-hidden="true" /> : <PanelLeftClose size={17} aria-hidden="true" />}
          </button>
          <button className="rail-btn only-mobile" type="button" aria-label="Close menu" onClick={() => setOpen(false)}><X size={16} /></button>
        </div>
        <nav className="nav" aria-label="Main">
          {groups.map(g => (
            <div key={g}>
              <div className="side-group-label">{g}</div>
              {nav.filter(n => n.group === g).map(n => (
                <Link key={n.href} href={n.href} className={`nav-item top ${active(n.href) ? 'active' : ''}`} aria-current={active(n.href) ? 'page' : undefined}
                  aria-label={n.count ? `${n.label}, ${n.count} pending` : n.label} title={rail ? n.label : undefined}>
                  <NavIcon name={n.icon} /><span className="lbl">{n.label}</span>{n.count ? <span className="badge-count" aria-label={`${n.count} pending`}>{n.count}</span> : null}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        <div className="side-foot"><b>{user.tenant}</b>{user.roleLabel}</div>
        <div className="side-foot-rail" title={`${user.tenant} · ${user.roleLabel}`} aria-hidden="true">{initials(user.tenant)}</div>
      </aside>
      {open && <div className="overlay" onClick={() => setOpen(false)} />}

      <div className="main-col">
        <header className="topbar">
          <button className="icon-btn only-mobile" type="button" aria-label="Open menu" aria-expanded={open} aria-controls="sidebar" onClick={() => setOpen(true)}><Menu size={18} /></button>
          <nav className="crumb" aria-label="Breadcrumb"><span className="crumb-pre">You are here</span><span className="crumb-cur" aria-current="page">{current?.label || 'Home'}</span><ChevronRight size={14} aria-hidden="true" /></nav>
          <div className="top-right">
            {sv && streak && <Link href="/dashboard#streak" className={`pill pill-streak ${sv.cls}`} title={`Streak: ${streak.current} (${streak.status})`}><sv.I size={15} aria-hidden="true" /><span><b>{streak.current}</b><span className="days-word"> {sv.w}</span></span></Link>}
            {typeof xp === 'number' && <Link href="/achievements" className="pill pill-rank" title="Total XP">{xp.toLocaleString('en-IN')} XP</Link>}
            <button className="icon-btn" type="button" onClick={toggleTheme} aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}>{dark ? <Moon size={18} /> : <Sun size={18} />}</button>
            <div className="user-wrap" ref={bellRef}>
              <button className="icon-btn" type="button" aria-haspopup="true" aria-expanded={notifOpen} aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`} onClick={openNotifs}><Bell size={18} />{unread > 0 && <span className="count">{unread > 9 ? '9+' : unread}</span>}</button>
              {notifOpen && (
                <div className="popover" role="region" aria-label="Notifications">
                  <div className="pop-head"><b>Notifications</b><button className="btn btn-text btn-sm" type="button" onClick={markAll}>Mark all read</button></div>
                  {!notes ? <p className="muted small" style={{ padding: 20 }}>Loading…</p> : notes.length === 0 ? <p className="muted small" style={{ padding: 20 }}>You&apos;re all caught up.</p> : notes.map(n => (
                    <button key={n.id} type="button" className={`notif ${n.read ? '' : 'unread'}`} onClick={() => { setNotifOpen(false); if (n.href) router.push(n.href); }}>
                      <span className={`ni ${n.tone || ''}`} aria-hidden="true"><Bell size={15} /></span>
                      <span style={{ flex: 1, minWidth: 0 }}><b>{n.title}</b>{n.body && <p>{n.body}</p>}<time dateTime={n.at}>{ago(n.at)}</time></span>
                      {!n.read && <span className="unread-dot" aria-label="Unread" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div className="user-wrap" ref={menuRef}>
              <button className="user-chip" type="button" aria-haspopup="menu" aria-expanded={menuOpen} onClick={() => { setMenuOpen(!menuOpen); setNotifOpen(false); }}>
                <span className="avatar avatar-sm me" aria-hidden="true">{initials(user.name)}</span><span className="uname">{user.name}</span><span className="role-chip">{user.roleLabel}</span>
              </button>
              {menuOpen && (
                <div className="menu" role="menu">
                  <div className="menu-label">{user.tenant}</div>
                  <Link role="menuitem" href="/settings"><Settings size={15} />Settings &amp; privacy</Link>
                  <hr />
                  <button role="menuitem" type="button" onClick={() => signOut({ callbackUrl: '/login' })}><LogOut size={15} />Sign out</button>
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
