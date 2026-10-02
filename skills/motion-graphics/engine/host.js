/* Vector host character with a pose vocabulary, blink, breathing and VO-driven lip flap.
 *
 *   const h = MG.host(containerEl, { variant: 'full' | 'bust', palette: {...} });
 *   h.pose(t, 'shrug')         // blend to pose at time t (0.35 s blend)
 *   h.wave(t0, t1)             // oscillate the waving hand
 *
 * Poses: idle, talk, shrug, present, point, think, thumbs, wave, open (arms wide)
 * Arms are 2-bone chains; angles in degrees, 0 = hanging down, + swings the hand to viewer-left.
 */
(function () {
  const P = {
    skin: '#C8875B', skinHi: '#E0A479', skinLo: '#9E6441',
    hair: '#3F2F2A', hairHi: '#5E4940',
    shirt: '#7D8466', shirtHi: '#99A07F', shirtLo: '#5F664C',
    tee: '#F2F0EA', pants: '#2E2C2B', shoe: '#F4F4F2', shoeSole: '#D9D9D6',
    eye: '#FFFFFF', pupil: '#1E1A18', mouth: '#5A241C', tongue: '#C85A4E',
  };

  // [L shoulder, L elbow, R shoulder, R elbow, L hand, R hand, head tilt]
  // L = viewer-left arm (character's right), R = viewer-right arm.
  const POSES = {
    idle:    [7, -6, -7, 6, 'relax', 'relax', 0],
    talk:    [18, -60, -18, 60, 'open', 'open', 0],
    shrug:   [14, 100, -14, -100, 'palm', 'palm', -5],
    present: [42, 48, -8, 8, 'palm', 'relax', 3],
    point:   [7, -6, -26, -150, 'relax', 'point', -3],
    think:   [7, -6, -30, -163, 'relax', 'open', 6],
    thumbs:  [7, -6, -22, -140, 'relax', 'thumb', 0],
    wave:    [7, -6, -58, -112, 'relax', 'open', -3],
    open:    [40, 34, -40, -34, 'palm', 'palm', 0],
  };
  const NUM = [0, 1, 2, 3, 6];

  function el(tag, attrs, parent) {
    const e = document.createElementNS('http://www.w3.org/2000/svg', tag);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }

  function host(container, opts = {}) {
    if (typeof container === 'string') container = document.querySelector(container);
    const pal = Object.assign({}, P, opts.palette || {});
    const variant = opts.variant || 'full';
    const id = 'h' + Math.random().toString(36).slice(2, 7);
    const svg = el('svg', {
      viewBox: variant === 'bust' ? '-30 30 460 460' : '0 0 400 830',
      width: '100%', height: '100%', preserveAspectRatio: variant === 'bust' ? 'xMidYMid slice' : 'xMidYMax meet',
    }, container);
    svg.style.overflow = 'visible';

    // ---------- gradients (fake 3D volume) ----------
    const defs = el('defs', {}, svg);
    const rg = (gid, c1, c2, c3, cx = '38%', cy = '32%') => {
      const g = el('radialGradient', { id: id + gid, cx, cy, r: '75%' }, defs);
      el('stop', { offset: '0%', 'stop-color': c1 }, g);
      el('stop', { offset: '60%', 'stop-color': c2 }, g);
      el('stop', { offset: '100%', 'stop-color': c3 }, g);
    };
    const lg = (gid, c1, c2, x2 = '1', y2 = '0') => {
      const g = el('linearGradient', { id: id + gid, x1: '0', y1: '0', x2, y2 }, defs);
      el('stop', { offset: '0%', 'stop-color': c1 }, g);
      el('stop', { offset: '100%', 'stop-color': c2 }, g);
    };
    rg('skin', pal.skinHi, pal.skin, pal.skinLo);
    rg('hair', pal.hairHi, pal.hair, pal.hair, '45%', '20%');
    lg('shirtL', pal.shirtHi, pal.shirtLo);
    lg('shirtR', pal.shirt, pal.shirtLo);
    lg('arm', pal.shirtHi, pal.shirtLo);
    lg('pants', '#3A3837', pal.pants);
    const f = (g) => `url(#${id}${g})`;

    const root = el('g', {}, svg);
    const body = el('g', {}, root);

    // ---------- legs & shoes ----------
    const legs = el('g', {}, body);
    el('path', { d: 'M150 560 L146 780 Q146 792 158 792 L186 792 Q196 792 196 780 L200 600 L204 780 Q204 792 214 792 L242 792 Q254 792 254 780 L250 560 Z', fill: f('pants') }, legs);
    el('path', { d: 'M200 600 L200 770', stroke: '#1F1E1D', 'stroke-width': 3, opacity: 0.5 }, legs);
    for (const x of [171, 229]) {
      el('path', { d: `M${x - 34} 810 Q${x - 36} 784 ${x - 18} 780 L${x + 18} 780 Q${x + 40} 786 ${x + 40} 810 Z`, fill: pal.shoe }, legs);
      el('rect', { x: x - 36, y: 806, width: 78, height: 12, rx: 6, fill: pal.shoeSole }, legs);
    }

    // ---------- torso ----------
    const torso = el('g', {}, body);
    el('path', { d: 'M168 330 L232 330 L240 590 L160 590 Z', fill: pal.tee }, torso);
    // overshirt panels
    el('path', { d: 'M200 332 L150 322 Q122 328 118 360 L128 600 Q160 608 186 604 L190 420 Z', fill: f('shirtL') }, torso);
    el('path', { d: 'M200 332 L250 322 Q278 328 282 360 L272 600 Q240 608 214 604 L210 420 Z', fill: f('shirtR') }, torso);
    // collar
    el('path', { d: 'M168 318 L200 338 L182 372 L160 330 Z', fill: pal.shirtHi }, torso);
    el('path', { d: 'M232 318 L200 338 L218 372 L240 330 Z', fill: pal.shirt }, torso);
    // pockets
    el('rect', { x: 138, y: 400, width: 40, height: 42, rx: 5, fill: 'none', stroke: pal.shirtLo, 'stroke-width': 3 }, torso);
    el('rect', { x: 222, y: 400, width: 40, height: 42, rx: 5, fill: 'none', stroke: pal.shirtLo, 'stroke-width': 3 }, torso);
    el('path', { d: 'M138 412 L178 412 M222 412 L262 412', stroke: pal.shirtLo, 'stroke-width': 3 }, torso);

    // ---------- arms ----------
    function arm(sx, sy, side) {
      const g0 = el('g', {}, body);
      const upper = el('g', {}, g0);
      el('path', { d: `M${sx - 21} ${sy} Q${sx - 24} ${sy + 60} ${sx - 19} ${sy + 118} L${sx + 19} ${sy + 118} Q${sx + 24} ${sy + 60} ${sx + 21} ${sy} Q${sx} ${sy - 16} ${sx - 21} ${sy} Z`, fill: f('arm') }, upper);
      const fore = el('g', {}, upper);
      const ex = sx, ey = sy + 112;
      el('path', { d: `M${ex - 19} ${ey} L${ex - 17} ${ey + 96} L${ex + 17} ${ey + 96} L${ex + 19} ${ey} Z`, fill: f('arm') }, fore);
      el('rect', { x: ex - 18, y: ey + 88, width: 36, height: 12, rx: 5, fill: pal.shirtLo }, fore); // cuff
      const hand = el('g', {}, fore);
      const hx = ex, hy = ey + 104;
      const shapes = {};
      const skin = f('skin');
      // relax: closed mitten
      shapes.relax = el('g', {}, hand);
      el('ellipse', { cx: hx, cy: hy + 24, rx: 20, ry: 26, fill: skin }, shapes.relax);
      // open: fingers spread (palm facing viewer)
      shapes.open = el('g', {}, hand);
      el('ellipse', { cx: hx, cy: hy + 22, rx: 22, ry: 23, fill: skin }, shapes.open);
      for (const [dx, len] of [[-15, 26], [-5, 32], [5, 33], [15, 28]]) el('rect', { x: hx + dx - 5, y: hy + 28, width: 10, height: len, rx: 5, fill: skin }, shapes.open);
      el('rect', { x: hx + (side === 'L' ? 14 : -26), y: hy + 8, width: 12, height: 28, rx: 6, fill: skin, transform: `rotate(${side === 'L' ? -40 : 40} ${hx} ${hy + 20})` }, shapes.open);
      // palm: palm-up (for shrug/present), wide flat hand
      shapes.palm = el('g', {}, hand);
      el('ellipse', { cx: hx, cy: hy + 24, rx: 24, ry: 21, fill: skin }, shapes.palm);
      for (const [dx, len] of [[-14, 24], [-4, 28], [6, 28], [16, 22]]) el('rect', { x: hx + dx - 5, y: hy + 30, width: 10, height: len, rx: 5, fill: skin }, shapes.palm);
      // point: fist with index extended along the forearm direction
      shapes.point = el('g', {}, hand);
      el('ellipse', { cx: hx, cy: hy + 22, rx: 20, ry: 20, fill: skin }, shapes.point);
      el('rect', { x: hx - 6, y: hy + 26, width: 12, height: 44, rx: 6, fill: skin }, shapes.point);
      // thumb: fist with thumb up (thumb perpendicular)
      shapes.thumb = el('g', {}, hand);
      el('ellipse', { cx: hx, cy: hy + 22, rx: 22, ry: 21, fill: skin }, shapes.thumb);
      el('rect', { x: hx - 7, y: hy + 30, width: 14, height: 34, rx: 7, fill: skin }, shapes.thumb);
      for (const k in shapes) shapes[k].style.display = 'none';
      return { upper, fore, sx, sy, ex, ey, shapes };
    }
    const L = arm(142, 348, 'L');
    const R = arm(258, 348, 'R');

    // ---------- head ----------
    const head = el('g', {}, root);
    const HX = 200, HY = 200;
    el('rect', { x: 184, y: 280, width: 32, height: 50, rx: 10, fill: pal.skinLo }, head); // neck
    el('ellipse', { cx: HX - 88, cy: HY + 20, rx: 17, ry: 23, fill: f('skin') }, head); // ears
    el('ellipse', { cx: HX + 88, cy: HY + 20, rx: 17, ry: 23, fill: f('skin') }, head);
    el('ellipse', { cx: HX, cy: HY + 10, rx: 90, ry: 98, fill: f('skin') }, head);
    // hair: voluminous quiff
    el('path', { d: `M${HX - 92} ${HY - 4} Q${HX - 100} ${HY - 96} ${HX - 30} ${HY - 108} Q${HX + 10} ${HY - 132} ${HX + 60} ${HY - 104} Q${HX + 104} ${HY - 84} ${HX + 92} ${HY - 4} Q${HX + 80} ${HY - 50} ${HX + 40} ${HY - 58} Q${HX - 20} ${HY - 50} ${HX - 60} ${HY - 60} Q${HX - 84} ${HY - 40} ${HX - 92} ${HY - 4} Z`, fill: f('hair') }, head);
    el('path', { d: `M${HX - 50} ${HY - 104} Q${HX} ${HY - 126} ${HX + 44} ${HY - 106}`, stroke: pal.hairHi, 'stroke-width': 6, fill: 'none', 'stroke-linecap': 'round', opacity: 0.6 }, head);
    // brows
    const browL = el('path', { d: `M${HX - 52} ${HY - 22} Q${HX - 34} ${HY - 34} ${HX - 16} ${HY - 24}`, stroke: pal.hair, 'stroke-width': 8, fill: 'none', 'stroke-linecap': 'round' }, head);
    const browR = el('path', { d: `M${HX + 16} ${HY - 24} Q${HX + 34} ${HY - 34} ${HX + 52} ${HY - 22}`, stroke: pal.hair, 'stroke-width': 8, fill: 'none', 'stroke-linecap': 'round' }, head);
    // eyes
    const eyes = el('g', {}, head);
    const eyeL = el('g', {}, eyes), eyeR = el('g', {}, eyes);
    for (const [g, x] of [[eyeL, HX - 34], [eyeR, HX + 34]]) {
      el('ellipse', { cx: x, cy: HY + 8, rx: 23, ry: 27, fill: pal.eye }, g);
      el('circle', { cx: x + 1, cy: HY + 11, r: 11.5, fill: pal.pupil }, g);
      el('circle', { cx: x + 5, cy: HY + 5, r: 3.5, fill: '#fff' }, g);
    }
    // nose
    el('path', { d: `M${HX - 7} ${HY + 44} Q${HX} ${HY + 52} ${HX + 7} ${HY + 44}`, stroke: pal.skinLo, 'stroke-width': 5, fill: 'none', 'stroke-linecap': 'round' }, head);
    el('ellipse', { cx: HX, cy: HY + 36, rx: 12, ry: 14, fill: pal.skinHi, opacity: 0.45 }, head);
    // mouth
    const mouth = el('path', { fill: pal.mouth }, head);
    const teeth = el('path', { fill: '#fff' }, head);
    // cheeks
    el('ellipse', { cx: HX - 58, cy: HY + 56, rx: 16, ry: 9, fill: '#E07A5F', opacity: 0.22 }, head);
    el('ellipse', { cx: HX + 58, cy: HY + 56, rx: 16, ry: 9, fill: '#E07A5F', opacity: 0.22 }, head);

    // ---------- animation state ----------
    const keys = [{ t: -1, pose: opts.pose || 'idle' }];
    const waves = [];
    const blend = 0.38;
    const seed = opts.seed || 1;

    function poseAt(t) {
      let i = 0;
      while (i + 1 < keys.length && keys[i + 1].t <= t) i++;
      const cur = POSES[keys[i].pose];
      const prev = i > 0 ? POSES[keys[i - 1].pose] : cur;
      const p = i > 0 ? Math.min(1, (t - keys[i].t) / blend) : 1;
      const e = MG.E.inOutCubic(p);
      const v = cur.slice();
      for (const k of NUM) v[k] = MG.lerp(prev[k], cur[k], e);
      if (p < 0.5 && i > 0) { v[4] = prev[4]; v[5] = prev[5]; }
      return v;
    }
    function showHand(a, name) { for (const k in a.shapes) a.shapes[k].style.display = k === name ? '' : 'none'; }

    function update(t) {
      const v = poseAt(t);
      // subtle life: breathing + gesture drift
      const br = Math.sin(t * 2 * Math.PI / 3.6 + seed) * 1.6;
      const drift = Math.sin(t * 1.3 + seed * 2) * 2.2;
      let rEl = v[3];
      for (const w of waves) if (t >= w.t0 && t < w.t1) {
        const ramp = Math.min(1, (t - w.t0) / 0.25, (w.t1 - t) / 0.25);
        rEl += Math.sin((t - w.t0) * Math.PI * 2 * 2.2) * 18 * ramp;
      }
      L.upper.setAttribute('transform', `rotate(${v[0] + drift * 0.5} ${L.sx} ${L.sy})`);
      L.fore.setAttribute('transform', `rotate(${v[1] - drift} ${L.ex} ${L.ey})`);
      R.upper.setAttribute('transform', `rotate(${v[2] - drift * 0.5} ${R.sx} ${R.sy})`);
      R.fore.setAttribute('transform', `rotate(${rEl + drift} ${R.ex} ${R.ey})`);
      showHand(L, v[4]); showHand(R, v[5]);
      head.setAttribute('transform', `translate(0 ${br * 0.8}) rotate(${v[6] + Math.sin(t * 0.9 + seed) * 1.5} ${HX} ${HY + 100}) translate(200 300) scale(1.16) translate(-200 -300)`);
      body.setAttribute('transform', `translate(0 ${br * 0.4})`);

      // blink: deterministic pseudo-random every 2.2–4 s, 130 ms
      const period = 3.1, phase = (t + seed * 0.77) % period;
      const jitter = (Math.sin(Math.floor((t + seed * 0.77) / period) * 12.9898) * 43758.5453) % 1;
      const bt = 1.2 + Math.abs(jitter) * 1.5;
      const b = phase > bt && phase < bt + 0.13 ? 1 - Math.sin(((phase - bt) / 0.13) * Math.PI) * 0.92 : 1;
      eyeL.setAttribute('transform', `translate(0 ${HY + 8}) scale(1 ${b}) translate(0 ${-(HY + 8)})`);
      eyeR.setAttribute('transform', `translate(0 ${HY + 8}) scale(1 ${b}) translate(0 ${-(HY + 8)})`);

      // mouth: talk amplitude from VO envelope
      let a = 0;
      const env = window.TIMING && TIMING.env;
      if (env && opts.talk !== false) {
        const fi = Math.floor(t * (TIMING.envFps || 30));
        a = env[fi] || 0;
        a = Math.min(1, a * 1.25);
      }
      const my = HY + 66, w = 26 - a * 4, d = 8 + a * 22;
      mouth.setAttribute('d', `M${HX - w} ${my} Q${HX} ${my + 6} ${HX + w} ${my} Q${HX} ${my + d + 6} ${HX - w} ${my} Z`);
      teeth.setAttribute('d', a > 0.15 ? `M${HX - w + 5} ${my + 2} Q${HX} ${my + 7} ${HX + w - 5} ${my + 2} L${HX + w - 7} ${my + 6} Q${HX} ${my + 11} ${HX - w + 7} ${my + 6} Z` : '');
      const lift = a * 3;
      browL.setAttribute('transform', `translate(0 ${-lift})`);
      browR.setAttribute('transform', `translate(0 ${-lift})`);
    }

    MG.call(-1, 1e9, (p, t) => update(t));
    update(0);
    return {
      svg,
      pose(t, name) { if (!POSES[name]) throw new Error('unknown pose ' + name); keys.push({ t, pose: name }); keys.sort((a, b) => a.t - b.t); return this; },
      wave(t0, t1) { waves.push({ t0, t1 }); this.pose(t0 - 0.3, 'wave'); return this; },
    };
  }

  MG.host = host;
  MG.POSES = POSES;
})();
