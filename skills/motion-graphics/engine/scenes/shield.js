// Protection made visible: a soft dome forms around the hero (the 3D product, or a prop) and the threats bounce off.
export default {
  name: 'shield',
  about: 'Peace of mind, security, reliability: the bad thing tries and fails. Lines: 1–2.',
  params: {
    target: 'product (default if product.object) | { prop, opts, at, size }', at: '[x,y] (1440,560)', size: 'target px',
    threats: '{ prop, opts, count (8), size (60) }', domeAt: 'cue (dome pops up)', radius: 'dome px (300)', caption: 'text', hi: 'highlight', bg: 'background',
  },
  build(S, sc) {
    const { E, clamp, front, MG, THREE } = S, id = sc.lines[0];
    const [x, y] = sc.at || [1440, 560], size = sc.size ?? 300, R = sc.radius ?? 300;
    if (sc.bg) S.bg(sc.t0, sc.bg, [x, y]);
    if (sc.caption) S.caption(sc.caption, S.line(id).start - 0.05, { slot: 'main', hi: sc.hi });
    if (S.product && (sc.target == null || sc.target === 'product')) S.product.to(sc.t0 + 0.1, { x, y, size }, 0.7);
    else if (sc.target) front.add(S.prop(sc.target), (o, t) => { MG.place(o, t, front, { at: [x, y], size, t0: sc.t0 + 0.2, tilt: sc.target.tilt || [12, -18, 0], spin: 0.2, bob: 4 }); if (t > sc.t1) o.visible = false; });
    const tDome = S.at(id, sc.domeAt ?? 0.5);
    const dome = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 32), new THREE.MeshPhysicalMaterial({ color: S.P.hi, transparent: true, opacity: 0.22, roughness: 0.1, clearcoat: 1, transmission: 0, depthWrite: false }));
    const rim = new THREE.Mesh(new THREE.TorusGeometry(1, 0.02, 12, 64), new THREE.MeshBasicMaterial({ color: S.P.hi }));
    const g = new THREE.Group(); g.add(dome, rim);
    front.add(g, (o, t) => {
      const u = clamp((t - tDome) / 0.5), out = clamp((t - (sc.t1 - 0.3)) / 0.3), s = (u <= 0 ? 0 : E.outBack(u, 1.8)) * (1 - out);
      o.visible = s > 0.001; o.position.copy(front.px(x, y, -1)); o.scale.setScalar(Math.max(0.0001, R * front.unit * s * (1 + Math.sin(t * 3) * 0.01)));
      rim.rotation.set(Math.PI / 2 + 0.3, 0, t * 0.3);
    });
    S.sfx(tDome, 'chime', 0.5);
    const T = sc.threats || { prop: 'waterDrop' }, n = T.count ?? 8;
    for (let k = 0; k < n; k++) {
      const a = -Math.PI / 2 + (k % 2 ? 1 : -1) * (0.35 + (k * 0.61) % 1.1), tk = tDome + 0.35 + k * ((sc.t1 - tDome - 1.2) / n);
      const hit = [x + Math.cos(a) * R, y + Math.sin(a) * R], st = [x + Math.cos(a) * 980, y + Math.sin(a) * 980], out = [hit[0] + Math.cos(a) * 260 + (k % 2 ? 120 : -120), hit[1] + Math.sin(a) * 160];
      front.add(S.prop(T), (o, t) => {
        const u = (t - tk) / 0.45, v = (t - tk - 0.45) / 0.6;
        if (u < 0 || v > 1 || t > sc.t1) { o.visible = false; return; }
        o.visible = true;
        let px, py, sc_ = (T.size ?? 60) * front.unit;
        if (u <= 1) { px = st[0] + (hit[0] - st[0]) * u; py = st[1] + (hit[1] - st[1]) * u; }
        else { const e = E.outCubic(v); px = hit[0] + (out[0] - hit[0]) * e; py = hit[1] + (out[1] - hit[1]) * e + v * v * 260; sc_ *= 1 - v * 0.7; }
        o.position.copy(front.px(px, py, 1)); o.scale.setScalar(Math.max(0.0001, sc_)); o.rotation.set(0, 0, u <= 1 ? 0 : v * 4);
      });
      S.sfx(tk + 0.45, 'tick', 0.7);
      S.burst(hit[0], hit[1], tk + 0.45, { r: 50, color: '#FFFFFF', n: 6, w: 5, sound: 'pop' });
    }
    S.host.pose(S.line(id).start - 0.1, sc.pose || 'open');
  },
};
