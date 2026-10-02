// Brand ending: wipe to the brand colour, name + mark, tagline, CTA, the mascot full-body beside the hero
// (device still animating, or the 3D product), props orbit. Lines: any of [brand, tagline, cta] in order.
export default {
  lead: 0.25,
  name: 'end',
  about: 'Always last. Brand name line, then tagline, then CTA (each its own spoken beat). The hero stays alive.',
  params: {
    brand: 'line id (default lines[0])', tagline: 'line id (lines[1])', cta: 'line id (lines[2])', taglineText: 'display text (\\n ok)', hi: 'highlight',
    button: 'CTA button text (product.cta)', url: 'product.url', screen: 'device end screen', hero: 'prop popped onto the screen .slot',
    orbit: '[props] ring around the hero', who: 'cast id', bg: 'background (hi)', confetti: 'true',
  },
  build(S, sc) {
    const { E, front, back, MG, P, V } = S, dev = S.device;
    const [bId, tId, cId] = [sc.brand || sc.lines[0], sc.tagline || sc.lines[1], sc.cta || sc.lines[2]];
    const tHit = S.line(bId).start, tEnd = tHit - 0.1;
    S.clear(tHit - 0.35);
    const heroC = dev.type !== 'none' ? [dev.center.x, dev.center.y] : [1300, 560];
    S.bg(tHit - 0.25, sc.bg || 'hi', heroC, 0.6);
    S.tw(S.layers.logo, tHit - 0.3, 0.3, { opacity: 1 }, { opacity: 0 }, 'linear');
    S.host.hide(tHit - 0.35);
    // lockup
    const lock = document.createElement('div'); lock.className = 'lockup';
    lock.innerHTML = `<div class="word"></div><div class="line"></div>${(sc.button ?? V.product.cta) || V.product.url ? `<div class="free">${(sc.button ?? V.product.cta) ? `<span class="btn">${sc.button ?? V.product.cta}</span>` : ''}${(sc.url ?? V.product.url) ? `<span class="url">${sc.url ?? V.product.url}</span>` : ''}</div>` : ''}`;
    if (dev.type === 'laptop') lock.style.width = '700px';
    S.layers.lock.appendChild(lock);
    MG.show(lock, tHit - 0.05, Infinity);
    const w = lock.querySelector('.word');
    MG.letters(w, V.product.name, S.line(bId).words[0].t - 0.05, { stagger: 0.04, from: 150 });
    w.insertAdjacentHTML('afterbegin', `<svg class="brandmark" viewBox="0 0 48 48">${S.MARK}</svg>`);
    S.tw(w.firstElementChild, tHit, 0.6, { scale: 0, rotate: -30 }, { scale: 1, rotate: 0 }, (p) => E.outBack(p, 2));
    const maxW = dev.type === 'laptop' ? 640 : 930, fs = Math.min(170, Math.floor(170 * maxW / Math.max(maxW, w.scrollWidth))); w.style.fontSize = fs + 'px';
    if (fs < 170) w.querySelector('svg').style.cssText = `width:${fs * 0.88}px;height:${fs * 0.88}px`;
    let tagEnd = tHit + 1.5;
    if (tId) {
      const txt = sc.taglineText || S.lines.find((l) => l.id === tId).say, el = lock.querySelector('.line');
      if (dev.type === 'laptop') el.style.fontSize = '60px';
      MG.words(el, txt, MG.cues(tId, txt), { hi: sc.hi == null ? [] : [].concat(sc.hi) });
      tagEnd = S.line(tId).words.at(-1).t;
    }
    const cW = cId ? S.line(cId).words : null, fr = lock.querySelector('.free');
    if (fr) S.soft(fr, cW ? cW[0].t - 0.1 : tagEnd + 0.4, { from: 0.8, y: 30, sound: 'chime', gain: 0.9 });
    if (sc.confetti !== false) S.confetti((cW ? cW.at(-1).t : tagEnd) + 0.1, { n: 46, x: 520, y: 760, spread: 800, leaf: true, colors: ['#FFFFFF', P.ink, P.accent, '#FFE066'], seed: 5 });
    // the hero stays alive
    if (dev.type !== 'none') {
      if (sc.screen) { dev.show(tEnd, sc.screen); if (S.carry.lastScreen) S.tap(dev.el(S.carry.lastScreen).querySelector('.cta'), tEnd - 0.15); }
      dev.to(tEnd, 'end', { dur: 0.8, ease: 'move' });
      const slot = sc.screen && dev.el(sc.screen).querySelector('.slot, .hero');
      if (sc.hero && slot) {
        const r = slot.getBoundingClientRect(), [hx, hy] = dev.map('end', r.left + r.width / 2, r.top + r.height / 2);
        const hs = typeof sc.hero === 'string' ? { prop: sc.hero } : sc.hero;
        front.add(S.prop(hs), (o, t) => MG.place(o, t, front, { at: [hx, hy], size: hs.size ?? 150, t0: tHit + 0.45, tilt: hs.tilt || [24, 0, 0], spin: hs.spin ?? 0.35, bob: 3 }));
        S.burst(hx, hy, tHit + 0.6, { r: 120, color: P.hi, n: 10, w: 7, sound: 'pop' });
      }
      if (sc.screen && tId) S.tap(dev.el(sc.screen).querySelector('.cta'), tagEnd + 0.1);
    } else if (S.product) S.product.to(tEnd, { x: 1290, y: 600, size: sc.productSize ?? 330 }, 0.8);
    const h = S.full(tEnd, Infinity, { who: sc.who, at: dev.type === 'laptop' ? { left: 1530, top: 210, w: 390, h: 860 } : 'end', pose: 'present', seed: 12, turn: -14, delay: 0.2 });
    if (tId) h.look(S.line(tId).words[0].t - 0.2, 0).wave(S.line(tId).words[0].t - 0.1, cW ? cW[0].t - 0.15 : tagEnd + 0.4);
    if (cW) h.pose(cW[0].t - 0.1, 'thumbs').look(cW.at(-1).t + 0.4, -8);
    const orb = sc.orbit || [];
    const oc = dev.type === 'laptop' ? [1360, 600] : [1470, 600], orx = dev.type === 'laptop' ? 560 : 470;
    orb.forEach((n, k, a) => {
      const ss = typeof n === 'string' ? { prop: n } : n, phase = (k / a.length) * Math.PI * 2;
      const spec = { center: oc, rx: orx, ry: 95, speed: 0.16, phase, size: ss.size ?? 95, t0: tHit + 0.4 + k * 0.06, z: 4 };
      for (const [st, f] of [[back, false], [front, true]]) st.add(S.prop(ss), (o, t) => { MG.orbit(o, t, st, spec); o.visible = o.visible && (Math.sin(phase + t * spec.speed * Math.PI * 2) > 0) === f; });
    });
  },
};
