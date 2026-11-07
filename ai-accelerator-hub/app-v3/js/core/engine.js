/* AI Accelerator Hub v3 — domain engine (state + business rules).
   Mirrors the server contracts in the gamification model so the UI behaves
   like production: append-only XP ledger with idempotency keys and a hash
   chain, competence-gated unlocks, non-punitive streaks, declarative badges,
   rubric-based review, notifications and an audit trail.
   In production these run server-side; here they run locally on demo data. */
(function (AH) {
  'use strict';
  const { U, D } = AH;
  const E = (AH.E = {});
  const KEY = 'ah3_state_v1', VERSION = 3;
  const NOW = Date.now(), DAY = U.DAY, H = 3600000;
  const listeners = new Set();

  /* ---------------- State ---------------- */
  function fresh() {
    const S = {
      v: VERSION, role: 'learner',
      prefs: { lang: 'en', sound: false, motion: 'system', lbVisibility: 'cohort', globalOptIn: false, rail: false,
        notif: { streak: true, reviews: true, community: true, quiet: true }, aiOutage: false },
      progress: {
        levels: Object.fromEntries(D.LEVELS.map(l => [l.idx, l.idx === 1 ? 'in_progress' : 'locked'])),
        acts: { 1: 'completed', 2: 'completed', 3: 'available', 4: 'locked', 5: 'locked', 6: 'locked' },
        a1: 0, quiz: { 0: 1, 1: 1, 2: 0, 3: 1 }, quizScore: 100, a3: {},
        code: null, tests: null, repo: '', commit: null,
        boss: { attempts: 0, best: 0, runs: [], code: null },
        lastAct: 3
      },
      submissions: [],
      peerSubs: JSON.parse(JSON.stringify(D.PEER_SUBMISSIONS)),
      decided: JSON.parse(JSON.stringify(D.DECIDED)),
      ledger: [],
      streak: { current: 3, longest: 5, freezes: 1, status: 'active', lastDay: U.istDay(NOW - DAY), prev: 0, events: [] },
      badges: {},
      notifications: [],
      audit: [],
      posts: D.POSTS.map(p => ({ ...p, liked: false, reported: false, status: 'live', replies: p.replies.map(([w, t, d], i) => ({ id: `${p.id}-r${i}`, who: w, text: t, at: NOW - d * DAY, likes: 0, liked: false })) })),
      chat: { coach: 'concept-explainer', threads: { 'concept-explainer': [], 'code-mentor': [], 'career-coach': [] }, used: 0, day: U.istDay() },
      shortlist: [], celebrations: [], events: [], resOpen: [], nudged: {}
    };
    // Ledger history for A1 and A2 (already completed in the seed)
    pushLedger(S, { source: 'activity_completed', amount: 5, ref: 'L1·A1 Mission Briefing', idem: 'act:L01:A1', at: NOW - 3 * DAY });
    pushLedger(S, { source: 'activity_completed', amount: 18, ref: 'L1·A2 Learn (quiz 100%)', idem: 'act:L01:A2', at: NOW - 1 * DAY });
    S.notifications.push(
      { id: U.uid('n'), type: 'event', icon: 'calendar', tone: 'gold', title: 'Saturday workshop: classes in the wild', body: 'Live at 10:00 IST. The recording lands in your Library afterwards.', at: NOW - 2 * H, read: false, href: '#/library' },
      { id: U.uid('n'), type: 'xp', icon: 'zap', tone: 'ok', title: '+18 XP — Learn complete', body: 'Quiz passed with 100%. Explore GitHub is now open.', at: NOW - DAY, read: true, href: '#/journey/1' },
      { id: U.uid('n'), to: 'reviewer', type: 'review', icon: 'clock', tone: 'warn', title: 'Review SLA at risk', body: 'Divya Nair has waited 52 h (target 72 h).', at: NOW - 3 * H, read: false, href: '#/review/sub-k1' },
      { id: U.uid('n'), to: 'pm', type: 'info', icon: 'users', tone: 'warn', title: '4 learners need attention', body: '2 in grace, 2 in streak recovery. Nudges are one click away.', at: NOW - 4 * H, read: false, href: '#/learners' },
      { id: U.uid('n'), to: 'pm', type: 'info', icon: 'chart', tone: '', title: 'Drop-off spike at Build', body: 'Only 22 of 31 learners moved from Explore to Build in Level 1.', at: NOW - 26 * H, read: true, href: '#/analytics' }
    );
    S.audit.push(
      { id: U.uid('a'), at: NOW - 9 * DAY, actor: 'Sanjay Kapoor', role: 'Program Manager', action: 'cohort.published', target: `${D.WORKSPACE.cohort} · Level 1`, ip: '10.4.1.12' },
      { id: U.uid('a'), at: NOW - 9 * DAY, actor: 'Sanjay Kapoor', role: 'Program Manager', action: 'role.assigned', target: 'Priya Raman → Reviewer', ip: '10.4.1.12' },
      { id: U.uid('a'), at: NOW - 3 * DAY, actor: 'system', role: 'Ledger', action: 'xp.awarded', target: 'Ishaan Verma +5 (act:L01:A1)', ip: '—' },
      { id: U.uid('a'), at: NOW - 3 * DAY, actor: 'Priya Raman', role: 'Reviewer', action: 'review.needs_changes', target: 'Arjun Mehta · L1 attempt 1 (2.70)', ip: '10.4.2.33' },
      { id: U.uid('a'), at: NOW - 1 * DAY, actor: 'system', role: 'Ledger', action: 'xp.awarded', target: 'Ishaan Verma +18 (act:L01:A2)', ip: '—' }
    );
    return S;
  }

  function load() {
    const s = U.store.get(KEY, null);
    if (!s || s.v !== VERSION) return fresh();
    return s;
  }
  AH.S = load();
  const persist = U.debounce(() => { if (!U.store.set(KEY, AH.S)) console.warn('[AH] state not persisted (storage unavailable)'); }, 120);

  E.subscribe = fn => { listeners.add(fn); return () => listeners.delete(fn); };
  E.commit = (fn, opts = {}) => { if (fn) fn(AH.S); persist(); if (!opts.silent) listeners.forEach(l => l()); };
  E.reset = () => { U.store.remove(KEY); AH.S = fresh(); E.commit(); };
  // Keep tabs in sync (state written by another tab)
  window.addEventListener('storage', e => { if (e.key === KEY && e.newValue) { try { AH.S = JSON.parse(e.newValue); listeners.forEach(l => l()); } catch (x) {} } });

  E.persona = () => D.PERSONAS[AH.S.role];
  E.me = () => D.PERSONAS.learner;

  /* ---------------- Telemetry & audit ---------------- */
  E.track = (name, props = {}) => {
    const ev = { name, props, at: Date.now(), role: AH.S.role };
    AH.S.events.unshift(ev); AH.S.events.length = Math.min(AH.S.events.length, 200);
  };
  E.audit = (action, target) => {
    const p = E.persona();
    AH.S.audit.unshift({ id: U.uid('a'), at: Date.now(), actor: p.name, role: p.title, action, target, ip: '127.0.0.1' });
  };
  E.notify = ({ type = 'info', icon = 'bell', tone = '', title, body = '', href = '', to = 'learner' }) => {
    const pref = AH.S.prefs.notif;
    if (to === 'learner' && ((type === 'streak' && !pref.streak) || (type === 'review' && !pref.reviews) || (type === 'community' && !pref.community))) return;
    AH.S.notifications.unshift({ id: U.uid('n'), to, type, icon, tone, title, body, href, at: Date.now(), read: false });
  };
  E.myNotifications = () => AH.S.notifications.filter(n => (n.to || 'learner') === AH.S.role);

  /* ---------------- XP ledger (append-only, idempotent, hash-chained) ---------------- */
  function pushLedger(S, { source, amount, ref, idem, at = Date.now() }) {
    const prev = S.ledger.length ? S.ledger[S.ledger.length - 1].hash : 'GENESIS';
    const id = 'xp_' + (S.ledger.length + 1).toString().padStart(5, '0');
    const hash = U.hash([prev, id, amount, source, idem, at].join('|'));
    const entry = { id, at, source, amount, ref, idem, prev, hash };
    S.ledger.push(entry);
    return entry;
  }
  E.award = ({ source, amount, ref, idem }) => {
    if (AH.S.ledger.some(e => e.idem === idem)) { E.track('xp.duplicate_blocked', { idem }); return null; }  // UNIQUE(idempotency_key)
    const entry = pushLedger(AH.S, { source, amount, ref, idem });
    E.audit('xp.awarded', `${E.me().name} +${amount} (${idem})`);
    E.track('xp.awarded', { amount, source });
    return entry;
  };
  E.xp = () => AH.S.ledger.reduce((s, e) => s + e.amount, 0);
  E.verifyChain = () => {
    let prev = 'GENESIS';
    for (let i = 0; i < AH.S.ledger.length; i++) {
      const e = AH.S.ledger[i];
      const expect = U.hash([prev, e.id, e.amount, e.source, e.idem, e.at].join('|'));
      if (e.prev !== prev || e.hash !== expect) return { ok: false, at: i, id: e.id, total: AH.S.ledger.length };
      prev = e.hash;
    }
    return { ok: true, total: AH.S.ledger.length, head: prev };
  };

  /* ---------------- Metrics, tiers, badges ---------------- */
  E.approvedLevels = () => Object.entries(AH.S.progress.levels).filter(([, s]) => s === 'approved').map(([k]) => +k);
  E.metrics = () => ({
    xp: E.xp(), approvedLevels: E.approvedLevels(),
    approvedCount: AH.S.submissions.filter(s => s.state === 'approved').length,
    longest: AH.S.streak.longest, weeklyTop10: false, prMerged: false, track: null
  });
  E.tier = () => D.pick(D.TIERS, E.xp());
  E.nextTier = () => D.next(D.TIERS, E.xp());
  E.rank = () => D.pick(D.RANKS, E.xp());
  E.evalBadges = () => {
    const m = E.metrics(); const earned = [];
    D.BADGES.forEach(b => {
      if (AH.S.badges[b.code] || !b.cond(m)) return;
      AH.S.badges[b.code] = Date.now();
      if (b.xp) E.award({ source: 'badge_bonus', amount: b.xp, ref: `Badge · ${b.name}`, idem: `badge:${b.code}` });
      E.notify({ type: 'xp', icon: 'award', tone: 'gold', title: `Badge earned: ${b.name}`, body: `${b.desc}. +${b.xp} XP`, href: '#/achievements' });
      earned.push(b);
    });
    return earned;
  };
  E.standings = () => {
    const me = { id: 'u-me', name: E.me().name, city: E.me().city, xp: E.xp(), me: true };
    return [...D.PEERS.map(p => ({ ...p })), me].sort((a, b) => b.xp - a.xp);
  };
  E.myPos = () => { const r = E.standings(); return { pos: r.findIndex(x => x.me) + 1, total: r.length }; };

  /* ---------------- Streak (non-punitive: freeze → grace → recovery) ---------------- */
  E.touchStreak = () => {
    const st = AH.S.streak, today = U.istDay();
    if (st.status === 'recovery' || st.lastDay === today) return false;
    st.current += 1; st.longest = Math.max(st.longest, st.current); st.lastDay = today; st.status = 'active';
    st.events.unshift({ at: Date.now(), kind: 'increment', value: st.current });
    if (st.current % 7 === 0 && st.freezes < 7) {
      st.freezes += 1;
      E.notify({ type: 'streak', icon: 'snow', tone: 'ok', title: `${st.current}-day streak — freeze earned`, body: 'A freeze token protects your streak on a day you can\'t make it.' });
    }
    return true;
  };
  E.simulateMissedDay = () => {
    const st = AH.S.streak;
    st.lastDay = U.istDay(Date.now() - 2 * DAY);
    if (st.status === 'active' || st.status === 'frozen') {
      if (st.freezes > 0) {
        st.freezes -= 1; st.status = 'frozen';
        st.events.unshift({ at: Date.now(), kind: 'freeze_used', value: st.current });
        E.notify({ type: 'streak', icon: 'snow', tone: '', title: 'Streak frozen', body: `You missed a day, so a freeze token kept your ${st.current}-day streak safe.` });
      } else {
        st.status = 'grace';
        st.events.unshift({ at: Date.now(), kind: 'grace_started', value: st.current });
        E.notify({ type: 'streak', icon: 'clock', tone: 'warn', title: 'Streak at risk', body: 'Finish any activity by tomorrow midnight (IST) to keep it.' });
      }
    } else if (st.status === 'grace') {
      st.status = 'recovery'; st.prev = st.current;
      st.events.unshift({ at: Date.now(), kind: 'recoverable', value: st.current });
      E.notify({ type: 'streak', icon: 'pause', tone: '', title: `Streak paused at ${st.current}`, body: 'Recover it with a 2-minute quick win within 7 days.', href: '#/mission' });
    }
    E.audit('streak.simulated_missed_day', `${E.me().name} → ${st.status}`);
  };
  E.recoverStreak = () => {
    const st = AH.S.streak;
    if (st.status !== 'recovery') return;
    st.status = 'active'; st.current = st.prev || st.current; st.lastDay = U.istDay();
    st.events.unshift({ at: Date.now(), kind: 'recovery', value: st.current });
    E.notify({ type: 'streak', icon: 'flame', tone: 'ok', title: 'Streak recovered', body: `Back to ${st.current} days. Nice comeback.` });
  };

  /* ---------------- Learning loop (Level 1) ---------------- */
  E.actState = n => AH.S.progress.acts[n];
  const unlockNext = n => { if (n < 6 && AH.S.progress.acts[n + 1] === 'locked') AH.S.progress.acts[n + 1] = 'available'; };
  E.completeActivity = (n, ref) => {
    const p = AH.S.progress, a = D.L1.acts[n];
    if (!['available', 'completed'].includes(p.acts[n])) return { ok: false, reason: 'locked' };
    const first = p.acts[n] !== 'completed';
    p.acts[n] = 'completed';
    unlockNext(n);
    const entry = E.award({ source: 'activity_completed', amount: a.xp, ref: ref || `L1·A${n} ${D.ACTIVITY_TYPES[n - 1].name}`, idem: `act:L01:A${n}` });
    const streaked = first ? E.touchStreak() : false; // revisits are not qualifying actions
    E.evalBadges();
    if (first) { p.lastAct = Math.min(n + 1, 6); E.track('activity.completed', { level: 1, act: n }); }
    return { ok: true, entry, streaked };
  };

  /* In-browser static checks for the Build and Boss steps.
     (Production: the pushed commit runs in an isolated pytest runner.) */
  E.BUILD_TESTS = [
    { name: 'class Cookie is defined', test: c => /^class\s+Cookie\s*(\(\s*\))?\s*:/m.test(c), hint: 'Start a line with: class Cookie:' },
    { name: '__init__(self, shape) stores the shape', test: c => /def\s+__init__\s*\(\s*self\s*,\s*shape\s*\)\s*:/.test(c) && /self\.shape\s*=\s*shape/.test(c), hint: 'Inside the class: def __init__(self, shape): then self.shape = shape' },
    { name: 'oven_temp = 180 is shared (class attribute)', test: c => /^( {4}|\t)oven_temp\s*=\s*180\b/m.test(c), hint: 'Put oven_temp = 180 directly in the class body (4 spaces in), not inside __init__.' },
    { name: 'two cookies with different shapes', test: c => { const s = new Set(); const re = /^\s*\w+\s*=\s*Cookie\(\s*(["'])(.+?)\1\s*\)/gm; let m; while ((m = re.exec(c))) s.add(m[2]); return s.size >= 2; }, hint: 'At the bottom: star = Cookie("star") and heart = Cookie("heart")' }
  ];
  E.BOSS_TESTS = [
    { name: 'count starts at 0', test: c => /^( {4}|\t)count\s*=\s*0\b/m.test(c), hint: 'Add count = 0 to the class body, next to oven_temp.' },
    { name: 'count goes up by 1 per cookie', test: c => /(Cookie|cls|type\(self\))\.count\s*(\+=\s*1|=\s*(Cookie|cls|type\(self\))\.count\s*\+\s*1)/.test(c) && !/self\.count\s*\+=/.test(c), hint: 'In __init__, increase the class attribute: Cookie.count += 1 (self.count += 1 creates a personal copy instead).' },
    { name: 'total_baked() returns count', test: c => /@classmethod\s*\n\s*def\s+total_baked\s*\(\s*cls\s*\)\s*:[\s\S]*?return\s+(cls|Cookie)\.count/.test(c), hint: 'Add @classmethod on the line above def total_baked(cls): and return cls.count' }
  ];
  E.runTests = (code, suite) => suite.map(t => ({ name: t.name, pass: !!t.test(code), hint: t.hint }));
  E.STARTER = '# cookie.py — Level 1 build\n# TODO 1: create the class Cookie\n# TODO 2: give it the shared attribute oven_temp = 180\n# TODO 3: add __init__(self, shape) and store shape on self\n# TODO 4: create two cookies with different shapes\n\n';

  E.recordBuild = async (repo, code) => {
    await U.sleep(900); // simulated GitHub webhook / API latency
    const sha = U.hash(code + repo).slice(0, 7);
    AH.S.progress.commit = { sha, at: Date.now(), repo };
    AH.S.progress.repo = repo;
    E.audit('github.push_detected', `${repo} @ ${sha}`);
    return sha;
  };

  E.runBoss = code => {
    const b = AH.S.progress.boss;
    if (b.attempts >= D.L1.acts[6].attempts) return null;
    const results = E.runTests(code, E.BOSS_TESTS);
    const passed = results.filter(r => r.pass).length;
    b.attempts += 1; b.best = Math.max(b.best, passed); b.code = code;
    b.runs.unshift({ at: Date.now(), passed, total: results.length });
    E.audit('boss.attempt', `${E.me().name} · Mould Trial ${passed}/${results.length} (attempt ${b.attempts})`);
    E.track('boss.attempt', { passed });
    if (passed === results.length) E.touchStreak();
    return { results, passed };
  };

  /* AI pre-review — a suggestion only. A human reviewer always decides (REQ-EVAL-02). */
  E.aiPreReview = sub => {
    const r = sub.reflection || '', w = U.wordCount(r);
    const concept = (r.match(/\b(class|instance|object|shared|personal|attribute|classmethod)\b/gi) || []).length;
    const struggle = /struggl|stuck|confus|mistake|wrong|fix|bug|realis|learned/i.test(r);
    const tests = AH.S.progress.tests;
    const boss = sub.boss ? sub.boss.passed : 0;
    return {
      correctness: tests && tests.every(t => t.pass) ? 4 : 2,
      oop: concept >= 4 ? 4 : concept >= 2 ? 3 : 2,
      quality: sub.checklist && sub.checklist[0] ? 3 : 2,
      reflection: w >= 90 && struggle ? 4 : w >= 50 ? 3 : 1,
      boss: boss === 3 ? 4 : boss === 2 ? 3 : boss ? 2 : 1
    };
  };

  E.submitProof = ({ repo, deploy, reflection, checklist }) => {
    const p = AH.S.progress;
    if (!['available', 'completed'].includes(p.acts[5])) return { ok: false, reason: 'locked' };
    const attempt = AH.S.submissions.filter(s => s.levelIdx === 1).length + 1;
    const sub = { id: U.uid('sub'), who: 'u-me', levelIdx: 1, at: Date.now(), attempt, state: 'pending', repo, deploy, reflection, checklist,
      boss: p.boss.best ? { passed: p.boss.best, total: 3 } : null };
    sub.ai = E.aiPreReview(sub);
    AH.S.submissions.unshift(sub);
    if (p.acts[5] !== 'completed') { p.acts[5] = 'completed'; }
    E.award({ source: 'proof_submitted', amount: D.L1.acts[5].xp, ref: 'L1·A5 Submit Proof', idem: 'act:L01:A5' });
    p.acts[6] = 'in_review'; p.lastAct = 6;
    E.touchStreak();
    E.audit('submission.created', `${E.me().name} · L1 attempt ${attempt}`);
    E.notify({ type: 'review', icon: 'inbox', tone: '', title: 'Proof received', body: `Attempt ${attempt} is in the review queue. Typical turnaround: under ${D.WORKSPACE.reviewSlaHours} h. Try the Boss challenge while you wait.`, href: '#/journey/1/6' });
    E.notify({ to: 'reviewer', type: 'review', icon: 'inbox', tone: 'gold', title: `New submission: ${E.me().name}`, body: `Level 1 · attempt ${attempt}. AI pre-review suggests ${D.weighted(sub.ai).toFixed(2)}.`, href: `#/review/${sub.id}` });
    E.track('submission.created', { attempt });
    return { ok: true, sub };
  };

  E.allPending = () => [...AH.S.submissions.filter(s => s.state === 'pending'), ...AH.S.peerSubs.filter(s => s.state === 'pending')].sort((a, b) => a.at - b.at);
  E.findSub = id => AH.S.submissions.find(s => s.id === id) || AH.S.peerSubs.find(s => s.id === id);
  E.whoName = who => (who === 'u-me' ? E.me().name : (D.PEERS.find(p => p.id === who) || {}).name || 'Learner');

  E.decide = (id, scores, verdict, feedback) => {
    const sub = E.findSub(id); if (!sub || sub.state !== 'pending') return { ok: false };
    const avg = D.weighted(scores), pass = D.passes(scores);
    if (verdict === 'approved' && !pass) return { ok: false, reason: 'below_threshold' };
    const reviewer = D.PERSONAS.reviewer.name;
    sub.state = verdict; sub.review = { scores, avg, verdict, feedback, by: reviewer, at: Date.now() };
    AH.S.decided.unshift({ id: sub.id, who: sub.who, levelIdx: sub.levelIdx, at: sub.at, decidedAt: Date.now(), verdict, avg, by: reviewer });
    E.audit(`review.${verdict}`, `${E.whoName(sub.who)} · L${sub.levelIdx} attempt ${sub.attempt} (${avg.toFixed(2)})`);
    E.track('review.decided', { verdict, avg });
    if (sub.who === 'u-me') {
      const p = AH.S.progress;
      if (verdict === 'approved') {
        p.acts[6] = 'completed'; p.levels[1] = 'approved'; p.levels[2] = 'available';
        E.award({ source: 'review_approved', amount: D.L1.acts[6].baseXp, ref: `L1 review approved (${avg.toFixed(2)})`, idem: 'review:L01:approved' });
        const bossBest = p.boss.best;
        if (bossBest >= 2) E.award({ source: 'boss_bonus', amount: bossBest === 3 ? D.L1.acts[6].bossXp : 13, ref: `Boss · The Mould Trial ${bossBest}/3`, idem: 'boss:L01' });
        E.touchStreak();
        const badges = E.evalBadges();
        AH.S.celebrations.push({ kind: 'level', title: 'Level 1 complete', body: `Approved with ${avg.toFixed(2)} by ${reviewer}. Level 2 — Prompt Craft is unlocked.`, badges: badges.map(b => b.code) });
        E.notify({ type: 'review', icon: 'checkCircle', tone: 'ok', title: 'Level 1 approved', body: `${reviewer} scored your proof ${avg.toFixed(2)} / 5.${feedback ? ' “' + feedback.slice(0, 90) + (feedback.length > 90 ? '…' : '') + '”' : ''}`, href: '#/journey/1/6' });
        E.notify({ type: 'info', icon: 'unlock', tone: 'gold', title: 'Level 2 unlocked: Prompt Craft', body: 'Its activities appear as soon as your program team publishes them.', href: '#/journey' });
        E.audit('level.unlocked', `${E.me().name} · L2 (competence gate passed)`);
      } else {
        p.acts[6] = 'needs_changes'; p.acts[5] = 'available'; p.lastAct = 5;
        E.notify({ type: 'review', icon: 'refresh', tone: 'warn', title: 'Changes requested on Level 1', body: `${reviewer}: “${feedback.slice(0, 120)}${feedback.length > 120 ? '…' : ''}” Resubmit any time — you keep all XP.`, href: '#/journey/1/5' });
      }
    }
    return { ok: true, avg };
  };

  E.nudge = peerId => {
    const p = D.PEERS.find(x => x.id === peerId);
    AH.S.nudged[peerId] = Date.now();
    E.audit('mentor.nudge_sent', `${p.name} (${p.status})`);
    E.track('mentor.nudge', { status: p.status });
  };

  /* AI quota (per-learner daily) */
  E.aiUse = () => {
    const c = AH.S.chat, today = U.istDay();
    if (c.day !== today) { c.day = today; c.used = 0; }
    if (c.used >= D.AI_DAILY_QUOTA) return false;
    c.used += 1; return true;
  };

  /* DPDP-style export of everything held about the learner */
  E.exportMyData = () => JSON.stringify({
    exportedAt: new Date().toISOString(), subject: E.me(), workspace: D.WORKSPACE,
    preferences: AH.S.prefs, progress: AH.S.progress, submissions: AH.S.submissions,
    xpLedger: AH.S.ledger, streak: AH.S.streak, badges: AH.S.badges,
    posts: AH.S.posts.filter(p => p.who === 'u-me'), notifications: AH.S.notifications
  }, null, 2);
})(window.AH = window.AH || {});
