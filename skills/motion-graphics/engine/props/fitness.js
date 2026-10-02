/* Fitness pack (clay): dumbbell, kettlebell, bottle, sneaker, apple, stopwatch, medal, heartRate;
 * container: gymBag (zip flap + 3 slots).
 */
import * as THREE from 'three';
import { mat, sph, cap, rbox, cyl, m, wrap, registerProps } from '../clay3d.js';

const D = THREE.MathUtils.degToRad;

const fitness = {
  dumbbell(o = {}) {
    const g = new THREE.Group(), w = mat(o.color || '#3E4A5C', { roughness: 0.45, clearcoat: 0.4 }), h = mat('#B9BEC6', { roughness: 0.3, clearcoat: 0.8, bumpScale: 0 });
    const bar = m(cyl(0.06, 0.06, 0.7, 20), h, 0, 0, 0, g); bar.rotation.z = Math.PI / 2;
    for (const s of [-1, 1]) { const p = m(cyl(0.26, 0.26, 0.16, 32), w, s * 0.38, 0, 0, g); p.rotation.z = Math.PI / 2; const q = m(cyl(0.2, 0.2, 0.08, 32), w, s * 0.5, 0, 0, g); q.rotation.z = Math.PI / 2; }
    g.rotation.set(D(10), D(-20), D(-8));
    return wrap(g, 'dumbbell');
  },
  kettlebell(o = {}) {
    const g = new THREE.Group(), k = mat(o.color || '#E8432F', { roughness: 0.4, clearcoat: 0.5 });
    m(sph(0.42, 40), k, 0, -0.12, 0, g).scale.set(1, 0.92, 1);
    m(cyl(0.3, 0.3, 0.06, 32), mat('#2B2A2C', { bumpScale: 0 }), 0, -0.5, 0, g);
    const hd = m(new THREE.TorusGeometry(0.22, 0.07, 16, 32, Math.PI), k, 0, 0.2, 0, g);
    return wrap(g, 'kettlebell');
  },
  bottle(o = {}) { // water bottle, upright
    const g = new THREE.Group();
    m(cyl(0.22, 0.22, 0.78, 32), mat(o.color || '#5BC0EB', { roughness: 0.25, clearcoat: 0.9, bumpScale: 0.05 }), 0, -0.08, 0, g);
    m(cyl(0.225, 0.225, 0.2, 32), mat('#FFFFFF', { roughness: 0.6 }), 0, 0.0, 0, g);
    m(cyl(0.16, 0.2, 0.1, 32), mat('#2B2A2C', { roughness: 0.4, bumpScale: 0 }), 0, 0.36, 0, g);
    m(cyl(0.12, 0.14, 0.1, 24), mat('#2B2A2C', { roughness: 0.4, bumpScale: 0 }), 0, 0.45, 0, g);
    const loop = m(new THREE.TorusGeometry(0.07, 0.02, 8, 20), mat('#2B2A2C', { bumpScale: 0 }), 0, 0.53, 0, g);
    return wrap(g, 'bottle');
  },
  sneaker(o = {}) { // side view toward +z, toe toward +x
    const g = new THREE.Group(), up = mat(o.color || '#FFFFFF', { roughness: 0.6 }), acc = mat(o.accent || '#E8432F');
    m(rbox(1.0, 0.12, 0.38, 0.06), mat('#F3F2EE', { roughness: 0.7 }), 0, -0.24, 0, g);
    m(rbox(1.02, 0.04, 0.4, 0.02), mat('#D8D6D0', { bumpScale: 0 }), 0, -0.3, 0, g);
    const body = m(sph(0.4, 40), up, -0.1, -0.06, 0, g); body.scale.set(1.25, 0.55, 0.48);
    const toe = m(sph(0.22, 32), up, 0.3, -0.12, 0, g); toe.scale.set(1.2, 0.6, 0.8);
    m(rbox(0.3, 0.32, 0.36, 0.1), up, -0.33, 0.06, 0, g);
    const sw = m(new THREE.TorusGeometry(0.22, 0.035, 8, 24, Math.PI * 0.8), acc, -0.05, -0.08, 0.2, g); sw.rotation.z = D(200);
    for (let i = 0; i < 3; i++) m(rbox(0.04, 0.02, 0.24, 0.01), mat('#2B2A2C', { bumpScale: 0 }), 0.02 + i * 0.08, 0.12 - i * 0.03, 0, g);
    g.rotation.y = D(-20);
    return wrap(g, 'sneaker');
  },
  apple(o = {}) {
    const g = new THREE.Group();
    const b = m(sph(0.46, 48), mat(o.color || '#E8432F', { clearcoat: 0.7, roughness: 0.3 }), 0, 0, 0, g); b.scale.set(1.05, 0.95, 1.0);
    m(cyl(0.025, 0.03, 0.2, 10), mat('#6B4A2E'), 0, 0.48, 0, g).rotation.z = D(10);
    const l = m(sph(0.12, 20), mat('#4FA046'), 0.12, 0.52, 0, g); l.scale.set(1, 0.4, 0.15); l.rotation.z = D(-25);
    return wrap(g, 'apple');
  },
  stopwatch(o = {}) { // face +z
    const g = new THREE.Group();
    const b = m(cyl(0.44, 0.44, 0.16, 48), mat(o.color || '#2FA36B', { roughness: 0.4, clearcoat: 0.5 }), 0, 0, 0, g); b.rotation.x = Math.PI / 2;
    const f = m(cyl(0.36, 0.36, 0.02, 48), mat('#FFFFFF', { roughness: 0.4, bumpScale: 0 }), 0, 0, 0.08, g); f.rotation.x = Math.PI / 2;
    m(cyl(0.07, 0.07, 0.12, 20), mat('#B9BEC6', { roughness: 0.3, bumpScale: 0 }), 0, 0.5, 0, g);
    m(rbox(0.16, 0.06, 0.08, 0.02), mat('#B9BEC6', { roughness: 0.3, bumpScale: 0 }), 0, 0.58, 0, g);
    const hand = new THREE.Group(); hand.position.z = 0.1; g.add(hand);
    m(rbox(0.03, 0.3, 0.02, 0.01), mat('#E8432F', { bumpScale: 0 }), 0, 0.13, 0, hand); hand.rotation.z = D(-50);
    m(sph(0.035, 12), mat('#2B2A2C', { bumpScale: 0 }), 0, 0, 0.11, g);
    const w = wrap(g, 'stopwatch'); w.userData.hand = hand; return w;
  },
  medal(o = {}) { // face +z
    const g = new THREE.Group();
    for (const s of [-1, 1]) { const r = m(rbox(0.16, 0.5, 0.03, 0.02), mat(s < 0 ? (o.ribbon || '#5B8DEF') : (o.ribbon2 || '#E8432F'), { roughness: 0.7 }), s * 0.09, 0.32, -0.02, g); r.rotation.z = s * D(-14); }
    const c = m(cyl(0.3, 0.3, 0.08, 40), mat('#F2B935', { roughness: 0.3, clearcoat: 0.8, bumpScale: 0.1 }), 0, -0.12, 0, g); c.rotation.x = Math.PI / 2;
    const st = new THREE.Shape(); for (let i = 0; i < 10; i++) { const a = (i / 10) * Math.PI * 2 + Math.PI / 2, r = i % 2 ? 0.07 : 0.16; i ? st.lineTo(Math.cos(a) * r, Math.sin(a) * r) : st.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
    m(new THREE.ExtrudeGeometry(st, { depth: 0.03, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2 }), mat('#D9961C', { bumpScale: 0 }), 0, -0.12, 0.04, g);
    return wrap(g, 'medal');
  },
  heartRate(o = {}) { // chunky heart, face +z
    const g = new THREE.Group(), s = new THREE.Shape();
    s.moveTo(0, -0.38); s.bezierCurveTo(-0.5, -0.02, -0.46, 0.38, -0.2, 0.38); s.bezierCurveTo(-0.08, 0.38, 0, 0.3, 0, 0.2);
    s.bezierCurveTo(0, 0.3, 0.08, 0.38, 0.2, 0.38); s.bezierCurveTo(0.46, 0.38, 0.5, -0.02, 0, -0.38);
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.18, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 6 }); geo.center();
    m(geo, mat(o.color || '#E8432F', { roughness: 0.35, clearcoat: 0.6 }), 0, 0, 0, g);
    return wrap(g, 'heartRate');
  },
  gymBag(o = {}) { // duffel; open(u) folds the zip flap back
    const g = new THREE.Group(), c = mat(o.color || '#3E4A5C', { roughness: 0.75, bumpScale: 0.5 }), acc = mat(o.accent || '#E8432F', { roughness: 0.6 });
    const W = 1.0, H = 0.5, Dp = 0.46;
    const body = m(cap(0.25, 0.55), c, 0, 0, 0, g); body.rotation.z = Math.PI / 2; body.scale.set(1, 1, Dp / 0.5);
    m(new THREE.PlaneGeometry(W * 0.6, Dp * 0.6), mat('#22272F', { bumpScale: 0 }), 0, 0.2, 0, g).rotation.x = -Math.PI / 2;
    for (const s of [-1, 1]) { const st = m(new THREE.TorusGeometry(0.22, 0.03, 8, 24, Math.PI), acc, s * 0.18, 0.2, 0, g); }
    m(rbox(0.5, 0.18, 0.02, 0.04), acc, 0, -0.05, Dp / 2 + 0.01, g);
    const hinge = new THREE.Group(); hinge.position.set(0, 0.22, -Dp * 0.3); g.add(hinge);
    m(rbox(W * 0.6, 0.04, Dp * 0.6, 0.02), c, 0, 0, Dp * 0.3, hinge);
    const w = wrap(g, 'gymBag');
    w.userData.open = (u) => { hinge.rotation.x = -1.9 * u; };
    w.userData.slots = [{ pos: [-0.2, 0.2, 0.0], size: 0.3 }, { pos: [0.05, 0.24, 0.0], size: 0.32 }, { pos: [0.24, 0.18, 0.02], size: 0.16, spread: 0.1 }];
    return w;
  },
};

registerProps(fitness);
export { fitness };
