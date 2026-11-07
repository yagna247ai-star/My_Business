/* AI Accelerator Hub v3 — learner experience */
(function (AH) {
  'use strict';
  const { U, D, E, C, SH, t } = AH; const { esc, ic, $, $$ } = U;
  const P = (AH.P = AH.P || {});
  const R = AH.ROUTES, A = AH.A;
  const L = ['learner'];
  P.draft = P.draft || { quiz: {}, a3: {}, a1: null, proof: null };

  /* ======================= MISSION CONTROL ======================= */
  function greeting() {
    const h = new Date(Date.now() + 5.5 * 3600000).getUTCHours();
    return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  }
  P.nextBestAction = () => {
    const p = AH.S.progress, a = p.acts;
    if (AH.S.streak.status === 'recovery') return { icon: 'pause', title: `Recover your ${AH.S.streak.prev}-day streak`, body: 'One 2-minute quick win brings it back. No penalty, no reset.', cta: 'Start quick win', action: 'quickWin' };
    if (p.levels[1] === 'approved') return { icon: 'compass', title: 'Level 1 is done — explore where it leads', body: 'Level 2 opens as soon as your program team publishes it. Meanwhile, shortlist the career tracks that excite you.', cta: 'Explore tracks', href: '#/tracks' };
    if (a[6] === 'needs_changes') return { icon: 'refresh', title: 'Your reviewer asked for changes', body: 'Read the feedback, improve your proof and resubmit. You keep every XP you earned.', cta: 'Open feedback', href: '#/journey/1/5' };
    if (a[6] === 'in_review' && p.boss.best < 3) return { icon: 'trophy', title: 'While your proof is reviewed, beat the Mould Trial', body: `Boss challenge: ${p.boss.attempts}/${D.L1.acts[6].attempts} attempts used. A 3/3 pass adds +${D.L1.acts[6].bossXp} XP on approval.`, cta: 'Take on the Boss', href: '#/journey/1/6' };
    if (a[6] === 'in_review') return { icon: 'clock', title: 'Your proof is with a reviewer', body: `Target turnaround: under ${D.WORKSPACE.reviewSlaHours} hours. You will get a notification the moment it's decided.`, cta: 'View status', href: '#/journey/1/6' };
    const n = [1, 2, 3, 4, 5].find(k => a[k] === 'available') || 1;
    const at = D.ACTIVITY_TYPES[n - 1], act = D.L1.acts[n];
    return { icon: at.icon, title: `${at.name}: ${act.title}`, body: `Level 1 · activity ${n} of 6 · +${act.xp} XP`, cta: t('continue'), href: `#/journey/1/${n}` };
  };
  function agSpace() {
    const xp = E.xp(), lv = D.LEVELS[0], me = E.myPos(), st = AH.S.streak, sv = SH.streakView();
    const levelXp = AH.S.ledger.filter(e => /L01|L1/.test(e.idem + e.ref) && e.source !== 'badge_bonus').reduce((s, e) => s + e.amount, 0);
    const dots = D.LEVELS.map((l, i) => `<i class="${l.idx === 1 ? 'cur' : ''}" style="transform:rotate(${(i / 15) * 360}deg) translateY(-150px)"></i>`).join('');
    return `<div class="ag-space">
      ${C.stars(54, 11)}
      <div class="ag-glow" aria-hidden="true"></div><div class="ag-ring r1" aria-hidden="true"></div><div class="ag-ring r2" aria-hidden="true"></div>
      <div class="ag-orbit" aria-hidden="true">${dots}</div>
      <div class="ag-planet-wrap" aria-hidden="true"><div class="ag-planet"><div><div class="k">${AH.S.progress.levels[1] === 'approved' ? 'COMPLETE' : 'CURRENT'}</div><div class="lv">L01</div><div class="nm">AWAKENING</div><div class="xp">${Math.min(levelXp, lv.xp)} / ${lv.xp} XP</div></div></div></div>
      <div class="ag-card ag-c1"><div class="k">XP balance</div><div class="v">${U.fmt(xp)}<small>XP</small></div>
        <div class="mbar"><i style="width:${Math.max(3, Math.min(100, (levelXp / lv.xp) * 100))}%"></i></div><div class="s">${E.tier().name} tier · ledger verified</div></div>
      <div class="ag-card ag-c2"><div class="k">Streak</div><div class="v"><span class="flame">${ic(sv.icon, 'ic-sm')}</span>${st.current}<small>days</small></div>
        <div class="s">${st.status === 'active' ? `Longest ${st.longest} · ${U.plural(st.freezes, 'freeze')}` : esc(sv.word.replace(' · ', ''))}</div></div>
      <div class="ag-card ag-c3"><div class="k">Cohort standing</div><div class="v">#${me.pos}<small>of ${me.total}</small></div>
        <div class="mbar blue"><i style="width:${Math.max(3, ((me.total - me.pos + 1) / me.total) * 100)}%"></i></div><a href="#/standings">View standings ${ic('arrowRight', 'ic-sm')}</a></div>
      <span class="ag-meta" aria-hidden="true">${esc(D.WORKSPACE.cohort)}</span>
    </div>`;
  }
  function weekStrip() {
    const today = new Date(Date.now() + 5.5 * 3600000); const dow = (today.getUTCDay() + 6) % 7; // Mon=0
    const st = AH.S.streak; const lastDiff = U.dayDiff(st.lastDay, U.istDay());
    return `<div class="week" role="list">${D.WEEK.map((w, i) => {
      const date = new Date(today.getTime() + (i - dow) * U.DAY);
      const back = dow - i; // days ago
      const counted = st.status !== 'recovery' && back >= lastDiff && back < lastDiff + st.current;
      return `<div class="day ${i === dow ? 'today' : ''} ${w.event ? 'event' : ''} ${counted ? 'done-day' : ''}" role="listitem" aria-label="${w.d} ${date.getUTCDate()}: ${esc(w.e)}${counted ? ', streak day' : ''}${i === dow ? ', today' : ''}">
        <span class="dn">${w.d}${i === dow ? ' · today' : ''}</span><span class="dd">${date.getUTCDate()}</span><span class="de">${esc(w.e)}</span></div>`;
    }).join('')}</div>`;
  }
  function journeyRail() {
    const lv = AH.S.progress.levels;
    return `<div class="rail-scroll" tabindex="0" aria-label="15-level journey, scroll sideways"><ol class="jrail" style="list-style:none;margin:0">${D.LEVELS.map(l => {
      const s = lv[l.idx], cls = s === 'approved' ? 'done' : (s === 'in_progress' || s === 'available') ? 'current' : '';
      const inner = s === 'approved' ? ic('check', 'ic-sm') : cls ? String(l.idx).padStart(2, '0') : ic('lock', 'ic-sm');
      return `<li class="jnode ${cls}"><a href="#/journey/${l.idx}" class="jdot" aria-label="Level ${l.idx} ${esc(l.title)}, ${s.replace('_', ' ')}">${inner}</a><span class="jl">${esc(l.short)}</span><span class="jx">${l.xp} XP</span></li>`;
    }).join('')}</ol></div>`;
  }
  R.mission = {
    roles: L, icon: 'rocket', keywords: 'home dashboard',
    render() {
      const nba = P.nextBestAction(), st = AH.S.streak, sv = SH.streakView(), p = AH.S.progress;
      const done = Object.values(p.acts).filter(s => s === 'completed').length;
      const nextBadge = D.BADGES.find(b => !AH.S.badges[b.code]);
      const pulse = AH.S.posts.filter(x => x.status === 'live').slice(0, 2);
      return `
      ${C.header({ title: `${greeting()}, ${esc(E.me().first)}`, desc: `${esc(D.WORKSPACE.cohort)} · ${esc(D.WORKSPACE.tenant)} · Stage 1 of 5: Ignition` })}
      <div class="grid-12">
        <section class="card ag-hero span-12" aria-labelledby="nbaT">
          <div class="ag-left">
            <div class="section-label">Next best action</div>
            <div class="nba"><span class="ic-tile" aria-hidden="true">${ic(nba.icon)}</span><div style="min-width:0"><h2 class="h2" id="nbaT">${esc(nba.title)}</h2><p class="text-2 small" style="margin-top:4px">${esc(nba.body)}</p></div></div>
            <div class="row gap-12 wrap">
              ${nba.action ? `<button class="btn btn-gold" type="button" data-action="${nba.action}">${esc(nba.cta)} ${ic('arrowRight', 'ic-sm')}</button>` : `<a class="btn btn-gold" href="${nba.href}">${esc(nba.cta)} ${ic('arrowRight', 'ic-sm')}</a>`}
              <button class="btn btn-outline" type="button" data-action="openCoach" data-coach="concept-explainer">${ic('lifebuoy', 'ic-sm')}${esc(t('askCoach'))}</button>
            </div>
            <div style="margin-top:auto;padding-top:18px;border-top:1px solid var(--border)">
              ${C.bars([{ label: 'Level 1 activities', value: done, max: 6, text: `${done} of 6` }, { label: 'Journey', value: E.approvedLevels().length, max: 15, text: `${E.approvedLevels().length} of 15 levels approved`, blue: true }])}
            </div>
          </div>
          ${agSpace()}
        </section>

        <section class="card card-pad span-12" aria-labelledby="weekT">
          <div class="row between wrap gap-8" style="margin-bottom:14px"><h2 class="h3" id="weekT">This week</h2><span class="muted small">Mon–Fri prep · Saturday workshop · Sunday 4-hour build sprint</span></div>
          ${weekStrip()}
        </section>

        <section class="card card-pad span-4 stack gap-12 lift" aria-labelledby="stT">
          <h2 class="section-label" id="stT">Streak</h2>
          <div class="row gap-12"><span class="pill pill-streak ${sv.cls}" style="height:40px">${ic(sv.icon, 'ic-sm')}<b>${st.current}</b></span><div><b>${{ active: 'On a roll', frozen: 'Protected by a freeze', grace: 'At risk — 48 h grace', recovery: 'Paused, not lost' }[st.status]}</b><p class="muted small">Longest ${st.longest} · ${U.plural(st.freezes, 'freeze token')}</p></div></div>
          <p class="text-2 small">${{ active: 'A day counts when you finish a real activity. Every 7 days earns a freeze token.', frozen: 'You missed a day, so a freeze token kept your streak safe.', grace: 'Finish any activity by tomorrow midnight (IST) to keep it going.', recovery: `Recover all ${st.prev} days with a 2-minute quick win, any time in the next 7 days.` }[st.status]}</p>
          ${st.status === 'recovery' ? `<button class="btn btn-gold btn-sm" type="button" data-action="quickWin">Start quick win</button>` : ''}
        </section>
        <section class="card card-pad span-4 stack gap-12 lift" aria-labelledby="bdT">
          <h2 class="section-label" id="bdT">Next badge</h2>
          ${nextBadge ? `<div class="row gap-12"><span class="avatar" style="font-size:22px" aria-hidden="true">${nextBadge.icon}</span><div><b>${esc(nextBadge.name)}</b><p class="muted small">${esc(nextBadge.desc)} · +${nextBadge.xp} XP</p></div></div>` : '<p>Every badge earned. Legendary.</p>'}
          <a class="link small" href="#/achievements">All achievements ${ic('arrowRight', 'ic-sm')}</a>
        </section>
        <section class="card card-pad span-4 stack gap-12 lift" aria-labelledby="pT">
          <h2 class="section-label" id="pT">Cohort pulse</h2>
          ${pulse.map(x => `<div class="row gap-12" style="align-items:flex-start"><span class="avatar avatar-xs" aria-hidden="true">${U.initials(E.whoName(x.who))}</span><p class="small"><b>${esc(E.whoName(x.who))}</b> <span class="text-2">${esc(x.text.slice(0, 80))}${x.text.length > 80 ? '…' : ''}</span></p></div>`).join('')}
          <a class="link small" href="#/feed">Open feed ${ic('arrowRight', 'ic-sm')}</a>
        </section>

        <section class="card card-pad span-12" aria-labelledby="jrT">
          <div class="row between wrap gap-8"><h2 class="h3" id="jrT">Your 15-level journey</h2><a class="link small" href="#/journey">Open journey ${ic('arrowRight', 'ic-sm')}</a></div>
          ${journeyRail()}
          <div class="stages">${D.STAGES.map(s => `<span class="badge badge-neutral">${s.name} · ${s.from}–${s.to}</span>`).join('')}</div>
        </section>
      </div>`;
    }
  };
  A.quickWin = () => {
    C.dialog({
      title: 'Quick win: one question',
      body: `<fieldset class="q" style="border:0"><legend>Which line creates an object from the class <code>Cookie</code>?</legend>
        ${['class Cookie:', 'star = Cookie("star")', 'oven_temp = 180'].map((o, i) => `<label class="opt"><input type="radio" name="qw" value="${i}">${esc(o)}</label>`).join('')}</fieldset><p class="field-err" id="qwErr" hidden>Not quite — that line ${'defines'} something. Try again.</p>`,
      confirm: 'Check', onConfirm: dlg => {
        const v = (U.$('input[name="qw"]:checked', dlg) || {}).value;
        if (v !== '1') { U.$('#qwErr', dlg).hidden = false; return false; }
        E.commit(() => E.recoverStreak()); C.chime(); C.toast('Streak recovered. Welcome back!');
      }
    });
  };

  /* ======================= JOURNEY ======================= */
  const levelStatus = idx => AH.S.progress.levels[idx];
  R.journey = {
    roles: L, icon: 'map', keywords: 'levels stages activities',
    crumb: ps => ps[0] ? `Level ${ps[0]}${ps[1] ? ` · ${D.ACTIVITY_TYPES[+ps[1] - 1] ? D.ACTIVITY_TYPES[+ps[1] - 1].name : ''}` : ''}` : t('journey'),
    render(ps) { return ps[0] ? P.levelView(+ps[0], +ps[1] || 0) : journeyOverview(); },
    after(ps) { if (ps[0]) P.levelAfter(+ps[0], +ps[1] || 0); }
  };
  function journeyOverview() {
    const lv = AH.S.progress.levels, cur = D.stageOf(1);
    return `
    ${C.header({ variant: 'cream', eyebrow: 'Your journey', title: 'Five stages. Fifteen levels. One portfolio.', desc: 'Levels unlock on proof, never on time spent. Every level ends with something you built, scored by a human reviewer on a published rubric.' })}
    <section aria-labelledby="stgT" style="margin-bottom:26px">
      <h2 class="h3" id="stgT" style="margin-bottom:12px">Stages and their exit gates</h2>
      <div class="stage-strip">${D.STAGES.map(s => `<div class="stage ${s === cur ? 'current' : ''}"><div class="section-label">Levels ${s.from}–${s.to} · ${esc(s.metaphor)}</div><div class="sname" style="margin-top:4px">${esc(s.name)}</div><p class="gate-t">${ic('target', 'ic-sm')} ${esc(s.gate)}</p></div>`).join('')}</div>
    </section>
    <section aria-labelledby="lvT">
      <div class="row between wrap gap-8" style="margin-bottom:12px"><h2 class="h3" id="lvT">All levels</h2><span class="muted small">${E.approvedLevels().length} of 15 approved · Levels 11–13 branch into your chosen track</span></div>
      <div class="lv-grid">${D.LEVELS.map(l => {
        const s = lv[l.idx];
        const st = { approved: `${ic('checkCircle', 'ic-sm')}Approved`, in_progress: `${ic('clock', 'ic-sm')}In progress · ${Object.values(AH.S.progress.acts).filter(x => x === 'completed').length}/6`, available: `${ic('unlock', 'ic-sm')}Unlocked`, locked: `${ic('lock', 'ic-sm')}${l.idx === 1 ? '' : `After Level ${l.idx - 1} is approved`}` }[s];
        const inner = `<span class="code">L${String(l.idx).padStart(2, '0')} · ${l.xp} XP · ${esc(l.effort)}</span><span class="nm">${esc(l.title)}</span><span class="muted xs">${esc(l.sub)}${l.idx === 11 ? ' · choose your track' : ''}</span><span class="st">${st}</span>`;
        return s === 'locked'
          ? `<div class="lv-tile locked" aria-label="Level ${l.idx}, ${esc(l.title)}, locked until Level ${l.idx - 1} is approved">${inner}</div>`
          : `<a class="lv-tile ${s === 'approved' ? '' : 'current'} lift" href="#/journey/${l.idx}" aria-label="Level ${l.idx}, ${esc(l.title)}, ${s.replace('_', ' ')}">${inner}</a>`;
      }).join('')}</div>
    </section>`;
  }

  /* ---------- Level view ---------- */
  P.levelView = (idx, n) => {
    const l = D.LEVELS[idx - 1]; if (!l) return C.empty('map', 'Level not found');
    const s = levelStatus(idx);
    if (s === 'locked') return C.empty('lock', `Level ${idx} is locked`, `It unlocks when Level ${idx - 1} is approved by a reviewer. Time spent never unlocks a level — proof does.`, `<a class="btn btn-gold btn-sm" style="margin-top:16px" href="#/journey">Back to journey</a>`);
    if (idx !== 1) return C.header({ eyebrow: `Level ${idx} · ${D.stageOf(idx).name}`, title: `${esc(l.title)}: ${esc(l.sub)}`, desc: esc(l.capability) }) +
      C.empty('scroll', 'Unlocked — activities are being authored', 'Your program team publishes each level\'s six activities after review. You\'ll get a notification the moment they\'re live. Nothing here is placeholder content.', `<div class="row gap-8" style="justify-content:center;margin-top:16px"><a class="btn btn-gold btn-sm" href="#/tracks">Explore career tracks</a><a class="btn btn-outline btn-sm" href="#/library">Revisit Level 1 in the Library</a></div>`);
    const p = AH.S.progress, acts = p.acts;
    const cur = n || p.lastAct || 1;
    const done = Object.values(acts).filter(x => x === 'completed').length;
    const lvlXp = AH.S.ledger.filter(e => /:L01/.test(e.idem)).reduce((a, e) => a + e.amount, 0);
    const label = { completed: 'Done', available: 'Open', locked: 'Locked', in_review: 'In review', needs_changes: 'Changes requested' };
    return `
    <section class="card card-pad" aria-labelledby="pageTitle">
      <div class="lv-head">
        <div class="ring" style="--p:${Math.round((done / 6) * 100)}" role="img" aria-label="${done} of 6 activities complete"><span>${done}/6<small>DONE</small></span></div>
        <div style="min-width:0"><div class="section-label">Level 1 · Ignition · ${esc(l.code)}</div><h1 class="h2" id="pageTitle" style="font-size:26px">${esc(l.title)}: ${esc(l.sub)}</h1><p class="text-2 small" style="margin-top:4px">Think in objects — the mental model behind every agent, tool and RAG chunk.</p></div>
        <div class="row gap-8 wrap lv-head-meta"><span class="badge badge-gold">${lvlXp} / ${l.xp} XP</span><span class="badge badge-neutral">${esc(l.effort)}</span><button class="btn btn-outline btn-sm" type="button" data-action="showRubric">${ic('target', 'ic-sm')}Rubric</button></div>
      </div>
      <ol class="stepper" aria-label="Level 1 activities">${D.ACTIVITY_TYPES.map(at => {
        const st = acts[at.n];
        return `<li class="step ${st}" ${at.n === cur ? 'aria-current="step"' : ''}><button type="button" data-action="gotoStep" data-n="${at.n}" ${st === 'locked' ? 'disabled' : ''} aria-label="Activity ${at.n}: ${at.name}, ${label[st]}">
          <span class="sn"><i>${st === 'completed' ? '✓' : at.n}</i>${label[st]}</span><span class="st">${at.name}</span></button></li>`;
      }).join('')}</ol>
      <div class="panel-grid">
        <div id="actPanel">${P.actPanel(cur)}</div>
        <aside class="card aside-card" aria-label="Level facts">
          <h2 class="section-label" style="margin-bottom:6px">Level facts</h2>
          <div class="kv"><span>XP in this level</span><span>${lvlXp} of ${l.xp}</span></div>
          <div class="kv"><span>Proof attempts</span><span>${AH.S.submissions.length}</span></div>
          <div class="kv"><span>Boss attempts</span><span>${p.boss.attempts} of ${D.L1.acts[6].attempts}</span></div>
          <div class="kv"><span>Pass rule</span><span>Avg ≥ 3.0 and Boss ≥ 2</span></div>
          <div class="kv"><span>Review target</span><span>&lt; ${D.WORKSPACE.reviewSlaHours} h</span></div>
          <button class="btn btn-soft btn-sm btn-block" style="margin-top:14px" type="button" data-action="openCoach" data-coach="${cur >= 4 ? 'code-mentor' : 'concept-explainer'}" data-ctx="Level 1 · ${esc(D.ACTIVITY_TYPES[cur - 1].name)}">${ic('lifebuoy', 'ic-sm')}Ask about this step</button>
        </aside>
      </div>
    </section>`;
  };
  A.gotoStep = el => SH.go(`#/journey/1/${el.dataset.n}`);
  A.showRubric = () => C.dialog({
    title: 'How Level 1 is scored', wide: true, cancel: 'Close',
    body: `<p class="small">Rubric ${D.RUBRIC.code}. A human reviewer scores 1–5 per area. You pass with a weighted average of <b>3.0</b> or more <b>and</b> at least <b>2</b> on the Boss challenge.</p>
      <div class="table-wrap" style="margin-top:12px"><table class="tbl"><thead><tr><th>Area</th><th>Weight</th><th>3 — Meets</th><th>5 — Exceeds</th></tr></thead><tbody>
      ${D.RUBRIC.dims.map(d => `<tr><td class="bold">${esc(d.name)}</td><td class="num">${Math.round(d.weight * 100)}%</td><td class="small">${esc(d.l3)}</td><td class="small">${esc(d.l5)}</td></tr>`).join('')}</tbody></table></div>`
  });

  /* ---------- Activity panels ---------- */
  const actHead = (n, extra = '') => { const at = D.ACTIVITY_TYPES[n - 1], a = D.L1.acts[n]; return `<div class="row between wrap gap-8" style="margin-bottom:14px"><div><div class="section-label">Activity ${n} · ${esc(at.verb)}</div><h2 class="h2">${esc(at.name)}: ${esc(a.title)}</h2></div><div class="row gap-8">${extra}<span class="badge badge-gold">+${a.xp} XP</span></div></div>`; };
  const doneNote = (n, text) => AH.S.progress.acts[n] === 'completed' ? `<div class="callout ok" style="margin-top:16px">${ic('checkCircle')}<div><b>Completed</b>${text}</div></div>` : '';
  P.actPanel = n => {
    const st = AH.S.progress.acts[n];
    if (st === 'locked') return C.empty('lock', 'Finish the previous activity first', 'Forward progress is gated. You can always revisit earlier activities.');
    return ({ 1: a1, 2: a2, 3: a3, 4: a4, 5: a5, 6: a6 })[n]();
  };
  function a1() {
    const a = D.L1.acts[1], sel = P.draft.a1 != null ? P.draft.a1 : (AH.S.progress.acts[1] === 'completed' ? AH.S.progress.a1 : null);
    return `${actHead(1)}
      <p style="font-size:16px">${esc(a.story)}</p>
      <h3 class="h3" style="margin:18px 0 8px">You'll succeed when you can…</h3>
      <ul class="checklist">${a.criteria.map(c => `<li>${ic('target', 'ic-sm')}<span>${esc(c)}</span></li>`).join('')}</ul>
      <div class="q" style="margin-top:18px"><fieldset><legend>${esc(a.check.q)}</legend>
        ${a.check.options.map((o, i) => `<label class="opt ${sel != null && i === sel ? (i === a.check.answer ? 'correct' : 'wrong') : ''}"><input type="radio" name="a1" value="${i}" ${sel === i ? 'checked' : ''} data-change="a1Pick">${esc(o)}</label>`).join('')}
      </fieldset>${sel != null ? `<p class="q-feedback ${sel === a.check.answer ? 'ok' : 'no'}">${sel === a.check.answer ? 'Exactly. ' : 'Close — here\'s the idea: '}${esc(a.check.why)}</p>` : ''}</div>
      <div class="row gap-12 wrap" style="margin-top:16px">${AH.S.progress.acts[1] === 'completed' ? `<a class="btn btn-gold" href="#/journey/1/2">Next: Learn ${ic('arrowRight', 'ic-sm')}</a>` : `<button class="btn btn-gold" type="button" data-action="a1Done" ${sel == null ? 'disabled' : ''}>Mark briefing complete</button>`}</div>
      ${doneNote(1, 'You know the mission. The mould awaits.')}`;
  }
  A.a1Pick = el => { P.draft.a1 = +el.value; SH.render(); const r = $('input[name="a1"]:checked'); if (r) r.focus(); };
  A.a1Done = () => { E.commit(s => { s.progress.a1 = P.draft.a1; const r = E.completeActivity(1); if (r.entry) C.toast(`+${r.entry.amount} XP — Mission Briefing complete`); }); SH.go('#/journey/1/2'); };

  function a2() {
    const a = D.L1.acts[2], done = AH.S.progress.acts[2] === 'completed';
    const ans = Object.keys(P.draft.quiz).length ? P.draft.quiz : (done ? AH.S.progress.quiz : {});
    const graded = P.draft.graded || (done && !Object.keys(P.draft.quiz).length && !P.draft.retake);
    return `${actHead(2)}
      <div class="grid2" style="gap:14px">${a.lessons.map((ls, i) => `<details class="card card-pad" ${i === 0 ? 'open' : ''}><summary class="row gap-12" style="cursor:pointer;list-style:none"><span class="res-ic" aria-hidden="true">${ic(ls.kind === 'video' ? 'play' : 'file')}</span><span><b>${esc(ls.title)}</b><span class="muted xs" style="display:block">${ls.kind === 'video' ? 'Video' : 'Notes'} · ${esc(ls.meta)}</span></span></summary><p class="text-2" style="margin-top:12px">${esc(ls.body)}</p>${ls.kind === 'video' ? '<p class="muted xs" style="margin-top:8px">Transcript shown. Captions are available on every lesson video.</p>' : ''}</details>`).join('')}</div>
      <h3 class="h3" style="margin:22px 0 10px">Check your understanding · pass at ${a.passPct}%</h3>
      <form class="stack gap-12" data-form="quiz">${a.quiz.map((q, qi) => `<div class="q"><fieldset><legend>${qi + 1}. ${esc(q.q)}</legend>
        ${q.options.map((o, i) => { const chosen = ans[qi] === i; const cls = graded && chosen ? (i === q.answer ? 'correct' : 'wrong') : ''; return `<label class="opt ${cls}"><input type="radio" name="q${qi}" value="${i}" ${chosen ? 'checked' : ''} data-change="quizPick" data-q="${qi}">${esc(o)}</label>`; }).join('')}
      </fieldset></div>`).join('')}
        <div class="row gap-12 wrap">${done && !P.draft.retake ? `<a class="btn btn-gold" href="#/journey/1/3">Next: Explore GitHub ${ic('arrowRight', 'ic-sm')}</a><button class="btn btn-outline" type="button" data-action="quizRetake">Retake (no extra XP)</button>` : `<button class="btn btn-gold" type="submit">Submit answers</button>`}
        <span class="muted small" aria-live="polite">${P.draft.result || (done ? `Last score: ${AH.S.progress.quizScore}%` : '')}</span></div>
      </form>
      ${doneNote(2, `Quiz passed with ${AH.S.progress.quizScore}%.`)}`;
  }
  A.quizPick = el => { P.draft.quiz[+el.dataset.q] = +el.value; P.draft.graded = false; };
  A.quizRetake = () => { P.draft.quiz = {}; P.draft.graded = false; P.draft.result = ''; P.draft.retake = true; SH.render(); };

  function a3() {
    const a = D.L1.acts[3], done = AH.S.progress.acts[3] === 'completed', ans = P.draft.a3;
    const hl = a.questions.filter((q, i) => ans[i] === q.answer).map(q => q.line);
    return `${actHead(3)}
      <p class="text-2">Read the reference repo before you build. Run it locally if you can — then answer two code-reading questions.</p>
      <div class="row gap-8 wrap" style="margin:14px 0"><span class="badge badge-neutral">${ic('github', 'ic-sm')} ${esc(a.repo)}</span><span class="badge badge-neutral">${ic('terminal', 'ic-sm')} python ${esc(a.file)}</span></div>
      <div class="code"><div class="code-head"><span>${esc(a.file)}</span><span>Python</span></div><pre>${a.code.map((ln, i) => `<span class="ln ${hl.includes(i + 1) ? 'hl' : ''}">${U.highlightPy(ln) || ' '}</span>`).join('')}</pre></div>
      <form class="stack gap-12" style="margin-top:16px" data-form="a3">${a.questions.map((q, qi) => `<div class="q"><fieldset><legend>${esc(q.q)}</legend>${q.options.map((o, i) => { const c = P.draft.a3graded && ans[qi] === i ? (i === q.answer ? 'correct' : 'wrong') : ''; return `<label class="opt ${c}"><input type="radio" name="c${qi}" value="${i}" ${ans[qi] === i ? 'checked' : ''} data-change="a3Pick" data-q="${qi}">${esc(o)}</label>`; }).join('')}</fieldset></div>`).join('')}
        <div class="row gap-12 wrap">${done ? `<a class="btn btn-gold" href="#/journey/1/4">Next: Build ${ic('arrowRight', 'ic-sm')}</a>` : `<button class="btn btn-gold" type="submit">Check answers</button>`}<span class="muted small" aria-live="polite">${P.draft.a3msg || `At least ${a.passMin} of ${a.questions.length} correct to continue.`}</span></div>
      </form>${doneNote(3, 'You read the repo like an engineer.')}`;
  }
  A.a3Pick = el => { P.draft.a3[+el.dataset.q] = +el.value; P.draft.a3graded = false; };

  function editor(id, code, label) {
    return `<div class="code"><div class="code-head"><label for="${id}">${esc(label)}</label><span>Tab inserts 4 spaces</span></div>
      <textarea id="${id}" class="mono" spellcheck="false" autocapitalize="off" autocomplete="off" data-editor style="width:100%;min-height:280px;border:0;background:transparent;color:#E6EAF5;padding:14px 16px;font-size:13.5px;line-height:1.65;resize:vertical;outline:none">${esc(code)}</textarea></div>`;
  }
  function termOut(results, title) {
    if (!results) return `<div class="term" aria-live="polite"><span class="dim">$ ${esc(title)}\nRun the tests to see results here.</span></div>`;
    const passed = results.filter(r => r.pass).length;
    return `<div class="term" role="status" aria-live="polite"><span class="dim">$ ${esc(title)}</span>\n${results.map(r => `${r.pass ? '<span class="ok">PASS</span>' : '<span class="bad">FAIL</span>'}  ${esc(r.name)}${r.pass ? '' : `\n      <span class="dim">hint: ${esc(r.hint)}</span>`}`).join('\n')}\n\n${passed === results.length ? `<span class="ok">${passed} passed</span>` : `<span class="bad">${results.length - passed} failed</span>, ${passed} passed`}</div>`;
  }
  function a4() {
    const a = D.L1.acts[4], p = AH.S.progress, done = p.acts[4] === 'completed';
    const tests = p.tests, allPass = tests && tests.every(x => x.pass);
    return `${actHead(4)}
      <ul class="checklist" aria-label="Build checklist">${a.todos.map((td, i) => { const ok = tests && tests[i] && tests[i].pass; return `<li class="${ok ? 'done' : ''}"><span class="cb" aria-hidden="true">${ic('check', 'ic-sm')}</span><span>${esc(td)}</span><span class="sr-only">${ok ? 'done' : 'not done'}</span></li>`; }).join('')}</ul>
      <div style="margin-top:16px">${editor('buildEd', p.code || E.STARTER, 'cookie.py')}</div>
      <div class="row gap-12 wrap" style="margin:12px 0"><button class="btn btn-ink" type="button" data-action="runBuild">${ic('play', 'ic-sm')}Run tests</button><button class="btn btn-text" type="button" data-action="resetBuild">Reset starter</button><span class="muted xs">Demo: checks run in your browser. In production your pushed commit runs in an isolated pytest runner.</span></div>
      ${termOut(tests, a.harness)}
      <div class="card card-pad" style="margin-top:16px;${allPass ? '' : 'opacity:.6'}" aria-disabled="${!allPass}">
        <h3 class="h3">Link your repository</h3><p class="muted small" style="margin-top:2px">Push your code, then we detect the commit through the GitHub integration.</p>
        <form class="row gap-12 wrap" style="margin-top:12px" data-form="push">
          <label class="sr-only" for="repoIn">Repository URL</label>
          <input class="input" id="repoIn" style="flex:1;min-width:220px" type="url" placeholder="https://github.com/your-name/cookie-factory" value="${esc(p.repo)}" ${allPass && !done ? '' : 'disabled'}>
          <button class="btn btn-gold" type="submit" ${allPass && !done ? '' : 'disabled'}>${ic('commit', 'ic-sm')}Detect my push</button>
        </form>
        ${p.commit ? `<p class="callout ok small" style="margin-top:12px">${ic('github', 'ic-sm')}<span>Commit <b class="mono">${esc(p.commit.sha)}</b> detected on ${esc(p.commit.repo)} · tests 4/4</span></p>` : ''}
      </div>
      ${done ? `<div class="row" style="margin-top:16px"><a class="btn btn-gold" href="#/journey/1/5">Next: Submit proof ${ic('arrowRight', 'ic-sm')}</a></div>` : ''}`;
  }
  A.runBuild = () => {
    const code = $('#buildEd').value;
    E.commit(s => { s.progress.code = code; s.progress.tests = E.runTests(code, E.BUILD_TESTS); });
    const ok = AH.S.progress.tests.every(x => x.pass); C.blip(ok ? 880 : 330);
    C.toast(ok ? 'All 4 tests pass. Link your repo to finish the build.' : 'Some tests failed — the hints show what to change.');
  };
  A.resetBuild = () => C.dialog({ title: 'Reset to the starter file?', body: 'Your current code in this editor will be replaced.', confirm: 'Reset', danger: true, onConfirm: () => E.commit(s => { s.progress.code = E.STARTER; s.progress.tests = null; }) });

  function a5() {
    const a = D.L1.acts[5], p = AH.S.progress, last = AH.S.submissions[0];
    const d = P.draft.proof || (P.draft.proof = { repo: p.repo || '', deploy: '', reflection: '', checks: [false, false, false] });
    const wc = U.wordCount(d.reflection);
    const fb = last && last.state === 'needs_changes' ? `<div class="callout warn" style="margin-bottom:16px">${ic('refresh')}<div><b>Changes requested by ${esc(last.review.by)} · ${last.review.avg.toFixed(2)} / 5</b><span>“${esc(last.review.feedback)}”</span></div></div>` : '';
    const inReview = p.acts[6] === 'in_review' || p.acts[6] === 'completed';
    if (inReview && last) return `${actHead(5)}<div class="callout ok">${ic('checkCircle')}<div><b>Proof submitted ${U.timeTag(last.at)} · attempt ${last.attempt}</b><span>${esc(last.repo)}</span></div></div><div class="row" style="margin-top:16px"><a class="btn btn-gold" href="#/journey/1/6">See review status ${ic('arrowRight', 'ic-sm')}</a></div>`;
    return `${actHead(5)}${fb}
      <form class="stack gap-16" data-form="proof" novalidate>
        <div><label class="field-label" for="pfRepo">Repository link <span class="muted">(required)</span></label><input class="input" id="pfRepo" data-proof="repo" type="url" value="${esc(d.repo)}" placeholder="https://github.com/your-name/cookie-factory" aria-describedby="pfRepoH"><div class="field-hint" id="pfRepoH">Public repo with your cookie.py and a README.</div></div>
        <div><label class="field-label" for="pfDeploy">Demo link <span class="muted">(optional)</span></label><input class="input" id="pfDeploy" data-proof="deploy" type="url" value="${esc(d.deploy)}" placeholder="Loom video, Replit, or deployed URL"></div>
        <div><label class="field-label" for="pfRefl">Reflection <span class="muted">(at least ${a.minWords} words)</span></label><textarea class="textarea" id="pfRefl" data-proof="reflection" rows="6" aria-describedby="pfReflH" placeholder="What confused you about classes vs objects, and how did you fix it? How does this connect to building agents?">${esc(d.reflection)}</textarea>
          <div class="field-hint" id="pfReflH"><span class="wc ${wc >= a.minWords ? 'ok' : ''}" data-wc>${wc} / ${a.minWords} words</span> · Reviewers reward one honest struggle and its fix.</div></div>
        <fieldset style="border:0;padding:0;margin:0"><legend class="field-label">Before you submit</legend><ul class="checklist">${a.checklist.map((c, i) => `<li><label><input type="checkbox" data-proofcheck="${i}" ${d.checks[i] ? 'checked' : ''}><span>${esc(c)}</span></label></li>`).join('')}</ul></fieldset>
        <div class="row gap-12 wrap"><button class="btn btn-gold" type="submit">${ic('upload', 'ic-sm')}Submit for review</button><span class="muted small">+${a.xp} XP on submit · a human reviewer decides</span></div>
      </form>`;
  }

  function a6() {
    const p = AH.S.progress, sub = AH.S.submissions[0], a = D.L1.acts[6], b = p.boss;
    const approved = p.acts[6] === 'completed';
    const steps = [
      { k: 'done', t: 'Proof submitted', d: sub ? `${U.fullDate(sub.at)} · attempt ${sub.attempt}` : '' },
      { k: 'done', t: 'AI pre-review', d: 'Suggested scores prepared for the reviewer. AI never decides on its own.' },
      { k: sub && sub.state === 'pending' ? 'now' : sub && sub.state === 'needs_changes' ? 'warn' : 'done', t: sub && sub.state === 'pending' ? 'Human review — in queue' : sub && sub.state === 'needs_changes' ? 'Changes requested' : 'Human review — decided', d: sub && sub.review ? `${esc(sub.review.by)} · ${sub.review.avg.toFixed(2)} / 5` : `Target under ${D.WORKSPACE.reviewSlaHours} h` },
      { k: approved ? 'done' : '', t: 'Level complete', d: approved ? 'Level 2 unlocked' : 'Unlocks Level 2' }
    ];
    const bossRes = b.runs[0];
    return `${actHead(6, approved ? '<span class="badge badge-success">Approved</span>' : '')}
      ${approved && sub.review ? `<div class="verdict pass" style="margin-bottom:18px"><span class="big">${sub.review.avg.toFixed(2)}</span><div><b>Approved by ${esc(sub.review.by)}</b><p class="small text-2">${sub.review.feedback ? '“' + esc(sub.review.feedback) + '”' : 'Great work.'}</p></div></div>
        <div class="table-wrap"><table class="tbl"><thead><tr><th>Area</th><th>Weight</th><th style="text-align:right">Score</th></tr></thead><tbody>${D.RUBRIC.dims.map(d => `<tr><td>${esc(d.name)}</td><td class="num">${Math.round(d.weight * 100)}%</td><td class="num bold" style="text-align:right">${sub.review.scores[d.key]}</td></tr>`).join('')}</tbody></table></div>` : ''}
      <div class="grid2" style="gap:18px;margin-top:${approved ? 18 : 0}px">
        <section class="card card-pad" aria-labelledby="revT"><h3 class="h3" id="revT" style="margin-bottom:10px">Review status</h3>
          <ol class="vtl">${steps.map(s => `<li class="${s.k}"><span class="dot">${s.k === 'done' ? ic('check', 'ic-sm') : s.k === 'now' ? ic('clock', 'ic-sm') : s.k === 'warn' ? ic('refresh', 'ic-sm') : ''}</span><div><b>${s.t}</b><p class="muted small">${s.d}</p></div></li>`).join('')}</ol>
          ${sub && sub.state === 'needs_changes' ? `<a class="btn btn-gold btn-sm" style="margin-top:10px" href="#/journey/1/5">Improve and resubmit</a>` : ''}
          ${!sub ? '<p class="muted small">Submit your proof in activity 5 first.</p>' : ''}
        </section>
        <section class="card card-pad" aria-labelledby="bossT"><h3 class="h3" id="bossT">Boss: ${esc(a.title)}</h3>
          <p class="text-2 small" style="margin-top:4px">${esc(a.boss)}</p>
          <div class="row gap-8 wrap" style="margin-top:10px"><span class="badge badge-neutral">${b.attempts} of ${a.attempts} attempts</span><span class="badge ${b.best === 3 ? 'badge-success' : 'badge-neutral'}">Best ${b.best}/3</span><span class="badge badge-gold">+${a.bossXp} XP bonus</span></div>
        </section>
      </div>
      ${sub && !approved ? `<div style="margin-top:18px">${editor('bossEd', b.code || p.code || E.STARTER, 'cookie.py — Boss edition')}</div>
        <div class="row gap-12 wrap" style="margin:12px 0"><button class="btn btn-ink" type="button" data-action="runBoss" ${b.attempts >= a.attempts ? 'disabled' : ''}>${ic('play', 'ic-sm')}Run the Mould Trial</button><span class="muted xs">${b.attempts >= a.attempts ? 'No attempts left — your best result goes to the reviewer.' : `${a.attempts - b.attempts} attempts left. Your best result is shared with your reviewer.`}</span></div>
        ${termOut(bossRes ? E.runTests(b.code, E.BOSS_TESTS) : null, 'pytest tests/test_boss.py')}` : ''}`;
  }
  A.runBoss = () => {
    const code = $('#bossEd').value; let r;
    E.commit(s => { r = E.runBoss(code); const sub = s.submissions[0]; if (sub && sub.state === 'pending') { sub.boss = { passed: s.progress.boss.best, total: 3 }; sub.ai = E.aiPreReview(sub); } });
    if (!r) return C.toast('No attempts left.');
    C.blip(r.passed === 3 ? 880 : 330);
    C.toast(r.passed === 3 ? 'Mould Trial passed 3/3! Your reviewer will see it.' : `${r.passed}/3 — read the hints and try again.`);
  };

  P.levelAfter = () => {
    const ed = $('[data-editor]');
    if (ed) {
      ed.addEventListener('keydown', e => {
        if (e.key === 'Tab' && !e.shiftKey) { e.preventDefault(); const s = ed.selectionStart; ed.value = ed.value.slice(0, s) + '    ' + ed.value.slice(ed.selectionEnd); ed.selectionStart = ed.selectionEnd = s + 4; }
        if (e.key === 'Escape') ed.blur(); // keyboard users can always leave the editor
      });
      const save = U.debounce(() => E.commit(s => { if (ed.id === 'bossEd') s.progress.boss.code = ed.value; else s.progress.code = ed.value; }, { silent: true }), 400);
      ed.addEventListener('input', save);
    }
    U.$$('[data-proof]').forEach(inp => inp.addEventListener('input', () => {
      P.draft.proof[inp.dataset.proof] = inp.value;
      if (inp.dataset.proof === 'reflection') { const w = U.wordCount(inp.value), el = $('[data-wc]'); el.textContent = `${w} / ${D.L1.acts[5].minWords} words`; el.classList.toggle('ok', w >= D.L1.acts[5].minWords); }
    }));
    U.$$('[data-proofcheck]').forEach(cb => cb.addEventListener('change', () => { P.draft.proof.checks[+cb.dataset.proofcheck] = cb.checked; }));
  };

  /* Form submissions inside the level view */
  P.forms = {
    quiz(f) {
      const q = D.L1.acts[2].quiz;
      if (Object.keys(P.draft.quiz).length < q.length) { P.draft.result = `Answer all ${q.length} questions first.`; SH.render(); return; }
      const score = Math.round((q.filter((x, i) => P.draft.quiz[i] === x.answer).length / q.length) * 100);
      P.draft.graded = true;
      if (score >= D.L1.acts[2].passPct) {
        E.commit(s => { s.progress.quiz = { ...P.draft.quiz }; s.progress.quizScore = score; const r = E.completeActivity(2, `L1·A2 Learn (quiz ${score}%)`); if (r.entry) C.toast(`+${r.entry.amount} XP — quiz passed with ${score}%`); else C.toast(`Retake score: ${score}%. XP was already awarded.`); });
        P.draft.result = `${score}% — passed.`; P.draft.graded = false; P.draft.quiz = {}; P.draft.retake = false; SH.render();
      } else { P.draft.result = `${score}% — you need ${D.L1.acts[2].passPct}%. Review the highlighted answers and try again.`; SH.render(); }
    },
    a3() {
      const qs = D.L1.acts[3].questions;
      if (Object.keys(P.draft.a3).length < qs.length) { P.draft.a3msg = 'Answer both questions first.'; SH.render(); return; }
      const right = qs.filter((q, i) => P.draft.a3[i] === q.answer).length;
      P.draft.a3graded = true;
      if (right >= D.L1.acts[3].passMin) { E.commit(() => { const r = E.completeActivity(3); if (r.entry) C.toast(`+${r.entry.amount} XP — Explore complete${r.streaked ? ' · streak +1' : ''}`); }); P.draft.a3msg = `${right} of ${qs.length} correct.`; }
      else { P.draft.a3msg = 'Not yet — check the highlighted lines in the code.'; SH.render(); }
    },
    async push(f) {
      const repo = U.$('#repoIn').value.trim();
      if (!/^https:\/\/(www\.)?github\.com\/[\w.-]+\/[\w.-]+\/?$/.test(repo)) { C.toast('Enter a GitHub repository URL, like https://github.com/you/cookie-factory', { tone: 'error' }); U.$('#repoIn').setAttribute('aria-invalid', 'true'); U.$('#repoIn').focus(); return; }
      const btn = f.querySelector('button'); btn.disabled = true; btn.innerHTML = `${ic('refresh', 'ic-sm')}Waiting for push…`;
      const sha = await E.recordBuild(repo, AH.S.progress.code || '');
      E.commit(s => { s.progress.repo = repo; if (P.draft.proof) P.draft.proof.repo = repo; const r = E.completeActivity(4, `L1·A4 Build (commit ${sha})`); if (r.entry) C.toast(`+${r.entry.amount} XP — commit ${sha} detected`); });
      C.blip(880);
    },
    proof() {
      const d = P.draft.proof, min = D.L1.acts[5].minWords, errs = [];
      U.$$('.field-err').forEach(x => x.remove()); U.$$('[aria-invalid]').forEach(x => x.removeAttribute('aria-invalid'));
      const fail = (id, msg) => { const el = U.$(id); el.setAttribute('aria-invalid', 'true'); const e = document.createElement('div'); e.className = 'field-err'; e.textContent = msg; e.id = id.slice(1) + 'E'; el.parentNode.appendChild(e); el.setAttribute('aria-describedby', e.id); errs.push(el); };
      if (!/^https:\/\/\S+\.\S+/.test(d.repo.trim())) fail('#pfRepo', 'Enter a link that starts with https://');
      if (d.deploy.trim() && !/^https:\/\/\S+\.\S+/.test(d.deploy.trim())) fail('#pfDeploy', 'Demo link must start with https://');
      if (U.wordCount(d.reflection) < min) fail('#pfRefl', `Write at least ${min} words (you have ${U.wordCount(d.reflection)}).`);
      if (!d.checks.every(Boolean)) { C.toast('Tick all three checks before submitting.', { tone: 'error' }); if (!errs.length) { U.$('[data-proofcheck]').focus(); return; } }
      if (errs.length) { errs[0].focus(); return; }
      if (!d.checks.every(Boolean)) return;
      E.commit(() => { const r = E.submitProof({ repo: d.repo.trim(), deploy: d.deploy.trim(), reflection: d.reflection.trim(), checklist: d.checks.slice() }); if (r.ok) C.toast('Proof submitted. A reviewer will score it soon.'); });
      P.draft.proof = null; C.blip(780); SH.go('#/journey/1/6');
    }
  };

  /* ======================= CAREER TRACKS ======================= */
  R.tracks = {
    roles: L, icon: 'compass', keywords: 'specialization career path',
    render() {
      const sl = AH.S.shortlist;
      return `${C.header({ variant: 'cream', eyebrow: 'Career tracks', title: 'Eight ways to specialise. Pick one at Level 11.', desc: 'Tracks are gated by competence, not payment alone. Shortlist the ones that pull you; we\'ll show what each gate needs as you progress.' })}
      <div class="callout info" style="margin-bottom:18px">${ic('info')}<div><b>Where you are</b>You're at Level 1. Track choice opens after Capstone I (Level 10). ${sl.length ? `You've shortlisted ${U.plural(sl.length, 'track')}.` : 'Nothing shortlisted yet.'}</div></div>
      <div class="track-grid">${D.TRACKS.map(tk => {
        const on = sl.includes(tk.code);
        return `<article class="card trk lift" aria-labelledby="tk-${tk.code}">
          <div class="trk-head"><span class="trk-ic" style="background:${tk.color}" aria-hidden="true">${ic(tk.icon)}</span><div style="min-width:0;flex:1"><h2 class="h3" id="tk-${tk.code}">${esc(tk.name)}</h2><p class="muted small">For ${esc(tk.for)}</p></div>
            <button class="btn btn-sm ${on ? 'btn-gold' : 'btn-outline'}" type="button" aria-pressed="${on}" data-action="shortlist" data-code="${tk.code}">${on ? ic('check', 'ic-sm') + 'Shortlisted' : 'Shortlist'}</button></div>
          <p class="promise">${esc(tk.promise)}</p>
          <div class="gate">${ic('lock', 'ic-sm')}<span><b>Gate:</b> ${esc(tk.gate)}</span></div>
          <div class="gate">${ic('trophy', 'ic-sm')}<span><b>Capstone II:</b> ${esc(tk.capstone)}</span></div>
        </article>`;
      }).join('')}</div>`;
    }
  };
  A.shortlist = el => E.commit(s => { const c = el.dataset.code, i = s.shortlist.indexOf(c); if (i >= 0) s.shortlist.splice(i, 1); else s.shortlist.push(c); E.track('track.shortlist', { code: c }); });

  /* ======================= ACHIEVEMENTS ======================= */
  R.achievements = {
    roles: L, icon: 'award', keywords: 'badges xp ledger history',
    render() {
      const xp = E.xp(), tier = E.tier(), next = E.nextTier(), chain = E.verifyChain();
      const earned = D.BADGES.filter(b => AH.S.badges[b.code]).length;
      return `${C.header({ title: 'Achievements', desc: 'Badges you\'ve earned and every XP point, with where it came from. Nothing here can be edited — only added.' })}
      <div class="kpis" style="margin-bottom:22px">
        <div class="card kpi"><div class="k">Total XP</div><div class="v">${U.fmt(xp)}</div><div class="d">${tier.name} tier${next ? ` · ${U.fmt(next.min - xp)} to ${next.name}` : ''}</div></div>
        <div class="card kpi"><div class="k">Badges</div><div class="v">${earned}<span class="muted" style="font-size:18px"> / ${D.BADGES.length}</span></div><div class="d">${D.BADGES.length - earned} still to earn</div></div>
        <div class="card kpi"><div class="k">Longest streak</div><div class="v">${AH.S.streak.longest}</div><div class="d">${U.plural(AH.S.streak.freezes, 'freeze token')} saved</div></div>
        <div class="card kpi"><div class="k">Ledger</div><div class="v" style="font-size:22px">${chain.ok ? `${ic('shield')} Verified` : 'Check failed'}</div><div class="d">${U.plural(chain.total, 'entry', 'entries')}, hash-chained</div></div>
      </div>
      <section aria-labelledby="bgT"><h2 class="h3" id="bgT" style="margin-bottom:12px">Badges</h2>
        <div class="badge-grid">${D.BADGES.map(b => { const at = AH.S.badges[b.code]; return `<div class="bdg ${b.tier} ${at ? 'earned' : 'locked'}" aria-label="${esc(b.name)}, ${b.tier}, ${at ? 'earned' : 'locked'}">
          <span class="medal" aria-hidden="true">${b.icon}${at ? '' : `<span class="lk">${ic('lock', 'ic-sm')}</span>`}</span><span class="tier">${b.tier}</span><b>${esc(b.name)}</b><small>${esc(b.desc)}</small><small class="bold">${at ? `Earned ${U.ago(at)}` : `+${b.xp} XP`}</small></div>`; }).join('')}</div>
      </section>
      <section class="card" style="margin-top:24px" aria-labelledby="lgT">
        <div class="row between wrap gap-8" style="padding:18px 20px 0"><h2 class="h3" id="lgT">XP history</h2><button class="btn btn-outline btn-sm" type="button" data-action="ledgerCsv">${ic('download', 'ic-sm')}Download CSV</button></div>
        <div class="table-wrap" style="margin-top:12px"><table class="tbl"><caption class="sr-only">XP ledger, newest first</caption>
          <thead><tr><th>When</th><th>What</th><th>Source</th><th style="text-align:right">XP</th></tr></thead>
          <tbody>${AH.S.ledger.slice().reverse().map(e => `<tr><td class="muted-cell small">${U.timeTag(e.at)}</td><td>${esc(e.ref)}</td><td><span class="badge badge-neutral">${esc(e.source.replace(/_/g, ' '))}</span></td><td class="num bold" style="text-align:right">+${e.amount}</td></tr>`).join('')}</tbody></table></div>
      </section>`;
    }
  };
  A.ledgerCsv = () => {
    const rows = [['id', 'timestamp', 'source', 'reference', 'xp', 'idempotency_key', 'prev_hash', 'hash'], ...AH.S.ledger.map(e => [e.id, new Date(e.at).toISOString(), e.source, e.ref, e.amount, e.idem, e.prev, e.hash])];
    U.download('xp-ledger.csv', rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n'), 'text/csv');
    E.track('ledger.exported');
  };

  /* ======================= STANDINGS ======================= */
  P.standTab = P.standTab || 'cohort';
  R.standings = {
    roles: ['learner', 'pm'], icon: 'ranks', keywords: 'leaderboard rank',
    render() {
      const rows = E.standings(), me = E.myPos(), priv = AH.S.prefs.lbVisibility === 'private', tab = P.standTab;
      const approved = AH.S.submissions.filter(s => s.state === 'approved').length;
      const globalBody = !AH.S.prefs.globalOptIn
        ? C.empty('globe', 'Global standings are opt-in', 'Your data stays inside your cohort unless you choose otherwise. Opting in shows your name and XP to learners in other institutions.', `<button class="btn btn-gold btn-sm" style="margin-top:16px" type="button" data-action="globalOptIn">Opt in to global standings</button>`)
        : approved < 3 ? C.empty('shield', 'Almost there', `Global standings need 3 approved submissions to keep them fair (you have ${approved}). It stops XP-farming accounts from topping the board.`) : '';
      return `${C.header({ title: AH.t('standings'), desc: AH.S.role === 'learner' ? `You're #${me.pos} of ${me.total} in ${esc(D.WORKSPACE.cohort)}.` : `${esc(D.WORKSPACE.cohort)} by XP.` })}
      <div class="tabs-line" role="tablist" aria-label="Standings scope">${[['cohort', 'My cohort'], ['global', 'Global']].map(([k, l]) => `<button role="tab" type="button" aria-selected="${tab === k}" data-action="standTab" data-tab="${k}">${l}</button>`).join('')}</div>
      ${tab === 'global' ? globalBody : `
      ${AH.S.role === 'learner' ? `<div class="callout info" style="margin-bottom:14px">${ic(priv ? 'eyeOff' : 'eye')}<div><b>${priv ? 'You appear as "Anonymous learner" to others' : 'Your name is visible to your cohort'}</b><button class="btn btn-text btn-sm" type="button" data-action="toggleVisibility" style="padding-left:0">${priv ? 'Show my name' : 'Hide my name'}</button></div></div>` : ''}
      <div class="card table-wrap"><table class="tbl"><caption class="sr-only">Cohort standings by XP</caption>
        <thead><tr><th>#</th><th>Learner</th><th>City</th><th>Rank</th><th>Streak</th><th style="text-align:right">XP</th></tr></thead>
        <tbody>${rows.map((r, i) => { const name = r.me ? (AH.S.role === 'learner' ? `${E.me().name}` : (priv ? 'Anonymous learner' : E.me().name)) : r.name; const st = r.me ? AH.S.streak : { current: r.streak, status: r.status };
          return `<tr class="${r.me && AH.S.role === 'learner' ? 'me' : ''}"><td class="num bold">${i + 1}</td><td><div class="row gap-12"><span class="avatar avatar-sm ${r.me ? 'me' : ''}" aria-hidden="true">${U.initials(name)}</span><span class="${r.me ? 'bold' : ''}">${esc(name)}${r.me && AH.S.role === 'learner' ? ` <span class="badge badge-gold" style="margin-left:6px">You${priv ? ' · hidden' : ''}</span>` : ''}</span></div></td>
          <td class="text-2">${esc(r.city)}</td><td><span class="badge badge-neutral">${D.pick(D.RANKS, r.xp).name}</span></td><td class="num">${st.status === 'recovery' ? '⏸' : st.status === 'frozen' ? '🧊' : '🔥'} ${st.current}</td><td class="num bold" style="text-align:right">${U.fmt(r.xp)}</td></tr>`; }).join('')}</tbody></table></div>
      <p class="muted small" style="margin-top:10px">XP is written by the server only. Duplicate awards are blocked by idempotency keys.</p>`}`;
    }
  };
  A.standTab = el => { P.standTab = el.dataset.tab; SH.render(); };
  A.toggleVisibility = () => E.commit(s => { s.prefs.lbVisibility = s.prefs.lbVisibility === 'private' ? 'cohort' : 'private'; E.audit('privacy.leaderboard_visibility', s.prefs.lbVisibility); });
  A.globalOptIn = () => C.dialog({ title: 'Share your progress globally?', body: 'Learners in other institutions will see your name, city and XP. You can withdraw consent any time in Settings.', confirm: 'I consent', onConfirm: () => E.commit(s => { s.prefs.globalOptIn = true; E.audit('consent.global_leaderboard', 'granted'); }) });
})(window.AH = window.AH || {});
