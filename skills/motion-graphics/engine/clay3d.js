/* Clay 3D core: shared materials + primitives, a full-frame transparent 3D stage, and motion helpers.
 * Domain packs (engine/props/*.js) register factories into MG.props; see references/clay-props.md.
 *
 *   import './clay3d.js'; import './props/food.js';      // or any other pack
 *   const st = MG.stage3d('#stFront');                    // transparent WebGL layer, sized to its container
 *   st.add(MG.props.tomato(), (o, t) => MG.fly(o, t, st, { from: [200, -150], to: [900, 600], t0: 1.2, size: 140 }));
 *   st.px(x, y, z) → THREE.Vector3 (screen px → world units on plane z)
 *
 * Every prop is ~1 world unit across, faces +z, and is scaled with `size` (px) in MG.fly / MG.place / MG.orbit.
 * Containers (the "problem object" of a Clay Story opening) also expose
 *   userData.open(u)   0 = closed → 1 = fully open (door, lid, flap…)
 *   userData.slots     [{ pos:[x,y,z], size }] local resting spots for the items inside
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { renderer, clayNoise } from './host3d.js';

const D = THREE.MathUtils.degToRad;
let NOISE = null;
// clay material: soft roughness, hand-pressed bump, faint sheen. Use for every prop so packs match the mascot.
export function mat(color, o = {}) {
  NOISE = NOISE || clayNoise(11);
  return new THREE.MeshPhysicalMaterial({ color, roughness: 0.5, metalness: 0, bumpMap: NOISE, bumpScale: 0.3,
    clearcoat: 0.2, clearcoatRoughness: 0.5, sheen: 0.3, sheenRoughness: 0.7, sheenColor: '#ffffff', ...o });
}
export const sph = (r, s = 40) => new THREE.SphereGeometry(r, s, Math.round(s * 0.75));
export const cap = (r, l) => new THREE.CapsuleGeometry(r, l, 10, 24);
export const rbox = (w, h, d, r = 0.05, seg = 4) => new RoundedBoxGeometry(w, h, d, seg, r);
export const cyl = (rt, rb, h, s = 32) => new THREE.CylinderGeometry(rt, rb, h, s);
export function m(geo, material, x = 0, y = 0, z = 0, parent) {
  const o = new THREE.Mesh(geo, material); o.position.set(x, y, z); if (parent) parent.add(o); return o;
}
export function wrap(g, name) { const w = new THREE.Group(); w.add(g); w.name = name; w.userData.inner = g; return w; }
// flat label/graphic on a prop (a canvas texture on a plane): draw(ctx, w, h)
export function decal(w, h, draw, px = 256) {
  const c = document.createElement('canvas'); c.width = px; c.height = Math.round(px * h / w);
  draw(c.getContext('2d'), c.width, c.height);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, transparent: true, roughness: 0.6 }));
}
const props = (window.MG.props = window.MG.props || {});
// packs call this: MG.registerProps({ name: () => object3d, ... })
export function registerProps(pack) { Object.assign(props, pack); return pack; }

// ---------------- stage ----------------
export function stage3d(container, opts = {}) {
  if (typeof container === 'string') container = document.querySelector(container);
  const { gl, env } = renderer();
  const W = container.clientWidth || 1920, H = container.clientHeight || 1080, ss = opts.supersample || 1;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(W * ss); canvas.height = Math.round(H * ss);
  canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;pointer-events:none';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  const scene = new THREE.Scene(); scene.environment = env; scene.environmentIntensity = 0.6;
  const key = new THREE.DirectionalLight('#FFF4E6', 2.2); key.position.set(-4, 6, 8); scene.add(key);
  const rim = new THREE.DirectionalLight('#FFFFFF', 1.0); rim.position.set(5, 3, -5); scene.add(rim);
  scene.add(new THREE.HemisphereLight('#FFFFFF', '#C9B8A6', 0.55));
  const fov = opts.fov || 24, dist = 20;
  const cam = new THREE.PerspectiveCamera(fov, W / H, 0.1, 100); cam.position.set(0, 0, dist); cam.lookAt(0, 0, 0);
  const visH = 2 * dist * Math.tan(D(fov / 2)), unit = visH / H; // world units per px on z=0
  const items = [];
  const api = {
    scene, unit,
    px(x, y, z = 0) { return new THREE.Vector3((x - W / 2) * unit, (H / 2 - y) * unit, z); },
    toPx(v) { const q = v.clone().project(cam); return { x: (q.x + 1) / 2 * W, y: (1 - q.y) / 2 * H }; },   // world → screen px
    // screen-px bounding rect of an object (with its current transform)
    rectOf(obj) {
      obj.updateMatrixWorld(true); const b = new THREE.Box3().setFromObject(obj), xs = [], ys = [];
      for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) { const p = api.toPx(new THREE.Vector3(x, y, z)); xs.push(p.x); ys.push(p.y); }
      return { x0: Math.min(...xs), x1: Math.max(...xs), y0: Math.min(...ys), y1: Math.max(...ys) };
    },
    add(obj, fn) { scene.add(obj); items.push({ obj, fn }); obj.visible = false; return obj; },
    render(t) {
      for (const it of items) { it.obj.visible = true; it.fn && it.fn(it.obj, t, api); }
      if (gl.domElement.width !== canvas.width || gl.domElement.height !== canvas.height) gl.setSize(canvas.width, canvas.height, false);
      gl.render(scene, cam);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(gl.domElement, 0, 0);
    },
  };
  MG.call(-1, 1e9, (p, t) => {
    if (getComputedStyle(container).visibility === 'hidden') return;
    api.render(t);
  });
  return api;
}

// ---------------- motion helpers (pure functions of t) ----------------
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const E = () => window.MG.E;
// place: static position with optional idle bob/spin. size = px across.
export function place(o, t, st, { at, size = 120, t0 = -1, pop = 0.45, bob = 6, spin = 0.25, tilt = [0, 0, 0], seed = 0, z = 0 }) {
  const p = clamp((t - t0) / pop);
  const s = p <= 0 ? 0 : E().outBack(p, 2.2);
  const b = Math.sin(t * 2.2 + seed) * bob;
  const v = st.px(at[0], at[1] + b, z);
  o.position.copy(v);
  o.scale.setScalar(Math.max(0.0001, s * size * st.unit));
  o.rotation.set(D(tilt[0]) + Math.sin(t * 0.9 + seed) * 0.12, D(tilt[1]) + t * spin + (spin ? seed : Math.sin(t * 0.7 + seed) * 0.15), D(tilt[2]) + Math.sin(t * 1.1 + seed) * 0.08);
  o.visible = p > 0;
}
// fly: arc from→to over dur, tumble, squash & stretch on landing, then settle/idle
export function fly(o, t, st, { from, to, t0, dur = 0.8, arc = 200, spin = 1.5, size = 120, land = true, seed = 0, tilt = [0, 0, 0], z = 0, out = null }) {
  if (t < t0) { o.visible = false; return; }
  o.visible = true;
  const p = clamp((t - t0) / dur), e = E().inOutCubic(p);
  let x = from[0] + (to[0] - from[0]) * e, y = from[1] + (to[1] - from[1]) * e - Math.sin(p * Math.PI) * arc;
  let sx = 1, sy = 1;
  if (p < 1) { const stretch = Math.sin(p * Math.PI) * 0.18; sy = 1 + stretch; sx = 1 - stretch * 0.6; }
  else if (land) {
    const q = t - (t0 + dur), k = Math.exp(-q * 7) * Math.sin(q * 22) * 0.22; // squash wobble
    sy = 1 - k; sx = 1 + k * 0.7;
    y += Math.sin(t * 2.2 + seed) * 5 * clamp(q / 0.5);
  }
  if (out && t > out.t0) { // exit
    const q = clamp((t - out.t0) / (out.dur || 0.5)), eo = E().inOutCubic(q);
    x += (out.to[0] - x) * eo; y += (out.to[1] - y) * eo - Math.sin(q * Math.PI) * (out.arc || 0);
  }
  o.position.copy(st.px(x, y, z));
  const u = size * st.unit;
  o.scale.set(u * sx, u * sy, u * sx);
  // tumble during flight, but always settle back to the intended facing (tilt) on landing:
  // yaw makes whole turns (rounded spin), pitch is a there-and-back flip
  const turns = Math.max(0, Math.round(spin));
  const yaw = (p < 1 ? E().outCubic(p) : 1) * turns * Math.PI * 2;
  const pitch = p < 1 ? Math.sin(p * Math.PI) * spin * 0.9 : 0;
  const idle = p < 1 ? 0 : Math.sin((t - t0 - dur) * 1.1 + seed) * 0.12;
  o.rotation.set(D(tilt[0]) + pitch, D(tilt[1]) + yaw + idle, D(tilt[2]) + Math.sin(t + seed) * 0.08);
}
// orbit: circle around a centre (px), elliptical, with depth (z) so items pass behind/in front
export function orbit(o, t, st, { center, rx = 300, ry = 80, speed = 0.6, phase = 0, size = 100, t0 = -1, pop = 0.5, z = 3 }) {
  const p = clamp((t - t0) / pop), s = p <= 0 ? 0 : E().outBack(p, 2);
  const a = phase + t * speed * Math.PI * 2;
  o.position.copy(st.px(center[0] + Math.cos(a) * rx, center[1] + Math.sin(a) * ry, Math.sin(a) * z));
  o.scale.setScalar(Math.max(0.0001, s * size * st.unit * (1 + Math.sin(a) * 0.12)));
  o.rotation.set(Math.sin(t + phase) * 0.3, t * 1.2 + phase, Math.cos(t * 0.8 + phase) * 0.2);
  o.visible = p > 0;
}

window.MG.stage3d = stage3d;
window.MG.place = place;
window.MG.fly = fly;
window.MG.orbit = orbit;


Object.assign(window.MG, { registerProps, clay: { THREE, mat, sph, cap, rbox, cyl, m, wrap, decal, D } });
export { THREE, D, props };
