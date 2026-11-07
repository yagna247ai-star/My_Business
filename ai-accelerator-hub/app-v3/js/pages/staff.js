/* AI Accelerator Hub v3 — reviewer & program-manager workspaces */
(function (AH) {
  'use strict';
  const { U, D, E, C, SH } = AH; const { esc, ic, $, $$ } = U;
  const P = (AH.P = AH.P || {}); const R = AH.ROUTES, A = AH.A;
  P.rev = P.rev || {};
  const H = 3600000, SLA = D.WORKSPACE.reviewSlaHours;
  const sla = at => { const h = (Date.now() - at) / H; return h > SLA ? { cls: 'warn', t: 'Breached' } : h > SLA * 0.66 ? { cls: 'warn', t: 'At risk' } : { cls: 'ok', t: 'On track' }; };
  const levelName = i => `L${i} · ${D.LEVELS[i - 1].title}`;

  /* ======================= REVIEW QUEUE ======================= */
  P.revTab = P.revTab || 'pending';
  R.review = {
    roles: ['reviewer', 'pm'], icon: 'inbox', keywords: 'submissions proof rubric grade',
    count: () => E.allPending().length,
    crumb: ps => ps[0] ? `Review · ${E.findSub(ps[0]) ? E.whoName(E.findSub(ps[0]).who) : ''}` : AH.t('review'),
    render(ps) { return ps[0] ? reviewDetail(ps[0]) : queue(); },
    after(ps) { if (ps[0]) bindReview(ps[0]); }
  };
  function queue() {
    const pend = E.allPending(), dec = AH.S.decided, ro = AH.S.role === 'pm';
    const breached = pend.filter(s => sla(s.at).t !== 'On track').length;
    return `${C.header({ title: AH.t('review'), desc: `Oldest first. Target: every proof decided within ${SLA} hours. AI pre-reviews are suggestions — the decision is yours.` })}
    <div class="kpis" style="margin-bottom:20px">
      <div class="card kpi"><div class="k">Waiting</div><div class="v">${pend.length}</div><div class="d">${pend.length ? `oldest ${U.duration(Date.now() - pend[0].at)}` : 'queue clear'}</div></div>
      <div class="card kpi"><div class="k">SLA risk</div><div class="v">${breached}</div><div class="d ${breached ? 'down' : 'up'}">${breached ? 'needs attention' : 'all on track'}</div></div>
      <div class="card kpi"><div class="k">Median time to decide</div><div class="v">${D.ANALYTICS.medianApproveHours} h</div><div class="d up">within ${SLA} h target</div></div>
      <div class="card kpi"><div class="k">AI–human agreement</div><div class="v">${Math.round(D.ANALYTICS.aiPreReviewAgreement * 100)}%</div><div class="d">last 30 decisions, ±0.5</div></div>
    </div>
    ${ro ? `<div class="callout info" style="margin-bottom:14px">${ic('eye')}<div><b>Read-only for Program Managers</b>You can see the queue and assign reviewers. Scoring is limited to the Reviewer role.</div></div>` : ''}
    <div class="tabs-line" role="tablist" aria-label="Queue">${[['pending', 'Waiting', pend.length], ['decided', 'Decided', dec.length]].map(([k, l, n]) => `<button role="tab" type="button" aria-selected="${P.revTab === k}" data-action="revTab" data-tab="${k}">${l}<span class="cnt">${n}</span></button>`).join('')}</div>
    ${P.revTab === 'pending' ? (pend.length ? `<div class="card table-wrap"><table class="tbl"><caption class="sr-only">Submissions waiting for review, oldest first</caption>
      <thead><tr><th>Learner</th><th>Level</th><th>Attempt</th><th>Waiting</th><th>SLA</th><th>AI suggests</th><th>Boss</th><th></th></tr></thead>
      <tbody>${pend.map(s => { const sl = sla(s.at), ai = D.weighted(s.ai || {}); return `<tr><td><div class="row gap-12"><span class="avatar avatar-sm ${s.who === 'u-me' ? 'me' : ''}" aria-hidden="true">${U.initials(E.whoName(s.who))}</span><b>${esc(E.whoName(s.who))}</b></div></td>
        <td>${esc(levelName(s.levelIdx))}</td><td class="num">${s.attempt}${s.attempt > 1 ? ' <span class="badge badge-info">resubmission</span>' : ''}</td><td class="num">${U.duration(Date.now() - s.at)}</td><td><span class="status ${sl.cls}">${sl.t}</span></td>
        <td class="num">${ai.toFixed(2)} ${D.passes(s.ai || {}) ? '<span class="status ok">pass</span>' : '<span class="status warn">below</span>'}</td><td class="num">${s.boss ? `${s.boss.passed}/3` : '—'}</td>
        <td><a class="btn btn-ink btn-sm" href="#/review/${s.id}">${ro ? 'View' : 'Review'}</a></td></tr>`; }).join('')}</tbody></table></div>`
      : C.empty('checkCircle', 'Queue clear', 'Every submission has been decided. New ones appear here instantly.'))
    : `<div class="card table-wrap"><table class="tbl"><caption class="sr-only">Decided reviews</caption><thead><tr><th>Learner</th><th>Level</th><th>Decision</th><th>Score</th><th>Reviewer</th><th>Decided</th><th>Turnaround</th></tr></thead>
      <tbody>${dec.map(d => `<tr><td><b>${esc(E.whoName(d.who))}</b></td><td>${esc(levelName(d.levelIdx))}</td><td>${C.statusTag(d.verdict)}</td><td class="num bold">${d.avg.toFixed(2)}</td><td>${esc(d.by)}</td><td class="small">${U.timeTag(d.decidedAt)}</td><td class="num">${U.duration(d.decidedAt - d.at)}</td></tr>`).join('')}</tbody></table></div>`}`;
  }
  A.revTab = el => { P.revTab = el.dataset.tab; SH.render(); };

  function reviewDetail(id) {
    const s = E.findSub(id);
    if (!s) return C.empty('inbox', 'Submission not found', 'It may have been decided already.', `<a class="btn btn-gold btn-sm" style="margin-top:14px" href="#/review">Back to queue</a>`);
    const ro = AH.S.role === 'pm' || s.state !== 'pending';
    const st = P.rev[id] || (P.rev[id] = { scores: {}, feedback: '' });
    const scores = s.review ? s.review.scores : st.scores;
    const complete = D.RUBRIC.dims.every(d => scores[d.key]);
    const avg = complete ? D.weighted(scores) : null, pass = complete && D.passes(scores);
    const wc = U.wordCount(s.reflection), sl = sla(s.at);
    return `<div class="row gap-8" style="margin-bottom:12px"><a class="btn btn-text" href="#/review">${ic('chevLeft', 'ic-sm')}Queue</a></div>
    ${C.header({ title: `${esc(E.whoName(s.who))} · ${esc(levelName(s.levelIdx))}`, desc: `Attempt ${s.attempt} · submitted ${U.fullDate(s.at)} IST · waiting ${U.duration(Date.now() - s.at)}`, actions: `<span class="status ${sl.cls}">${sl.t}</span>${s.state !== 'pending' ? C.statusTag(s.state) : ''}` })}
    <div class="panel-grid" style="grid-template-columns:minmax(0,1fr) minmax(0,1fr)">
      <section class="stack gap-16" aria-label="Proof">
        <div class="card card-pad stack gap-12"><h2 class="h3">Proof</h2>
          <div class="kv"><span>Repository</span><span><a class="link" href="${esc(s.repo)}" target="_blank" rel="noopener noreferrer">${esc(s.repo.replace('https://', ''))} ${ic('external', 'ic-sm')}</a></span></div>
          <div class="kv"><span>Demo</span><span>${s.deploy ? `<a class="link" href="${esc(s.deploy)}" target="_blank" rel="noopener noreferrer">${esc(s.deploy.replace('https://', ''))}</a>` : '—'}</span></div>
          <div class="kv"><span>Boss · Mould Trial</span><span>${s.boss ? `${s.boss.passed} of 3 tests` : 'Not attempted yet'}</span></div>
          <div class="kv"><span>Checklist</span><span>${s.checklist ? `${s.checklist.filter(Boolean).length} of 3 confirmed` : 'Confirmed'}</span></div>
        </div>
        <div class="card card-pad"><div class="row between"><h2 class="h3">Reflection</h2><span class="muted small">${wc} words</span></div><p style="margin-top:10px;white-space:pre-wrap">${esc(s.reflection)}</p></div>
        ${s.who === 'u-me' && AH.S.progress.code ? `<div class="card card-pad"><h2 class="h3" style="margin-bottom:10px">cookie.py ${AH.S.progress.commit ? `<span class="badge badge-neutral mono">@${esc(AH.S.progress.commit.sha)}</span>` : ''}</h2><div class="code"><pre>${(AH.S.progress.boss.code || AH.S.progress.code).split('\n').map(l => `<span class="ln">${U.highlightPy(l) || ' '}</span>`).join('')}</pre></div></div>` : ''}
        ${(s.history || []).length ? `<div class="card card-pad"><h2 class="h3">Previous attempts</h2>${s.history.map(h => `<div class="callout warn small" style="margin-top:10px">${ic('refresh', 'ic-sm')}<div><b>${C.statusTag(h.verdict)} · ${h.avg.toFixed(2)} by ${esc(h.by)} · ${U.ago(h.at)}</b>“${esc(h.feedback)}”</div></div>`).join('')}</div>` : ''}
      </section>
      <section class="card card-pad stack gap-16" aria-labelledby="rbT" style="position:sticky;top:84px">
        <div class="row between wrap gap-8"><h2 class="h3" id="rbT">Score · ${D.RUBRIC.code}</h2>${!ro ? `<button class="btn btn-soft btn-sm" type="button" data-action="useAi" data-id="${id}">${ic('sparkle', 'ic-sm')}Start from AI suggestion</button>` : ''}</div>
        <div class="rubric">${D.RUBRIC.dims.map(d => `<div class="rdim"><div class="rdim-head"><b>${esc(d.name)} <span class="muted small">· ${Math.round(d.weight * 100)}%</span></b>${s.ai ? `<span class="ai-sugg" title="AI pre-review suggestion">${ic('sparkle', 'ic-sm')}AI ${s.ai[d.key]}</span>` : ''}</div>
          <div class="rdim-levels"><span>1 · ${esc(d.l1)}</span><span>3 · ${esc(d.l3)}</span><span>5 · ${esc(d.l5)}</span></div>
          <div class="score-row" role="radiogroup" aria-label="${esc(d.name)} score">${[1, 2, 3, 4, 5].map(v => `<button type="button" role="radio" aria-checked="${scores[d.key] === v}" tabindex="${(scores[d.key] || 3) === v ? 0 : -1}" ${ro ? 'disabled' : ''} data-action="score" data-id="${id}" data-k="${d.key}" data-v="${v}" aria-label="${v}">${v}</button>`).join('')}</div></div>`).join('')}</div>
        <div class="verdict ${complete ? (pass ? 'pass' : 'fail') : ''}" aria-live="polite"><span class="big">${avg != null ? avg.toFixed(2) : '—'}</span><div><b>${!complete ? 'Score all five areas' : pass ? 'Meets the bar' : 'Below the bar'}</b><p class="small text-2">Pass rule: weighted average ≥ ${D.RUBRIC.threshold.toFixed(1)} and Boss ≥ ${D.RUBRIC.bossMin}.${complete && !pass && (scores.boss || 0) < 2 ? ' Boss score is below 2.' : ''}</p></div></div>
        ${s.review ? `<div class="callout ${s.state === 'approved' ? 'ok' : 'warn'}">${ic(s.state === 'approved' ? 'checkCircle' : 'refresh')}<div><b>${C.statusTag(s.state)} by ${esc(s.review.by)}</b>${s.review.feedback ? '“' + esc(s.review.feedback) + '”' : ''}</div></div>` : ro ? '' : `
        <div><label class="field-label" for="fbIn">Feedback to the learner</label><textarea class="textarea" id="fbIn" rows="4" placeholder="What's strong, and the one thing that would raise the score." aria-describedby="fbH">${esc(st.feedback)}</textarea><div class="field-hint" id="fbH">Required when requesting changes (20+ characters). Shown to the learner word for word.</div></div>
        <div class="row gap-12 wrap"><button class="btn btn-gold" type="button" data-action="decide" data-id="${id}" data-v="approved" ${pass ? '' : 'disabled'}>${ic('checkCircle', 'ic-sm')}Approve</button><button class="btn btn-outline" type="button" data-action="decide" data-id="${id}" data-v="needs_changes" ${complete ? '' : 'disabled'}>${ic('refresh', 'ic-sm')}Request changes</button></div>
        <p class="muted xs">Decisions are final, written to the audit log, and the learner is notified immediately. Approving awards XP through the ledger.</p>`}
      </section>
    </div>`;
  }
  function bindReview(id) { const fb = $('#fbIn'); if (fb) fb.addEventListener('input', () => { P.rev[id].feedback = fb.value; }); }
  A.score = el => { const st = P.rev[el.dataset.id]; st.scores[el.dataset.k] = +el.dataset.v; SH.render(); const b = $(`[data-action="score"][data-k="${el.dataset.k}"][data-v="${el.dataset.v}"]`); if (b) b.focus(); };
  A.useAi = el => { const s = E.findSub(el.dataset.id); P.rev[el.dataset.id].scores = { ...s.ai }; SH.render(); C.toast('AI suggestions loaded. Adjust anything you disagree with — you make the call.'); };
  A.decide = el => {
    const id = el.dataset.id, st = P.rev[id], v = el.dataset.v, s = E.findSub(id);
    if (v === 'needs_changes' && st.feedback.trim().length < 20) { const fb = $('#fbIn'); fb.setAttribute('aria-invalid', 'true'); fb.focus(); return C.toast('Write at least 20 characters of feedback so the learner knows what to change.', { tone: 'error' }); }
    C.dialog({ title: v === 'approved' ? 'Approve this proof?' : 'Request changes?', body: `${esc(E.whoName(s.who))} · ${esc(levelName(s.levelIdx))} · score <b>${D.weighted(st.scores).toFixed(2)}</b>. ${v === 'approved' ? 'This completes the level and awards XP.' : 'The learner keeps their XP and can resubmit.'}`, confirm: v === 'approved' ? 'Approve' : 'Send feedback',
      onConfirm: () => {
        let r; E.commit(() => { r = E.decide(id, st.scores, v, st.feedback.trim()); });
        if (!r.ok) return C.toast('Score is below the pass rule — approval blocked.', { tone: 'error' });
        delete P.rev[id]; C.toast(v === 'approved' ? 'Approved. The learner has been notified.' : 'Feedback sent.');
        const next = E.allPending()[0]; SH.go(next ? `#/review/${next.id}` : '#/review');
      } });
  };

  /* ======================= COHORT ANALYTICS ======================= */
  /* Recommended intervention per funnel transition (index = step that lost learners) */
  const FUNNEL_ADVICE = {
    1: 'Learners open the briefing but don\'t start the lesson. Shorten the briefing and end it with a clear "start Learn" call to action.',
    2: 'The quiz may be the blocker. Check which question fails most and add a worked example before it.',
    3: 'Learners stall before their first push. Run a 30-minute "first commit" clinic in Saturday\'s workshop.',
    4: 'Code is built but not submitted. Share two anonymised example reflections and the rubric before Friday\'s proof window.',
    5: 'Proofs are waiting on review or came back with changes. Check reviewer SLA and whether feedback names one concrete fix.'
  };
  const allLearners = () => [...D.PEERS.map(p => ({ ...p })), { id: 'u-me', name: E.me().name, city: E.me().city, xp: E.xp(), lvl: 1, act: AH.S.progress.lastAct, streak: AH.S.streak.current, status: AH.S.streak.status, last: U.dayDiff(AH.S.streak.lastDay, U.istDay()), prev: AH.S.streak.prev }];
  R.analytics = {
    roles: ['pm'], icon: 'chart', keywords: 'metrics kpi dashboard funnel retention',
    render() {
      const f = D.ANALYTICS.funnelL1.slice(); const labels = D.ACTIVITY_TYPES.map(a => a.n === 6 ? 'Approved' : a.name);
      let worst = 1; for (let i = 1; i < f.length; i++) if (1 - f[i] / f[i - 1] > 1 - f[worst] / f[worst - 1]) worst = i;
      const wa = D.ANALYTICS.weeklyActive, last = wa[wa.length - 1], prev = wa[wa.length - 2];
      const people = allLearners(), byStatus = s => people.filter(p => p.status === s).length;
      const pend = E.allPending();
      return `${C.header({ title: AH.t('analytics'), desc: `${esc(D.WORKSPACE.cohort)} · ${esc(D.WORKSPACE.tenant)} · ${D.WORKSPACE.size} enrolled. Aggregates refresh every 15 minutes.`, actions: `<button class="btn btn-outline btn-sm" type="button" data-action="funnelCsv">${ic('download', 'ic-sm')}Export CSV</button>` })}
      <div class="kpis" style="margin-bottom:20px">
        <div class="card kpi"><div class="k">Active this week</div><div class="v">${last}<span class="muted" style="font-size:18px"> / ${D.WORKSPACE.size}</span></div><div class="d ${last >= prev ? 'up' : 'down'}">${last >= prev ? '▲' : '▼'} ${Math.abs(last - prev)} vs last week</div></div>
        <div class="card kpi"><div class="k">Level 1 approved</div><div class="v">${f[5]}</div><div class="d">${Math.round((f[5] / D.WORKSPACE.size) * 100)}% of cohort</div></div>
        <div class="card kpi"><div class="k">Median review time</div><div class="v">${D.ANALYTICS.medianApproveHours} h</div><div class="d up">target ${SLA} h · ${pend.length} waiting</div></div>
        <div class="card kpi"><div class="k">Need attention</div><div class="v">${byStatus('grace') + byStatus('recovery')}</div><div class="d"><a class="link" href="#/learners">See who ${ic('arrowRight', 'ic-sm')}</a></div></div>
      </div>
      <div class="grid-12">
        <section class="card card-pad span-8" aria-labelledby="fnT"><div class="row between wrap gap-8"><h2 class="h3" id="fnT">Level 1 activity funnel</h2><div class="legend"><span><i style="background:#3D5AFE"></i>Completed</span><span><i style="background:#C99B4C"></i>Drop ≥ 25%</span></div></div>
          <div style="margin-top:14px">${C.funnel(f, labels)}</div>
          <div class="callout warn" style="margin-top:14px">${ic('bulb')}<div><b>Biggest drop: ${labels[worst - 1]} → ${labels[worst]} (−${Math.round((1 - f[worst] / f[worst - 1]) * 100)}%)</b>${esc(FUNNEL_ADVICE[worst])}</div></div></section>
        <section class="card card-pad span-4 stack gap-16" aria-labelledby="shT"><h2 class="h3" id="shT">Streak health</h2>
          ${C.bars([{ label: 'Active', value: byStatus('active'), max: people.length, blue: true }, { label: 'Frozen (protected)', value: byStatus('frozen'), max: people.length }, { label: 'Grace — at risk', value: byStatus('grace'), max: people.length }, { label: 'Recovery — paused', value: byStatus('recovery'), max: people.length }])}
          <p class="muted small">Non-punitive by design: streaks pause and recover; they never silently reset.</p></section>
        <section class="card card-pad span-8" aria-labelledby="waT"><h2 class="h3" id="waT">Weekly active learners</h2><div style="margin-top:10px">${C.lineChart(wa, wa.map((_, i) => `W${i + 1}`))}</div></section>
        <section class="card card-pad span-4 stack gap-12" aria-labelledby="rqT"><h2 class="h3" id="rqT">Review queue</h2>
          ${C.bars([{ label: 'On track', value: pend.filter(s => sla(s.at).t === 'On track').length, max: Math.max(1, pend.length), blue: true }, { label: 'At risk', value: pend.filter(s => sla(s.at).t === 'At risk').length, max: Math.max(1, pend.length) }, { label: 'Breached', value: pend.filter(s => sla(s.at).t === 'Breached').length, max: Math.max(1, pend.length) }])}
          <p class="muted small">AI–human score agreement: ${Math.round(D.ANALYTICS.aiPreReviewAgreement * 100)}%. AI never decides alone.</p><a class="link small" href="#/review">Open queue ${ic('arrowRight', 'ic-sm')}</a></section>
      </div>`;
    }
  };
  A.funnelCsv = () => { const f = D.ANALYTICS.funnelL1; U.download('level1-funnel.csv', ['activity,completed', ...D.ACTIVITY_TYPES.map((a, i) => `${a.name},${f[i]}`)].join('\n'), 'text/csv'); E.track('analytics.exported'); };

  /* ======================= LEARNERS ======================= */
  P.lrnFilter = P.lrnFilter || 'attention';
  R.learners = {
    roles: ['pm'], icon: 'users', keywords: 'students at risk nudge mentor',
    render() {
      const people = allLearners().sort((a, b) => (['recovery', 'grace', 'frozen', 'active'].indexOf(a.status) - ['recovery', 'grace', 'frozen', 'active'].indexOf(b.status)) || b.last - a.last);
      const att = p => p.status === 'grace' || p.status === 'recovery' || p.last >= 3;
      const list = P.lrnFilter === 'attention' ? people.filter(att) : people;
      const label = { active: ['ok', 'Active'], frozen: ['info', 'Protected by freeze'], grace: ['warn', 'Grace — at risk'], recovery: ['warn', 'Paused — can recover'] };
      return `${C.header({ title: AH.t('learners'), desc: 'Who might need a nudge this week. Nudges are friendly reminders, sent as a notification and recorded in the audit log.' })}
      <div class="tabs-line" role="tablist" aria-label="Filter learners">${[['attention', 'Needs attention', people.filter(att).length], ['all', 'Everyone', people.length]].map(([k, l, n]) => `<button role="tab" type="button" aria-selected="${P.lrnFilter === k}" data-action="lrnFilter" data-f="${k}">${l}<span class="cnt">${n}</span></button>`).join('')}</div>
      ${list.length ? `<div class="card table-wrap"><table class="tbl"><caption class="sr-only">Learners</caption><thead><tr><th>Learner</th><th>Where they are</th><th>XP</th><th>Streak</th><th>Last active</th><th></th></tr></thead>
      <tbody>${list.map(p => { const n = AH.S.nudged[p.id]; const [cls, txt] = label[p.status]; return `<tr><td><div class="row gap-12"><span class="avatar avatar-sm ${p.id === 'u-me' ? 'me' : ''}" aria-hidden="true">${U.initials(p.name)}</span><div><b>${esc(p.name)}</b><div class="muted xs">${esc(p.city)}</div></div></div></td>
        <td>Level ${p.lvl} · ${esc(D.ACTIVITY_TYPES[(p.act || 1) - 1].name)}</td><td class="num">${U.fmt(p.xp)}</td><td><span class="status ${cls}">${txt}</span> <span class="muted small">${p.status === 'recovery' ? `(${p.prev || p.streak} d)` : `${p.streak} d`}</span></td>
        <td class="small">${p.last === 0 ? 'Today' : `${U.plural(p.last, 'day')} ago`}</td>
        <td>${p.id === 'u-me' ? '' : n && Date.now() - n < 86400000 ? `<span class="muted small">Nudged ${U.ago(n)}</span>` : `<button class="btn btn-outline btn-sm" type="button" data-action="nudge" data-id="${p.id}">${ic('send', 'ic-sm')}Nudge</button>`}</td></tr>`; }).join('')}</tbody></table></div>`
      : C.empty('checkCircle', 'Nobody needs a nudge right now', 'Everyone is active or protected by a freeze token.')}`;
    }
  };
  A.lrnFilter = el => { P.lrnFilter = el.dataset.f; SH.render(); };
  A.nudge = el => {
    const p = D.PEERS.find(x => x.id === el.dataset.id);
    C.dialog({ title: `Nudge ${esc(p.name)}?`, body: `<label class="field-label" for="nudgeMsg">Message</label><textarea class="textarea" id="nudgeMsg" rows="3">Hi ${esc(p.name.split(' ')[0])}, we miss you in ${esc(D.WORKSPACE.cohort)}! Even 15 minutes on your next activity keeps your momentum. Need help? Reply here or join Wednesday office hours.</textarea><p class="muted xs" style="margin-top:8px">Respects the learner's quiet hours. Recorded in the audit log.</p>`, confirm: 'Send nudge',
      onConfirm: () => { E.commit(() => E.nudge(p.id)); C.toast(`Nudge sent to ${p.name}.`); } });
  };

  /* ======================= AUDIT & INTEGRITY ======================= */
  P.audTab = P.audTab || 'audit'; P.audQ = P.audQ || '';
  R.audit = {
    roles: ['pm'], icon: 'shield', keywords: 'logs ledger integrity security compliance',
    render() {
      const q = P.audQ.toLowerCase(), rows = AH.S.audit.filter(a => !q || (a.actor + a.action + a.target + a.role).toLowerCase().includes(q));
      const chain = P.chain;
      return `${C.header({ title: AH.t('audit'), desc: 'Append-only records of who did what, when — plus a cryptographic check that no XP was edited after the fact.', actions: `<button class="btn btn-outline btn-sm" type="button" data-action="auditCsv">${ic('download', 'ic-sm')}Export CSV</button>` })}
      <div class="tabs-line" role="tablist" aria-label="Audit views">${[['audit', 'Audit log', AH.S.audit.length], ['ledger', 'XP ledger integrity', AH.S.ledger.length], ['events', 'Product events', AH.S.events.length]].map(([k, l, n]) => `<button role="tab" type="button" aria-selected="${P.audTab === k}" data-action="audTab" data-tab="${k}">${l}<span class="cnt">${n}</span></button>`).join('')}</div>
      ${P.audTab === 'audit' ? `<div class="row gap-12" style="margin-bottom:12px"><label class="sr-only" for="audQ">Filter audit log</label><input class="input" id="audQ" style="max-width:360px" type="search" placeholder="Filter by person, action or target" value="${esc(P.audQ)}"></div>
        <div class="card table-wrap"><table class="tbl"><caption class="sr-only">Audit log</caption><thead><tr><th>When (IST)</th><th>Actor</th><th>Role</th><th>Action</th><th>Target</th></tr></thead>
        <tbody>${rows.slice(0, 100).map(a => `<tr><td class="small">${esc(U.fullDate(a.at))}</td><td class="bold">${esc(a.actor)}</td><td class="small text-2">${esc(a.role)}</td><td><span class="badge badge-neutral mono">${esc(a.action)}</span></td><td class="small">${esc(a.target)}</td></tr>`).join('') || `<tr><td colspan="5" class="muted">No matching entries.</td></tr>`}</tbody></table></div>`
      : P.audTab === 'ledger' ? `<div class="card card-pad row between wrap gap-16" style="margin-bottom:14px"><div><b>Hash-chain verification</b><p class="muted small">Each entry stores the hash of the one before it. Editing any past entry breaks every hash after it.</p></div><button class="btn btn-ink" type="button" data-action="verifyChain">${ic('shield', 'ic-sm')}Verify now</button></div>
        ${chain ? `<div class="callout ${chain.ok ? 'ok' : 'warn'}" style="margin-bottom:14px" role="status">${ic(chain.ok ? 'checkCircle' : 'alert')}<div><b>${chain.ok ? `Intact — ${chain.total} entries verified` : `Broken at entry ${chain.id}`}</b>${chain.ok ? `Head hash <span class="mono">${esc(chain.head)}</span> · checked ${U.ago(chain.at)}` : 'Investigate immediately; ledger writes are frozen.'}</div></div>` : ''}
        <div class="card table-wrap"><table class="tbl"><caption class="sr-only">XP ledger for ${esc(E.me().name)}</caption><thead><tr><th>Entry</th><th>When</th><th>Source</th><th>XP</th><th>Idempotency key</th><th>Hash</th></tr></thead>
        <tbody>${AH.S.ledger.slice().reverse().map(e => `<tr><td class="mono">${esc(e.id)}</td><td class="small">${U.timeTag(e.at)}</td><td>${esc(e.source)}</td><td class="num bold">+${e.amount}</td><td class="mono">${esc(e.idem)}</td><td class="mono" title="prev ${esc(e.prev)}">${esc(e.hash.slice(0, 12))}…</td></tr>`).join('')}</tbody></table></div>`
      : `<div class="card table-wrap"><table class="tbl"><caption class="sr-only">Product events</caption><thead><tr><th>When</th><th>Event</th><th>Role</th><th>Properties</th></tr></thead>
        <tbody>${AH.S.events.slice(0, 50).map(ev => `<tr><td class="small">${U.timeTag(ev.at)}</td><td class="mono">${esc(ev.name)}</td><td class="small">${esc(ev.role)}</td><td class="mono small">${esc(JSON.stringify(ev.props))}</td></tr>`).join('') || `<tr><td colspan="4" class="muted">No events yet — use the app as a learner and come back.</td></tr>`}</tbody></table></div>`}`;
    },
    after() { const i = $('#audQ'); if (i) i.addEventListener('input', U.debounce(() => { P.audQ = i.value; SH.render(); const n = $('#audQ'); n.focus(); n.setSelectionRange(n.value.length, n.value.length); }, 200)); }
  };
  A.audTab = el => { P.audTab = el.dataset.tab; SH.render(); };
  A.verifyChain = () => { P.chain = { ...E.verifyChain(), at: Date.now() }; E.commit(() => E.audit('ledger.verified', P.chain.ok ? `intact (${P.chain.total})` : `broken at ${P.chain.id}`)); };
  A.auditCsv = () => { U.download('audit-log.csv', [['timestamp', 'actor', 'role', 'action', 'target'], ...AH.S.audit.map(a => [new Date(a.at).toISOString(), a.actor, a.role, a.action, a.target])].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n'), 'text/csv'); };
})(window.AH = window.AH || {});
