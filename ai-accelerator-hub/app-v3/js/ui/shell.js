/* AI Accelerator Hub v3 — application shell: nav (per role), top bar,
   notifications, role switching, router with RBAC guard, shortcuts. */
(function (AH) {
  'use strict';
  const { U, D, E, C, t } = AH; const { esc, ic, $, $$ } = U;
  const SH = (AH.SH = {});
  AH.ROUTES = {};   // filled by page modules: { key, label, roles, icon, render(params), after?(params) }
  AH.A = {};        // action handlers: data-action="name"

  const HOME = { learner: 'mission', reviewer: 'review', pm: 'analytics' };
  const NAV = {
    learner: [
      ['g_learn', ['mission', 'journey', 'tracks', 'achievements']],
      ['g_community', ['standings', 'feed', 'launch', 'library']],
      ['g_support', ['coaches', 'settings']]
    ],
    reviewer: [
      ['g_review', ['review']],
      ['g_community', ['feed', 'launch']],
      ['g_support', ['coaches', 'settings']]
    ],
    pm: [
      ['g_program', ['analytics', 'learners', 'review', 'audit']],
      ['g_community', ['standings', 'feed', 'launch']],
      ['g_account', ['settings']]
    ]
  };
  SH.home = () => HOME[AH.S.role];

  /* ---------- Route parsing ---------- */
  SH.parse = () => {
    const h = location.hash || '';
    const parts = h.replace(/^#\/?/, '').split('/').filter(Boolean);
    return { key: parts[0] || SH.home(), params: parts.slice(1) };
  };
  SH.go = path => { if (location.hash === path) SH.render(); else location.hash = path; };

  /* ---------- Sidebar ---------- */
  function navItem(key) {
    const r = AH.ROUTES[key]; if (!r) return '';
    const active = SH.current && SH.current.key === key;
    const count = r.count ? r.count() : 0;
    return `<a href="#/${key}" class="nav-item top ${active ? 'active' : ''}" ${active ? 'aria-current="page"' : ''} title="${esc(t(key))}">${ic(r.icon)}<span class="lbl">${esc(t(key))}</span>${count ? `<span class="badge-count" aria-label="${count} pending">${count}</span>` : ''}</a>`;
  }
  SH.renderSidebar = () => {
    const role = AH.S.role;
    $('#sideNav').innerHTML = NAV[role].map(([g, keys]) => `<div class="side-group-label">${esc(t(g))}</div>${keys.map(navItem).join('')}`).join('');
    let foot = '';
    if (role === 'learner') {
      const xp = E.xp(), tier = E.tier(), next = E.nextTier();
      const pct = next ? Math.round(((xp - tier.min) / (next.min - tier.min)) * 100) : 100;
      foot = `<b>${ic('medal', 'ic-sm')} ${tier.name} tier · ${U.fmt(xp)} XP</b>${next ? `${U.fmt(next.min - xp)} XP to ${next.name}` : 'Top tier reached'}
        <div class="bar" role="progressbar" aria-label="Progress to next tier" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><i style="width:${Math.max(pct, 2)}%"></i></div>`;
    } else if (role === 'reviewer') {
      const pend = E.allPending(); const oldest = pend[0];
      foot = `<b>${ic('inbox', 'ic-sm')} ${U.plural(pend.length, 'proof')} waiting</b>${oldest ? `Oldest: ${U.duration(Date.now() - oldest.at)} · SLA ${D.WORKSPACE.reviewSlaHours} h` : 'Queue is clear'}`;
    } else {
      foot = `<b>${ic('shield', 'ic-sm')} ${esc(D.WORKSPACE.tenant)}</b>${esc(D.WORKSPACE.cohort)} · ${D.WORKSPACE.size} learners`;
    }
    $('#sideFoot').innerHTML = foot;
    const rb = $('#railBtn'); const rail = AH.S.prefs.rail;
    rb.innerHTML = ic(rail ? 'panelOpen' : 'panelClose', 'ic-sm');
    rb.setAttribute('aria-label', rail ? 'Expand sidebar' : 'Collapse sidebar'); rb.title = rb.getAttribute('aria-label');
    rb.setAttribute('aria-expanded', String(!rail));
    $('#app').classList.toggle('is-rail', rail);
  };

  /* ---------- Top bar ---------- */
  SH.streakView = () => {
    const st = AH.S.streak;
    return {
      active: { cls: '', icon: 'flame', text: `${st.current}`, word: ' days', title: `Streak: ${U.plural(st.current, 'day')} · ${U.plural(st.freezes, 'freeze')} saved` },
      frozen: { cls: 'frozen', icon: 'snow', text: `${st.current}`, word: ' · frozen', title: `Streak frozen at ${st.current} — a freeze token covered a missed day` },
      grace: { cls: 'grace', icon: 'clock', text: `${st.current}`, word: ' · at risk', title: 'Finish any activity by tomorrow midnight (IST) to keep your streak' },
      recovery: { cls: 'recovery', icon: 'pause', text: `${st.current}`, word: ' · paused', title: `Paused at ${st.current}. Recover it with a 2-minute quick win.` }
    }[st.status];
  };
  SH.renderTopbar = () => {
    const role = AH.S.role, p = E.persona(), r = AH.ROUTES[SH.current.key];
    $('#crumbPre').textContent = t('here');
    $('#crumbCur').textContent = r ? (r.crumb ? r.crumb(SH.current.params) : t(SH.current.key)) : '';
    $('#searchBtn').innerHTML = `${ic('search', 'ic-sm')}<span class="lbl">${esc(t('search'))}</span><span class="kbd">${/Mac|iPhone|iPad/.test(navigator.platform) ? '⌘' : 'Ctrl'} K</span>`;
    const learner = role === 'learner';
    $('#streakPill').hidden = !learner; $('#rankPill').hidden = !learner;
    if (learner) {
      const sv = SH.streakView();
      $('#streakPill').className = `pill pill-streak ${sv.cls}`;
      $('#streakPill').innerHTML = `${ic(sv.icon, 'ic-sm')}<span><b>${sv.text}</b><span class="days-word">${sv.word}</span></span>`;
      $('#streakPill').title = sv.title; $('#streakPill').setAttribute('aria-label', sv.title);
      const rank = E.rank(), nr = D.next(D.RANKS, E.xp());
      $('#rankPill').textContent = rank.name.toUpperCase();
      $('#rankPill').title = `Rank ${rank.name}${nr ? ` · ${nr.min - E.xp()} XP to ${nr.name}` : ''}`;
    }
    $('#langSel').innerHTML = AH.LANGS.map(l => `<option value="${l.code}" ${AH.S.prefs.lang === l.code ? 'selected' : ''}>${esc(l.label)}</option>`).join('');
    const dark = document.documentElement.getAttribute('data-theme') === 'dark';
    $('#themeBtn').innerHTML = ic(dark ? 'moon' : 'sun');
    $('#themeBtn').setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme'); $('#themeBtn').title = $('#themeBtn').getAttribute('aria-label');
    $('#soundBtn').innerHTML = ic(AH.S.prefs.sound ? 'volume' : 'volumeX');
    $('#soundBtn').setAttribute('aria-pressed', String(AH.S.prefs.sound)); $('#soundBtn').title = AH.S.prefs.sound ? 'Sound effects on' : 'Sound effects off';
    const unread = E.myNotifications().filter(n => !n.read).length;
    $('#bellBtn').innerHTML = `${ic('bell')}${unread ? `<span class="count">${unread > 9 ? '9+' : unread}</span>` : ''}`;
    $('#bellBtn').setAttribute('aria-label', `${t('notifications')}${unread ? `, ${unread} unread` : ''}`);
    $('#userBtn').innerHTML = `<span class="avatar avatar-sm me" aria-hidden="true">${U.initials(p.name)}</span><span class="uname">${esc(p.name)}</span><span class="role-chip ${role}">${esc(p.title)}</span>`;
    $('#userBtn').setAttribute('aria-label', `Account menu, ${p.name}, ${p.title}`);
    $('#menuBtn').innerHTML = ic('menu');
    $('#crumbChev').innerHTML = ic('chevRight', 'ic-sm');
    $('#fab').hidden = !(role !== 'pm' && !['coaches', 'review'].includes(SH.current.key));
  };

  SH.renderUserMenu = () => {
    $('#userMenu').innerHTML = `<div class="menu-label">${esc(t('switchRole'))}</div>
      ${['learner', 'reviewer', 'pm'].map(r => `<button type="button" role="menuitemradio" aria-checked="${AH.S.role === r}" data-action="switchRole" data-role="${r}">${ic(r === 'learner' ? 'user' : r === 'reviewer' ? 'inbox' : 'chart', 'ic-sm')}<span>${esc(D.PERSONAS[r].title)} <span class="muted xs">· ${esc(D.PERSONAS[r].name)}</span></span>${ic('check', 'ic-sm tick')}</button>`).join('')}
      <hr><a role="menuitem" href="#/settings">${ic('settings', 'ic-sm')}${esc(t('settings'))}</a>
      <button role="menuitem" type="button" data-action="toggleTheme">${ic('moon', 'ic-sm')}Switch theme</button>
      <button role="menuitem" type="button" data-action="shortcuts">${ic('keyboard', 'ic-sm')}Keyboard shortcuts</button>
      <button role="menuitem" type="button" data-action="resetDemo">${ic('refresh', 'ic-sm')}${esc(t('resetDemo'))}</button>
      <hr><button role="menuitem" type="button" data-action="signOut">${ic('logout', 'ic-sm')}${esc(t('signOut'))}</button>`;
  };

  SH.renderNotifications = () => {
    const list = E.myNotifications();
    $('#notifPop').innerHTML = `<div class="pop-head"><b>${esc(t('notifications'))}</b><button class="btn btn-text btn-sm" type="button" data-action="notifReadAll">${esc(t('markAll'))}</button></div>
      ${list.length ? list.slice(0, 30).map(n => `<button class="notif ${n.read ? '' : 'unread'}" type="button" data-action="notifOpen" data-id="${n.id}">
        <span class="ni ${n.tone || ''}" aria-hidden="true">${ic(n.icon || 'bell', 'ic-sm')}</span>
        <span style="flex:1;min-width:0"><b>${esc(n.title)}</b>${n.body ? `<p>${esc(n.body)}</p>` : ''}${U.timeTag(n.at)}</span>
        ${n.read ? '' : '<span class="unread-dot" aria-label="Unread"></span>'}</button>`).join('') : `<p class="muted small" style="padding:20px">You're all caught up.</p>`}`;
  };

  /* ---------- Render ---------- */
  SH.render = () => {
    SH.current = SH.parse();
    let route = AH.ROUTES[SH.current.key];
    if (!route) { SH.current = { key: SH.home(), params: [] }; route = AH.ROUTES[SH.current.key]; history.replaceState(null, '', '#/' + SH.current.key); }
    const allowed = route.roles.includes(AH.S.role);
    SH.renderSidebar(); SH.renderTopbar(); SH.renderUserMenu(); SH.renderNotifications();
    document.title = `${route.crumb ? route.crumb(SH.current.params) : t(SH.current.key)} · AI Accelerator Hub`;
    const main = $('#main');
    if (!allowed) {
      const allowedRoles = route.roles.map(r => D.PERSONAS[r].title).join(' or ');
      main.innerHTML = `<div class="forbidden card card-pad"><div class="empty"><div class="ic-wrap">${ic('lock', 'ic-lg')}</div>
        <h1 class="h2">You don't have access to ${esc(t(SH.current.key))}</h1>
        <p class="text-2" style="margin-top:8px">This area is for ${esc(allowedRoles)}. Access is enforced by role, and this attempt was recorded in the audit log.</p>
        <div class="row gap-8" style="justify-content:center;margin-top:18px"><a class="btn btn-gold btn-sm" href="#/${SH.home()}">Go to my home</a>
        <button class="btn btn-outline btn-sm" type="button" data-action="switchRole" data-role="${route.roles[0]}">Switch to ${esc(D.PERSONAS[route.roles[0]].title)}</button></div></div></div>`;
      if (SH._lastDenied !== location.hash) { SH._lastDenied = location.hash; E.audit('access.denied', `${t(SH.current.key)} (${AH.S.role})`); E.commit(null, { silent: true }); }
      return;
    }
    main.innerHTML = route.render(SH.current.params);
    if (route.after) route.after(SH.current.params);
    // Pending celebrations play once the learner is looking
    if (AH.S.role === 'learner' && AH.S.celebrations.length && !$('#modalRoot').innerHTML) {
      const c = AH.S.celebrations.shift(); E.commit(null, { silent: true }); setTimeout(() => C.celebrate(c), 250);
    }
  };

  /* ---------- Commands for the palette ---------- */
  SH.commands = () => {
    const role = AH.S.role, cmds = [];
    NAV[role].forEach(([g, keys]) => keys.forEach(k => { const r = AH.ROUTES[k]; if (r) cmds.push({ group: 'Go to', label: t(k), icon: r.icon, run: () => SH.go('#/' + k), keywords: r.keywords || '' }); }));
    if (role === 'learner') {
      cmds.push({ group: 'Actions', label: 'Continue my next activity', icon: 'arrowRight', hint: 'Level 1', run: () => SH.go(`#/journey/1/${AH.S.progress.lastAct}`) });
      cmds.push({ group: 'Actions', label: 'Ask the Code Mentor', icon: 'code', run: () => AH.P.openCoach('', 'code-mentor') });
      cmds.push({ group: 'Actions', label: 'Export my data (JSON)', icon: 'download', run: () => AH.A.exportData() });
    }
    if (role === 'reviewer' || role === 'pm') E.allPending().forEach(s => cmds.push({ group: 'Review', label: `Review ${E.whoName(s.who)} · L${s.levelIdx}`, icon: 'inbox', hint: U.ago(s.at), run: () => SH.go('#/review/' + s.id) }));
    if (role === 'pm') cmds.push({ group: 'Actions', label: 'Verify XP ledger integrity', icon: 'shield', run: () => SH.go('#/audit') });
    ['learner', 'reviewer', 'pm'].filter(r => r !== role).forEach(r => cmds.push({ group: 'Workspace', label: `Switch role to ${D.PERSONAS[r].title}`, icon: 'users', run: () => AH.A.switchRole({ dataset: { role: r } }) }));
    cmds.push({ group: 'Preferences', label: 'Toggle light / dark theme', icon: 'moon', run: () => AH.A.toggleTheme() });
    AH.LANGS.forEach(l => cmds.push({ group: 'Preferences', label: `Language: ${l.label}`, icon: 'globe', run: () => { E.commit(s => { s.prefs.lang = l.code; }); } }));
    cmds.push({ group: 'Help', label: 'Keyboard shortcuts', icon: 'keyboard', hint: '?', run: () => AH.A.shortcuts() });
    return cmds;
  };
})(window.AH = window.AH || {});
