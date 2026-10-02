/* Home & everyday-life pack (clay): sensorPuck (smart device), pipe, waterDrop, valve, suitcase, umbrella, sun, moon, cloud,
 * sofa, lamp, key, palm, towel; container: house (roof lifts).
 */
import * as THREE from 'three';
import { mat, sph, cap, rbox, cyl, m, wrap, decal, registerProps } from '../clay3d.js';

const D = THREE.MathUtils.degToRad;
const home = {
  sensorPuck(o = {}) { // small round smart sensor with a glowing status ring, face +z (3/4 top view reads best: tilt [55,0,0])
    const g = new THREE.Group();
    m(cyl(0.5, 0.52, 0.26, 64), mat(o.color || '#FAF8F4', { roughness: 0.35, clearcoat: 0.7, bumpScale: 0.05 }), 0, 0, 0, g);
    m(cyl(0.46, 0.46, 0.04, 64), mat('#EDEAE4', { roughness: 0.4, bumpScale: 0 }), 0, 0.14, 0, g);
    const ring = m(new THREE.TorusGeometry(0.36, 0.035, 12, 64), new THREE.MeshStandardMaterial({ color: o.glow || '#0DFEA9', emissive: o.glow || '#0DFEA9', emissiveIntensity: 0.9, roughness: 0.3 }), 0, 0.165, 0, g);
    ring.rotation.x = Math.PI / 2;
    m(sph(0.06, 20), mat('#2B2A2C', { roughness: 0.2, clearcoat: 1, bumpScale: 0 }), 0, 0.16, 0, g).scale.y = 0.3;
    m(cyl(0.52, 0.5, 0.05, 64), mat('#D9D5CE', { bumpScale: 0 }), 0, -0.15, 0, g);
    const w = wrap(g, 'sensorPuck'); w.userData.ring = ring; return w;
  },
  pipe(o = {}) { // elbow pipe with a joint collar, a drip hangs from the joint
    const g = new THREE.Group(), cu = mat(o.color || '#C9824A', { roughness: 0.3, clearcoat: 0.8, bumpScale: 0.05 });
    m(cyl(0.12, 0.12, 0.7, 32), cu, -0.25, 0.1, 0, g).rotation.z = Math.PI / 2;
    const el = m(new THREE.TorusGeometry(0.22, 0.12, 20, 32, Math.PI / 2), cu, 0.1, -0.12, 0, g); el.rotation.z = 0;
    m(cyl(0.12, 0.12, 0.5, 32), cu, 0.32, -0.42, 0, g);
    m(cyl(0.16, 0.16, 0.12, 32), mat('#A9693A', { roughness: 0.3, clearcoat: 0.8, bumpScale: 0 }), 0.32, -0.25, 0, g);
    m(cyl(0.16, 0.16, 0.12, 32), mat('#A9693A', { roughness: 0.3, clearcoat: 0.8, bumpScale: 0 }), -0.08, 0.1, 0, g).rotation.z = Math.PI / 2;
    return wrap(g, 'pipe');
  },
  waterDrop(o = {}) {
    const g = new THREE.Group(), pts = [];
    for (let i = 0; i <= 20; i++) { const u = i / 20, a = u * Math.PI; pts.push(new THREE.Vector2(Math.sin(a) * 0.38 * Math.pow(u, 0.7) * (u > 0.5 ? 1 : 0.6 + u * 0.8), 0.5 - u * 0.95)); }
    m(new THREE.LatheGeometry(pts, 40), new THREE.MeshPhysicalMaterial({ color: o.color || '#5BC0EB', roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.92 }), 0, 0, 0, g);
    m(sph(0.06, 16), new THREE.MeshBasicMaterial({ color: '#FFFFFF' }), -0.12, -0.1, 0.25, g);
    return wrap(g, 'waterDrop');
  },
  valve(o = {}) { // shut-off valve wheel, face +z; userData.wheel spins
    const g = new THREE.Group(), r = mat(o.color || '#E8432F', { roughness: 0.35, clearcoat: 0.6 });
    const wheel = new THREE.Group(); g.add(wheel);
    m(new THREE.TorusGeometry(0.4, 0.07, 16, 48), r, 0, 0, 0, wheel);
    for (let i = 0; i < 4; i++) { const s = m(cap(0.045, 0.7), r, 0, 0, 0, wheel); s.rotation.z = i * Math.PI / 4 * 2 / 2 + i * Math.PI / 4; }
    m(cyl(0.1, 0.1, 0.12, 24), mat('#B9BEC6', { roughness: 0.3, bumpScale: 0 }), 0, 0, 0, wheel).rotation.x = Math.PI / 2;
    const w = wrap(g, 'valve'); w.userData.wheel = wheel; return w;
  },
  suitcase(o = {}) {
    const g = new THREE.Group(), c = mat(o.color || '#5B8DEF', { roughness: 0.45, clearcoat: 0.3 });
    m(rbox(0.7, 0.9, 0.32, 0.1), c, 0, -0.05, 0, g);
    for (const x of [-0.18, 0.18]) m(rbox(0.04, 0.88, 0.34, 0.02), mat('#4776CF', { bumpScale: 0 }), x, -0.05, 0, g);
    m(new THREE.TorusGeometry(0.12, 0.035, 10, 24, Math.PI), mat('#2B2A2C', { bumpScale: 0 }), 0, 0.42, 0, g);
    for (const x of [-0.25, 0.25]) m(sph(0.06, 16), mat('#2B2A2C', { bumpScale: 0 }), x, -0.52, 0.1, g);
    m(rbox(0.2, 0.12, 0.02, 0.03), mat('#F2B935', { bumpScale: 0 }), 0.12, 0.15, 0.17, g);
    return wrap(g, 'suitcase');
  },
  umbrella(o = {}) { // beach parasol, striped
    const g = new THREE.Group();
    const cols = o.colors || ['#E8432F', '#FFFFFF'];
    for (let i = 0; i < 8; i++) { const s = m(new THREE.SphereGeometry(0.6, 12, 8, i * Math.PI / 4, Math.PI / 4, 0, Math.PI / 2.6), mat(cols[i % 2], { side: THREE.DoubleSide, roughness: 0.6 }), 0, 0.2, 0, g); s.scale.y = 0.55; }
    m(cyl(0.025, 0.025, 1.0, 12), mat('#E8D7BC'), 0, -0.3, 0, g);
    m(sph(0.05, 12), mat(cols[0]), 0, 0.53, 0, g);
    g.rotation.z = D(-10);
    return wrap(g, 'umbrella');
  },
  sun(o = {}) {
    const g = new THREE.Group(), y = mat(o.color || '#FFC83D', { roughness: 0.35, clearcoat: 0.5, emissive: '#FFB000', emissiveIntensity: 0.15 });
    m(sph(0.3, 40), y, 0, 0, 0, g).scale.z = 0.6;
    for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2, r = m(cap(0.045, 0.12), y, Math.cos(a) * 0.44, Math.sin(a) * 0.44, 0, g); r.rotation.z = a - Math.PI / 2; }
    return wrap(g, 'sun');
  },
  moon(o = {}) {
    const s = new THREE.Shape();   // crescent: outer left semicircle, inner edge bulging left
    for (let i = 0; i <= 24; i++) { const a = Math.PI / 2 + (i / 24) * Math.PI; i ? s.lineTo(Math.cos(a) * 0.45, Math.sin(a) * 0.45) : s.moveTo(Math.cos(a) * 0.45, Math.sin(a) * 0.45); }
    for (let i = 1; i < 24; i++) { const a = -Math.PI / 2 + (i / 24) * Math.PI; s.lineTo(-Math.cos(a) * 0.18, Math.sin(a) * 0.45); }
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.14, bevelEnabled: true, bevelSize: 0.05, bevelThickness: 0.05, bevelSegments: 4, curveSegments: 32 }); geo.center();
    const g = new THREE.Group(); m(geo, mat(o.color || '#FFE38A', { roughness: 0.4, clearcoat: 0.5 }), 0, 0, 0, g); g.rotation.z = D(20);
    return wrap(g, 'moon');
  },
  cloud(o = {}) { const g = new THREE.Group(), w = mat(o.color || '#FFFFFF', { roughness: 0.7 }); for (const [x, y, r] of [[-0.25, -0.05, 0.25], [0.05, 0.08, 0.32], [0.32, -0.04, 0.22], [0.02, -0.12, 0.24]]) m(sph(r, 28), w, x, y, 0, g).scale.z = 0.6; return wrap(g, 'cloud'); },
  sofa(o = {}) {
    const g = new THREE.Group(), c = mat(o.color || '#5B8DEF', { roughness: 0.8, bumpScale: 0.5 });
    m(rbox(1.0, 0.25, 0.45, 0.1), c, 0, -0.15, 0.05, g); m(rbox(1.0, 0.45, 0.16, 0.08), c, 0, 0.1, -0.17, g);
    for (const x of [-0.48, 0.48]) m(rbox(0.14, 0.38, 0.5, 0.07), c, x, -0.02, 0.02, g);
    for (const x of [-0.24, 0.24]) m(rbox(0.46, 0.1, 0.4, 0.05), mat(o.cushion || '#7FA6F2', { roughness: 0.8, bumpScale: 0.4 }), x, 0.0, 0.07, g);
    for (const x of [-0.42, 0.42]) m(cyl(0.03, 0.03, 0.12, 10), mat('#6B4A2E'), x, -0.32, 0.2, g);
    return wrap(g, 'sofa');
  },
  lamp(o = {}) { const g = new THREE.Group(); m(new THREE.ConeGeometry(0.3, 0.32, 32, 1, true), mat(o.color || '#F2B935', { side: THREE.DoubleSide }), 0, 0.3, 0, g); m(cyl(0.02, 0.02, 0.6, 10), mat('#2B2A2C'), 0, -0.05, 0, g); m(cyl(0.18, 0.2, 0.05, 24), mat('#2B2A2C'), 0, -0.36, 0, g); return wrap(g, 'lamp'); },
  key(o = {}) { const g = new THREE.Group(), y = mat(o.color || '#F2B935', { roughness: 0.3, clearcoat: 0.8 }); m(new THREE.TorusGeometry(0.18, 0.07, 14, 32), y, -0.25, 0, 0, g); m(rbox(0.5, 0.1, 0.06, 0.03), y, 0.12, 0, 0, g); m(rbox(0.06, 0.14, 0.06, 0.02), y, 0.3, -0.08, 0, g); m(rbox(0.06, 0.1, 0.06, 0.02), y, 0.18, -0.06, 0, g); return wrap(g, 'key'); },
  palm() { const g = new THREE.Group(); m(cyl(0.05, 0.08, 0.9, 12), mat('#B07A4E', { bumpScale: 0.6 }), 0, -0.1, 0, g).rotation.z = D(6);
    for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2, l = m(sph(0.3, 20), mat('#4FA046'), Math.cos(a) * 0.2, 0.38, Math.sin(a) * 0.2, g); l.scale.set(1.1, 0.12, 0.35); l.rotation.set(0, -a, D(-25)); } return wrap(g, 'palm'); },
  towel(o = {}) { const g = new THREE.Group(); m(rbox(1.0, 0.04, 0.5, 0.02), mat(o.color || '#F49AB0', { roughness: 0.9, bumpScale: 0.6 }), 0, 0, 0, g); for (const x of [-0.3, 0, 0.3]) m(rbox(0.12, 0.045, 0.5, 0.01), mat('#FFFFFF', { roughness: 0.9 }), x, 0.002, 0, g); g.rotation.x = D(60); return wrap(g, 'towel'); },
  house(o = {}) { // little clay house; roof lifts (open)
    const g = new THREE.Group();
    m(rbox(0.8, 0.6, 0.6, 0.05), mat(o.color || '#F3EFE7'), 0, -0.2, 0, g);
    m(rbox(0.16, 0.28, 0.02, 0.02), mat('#B07A4E', { bumpScale: 0 }), 0, -0.36, 0.31, g);
    for (const x of [-0.24, 0.24]) m(rbox(0.16, 0.14, 0.02, 0.02), mat('#9CC8FF', { bumpScale: 0 }), x, -0.12, 0.31, g);
    const hinge = new THREE.Group(); hinge.position.set(0, 0.1, -0.3); g.add(hinge);
    const roof = m(new THREE.CylinderGeometry(0.01, 0.62, 0.42, 4, 1), mat(o.roof || '#E8432F'), 0, 0.21, 0.3, hinge); roof.rotation.y = Math.PI / 4; roof.scale.z = 0.8;
    const w = wrap(g, 'house');
    w.userData.open = (u) => { hinge.rotation.x = -1.4 * u; hinge.position.y = 0.1 + u * 0.15; };
    w.userData.slots = [{ pos: [-0.2, 0.0, 0.0], size: 0.28 }, { pos: [0.1, 0.02, 0.0], size: 0.3 }, { pos: [0.28, -0.02, 0.05], size: 0.14, spread: 0.1 }];
    return w;
  },
};
registerProps(home);
export { home };
