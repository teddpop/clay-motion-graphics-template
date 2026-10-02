/* Clay Story STYLE LAYER. Owns everything that makes a film look and feel like this house style, and nothing about
 * the plot. Scenes (engine/scenes/*.js) compose the story; they only talk to the film through this API.
 *
 *   S.caption(text, t, { slot, hi, sync, until, group, letters })   left-column captions; hold until the next one in the group
 *   S.clear(t)                                                        end every caption visible at t
 *   S.bg(t, 'paper'|'hi'|'hi2'|'warm'|'tint'|'#hex', [x, y])          background change = circle wipe from a point
 *   S.host                    narrator bubble: .pose(t,p) .look(t,deg) .hide(t) .show(t)   (auto bump + gesture per line)
 *   S.full(t0, t1, o)         a cast member full-body: o = { who, at: 'idea'|'end'|'left'|'center'|'right'|{left,top,w,h}, pose, layer, hold }
 *   S.device                  the hero device (video.json device.type phone|laptop|none):
 *                             .to(t, state, { dur, ease })   states: off, peek, center, side, end
 *                             .show(t, screenId, { ev, fade })   .el(id)  .rect(id, sel)  .map(state, x, y)  .center
 *   S.product                 the hero 3D product object (video.json product.object): .to(t, { x, y, size, turn }, dur)  .obj
 *   S.sfx(t, name, gain)      enforces the one-whoosh rule
 *   S.dread(rect, tG, tQ, tGone)   anime gloom + squiggles + "?" over any screen rect (put it on objects, never on people)
 *   S.chip(html, x, y, tIn, tOut)  outlined label chip   S.tap(btn, t)  tap ripple   S.burst / S.confetti
 *   S.prop(spec) S.at(line, cue, off) S.line(id) S.unz(x, y) S.front S.back (3D stages) S.P (palette) S.V (video.json)
 *   S.talkFor(castId) → fn(t) for multi-character lip-sync     S.carry  hand-off slot between scenes (e.g. problem items)
 *   S.compile()               called once by film.js after all scenes are built
 */
import { THREE } from '../../clay3d.js';
import { SCREENS as PHONE, phonePropScreen, okDot } from '../../screens/phone.js';
import { SCREENS as DESK } from '../../screens/desktop.js';

const D = THREE.MathUtils.degToRad;

