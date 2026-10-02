/* Finance pack (clay): coin, coinStack, piggyBank, card, receipt, cash, coffee, appTile, chartBars;
 * container: wallet (flap lid + 3 pocket slots).
 * All face +z, ~1 unit across. Factories take an optional opts object, e.g. card({ color }), appTile({ color, glyph }).
 */
import * as THREE from 'three';
import { mat, sph, cap, rbox, cyl, m, wrap, decal, registerProps } from '../clay3d.js';

const D = THREE.MathUtils.degToRad;
const GOLD = '#F2B935', GOLD_D = '#D9961C';

const finance = {
  coin(o = {}) { // face toward +z
    const g = new THREE.Group();
    const body = m(cyl(0.5, 0.5, 0.12, 48), mat(o.color || GOLD, { roughness: 0.3, clearcoat: 0.8, bumpScale: 0.1 }), 0, 0, 0, g); body.rotation.x = Math.PI / 2;
    const rim = m(new THREE.TorusGeometry(0.42, 0.035, 12, 48), mat(GOLD_D, { roughness: 0.35, clearcoat: 0.7, bumpScale: 0 }), 0, 0, 0.065, g);
    const back = rim.clone(); back.position.z = -0.065; g.add(back);
    const face = decal(0.62, 0.62, (c, w, h) => { c.fillStyle = GOLD_D; c.font = `800 ${w * 0.7}px Inter, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(o.glyph || '$', w / 2, h * 0.54); });
    face.position.z = 0.062; g.add(face);
    return wrap(g, 'coin');
  },
  coinStack() { // four coins lying flat, slightly off-centre, plus one leaning on the front
    const g = new THREE.Group();
    const gold = mat(GOLD, { roughness: 0.3, clearcoat: 0.8, bumpScale: 0.1 }), dark = mat(GOLD_D, { roughness: 0.35, bumpScale: 0 });
    for (let i = 0; i < 4; i++) {
      const c = m(cyl(0.36, 0.36, 0.1, 40), gold, Math.sin(i * 2.3) * 0.03, -0.3 + i * 0.105, Math.cos(i * 1.7) * 0.03, g);
      m(new THREE.TorusGeometry(0.36, 0.018, 8, 40), dark, 0, 0, 0, c).rotation.x = Math.PI / 2;
    }
    const lean = finance.coin(); lean.scale.setScalar(0.62); lean.position.set(0.3, -0.18, 0.32); lean.rotation.set(0, D(-12), D(-14)); g.add(lean);
    return wrap(g, 'coinStack');
  },
  piggyBank(o = {}) { // 3/4 view: snout toward viewer-right and camera
    const g = new THREE.Group(), pk = mat(o.color || '#F49AB0', { roughness: 0.45, clearcoat: 0.4 }), dk = mat('#E07A96');
    const body = m(sph(0.5, 48), pk, 0, 0, 0, g); body.scale.set(1.15, 0.92, 0.92);
    const sn = m(cyl(0.17, 0.19, 0.16, 32), pk, 0.58, -0.02, 0, g); sn.rotation.z = Math.PI / 2;
    for (const z of [-0.06, 0.06]) m(sph(0.032, 12), mat('#B9506E', { bumpScale: 0 }), 0.665, -0.02, z, g);
    for (const z of [-0.2, 0.2]) { const e = m(new THREE.ConeGeometry(0.11, 0.2, 20), dk, 0.3, 0.44, z, g); e.rotation.set(z > 0 ? D(20) : D(-20), 0, D(-25)); }
    for (const z of [-0.17, 0.17]) { m(sph(0.05, 16), mat('#1D1B1A', { roughness: 0.2, clearcoat: 1, bumpScale: 0 }), 0.44, 0.17, z * 1.35, g); }
    for (const [x, z] of [[0.3, 0.25], [0.3, -0.25], [-0.3, 0.25], [-0.3, -0.25]]) m(cyl(0.09, 0.1, 0.22, 20), pk, x, -0.46, z, g);
    m(rbox(0.26, 0.04, 0.05, 0.02), mat('#5B2B3A', { bumpScale: 0 }), -0.02, 0.46, 0, g);   // coin slot
    const tail = m(new THREE.TorusGeometry(0.06, 0.02, 8, 20, Math.PI * 1.6), dk, -0.6, 0.08, 0, g); tail.rotation.y = Math.PI / 2;
    g.rotation.y = D(-35);
    const w = wrap(g, 'piggyBank'); w.userData.slot = new THREE.Vector3(0, 0.5, 0); return w;   // coins drop in here
  },
  card(o = {}) { // credit / membership card, face +z
    const g = new THREE.Group();
    m(rbox(1.0, 0.63, 0.04, 0.06, 4), mat(o.color || '#3B6FE0', { roughness: 0.35, clearcoat: 0.7, bumpScale: 0.05 }), 0, 0, 0, g);
    m(rbox(0.16, 0.12, 0.02, 0.02, 2), mat(GOLD, { roughness: 0.3, clearcoat: 0.8, bumpScale: 0 }), -0.3, 0.06, 0.022, g);
    const lab = decal(0.9, 0.55, (c, w, h) => {
      c.fillStyle = 'rgba(255,255,255,.92)'; c.font = `700 ${h * 0.13}px JetBrains Mono, monospace`; c.fillText(o.number || '•••• 4821', w * 0.05, h * 0.82);
      c.font = `800 ${h * 0.14}px Inter, sans-serif`; c.fillText(o.label || '', w * 0.05, h * 0.2);
    });
    lab.position.z = 0.023; g.add(lab);
    return wrap(g, 'card');
  },
  receipt(o = {}) { // paper slip with zig-zag bottom, face +z
    const g = new THREE.Group(), s = new THREE.Shape(), W = 0.6, H = 1.0;
    s.moveTo(-W / 2, H / 2); s.lineTo(W / 2, H / 2);
    for (let i = 0; i <= 8; i++) s.lineTo(W / 2 - (i * W) / 8, -H / 2 + (i % 2 ? 0.05 : 0));
    s.lineTo(-W / 2, H / 2);
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.02, bevelEnabled: true, bevelSize: 0.01, bevelThickness: 0.01, bevelSegments: 2 }); geo.center();
    m(geo, mat('#FFFDF7', { roughness: 0.75, bumpScale: 0.15 }), 0, 0, 0, g);
    const lab = decal(0.5, 0.86, (c, w, h) => {
      c.fillStyle = '#2B2A2C'; c.font = `800 ${w * 0.11}px Inter, sans-serif`; c.textAlign = 'center'; c.fillText(o.title || 'RECEIPT', w / 2, h * 0.12);
      c.fillStyle = '#B7B0A6'; for (let i = 0; i < 5; i++) { c.fillRect(w * 0.08, h * (0.24 + i * 0.1), w * (0.5 - (i % 2) * 0.12), h * 0.035); c.fillRect(w * 0.74, h * (0.24 + i * 0.1), w * 0.18, h * 0.035); }
      c.fillStyle = '#2B2A2C'; c.fillRect(w * 0.08, h * 0.76, w * 0.84, h * 0.012);
      c.font = `800 ${w * 0.1}px JetBrains Mono, monospace`; c.textAlign = 'left'; c.fillText('TOTAL', w * 0.08, h * 0.88); c.textAlign = 'right'; c.fillText(o.total || '$4.85', w * 0.92, h * 0.88);
    });
    lab.position.z = 0.025; g.add(lab);
    return wrap(g, 'receipt');
  },
  cash() { // banded bill stack, face +z
    const g = new THREE.Group();
    for (let i = 0; i < 3; i++) m(rbox(1.0, 0.5, 0.05, 0.02, 2), mat(i === 2 ? '#86CC94' : '#6DB37C', { roughness: 0.7, bumpScale: 0.2 }), Math.sin(i) * 0.02, i * 0.012, -0.1 + i * 0.05, g);
    const lab = decal(0.94, 0.44, (c, w, h) => {
      c.strokeStyle = '#3F7E50'; c.lineWidth = h * 0.04; c.strokeRect(w * 0.04, h * 0.08, w * 0.92, h * 0.84);
      c.beginPath(); c.arc(w / 2, h / 2, h * 0.3, 0, Math.PI * 2); c.stroke();
      c.fillStyle = '#3F7E50'; c.font = `800 ${h * 0.42}px Inter, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('$', w / 2, h * 0.54);
    });
    lab.position.set(0, 0.024, 0.027); g.add(lab);
    m(rbox(0.16, 0.54, 0.2, 0.02, 2), mat('#F3EBD3', { bumpScale: 0.1 }), -0.25, 0.012, -0.05, g);
    return wrap(g, 'cash');
  },
  coffee(o = {}) { // takeaway cup, upright
    const g = new THREE.Group();
    m(cyl(0.3, 0.22, 0.85, 40), mat('#FBF8F2', { roughness: 0.5 }), 0, -0.05, 0, g);
    m(cyl(0.29, 0.25, 0.3, 40), mat(o.sleeve || '#B07A4E', { roughness: 0.8, bumpScale: 0.5 }), 0, -0.05, 0, g);
    m(cyl(0.33, 0.33, 0.07, 40), mat('#2B2A2C', { roughness: 0.4, bumpScale: 0 }), 0, 0.39, 0, g);
    m(cyl(0.26, 0.31, 0.08, 40), mat('#3A3836', { roughness: 0.4, bumpScale: 0 }), 0, 0.46, 0, g);
    m(cyl(0.035, 0.035, 0.04, 12), mat('#1D1B1A', { bumpScale: 0 }), 0.12, 0.51, 0.08, g);
    return wrap(g, 'coffee');
  },
  appTile(o = {}) { // a rounded app icon (streaming / subscription), face +z
    const g = new THREE.Group();
    m(rbox(0.8, 0.8, 0.18, 0.18, 6), mat(o.color || '#E8432F', { roughness: 0.35, clearcoat: 0.6, bumpScale: 0.05 }), 0, 0, 0, g);
    const glyph = o.glyph || 'play', gm = mat(o.ink || '#FFFFFF', { roughness: 0.4, bumpScale: 0 });
    if (glyph === 'play') { const tri = new THREE.Shape(); tri.moveTo(-0.12, 0.17); tri.lineTo(0.2, 0); tri.lineTo(-0.12, -0.17); tri.lineTo(-0.12, 0.17);
      const geo = new THREE.ExtrudeGeometry(tri, { depth: 0.04, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.02, bevelSegments: 3 }); m(geo, gm, 0, 0, 0.09, g); }
    else if (glyph === 'note') { m(sph(0.09, 20), gm, -0.08, -0.12, 0.1, g).scale.z = 0.5; m(rbox(0.04, 0.32, 0.04, 0.015), gm, 0.0, 0.03, 0.1, g); m(rbox(0.16, 0.06, 0.04, 0.02), gm, 0.07, 0.17, 0.1, g); }
    else { const t = decal(0.6, 0.6, (c, w, h) => { c.fillStyle = o.ink || '#FFFFFF'; c.font = `900 ${w * 0.55}px Inter, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(glyph, w / 2, h * 0.55); }); t.position.z = 0.1; g.add(t); }
    return wrap(g, 'appTile');
  },
  chartBars(o = {}) { // three rising bars on a base, slight 3/4 turn
    const g = new THREE.Group(), cs = o.colors || ['#9BD3AE', '#5DB37A', '#2F8F55'];
    m(rbox(1.0, 0.08, 0.4, 0.03), mat('#FFFFFF', { bumpScale: 0.1 }), 0, -0.46, 0, g);
    [0.35, 0.6, 0.9].forEach((h, i) => m(rbox(0.24, h, 0.24, 0.06), mat(cs[i]), -0.3 + i * 0.3, -0.42 + h / 2, 0, g));
    g.rotation.y = D(-18);
    return wrap(g, 'chartBars');
  },
  wallet(o = {}) { // open-top leather wallet; flap hinged at the back-top edge folds over the front (open(u) lifts it)
    const g = new THREE.Group(), leather = mat(o.color || '#8B5A3C', { roughness: 0.6, bumpScale: 0.5 }), dark = mat('#6E432B', { roughness: 0.6, bumpScale: 0.4 });
    const W = 1.0, H = 0.66, Dp = 0.3, t = 0.06;
    m(rbox(W, H, t, 0.03), leather, 0, 0, -Dp / 2, g);                  // back
    m(rbox(W, H * 0.82, t, 0.03), leather, 0, -H * 0.09, Dp / 2, g);   // front (a bit lower so items peek out)
    m(rbox(t, H, Dp, 0.03), dark, -W / 2, 0, 0, g); m(rbox(t, H, Dp, 0.03), dark, W / 2, 0, 0, g);
    m(rbox(W, t, Dp, 0.03), dark, 0, -H / 2, 0, g);
    m(new THREE.PlaneGeometry(W - t, H - t), mat('#4A2C1C', { bumpScale: 0 }), 0, 0, -Dp / 2 + t / 2 + 0.002, g);
    const stitch = decal(W * 0.94, H * 0.74, (c, w, h) => { c.strokeStyle = '#E8C9A0'; c.lineWidth = 4; c.setLineDash([14, 10]); c.strokeRect(10, 10, w - 20, h - 20); });
    stitch.position.set(0, -H * 0.09, Dp / 2 + t / 2 + 0.003); g.add(stitch);
    const hinge = new THREE.Group(); hinge.position.set(0, H / 2, -Dp / 2); g.add(hinge);
    const flap = m(rbox(W + 0.04, t, Dp + 0.1, 0.03), leather, 0, 0.02, Dp / 2 + 0.03, hinge);
    const lip = m(rbox(W + 0.04, 0.22, t, 0.03), leather, 0, -0.09, Dp + 0.08, hinge);
    m(sph(0.05, 16), mat(GOLD, { roughness: 0.3, clearcoat: 0.9, bumpScale: 0 }), 0, -0.14, Dp + 0.12, hinge).scale.z = 0.5;
    const w = wrap(g, 'wallet');
    w.userData.open = (u) => { hinge.rotation.x = -2.1 * u; };
    w.userData.slots = [{ pos: [-0.26, 0.12, -0.02], size: 0.34 }, { pos: [0.02, 0.18, 0.0], size: 0.4 }, { pos: [0.3, 0.1, 0.02], size: 0.2, spread: 0.12 }];
    return w;
  },
};

registerProps(finance);
export { finance };
