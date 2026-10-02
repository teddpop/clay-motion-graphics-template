// A spoken idea as kinetic type, optionally with a clay prop doing something beside it.
export default {
  name: 'statement',
  about: 'Hooks, claims, turns, a single truth. Big type in the left column; optional prop on the right (float, drop, pile, spin).',
  params: {
    caption: 'text (\\n for line breaks)', hi: 'highlight word(s)', slot: 'hook | main | big (default hook for the first scene, else main)',
    big: 'optional huge kicker text (e.g. "6:00 PM.") built letter by letter at bigAt; the caption then sits under it, word-synced',
    bigAt: 'cue', captions: '[{ line, text, hi, slot, at }] for multi-line statements',
    prop: '{ prop, opts, at:[x,y], size, motion: float|drop|pile|spin, count, every, keep }', pose: 'bubble gesture', look: '[[cue, deg]]', bg: 'background key',
  },
  build(S, sc) {
    S.product?.away(sc.t0);
    const id = sc.lines[0], Lr = S.line(id);
    const t = sc.isFirst ? 0.15 : Lr.start - 0.05;
    if (sc.bg) S.bg(sc.t0, sc.bg, sc.bgFrom || [960, 540]);
    if (sc.big) S.caption(sc.big, S.at(id, sc.bigAt ?? 0.1, -0.1), { slot: 'big', letters: true, hi: sc.bigHi });
    if (sc.caption) S.caption(sc.caption, t, sc.big ? { slot: 'sub', hi: sc.hi, sync: sc.subSync === false ? undefined : id } : { slot: sc.slot || (sc.isFirst ? 'hook' : 'main'), hi: sc.hi });
    for (const c of sc.captions || []) S.caption(c.text, c.at != null ? S.at(c.line || id, c.at) : S.line(c.line || id).start - 0.05, { slot: c.slot || 'main', hi: c.hi, sync: c.sync ? c.line || id : undefined });
    for (const l of sc.lines) { const ln = S.line(l); if (sc.pose) S.host.pose(ln.start - 0.1, sc.pose); }
    for (const [w, d, off] of sc.look || []) S.host.look(S.at(id, w, off ?? -0.2), d);
    const p = sc.prop; if (!p) return;
    const [x, y] = p.at || [1440, 560], size = p.size ?? 220, t0 = sc.t0 + (p.delay ?? 0.4), t1 = p.keep ? Infinity : sc.t1 - 0.05;
    const gone = (o, t) => { const u = S.clamp((t - t1) / 0.3); if (u > 0) o.scale.multiplyScalar(Math.max(0.0001, 1 - u)); if (u >= 1) o.visible = false; };
    if (p.motion === 'drop') {
      const every = p.every ?? 1.1, n = Math.ceil((t1 - t0) / every);
      for (let k = 0; k < Math.min(n, 30); k++) {
        const tk = t0 + k * every;
        S.front.add(S.prop(p), (o, t) => {
          const u = (t - tk) / 0.55;
          if (u < 0 || t > t1 || u > 1.6) { o.visible = false; return; }
          o.visible = true;
          const fall = Math.min(1, u), yy = y - 420 * (1 - fall * fall), sq = u > 1 ? Math.max(0, 1 - (u - 1) / 0.6) : 1;
          o.position.copy(S.front.px(x, yy)); o.scale.set(size * S.front.unit * (u > 1 ? 1 + (1 - sq) * 0.8 : 1), size * S.front.unit * (u > 1 ? sq * 0.4 + 0.01 : 1), size * S.front.unit);
          o.rotation.set(0, 0, 0);
        });
        S.sfx(tk + 0.55, 'tick', 0.7);
      }
    } else if (p.motion === 'pile') {
      const n = p.count ?? 6;
      for (let k = 0; k < n; k++) {
        const a = k * 2.39996, r = 40 + Math.sqrt(k) * 70, tk = t0 + k * (p.every ?? 0.16);
        S.front.add(S.prop(p.variants ? { ...p, opts: p.variants[k % p.variants.length] } : p), (o, t) => {
          S.MG.place(o, t, S.front, { at: [x + Math.cos(a) * r, y + Math.sin(a) * r * 0.7], size: size * (0.8 + (k % 3) * 0.1), t0: tk, tilt: [10, -15 + (k % 4) * 10, (k % 2 ? 8 : -8)], spin: 0, bob: 4, seed: k });
          if (t > tk) o.rotation.z += Math.sin(t * 13 + k) * 0.05;    // nervous jitter
          gone(o, t);
        });
        S.sfx(tk, 'pop', 0.35);
      }
    } else {
      S.front.add(S.prop(p), (o, t) => { S.MG.place(o, t, S.front, { at: [x, y], size, t0, tilt: p.tilt || [12, -16, 0], spin: p.motion === 'spin' ? 0.6 : 0, bob: 8 }); gone(o, t); });
      S.sfx(t0, 'pop', 0.4);
    }
  },
};
