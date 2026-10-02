// Chaos you can see: props pile up and jitter nervously (meetings, notes, tabs, bills), dread hangs over the pile,
// then (optionally) it resolves: everything snaps into a neat stack, poofs away, or gets swept off.
export default {
  name: 'clutter',
  about: 'Overload / mess / too-many problems that are not a container. Lines: 1–2.',
  params: {
    props: '[{ prop, opts, count, variants, size }] piled in the area', area: '{ x0, x1, y0, y1 } (right half)', every: 'seconds between arrivals (0.12)',
    caption: 'text', hi: 'highlight', big: 'kicker text', bigAt: 'cue', dreadAt: 'cue (default ~1/3 into the scene)', qAt: 'cue',
    resolve: 'stack | poof | sweep | none (default sweep at scene end)', resolveAt: '[line, cue]', pose: 'bubble pose (shrug)',
  },
  build(S, sc) {
    S.product?.away(sc.t0);
    const { E, clamp, front, MG } = S, id = sc.lines[0], last = sc.lines.at(-1);
    const A = sc.area || { x0: 1080, x1: 1800, y0: 220, y1: 900 };
    if (sc.big) S.caption(sc.big, S.at(id, sc.bigAt ?? 0.1, -0.1), { slot: 'big', letters: true });
    if (sc.caption) S.caption(sc.caption, sc.isFirst ? 0.15 : S.line(id).start - 0.05, sc.big ? { slot: 'sub', hi: sc.hi, sync: id } : { slot: sc.slot || (sc.isFirst ? 'hook' : 'main'), hi: sc.hi });
    S.host.pose(S.line(id).start + 0.3, sc.pose || 'shrug');
    const list = []; for (const p of sc.props || []) for (let k = 0; k < (p.count || 1); k++) list.push(p.variants ? { ...p, opts: p.variants[k % p.variants.length] } : p);
    const every = sc.every ?? 0.12, tStart = sc.t0 + 0.3;
    const tRes = sc.resolveAt ? S.at(sc.resolveAt[0], sc.resolveAt[1]) : sc.t1 - 0.4, mode = sc.resolve || 'sweep';
    // deterministic scatter (golden-angle spiral, squashed into the area)
    const cx = (A.x0 + A.x1) / 2, cy = (A.y0 + A.y1) / 2, rx = (A.x1 - A.x0) / 2, ry = (A.y1 - A.y0) / 2;
    list.forEach((p, k) => {
      const a = k * 2.39996, r = Math.sqrt((k + 0.5) / list.length), pos = [cx + Math.cos(a) * r * rx * 0.9, cy + Math.sin(a) * r * ry * 0.9];
      const stack = [cx, A.y1 - 60 - k * 22], tk = tStart + k * every, size = p.size ?? 120, tilt = [10 + (k % 3) * 6, -20 + (k % 5) * 10, (k % 2 ? 10 : -12)];
      front.add(S.prop(p), (o, t) => {
        if (t < tk) { o.visible = false; return; }
        MG.place(o, t, front, { at: pos, size, t0: tk, tilt, spin: 0, bob: 5, seed: k });
        if (t < tRes) { o.rotation.z += Math.sin(t * (11 + k % 4) + k) * 0.06; return; }
        const u = clamp((t - tRes - k * 0.03) / 0.5), e = E.inOutCubic(u);
        if (mode === 'stack') { o.position.copy(front.px(pos[0] + (stack[0] - pos[0]) * e, pos[1] + (stack[1] - pos[1]) * e)); o.rotation.set(S.D(80) * e + S.D(tilt[0]) * (1 - e), 0, 0); }
        else if (mode === 'poof') { o.scale.multiplyScalar(Math.max(0.0001, 1 - e)); o.visible = u < 1; }
        else if (mode === 'sweep') { o.position.copy(front.px(pos[0] + e * 1200, pos[1] - Math.sin(u * Math.PI) * 120)); o.visible = u < 1; }
        if (t > sc.t1 + 0.3 && mode !== 'stack') o.visible = false;
        if (mode === 'stack' && t > sc.t1 + 0.6) { const q = clamp((t - sc.t1 - 0.6) / 0.4); o.scale.multiplyScalar(Math.max(0.0001, 1 - q)); o.visible = q < 1; }
      });
      S.sfx(tk, 'pop', 0.25);
      if (mode === 'poof' && k % 3 === 0) S.burst(pos[0], pos[1], tRes + k * 0.03 + 0.2, { r: 70, color: S.P.ink, n: 8, w: 5, sound: 'pop' });
    });
    if (mode === 'stack') S.sfx(tRes + 0.5, 'ding', 0.5);
    if (sc.dread !== false) S.dread({ x0: A.x0, x1: A.x1, y0: A.y0 + 30, y1: A.y1 }, sc.dreadAt != null ? S.at(id, sc.dreadAt) : tStart + list.length * every * 0.6, sc.qAt != null ? S.at(last, sc.qAt) : null, tRes - 0.2, { lines: 6 });
    S.host.look(tStart + 0.2, 16).look(tStart + 1.4, 0);
  },
};
