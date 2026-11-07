/* AI Accelerator Hub v3 — composition root: theme, delegation, shortcuts, boot */
(function (AH) {
  'use strict';
  const { U, D, E, C, SH, P } = AH; const { $, esc, ic } = U; const A = AH.A;

  /* ---------- Theme & motion ---------- */
  AH.applyTheme = () => {
    const pref = U.store.get('ah3_theme', 'system');
    const dark = pref === 'dark' || (pref === 'system' && window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
  };
  AH.applyMotion = () => document.documentElement.classList.toggle('reduce-motion', C.reducedMotion());
  if (window.matchMedia) matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => { AH.applyTheme(); SH.renderTopbar(); });

  /* ---------- Global actions ---------- */
  A.toggleTheme = () => { const dark = document.documentElement.getAttribute('data-theme') === 'dark'; U.store.set('ah3_theme', dark ? 'light' : 'dark'); AH.applyTheme(); SH.renderTopbar(); };
  A.switchRole = el => {
    const role = el.dataset.role; if (role === AH.S.role) return closeMenus();
    E.commit(s => { s.role = role; E.audit('session.role_switched', `→ ${D.PERSONAS[role].title}`); }, { silent: true });
    closeMenus(); P.closeCoach && P.closeCoach();
    C.toast(`Now viewing as ${D.PERSONAS[role].name} · ${D.PERSONAS[role].title}`);
    SH.go('#/' + SH.home());
  };
  A.resetDemo = () => { closeMenus(); C.dialog({ title: 'Reset all demo data?', body: 'Progress, reviews, posts, notifications and the audit log return to their starting state for every role.', confirm: 'Reset', danger: true, onConfirm: () => { E.reset(); P.draft = { quiz: {}, a3: {}, a1: null, proof: null }; SH.go('#/' + SH.home()); C.toast('Demo data reset.'); } }); };
  A.signOut = () => { closeMenus(); C.dialog({ title: 'Sign out', body: 'In this demo there is no real session, so signing out simply returns you to Mission Control as the learner.', confirm: 'OK', cancel: null, onConfirm: () => A.switchRole({ dataset: { role: 'learner' } }) }); };
  A.demoOnly = (el, e) => { if (e) e.preventDefault(); C.toast(el.dataset.msg); };
  A.notifReadAll = () => { E.commit(() => E.myNotifications().forEach(n => { n.read = true; }), { silent: true }); SH.renderTopbar(); SH.renderNotifications(); };
  A.notifOpen = el => { const n = AH.S.notifications.find(x => x.id === el.dataset.id); if (!n) return; E.commit(() => { n.read = true; }, { silent: true }); closeMenus(); if (n.href) SH.go(n.href); else { SH.renderTopbar(); SH.renderNotifications(); } };
  A.streakInfo = () => {
    const st = AH.S.streak, sv = SH.streakView();
    C.dialog({ title: `${sv.text}-day streak`, cancel: 'Close', confirm: st.status === 'recovery' ? 'Recover now' : null, onConfirm: () => A.quickWin(),
      body: `<p>${esc(sv.title)}.</p><div class="kv" style="margin-top:10px"><span>Longest streak</span><span>${st.longest} days</span></div><div class="kv"><span>Freeze tokens</span><span>${st.freezes} of 7</span></div><div class="kv"><span>Last counted day</span><span>${esc(st.lastDay)}</span></div>
        <p class="muted small" style="margin-top:12px">A day counts when you finish a real activity (logins don't). Miss a day: a freeze covers it. No freeze: 48 h grace. After that, your streak pauses for 7 days and a quick win restores it in full.</p>` });
  };
  A.shortcuts = () => { closeMenus(); C.dialog({ title: 'Keyboard shortcuts', cancel: 'Close', body: `<div class="stack gap-8">${[['⌘/Ctrl K', 'Command palette'], ['/', 'Command palette'], ['g then m', 'Mission Control'], ['g then j', 'Journey'], ['g then r', 'Review queue'], ['g then a', 'Analytics'], ['g then c', 'AI coaches'], ['?', 'This help'], ['Esc', 'Close any panel']].map(([k, d]) => `<div class="kv"><span><span class="kbd" style="margin:0">${esc(k)}</span></span><span>${esc(d)}</span></div>`).join('')}</div>` }); };

  /* ---------- Menus & popovers ---------- */
  function closeMenus() {
    $('#userMenu').hidden = true; $('#userBtn').setAttribute('aria-expanded', 'false');
    $('#notifPop').hidden = true; $('#bellBtn').setAttribute('aria-expanded', 'false');
  }
  $('#userBtn').addEventListener('click', e => { e.stopPropagation(); const m = $('#userMenu'), open = m.hidden; closeMenus(); m.hidden = !open; $('#userBtn').setAttribute('aria-expanded', String(open)); if (open) { const f = m.querySelector('[role^="menuitem"]'); if (f) f.focus(); } });
  $('#bellBtn').addEventListener('click', e => { e.stopPropagation(); const m = $('#notifPop'), open = m.hidden; closeMenus(); SH.renderNotifications(); m.hidden = !open; $('#bellBtn').setAttribute('aria-expanded', String(open)); });
  $('#themeBtn').addEventListener('click', A.toggleTheme);
  $('#soundBtn').addEventListener('click', () => { E.commit(s => { s.prefs.sound = !s.prefs.sound; }, { silent: true }); SH.renderTopbar(); C.blip(660); });
  $('#langSel').addEventListener('change', e => { E.commit(s => { s.prefs.lang = e.target.value; }); document.documentElement.lang = e.target.value; });
  $('#searchBtn').addEventListener('click', () => C.palette(SH.commands()));
  $('#streakPill').addEventListener('click', A.streakInfo);
  $('#railBtn').addEventListener('click', () => E.commit(s => { s.prefs.rail = !s.prefs.rail; }));
  const openSide = () => { $('#sidebar').classList.add('is-open'); $('#overlay').hidden = false; $('#menuBtn').setAttribute('aria-expanded', 'true'); document.body.style.overflow = 'hidden'; const f = $('#sidebar a'); if (f) f.focus(); };
  const closeSide = (restore = true) => { if (!$('#sidebar').classList.contains('is-open')) return; $('#sidebar').classList.remove('is-open'); $('#overlay').hidden = true; $('#menuBtn').setAttribute('aria-expanded', 'false'); document.body.style.overflow = ''; if (restore) $('#menuBtn').focus(); };
  $('#menuBtn').addEventListener('click', openSide);
  $('#sideClose').innerHTML = ic('x', 'ic-sm');
  $('#sideClose').addEventListener('click', () => closeSide());
  $('#overlay').addEventListener('click', () => closeSide());
  $('#fab').innerHTML = `${ic('lifebuoy')}Ask a coach`;
  $('#fab').addEventListener('click', () => P.openCoach(`${AH.t(SH.current.key)} page`));
  window.addEventListener('resize', () => { if (window.innerWidth >= 1024) closeSide(false); });

  /* ---------- Event delegation ---------- */
  document.addEventListener('click', e => {
    const el = e.target.closest('[data-action]');
    if (el && A[el.dataset.action] && !el.disabled) A[el.dataset.action](el, e);
    if (!e.target.closest('.user-wrap') && !e.target.closest('.bell-wrap')) closeMenus();
  });
  document.addEventListener('change', e => { const el = e.target.closest('[data-change]'); if (el && A[el.dataset.change]) A[el.dataset.change](el, e); });
  document.addEventListener('submit', e => {
    const f = e.target, k = f.dataset.form; if (!k) return; e.preventDefault();
    const h = P.forms && P.forms[k]; if (h) Promise.resolve(h(f)).catch(err => { console.error(err); C.toast('Something went wrong. Please try again.', { tone: 'error' }); });
  });

  /* ---------- Keyboard ---------- */
  let gPending = 0;
  const typing = el => el && (el.matches('input,textarea,select,[contenteditable="true"]'));
  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); return C.palette(SH.commands()); }
    if (e.key === 'Escape') {
      if ($('#modalRoot').innerHTML || $('#paletteRoot').innerHTML) return;
      if ($('#drawerRoot').innerHTML) return P.closeCoach();
      if (!$('#userMenu').hidden || !$('#notifPop').hidden) { closeMenus(); return; }
      return closeSide();
    }
    if (!typing(e.target) && !e.metaKey && !e.ctrlKey && !e.altKey) {
      if (e.key === '/') { e.preventDefault(); return C.palette(SH.commands()); }
      if (e.key === '?') { e.preventDefault(); return A.shortcuts(); }
      if (e.key === 'g') { gPending = Date.now(); return; }
      if (gPending && Date.now() - gPending < 1200) {
        gPending = 0; const map = { m: 'mission', j: 'journey', r: 'review', a: 'analytics', c: 'coaches', s: 'settings', f: 'feed' };
        if (map[e.key] && AH.ROUTES[map[e.key]].roles.includes(AH.S.role)) { e.preventDefault(); SH.go('#/' + map[e.key]); }
        return;
      }
    }
    // Roving focus for tabs & radio groups
    const group = e.target.closest('[role="tablist"],[role="radiogroup"]');
    if (group && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Home', 'End'].includes(e.key)) {
      const items = U.$$('[role="tab"],[role="radio"]', group).filter(x => !x.disabled); const i = items.indexOf(e.target); if (i < 0) return;
      e.preventDefault();
      const n = e.key === 'Home' ? 0 : e.key === 'End' ? items.length - 1 : (i + (['ArrowRight', 'ArrowDown'].includes(e.key) ? 1 : -1) + items.length) % items.length;
      items[n].focus(); items[n].click();
    }
    // Menus: arrow navigation
    const menu = e.target.closest('[role="menu"]');
    if (menu && ['ArrowDown', 'ArrowUp'].includes(e.key)) {
      e.preventDefault(); const items = U.$$('[role^="menuitem"]', menu), i = items.indexOf(document.activeElement);
      items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length].focus();
    }
  });

  /* ---------- Boot ---------- */
  window.addEventListener('hashchange', () => { P.closeCoach && P.closeCoach(); closeMenus(); closeSide(false); SH.render(); window.scrollTo(0, 0); $('#main').focus({ preventScroll: true }); });
  E.subscribe(() => SH.render());
  window.addEventListener('error', ev => { console.error('[AH]', ev.message); });
  AH.applyTheme(); AH.applyMotion();
  document.documentElement.lang = AH.S.prefs.lang;
  $('#sidebar').insertAdjacentHTML('afterbegin', C.stars(42, 3, 0.45));
  if (!location.hash) history.replaceState(null, '', '#/' + SH.home());
  SH.render();
})(window.AH = window.AH || {});
