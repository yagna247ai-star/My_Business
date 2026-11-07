/* AI Accelerator Hub v3 — shared UI components */
(function (AH) {
  'use strict';
  const { U } = AH; const { esc, ic } = U;
  const C = (AH.C = {});

  C.reducedMotion = () => AH.S.prefs.motion === 'reduced' || (AH.S.prefs.motion === 'system' && window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

  /* ---------- Toast (with optional action) ---------- */
  C.toast = (msg, opts = {}) => {
    const t = document.createElement('div');
    t.className = 'toast'; t.setAttribute('role', opts.tone === 'error' ? 'alert' : 'status');
    t.innerHTML = `<span>${esc(msg)}</span>${opts.action ? ` <button type="button" class="btn btn-sm btn-soft" style="margin-left:10px;height:28px">${esc(opts.action.label)}</button>` : ''}`;
    if (opts.action) t.querySelector('button').onclick = () => { opts.action.run(); t.remove(); };
    U.$('#toasts').appendChild(t);
    setTimeout(() => t.remove(), opts.ms || 3600);
  };

  /* ---------- Sound (off by default) ---------- */
  let actx = null;
  C.blip = (freq = 660, dur = 0.18) => {
    if (!AH.S.prefs.sound) return;
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      const o = actx.createOscillator(), g = actx.createGain(), t = actx.currentTime;
      o.type = 'sine'; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(0.07, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(actx.destination); o.start(t); o.stop(t + dur + 0.02);
    } catch (e) {}
  };
  C.chime = () => { C.blip(660); setTimeout(() => C.blip(880), 120); setTimeout(() => C.blip(1175, 0.3), 240); };

  /* ---------- Dialog (focus-trapped, Esc, restores focus) ---------- */
  C.dialog = ({ title, body, confirm, danger, cancel = 'Cancel', onConfirm, wide }) => {
    const ret = document.activeElement, root = U.$('#modalRoot');
    root.innerHTML = `<div class="backdrop" data-back><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlgT" ${wide ? 'style="width:min(100%,640px)"' : ''}>
      <h2 id="dlgT">${title}</h2><div style="margin-top:10px" class="text-2">${body}</div>
      <div class="actions">${cancel ? `<button class="btn btn-outline btn-sm" type="button" data-cancel>${esc(cancel)}</button>` : ''}${confirm ? `<button class="btn ${danger ? 'btn-danger' : 'btn-ink'} btn-sm" type="button" data-ok>${esc(confirm)}</button>` : ''}</div></div></div>`;
    const dlg = U.$('.dialog', root);
    const close = () => { root.innerHTML = ''; document.removeEventListener('keydown', onKey, true); if (ret && document.contains(ret)) ret.focus(); };
    const onKey = e => {
      if (e.key === 'Escape') { e.stopPropagation(); close(); }
      if (e.key === 'Tab') {
        const f = U.$$('button,select,textarea,input,a[href]', dlg).filter(x => !x.disabled); if (!f.length) return;
        if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
        else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
      }
    };
    document.addEventListener('keydown', onKey, true);
    const c = U.$('[data-cancel]', root); if (c) c.onclick = close;
    U.$('[data-back]', root).onclick = e => { if (e.target.hasAttribute('data-back')) close(); };
    const ok = U.$('[data-ok]', root); if (ok) ok.onclick = () => { if (onConfirm && onConfirm(dlg) === false) return; close(); };
    (U.$('input,select,textarea', dlg) || ok || c).focus();
    return { close, el: dlg };
  };

  /* ---------- Page header ---------- */
  C.stars = (n, seed = 1, maxO = 0.8) => {
    let s = seed * 9301 + 49297; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
    let out = '';
    for (let i = 0; i < n; i++) {
      const size = rnd() < 0.15 ? 2.5 : rnd() < 0.5 ? 1.5 : 1, o = (0.2 + rnd() * (maxO - 0.2)).toFixed(2);
      out += `<span class="star${rnd() < 0.45 ? ' tw' : ''}" style="left:${(rnd() * 100).toFixed(2)}%;top:${(rnd() * 100).toFixed(2)}%;width:${size}px;height:${size}px;--o:${o};--d:${(3 + rnd() * 4).toFixed(1)}s;--dl:${(rnd() * 3).toFixed(1)}s"></span>`;
    }
    return `<div class="stars" aria-hidden="true">${out}</div>`;
  };
  const DECO = `<svg class="deco" viewBox="0 0 420 200" preserveAspectRatio="xMaxYMin slice" aria-hidden="true" fill="none">${Array.from({ length: 9 }, (_, i) => `<path d="M60 ${40 + i * 9} C 160 ${-10 + i * 9}, 260 ${110 + i * 9}, 440 ${20 + i * 9}" stroke="#D4AC5E" stroke-opacity="${0.12 + i * 0.03}" stroke-width="1"/>`).join('')}${Array.from({ length: 24 }, (_, i) => `<circle cx="${300 + (i % 8) * 12}" cy="${140 + Math.floor(i / 8) * 12}" r="1.6" fill="#B78B3F" fill-opacity=".35"/>`).join('')}</svg>`;
  C.header = ({ variant = 'plain', eyebrow = '', title, desc = '', actions = '', note = '' }) => `
    <section class="ph ph-${variant}" aria-labelledby="pageTitle">
      ${variant === 'cream' ? DECO : ''}${variant === 'navy' ? C.stars(60, 5, 0.85) : ''}
      <div style="position:relative" class="row between wrap gap-16">
        <div style="min-width:0;flex:1">
          ${eyebrow ? `<span class="eyebrow">${eyebrow}</span>` : ''}
          <h1 id="pageTitle">${title}</h1>
          ${desc ? `<p class="desc">${desc}</p>` : ''}
          ${note}
        </div>
        ${actions ? `<div class="row gap-8 wrap">${actions}</div>` : ''}
      </div>
    </section>
    ${AH.S.prefs.lang !== 'en' ? `<p class="callout info small" style="margin:-8px 0 18px">${ic('globe', 'ic-sm')}<span>${esc(AH.t('untranslated'))}</span></p>` : ''}`;

  C.empty = (icon, title, body = '', extra = '') => `<div class="card empty"><div class="ic-wrap">${ic(icon, 'ic-lg')}</div><h2 class="h3">${title}</h2>${body ? `<p class="text-2" style="margin-top:6px;max-width:52ch;margin-left:auto;margin-right:auto">${body}</p>` : ''}${extra}</div>`;
  C.statusTag = s => ({
    pending: '<span class="status info">In review</span>', approved: '<span class="status ok">Approved</span>',
    needs_changes: '<span class="status warn">Changes requested</span>'
  }[s] || `<span class="status mute">${esc(s)}</span>`);

  /* ---------- Charts (inline SVG, single hue, direct labels) ---------- */
  C.funnel = (values, labels) => {
    const max = Math.max(...values), w = 640, rowH = 38, h = values.length * rowH + 8, lx = 150, bw = w - lx - 70;
    return `<div class="chart"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Activity funnel: ${labels.map((l, i) => `${l} ${values[i]}`).join(', ')}">
      ${values.map((v, i) => {
        const y = i * rowH + 4, bwid = Math.max(4, (v / max) * bw), drop = i ? Math.round((1 - v / values[i - 1]) * 100) : 0;
        return `<text x="0" y="${y + 21}" class="lbl-strong">${esc(labels[i])}</text>
          <rect class="bar ${drop >= 25 ? 'alt' : ''}" x="${lx}" y="${y + 6}" width="${bwid}" height="22" rx="6"/>
          <text x="${lx + bwid + 8}" y="${y + 22}">${v}${i ? ` · −${drop}%` : ''}</text>`;
      }).join('')}</svg></div>`;
  };
  C.lineChart = (values, labels) => {
    const w = 640, h = 200, pad = 28, max = Math.max(...values) * 1.15, step = (w - pad * 2) / (values.length - 1);
    const pts = values.map((v, i) => [pad + i * step, h - pad - (v / max) * (h - pad * 2)]);
    const d = pts.map((p, i) => `${i ? 'L' : 'M'}${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ');
    return `<div class="chart"><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="Weekly active learners: ${values.join(', ')}">
      <defs><linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3D5AFE" stop-opacity=".22"/><stop offset="1" stop-color="#3D5AFE" stop-opacity="0"/></linearGradient></defs>
      ${[0.25, 0.5, 0.75, 1].map(f => `<line class="grid" x1="${pad}" x2="${w - pad}" y1="${h - pad - f * (h - pad * 2)}" y2="${h - pad - f * (h - pad * 2)}"/>`).join('')}
      <path class="area" d="${d} L${pts[pts.length - 1][0]},${h - pad} L${pad},${h - pad} Z"/>
      <path class="line" d="${d}"/>
      ${pts.map((p, i) => `<circle cx="${p[0]}" cy="${p[1]}" r="${i === pts.length - 1 ? 5 : 3}" fill="#3D5AFE"/>`).join('')}
      <text x="${pts[pts.length - 1][0] - 4}" y="${pts[pts.length - 1][1] - 12}" text-anchor="end" class="lbl-strong">${values[values.length - 1]}</text>
      ${labels.map((l, i) => `<text x="${pad + i * step}" y="${h - 6}" text-anchor="middle">${esc(l)}</text>`).join('')}
    </svg></div>`;
  };
  C.bars = (items) => { // [{label, value, max}]
    return `<div class="stack gap-12">${items.map(it => `<div><div class="row between small"><span class="bold">${esc(it.label)}</span><span class="muted num">${esc(it.text || it.value)}</span></div>
      <div class="bar ${it.blue ? 'blue' : ''}" style="margin-top:6px" role="progressbar" aria-label="${esc(it.label)}" aria-valuemin="0" aria-valuemax="${it.max}" aria-valuenow="${it.value}"><i style="width:${Math.max(2, (it.value / it.max) * 100)}%"></i></div></div>`).join('')}</div>`;
  };

  /* ---------- Celebration (level-up / badge) ---------- */
  C.confetti = () => {
    if (C.reducedMotion()) return;
    const box = document.createElement('div'); box.className = 'confetti'; box.setAttribute('aria-hidden', 'true');
    const colors = ['#E8B94F', '#3878F6', '#8658E8', '#5EE0B5', '#FF8A80', '#FFFFFF'];
    for (let i = 0; i < 90; i++) {
      const p = document.createElement('i');
      p.style.left = Math.random() * 100 + 'vw'; p.style.background = colors[i % colors.length];
      p.style.setProperty('--dx', (Math.random() * 200 - 100) + 'px'); p.style.setProperty('--rot', (Math.random() * 720 - 360) + 'deg');
      p.style.setProperty('--t', (2.2 + Math.random() * 1.8) + 's'); p.style.setProperty('--dl', (Math.random() * 0.6) + 's');
      box.appendChild(p);
    }
    document.body.appendChild(box); setTimeout(() => box.remove(), 5000);
  };
  C.celebrate = c => {
    const badges = (c.badges || []).map(code => AH.D.BADGES.find(b => b.code === code)).filter(Boolean);
    C.confetti(); C.chime();
    C.dialog({
      title: esc(c.title),
      body: `<div style="text-align:center"><div class="burst" aria-hidden="true">🏆</div><p>${esc(c.body)}</p>
        ${badges.length ? `<div class="row gap-8 wrap" style="justify-content:center;margin-top:14px">${badges.map(b => `<span class="badge badge-gold">${b.icon} ${esc(b.name)} · +${b.xp} XP</span>`).join('')}</div>` : ''}</div>`,
      confirm: 'See my journey', cancel: 'Close', onConfirm: () => { location.hash = '#/journey'; }
    });
  };

  /* ---------- Command palette (⌘K / Ctrl+K) ---------- */
  C.palette = commands => {
    const ret = document.activeElement; const root = U.$('#paletteRoot');
    let q = '', sel = 0, list = commands;
    const filter = () => { const s = q.trim().toLowerCase(); list = s ? commands.filter(c => (c.label + ' ' + (c.keywords || '') + ' ' + c.group).toLowerCase().includes(s)) : commands; sel = 0; };
    const draw = () => {
      const groups = [...new Set(list.map(c => c.group))];
      U.$('.palette-list', root).innerHTML = list.length ? groups.map(g => `<div class="palette-group" role="presentation">${esc(g)}</div>${list.map((c, i) => c.group !== g ? '' : `<button class="palette-item" role="option" id="pi-${i}" aria-selected="${i === sel}" data-i="${i}" type="button">${ic(c.icon || 'arrowRight')}<span>${esc(c.label)}</span>${c.hint ? `<span class="hint">${esc(c.hint)}</span>` : ''}</button>`).join('')}`).join('')
        : `<p class="muted small" style="padding:18px">No matches for “${esc(q)}”.</p>`;
      U.$('input', root).setAttribute('aria-activedescendant', list.length ? `pi-${sel}` : '');
      const s = U.$(`#pi-${sel}`, root); if (s) s.scrollIntoView({ block: 'nearest' });
    };
    const close = () => { root.innerHTML = ''; if (ret && document.contains(ret)) ret.focus(); };
    const run = i => { const c = list[i]; if (!c) return; close(); c.run(); };
    root.innerHTML = `<div class="palette-back" data-pback><div class="palette" role="dialog" aria-modal="true" aria-label="Command palette">
      <div class="palette-input">${ic('search')}<input type="text" role="combobox" aria-expanded="true" aria-controls="palList" aria-autocomplete="list" placeholder="Type a command or page…" autocomplete="off" spellcheck="false"><span class="kbd">Esc</span></div>
      <div class="palette-list" id="palList" role="listbox"></div>
      <div class="palette-foot"><span>↑↓ to move</span><span>↵ to run</span><span>Esc to close</span></div></div></div>`;
    const input = U.$('input', root);
    input.addEventListener('input', () => { q = input.value; filter(); draw(); });
    input.addEventListener('keydown', e => {
      if (e.key === 'ArrowDown') { e.preventDefault(); sel = Math.min(list.length - 1, sel + 1); draw(); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); sel = Math.max(0, sel - 1); draw(); }
      else if (e.key === 'Enter') { e.preventDefault(); run(sel); }
      else if (e.key === 'Escape') { e.preventDefault(); close(); }
    });
    root.onclick = e => {
      const b = e.target.closest('[data-i]'); if (b) run(+b.dataset.i);
      else if (e.target.hasAttribute('data-pback')) close();
    };
    draw(); input.focus();
  };
})(window.AH = window.AH || {});
