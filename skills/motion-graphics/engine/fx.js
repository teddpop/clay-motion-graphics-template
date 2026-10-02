/* Motion-design toolkit on top of runtime.js. Everything is deterministic (pure function of t).
 *
 *   MG.letters(el, text, t0, { stagger, from, hi, size })   per-letter kinetic reveal (rise + rotate + overshoot)
 *   MG.slam(el, t0)                                          big-word impact: scale punch + shake
 *   MG.stripes(layer, t0, colors, { dir, dur })              layered band wipe; returns the cover time (cut there)
 *   MG.burst(layer, x, y, t0, { color, n, r })               radiating sparkle lines + dots
 *   MG.confetti(layer, t0, { n, colors, x, y, spread })      physics confetti (seeded)
 *   MG.drift(el, t0, t1, { scale, x, y })                    slow camera push so frames never freeze
 *   MG.slide(el, t0, { from, to, dur })                      push-in/out with overshoot
 *   MG.roll(el, from, to, t0)                                odometer-style digit roll
 */
(function () {
  const { tween, call, sfx, E, clamp, lerp } = MG;
  const q = (el) => (typeof el === 'string' ? document.querySelector(el) : el);
  const rnd = (seed) => { let s = seed * 9301 + 49297; return () => ((s = (s * 9301 + 49297) % 233280) / 233280); };

  // ---- per-letter reveal ----
  function letters(el, text, t0, o = {}) {
    el = q(el);
    const stagger = o.stagger ?? 0.028, hi = new Set((o.hi || []).map((w) => w.toLowerCase()));
    el.innerHTML = '';
    let i = 0;
    const lines = text.split('\n');
    lines.forEach((line, li) => {
      line.split(' ').forEach((word, wi) => {
        const w = document.createElement('span');
        w.style.cssText = 'display:inline-block;white-space:nowrap;position:relative;isolation:isolate';
        const isHi = hi.has(word.toLowerCase().replace(/[^\w']/g, '')) || hi.has(word.toLowerCase());
        const wordStart = t0 + i * stagger;
        for (const ch of word) {
          const m = document.createElement('span');
          m.style.cssText = 'display:inline-block;overflow:hidden;vertical-align:top;padding:0 0.01em';
          const c = document.createElement('span');
          c.textContent = ch; c.style.display = 'inline-block';
          m.appendChild(c); w.appendChild(m);
          const t = t0 + i * stagger;
          tween(c, t, 0.55, { y: o.from ?? 110, rotate: o.rot ?? 12, opacity: 0 }, { y: 0, rotate: 0, opacity: 1 }, (p) => E.outBack(p, 1.6));
          i++;
        }
        if (isHi) {
          const mk = document.createElement('i'); mk.className = 'mg-hi'; w.prepend(mk);
          tween(mk, t0 + i * stagger + 0.05, 0.45, { scaleX: 0 }, { scaleX: 1 }, 'outExpo');
        }
        el.appendChild(w);
        el.appendChild(document.createTextNode(' '));
        i += 1;
      });
      if (li < lines.length - 1) el.appendChild(document.createElement('br'));
    });
    MG.captions.set(el, { text: text.replace(/\n/g, ' '), full: t0 + i * stagger + 0.55, out: Infinity });
    return t0 + i * stagger + 0.55; // time the reveal settles
  }

  // ---- impact ----
  function slam(el, t0, o = {}) {
    el = q(el);
    tween(el, t0, 0.35, { scale: o.from ?? 1.8, opacity: 0, rotate: o.rot ?? -6 }, { scale: 1, opacity: 1, rotate: 0 }, (p) => E.outBack(p, 2.4));
    tween(el, t0 + 0.28, 0.35, { x: 0 }, { x: o.shake ?? 10 }, (p) => Math.sin(p * Math.PI * 5) * (1 - p));
    sfx(t0 + 0.25, 'thunk', o.gain ?? 1);
  }

  // ---- layered band wipe ----
  // layer: full-frame absolutely positioned element on top of everything. Bands sweep in, hold, sweep out.
  function stripes(layer, t0, colors, o = {}) {
    layer = q(layer);
    const dir = o.dir ?? 1, dur = o.dur ?? 0.42, gap = o.gap ?? 0.07, skew = o.skew ?? -14;
    const n = colors.length, W = 2600;
    const cover = t0 + dur + gap * (n - 1);
    colors.forEach((c, k) => {
      const b = document.createElement('div');
      b.style.cssText = `position:absolute;left:-340px;top:-100px;width:${W}px;height:1280px;background:${c};transform:translateX(${-dir * 3000}px) skewX(${skew}deg);`;
      layer.appendChild(b);
      const tin = t0 + k * gap, tout = cover + 0.04 + (n - 1 - k) * 0.0 + k * gap;
      tween(b, tin, dur, { x: -dir * 3000 }, { x: 0 }, 'inOutCubic');
      tween(b, tout, dur, { x: 0 }, { x: dir * 3000 }, 'inOutCubic');
      MG.call(-1, 1e9, () => { b.style.transform += ` skewX(${skew}deg)`; });
    });
    sfx(t0, 'whoosh', 0.8);
    return cover; // switch scenes at this time
  }

  // ---- sparkle burst ----
  function burst(layer, x, y, t0, o = {}) {
    layer = q(layer);
    const n = o.n ?? 10, r = o.r ?? 120, color = o.color ?? '#1C1A17', w = o.w ?? 7;
    const g = document.createElement('div');
    g.style.cssText = `position:absolute;left:${x}px;top:${y}px;width:0;height:0;pointer-events:none`;
    layer.appendChild(g);
    for (let i = 0; i < n; i++) {
      const a = (i / n) * 360 + (o.rot ?? 0);
      const arm = document.createElement('div');
      arm.style.cssText = `position:absolute;left:0;top:0;width:0;height:0;transform:rotate(${a}deg)`;
      const ln = document.createElement('div');
      const len = i % 2 ? r * 0.55 : r * 0.8;
      ln.style.cssText = `position:absolute;left:${r * 0.45}px;top:${-w / 2}px;width:${len * 0.5}px;height:${w}px;border-radius:${w}px;background:${color};transform-origin:left center;opacity:0`;
      arm.appendChild(ln); g.appendChild(arm);
      tween(ln, t0, 0.18, { opacity: 0, scaleX: 0 }, { opacity: 1, scaleX: 1 }, 'outCubic');
      tween(ln, t0 + 0.18, 0.35, { x: 0, opacity: 1, scaleX: 1 }, { x: r * 0.35, opacity: 0, scaleX: 0.2 }, 'outCubic');
    }
    sfx(t0, o.sound ?? 'pop', 0.6);
  }

  // ---- confetti (herbs, sprinkles) ----
  function confetti(layer, t0, o = {}) {
    layer = q(layer);
    const n = o.n ?? 60, R = rnd(o.seed ?? 3), colors = o.colors ?? ['#FE8505', '#4FA046', '#FFE066', '#E8432F', '#FFFFFF'];
    const x0 = o.x ?? 960, y0 = o.y ?? 540, spread = o.spread ?? 900, life = o.life ?? 2.2;
    const parts = [];
    for (let i = 0; i < n; i++) {
      const d = document.createElement('div');
      const w = 10 + R() * 16, h = o.leaf ? w * 0.5 : w * (0.35 + R() * 0.4);
      d.style.cssText = `position:absolute;left:0;top:0;width:${w}px;height:${h}px;border-radius:${o.leaf ? '50%' : '3px'};background:${colors[i % colors.length]};opacity:0;pointer-events:none`;
      layer.appendChild(d);
      parts.push({ d, vx: (R() - 0.5) * spread * 1.4, vy: -(500 + R() * 700), spin: (R() - 0.5) * 1400, flip: 4 + R() * 8, delay: R() * 0.12 });
    }
    call(t0 - 0.01, t0 + life, (p, t) => {
      for (const P of parts) {
        const u = t - t0 - P.delay;
        if (u < 0) { P.d.style.opacity = 0; continue; }
        const x = x0 + P.vx * u, y = y0 + P.vy * u + 0.5 * 1600 * u * u;
        P.d.style.opacity = clamp(1 - (u - life + 0.6) / 0.6);
        P.d.style.transform = `translate(${x}px, ${y}px) rotate(${P.spin * u}deg) scaleY(${Math.cos(u * P.flip)})`;
      }
    });
    sfx(t0, 'pop', 0.7);
  }

  function drift(el, t0, t1, o = {}) {
    tween(q(el), t0, t1 - t0, { scale: 1, x: 0, y: 0 }, { scale: o.scale ?? 1.04, x: o.x ?? 0, y: o.y ?? 0 }, 'linear');
  }
  function slide(el, t0, o = {}) {
    const [fx, fy] = o.from ?? [0, 0], [tx, ty] = o.to ?? [0, 0];
    tween(q(el), t0, o.dur ?? 0.6, { x: fx, y: fy }, { x: tx, y: ty }, o.ease ?? ((p) => E.outBack(p, 1.2)));
  }
  // odometer digit roll (el contains the number text)
  function roll(el, from, to, t0, o = {}) {
    el = q(el);
    el.style.display = 'inline-block'; el.style.overflow = 'hidden'; el.style.verticalAlign = 'bottom';
    el.style.height = '1.1em'; el.style.lineHeight = '1.1em';
    const col = document.createElement('div');
    const seq = []; for (let v = from; from > to ? v >= to : v <= to; v += from > to ? -1 : 1) seq.push(v);
    col.innerHTML = seq.map((v) => `<div style="height:1.1em">${v}</div>`).join('');
    el.innerHTML = ''; el.appendChild(col);
    const steps = seq.length - 1;
    call(t0 - 10, t0 + (o.dur ?? 0.6) + 0.5, (p, t) => {
      const u = clamp((t - t0) / (o.dur ?? 0.6)), e = u < 1 ? E.inOutCubic(u) : 1;
      const settle = u >= 1 ? Math.exp(-(t - t0 - (o.dur ?? 0.6)) * 9) * Math.sin((t - t0) * 30) * 0.08 : 0;
      col.style.transform = `translateY(${-(e * steps + settle) * 1.1}em)`;
    });
    for (let k = 1; k <= steps; k++) sfx(t0 + (k / steps) * (o.dur ?? 0.6), 'tick', 0.8);
  }

  Object.assign(MG, { letters, slam, stripes, burst, confetti, drift, slide, roll });
})();
