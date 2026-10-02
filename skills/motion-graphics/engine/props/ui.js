/* Generic UI-symbol pack (clay): use for any product domain. pin, star, heart, check, bell, bulb, chatBubble,
 * magnifier, lock, gear, sparkle, phone; container: giftBox (lid + 3 slots).
 * Colour every factory with { color } to match the brand palette.
 */
import * as THREE from 'three';
import { mat, sph, cap, rbox, cyl, m, wrap, decal, registerProps } from '../clay3d.js';

const D = THREE.MathUtils.degToRad;
const extrude = (shape, depth = 0.16, bevel = 0.06) => { const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: true, bevelSize: bevel, bevelThickness: bevel, bevelSegments: 5, curveSegments: 24 }); g.center(); return g; };

const ui = {
  pin(o = {}) {
    const g = new THREE.Group(), s = new THREE.Shape();
    s.moveTo(0, -0.5); s.bezierCurveTo(-0.15, -0.2, -0.36, -0.02, -0.36, 0.16); s.absarc(0, 0.16, 0.36, Math.PI, 0, true); s.bezierCurveTo(0.36, -0.02, 0.15, -0.2, 0, -0.5);
    m(extrude(s, 0.2), mat(o.color || '#E8432F', { roughness: 0.35, clearcoat: 0.6 }), 0, 0, 0, g);
    m(cyl(0.13, 0.13, 0.1, 32), mat('#FFFFFF', { bumpScale: 0 }), 0, 0.16, 0.13, g).rotation.x = Math.PI / 2;
    return wrap(g, 'pin');
  },
  star(o = {}) {
    const s = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + Math.PI / 2, r = i % 2 ? 0.22 : 0.5; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    const g = new THREE.Group(); m(extrude(s, 0.14, 0.07), mat(o.color || '#FFC83D', { roughness: 0.3, clearcoat: 0.7 }), 0, 0, 0, g); return wrap(g, 'star');
  },
  heart(o = {}) {
    const s = new THREE.Shape();
    s.moveTo(0, -0.38); s.bezierCurveTo(-0.5, -0.02, -0.46, 0.38, -0.2, 0.38); s.bezierCurveTo(-0.08, 0.38, 0, 0.3, 0, 0.2);
    s.bezierCurveTo(0, 0.3, 0.08, 0.38, 0.2, 0.38); s.bezierCurveTo(0.46, 0.38, 0.5, -0.02, 0, -0.38);
    const g = new THREE.Group(); m(extrude(s, 0.18, 0.08), mat(o.color || '#F05A7E', { roughness: 0.35, clearcoat: 0.6 }), 0, 0, 0, g); return wrap(g, 'heart');
  },
  check(o = {}) { // round badge with a check, face +z
    const g = new THREE.Group();
    const b = m(cyl(0.5, 0.5, 0.16, 48), mat(o.color || '#3E9B5F', { roughness: 0.35, clearcoat: 0.6 }), 0, 0, 0, g); b.rotation.x = Math.PI / 2;
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.22, 0.0, 0), new THREE.Vector3(-0.06, -0.15, 0), new THREE.Vector3(0.24, 0.17, 0)], false, 'catmullrom', 0);
    m(new THREE.TubeGeometry(c, 24, 0.055, 12), mat('#FFFFFF', { bumpScale: 0 }), 0, 0, 0.1, g);
    return wrap(g, 'check');
  },
  bell(o = {}) {
    const g = new THREE.Group(), pts = [];
    for (let i = 0; i <= 16; i++) { const u = i / 16; pts.push(new THREE.Vector2(0.06 + 0.38 * Math.pow(u, 1.6) + (u > 0.9 ? (u - 0.9) * 0.8 : 0), 0.4 - u * 0.75)); }
    m(new THREE.LatheGeometry(pts, 40), mat(o.color || '#FFC83D', { roughness: 0.3, clearcoat: 0.7, side: THREE.DoubleSide }), 0, 0, 0, g);
    m(sph(0.09, 20), mat('#D9961C'), 0, -0.4, 0, g); m(sph(0.07, 16), mat(o.color || '#FFC83D'), 0, 0.44, 0, g);
    g.rotation.z = D(12);
    return wrap(g, 'bell');
  },
  bulb(o = {}) {
    const g = new THREE.Group();
    m(sph(0.36, 40), mat(o.color || '#FFE066', { roughness: 0.2, clearcoat: 1, emissive: '#FFE9A0', emissiveIntensity: 0.25 }), 0, 0.12, 0, g);
    m(cyl(0.16, 0.2, 0.2, 24), mat('#FFE066'), 0, -0.22, 0, g);
    for (let i = 0; i < 3; i++) m(cyl(0.16, 0.16, 0.06, 24), mat('#B9BEC6', { roughness: 0.3, bumpScale: 0 }), 0, -0.34 - i * 0.07, 0, g);
    m(sph(0.08, 16), mat('#7D8088', { bumpScale: 0 }), 0, -0.55, 0, g);
    return wrap(g, 'bulb');
  },
  chatBubble(o = {}) { // speech bubble with three dots, face +z
    const g = new THREE.Group(), s = new THREE.Shape();
    s.moveTo(-0.4, 0.3); s.lineTo(0.4, 0.3); s.quadraticCurveTo(0.5, 0.3, 0.5, 0.2); s.lineTo(0.5, -0.15); s.quadraticCurveTo(0.5, -0.25, 0.4, -0.25);
    s.lineTo(-0.1, -0.25); s.lineTo(-0.3, -0.42); s.lineTo(-0.26, -0.25); s.lineTo(-0.4, -0.25); s.quadraticCurveTo(-0.5, -0.25, -0.5, -0.15); s.lineTo(-0.5, 0.2); s.quadraticCurveTo(-0.5, 0.3, -0.4, 0.3);
    m(extrude(s, 0.14, 0.05), mat(o.color || '#5B8DEF', { roughness: 0.35, clearcoat: 0.6 }), 0, 0, 0, g);
    for (let i = 0; i < 3; i++) m(sph(0.06, 16), mat('#FFFFFF', { bumpScale: 0 }), -0.2 + i * 0.2, 0.05, 0.12, g).scale.z = 0.5;
    return wrap(g, 'chatBubble');
  },
  magnifier(o = {}) {
    const g = new THREE.Group();
    m(new THREE.TorusGeometry(0.3, 0.07, 16, 40), mat(o.color || '#3E4A5C', { roughness: 0.35, clearcoat: 0.5 }), -0.08, 0.1, 0, g);
    m(new THREE.CircleGeometry(0.3, 40), mat('#CFE7F7', { transparent: true, opacity: 0.55, roughness: 0.05, clearcoat: 1, bumpScale: 0 }), -0.08, 0.1, 0, g);
    const h = m(cap(0.07, 0.36), mat(o.color || '#3E4A5C'), 0.24, -0.26, 0, g); h.rotation.z = D(45);
    return wrap(g, 'magnifier');
  },
  lock(o = {}) {
    const g = new THREE.Group();
    m(rbox(0.7, 0.55, 0.3, 0.1), mat(o.color || '#FFC83D', { roughness: 0.35, clearcoat: 0.6 }), 0, -0.15, 0, g);
    m(new THREE.TorusGeometry(0.22, 0.07, 16, 32, Math.PI), mat('#B9BEC6', { roughness: 0.3, clearcoat: 0.8, bumpScale: 0 }), 0, 0.12, 0, g);
    m(cyl(0.06, 0.06, 0.05, 20), mat('#2B2A2C', { bumpScale: 0 }), 0, -0.12, 0.16, g).rotation.x = Math.PI / 2;
    return wrap(g, 'lock');
  },
  gear(o = {}) {
    const s = new THREE.Shape(), n = 8;
    for (let i = 0; i < n * 4; i++) { const a = (i / (n * 4)) * Math.PI * 2, r = (i % 4 < 2) ? 0.5 : 0.38; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    const hole = new THREE.Path(); hole.absarc(0, 0, 0.15, 0, Math.PI * 2, true); s.holes.push(hole);
    const g = new THREE.Group(); m(extrude(s, 0.16, 0.04), mat(o.color || '#7D8088', { roughness: 0.4, clearcoat: 0.5 }), 0, 0, 0, g); return wrap(g, 'gear');
  },
  sparkle(o = {}) { // four-point twinkle
    const s = new THREE.Shape(); for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2 + Math.PI / 2, r = i % 2 ? 0.12 : 0.5; i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    const g = new THREE.Group(); m(extrude(s, 0.08, 0.05), mat(o.color || '#FFFFFF', { roughness: 0.3, clearcoat: 0.8 }), 0, 0, 0, g); return wrap(g, 'sparkle');
  },
  phone(o = {}) { // handheld phone prop, screen +z; o.screen(ctx, w, h) draws it
    const g = new THREE.Group();
    m(rbox(0.5, 0.96, 0.07, 0.09), mat('#1D1B1A', { roughness: 0.3, clearcoat: 0.8, bumpScale: 0 }), 0, 0, 0, g);
    const sc = decal(0.44, 0.88, o.screen || ((c, w, h) => { c.fillStyle = o.color || '#F8F4F1'; c.fillRect(0, 0, w, h); }));
    sc.material = new THREE.MeshBasicMaterial({ map: sc.material.map, toneMapped: false }); sc.position.z = 0.037; g.add(sc);
    return wrap(g, 'phone');
  },
  giftBox(o = {}) { // lid lifts off upward (open(u))
    const g = new THREE.Group(), c = mat(o.color || '#5B8DEF', { roughness: 0.5 }), rib = mat(o.ribbon || '#FFC83D', { roughness: 0.4, clearcoat: 0.5 });
    const W = 1.0, H = 0.62;
    m(rbox(W, H, W * 0.8, 0.05), c, 0, -0.1, 0, g);
    m(rbox(0.14, H + 0.01, W * 0.8 + 0.01, 0.03), rib, 0, -0.1, 0, g);
    const lid = new THREE.Group(); lid.position.set(0, H / 2 - 0.1, -W * 0.4); g.add(lid);
    m(rbox(W + 0.06, 0.14, W * 0.8 + 0.06, 0.05), c, 0, 0.07, W * 0.4, lid);
    m(rbox(0.15, 0.15, W * 0.8 + 0.07, 0.03), rib, 0, 0.07, W * 0.4, lid);
    for (const s of [-1, 1]) { const b = m(new THREE.TorusGeometry(0.12, 0.04, 10, 24), rib, s * 0.12, 0.22, W * 0.4, lid); b.rotation.y = s * D(30); b.scale.set(1.2, 0.8, 1); }
    const w = wrap(g, 'giftBox');
    w.userData.open = (u) => { lid.rotation.x = -1.9 * u; lid.position.y = H / 2 - 0.1 + u * 0.1; };
    w.userData.slots = [{ pos: [-0.25, 0.2, 0.0], size: 0.32 }, { pos: [0.05, 0.25, 0.0], size: 0.36 }, { pos: [0.3, 0.18, 0.05], size: 0.18, spread: 0.12 }];
    return w;
  },
};

registerProps(ui);
export { ui };
