// The big-idea reveal: colour wipe from the bubble, the mascot goes full-body, the product arrives (device peeks in,
// or the 3D product rises). The film's one whoosh lives here by default.
export default {
  name: 'idea',
  about: 'Introduce the product with the product. One line, usually "[Product] is/does …" in the brand\'s own words.',
  params: {
    kicker: 'small line above (e.g. "Meet Pantrio")', caption: 'text', hi: 'highlight', bg: 'background (hi)', from: 'wipe origin [x,y] (the bubble)',
    who: 'cast id (narrator)', pose: 'entry pose (wave)', hold: 'phone | none (default phone when the hero device is a phone)',
    appAt: 'cue when the product appears', screen: 'first device screen', reveal: 'device | product | none (default: device if any, else product)',
    burstAt: 'cue for a sparkle burst', whoosh: 'true (default)',
  },
  build(S, sc) {
    const id = sc.lines[0], Lr = S.line(id), t0 = sc.t0, t1 = sc.t1;
    S.clear(t0 - 0.1);
    S.bg(t0, sc.bg || 'hi', sc.from || [315, 805]);
    if (sc.whoosh !== false) S.sfx(t0, 'whoosh', 0.35);
    const tApp = S.at(id, sc.appAt ?? 1.0, -0.3);
    const reveal = sc.reveal || (S.device.type !== 'none' ? 'device' : S.product ? 'product' : 'none');
    const hold = sc.hold ?? (reveal === 'device' && S.device.type === 'phone' ? 'phone' : 'none');
    const h = S.full(t0, t1 + 0.9, { who: sc.who, at: 'idea', pose: sc.pose || 'wave', seed: 5 });
    if (hold === 'phone') h.pose(tApp - 0.2, 'hold').prop('phone', tApp - 0.05, t1 + 0.9);
    else h.pose(tApp - 0.2, 'present');
    for (const [w, p] of sc.poses || []) h.pose(S.at(id, w, -0.15), p);
    if (reveal === 'device') {
      S.device.to(tApp, 'peek', { dur: 0.75 });
      S.device.show(tApp - 0.4, sc.screen || S.V.device?.first || Object.keys(S.V.screens)[0], { ev: { delay: 0.7 } });
      S.sfx(tApp + 0.1, 'pop', 0.5);
    } else if (reveal === 'product') {
      S.product.to(tApp, { x: 1500, y: 560, size: sc.productSize ?? 340 }, 0.8, 'pop');
      S.burst(1500, 560, tApp + 0.5, { r: 210, color: '#FFFFFF', n: 12, w: 8, sound: 'pop' });
    }
    if (sc.kicker) S.caption(sc.kicker, Lr.start - 0.1, { slot: 'kicker', ink: S.P.kickInk, muted: S.P.kickMuted, until: t1 - 0.1 });
    if (sc.caption) S.caption(sc.caption, Lr.start + 0.15, { slot: 'idea', hi: sc.hi, until: t1 - 0.1 });
    if (sc.burstAt != null) S.burst(560, 470, S.at(id, sc.burstAt, 0.15), { r: 150, color: '#FFFFFF', n: 10, w: 8, sound: 'pop' });
    // problem items (if any) circle the mascot at chest height
    if (S.carry.items) S.carry.items.plan.orbit = { t: t0, center: [1010, 720] };
  },
};
