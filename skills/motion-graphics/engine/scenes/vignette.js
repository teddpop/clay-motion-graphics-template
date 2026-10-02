// A little life moment: the mascot full-body in a setting built from clay props (beach, sofa, desk, park…),
// optionally with a "meanwhile" inset circle showing something happening elsewhere, and/or a notification arriving.
export default {
  name: 'vignette',
  about: 'Where the viewer\'s life happens, the before/after of a day, peace of mind ("meanwhile…"). Lines: 1–2.',
  params: {
    who: 'cast id', at: 'left | center | right (center)', pose: 'pose', poses: '[[line, cue, pose]]', hold: 'phone | none',
    set: '[{ prop, opts, at:[x,y], size, tilt, motion: float|spin|sway }]   the setting around the mascot',
    inset: '{ prop, opts, at:[cx,cy] (1500,380), r (210), size, label, drip: { prop, from:[dx,dy], every }, dreadAt, qAt, line, bg }',
    notify: '{ title, text, line, at (cue), pos:[x,y] }  a phone-style notification card pops in', caption: 'text', hi: 'highlight', bg: 'background', slot: 'main|low',
  },
  build(S, sc) {
    S.product?.away(sc.t0);
    const { E, clamp, MG, front } = S, id = sc.lines[0];
    if (sc.bg) S.bg(sc.t0, sc.bg, sc.bgFrom || [960, 540]);
    S.clear(sc.t0 - 0.1);
    const h = S.full(sc.t0, sc.t1 + 0.9, { who: sc.who, at: sc.at || 'center', pose: sc.pose || 'idle', seed: 7 + sc.i, delay: 0.25 });
    if (sc.hold === 'phone') h.pose(sc.t0 + 0.3, 'hold').prop('phone', sc.t0 + 0.3, sc.t1 + 0.9);
    for (const [ln, w, p] of sc.poses || []) h.pose(S.at(ln, w, -0.15), p);
    for (const [ln, w, d] of sc.looks || []) h.look(S.at(ln, w, -0.2), d);
    if (sc.caption) S.caption(sc.caption, S.line(id).start - 0.05, { slot: sc.slot || 'main', hi: sc.hi });
    (sc.set || []).forEach((p, k) => {
      const t0 = sc.t0 + 0.35 + k * 0.08;
      front.add(S.prop(p), (o, t) => {
        MG.place(o, t, front, { at: p.at, size: p.size ?? 200, t0, tilt: p.tilt || [8, 0, 0], spin: p.motion === 'spin' ? 0.4 : 0, bob: p.motion === 'float' ? 8 : 0, seed: k });
        if (p.motion === 'sway') o.rotation.z += Math.sin(t * 1.6 + k) * 0.06;
        if (p.motion === 'turn') o.rotation.z = t * 0.5;
        const u = clamp((t - (sc.t1 - 0.1)) / 0.35); if (u > 0) o.scale.multiplyScalar(Math.max(0.0001, 1 - u)); if (u >= 1) o.visible = false;
      });
    });
    const I = sc.inset;
    if (I) {
      const [cx, cy] = I.at || [1500, 380], r = I.r ?? 210, tIn = S.at(I.line || id, I.inAt ?? 0.3);
      const el = document.createElement('div'); el.className = 'inset'; el.style.cssText += `left:${cx - r}px;top:${cy - r}px;width:${2 * r}px;height:${2 * r}px;background:${I.bg || S.P.warm}`;
      S.layers.chips.before(el);
      S.tw(el, tIn, 0.5, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1 }, (q) => E.outBack(q, 1.7)); S.sfx(tIn + 0.05, 'pop', 0.45);
      S.tw(el, sc.t1 - 0.35, 0.3, { scale: 1, opacity: 1 }, { scale: 0, opacity: 0 }, 'inOutCubic');
      const st = MG.stage3d(el);
      st.add(S.prop(I), (o, t) => { MG.place(o, t, st, { at: [r + (I.dx ?? 0), r + (I.dy ?? 0)], size: I.size ?? r * 1.3, t0: tIn + 0.15, tilt: I.tilt || [10, -20, 0], spin: 0, bob: 0 }); });
      if (I.drip) for (let k = 0; k < 14; k++) {
        const tk = tIn + 0.5 + k * (I.drip.every ?? 0.55), [dx, dy] = I.drip.from || [0, 40];
        st.add(S.prop(I.drip.prop || 'waterDrop'), (o, t) => {
          const u = (t - tk) / 0.6; if (u < 0 || u > 1 || t > sc.t1) { o.visible = false; return; }
          o.visible = true; o.position.copy(st.px(r + dx, r + dy + u * u * (r * 0.9))); o.scale.setScalar((I.drip.size ?? 40) * st.unit * (u > 0.85 ? (1 - u) / 0.15 : 1)); o.rotation.set(0, 0, 0);
        });
        if (tk < sc.t1) S.sfx(tk + 0.55, 'tick', 0.45);
      }
      if (I.label) S.chip(I.label, cx, cy + r + 16, tIn + 0.35, sc.t1 - 0.35, { check: false });
      if (I.dreadAt != null) S.dread({ x0: cx - r, x1: cx + r, y0: cy - r + 40, y1: cy + r }, S.at(I.line || id, I.dreadAt), I.qAt != null ? S.at(I.line || id, I.qAt) : null, sc.t1 - 0.4, { lines: 5, qScale: 0.8 });
    }
    const N = sc.notify;
    if (N) {
      const el = document.createElement('div'); el.className = 'toastN'; const [x, y] = N.pos || [1300, 180];
      el.style.left = x + 'px'; el.style.top = y + 'px';
      el.innerHTML = `<span class="ap"><svg viewBox="0 0 48 48">${S.MARK}</svg></span><div><b>${N.title || S.V.product.name}</b><span>${N.text}</span></div>`;
      S.layers.chips.appendChild(el);
      const t = S.at(N.line || id, N.at ?? 0.4);
      S.tw(el, t, 0.5, { y: -80, opacity: 0, scale: 0.94 }, { y: 0, opacity: 1, scale: 1 }, (q) => E.outBack(q, 1.5)); S.sfx(t, 'ding', 0.6);
      S.tw(el, sc.t1 - 0.3, 0.3, { opacity: 1 }, { opacity: 0 }, 'linear');
    }
  },
};
