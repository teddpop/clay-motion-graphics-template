// A container that holds the problem (fridge, wallet, inbox tray…): it opens, gets anime dread, its items float out as named.
// The items stay alive afterwards in S.carry so later scenes can use them (idea → orbit the mascot; device scan → viewfinder).
export default {
  name: 'problem-object',
  about: 'Only when the problem genuinely lives in a physical container with nameable contents. Lines: [moment, items?].',
  params: {
    object: 'container prop (needs userData.open + slots, see clay-props.md)', at: '[x,y] (default [1440,600])', size: 'px (430 tall / 520+ wide)', turn: 'yaw deg (-16)',
    big: 'kicker text (time/date)', bigAt: 'cue', caption: 'text under it (word-synced)', hi: 'highlight',
    openAt: 'cue in the moment line', dreadAt: 'cue', qAt: 'cue for the question marks',
    items: '[{ prop, opts, count, variants, label, named (cue in the items line), slot, size, arSize, tilt, lsize, float:[x,y] }]',
    pose: 'bubble pose on dreadAt (think)', exit: 'slide | stay (default slide out right at the end)',
  },
  build(S, sc) {
    const { THREE, E, clamp, D, front, MG } = S;
    const mId = sc.lines[0], iId = sc.lines[1];
    if (sc.big) S.caption(sc.big, S.at(mId, sc.bigAt ?? 0.1, -0.1), { slot: 'big', letters: true });
    if (sc.caption) S.caption(sc.caption, 0, { slot: sc.big ? 'sub' : 'main', hi: sc.hi, sync: mId });
    S.clear(sc.t1 - 0.1);
    S.host.pose(S.at(mId, sc.dreadAt ?? 0.8, -0.15), sc.pose || 'think');
    if (iId) S.host.pose(S.at(iId, sc.itemsPoseAt ?? 0.5, -0.15), 'point');
    // gaze: toward the object while it's the subject, back to camera for the punchline
    S.host.look(S.at(mId, sc.dreadAt ?? 0.8, -0.25), 18).look(S.at(mId, sc.qAt ?? 2, -0.15), 0);

    const FR = { x: sc.at?.[0] ?? 1440, y: sc.at?.[1] ?? 600, size: sc.size ?? 430 };
    const obj = S.prop(sc.object), ROT = D(sc.turn ?? -16);
    const rest = new THREE.Matrix4().compose(front.px(FR.x, FR.y), new THREE.Quaternion().setFromEuler(new THREE.Euler(0, ROT, 0)), new THREE.Vector3().setScalar(FR.size * front.unit));
    obj.position.copy(front.px(FR.x, FR.y)); obj.rotation.set(0, ROT, 0); obj.scale.setScalar(FR.size * front.unit);
    const RECT = front.rectOf(obj);
    const tDoor = S.at(mId, sc.openAt ?? 1.5, -0.35), tExit = sc.t1 - 0.4, open = obj.userData.open || (() => {});
    front.add(obj, (o, t) => {
      const ex = sc.exit === 'stay' ? 0 : E.inOutCubic(clamp((t - tExit) / 0.55));
      o.position.copy(front.px(FR.x + ex * 760, FR.y)); o.rotation.set(0, ROT, 0); o.scale.setScalar(FR.size * front.unit);
      const u = clamp((t - tDoor) / 0.7), op = u <= 0 ? 0 : (u < 0.15 ? -0.08 * (u / 0.15) : E.outBack((u - 0.15) / 0.85, 1.4));
      open(u > 0 && u < 0.15 ? -0.03 : Math.max(0, op));
      o.visible = sc.exit === 'stay' || t < sc.t1 + 0.2;
    });
    S.sfx(tDoor + 0.1, 'thunk', 0.35);
    S.dread(RECT, S.at(mId, sc.dreadAt ?? 0.8, -0.1), S.at(mId, sc.qAt ?? 2, -0.05), sc.t1 - 0.45);

    // ---- items ----
    const ZF = S.ZF, K = S.K, unz = (x, y) => S.unz(x, y);
    const items = (sc.items || []).map((it, k, a) => ({ ...it, k, n: it.count || 1, size: it.size ?? 150, arSize: it.arSize ?? it.size ?? 150, tilt: it.tilt || [0, 0, 0],
      named: iId ? S.at(iId, it.named ?? 0.5 + k * 0.8) : tDoor + 0.8 + k * 0.6,
      float: it.float || [960 + [0, -20, 10, -10][k % 4], a.length > 1 ? 330 + (k * 470) / (a.length - 1) : 560] }));
    if (iId && items.length) S.host.look(items[0].named - 0.2, 16).look(S.line(iId).words.at(-1).t - 0.1, 0);
    const plan = {};                         // filled by later scenes: orbit { t, center }, fly { t, dest(k,j) }, suck t
    S.carry.items = { list: items, plan, end: sc.t1 };
    const total = items.reduce((a, it) => a + it.n, 0), slots = obj.userData.slots || [];
    let slotN = 0;
    items.forEach((it) => {
      const sl = slots[it.slot ?? it.k] || { pos: [0, 0, 0], size: 0.3 }, lsize = it.lsize ?? sl.size, spread = sl.spread ?? lsize * 1.15;
      const fl = unz(...it.float), size = it.size / K;
      for (let j = 0; j < it.n; j++) {
        const slot = slotN++, c = (it.n - 1) / 2, off = it.n > 1 ? [(j - c) * 62 / K, Math.abs(j - c) * 14 / K] : [0, 0];
        const mk = it.variants ? { prop: it.prop, opts: it.variants[j % it.variants.length] } : it;
        front.add(S.prop(mk), (o, t) => {
          if (t < tDoor + 0.15) { o.visible = false; return; }
          const ws = new THREE.Vector3(sl.pos[0] + (it.n > 1 ? (j - c) * spread : 0), sl.pos[1], sl.pos[2]).applyMatrix4(rest);
          const s0 = lsize * FR.size * front.unit, t0 = it.named - 0.15;
          const tOrb = plan.orbit?.t ?? Infinity, tLeave = plan.orbit ? Infinity : sc.t1 - 0.1;
          if (t < t0) { o.visible = true; o.position.copy(ws); o.scale.setScalar(s0); o.rotation.set(D(it.tilt[0]), ROT + D(it.tilt[1]), D(it.tilt[2])); return; }
          if (t < Math.min(tOrb, tLeave)) {   // fly out along an arc, then hover with a squash settle
            const p = clamp((t - t0) / 0.6), e = E.inOutCubic(p), we = front.px(fl[0] + off[0], fl[1] + off[1], ZF);
            o.visible = true; o.position.lerpVectors(ws, we, e); o.position.y += Math.sin(p * Math.PI) * 90 * front.unit;
            const s1 = size * front.unit, sq = p < 1 ? 1 + Math.sin(p * Math.PI) * 0.12 : 1 - Math.exp(-(t - t0 - 0.6) * 7) * Math.sin((t - t0 - 0.6) * 22) * 0.15, scl = s0 + (s1 - s0) * e;
            o.scale.set(scl / Math.sqrt(sq), scl * sq, scl / Math.sqrt(sq));
            o.rotation.set(D(it.tilt[0]) + Math.sin(p * Math.PI) * 0.8, ROT * (1 - e) + D(it.tilt[1]) + e * Math.PI * 2 + (p >= 1 ? Math.sin(t * 1.1 + it.k) * 0.15 : 0), D(it.tilt[2]));
            return;
          }
          if (t >= tLeave) {   // nobody claimed them: drift off left and shrink
            const p = clamp((t - tLeave) / 0.6), f = [fl[0] + off[0], fl[1] + off[1]];
            o.position.copy(front.px(f[0] - p * 900, f[1] - Math.sin(p * Math.PI) * 80, ZF)); o.scale.setScalar(Math.max(0.0001, size * front.unit * (1 - p))); o.visible = p < 1; return;
          }
          const cen = plan.orbit.center || [1010, 720];
          const orb = (tt) => { const a = (slot / Math.max(5, total)) * Math.PI * 2 + (tt - tOrb) * 1.1; return unz(cen[0] + Math.cos(a) * 340, cen[1] + Math.sin(a) * 90); };
          const tFly = plan.fly?.t ?? Infinity;
          if (t < tFly) {
            const b = E.inOutCubic(clamp((t - tOrb) / 0.7)), q = orb(t), f = [fl[0] + off[0], fl[1] + off[1]];
            o.visible = true; o.position.copy(front.px(f[0] + (q[0] - f[0]) * b, f[1] + (q[1] - f[1]) * b, ZF));
            o.scale.setScalar(size * front.unit); o.rotation.set(0.2, t * 1.4 + slot, 0.1);
            if (plan.orbit.until && t > plan.orbit.until) { const p = clamp((t - plan.orbit.until) / 0.4); o.scale.setScalar(Math.max(0.0001, size * front.unit * (1 - p))); o.visible = p < 1; }
            return;
          }
          const dest = plan.fly.dest ? (() => { const d = plan.fly.dest(it, j); return unz(d[0], d[1]); })() : unz(S.device.center.x + off[0] * K, 450);
          const sz = plan.fly.dest ? it.arSize / K : size * 0.8, suck = (plan.suck ?? tFly + 1.2) + it.k * 0.12 + j * 0.04;
          if (t < suck) { MG.fly(o, t, front, { from: orb(tFly), to: dest, t0: tFly, dur: 0.8, arc: 40, spin: 0, size: sz, tilt: it.tilt, seed: it.k + j, z: ZF }); return; }
          const p = clamp((t - suck) / 0.35), e = p * p, [sx, sy] = unz(S.device.center.x, 450);
          o.position.copy(front.px(dest[0] + (sx - dest[0]) * e, dest[1] + (sy - dest[1]) * e, ZF));
          o.scale.setScalar(Math.max(0.0001, sz * front.unit * (1 - e))); o.rotation.y += 0.3; o.visible = p < 1;
        });
      }
      S.sfx(it.named - 0.1, 'pop', 0.45);
    });
  },
};
