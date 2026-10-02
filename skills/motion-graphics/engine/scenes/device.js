// The product doing its job on the hero device (phone or laptop). One step per VO line: a screen + a caption +
// a prop interaction. Steps chain inside one continuous shot.
export default {
  lead: 0.75,
  name: 'device',
  about: 'Show the product working. 1–4 steps; each step = { line, screen, caption, interaction }. Works for phone and laptop.',
  params: {
    steps: '[{ line, screen, caption, hi, interaction, at, screenAt, drop, lead, bg, prop, props, size, heroAt, tilt, spin, satellites, satMode, puffs, sfx, badgeAt, dingAt, moveAt, toastAt, clearAt, suckAt, to, pose, poses, look }]',
    bg: 'background for the device act (paper); false = keep', state: 'device position (center)',
    interactions: 'scan-items | pop-out | side-prop | row-props | suck-in | orbit | send | none',
  },
  build(S, sc) {
    S.product?.away(sc.t0);
    const { E, clamp, front, back, MG, D } = S, dev = S.device, PH = dev.center;
    const tIn = sc.t0;
    if (dev.stateAt(tIn) !== (sc.state || 'center')) dev.to(tIn + 0.1, sc.state || 'center', { dur: 0.9 });
    if (sc.bg !== false) S.bg(tIn - 0.05, sc.bg || 'paper', [PH.x, PH.y]);
    const steps = sc.steps.map((st, i) => ({ ...st, i, L: S.line(st.line) }));
    const MUSIC = window.MUSIC || {};
    steps.forEach((st, i) => {
      if (i === 0) st.S = tIn + 0.25;
      else if (st.drop && MUSIC.drop != null) st.S = MUSIC.drop - 0.15;
      else if (st.screenAt != null) st.S = S.at(st.line, st.screenAt, -0.15);
      else st.S = st.L.start - (st.lead ?? 0.3);
      st.reveal = st.S + 0.15;
    });
    steps.forEach((st, i) => { st.next = i + 1 < steps.length ? steps[i + 1].S : sc.t1 + 0.15; });
    const scan = steps.find((s) => s.interaction === 'scan-items');
    const tShot = scan ? S.at(scan.line, scan.at ?? 0.4, 0.1) : null;
    const tSuck = scan ? (scan.suckAt ? S.at(scan.suckAt[0], scan.suckAt[1]) : (steps[scan.i + 1]?.L.start ?? scan.next) + 0.3) : null;
    let prevBg = sc.bg || 'paper';
    const PAN = dev.type === 'laptop' ? [560, 860] : [780, 830];

    const INTERACT = {
      'scan-items'(st) {
        const C = S.carry.items, vf = dev.rect(st.screen, '.vf');
        if (!C || !vf) return;
        const vfc = [vf.left + vf.width / 2, vf.top + vf.height / 2];
        const AR = { 1: [[0, 0]], 2: [[-80, -70], [70, 70]], 3: [[-85, -104], [75, -79], [0, 116]], 4: [[-90, -110], [80, -95], [-75, 95], [85, 110]] };
        C.list.forEach((it) => { const o = (AR[C.list.length] || AR[4])[it.k % 4]; it.ar = it.arAt || [vfc[0] + o[0], vfc[1] + o[1]]; });
        C.plan.fly = { t: tIn + 0.1, dest: (it, j) => { const c = (it.n - 1) / 2; return [it.ar[0] + (it.n > 1 ? (j - c) * 62 : 0), it.ar[1] + (it.n > 1 ? Math.abs(j - c) * 14 : 0)]; } };
        C.plan.suck = tSuck;
        C.list.forEach((it, k) => { if (it.label) S.chip(it.label, it.ar[0] + 15, it.ar[1] + Math.max(it.arSize * 0.55, 88), tShot + 0.2 + k * 0.15, tSuck - 0.1); });
        S.tap(dev.el(st.screen).querySelector('.cta'), tSuck - 0.25);
      },
      'pop-out'(st) {
        const r = dev.rect(st.screen, '.hero') || { left: PH.x - 211, width: 422, top: 104, height: 370 };
        const hx = st.heroAt?.[0] ?? r.left + r.width / 2, hy = st.heroAt?.[1] ?? Math.min(r.top + r.height / 2, 600), size = st.size ?? 260, tilt = st.tilt || [26, 0, 0];
        front.add(S.prop(st.prop), (o, t) => {
          if (t < st.reveal) { o.visible = false; return; }
          const exit = clamp((t - (st.next + 0.1)) / 0.6), p = clamp((t - st.reveal) / 0.6), s = E.outBack(p, 2.2);
          o.position.copy(front.px(hx + exit * -470, hy + 11 - s * 20 + exit * 420 + Math.sin(t * 2) * 6, 1.5 * s));
          o.scale.setScalar(Math.max(0.0001, size * s * (1 - exit * 0.2) * front.unit));
          o.rotation.set(D(tilt[0]), D(tilt[1]) + t * (st.spin ?? 0.5), D(tilt[2])); o.visible = exit < 1;
        });
        S.burst(hx, hy + 1, st.reveal + 0.15, { r: 190, color: S.P.hi, n: 12, w: 8, sound: 'pop' });
      },
      'side-prop'(st) {
        const pos = st.pos || PAN, size = st.size ?? 330, t0 = st.S + 0.1;
        front.add(S.prop(st.prop), (o, t) => {
          if (t < t0 - 0.05) { o.visible = false; return; }
          const out = clamp((t - (st.next - 0.05)) / 0.5);
          MG.place(o, t, front, { at: [pos[0] - E.inOutCubic(out) * 1500, pos[1]], size, t0, tilt: st.tilt || [30, 25, 0], spin: 0, bob: st.motion === 'bob' ? 6 : 0 });
          if (out >= 1) { o.visible = false; return; }
          if (st.motion === 'stir' || st.motion == null) { o.rotation.z += Math.sin(t * 9) * 0.03; const toss = (t - t0) % 1.3; if (toss < 0.25) o.rotation.z += -Math.sin((toss / 0.25) * Math.PI) * 0.18; }
        });
        const sats = st.satellites || [], mode = st.satMode || 'toss', per = st.dropEvery ?? 0.55;
        sats.forEach((s, k) => {
          const ss = typeof s === 'string' ? { prop: s } : s, sz = ss.size ?? 50, dx = ss.dx ?? [-40, 30, 70, -80][k % 4];
          front.add(S.prop(ss), (o, t) => {
            if (t < t0 + 0.3 || t > st.next - 0.05) { o.visible = false; return; }
            o.visible = true;
            if (mode === 'drop') {
              const ph = t - (t0 + 0.3) - k * per; if (ph < 0) { o.visible = false; return; }
              const u = (ph % (per * sats.length)) / (per * 1.1); if (u > 1) { o.visible = false; return; }
              const top = pos[1] - size * (st.slotY ?? 0.45);
              o.position.copy(front.px(pos[0] + (ss.dx ?? 0), top - 260 * (1 - E.inOutCubic(Math.min(1, u * 1.25))), 1));
              o.scale.setScalar(Math.max(0.0001, sz * (u > 0.8 ? (1 - u) / 0.2 : 1)) * front.unit); o.rotation.set(0, t * 4 + k, 0);
            } else {
              const u = ((t - t0 - 0.3 + k * 0.15) % 1.3) / 1.3, hh = Math.sin(Math.min(1, u * 1.6) * Math.PI) * 170;
              o.position.copy(front.px(pos[0] + dx, pos[1] - 50 - hh, 1)); o.scale.setScalar(sz * front.unit); o.rotation.set(t * 3 + k, t * 2, 0);
            }
          });
        });
        if (mode === 'drop' && sats.length) for (let t = t0 + 0.3 + per * 0.88; t < st.next - 0.1; t += per) S.sfx(t, 'tick', 0.7);
        if (st.puffs) for (let k = 0; k < 5; k++) front.add(MG.props.steam(), (o, t) => {
          const p0 = t0 + 0.4 + k * 0.45, u = ((t - p0) % 2.2) / 1.4;
          if (t < p0 || t > st.next || u > 1) { o.visible = false; return; }
          o.visible = true; o.position.copy(front.px(pos[0] - 60 + k * 30 + Math.sin(u * 5 + k) * 18, pos[1] - 90 - u * 300, 0.5));
          o.scale.setScalar((55 + u * 80) * front.unit); o.userData.mat.opacity = 0.8 * (1 - u);
        });
        if (st.sfx) { S.sfx(t0 + 0.25, st.sfx, 0.9); if (st.next - t0 > 2.6) S.sfx(t0 + 2.2, st.sfx, 0.7); }
      },
      'row-props'(st) {
        const rows = [...dev.el(st.screen).querySelectorAll('.wk, .kc, .dtr')], until = st.next - 0.2, xr = dev.rest.left + dev.rest.w + 72;
        (st.props || []).slice(0, rows.length).forEach((s, k) => {
          const r = rows[k].getBoundingClientRect(), y = r.top + r.height / 2, ss = typeof s === 'string' ? { prop: s } : s, t0 = st.L.start + 0.25 + k * 0.14;
          front.add(S.prop(ss), (o, t) => { if (t > until) { o.visible = false; return; } MG.fly(o, t, front, { from: [1900, y - 200], to: [xr, y], t0, dur: 0.5, arc: 80, spin: 1, size: ss.size ?? 64, tilt: ss.tilt || [20, 0, 0], seed: k }); });
          S.sfx(t0 + 0.45, 'pop', 0.3);
        });
      },
      'suck-in'(st) {
        (st.props || []).forEach((s, k) => {
          const ss = typeof s === 'string' ? { prop: s } : s, t0 = st.S + 0.2 + k * 0.08, t1 = S.at(st.line, st.at ?? 0.9) + k * 0.12;
          const from = ss.from || [dev.rest.left - 260 - (k % 2) * 60, 260 + k * 170];
          front.add(S.prop(ss), (o, t) => {
            if (t < t1) { MG.place(o, t, front, { at: from, size: ss.size ?? 110, t0, tilt: ss.tilt || [15, -15, 0], spin: 0.3, seed: k }); return; }
            const p = clamp((t - t1) / 0.4), e = p * p;
            o.position.copy(front.px(from[0] + (PH.x - from[0]) * e, from[1] + (PH.y - 90 - from[1]) * e, 0));
            o.scale.setScalar(Math.max(0.0001, (ss.size ?? 110) * (1 - e) * front.unit)); o.rotation.y += 0.4; o.visible = p < 1;
          });
          S.sfx(t1 + 0.3, 'tick', 0.6);
        });
      },
      // props shoot out of the screen to a target (a teammate's bubble, off-screen…): sharing, sending, publishing
      send(st) {
        const to = st.to || [1900, 200], t0 = S.at(st.line, st.at ?? 0.6);
        (st.props || ['envelope']).forEach((s, k) => {
          const ss = typeof s === 'string' ? { prop: s } : s, tk = t0 + k * 0.22, tgt = Array.isArray(to[0]) ? to[k % to.length] : to;
          front.add(S.prop(ss), (o, t) => {
            if (t < tk) { o.visible = false; return; }
            const p = clamp((t - tk) / 0.75), e = E.inOutCubic(p);
            o.visible = p < 1;
            o.position.copy(front.px(PH.x + (tgt[0] - PH.x) * e, PH.y - 60 + (tgt[1] - PH.y + 60) * e - Math.sin(p * Math.PI) * 220, 2 * Math.sin(p * Math.PI)));
            o.scale.setScalar(Math.max(0.0001, (ss.size ?? 110) * Math.sin(Math.min(1, p * 4) * Math.PI / 2) * (1 - Math.max(0, p - 0.85) / 0.15) * front.unit));
            o.rotation.set(0.2, -0.4 + p * 0.8, Math.sin(p * Math.PI) * 0.4);
          });
          S.sfx(tk, 'pop', 0.4); S.sfx(tk + 0.72, 'tick', 0.6);
        });
      },
      orbit(st) {
        (st.props || []).forEach((s, k, a) => {
          const ss = typeof s === 'string' ? { prop: s } : s, phase = (k / a.length) * Math.PI * 2;
          const spec = { center: [PH.x, PH.y + 20], rx: dev.rest.w * 0.75, ry: 80, speed: 0.22, phase, size: ss.size ?? 90, t0: st.S + 0.2 + k * 0.06, z: 4 };
          for (const [stg, fr] of [[back, false], [front, true]]) stg.add(S.prop(ss), (o, t) => {
            if (t > st.next) { o.visible = false; return; }
            MG.orbit(o, t, stg, spec); o.visible = o.visible && (Math.sin(phase + t * spec.speed * Math.PI * 2) > 0) === fr;
          });
        });
      },
      none() {},
    };

    const POSES = ['point', 'open', 'talk', 'present'];
    steps.forEach((st, i) => {
      const prev = steps[i - 1];
      const bg = st.bg || (i === 0 ? prevBg : prevBg);
      if (i > 0 && bg !== prevBg) S.bg(st.S, bg, [PH.x, PH.y]);
      prevBg = bg;
      const ev = { shot: st.interaction === 'scan-items' ? tShot : null, badge: st.badgeAt != null ? S.at(st.line, st.badgeAt, -0.05) : null,
        move: st.moveAt != null ? S.at(st.line, st.moveAt) : null, toast: st.toastAt != null ? S.at(st.line, st.toastAt) : null, clear: st.clearAt != null ? S.at(st.line, st.clearAt) : null };
      if (!prev || prev.screen !== st.screen) {
        dev.show(st.S, st.screen, { ev, fade: i === 0 });
        if (prev && prev.interaction !== 'scan-items') S.tap(dev.el(prev.screen).querySelector('.cta'), st.S - 0.15);
      }
      st.c0 = i === 0 ? st.L.start - 0.35 : st.L.start - 0.05;
      if (st.caption) S.caption(st.caption, st.c0, { slot: 'main', hi: st.hi });
      if (st.poses) for (const [w, p] of st.poses) S.host.pose(S.at(st.line, w, -0.1), p); else S.host.pose(st.L.start - 0.1, st.pose || POSES[i % POSES.length]);
      const looks = st.look || (st.interaction === 'scan-items' ? [[st.at ?? 0.4, 12]] : [[0.6, 10, 0], [1.4, 0, 0]]);
      for (const [w, d, off] of looks) S.host.look(S.at(st.line, w, off ?? -0.2), d);
      if (prev?.interaction === 'scan-items') S.host.look(st.reveal - 0.15 > st.L.start ? st.reveal - 0.15 : st.L.start + 0.6, 0);
      (INTERACT[st.interaction || 'none'] || INTERACT.none)(st);
      if (st.dingAt != null) S.sfx(S.at(st.line, st.dingAt, 0.05), 'ding', 0.5);
    });
    S.carry.lastScreen = steps.at(-1).screen;
  },
};