export function makeStyle(V) {
  const P = V.palette, MG = window.MG, E = MG.E, tw = MG.tween, clamp = MG.clamp;
  const $ = (s) => document.querySelector(s);
  const root = $('#root');
  const layer = (id, z) => { const d = document.createElement('div'); d.id = id; d.style.cssText = `position:absolute;inset:0;pointer-events:none${z != null ? ';z-index:' + z : ''}`; root.appendChild(d); return d; };

  for (const [k, v] of Object.entries({ paper: P.paper, ink: P.ink, muted: P.muted, hi: P.hi, hi2: P.hi2, tint: P.tint, tint2: P.tint2, warm: P.warm,
    line: P.line, line2: P.line2, sub: P.sub, ok: P.ok, 'on-hi': P.onHi })) document.documentElement.style.setProperty('--' + k, v);
  document.body.style.background = P.paper;

  // ---------- layers (DOM order = z order) ----------
  const L = {
    bg: layer('L-bg'), av: null, caps: layer('L-caps'), fullBack: layer('L-fullBack'), stBack: layer('L-stBack'),
    device: layer('L-device'), stFront: layer('L-stFront'), over: null, chips: layer('L-chips'), fullFront: layer('L-fullFront', 30),
    lock: layer('L-lock'), fx: layer('L-fx'), logo: null,
  };
  L.caps.insertAdjacentHTML('beforebegin', `<div class="avatar" id="av" style="z-index:40;background:${P.bubble}"></div>`);
  L.av = $('#av');
  L.chips.insertAdjacentHTML('beforebegin', `<svg id="L-over" class="full" viewBox="0 0 1920 1080" style="pointer-events:none;overflow:visible"><defs><linearGradient id="gloomTint" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${P.dread}" stop-opacity="0.34"/><stop offset="1" stop-color="${P.dread}" stop-opacity="0"/></linearGradient></defs></svg>`);
  L.over = $('#L-over');
  root.insertAdjacentHTML('beforeend', `<div class="logo" id="logo"><svg class="brandmark" viewBox="0 0 48 48"></svg><span>${V.product.name}</span></div>`);
  L.logo = $('#logo');
  const MARK = V.brand.mark || `<rect x="4" y="4" width="40" height="40" rx="12" fill="${P.hi}" stroke="${P.ink}" stroke-width="3.2"/><text x="24" y="33" text-anchor="middle" font-family="Inter" font-weight="800" font-size="26" fill="${P.ink}">${V.product.name[0]}</text>`;
  L.logo.querySelector('svg').innerHTML = MARK;

  const front = MG.stage3d('#L-stFront'), back = MG.stage3d('#L-stBack');
  const line = (id) => MG.line(id);
  const at = (id, x, off = 0) => {
    if (x == null) return null;
    if (Array.isArray(x)) return at(id, x[0], (x[1] || 0) + off);
    return (typeof x === 'number' ? line(id).start + x : MG.cue(id, x)) + off;
  };
  const prop = (spec) => {
    const s = typeof spec === 'string' ? { prop: spec } : spec, f = MG.props[s.prop];
    if (!f) throw new Error(`clay-story: unknown prop "${s.prop}". Write a factory (references/clay-props.md)`);
    return f(s.opts || {});
  };
  const ZF = 6, K = 20 / (20 - ZF);
  const unz = (x, y, z = ZF) => { const k = 20 / (20 - z); return [960 + (x - 960) / k, 540 + (y - 540) / k]; };
  const lines = V.script.map((l) => ({ ...l, ...line(l.id) }));
  const cast = Object.fromEntries((V.cast || [V.mascot]).map((c, i) => [c.id || (i ? 'c' + i : 'main'), c]));
  const narrator = Object.keys(cast)[0];
  const speakerAt = (t) => { const l = lines.find((x) => t >= x.start - 0.05 && t <= x.end + 0.05); return l ? (l.speaker || narrator) : null; };
  const talkFor = (id) => (t) => speakerAt(t) === id;

  // ---------- sound ----------
  let whooshes = 0;
  const sfx = (t, name, gain = 1) => { if (name === 'whoosh' && ++whooshes > 1) console.warn('[style] more than one whoosh — the style allows one per film'); MG.sfx(t, name, gain); };

  // ---------- captions ----------
  const capW = V.device?.type === 'laptop' ? 660 : 840;
  const SLOTS = {
    hook: { top: 200, size: 96, width: 1060, group: 'main' },
    main: { top: 250, size: 92, width: capW, group: 'main' },
    big: { top: 170, size: 130, width: 1100, weight: 760, group: 'main' },
    sub: { top: 330, size: 88, width: Math.min(820, capW), group: 'sub' },
    kicker: { top: 225, size: 44, width: 900, weight: 600, group: 'kicker' },
    idea: { top: 300, size: 80, width: 760, group: 'main', onHiBg: true },
    low: { top: 820, size: 64, width: 1100, group: 'low' },
  };
  const caps = [];
  function fit(el, maxLines = 3) {
    const cs = getComputedStyle(el); let fs = parseFloat(cs.fontSize);
    const lh = (parseFloat(cs.lineHeight) || fs * 1.2) / fs;
    while (fs > 40 && (el.scrollWidth > el.clientWidth + 2 || el.offsetHeight > fs * lh * maxLines + 6)) { fs -= 4; el.style.fontSize = fs + 'px'; }
  }
  function caption(text, t, o = {}) {
    const sl = { ...SLOTS[o.slot || 'main'], ...(o.style || {}) };
    const el = document.createElement('div'); el.className = 'cap';
    el.style.cssText = `top:${sl.top}px;font-size:${sl.size}px;width:${sl.width}px;${sl.weight ? 'font-weight:' + sl.weight : ''};${sl.onHiBg ? `--hi:#FFFFFF;--on-hi:${P.ink}` : ''};${o.left != null ? 'left:' + o.left + 'px' : ''}`;
    L.caps.appendChild(el);
    const hi = o.hi == null ? [] : [].concat(o.hi);
    if (o.letters) MG.letters(el, text, t, { stagger: 0.045, from: 120, hi });
    else {
      const times = o.sync ? MG.cues(o.sync, text) : Array.from({ length: text.split(/\s+/).filter(Boolean).length }, (_, i) => t + i * 0.08);
      MG.words(el, text, times, { hi, ...(o.ink ? { ink: o.ink, muted: o.muted } : {}) });
    }
    fit(el, o.maxLines || 3);
    const c = { el, t: o.sync ? MG.cues(o.sync, text)[0] : t, group: o.group || sl.group, until: o.until ?? null };
    caps.push(c);
    return el;
  }
  const clears = [];
  const clear = (t) => clears.push(t);

  // ---------- background wipes ----------
  const wipes = [];
  const BG = { paper: P.paper, hi: P.hi, hi2: P.hi2, warm: P.warm, tint: P.tint, ink: P.ink };
  const bg = (t, c, from = [960, 540], dur = 0.7) => wipes.push({ t, color: BG[c] || c, from, dur });

  // ---------- narrator bubble ----------
  const n = cast[narrator];
  const H3 = (el, o) => MG.host3d(el, { hair: o.c.hair, glasses: o.c.glasses, lashes: o.c.lashes, palette: o.c.palette,
    phoneScreen: phonePropScreen({ ...P, name: V.product.name }, V.screens?.[V.device?.first || Object.keys(V.screens || {})[0]] || {}), ...o.opts });
  const bubbleHost = H3(L.av, { c: n, opts: { variant: 'bust', pose: 'idle', seed: 2, turn: 0, talkWhen: talkFor(narrator) } });
  const bubbleKeys = [{ t: V.bubble?.start ?? 0.25, show: V.bubble?.enabled !== false }];
  const poseKeys = [];
  const host = {
    pose(t, p) { poseKeys.push(t); bubbleHost.pose(t, p); return host; },
    look(t, d) { bubbleHost.look(t, d); return host; },
    hide(t) { bubbleKeys.push({ t, show: false }); return host; },
    show(t) { bubbleKeys.push({ t, show: true }); return host; },
    raw: bubbleHost, el: L.av,
  };

  // ---------- full-body cast ----------
  const SPOTS = { idea: { left: 690, top: 60, w: 640, h: 1020 }, end: { left: 1480, top: 170, w: 440, h: 910 },
    left: { left: 380, top: 90, w: 600, h: 980 }, center: { left: 660, top: 70, w: 620, h: 1000 }, right: { left: 1180, top: 90, w: 600, h: 980 } };
  const fulls = [];
  function full(t0, t1, o = {}) {
    const who = o.who || narrator, c = cast[who]; if (!c) throw new Error(`clay-story: no cast member "${who}"`);
    const sp = typeof o.at === 'object' ? o.at : SPOTS[o.at || 'idea'];
    const el = document.createElement('div'); el.className = 'host-full';
    el.style.cssText = `position:absolute;left:${sp.left}px;top:${sp.top}px;width:${sp.w}px;height:${sp.h}px`;
    (o.layer === 'front' || o.at === 'end' ? L.fullFront : L.fullBack).appendChild(el);
    MG.show(el, t0, t1 === Infinity ? Infinity : t1);
    const rise = t0 + (o.delay ?? 0.35);
    tw(el, rise, 0.7, { y: 950 }, { y: 0 }, (p) => E.outBack(p, 1.2));
    if (t1 !== Infinity) tw(el, t1 - 0.9, 0.6, { y: 0 }, { y: 1050 }, 'inOutCubic');
    const h = H3(el, { c, opts: { variant: 'full', pose: o.pose || 'wave', seed: o.seed ?? 5 + fulls.length * 7, turn: o.turn || 0, talkWhen: talkFor(who) } });
    fulls.push({ who, t0, t1 });
    return h;
  }

  // ---------- hero device ----------
  const DT = V.device?.type || 'phone';
  const DEV = {
    phone: { rest: { left: 1000, top: 90, w: 450, h: 900 }, states: { off: { x: 440, y: 1150, rotate: 10, scale: 1 }, peek: { x: 440, y: 330, rotate: -5, scale: 1 }, center: { x: 0, y: 0, rotate: 0, scale: 1 },
      side: { x: 380, y: 0, rotate: 0, scale: 0.92 }, end: { x: 60, y: 0, rotate: 0, scale: 0.9 } } },
    laptop: { rest: { left: 800, top: 170, w: 1040, h: 700 }, states: { off: { x: 420, y: 1000, rotate: 6, scale: 0.85 }, peek: { x: 430, y: 400, rotate: -4, scale: 0.85 }, center: { x: 0, y: 0, rotate: 0, scale: 1 },
      side: { x: 160, y: 60, rotate: 0, scale: 0.85 }, end: { x: -110, y: 40, rotate: 0, scale: 0.72 } } },
  };
  const devEl = document.createElement('div');
  let screenHost = null;
  if (DT === 'phone') {
    devEl.id = 'phone'; devEl.innerHTML = `<div class="screen"><div class="notch"></div><div class="sb"><span>${V.device?.time || '9:41'}</span><span>●●● 5G</span></div></div>`;
    screenHost = devEl.firstElementChild;
  } else if (DT === 'laptop') {
    devEl.id = 'laptop'; devEl.innerHTML = `<div class="lid"><div class="screen desk"></div></div><div class="base"><i></i></div>`;
    screenHost = devEl.querySelector('.screen');
  }
  if (DT !== 'none') L.device.appendChild(devEl);
  const R = DEV[DT]?.rest || { left: 1000, top: 90, w: 450, h: 900 };
  const center = { x: R.left + R.w / 2, y: R.top + R.h / 2 };
  const KIT = DT === 'laptop' ? DESK : PHONE;
  const scrEls = {};
  const scrEl = (id) => {
    if (scrEls[id]) return scrEls[id];
    const s = V.screens?.[id]; if (!s) throw new Error(`clay-story: no screen "${id}"`);
    const T = KIT[s.type]; if (!T) throw new Error(`clay-story: screen type "${s.type}" not in the ${DT} kit (screens/${DT === 'laptop' ? 'desktop' : 'phone'}.js)`);
    screenHost.insertAdjacentHTML('beforeend', `<div class="scr" data-id="${id}" style="${T.style || ''}">${T.html(s, { ...P, name: V.product.name })}</div>`);
    const el = screenHost.lastElementChild; el.querySelectorAll('.brandmark').forEach((m) => (m.innerHTML = MARK));
    return (scrEls[id] = el);
  };
  const devKeys = [{ t: -1, state: 'off', dur: 0.01 }], shows = [];
  const EASE = { pop: (p) => E.outBack(p, 1.25), glide: (p) => E.outBack(p, 1.1), move: 'inOutCubic' };
  const device = {
    type: DT, center, rest: R,
    to(t, state, o = {}) { devKeys.push({ t, state, dur: o.dur ?? 0.8, ease: o.ease || (state === 'peek' ? 'pop' : state === 'center' ? 'glide' : 'move') }); return device; },
    show(t, id, o = {}) { scrEl(id); shows.push({ t, id, ev: o.ev || {}, fade: o.fade }); return device; },
    el: scrEl,
    rect(id, sel) { const e = sel ? scrEl(id).querySelector(sel) : scrEl(id); return e ? e.getBoundingClientRect() : null; },
    map(state, x, y) { const s = DEV[DT].states[state]; return [center.x + (x - center.x) * s.scale + s.x, center.y + (y - center.y) * s.scale + s.y]; },
    stateAt(t) { let k = devKeys[0]; for (const d of devKeys) if (d.t <= t) k = d; return k.state; },
    screenAt(t) { let k = null; for (const s of shows) if (s.t <= t + 1e-6) k = s; return k?.id; },
  };

  // ---------- hero product (3D object) ----------
  let product = null;
  if (V.product.object) {
    const obj = prop(V.product.object), keys = [{ t: -1, x: 1440, y: 1400, size: 300, turn: 0 }];
    front.add(obj, (o, t) => {
      let i = 0; while (i + 1 < keys.length && keys[i + 1].t <= t) i++;
      const b = keys[i], A = keys[Math.max(0, i - 1)];
      const p = i === 0 ? 1 : clamp((t - b.t) / b.dur), e = b.ease === 'pop' ? E.outBack(p, 1.6) : E.inOutCubic(p);
      const x = A.x + (b.x - A.x) * e, y = A.y + (b.y - A.y) * e, sz = A.size + (b.size - A.size) * e;
      o.position.copy(front.px(x, y + Math.sin(t * 1.6) * 5, 0)); o.scale.setScalar(Math.max(0.0001, sz * front.unit));
      const tilt = V.product.objectTilt || [12, 0, 0];
      o.rotation.set(D(tilt[0]), D(tilt[1]) + (b.spin ?? 0.35) * t + D(A.turn + ((b.turn ?? 0) - A.turn) * e), D(tilt[2]));
      o.visible = y < 1300;
    });
    product = { obj, keys,
      to(t, k, dur = 0.8, ease) { keys.sort((p, q) => p.t - q.t); const prev = keys.filter((q) => q.t <= t).at(-1) || keys[0]; keys.push({ ...prev, ...k, t, dur, ease }); keys.sort((p, q) => p.t - q.t); return product; },
      // scenes that don't feature the product send it off below the frame (if it's on screen)
      away(t) { const prev = keys.filter((q) => q.t <= t).at(-1); if (prev && prev.y < 1300) product.to(t, { y: 1450 }, 0.5); return product; } };
  }

  // ---------- helpers ----------
  const tap = (btn, t) => {
    if (!btn) return;
    tw(btn, t, 0.1, { scale: 1 }, { scale: 0.95 }, 'outCubic'); tw(btn, t + 0.1, 0.25, { scale: 0.95 }, { scale: 1 }, (p) => E.outBack(p, 2));
    const rip = btn.querySelector('.ripple'); if (rip) tw(rip, t, 0.45, { scale: 0, opacity: 0.9 }, { scale: 14, opacity: 0 }, 'outCubic');
    sfx(t, 'tap', 0.8);
  };
  const soft = (el, t, o = {}) => MG.pop(el, t, { sound: 'tap', gain: 0.5, ...o });
  const chip = (html, x, y, tIn, tOut, o = {}) => {
    const el = document.createElement('div'); el.className = 'chip' + (o.cls ? ' ' + o.cls : ''); el.innerHTML = (o.check === false ? '' : okDot('', 14)) + html; L.chips.appendChild(el);
    el.style.left = (x - (o.align === 'left' ? 0 : el.offsetWidth / 2)) + 'px'; el.style.top = y + 'px';
    soft(el, tIn, { from: 0.4, y: 10, sound: o.sound || 'tick', gain: 0.7 });
    if (tOut != null) MG.out(el, tOut, 0.2);
    return el;
  };
  function dread(r, tG, tQ, tGone, o = {}) {
    const NS = 'http://www.w3.org/2000/svg', g = document.createElementNS(NS, 'g'); L.over.appendChild(g);
    const gx0 = r.x0 + 30, gx1 = r.x1 - 30, gw = gx1 - gx0, gy0 = r.y0 - 8, gh = Math.min(330, (r.y1 - r.y0) * 0.55), k = clamp((r.y1 - r.y0) / 780, 0.5, 1);
    g.innerHTML = `<rect x="${gx0}" y="${gy0}" width="${gw}" height="${gh}" rx="26" fill="url(#gloomTint)" opacity="0"/><g stroke="${P.dread}" stroke-width="7" stroke-linecap="round" fill="none" opacity="0.85"></g><g stroke="${P.ink}" stroke-width="6" stroke-linecap="round" fill="none"></g><g font-family="Inter" font-weight="800" fill="${P.ink}"></g>`;
    const [rect, gl, sqg, qg] = g.children, lines_ = [], sq = [], qs = [];
    const nl = o.lines ?? Math.max(3, Math.round(gw / 62));
    for (let i = 0; i < nl; i++) { const pth = document.createElementNS(NS, 'path'); gl.appendChild(pth); lines_.push({ pth, x: gx0 + 37 + i * (gw - 74) / Math.max(1, nl - 1), len: (150 + (i % 3) * 55) * k, ph: i * 1.7 }); }
    for (const [x, y, rr] of [[gx0 - 30, gy0 + 10, -35], [gx1 + 25, gy0, 35], [gx1 + 40, gy0 + 125 * k, 60]]) { const pth = document.createElementNS(NS, 'path'); sqg.appendChild(pth); sq.push({ pth, x, y, r: rr }); }
    if (tQ != null) for (const [fx, dy, size, rot, d] of [[0.24, -30, 96, -12, 0], [0.52, -65, 120, 6, 0.16], [0.82, -20, 88, 14, 0.3]]) {
      const q = document.createElementNS(NS, 'text'); q.textContent = '?'; q.setAttribute('font-size', size * (o.qScale || 1)); q.setAttribute('text-anchor', 'middle');
      q.setAttribute('stroke', '#FFFFFF'); q.setAttribute('stroke-width', '8'); q.setAttribute('paint-order', 'stroke');
      qg.appendChild(q); qs.push({ q, x: gx0 + gw * fx, y: Math.max(110, gy0 + dy), rot, d });
    }
    const wave = (x, y0, len, ph, amp, t) => { let d = `M${x} ${y0}`; for (let kk = 1; kk <= 12; kk++) d += ` L${(x + Math.sin(kk * 1.3 + ph + t * 6) * amp).toFixed(1)} ${(y0 + (len * kk) / 12).toFixed(1)}`; return d; };
    MG.call(tG - 0.1, tGone + 0.6, (p, t) => {
      const gg = clamp((t - tG) / 0.6) * (1 - clamp((t - tGone) / 0.35));
      rect.setAttribute('opacity', gg.toFixed(3));
      lines_.forEach((Ln, i) => { const grow = E.outCubic(clamp((t - tG - i * 0.05) / 0.55)); Ln.pth.setAttribute('d', wave(Ln.x, gy0 - 5, Ln.len * grow, Ln.ph, 6, t)); Ln.pth.setAttribute('opacity', (gg * (grow > 0.01 ? 1 : 0)).toFixed(3)); });
      sq.forEach((S_, i) => { const u = clamp((t - tG - 0.25 - i * 0.1) / 0.3) * (1 - clamp((t - tGone) / 0.3)); let d = ''; for (let kk = 0; kk <= 10; kk++) d += (kk ? ' L' : 'M') + (kk * 7) + ' ' + (Math.sin(kk * 1.4 + t * 9 + i) * 7).toFixed(1);
        S_.pth.setAttribute('d', d); S_.pth.setAttribute('transform', `translate(${S_.x} ${S_.y}) rotate(${S_.r}) scale(${u})`); S_.pth.setAttribute('opacity', u.toFixed(3)); });
      qs.forEach((Q) => { const u = clamp((t - tQ - Q.d) / 0.45), s = u <= 0 ? 0 : E.outBack(u, 2.4), out = 1 - clamp((t - tGone - Q.d * 0.3) / 0.3);
        Q.q.setAttribute('transform', `translate(${Q.x} ${Q.y + Math.sin(t * 3 + Q.d * 10) * 6}) rotate(${Q.rot + Math.sin(t * 2.4 + Q.d * 7) * 6}) scale(${(s * out).toFixed(3)})`); });
    });
    sfx(tG + 0.1, 'thunk', 0.3);
    qs.forEach((Q) => sfx(tQ + Q.d + 0.05, 'pop', 0.35));
  }

  // ---------- compile: turn the collected keys into tweens ----------
  function compile() {
    const dur = TIMING.duration;
    // captions: each holds until the next caption in its group (or a clear), never less than the lint minimum
    caps.sort((a, b) => a.t - b.t);
    caps.forEach((c, i) => {
      if (c.until == null) {
        const nx = caps.slice(i + 1).find((d) => d.group === c.group && d.t > c.t + 0.05);
        const cl = clears.filter((x) => x > c.t + 0.3).sort((a, b) => a - b)[0];
        c.until = Math.min(nx ? nx.t - 0.08 : Infinity, cl ?? Infinity);
      }
      if (c.until !== Infinity) MG.out(c.el, c.until);
    });
    // wipes: later ones on top
    wipes.sort((a, b) => a.t - b.t).forEach((w) => {
      const el = document.createElement('div'); el.className = 'wipe'; el.style.background = w.color;
      el.dataset.cx = (w.from[0] / 19.2).toFixed(1); el.dataset.cy = (w.from[1] / 10.8).toFixed(1); L.bg.appendChild(el);
      tw(el, w.t, w.dur, { clip: 0 }, { clip: 120 }, 'inOutCubic');
    });
    // bubble: hidden while the narrator is full-body; small bump on each line start while visible
    // bubble returns when a full-body moment ends — unless another full-body moment or an explicit hide follows right away
    const explicitHides = bubbleKeys.filter((k) => !k.show).map((k) => k.t);
    const nFull = fulls.filter((f) => f.who === narrator);
    for (const f of nFull) {
      bubbleKeys.push({ t: f.t0 - 0.05, show: false });
      if (f.t1 === Infinity) continue;
      const back = f.t1 - 0.55, busy = nFull.some((g) => g !== f && g.t0 <= f.t1 + 0.3 && (g.t1 === Infinity || g.t1 > back)) || explicitHides.some((h) => h > back - 1.5 && h < f.t1 + 0.5);
      if (!busy) bubbleKeys.push({ t: back, show: true });
    }
    // never show the bubble while the narrator is on screen full-body
    const inFull = (t) => nFull.some((f) => t >= f.t0 - 0.06 && t < (f.t1 === Infinity ? Infinity : f.t1 - 0.56));
    for (let i = bubbleKeys.length - 1; i >= 0; i--) if (bubbleKeys[i].show && inFull(bubbleKeys[i].t)) bubbleKeys.splice(i, 1);
    bubbleKeys.sort((a, b) => a.t - b.t);
    const vis = (t) => { let s = false; for (const k of bubbleKeys) if (k.t <= t) s = k.show; return s; };
    let shown = false;
    for (const k of bubbleKeys) {
      if (k.show === shown) continue; shown = k.show;
      if (k.show) { tw(L.av, k.t, 0.5, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1 }, (p) => E.outBack(p, 1.8)); sfx(k.t + 0.05, 'pop', 0.35); }
      else tw(L.av, k.t, 0.35, { scale: 1, opacity: 1 }, { scale: 0, opacity: 0 }, 'inOutCubic');
    }
    if (!bubbleKeys.some((k) => k.show)) tw(L.av, -1, 0.01, { opacity: 0 }, { opacity: 0 }, 'linear');
    lines.forEach((l, i) => { if (i > 0 && vis(l.start - 0.05) && vis(l.start + 0.4) && (l.speaker || narrator) === narrator) tw(L.av, l.start - 0.05, 0.35, { scale: 1.06 }, { scale: 1 }, (p) => E.outBack(p, 2)); });
    // a gesture per narrator line if the scenes didn't set one
    const G = ['talk', 'open', 'talk', 'present', 'point'];
    lines.forEach((l, i) => { if ((l.speaker || narrator) === narrator && !poseKeys.some((t) => t >= l.start - 0.6 && t <= l.end)) bubbleHost.pose(l.start - 0.1, G[i % G.length]); });
    // device: sequential state tweens
    if (DT !== 'none') {
      devKeys.sort((a, b) => a.t - b.t);
      const st = DEV[DT].states;
      devKeys.forEach((k, i) => { const a = st[(devKeys[i - 1] || k).state], b = st[k.state]; tw(devEl, k.t, k.dur, { ...a }, { ...b }, EASE[k.ease] || k.ease); });
      // screens: first shown is visible from the start; later ones slide in (or fade), each animates while on screen
      shows.sort((a, b) => a.t - b.t);
      const ids = [...new Set(shows.map((s) => s.id))];
      for (const id of ids) if (id !== shows[0]?.id) tw(scrEl(id), -1, 0.01, { opacity: 0 }, { opacity: 0 }, 'linear');
      shows.forEach((s, i) => {
        const prev = shows[i - 1];
        if (prev && prev.id !== s.id) {
          if (s.fade) { tw(scrEl(prev.id), s.t, 0.3, { opacity: 1 }, { opacity: 0 }, 'linear'); tw(scrEl(s.id), s.t, 0.35, { opacity: 0 }, { opacity: 1 }, 'linear'); }
          else { tw(scrEl(prev.id), s.t, 0.4, { y: 0, opacity: 1 }, { y: -120, opacity: 0 }, 'inOutCubic'); tw(scrEl(s.id), s.t, 0.45, { y: 160, opacity: 0 }, { y: 0, opacity: 1 }, 'outCubic'); }
        }
        if (prev && prev.id === s.id) return;
        const nx = shows.slice(i + 1).find((x) => x.id !== s.id);
        const T = KIT[V.screens[s.id].type];
        T.animate?.(scrEl(s.id), V.screens[s.id], { t0: s.t + (s.ev.delay || 0), t1: nx ? nx.t : dur + 1 }, { MG, tw, E, soft, clamp, ev: s.ev });
      });
    }
  }

  return { V, P, MG, E, THREE, D, tw, clamp, front, back, layers: L, root, line, lines, at, prop, unz, ZF, K, cast, narrator, talkFor, speakerAt,
    sfx, caption, clear, bg, host, full, device, product, tap, soft, chip, dread, MARK, H3: (el, c, opts) => H3(el, { c: cast[c] || cast[narrator], opts }),
    burst: (...a) => MG.burst('#L-fx', ...a), confetti: (...a) => MG.confetti('#L-fx', ...a), carry: {}, compile };
}
