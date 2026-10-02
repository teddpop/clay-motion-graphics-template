/* Food pack (clay): tomato, egg (fried), eggWhole, avocado, carrot, broccoli, lemon, chili, mushroom, riceBowl, pan,
 * plate, milk, herb, garlic, cheese, pepper, cabbage, riceTub, steam; container: fridge (door + 3 shelf slots).
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mat, sph, cap, m, wrap, registerProps } from '../clay3d.js';

const D = THREE.MathUtils.degToRad;
const food = {
  tomato() {
    const g = new THREE.Group();
    const b = m(sph(0.5, 48), mat('#E8432F', { clearcoat: 0.6, roughness: 0.35 }), 0, 0, 0, g); b.scale.set(1, 0.86, 1);
    const leaf = mat('#3F8E3A');
    for (let i = 0; i < 5; i++) {
      const l = m(cap(0.045, 0.2), leaf, 0, 0.43, 0, g);
      l.rotation.set(D(80), 0, 0); l.position.set(Math.sin(i * 1.256) * 0.1, 0.43, Math.cos(i * 1.256) * 0.1);
      l.rotation.set(Math.cos(i * 1.256) * D(75), 0, -Math.sin(i * 1.256) * D(75));
    }
    m(new THREE.CylinderGeometry(0.03, 0.04, 0.14, 12), leaf, 0, 0.5, 0, g);
    return wrap(g, 'tomato');
  },
  egg() { // fried egg, face toward +z: soft irregular white + glossy yolk
    const g = new THREE.Group();
    const white = mat('#FBF7EE', { roughness: 0.3, clearcoat: 0.6, bumpScale: 0.1 });
    const w = m(sph(0.44, 48), white, 0, 0, 0, g); w.scale.set(1.08, 0.95, 0.12);
    for (const [x, y, r] of [[0.2, 0.18, 0.3], [-0.22, -0.12, 0.32], [0.16, -0.2, 0.28], [-0.14, 0.2, 0.28]]) { const k = m(sph(r, 32), white, x, y, -0.01, g); k.scale.z = 0.1; }
    const y = m(sph(0.2, 40), mat('#FFAE12', { roughness: 0.15, clearcoat: 1 }), 0.02, 0.02, 0.05, g); y.scale.z = 0.7;
    return wrap(g, 'egg');
  },
  eggWhole() {
    const g = new THREE.Group();
    const e = m(sph(0.42, 48), mat('#F3E2C7', { roughness: 0.45 }), 0, 0, 0, g); e.scale.set(0.82, 1.05, 0.82);
    return wrap(g, 'eggWhole');
  },
  avocado() {
    const g = new THREE.Group();
    const skin = m(sph(0.5, 48), mat('#355E2B', { roughness: 0.7, bumpScale: 0.8 }), 0, 0, -0.05, g); skin.scale.set(0.8, 1.05, 0.45);
    const flesh = m(sph(0.47, 48), mat('#CFE18A', { roughness: 0.45 }), 0, 0, 0.1, g); flesh.scale.set(0.72, 0.96, 0.22);
    const rim = m(sph(0.47, 48), mat('#9FC35A', { roughness: 0.45 }), 0, 0, 0.08, g); rim.scale.set(0.77, 1.01, 0.22);
    const pit = m(sph(0.2, 32), mat('#7A4A2A', { roughness: 0.35, clearcoat: 0.8 }), 0, -0.12, 0.2, g); pit.scale.set(1, 1.05, 0.8);
    return wrap(g, 'avocado');
  },
  carrot() {
    const g = new THREE.Group();
    const c = m(new THREE.CylinderGeometry(0.2, 0.03, 1.0, 28, 1), mat('#F2862B'), 0, -0.1, 0, g);
    for (let i = 0; i < 4; i++) m(new THREE.TorusGeometry(0.17 - i * 0.035, 0.012, 8, 24), mat('#D86F1D'), 0, 0.25 - i * 0.2, 0, g).rotation.x = Math.PI / 2;
    const leaf = mat('#4E9A3C');
    for (const [a, len] of [[-38, 0.28], [-18, 0.36], [0, 0.4], [18, 0.36], [38, 0.28]]) {
      const l = m(cap(0.045, len), leaf, Math.sin(D(a)) * 0.14, 0.5 + len / 2 * Math.cos(D(a)), 0, g); l.rotation.z = -D(a);
    }
    const w = wrap(g, 'carrot'); g.rotation.z = D(-30); return w;
  },
  broccoli() {
    const g = new THREE.Group();
    m(new THREE.CylinderGeometry(0.12, 0.16, 0.5, 20), mat('#9CC46B'), 0, -0.3, 0, g);
    const top = mat('#2F7A33', { bumpScale: 1.2, roughness: 0.7 });
    for (const [x, y, z, r] of [[0, 0.12, 0, 0.3], [-0.26, 0.02, 0.05, 0.22], [0.26, 0.02, 0.05, 0.22], [0, 0.02, 0.24, 0.22], [0, 0.05, -0.22, 0.22], [-0.16, 0.26, 0.1, 0.18], [0.16, 0.26, 0.1, 0.18]])
      m(sph(r, 28), top, x, y, z, g);
    return wrap(g, 'broccoli');
  },
  lemon() { // slice, face toward +z
    const g = new THREE.Group();
    const rim = m(new THREE.CylinderGeometry(0.5, 0.5, 0.14, 48), mat('#F5CD2F'), 0, 0, 0, g); rim.rotation.x = Math.PI / 2;
    const pith = m(new THREE.CylinderGeometry(0.46, 0.46, 0.15, 48), mat('#FFF6D8', { bumpScale: 0 }), 0, 0, 0.002, g); pith.rotation.x = Math.PI / 2;
    const pulp = mat('#FFE36B', { roughness: 0.3, clearcoat: 0.6 });
    for (let i = 0; i < 8; i++) {
      const s = m(new THREE.CylinderGeometry(0.4, 0.4, 0.16, 16, 1, false, i * Math.PI / 4 + 0.06, Math.PI / 4 - 0.12), pulp, 0, 0, 0.004, g);
      s.rotation.x = Math.PI / 2;
    }
    return wrap(g, 'lemon');
  },
  chili() {
    const g = new THREE.Group();
    const r = mat('#D93A26', { clearcoat: 0.7, roughness: 0.3 });
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.45, 0.1, 0), new THREE.Vector3(-0.1, 0.05, 0), new THREE.Vector3(0.25, -0.1, 0), new THREE.Vector3(0.45, -0.35, 0)]);
    m(new THREE.TubeGeometry(c, 24, 0.12, 16), r, 0, 0, 0, g);
    m(sph(0.12, 20), r, -0.45, 0.1, 0, g);
    m(new THREE.CylinderGeometry(0.05, 0.13, 0.14, 16), mat('#3F8E3A'), -0.55, 0.12, 0, g).rotation.z = D(80);
    return wrap(g, 'chili');
  },
  mushroom() {
    const g = new THREE.Group();
    m(new THREE.CylinderGeometry(0.15, 0.19, 0.45, 20), mat('#F1E6D2'), 0, -0.15, 0, g);
    const capG = new THREE.SphereGeometry(0.42, 40, 20, 0, Math.PI * 2, 0, Math.PI / 2);
    const cc = m(capG, mat('#A9714B'), 0, 0.05, 0, g); cc.scale.y = 0.8;
    m(new THREE.CylinderGeometry(0.42, 0.38, 0.05, 40), mat('#E8D7BC'), 0, 0.05, 0, g);
    return wrap(g, 'mushroom');
  },
  riceBowl() {
    const g = new THREE.Group();
    const pts = []; for (let i = 0; i <= 12; i++) { const a = (i / 12) * Math.PI / 2; pts.push(new THREE.Vector2(0.15 + Math.sin(a) * 0.45, -Math.cos(a) * 0.38)); }
    pts.push(new THREE.Vector2(0.62, 0.02));
    m(new THREE.LatheGeometry(pts, 48), mat('#E9724C', { side: THREE.DoubleSide }), 0, 0, 0, g);
    const rice = m(sph(0.55, 48), mat('#F7F1E3', { bumpScale: 1.5, roughness: 0.8 }), 0, 0.02, 0, g); rice.scale.set(1, 0.42, 1);
    const eg = food.egg(); eg.scale.setScalar(0.5); eg.rotation.x = -Math.PI / 2 + D(20); eg.position.set(0.05, 0.22, 0.05); g.add(eg);
    const green = mat('#5DAA4A');
    for (let i = 0; i < 9; i++) m(new THREE.CylinderGeometry(0.035, 0.035, 0.03, 12), green, Math.sin(i * 2.1) * 0.38, 0.2 + Math.cos(i) * 0.02, Math.cos(i * 2.1) * 0.3, g);
    const kim = mat('#E0522E');
    for (let i = 0; i < 6; i++) { const k = m(new RoundedBoxGeometry(0.12, 0.05, 0.1, 2, 0.02), kim, -0.3 + Math.sin(i * 3.3) * 0.12, 0.2, -0.1 + Math.cos(i * 2.7) * 0.2, g); k.rotation.y = i; }
    return wrap(g, 'riceBowl');
  },
  pan() {
    const g = new THREE.Group();
    const metal = mat('#2B2A2C', { roughness: 0.35, clearcoat: 0.6, bumpScale: 0.1 });
    const pts = [new THREE.Vector2(0, -0.08), new THREE.Vector2(0.48, -0.08), new THREE.Vector2(0.56, 0.06), new THREE.Vector2(0.58, 0.08), new THREE.Vector2(0.5, 0.08), new THREE.Vector2(0.45, -0.03), new THREE.Vector2(0, -0.03)];
    m(new THREE.LatheGeometry(pts, 48), metal, 0, 0, 0, g);
    const h = m(cap(0.055, 0.55), mat('#C9824A'), 0.9, 0.06, 0, g); h.rotation.z = D(86);
    return wrap(g, 'pan');
  },
  plate() {
    const g = new THREE.Group();
    const pts = [new THREE.Vector2(0, 0), new THREE.Vector2(0.35, 0), new THREE.Vector2(0.55, 0.06), new THREE.Vector2(0.6, 0.07), new THREE.Vector2(0.55, 0.08), new THREE.Vector2(0.35, 0.03), new THREE.Vector2(0, 0.03)];
    m(new THREE.LatheGeometry(pts, 56), mat('#FFFFFF', { roughness: 0.25, clearcoat: 0.8, bumpScale: 0 }), 0, 0, 0, g);
    return wrap(g, 'plate');
  },
  milk() {
    const g = new THREE.Group();
    m(new RoundedBoxGeometry(0.46, 0.7, 0.46, 4, 0.05), mat('#F4F6F8', { bumpScale: 0.1 }), 0, 0, 0, g);
    m(new RoundedBoxGeometry(0.47, 0.22, 0.47, 3, 0.03), mat('#4F8FE0'), 0, -0.1, 0, g);
    const roof = m(new THREE.CylinderGeometry(0.01, 0.33, 0.22, 4, 1), mat('#F4F6F8', { bumpScale: 0.1 }), 0, 0.46, 0, g); roof.rotation.y = Math.PI / 4;
    m(new THREE.CylinderGeometry(0.06, 0.06, 0.07, 16), mat('#4F8FE0'), 0.08, 0.5, 0.08, g);
    return wrap(g, 'milk');
  },
  herb() {
    const g = new THREE.Group();
    const l = m(sph(0.3, 24), mat('#4FA046', { roughness: 0.5 }), 0, 0, 0, g); l.scale.set(0.55, 1, 0.12);
    m(cap(0.015, 0.5), mat('#3B7E35'), 0, 0, 0.03, g);
    return wrap(g, 'herb');
  },
  garlic() {
    const g = new THREE.Group();
    const w = mat('#F5EEDF', { roughness: 0.6 });
    for (let i = 0; i < 6; i++) { const c = m(sph(0.26, 28), w, Math.sin(i * 1.05) * 0.16, -0.05, Math.cos(i * 1.05) * 0.16, g); c.scale.set(0.8, 1.1, 0.8); }
    m(sph(0.28, 28), w, 0, 0, 0, g);
    m(new THREE.ConeGeometry(0.08, 0.3, 16), w, 0, 0.36, 0, g);
    return wrap(g, 'garlic');
  },
  cheese() {
    const g = new THREE.Group();
    const s = new THREE.Shape(); s.moveTo(-0.5, -0.3); s.lineTo(0.5, -0.3); s.lineTo(-0.5, 0.35); s.lineTo(-0.5, -0.3);
    const geo = new THREE.ExtrudeGeometry(s, { depth: 0.4, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.06, bevelSegments: 4 });
    geo.center(); m(geo, mat('#F7C548'), 0, 0, 0, g);
    for (const [x, y] of [[-0.25, -0.1], [0.05, -0.15], [-0.3, 0.12]]) m(sph(0.07, 16), mat('#E0A92E'), x, y, 0.26, g).scale.z = 0.4;
    return wrap(g, 'cheese');
  },
  pepper() {
    const g = new THREE.Group();
    const r = mat('#F2B233', { clearcoat: 0.7, roughness: 0.3 });
    for (let i = 0; i < 4; i++) { const l = m(sph(0.3, 32), r, Math.sin(i * 1.57) * 0.13, 0, Math.cos(i * 1.57) * 0.13, g); l.scale.set(0.8, 1.15, 0.8); }
    m(new THREE.CylinderGeometry(0.05, 0.07, 0.2, 12), mat('#3F8E3A'), 0, 0.42, 0, g);
    return wrap(g, 'pepper');
  },
  cabbage() { // half cabbage: layered leaf shells, cut face toward +z
    const g = new THREE.Group();
    const outer = m(sph(0.5, 48), mat('#8CC06A', { roughness: 0.55, bumpScale: 0.6 }), 0, 0, -0.02, g); outer.scale.set(1, 0.95, 0.55);
    const face = m(new THREE.CircleGeometry(0.47, 48), mat('#E4F2C8', { bumpScale: 0.2 }), 0, 0, 0.255, g);
    const vein = mat('#C9E3A2', { bumpScale: 0 });
    for (const [r0, ph] of [[0.16, 0.3], [0.27, 1.7], [0.38, 2.9]]) { // soft wavy leaf layers
      const pts = []; for (let k = 0; k < 14; k++) { const a = (k / 14) * Math.PI * 2; const rr = r0 * (1 + 0.12 * Math.sin(a * 3 + ph) + 0.06 * Math.sin(a * 5 + ph * 2)); pts.push(new THREE.Vector3(Math.cos(a) * rr, Math.sin(a) * rr * 0.95 - 0.02, 0.262)); }
      m(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 64, 0.009, 6, true), vein, 0, 0, 0, g);
    }
    m(sph(0.06, 20), mat('#F4FAE6', { bumpScale: 0 }), 0.01, -0.05, 0.24, g).scale.z = 0.4;
    for (const [x, y, sx, rz] of [[-0.42, 0.18, 0.5, 0.5], [0.43, 0.1, 0.45, -0.4], [0.05, 0.46, 0.55, 0]]) { const l = m(sph(0.2, 24), mat('#6FAE4E'), x, y, 0.05, g); l.scale.set(sx, 0.35, 0.3); l.rotation.z = rz; }
    return wrap(g, 'cabbage');
  },
  riceTub() { // leftover rice in a takeout-style tub
    const g = new THREE.Group();
    m(new RoundedBoxGeometry(0.9, 0.42, 0.62, 5, 0.1), mat('#F3EFE7', { roughness: 0.35, clearcoat: 0.6, bumpScale: 0.05 }), 0, -0.08, 0, g);
    m(new RoundedBoxGeometry(0.92, 0.05, 0.64, 3, 0.02), mat('#E07A4F', { bumpScale: 0 }), 0, 0.1, 0, g);   // coloured rim band
    const rice = m(sph(0.42, 40), mat('#FCF9F1', { bumpScale: 2, roughness: 0.85 }), 0, 0.14, 0, g); rice.scale.set(1.0, 0.42, 0.66);
    for (let i = 0; i < 5; i++) m(new THREE.CylinderGeometry(0.03, 0.03, 0.025, 10), mat('#5DAA4A', { bumpScale: 0 }), -0.2 + i * 0.1, 0.3, Math.sin(i * 2) * 0.12, g);
    return wrap(g, 'riceTub');
  },
  fridge() { // open-front clay fridge; userData.door pivots at the left edge (rotation.y: 0 closed → -2 open)
    const g = new THREE.Group();
    const shell = mat('#F7F5F0', { roughness: 0.45, clearcoat: 0.3, bumpScale: 0.1 }), inner = mat('#DCE8EF', { roughness: 0.6, bumpScale: 0 });
    const W = 1.0, H = 1.8, Dp = 0.75, t = 0.07;
    m(new RoundedBoxGeometry(W, H, t, 4, 0.03), shell, 0, 0, -Dp / 2, g);                 // back
    m(new RoundedBoxGeometry(t, H, Dp, 4, 0.03), shell, -W / 2, 0, 0, g);                  // left
    m(new RoundedBoxGeometry(t, H, Dp, 4, 0.03), shell, W / 2, 0, 0, g);                   // right
    m(new RoundedBoxGeometry(W, t, Dp, 4, 0.03), shell, 0, H / 2, 0, g);                   // top
    m(new RoundedBoxGeometry(W, t, Dp, 4, 0.03), shell, 0, -H / 2, 0, g);                  // bottom
    m(new THREE.PlaneGeometry(W - t, H - t), inner, 0, 0, -Dp / 2 + t / 2 + 0.002, g);      // back wall
    for (const y of [0.35, -0.2]) m(new RoundedBoxGeometry(W - t * 1.5, 0.03, Dp * 0.85, 2, 0.01), mat('#FFFFFF', { transparent: true, opacity: 0.8, roughness: 0.1, clearcoat: 1, bumpScale: 0 }), 0, y, 0, g);
    const glow = m(new THREE.PlaneGeometry(W * 0.6, 0.05), new THREE.MeshBasicMaterial({ color: '#FFF8DA' }), 0, H / 2 - 0.08, 0.1, g); glow.rotation.x = Math.PI / 2;
    const hinge = new THREE.Group(); hinge.position.set(-W / 2, 0, Dp / 2); g.add(hinge);
    const door = m(new RoundedBoxGeometry(W + 0.04, H + 0.04, 0.12, 5, 0.06), shell, W / 2, 0, 0.06, hinge);
    m(new RoundedBoxGeometry(0.06, 0.5, 0.08, 3, 0.03), mat('#2B2A2C', { roughness: 0.3, bumpScale: 0 }), W - 0.12, 0.3, 0.16, hinge);
    m(new RoundedBoxGeometry(W - 0.1, 0.02, 0.02, 2, 0.01), mat('#D9D4CB', { bumpScale: 0 }), W / 2, 0.45, 0.125, hinge);
    const o = wrap(g, 'fridge'); o.userData.door = hinge;
    o.userData.open = (u) => { hinge.rotation.y = -1.95 * u; };
    // top shelf, middle shelf, bottom (crisper) — local coords, size = item scale in fridge units
    o.userData.slots = [{ pos: [-0.1, 0.525, 0.02], size: 0.34 }, { pos: [0.08, -0.08, 0.02], size: 0.36 }, { pos: [-0.02, -0.81, 0.05], size: 0.12, spread: 0.14 }];
    return o;
  },
  steam() { // one soft puff
    const g = new THREE.Group();
    const w = new THREE.MeshStandardMaterial({ color: '#FFFFFF', roughness: 1, transparent: true, opacity: 0.85 });
    m(sph(0.3, 24), w, 0, 0, 0, g); m(sph(0.22, 24), w, 0.25, 0.1, 0, g); m(sph(0.2, 24), w, -0.22, 0.08, 0, g);
    const o = wrap(g, 'steam'); o.userData.mat = w; return o;
  },
};


registerProps(food);
export { food };
