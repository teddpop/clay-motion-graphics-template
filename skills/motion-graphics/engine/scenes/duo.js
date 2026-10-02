// Two (or more) people in bubbles, far apart or out of sync: messages arc between them (and get lost when that's the
// problem). For products whose value is between people: teams, families, friends, buyers/sellers.
export default {
  name: 'duo',
  about: 'Connection or disconnection between people. Each person: a bubble + name + place/time + sun/moon. Lines: 1–3 (any speaker).',
  params: {
    people: '[{ who (cast id), label, place, sky: sun|moon|none, at: [left, top] }]   (default positions: left-low, right-high)',
    messages: '{ prop (envelope), every (0.55), miss: true|false, size }', caption: 'text', hi: 'highlight', dread: 'true → gloom on the gap',
    poses: '[[who, line, cue, pose]]',
  },
  build(S, sc) {
    S.product?.away(sc.t0);
    const { E, clamp, front, MG } = S, id = sc.lines[0];
    S.host.hide(sc.t0 - 0.05).show(sc.t1);
    if (sc.caption) S.caption(sc.caption, S.line(id).start - 0.05, { slot: 'main', hi: sc.hi, style: { width: 1000, size: 88 }, maxLines: 2 });
    const DEF = [[150, 630], [1400, 300], [800, 640]], R = 340;
    const ppl = (sc.people || []).map((p, k) => ({ ...p, k, x: (p.at || DEF[k])[0], y: (p.at || DEF[k])[1] }));
    const hosts = {};
    ppl.forEach((p) => {
      const el = document.createElement('div'); el.className = 'bub2'; el.style.cssText += `left:${p.x}px;top:${p.y}px;width:${R}px;height:${R}px;background:${p.tint || S.P.bubble}`;
      S.layers.fullBack.appendChild(el);
      const tin = sc.t0 + 0.1 + p.k * 0.18;
      S.tw(el, tin, 0.5, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1 }, (q) => E.outBack(q, 1.8)); S.sfx(tin + 0.05, 'pop', 0.4);
      S.tw(el, sc.t1 + (sc.next?.scene === 'idea' ? 0.25 : -0.35), 0.35, { scale: 1, opacity: 1 }, { scale: 0, opacity: 0 }, 'inOutCubic');
      hosts[p.who] = S.H3(el, p.who, { variant: 'bust', pose: p.pose || 'idle', seed: 3 + p.k * 4, talkWhen: S.talkFor(p.who) });
      if (p.label) {
        const lab = document.createElement('div'); lab.className = 'duoLab'; lab.style.left = p.x + 'px'; lab.style.top = (p.y + R + 14) + 'px';
        lab.innerHTML = `${p.label}${p.place ? `<small>${p.place}</small>` : ''}`; S.layers.fullBack.appendChild(lab);
        S.tw(lab, tin + 0.2, 0.3, { opacity: 0, y: 10 }, { opacity: 1, y: 0 }, 'outCubic'); S.tw(lab, sc.t1 - 0.35, 0.25, { opacity: 1 }, { opacity: 0 }, 'linear');
      }
      if (p.sky && p.sky !== 'none') front.add(S.prop(p.sky), (o, t) => {
        MG.place(o, t, front, { at: [p.x + R - 20, p.y + 30], size: 110, t0: tin + 0.3, tilt: [0, 0, 0], spin: p.sky === 'sun' ? 0 : 0, bob: 5, seed: p.k });
        if (p.sky === 'sun') o.rotation.z = t * 0.6;
        if (t > sc.t1 - 0.3) { const u = clamp((t - sc.t1 + 0.3) / 0.3); o.scale.multiplyScalar(Math.max(0.0001, 1 - u)); o.visible = u < 1; }
      });
    });
    for (const [who, ln, w, pose] of sc.poses || []) hosts[who]?.pose(S.at(ln, w, -0.15), pose);
    for (const [who, ln, w, deg] of sc.looks || []) hosts[who]?.look(S.at(ln, w, -0.2), deg);
    // messages arc between the first two people
    const m = sc.messages; if (!m || ppl.length < 2) return;
    const A = [ppl[0].x + R / 2, ppl[0].y + R / 2], B = [ppl[1].x + R / 2, ppl[1].y + R / 2], every = m.every ?? 0.55, t0 = sc.t0 + 0.8, n = Math.floor((sc.t1 - 0.5 - t0) / every);
    for (let k = 0; k < Math.min(n, 16); k++) {
      const fwd = k % 2 === 0, from = fwd ? A : B, to = fwd ? B : A, tk = t0 + k * every, lost = m.miss && k % 3 !== 0;
      front.add(S.prop(m.prop || 'envelope'), (o, t) => {
        const u = (t - tk) / 0.9; if (u < 0 || u > 1) { o.visible = false; return; }
        o.visible = true; const e = E.inOutCubic(Math.min(1, lost ? u * 1.6 : u));
        let x = from[0] + (to[0] - from[0]) * e * (lost ? 0.55 : 1), y = from[1] + (to[1] - from[1]) * e * (lost ? 0.55 : 1) - Math.sin(Math.min(1, e) * Math.PI) * 180;
        if (lost && u > 0.62) { const f = (u - 0.62) / 0.38; y += f * f * 700; }
        o.position.copy(front.px(x, y, 1)); o.scale.setScalar((m.size ?? 90) * front.unit * (lost ? 1 : 1 - Math.max(0, u - 0.85) / 0.15 + 0.0001));
        o.rotation.set(0.2, fwd ? -0.3 : 0.3, Math.sin(u * 8) * (lost ? 0.6 : 0.15));
      });
      S.sfx(tk, 'pop', 0.25); if (!lost) S.sfx(tk + 0.85, 'tick', 0.4);
    }
    if (sc.dread) { const mx = (A[0] + B[0]) / 2, my = (A[1] + B[1]) / 2; S.dread({ x0: mx - 170, x1: mx + 230, y0: my - 110, y1: my + 260 }, t0 + 1.2, S.at(sc.lines.at(-1), sc.qAt ?? 0.4), sc.t1 - 0.4, { lines: 5, qScale: 0.8 }); }
  },
};
