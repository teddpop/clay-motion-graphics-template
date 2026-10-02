/* Office / productivity pack (clay): laptop, mug, stickyNote, paperStack, plant, envelope, calendarPad, pencil, clock;
 * container: inboxTray (open tray + 3 slots; open(u) tips the papers' cover sheet back).
 */
import * as THREE from 'three';
import { mat, sph, cap, rbox, cyl, m, wrap, decal, registerProps } from '../clay3d.js';

const D = THREE.MathUtils.degToRad;

const office = {
  laptop(o = {}) { // open laptop, screen faces +z; o.screen(ctx, w, h) draws the display
    const g = new THREE.Group(), al = mat(o.color || '#C9CCD2', { roughness: 0.35, clearcoat: 0.6, bumpScale: 0.05 });
    m(rbox(1.0, 0.05, 0.66, 0.03), al, 0, -0.3, 0.1, g);
    m(rbox(0.86, 0.01, 0.36, 0.01), mat('#3A3B3F', { bumpScale: 0 }), 0, -0.27, 0.0, g);
    m(rbox(0.3, 0.01, 0.16, 0.01), mat('#B5B8BE', { bumpScale: 0 }), 0, -0.27, 0.3, g);
    const lid = new THREE.Group(); lid.position.set(0, -0.28, -0.22); lid.rotation.x = D(-12); g.add(lid);
    m(rbox(1.0, 0.66, 0.04, 0.03), al, 0, 0.33, 0, lid);
    const scr = decal(0.9, 0.56, o.screen || ((c, w, h) => { c.fillStyle = '#20232A'; c.fillRect(0, 0, w, h); c.fillStyle = '#5B8DEF'; c.fillRect(w * 0.06, h * 0.12, w * 0.4, h * 0.1); c.fillStyle = '#3A3F4B'; for (let i = 0; i < 4; i++) c.fillRect(w * 0.06, h * (0.32 + i * 0.13), w * (0.8 - i * 0.12), h * 0.06); }));
    scr.position.set(0, 0.33, 0.022); lid.add(scr);
    return wrap(g, 'laptop');
  },
  mug(o = {}) {
    const g = new THREE.Group(), c = mat(o.color || '#E9724C', { roughness: 0.35, clearcoat: 0.5 });
    m(cyl(0.34, 0.31, 0.7, 40), c, 0, 0, 0, g);
    m(cyl(0.3, 0.3, 0.02, 40), mat('#5A3420', { roughness: 0.2, clearcoat: 1, bumpScale: 0 }), 0, 0.32, 0, g);
    const h = m(new THREE.TorusGeometry(0.17, 0.05, 16, 32), c, 0.36, 0.0, 0, g); h.rotation.z = D(0);
    return wrap(g, 'mug');
  },
  stickyNote(o = {}) { // face +z
    const g = new THREE.Group();
    m(rbox(0.8, 0.8, 0.03, 0.02, 2), mat(o.color || '#FFE066', { roughness: 0.8, bumpScale: 0.2 }), 0, 0, 0, g);
    const t = decal(0.7, 0.7, (c, w, h) => { c.strokeStyle = '#4A4033'; c.lineWidth = w * 0.03; c.lineCap = 'round';
      if (o.text) { c.fillStyle = '#4A4033'; c.font = `700 ${w * 0.15}px Inter, sans-serif`; o.text.split('\n').forEach((ln, i) => c.fillText(ln, w * 0.08, h * (0.25 + i * 0.2))); }
      else for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(w * 0.12, h * (0.3 + i * 0.2)); c.bezierCurveTo(w * 0.35, h * (0.26 + i * 0.2), w * 0.55, h * (0.34 + i * 0.2), w * (0.85 - i * 0.15), h * (0.3 + i * 0.2)); c.stroke(); } });
    t.position.z = 0.017; g.add(t);
    return wrap(g, 'stickyNote');
  },
  paperStack() {
    const g = new THREE.Group();
    for (let i = 0; i < 6; i++) { const p = m(rbox(0.8, 0.035, 1.0, 0.01, 2), mat(i % 2 ? '#FFFFFF' : '#F3F0EA', { roughness: 0.8, bumpScale: 0.1 }), Math.sin(i * 2.1) * 0.03, -0.25 + i * 0.05, Math.cos(i * 1.3) * 0.03, g); p.rotation.y = Math.sin(i * 3.1) * 0.06; }
    const clip = m(new THREE.TorusGeometry(0.06, 0.012, 8, 20), mat('#B9BEC6', { roughness: 0.3, clearcoat: 0.8, bumpScale: 0 }), -0.2, 0.06, 0.5, g); clip.rotation.y = Math.PI / 2;
    g.rotation.x = D(12);
    return wrap(g, 'paperStack');
  },
  plant() {
    const g = new THREE.Group();
    m(cyl(0.3, 0.22, 0.42, 32), mat('#E9724C'), 0, -0.3, 0, g);
    m(cyl(0.32, 0.32, 0.07, 32), mat('#D9623D'), 0, -0.09, 0, g);
    const leaf = mat('#4FA046', { roughness: 0.5 });
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2; const l = m(sph(0.2, 24), leaf, Math.cos(a) * 0.15, 0.18 + (i % 2) * 0.12, Math.sin(a) * 0.15, g); l.scale.set(0.5, 1.2, 0.18); l.rotation.set(Math.sin(a) * 0.5, -a, Math.cos(a) * 0.5); }
    m(sph(0.16, 24), mat('#3B8A3A'), 0, 0.42, 0, g).scale.set(0.5, 1.2, 0.2);
    return wrap(g, 'plant');
  },
  envelope(o = {}) { // face +z
    const g = new THREE.Group(), p = mat(o.color || '#FFFFFF', { roughness: 0.7, bumpScale: 0.1 });
    m(rbox(1.0, 0.64, 0.05, 0.03), p, 0, 0, 0, g);
    const f = new THREE.Shape(); f.moveTo(-0.5, 0.32); f.lineTo(0.5, 0.32); f.lineTo(0, -0.04); f.lineTo(-0.5, 0.32);
    m(new THREE.ExtrudeGeometry(f, { depth: 0.02, bevelEnabled: false }), mat(o.flap || '#E9E4DA', { roughness: 0.7, bumpScale: 0.1 }), 0, 0, 0.025, g);
    if (o.badge !== false) { m(sph(0.1, 20), mat(o.badgeColor || '#E8432F', { roughness: 0.3, clearcoat: 0.8, bumpScale: 0 }), 0.42, 0.28, 0.06, g).scale.z = 0.5; }
    return wrap(g, 'envelope');
  },
  calendarPad(o = {}) { // face +z
    const g = new THREE.Group();
    m(rbox(0.8, 0.86, 0.08, 0.06), mat('#FFFFFF', { roughness: 0.6, bumpScale: 0.1 }), 0, -0.05, 0, g);
    m(rbox(0.8, 0.24, 0.1, 0.06), mat(o.color || '#E8432F', { roughness: 0.5 }), 0, 0.3, 0.01, g);
    for (const x of [-0.22, 0.22]) m(cap(0.03, 0.12), mat('#7D8088', { roughness: 0.3, clearcoat: 0.8, bumpScale: 0 }), x, 0.45, 0.02, g);
    const t = decal(0.7, 0.56, (c, w, h) => { c.fillStyle = '#2B2A2C'; c.font = `800 ${h * 0.62}px Inter, sans-serif`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(o.day || '14', w / 2, h * 0.55); });
    t.position.set(0, -0.14, 0.045); g.add(t);
    return wrap(g, 'calendarPad');
  },
  pencil() {
    const g = new THREE.Group();
    m(cyl(0.07, 0.07, 0.8, 6), mat('#F5C142'), 0, 0, 0, g);
    m(new THREE.ConeGeometry(0.07, 0.18, 6), mat('#F1D9B5'), 0, -0.49, 0, g).rotation.x = Math.PI;
    m(new THREE.ConeGeometry(0.025, 0.06, 6), mat('#2B2A2C', { bumpScale: 0 }), 0, -0.56, 0, g).rotation.x = Math.PI;
    m(cyl(0.072, 0.072, 0.08, 12), mat('#B9BEC6', { roughness: 0.3, bumpScale: 0 }), 0, 0.42, 0, g);
    m(cap(0.07, 0.04), mat('#F49AB0'), 0, 0.5, 0, g);
    g.rotation.z = D(-40);
    return wrap(g, 'pencil');
  },
  clock() { // wall clock, face +z; userData.hands for animating
    const g = new THREE.Group();
    const b = m(cyl(0.5, 0.5, 0.12, 48), mat('#FFFFFF', { roughness: 0.4, bumpScale: 0.05 }), 0, 0, 0, g); b.rotation.x = Math.PI / 2;
    m(new THREE.TorusGeometry(0.48, 0.05, 16, 48), mat('#2B2A2C', { roughness: 0.4 }), 0, 0, 0.04, g);
    const ink = mat('#2B2A2C', { bumpScale: 0 });
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; m(rbox(0.03, i % 3 ? 0.05 : 0.09, 0.02, 0.01), ink, Math.sin(a) * 0.38, Math.cos(a) * 0.38, 0.065, g).rotation.z = -a; }
    const hh = new THREE.Group(), mh = new THREE.Group(); hh.position.z = mh.position.z = 0.075; g.add(hh, mh);
    m(rbox(0.05, 0.22, 0.02, 0.02), ink, 0, 0.1, 0, hh); m(rbox(0.035, 0.32, 0.02, 0.015), mat('#E8432F', { bumpScale: 0 }), 0, 0.15, 0.01, mh);
    hh.rotation.z = D(-60); mh.rotation.z = D(30);
    m(sph(0.04, 12), ink, 0, 0, 0.09, g);
    const w = wrap(g, 'clock'); w.userData.hands = { hour: hh, minute: mh }; return w;
  },
  inboxTray(o = {}) { // open desk tray piled with papers; open(u) lifts the top sheet off the pile
    const g = new THREE.Group(), tray = mat(o.color || '#5B8DEF', { roughness: 0.45, clearcoat: 0.3 });
    const W = 1.0, Dp = 0.75, H = 0.34, t = 0.05;
    m(rbox(W, t, Dp, 0.02), tray, 0, -H / 2, 0, g);
    m(rbox(W, H, t, 0.02), tray, 0, 0, -Dp / 2, g);
    m(rbox(t, H, Dp, 0.02), tray, -W / 2, 0, 0, g); m(rbox(t, H, Dp, 0.02), tray, W / 2, 0, 0, g);
    m(rbox(W, H * 0.55, t, 0.02), tray, 0, -H * 0.22, Dp / 2, g);
    for (let i = 0; i < 4; i++) m(rbox(W * 0.8, 0.03, Dp * 0.8, 0.01, 2), mat('#FFFFFF', { roughness: 0.8, bumpScale: 0.1 }), Math.sin(i) * 0.02, -H / 2 + 0.05 + i * 0.035, 0, g);
    const hinge = new THREE.Group(); hinge.position.set(0, -H / 2 + 0.2, -Dp * 0.4); g.add(hinge);
    m(rbox(W * 0.8, 0.03, Dp * 0.8, 0.01, 2), mat('#FFFDF7', { roughness: 0.8, bumpScale: 0.1 }), 0, 0, Dp * 0.4, hinge);
    const w = wrap(g, 'inboxTray');
    w.userData.open = (u) => { hinge.rotation.x = -1.2 * u; };
    w.userData.slots = [{ pos: [-0.25, 0.05, 0.05], size: 0.32 }, { pos: [0.05, 0.08, 0.0], size: 0.36 }, { pos: [0.3, 0.02, 0.05], size: 0.18, spread: 0.12 }];
    return w;
  },
};

registerProps(office);
export { office };
