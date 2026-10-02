/* Motion-graphics runtime: zero-dependency, deterministic, frame-exact.
 * Every visual is a pure function of time t (seconds). The renderer calls
 * window.__setTime(t) for each frame and screenshots the page.
 *
 *   MG.setup({ width, height, fps, duration })
 *   MG.tween(el, start, dur, from, to, ease)   // animate style props
 *   MG.show(el, t0, t1)                        // visibility window
 *   MG.call(t0, t1, fn(p, t))                  // custom per-frame logic (p = 0..1)
 *   MG.words(el, text, cues, opts)             // word-by-word headline reveal
 *   MG.sfx(t, name)                            // register a sound cue
 */
(function () {
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, p) => a + (b - a) * p;

  // ---------- easing ----------
  function cubicBezier(x1, y1, x2, y2) {
    const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
    const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
    const sx = (t) => ((ax * t + bx) * t + cx) * t;
    const sy = (t) => ((ay * t + by) * t + cy) * t;
    const dx = (t) => (3 * ax * t + 2 * bx) * t + cx;
    return (x) => {
      let t = x;
      for (let i = 0; i < 8; i++) {
        const e = sx(t) - x;
        if (Math.abs(e) < 1e-6) break;
        const d = dx(t);
        if (Math.abs(d) < 1e-6) break;
        t -= e / d;
      }
      return sy(clamp(t));
    };
  }
  const E = {
    linear: (p) => p,
    outCubic: (p) => 1 - Math.pow(1 - p, 3),
    outQuart: (p) => 1 - Math.pow(1 - p, 4),
    outExpo: (p) => (p >= 1 ? 1 : 1 - Math.pow(2, -10 * p)),
    inOutCubic: (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2),
    outBack: (p, s = 1.4) => 1 + (s + 1) * Math.pow(p - 1, 3) + s * Math.pow(p - 1, 2),
    smooth: cubicBezier(0.22, 1, 0.36, 1),
    spring: (p) => 1 - Math.exp(-6.5 * p) * Math.cos(9 * p),
    cubicBezier,
  };

  // ---------- colour ----------
  function hex(c) {
    c = c.replace('#', '');
    if (c.length === 3) c = c.split('').map((x) => x + x).join('');
    return [0, 2, 4].map((i) => parseInt(c.slice(i, i + 2), 16));
  }
  const mixColor = (a, b, p) => {
    const A = hex(a), B = hex(b);
    return `rgb(${A.map((v, i) => Math.round(lerp(v, B[i], p))).join(',')})`;
  };

  // ---------- state ----------
  const tracks = new Map(); // el -> [{start,dur,from,to,ease}]
  const shows = [];         // {el,t0,t1}
  const calls = [];         // {t0,t1,fn}
  const sfxList = [];
  const captions = new Map(); // el -> { text, full, out }  (legibility lint)
  const meta = { width: 1920, height: 1080, fps: 30, duration: 10 };

  const DEFAULTS = { opacity: 1, x: 0, y: 0, scale: 1, scaleX: 1, scaleY: 1, rotate: 0, blur: 0 };
  const TRANSFORM = ['x', 'y', 'scale', 'scaleX', 'scaleY', 'rotate'];

  function tween(el, start, dur, from, to, ease = 'smooth') {
    if (typeof el === 'string') el = document.querySelector(el);
    if (!el) throw new Error('tween: element not found');
    if (!tracks.has(el)) tracks.set(el, []);
    const e = typeof ease === 'function' ? ease : E[ease];
    tracks.get(el).push({ start, dur: Math.max(dur, 1e-4), from, to, ease: e });
    tracks.get(el).sort((a, b) => a.start - b.start);
    return el;
  }
  function show(el, t0, t1 = Infinity) {
    if (typeof el === 'string') el = document.querySelector(el);
    shows.push({ el, t0, t1 });
    return el;
  }
  function call(t0, t1, fn) { calls.push({ t0, t1, fn }); }
  function sfx(t, name, gain = 1) { sfxList.push({ t: +t.toFixed(3), name, gain }); }

  function propAt(list, prop, t) {
    // value of prop at time t given sorted tracks: latest track that has started wins;
    // before any track starts, use the first track's `from`.
    let val, found = false;
    for (const tr of list) {
      if (!(prop in tr.to) && !(prop in tr.from)) continue;
      if (t < tr.start) {
        if (!found) { val = prop in tr.from ? tr.from[prop] : undefined; found = true; }
        break;
      }
      const p = clamp((t - tr.start) / tr.dur);
      const a = prop in tr.from ? tr.from[prop] : val;
      const b = prop in tr.to ? tr.to[prop] : a;
      if (typeof a === 'string' && a.startsWith('#')) val = p <= 0 ? a : mixColor(a, b, tr.ease(p));
      else if (typeof a === 'number' && typeof b === 'number') val = lerp(a, b, tr.ease(p));
      else val = p < 1 ? a : b;
      found = true;
    }
    return val;
  }

  function apply(el, list, t) {
    const props = new Set();
    list.forEach((tr) => { Object.keys(tr.from).forEach((k) => props.add(k)); Object.keys(tr.to).forEach((k) => props.add(k)); });
    const v = {};
    props.forEach((k) => { const r = propAt(list, k, t); if (r !== undefined) v[k] = r; });
    const T = TRANSFORM.some((k) => k in v);
    if (T) {
      const g = (k) => (k in v ? v[k] : DEFAULTS[k]);
      el.style.transform =
        `translate(${g('x')}px, ${g('y')}px) rotate(${g('rotate')}deg) scale(${g('scale') * g('scaleX')}, ${g('scale') * g('scaleY')})`;
    }
    if ('opacity' in v) el.style.opacity = v.opacity;
    if ('color' in v) el.style.color = v.color;
    if ('bg' in v) el.style.backgroundColor = v.bg;
    if ('blur' in v) el.style.filter = v.blur > 0.01 ? `blur(${v.blur}px)` : 'none';
    if ('width' in v) el.style.width = v.width + '%';
    if ('clip' in v) {
      // circle wipe: clip = radius in % of diagonal; origin via data-cx/data-cy (percent)
      const cx = el.dataset.cx || 50, cy = el.dataset.cy || 50;
      el.style.clipPath = `circle(${v.clip}% at ${cx}% ${cy}%)`;
    }
    if ('inset' in v) el.style.clipPath = `inset(0 ${100 - v.inset}% 0 0)`;
  }

  function setTime(t) {
    for (const s of shows) s.el.style.visibility = t >= s.t0 && t < s.t1 ? 'visible' : 'hidden';
    for (const [el, list] of tracks) apply(el, list, t);
    for (const c of calls) {
      if (t < c.t0 - 1e-6) continue;
      c.fn(clamp((t - c.t0) / Math.max(c.t1 - c.t0, 1e-4)), t);
    }
  }

  // ---------- VO timing helpers ----------
  // window.TIMING (written by vo.mjs): { lines: { id: { start, end, words:[{w,t,e}] } }, env:[..per frame] }
  const norm = (s) => s.toLowerCase().replace(/[^a-z0-9']/g, '');
  function line(id) {
    const L = window.TIMING && TIMING.lines[id];
    if (!L) throw new Error('No VO line ' + id);
    return L;
  }
  // time the VO says `word` (nth occurrence) in line `id`
  function cue(id, word, nth = 1) {
    const L = line(id);
    let k = 0;
    for (const w of L.words) if (norm(w.w) === norm(word) && ++k === nth) return w.t;
    console.warn(`cue: "${word}" not in line ${id}; using line start`);
    return L.start;
  }
  // map each display word to a spoken word time, sequentially; unmatched words follow the previous one
  function cues(id, text) {
    const L = line(id);
    const spoken = L.words.map((w) => ({ n: norm(w.w), t: w.t }));
    let j = 0, last = L.start - 0.12;
    return text.split(/\s+/).filter(Boolean).map((w) => {
      const n = norm(w);
      for (let k = j; k < spoken.length; k++) {
        if (spoken[k].n === n) { j = k + 1; return (last = spoken[k].t); }
      }
      return (last = last + 0.12);
    });
  }

  // ---------- word-by-word headline ----------
  // opts: { hi: ['word', ...] words to highlight, muted:'#8E918A', ink:'#161917', hiColor, times:[...] }
  function words(el, text, times, opts = {}) {
    if (typeof el === 'string') el = document.querySelector(el);
    const cs = getComputedStyle(el);
    const muted = opts.muted || cs.getPropertyValue('--muted').trim(), ink = opts.ink || cs.getPropertyValue('--ink').trim();
    const onHi = opts.onHi || cs.getPropertyValue('--on-hi').trim() || ink;
    const hiSet = new Set((opts.hi || []).map(norm));
    const parts = text.split(/(\n|[ \t]+)/);
    el.innerHTML = '';
    let wi = 0, prevHi = null;
    const spans = [];
    for (const p of parts) {
      if (p === '\n') { el.appendChild(document.createElement('br')); continue; }
      if (/^\s+$/.test(p) || !p) { el.appendChild(document.createTextNode(' ')); continue; }
      const t0 = Array.isArray(times) ? times[wi] : times + wi * (opts.step || 0.16);
      const w = document.createElement('span');
      w.className = 'mg-word';
      w.textContent = p;
      const isHi = hiSet.has(norm(p));
      if (isHi) {
        const m = document.createElement('i');
        m.className = 'mg-hi';
        w.prepend(m);
        // adjacent highlighted words read as one continuous marker stroke
        if (prevHi && prevHi.wi === wi - 1) prevHi.m.style.right = '-0.42em';
        prevHi = { m, wi };
        tween(m, t0 + 0.08, 0.42, { scaleX: 0 }, { scaleX: 1 }, 'outExpo');
      }
      el.appendChild(w);
      tween(w, t0, 0.2, { opacity: 0 }, { opacity: 1 }, 'linear');
      tween(w, t0, 0.34, { y: 18 }, { y: 0 }, 'outCubic');
      tween(w, t0 + 0.05, 0.3, { color: muted }, { color: isHi ? onHi : ink }, 'outCubic');
      spans.push({ el: w, t: t0 });
      wi++;
    }
    if (spans.length) captions.set(el, { text: text.replace(/\n/g, ' '), full: Math.max(...spans.map((x) => x.t)) + 0.35, out: Infinity });
    return spans;
  }

  // typewriter into el.textContent between t0..t0+dur
  function type(el, text, t0, dur) {
    if (typeof el === 'string') el = document.querySelector(el);
    call(t0 - 10, t0 + dur, (p, t) => {
      const q = clamp((t - t0) / dur);
      el.textContent = text.slice(0, Math.round(q * text.length));
    });
  }
  // number counter
  function count(el, a, b, t0, dur, fmt = (v) => Math.round(v), ease = 'inOutCubic') {
    if (typeof el === 'string') el = document.querySelector(el);
    call(t0 - 10, t0 + dur, (p, t) => {
      const q = E[ease](clamp((t - t0) / dur));
      el.textContent = fmt(lerp(a, b, q));
    });
  }
  // card entrance preset
  function pop(el, t0, opts = {}) {
    tween(el, t0, 0.2, { opacity: 0 }, { opacity: 1 }, 'linear');
    tween(el, t0, opts.dur || 0.5, { scale: opts.from ?? 0.94, y: opts.y ?? 24 }, { scale: 1, y: 0 }, (p) => E.outBack(p, 1.5));
    if (opts.sfx !== false) sfx(t0, opts.sound || 'pop', opts.gain || 0.8);
    return el;
  }
  function out(el, t0, dur = 0.25) {
    const c = captions.get(typeof el === 'string' ? document.querySelector(el) : el); if (c) c.out = Math.min(c.out, t0);
    tween(el, t0, dur, { opacity: 1 }, { opacity: 0 }, 'linear');
    tween(el, t0, dur, { y: 0 }, { y: -12 }, 'outCubic');
  }

  // captions fully readable for less than `min` seconds (reveal-complete → exit)
  function captionReport(min = 1.2) {
    return [...captions.values()].map((c) => ({ ...c, hold: +(Math.min(c.out, meta.duration) - c.full).toFixed(2) })).filter((c) => c.hold < min);
  }
  function setup(m) { Object.assign(meta, m); document.documentElement.style.setProperty('--W', meta.width + 'px'); }

  window.MG = { setup, meta, captions, captionReport, tween, show, call, sfx, sfxList, words, type, count, pop, out, cue, cues, line, E, clamp, lerp, mixColor };
  window.__setTime = setTime;
})();
