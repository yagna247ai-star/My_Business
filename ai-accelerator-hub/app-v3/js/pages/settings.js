/* AI Accelerator Hub v3 — settings: appearance, language, notifications, privacy (DPDP), demo controls */
(function (AH) {
  'use strict';
  const { U, D, E, C, SH } = AH; const { esc, ic } = U;
  const R = AH.ROUTES, A = AH.A;
  const sw = (key, on, label) => `<button class="switch" type="button" role="switch" aria-checked="${on}" aria-label="${esc(label)}" data-action="pref" data-key="${key}"></button>`;
  const seg = (key, cur, opts, label) => `<div class="seg-sm" role="radiogroup" aria-label="${esc(label)}">${opts.map(([v, l]) => `<button type="button" role="radio" aria-checked="${cur === v}" tabindex="${cur === v ? 0 : -1}" data-action="prefSet" data-key="${key}" data-v="${v}">${esc(l)}</button>`).join('')}</div>`;

  R.settings = {
    roles: ['learner', 'reviewer', 'pm'], icon: 'settings', keywords: 'preferences privacy language theme notifications',
    render() {
      const p = AH.S.prefs, learner = AH.S.role === 'learner', theme = U.store.get('ah3_theme', 'system');
      return `${C.header({ title: AH.t('settings'), desc: `Signed in as ${esc(E.persona().name)} · ${esc(E.persona().title)} at ${esc(D.WORKSPACE.tenant)}` })}
      <div class="settings">
        <nav class="set-nav" aria-label="Settings sections"><a href="#set-appearance">Appearance</a><a href="#set-notif">Notifications</a>${learner ? '<a href="#set-privacy">Privacy & data</a>' : ''}<a href="#set-demo">Demo controls</a></nav>
        <div class="stack gap-20">
          <section class="card card-pad" id="set-appearance" aria-labelledby="sa"><h2 class="h3" id="sa">Appearance</h2>
            <div class="set-row"><div><b>Theme</b><p>System follows your device setting.</p></div>${seg('theme', theme, [['light', 'Light'], ['dark', 'Dark'], ['system', 'System']], 'Theme')}</div>
            <div class="set-row"><div><b>Motion</b><p>Reduced turns off floating cards, confetti and orbit animation.</p></div>${seg('motion', p.motion, [['system', 'System'], ['reduced', 'Reduced'], ['full', 'Full']], 'Motion')}</div>
            <div class="set-row"><div><b>Language</b><p>Navigation and key actions switch instantly. Your progress is never affected.</p></div><label class="sr-only" for="setLang">Language</label><select class="select" id="setLang" style="width:auto" data-change="langSet">${AH.LANGS.map(l => `<option value="${l.code}" ${p.lang === l.code ? 'selected' : ''}>${esc(l.label)}</option>`).join('')}</select></div>
            <div class="set-row"><div><b>Sound effects</b><p>Short chimes for XP, likes and level-ups.</p></div>${sw('sound', p.sound, 'Sound effects')}</div>
          </section>
          <section class="card card-pad" id="set-notif" aria-labelledby="sn"><h2 class="h3" id="sn">Notifications</h2>
            <div class="set-row"><div><b>Streak reminders</b><p>Freeze used, streak at risk, recovery available. Never more than one a day.</p></div>${sw('notif.streak', p.notif.streak, 'Streak reminders')}</div>
            <div class="set-row"><div><b>Review updates</b><p>When your proof is received, approved or needs changes.</p></div>${sw('notif.reviews', p.notif.reviews, 'Review updates')}</div>
            <div class="set-row"><div><b>Community replies</b><p>Replies and reactions on your posts.</p></div>${sw('notif.community', p.notif.community, 'Community replies')}</div>
            <div class="set-row"><div><b>Quiet hours</b><p>No push or email between 10 pm and 8 am IST.</p></div>${sw('notif.quiet', p.notif.quiet, 'Quiet hours')}</div>
          </section>
          ${learner ? `<section class="card card-pad" id="set-privacy" aria-labelledby="sp"><h2 class="h3" id="sp">Privacy & data</h2>
            <div class="set-row"><div><b>Show my name in cohort standings</b><p>Off shows you as "Anonymous learner". Your XP still counts for cohort analytics.</p></div>${sw('lbVisible', p.lbVisibility !== 'private', 'Show my name in standings')}</div>
            <div class="set-row"><div><b>Global standings</b><p>Share your name, city and XP with learners in other institutions. Withdraw any time.</p></div>${sw('globalOptIn', p.globalOptIn, 'Global standings consent')}</div>
            <div class="set-row"><div><b>Download my data</b><p>Everything we hold about you — progress, XP ledger, submissions, posts — as JSON.</p></div><button class="btn btn-outline btn-sm" type="button" data-action="exportData">${ic('download', 'ic-sm')}Download</button></div>
            <div class="set-row"><div><b>Delete my account</b><p>Starts a 30-day deletion request. Your institution is told; certificates already issued stay valid.</p></div><button class="btn btn-outline btn-sm" type="button" data-action="deleteAccount" style="color:var(--danger)">Request deletion</button></div>
          </section>` : ''}
          <section class="card card-pad" id="set-demo" aria-labelledby="sd"><h2 class="h3" id="sd">Demo controls</h2><p class="muted small" style="margin-top:2px">This workspace runs on local demo data so every flow can be tried end to end.</p>
            <div class="set-row"><div><b>Simulate a missed day</b><p>See the non-punitive streak: freeze → grace → recovery. Current: ${esc(AH.S.streak.status)}, ${AH.S.streak.current} days, ${U.plural(AH.S.streak.freezes, 'freeze')}.</p></div><button class="btn btn-outline btn-sm" type="button" data-action="missDay">Miss a day</button></div>
            <div class="set-row"><div><b>Simulate AI provider outage</b><p>Coaches fail gracefully and point to human help.</p></div>${sw('aiOutage', p.aiOutage, 'Simulate AI outage')}</div>
            <div class="set-row"><div><b>Reset all demo data</b><p>Restores the starting state for every role.</p></div><button class="btn btn-outline btn-sm" type="button" data-action="resetDemo">${ic('refresh', 'ic-sm')}Reset</button></div>
          </section>
        </div>
      </div>`;
    }
  };

  A.pref = el => {
    const k = el.dataset.key;
    E.commit(s => {
      const p = s.prefs;
      if (k.startsWith('notif.')) p.notif[k.slice(6)] = !p.notif[k.slice(6)];
      else if (k === 'lbVisible') { p.lbVisibility = p.lbVisibility === 'private' ? 'cohort' : 'private'; E.audit('privacy.leaderboard_visibility', p.lbVisibility); }
      else if (k === 'globalOptIn') { p.globalOptIn = !p.globalOptIn; E.audit('consent.global_leaderboard', p.globalOptIn ? 'granted' : 'withdrawn'); }
      else p[k] = !p[k];
      E.track('settings.changed', { key: k });
    });
    AH.applyMotion();
    const again = U.$(`[data-action="pref"][data-key="${k}"]`); if (again) again.focus();
  };
  A.prefSet = el => {
    const k = el.dataset.key, v = el.dataset.v;
    if (k === 'theme') { U.store.set('ah3_theme', v); AH.applyTheme(); SH.render(); }
    else { E.commit(s => { s.prefs[k] = v; }); AH.applyMotion(); }
    const again = U.$(`[data-action="prefSet"][data-key="${k}"][data-v="${v}"]`); if (again) again.focus();
  };
  A.langSet = el => { E.commit(s => { s.prefs.lang = el.value; }); document.documentElement.lang = el.value; };
  A.exportData = () => { U.download(`ai-accelerator-hub-my-data-${U.istDay()}.json`, E.exportMyData()); E.commit(() => E.audit('privacy.data_exported', E.me().name)); C.toast('Your data export has downloaded.'); };
  A.deleteAccount = () => C.dialog({ title: 'Request account deletion?', body: 'We will delete your personal data within 30 days and confirm by email. In this demo, nothing is deleted.', confirm: 'Request deletion', danger: true, onConfirm: () => { E.commit(() => E.audit('privacy.deletion_requested', E.me().name)); C.toast('Deletion request recorded. You can cancel it within 7 days.'); } });
  A.missDay = () => { E.commit(() => E.simulateMissedDay()); C.toast(`Streak is now: ${AH.S.streak.status}.`); };
})(window.AH = window.AH || {});
