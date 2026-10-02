// Proof as a number: a huge figure counts up (or down) in the left column, with a label; optional props pop as it ticks.
export default {
  name: 'stat',
  about: 'A concrete, honest number that proves the value ("4 meetings a week", "3 hours back"). Lines: 1.',
  params: { value: 'number', from: 'start value (0)', prefix: '', suffix: '', label: 'text under the number', at: 'cue when counting starts', dur: 'count seconds (1.0)',
    caption: 'optional line above', hi: 'highlight', props: '{ prop, opts, count } popping away one per tick (things that disappear) or in (things gained)', mode: 'away | in' },
  build(S, sc) {
    S.product?.away(sc.t0);
    const { MG, front, E } = S, id = sc.lines[0], t = S.at(id, sc.at ?? 0.3), dur = sc.dur ?? 1.0;
    S.clear(S.line(id).start - 0.15);
    // the number needs the stage: the hero device steps out (the end scene brings it back)
    if (S.device.type !== 'none' && sc.device !== 'stay') S.device.to(sc.t0 + 0.05, 'off', { dur: 0.6, ease: 'move' });
    if (sc.caption) S.caption(sc.caption, S.line(id).start - 0.05, { slot: 'kicker', hi: sc.hi });
    const num = document.createElement('div'); num.className = 'statN'; num.style.cssText += `top:${sc.top ?? 190}px;font-size:${sc.size ?? 300}px;color:${S.P.ink}`;
    S.layers.caps.appendChild(num);
    const fmt = (v) => (sc.prefix || '') + Math.round(v).toLocaleString('en-US') + (sc.suffix || '');
    num.textContent = fmt(sc.from ?? 0);
    MG.pop(num, S.line(id).start - 0.1, { from: 0.7, y: 40, sound: 'pop', gain: 0.5 });
    MG.count(num, sc.from ?? 0, sc.value, t, dur, fmt);
    const steps = Math.min(12, Math.abs(sc.value - (sc.from ?? 0)));
    for (let k = 1; k <= steps; k++) S.sfx(t + (k / steps) * dur, 'tick', 0.5);
    S.burst(105 + 200, (sc.top ?? 190) + (sc.size ?? 300) * 0.45, t + dur + 0.05, { r: 200, color: S.P.hi, n: 12, w: 8, sound: 'pop' });
    if (sc.label) { const lab = document.createElement('div'); lab.className = 'cap'; lab.style.cssText = `top:${(sc.top ?? 190) + (sc.size ?? 300) * 0.92}px;font-size:56px;width:820px`; S.layers.caps.appendChild(lab);
      MG.words(lab, sc.label, Array.from({ length: sc.label.split(/\s+/).length }, (_, i) => S.line(id).start + 0.1 + i * 0.08), { hi: sc.labelHi ? [].concat(sc.labelHi) : [] }); MG.out(lab, sc.t1 - 0.1); }
    MG.out(num, sc.t1 - 0.1);
    const P_ = sc.props; if (!P_) return;
    const n = P_.count ?? 4, area = sc.propArea || [1080, 1800, 260, 820];
    for (let k = 0; k < n; k++) {
      const x = area[0] + ((k % 3) + 0.5) * (area[1] - area[0]) / 3, y = area[2] + (Math.floor(k / 3) + 0.5) * (area[3] - area[2]) / Math.ceil(n / 3), tk = t + (k + 1) / n * dur;
      front.add(S.prop(P_), (o, tt) => {
        const away = (sc.mode || 'away') === 'away';
        MG.place(o, tt, front, { at: [x, y], size: P_.size ?? 140, t0: away ? S.line(id).start : tk, tilt: [10, -15 + k * 8, 0], spin: 0, bob: 4, seed: k });
        if (away && tt > tk) { const u = S.clamp((tt - tk) / 0.3); o.scale.multiplyScalar(Math.max(0.0001, 1 - E.outCubic(u))); o.visible = u < 1; }
        if (tt > sc.t1) o.visible = false;
      });
      if ((sc.mode || 'away') === 'away') S.burst(x, y, tk + 0.1, { r: 70, color: S.P.ink, n: 8, w: 5, sound: 'pop' });
    }
  },
};
