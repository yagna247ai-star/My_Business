/* AI Accelerator Hub v3 — community & support: feed, library, launch wall, AI coaches */
(function (AH) {
  'use strict';
  const { U, D, E, C, SH, t } = AH; const { esc, ic, $, $$ } = U;
  const P = (AH.P = AH.P || {}); const R = AH.ROUTES, A = AH.A;
  const ALL = ['learner', 'reviewer', 'pm'];
  const name = who => who === 'u-me' ? (AH.S.role === 'learner' ? 'You' : E.me().name) : E.whoName(who);
  const metaOf = who => { if (who === 'u-me') return `${E.me().city} · ${E.rank().name}`; const p = D.PEERS.find(x => x.id === who); return p ? `${p.city} · ${D.pick(D.RANKS, p.xp).name}` : ''; };

  /* ======================= COHORT FEED ======================= */
  const F = (P.feed = P.feed || { tab: 'posts', filter: 'all', tag: 0, limit: 6, draft: '', openReply: null });
  const tagLabel = tg => tg === 0 ? 'General' : `Level ${tg}`;
  R.feed = {
    roles: ALL, icon: 'feed', keywords: 'community posts questions',
    render() {
      const canPost = AH.S.role === 'learner';
      return `${C.header({ variant: 'cream', eyebrow: esc(D.WORKSPACE.cohort), title: 'Ask, share, unblock each other', desc: 'Questions, tips and small wins from your cohort. Only members of your institution can see this feed.' })}
      ${canPost ? `<section class="card composer" aria-labelledby="compT" style="margin-bottom:20px"><div class="composer-inner">
        <h2 class="h3" id="compT">Post to your cohort</h2>
        <div class="row gap-16" style="align-items:flex-start;margin-top:14px">
          <span class="avatar me" aria-hidden="true">${U.initials(E.me().name)}</span>
          <div style="flex:1;min-width:0"><label class="sr-only" for="postText">Your post</label>
            <textarea class="textarea" id="postText" maxlength="2000" placeholder="Stuck on something, or figured something out, ${esc(E.me().first)}?" aria-describedby="postCount">${esc(F.draft)}</textarea>
            <div class="row between xs muted" style="margin-top:6px"><span>Links are allowed. Never post passwords or API keys.</span><span id="postCount">${F.draft.length}/2000</span></div></div>
        </div>
        <div class="row gap-12" style="margin-top:12px"><span class="bold small" id="tagLbl" style="flex-shrink:0">Tag</span>
          <div class="chips" role="radiogroup" aria-labelledby="tagLbl" style="flex:1;min-width:0">${[0, ...D.LEVELS.map(l => l.idx)].map(tg => `<button class="chip ${F.tag === tg ? '' : 'chip-soft'}" type="button" role="radio" aria-checked="${F.tag === tg}" data-action="feedTag" data-t="${tg}">${tagLabel(tg)}</button>`).join('')}</div></div>
        <div class="row gap-12 wrap" style="justify-content:flex-end;margin-top:14px;padding-top:14px;border-top:1px solid var(--border)">
          <span class="muted xs" style="margin-right:auto">Posts that look like selling, crypto or spam are held for a moderator.</span>
          <button class="btn btn-gold" id="postBtn" type="button" data-action="feedPost" ${F.draft.trim() ? '' : 'disabled'}>${ic('send', 'ic-sm')}Post</button>
        </div></div></section>` : `<div class="callout info" style="margin-bottom:16px">${ic('eye')}<div><b>Viewing as ${esc(E.persona().title)}</b>Staff can read, reply to and moderate the cohort feed.</div></div>`}
      <div class="row gap-12" style="margin-bottom:14px"><span class="section-label" id="showLbl" style="flex-shrink:0">Show</span>
        <div class="chips" role="radiogroup" aria-labelledby="showLbl" style="flex:1;min-width:0">${[['all', 'Everything'], ['0', 'General'], ...D.LEVELS.map(l => [String(l.idx), `Level ${l.idx}`])].map(([v, l]) => `<button class="chip" type="button" role="radio" aria-checked="${F.filter === v}" data-action="feedFilter" data-f="${v}">${l}</button>`).join('')}</div></div>
      <div id="feedList" class="stack gap-16">${feedList()}</div>`;
    },
    after() {
      const ta = $('#postText'); if (!ta) return;
      ta.addEventListener('input', () => { F.draft = ta.value; $('#postBtn').disabled = !ta.value.trim(); $('#postCount').textContent = `${ta.value.length}/2000`; });
    }
  };
  const visible = () => AH.S.posts.filter(p => (p.status === 'live' || p.who === 'u-me' || AH.S.role !== 'learner') && (F.filter === 'all' || String(p.tag) === F.filter));
  function feedList() {
    const all = visible();
    if (!all.length) return C.empty('feed', F.filter === 'all' ? 'No posts yet' : `Nothing tagged ${tagLabel(+F.filter)} yet`, 'Be the first — questions are welcome.');
    return all.slice(0, F.limit).map(postCard).join('') + (all.length > F.limit ? `<div style="text-align:center"><button class="btn btn-cream" type="button" data-action="feedMore">Load more posts</button></div>` : `<p class="muted small" style="text-align:center">You're all caught up.</p>`);
  }
  const likeBtn = (it, kind) => `<button class="act-btn" type="button" data-action="like" data-kind="${kind}" data-id="${it.id}" aria-pressed="${it.liked}" aria-label="Like, ${U.plural(it.likes, 'like')}">${ic('heart', 'ic-sm')}<span aria-hidden="true">${it.likes || 'Like'}</span></button>`;
  function postCard(p) {
    const mine = p.who === 'u-me' && AH.S.role === 'learner', staff = AH.S.role !== 'learner', open = F.openReply === p.id;
    return `<article class="card post" aria-labelledby="pn-${p.id}">
      <div class="post-head"><span class="avatar ${p.who === 'u-me' ? 'me' : ''}" aria-hidden="true">${U.initials(p.who === 'u-me' ? E.me().name : E.whoName(p.who))}</span>
        <div style="flex:1;min-width:0"><div class="post-name" id="pn-${p.id}">${esc(name(p.who))}</div><div class="post-meta">${esc(metaOf(p.who))} · ${U.timeTag(p.at)}</div></div>
        <div class="row gap-8">${p.status === 'held' ? '<span class="badge badge-warn">Held for review</span>' : ''}<span class="badge ${p.tag === 0 ? 'badge-neutral' : 'badge-gold'}">${tagLabel(p.tag)}</span></div></div>
      <div class="post-body">${U.linkify(p.text)}</div>
      <div class="post-actions">${likeBtn(p, 'post')}
        <button class="act-btn" type="button" data-action="replyToggle" data-id="${p.id}" aria-expanded="${open}">${ic('reply', 'ic-sm')}Reply${p.replies.length ? ` (${p.replies.length})` : ''}</button>
        <span class="act-right">${mine ? `<button class="btn btn-text" type="button" data-action="deletePost" data-id="${p.id}">${ic('trash', 'ic-sm')}Delete</button>`
          : staff ? (p.status === 'held' ? `<button class="btn btn-text" type="button" data-action="moderate" data-id="${p.id}" data-v="live">${ic('check', 'ic-sm')}Approve</button>` : `<button class="btn btn-text" type="button" data-action="moderate" data-id="${p.id}" data-v="held">${ic('eyeOff', 'ic-sm')}Hide</button>`)
          : p.reported ? '<span class="muted small">Reported</span>' : `<button class="btn btn-text" type="button" data-action="report" data-id="${p.id}">${ic('flag', 'ic-sm')}Report</button>`}</span></div>
      ${p.replies.length ? `<div class="thread">${p.replies.map(r => `<div><div class="row gap-12" style="align-items:flex-start"><span class="avatar avatar-xs ${r.who === 'u-me' ? 'me' : ''}" aria-hidden="true">${U.initials(r.who === 'u-me' ? E.me().name : r.who.startsWith('staff:') ? r.who.slice(6) : E.whoName(r.who))}</span><div><div class="bold small">${esc(r.who.startsWith('staff:') ? r.who.slice(6) + ' · staff' : name(r.who))}</div><div class="post-meta xs">${U.timeTag(r.at)}</div></div></div><div class="reply-body">${U.linkify(r.text)}</div><div class="reply-actions">${likeBtn(r, 'reply')}</div></div>`).join('')}</div>` : ''}
      ${open ? `<form class="reply-box" data-form="reply" data-id="${p.id}"><label class="sr-only" for="rb-${p.id}">Reply</label><textarea class="textarea" id="rb-${p.id}" rows="2" maxlength="1000" placeholder="Write a reply…" style="min-height:70px"></textarea><div class="row gap-8" style="justify-content:flex-end"><button class="btn btn-text" type="button" data-action="replyToggle" data-id="${p.id}">Cancel</button><button class="btn btn-ink btn-sm" type="submit">Reply</button></div></form>` : ''}
    </article>`;
  }
  const refreshFeed = focus => { const el = $('#feedList'); if (el) el.innerHTML = feedList(); if (focus) { const f = $(focus); if (f) f.focus(); } };
  const findPost = id => AH.S.posts.find(p => p.id === id);
  const findItem = (kind, id) => kind === 'post' ? findPost(id) : AH.S.posts.flatMap(p => p.replies).find(r => r.id === id);
  A.feedTag = el => { F.tag = +el.dataset.t; $$('[data-action="feedTag"]').forEach(b => { const on = +b.dataset.t === F.tag; b.setAttribute('aria-checked', on); b.classList.toggle('chip-soft', !on); }); };
  A.feedFilter = el => { F.filter = el.dataset.f; F.limit = 6; $$('[data-action="feedFilter"]').forEach(b => b.setAttribute('aria-checked', b.dataset.f === F.filter)); refreshFeed(); };
  A.feedMore = () => { F.limit += 6; refreshFeed(); };
  A.feedPost = () => {
    const text = F.draft.trim(); if (!text) return;
    if (/sk-[A-Za-z0-9]{16,}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{20,}/.test(text)) return C.toast('That looks like an API key or token. Remove it before posting.', { tone: 'error' });
    const held = /crypto|bitcoin|forex|buy now|discount code|earn ₹?\d+|dm (me )?for price/i.test(text);
    E.commit(s => { s.posts.unshift({ id: U.uid('post'), who: 'u-me', tag: F.tag, text, at: Date.now(), likes: 0, liked: false, reported: false, status: held ? 'held' : 'live', replies: [] }); E.track('feed.posted', { held }); if (held) E.audit('moderation.auto_held', 'Post by ' + E.me().name); });
    F.draft = ''; F.filter = 'all'; SH.render(); C.blip(780);
    C.toast(held ? 'Posted. A moderator will check it before others see it.' : 'Posted to your cohort.');
  };
  A.like = el => {
    const it = findItem(el.dataset.kind, el.dataset.id); if (!it) return;
    E.commit(() => { it.liked = !it.liked; it.likes += it.liked ? 1 : -1; }, { silent: true });
    el.outerHTML = likeBtn(it, el.dataset.kind); const nb = $(`[data-action="like"][data-id="${it.id}"]`); if (nb) nb.focus(); if (it.liked) C.blip(880);
  };
  A.replyToggle = el => { F.openReply = F.openReply === el.dataset.id ? null : el.dataset.id; refreshFeed(F.openReply ? `#rb-${F.openReply}` : `[data-action="replyToggle"][data-id="${el.dataset.id}"]`); };
  A.report = el => C.dialog({ title: 'Report this post', body: `<label class="field-label" for="repR">Reason</label><select class="select" id="repR"><option>Spam or selling</option><option>Harassment or hate</option><option>Unsafe for minors</option><option>Off-topic</option><option>Something else</option></select><p class="muted xs" style="margin-top:8px">A moderator reviews every report. The author isn't told who reported it.</p>`, confirm: 'Send report',
    onConfirm: d => { const reason = U.$('#repR', d).value; E.commit(s => { findPost(el.dataset.id).reported = true; E.audit('moderation.reported', `${el.dataset.id} · ${reason}`); }, { silent: true }); refreshFeed(); C.toast('Thanks. A moderator will check it.'); } });
  A.deletePost = el => C.dialog({ title: 'Delete your post?', body: 'This removes it and its replies for everyone.', confirm: 'Delete', danger: true, onConfirm: () => { E.commit(s => { s.posts = s.posts.filter(p => p.id !== el.dataset.id); }, { silent: true }); refreshFeed(); C.toast('Post deleted.'); } });
  A.moderate = el => { E.commit(s => { findPost(el.dataset.id).status = el.dataset.v; E.audit(el.dataset.v === 'live' ? 'moderation.approved' : 'moderation.hidden', el.dataset.id); }, { silent: true }); refreshFeed(); C.toast(el.dataset.v === 'live' ? 'Post approved.' : 'Post hidden from learners.'); };
  P.forms = P.forms || {};
  P.forms.reply = f => {
    const ta = $('textarea', f), text = ta.value.trim(); if (!text) return ta.focus();
    const who = AH.S.role === 'learner' ? 'u-me' : 'staff:' + E.persona().name;
    E.commit(s => { findPost(f.dataset.id).replies.push({ id: U.uid('r'), who, text, at: Date.now(), likes: 0, liked: false }); }, { silent: true });
    F.openReply = null; refreshFeed(`[data-action="replyToggle"][data-id="${f.dataset.id}"]`);
  };

  /* ======================= LIBRARY (grows with progress) ======================= */
  P.libraryGroups = () => {
    const p = AH.S.progress, a = p.acts, g = [];
    g.push({ id: 'l1-sessions', title: 'Level 1 · Sessions', level: null, items: [
      { type: 'video', title: 'Kick-off: how the 15 levels work', meta: 'Recording · 42 min' },
      { type: 'video', title: 'Saturday workshop: classes in the wild', meta: 'Recording · 1 h 10 min · captions' },
      { type: 'page', title: 'Workshop slides: The Mould & the Cookie', meta: 'Slides · 24 pages' }] });
    if (a[1] === 'completed') g.push({ id: 'l1-a1', title: 'Mission Briefing — The Cookie Factory', level: 1, items: [{ type: 'page', title: 'Mission brief and success criteria', meta: 'Page' }] });
    if (a[2] === 'completed') g.push({ id: 'l1-a2', title: 'Learn — Classes, Objects, Attributes', level: 1, items: [
      ...D.L1.acts[2].lessons.map(l => ({ type: l.kind === 'video' ? 'video' : 'page', title: l.title, meta: l.meta })),
      { type: 'prompt', title: 'Explain classes and objects with an everyday example, then quiz me with 3 questions.', meta: 'Prompt' },
      { type: 'mine', title: `Your quiz result: ${p.quizScore}%`, meta: 'Your work' }] });
    if (a[3] === 'completed') g.push({ id: 'l1-a3', title: 'Explore GitHub — cookie-demo', level: 1, items: [
      { type: 'link', title: D.L1.acts[3].repo, meta: 'Reference repository' },
      { type: 'prompt', title: 'Walk me through this repository file by file and tell me what each attribute is for.', meta: 'Prompt' }] });
    if (p.commit) g.push({ id: 'l1-a4', title: 'Build — Your Cookie class', level: 1, items: [
      { type: 'code', title: `cookie.py @ ${p.commit.sha}`, meta: 'Your build', code: p.code },
      { type: 'prompt', title: 'Review my Python class for PEP 8 and naming. Ask me questions instead of rewriting it.', meta: 'Prompt' }] });
    if (AH.S.submissions.length) g.push({ id: 'l1-a5', title: 'Submit Proof — your submissions', level: 1, items: AH.S.submissions.map(s => ({ type: 'mine', title: `Attempt ${s.attempt} · ${s.state.replace('_', ' ')}`, meta: `${U.fullDate(s.at)} · ${s.repo}` })) });
    return g;
  };
  R.library = {
    roles: ['learner'], icon: 'book', keywords: 'resources prompts recordings',
    render() {
      const groups = P.libraryGroups(), open = new Set(AH.S.resOpen);
      const icon = { video: 'video', page: 'file', prompt: 'sparkle', mine: 'check', link: 'github', code: 'code' };
      return `${C.header({ variant: 'cream', title: 'Everything from your activities', desc: 'Recordings, prompts, reference repos and the things you\'ve made — filed under the activity they came from. New items appear as you progress.' })}
      <div class="acc">${groups.map(gp => `<section class="acc-item"><h2 style="margin:0;font-size:inherit"><button class="acc-head" type="button" id="ah-${gp.id}" aria-expanded="${open.has(gp.id)}" aria-controls="ap-${gp.id}" data-action="accToggle" data-id="${gp.id}">
        <span class="acc-title">${esc(gp.title)}</span><span class="acc-meta">${gp.level ? `<span class="lv">Level ${gp.level}</span>` : ''}<span>${U.plural(gp.items.length, 'item')}</span>${ic('chevDown', 'chev')}</span></button></h2>
        <div class="acc-panel" id="ap-${gp.id}" role="region" aria-labelledby="ah-${gp.id}" ${open.has(gp.id) ? '' : 'hidden'}>${gp.items.map((it, i) => `<div class="res-row"><span class="res-ic ${it.type === 'prompt' ? 'prompt' : it.type === 'mine' || it.type === 'code' ? 'mine' : ''}" aria-hidden="true">${ic(icon[it.type])}</span>
          <div style="flex:1;min-width:0"><div class="${it.type === 'prompt' ? '' : 'bold'}" style="font-size:14.5px;overflow-wrap:anywhere">${esc(it.title)}</div><div class="muted xs">${esc(it.meta)}</div></div>
          ${it.type === 'prompt' ? `<button class="btn btn-soft btn-sm" type="button" data-action="copyPrompt" data-g="${gp.id}" data-i="${i}">${ic('copy', 'ic-sm')}Copy</button>`
            : it.type === 'code' ? `<button class="btn btn-outline btn-sm" type="button" data-action="viewCode">View</button>`
            : it.type === 'mine' ? '' : `<button class="btn btn-outline btn-sm" type="button" data-action="demoOnly" data-msg="Media files aren't bundled with this demo.">Open</button>`}</div>`).join('')}</div></section>`).join('')}</div>
      <div class="callout info" style="margin-top:18px">${ic('lock')}<div><b>More is on its way</b>Items unlock as you finish activities. Level 2 materials appear once it's published.</div></div>`;
    }
  };
  A.accToggle = el => { const id = el.dataset.id, open = el.getAttribute('aria-expanded') !== 'true'; el.setAttribute('aria-expanded', String(open)); $('#ap-' + id).hidden = !open; E.commit(s => { s.resOpen = open ? [...new Set([...s.resOpen, id])] : s.resOpen.filter(x => x !== id); }, { silent: true }); };
  A.copyPrompt = async el => { const g = P.libraryGroups().find(x => x.id === el.dataset.g); const ok = await U.copy(g.items[+el.dataset.i].title); C.toast(ok ? 'Prompt copied.' : 'Copy failed — select the text manually.'); };
  A.viewCode = () => C.dialog({ title: 'cookie.py', wide: true, cancel: 'Close', body: `<div class="code"><pre>${(AH.S.progress.code || '').split('\n').map(l => `<span class="ln">${U.highlightPy(l) || ' '}</span>`).join('')}</pre></div>` });

  /* ======================= LAUNCH WALL ======================= */
  P.wallFilter = P.wallFilter || 'all';
  R.launch = {
    roles: ALL, icon: 'trophy', keywords: 'showcase projects capstone',
    render() {
      const tracks = [...new Set(D.PROJECTS.map(p => p.track))];
      const list = D.PROJECTS.filter(p => P.wallFilter === 'all' || p.track === P.wallFilter).sort((a, b) => b.at - a.at);
      const covers = ['linear-gradient(135deg,#1A9A75,#0F6B52)', 'linear-gradient(135deg,#1A2466,#0D1440)', 'linear-gradient(135deg,#5B3FD1,#2B1B7A)', 'linear-gradient(135deg,#B78B3F,#7A5A1E)'];
      return `${C.header({ variant: 'navy', eyebrow: 'Launch wall', title: `<span class="hl">${D.PROJECTS.length}</span> reviewed capstones, built for real briefs`, desc: 'Every project here passed a human review. Newest first.' })}
      ${AH.S.role === 'learner' ? `<a class="cta-green" href="#/journey">${ic('rocket', 'ic-lg')}<span style="flex:1;min-width:0"><span class="big" style="display:block">Your Capstone I lands here at Level 10.</span><span class="sub" style="display:block">You're on Level 1 — every level you ship is a step towards it.</span></span>${ic('arrowRight')}</a>` : ''}
      <div class="row gap-12" style="margin-bottom:16px"><span class="section-label" id="wLbl" style="flex-shrink:0">Track</span><div class="chips" role="radiogroup" aria-labelledby="wLbl" style="flex:1;min-width:0">${[['all', 'All tracks'], ...tracks.map(c => [c, D.TRACKS.find(x => x.code === c).name])].map(([v, l]) => `<button class="chip" type="button" role="radio" aria-checked="${P.wallFilter === v}" data-action="wallFilter" data-f="${v}">${esc(l)}</button>`).join('')}</div></div>
      <div class="grid2">${list.map((p, i) => { const tk = D.TRACKS.find(x => x.code === p.track); return `<article class="card proj lift" aria-labelledby="pa-${p.id}">
        <div class="proj-cover" style="background:${covers[(p.id.charCodeAt(5) || i) % covers.length]};color:#fff;position:relative;overflow:hidden" aria-hidden="true">${C.stars(18, i + 3, 0.6)}<span class="proj-ring" style="position:relative">${U.initials(p.name)}</span></div>
        <div class="proj-body"><div class="row gap-8 wrap"><span class="badge badge-gold">${esc(p.cat)}</span><span class="badge badge-neutral">${esc(tk.name)}</span><span class="badge badge-success">${ic('check', 'ic-sm')}Reviewed ${p.score.toFixed(1)}</span></div>
          <div class="proj-title" style="font-size:18px" id="pa-${p.id}">${esc(p.title)}</div>
          <div class="proj-meta"><span>${ic('user', 'ic-sm')}${esc(p.name)}</span><span>${ic('pin', 'ic-sm')}${esc(p.city)}</span><span>${U.timeTag(p.at)}</span></div>
          <p class="proj-desc"><b>Brief:</b> ${esc(p.brief)}. ${esc(p.desc)}</p>
          <div class="proj-actions"><a class="btn btn-gold" href="#" data-action="demoOnly" data-msg="Demo data: this project has no live link." aria-label="Open ${esc(p.title)} by ${esc(p.name)} (opens in a new tab)">Open project ${ic('external', 'ic-sm')}</a>${p.video ? `<button class="btn btn-cream" type="button" data-action="demoOnly" data-msg="Demo videos aren't bundled with this page.">${ic('play', 'ic-sm')}Demo</button>` : ''}</div></div></article>`; }).join('')}</div>`;
    }
  };
  A.wallFilter = el => { P.wallFilter = el.dataset.f; SH.render(); const b = $(`[data-action="wallFilter"][data-f="${P.wallFilter}"]`); if (b) b.focus(); };

  /* ======================= AI COACHES ======================= */
  const CH = (P.chat = P.chat || { draft: '', img: null, ctx: '', timer: null });
  const SECRET = /(sk-[A-Za-z0-9]{16,}|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{20,}|AIza[0-9A-Za-z_-]{30,})/g;
  P.chatHTML = compact => {
    const c = AH.S.chat, m = D.COACHES[c.coach], th = c.threads[c.coach], streaming = !!CH.timer;
    const left = Math.max(0, D.AI_DAILY_QUOTA - (c.day === U.istDay() ? c.used : 0));
    return `<div class="chat ${compact ? 'compact' : ''}" data-chat>
      <div class="coach-pick" role="radiogroup" aria-label="Choose a coach">${Object.entries(D.COACHES).map(([id, md]) => `<button class="seg-opt" type="button" role="radio" aria-checked="${c.coach === id}" tabindex="${c.coach === id ? 0 : -1}" data-action="coachPick" data-coach="${id}"><span class="tile ${md.tile}" aria-hidden="true">${ic(md.icon)}</span><span><b>${md.name}</b><small>${md.desc}</small></span></button>`).join('')}</div>
      <div class="row between wrap gap-8" style="margin:14px 4px 8px"><p class="text-2 small">${esc(m.desc)}. Attach a screenshot if it helps.</p>
        <span class="quota" title="Daily AI allowance">${left} of ${D.AI_DAILY_QUOTA} left today<span class="bar"><i style="width:${(left / D.AI_DAILY_QUOTA) * 100}%"></i></span></span></div>
      ${AH.S.prefs.aiOutage ? `<div class="callout warn" style="margin-bottom:10px">${ic('alert')}<div><b>AI coaches are temporarily unavailable</b>Our AI provider isn't responding. Your progress is safe. Meanwhile: ask in the Cohort Feed, or join office hours on Wednesday at 7 pm.</div></div>` : ''}
      <div class="msgs ${th.length ? '' : 'is-empty'}" role="log" aria-live="polite" aria-label="Conversation with ${esc(m.name)}" data-msgs>${th.length ? th.map(x => `<div class="msg ${x.role}${x.streaming ? ' typing' : ''}${x.err ? ' err' : ''}" data-msg="${x.id}">${x.img ? `<img src="${x.img}" alt="Screenshot you attached">` : ''}<span data-txt>${esc(x.text)}</span></div>`).join('')
        : `<div class="sugg" role="group" aria-label="Suggested questions">${m.sugg.map(s => `<button type="button" data-action="chatSugg" data-q="${esc(s)}">${esc(s)}</button>`).join('')}</div>`}</div>
      ${CH.ctx ? `<div class="ctx">${ic('pin', 'ic-sm')}<span>About: ${esc(CH.ctx)}</span><button type="button" data-action="ctxClear" aria-label="Remove context">${ic('x', 'ic-sm')}</button></div>` : ''}
      ${CH.img ? `<div class="att"><img src="${CH.img}" alt="Screenshot preview"><button class="btn btn-text" type="button" data-action="imgClear" aria-label="Remove screenshot">${ic('x', 'ic-sm')}</button></div>` : ''}
      <form class="chat-comp" data-form="chat">
        <button class="sq" type="button" data-action="imgPick" aria-label="Attach a screenshot">${ic('image')}</button><input type="file" accept="image/png,image/jpeg,image/webp" hidden data-file>
        <label class="sr-only" for="chatTa-${compact ? 'd' : 'p'}">Message ${esc(m.name)}</label>
        <textarea class="textarea" id="chatTa-${compact ? 'd' : 'p'}" rows="1" placeholder="${esc(m.ph)}" data-chatta>${esc(CH.draft)}</textarea>
        ${streaming ? `<button class="sq send" type="button" data-action="chatStop" aria-label="Stop answer">${ic('stop')}</button>` : `<button class="sq send" type="submit" aria-label="Send" ${CH.draft.trim() || CH.img ? '' : 'disabled'}>${ic('send')}</button>`}
      </form>
      <p class="demo-note">Never paste passwords or API keys — messages are scanned and secrets are removed. Demo replies are scripted. Enter sends · Shift+Enter for a new line.</p>
    </div>`;
  };
  P.renderChats = () => $$('[data-chat-root]').forEach(root => {
    const focused = root.contains(document.activeElement) && document.activeElement.matches('[data-chatta]');
    root.innerHTML = P.chatHTML(root.dataset.chatRoot === 'drawer'); bindChat(root);
    if (focused) { const ta = $('[data-chatta]', root); ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
    const ms = $('[data-msgs]', root); ms.scrollTop = ms.scrollHeight;
  });
  function bindChat(root) {
    const ta = $('[data-chatta]', root), grow = () => { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 156) + 'px'; };
    grow();
    ta.addEventListener('input', () => { CH.draft = ta.value; grow(); const s = $('button[type="submit"]', root); if (s) s.disabled = !(ta.value.trim() || CH.img); });
    ta.addEventListener('keydown', e => { if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) { e.preventDefault(); send(); } });
    const file = $('[data-file]', root);
    file.addEventListener('change', () => {
      const f = file.files[0]; if (!f) return;
      if (!/^image\/(png|jpeg|webp)$/.test(f.type)) return C.toast('Attach a PNG, JPEG or WebP image.', { tone: 'error' });
      if (f.size > 5 * 1024 * 1024) return C.toast('That image is over 5 MB.', { tone: 'error' });
      const r = new FileReader(); r.onload = () => { CH.img = r.result; P.renderChats(); }; r.readAsDataURL(f);
    });
  }
  function reply(coach, q) { for (const [re, ans] of D.REPLIES[coach]) if (re.test(q)) return ans; return D.REPLY_DEFAULT[coach]; }
  function send(text) {
    if (CH.timer) return;
    let q = (text != null ? text : CH.draft).trim(); if (!q && !CH.img) return;
    const c = AH.S.chat, coach = c.coach, th = c.threads[coach];
    let redacted = false;
    if (new RegExp(SECRET.source).test(q)) { q = q.replace(SECRET, '[secret removed]'); redacted = true; } // fresh regex: no shared lastIndex
    th.push({ id: U.uid('m'), role: 'me', text: q || '(screenshot)', img: CH.img });
    CH.draft = ''; CH.img = null;
    let full;
    if (AH.S.prefs.aiOutage) full = null;
    else if (!E.aiUse()) full = `You've used today's ${D.AI_DAILY_QUOTA} coach messages. The allowance resets at midnight IST. Meanwhile, the Cohort Feed and Wednesday office hours are great places to ask.`;
    else full = (redacted ? 'I removed something that looked like an API key from your message — keys should only live in your environment variables.\n\n' : '') + (CH.ctx ? `About ${CH.ctx}:\n\n` : '') + (q ? reply(coach, q + ' ' + CH.ctx) : 'Thanks for the screenshot. What did you expect to see, and which activity are you on?');
    E.track('coach.message', { coach, outage: AH.S.prefs.aiOutage });
    if (full == null) { th.push({ id: U.uid('m'), role: 'ai', err: true, text: 'I couldn\'t reach the AI service just now. Nothing was lost — try again in a minute, or ask your cohort in the feed.' }); E.commit(); P.renderChats(); return; }
    const msg = { id: U.uid('m'), role: 'ai', text: '', streaming: true }; th.push(msg);
    E.commit(null, { silent: true }); P.renderChats();
    const words = full.split(/(\s+)/); let i = 0;
    CH.timer = setInterval(() => {
      i += 2; msg.text = words.slice(0, i).join('');
      $$(`[data-msg="${msg.id}"] [data-txt]`).forEach(el => { el.textContent = msg.text; const ms = el.closest('[data-msgs]'); ms.scrollTop = ms.scrollHeight; });
      if (i >= words.length) finish(msg);
    }, 40);
  }
  function finish(msg) { clearInterval(CH.timer); CH.timer = null; msg.streaming = false; E.commit(null, { silent: true }); C.blip(520); P.renderChats(); }
  A.chatStop = () => { const th = AH.S.chat.threads[AH.S.chat.coach], m = th[th.length - 1]; if (m && m.streaming) { m.text += m.text ? ' …' : '(stopped)'; finish(m); } };
  A.coachPick = el => { AH.S.chat.coach = el.dataset.coach; E.commit(null, { silent: true }); P.renderChats(); const r = $(`[data-chat-root] [data-coach="${el.dataset.coach}"]`); if (r) r.focus(); };
  A.chatSugg = el => { if (!$('[data-chat-root]')) P.openCoach(''); send(el.dataset.q); };
  A.ctxClear = () => { CH.ctx = ''; P.renderChats(); };
  A.imgPick = el => $('[data-file]', el.closest('[data-chat]')).click();
  A.imgClear = () => { CH.img = null; P.renderChats(); };
  P.forms.chat = () => send();

  R.coaches = {
    roles: ['learner', 'reviewer'], icon: 'lifebuoy', keywords: 'ai help unstuck chat mentor',
    render() {
      return `${C.header({ title: AH.t('coaches'), desc: 'Three specialists, one rule: they guide, you build. Reviews are always decided by people.' })}
      <section class="card card-pad" aria-label="Coach conversation" data-chat-root="page"></section>
      <div class="grid2" style="margin-top:22px">
        <div class="card help-card lift"><div class="top"><span class="tile" aria-hidden="true">${ic('bulb')}</span><div><h2 class="h3">Ask from the exact step</h2><p class="text-2 small" style="margin-top:4px">Every activity has an "Ask about this step" button. The coach then knows the level and activity you're on.</p></div></div><a class="link" href="#/journey/1">Open Level 1 ${ic('arrowRight', 'ic-sm')}</a></div>
        <div class="card help-card lift"><div class="top"><span class="tile gold" aria-hidden="true">${ic('users')}</span><div><h2 class="h3">Prefer a human?</h2><p class="text-2 small" style="margin-top:4px">Mentor office hours run every Wednesday at 7 pm IST, and your cohort answers fast in the feed.</p></div></div><a class="link" href="#/feed">Ask the cohort ${ic('arrowRight', 'ic-sm')}</a></div>
      </div>`;
    },
    after() { P.renderChats(); }
  };

  /* Drawer (opened from the floating button or any "Ask" button) */
  let drawerReturn = null;
  P.openCoach = (ctx, coach) => {
    if (coach) AH.S.chat.coach = coach;
    if (ctx != null) CH.ctx = ctx;
    if (SH.current.key === 'coaches') { P.renderChats(); const ta = $('[data-chatta]'); if (ta) ta.focus(); return; }
    drawerReturn = document.activeElement;
    $('#drawerRoot').innerHTML = `<div class="drawer-back" data-action="drawerClose"></div><aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="drT">
      <div class="drawer-head">${ic('lifebuoy')}<h2 class="h3" id="drT" style="flex:1">${esc(AH.t('coaches'))}</h2><a class="btn btn-text" href="#/coaches">Full page</a><button class="icon-btn" type="button" data-action="drawerClose" aria-label="Close">${ic('x', 'ic-sm')}</button></div>
      <div class="drawer-body" data-chat-root="drawer" style="display:flex;flex-direction:column"></div></aside>`;
    document.body.style.overflow = 'hidden'; P.renderChats();
    const ta = $('#drawerRoot [data-chatta]'); if (ta) ta.focus();
  };
  P.closeCoach = () => { if (!$('#drawerRoot').innerHTML) return; $('#drawerRoot').innerHTML = ''; document.body.style.overflow = ''; if (drawerReturn && document.contains(drawerReturn)) drawerReturn.focus(); };
  A.openCoach = el => P.openCoach(el.dataset.ctx || '', el.dataset.coach);
  A.drawerClose = (el, e) => { if (el.tagName !== 'A') e.preventDefault(); P.closeCoach(); };
})(window.AH = window.AH || {});
