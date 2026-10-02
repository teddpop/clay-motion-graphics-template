/* 3D clay-toy host character (Three.js, MIT). Same API as the 2D host:
 *
 *   const h = MG.host3d(containerEl, { variant: 'full' | 'bust', hair, glasses, lashes, palette: {...}, pose: 'idle', seed, phoneScreen });
 *   hair: 'quiff' | 'curly' | 'bun' | 'bob' | 'long' | 'ponytail' | 'buzz'
 *   glasses: true | '#hex' (frame colour)     lashes: true (adds upper lashes, good for female hosts)
 *   palette keys: skin, hair, shirt, shirtDark, tee, pants, shoe. Light skin e.g. { skin: '#EDC3A0' }
 *   talkWhen: (t) => bool   lip-sync only while this returns true (multi-character scenes; default: whenever VO plays)
 *   phoneScreen: (ctx, w, h) => draws the clay phone prop's screen (256×512 canvas). Default: a generic app home screen.
 *   Preview looks with engine/test/cast.html?hair=bun&glasses=1
 *   h.pose(t, 'shrug');  h.wave(t0, t1);  h.look(t, deg)  (0 = straight at camera, 14 = toward viewer-right)
 *
 * One shared WebGL renderer draws each visible host into its own 2D canvas, so any number of
 * hosts can exist without exhausting WebGL contexts. Everything is a pure function of t.
 * Poses: idle, talk, shrug, present, point, think, thumbs, wave, open
 */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const D = THREE.MathUtils.degToRad;
const DEFAULT = {
  skin: '#C98A5F', hair: '#3B2A24', shirt: '#7D8466', shirtDark: '#646B50', tee: '#F1EEE7',
  pants: '#2C2A29', shoe: '#F3F2EE', sole: '#D8D6D0', eye: '#FFFFFF', pupil: '#1A1614', mouth: '#5B2320', tongue: '#C9665A',
};

// ---------- shared renderer ----------
let R = null;
function renderer() {
  if (R) return R;
  const gl = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
  gl.setPixelRatio(1);
  gl.outputColorSpace = THREE.SRGBColorSpace;
  gl.toneMapping = THREE.NeutralToneMapping;
  gl.toneMappingExposure = 1.05;
  gl.shadowMap.enabled = true;
  gl.shadowMap.type = THREE.PCFSoftShadowMap;
  gl.setClearColor(0x000000, 0);
  const env = new THREE.PMREMGenerator(gl).fromScene(new RoomEnvironment(), 0.04).texture;
  R = { gl, env };
  return R;
}

// deterministic value-noise texture → subtle "hand-pressed clay" bump
function clayNoise(seed = 7) {
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d'), img = g.createImageData(256, 256);
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  const grid = Array.from({ length: 33 * 33 }, rnd);
  const at = (x, y) => grid[(y % 33) * 33 + (x % 33)];
  for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) {
    let v = 0, amp = 0.6, f = 8;
    for (let o = 0; o < 3; o++) {
      const fx = (x / 256) * f, fy = (y / 256) * f, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const a = at(ix, iy), b = at(ix + 1, iy), cc = at(ix, iy + 1), d = at(ix + 1, iy + 1);
      v += amp * (a + (b - a) * sx + (cc - a) * sy + (a - b - cc + d) * sx * sy);
      amp *= 0.5; f *= 2;
    }
    const k = (y * 256 + x) * 4, u = Math.max(0, Math.min(255, v * 200));
    img.data[k] = img.data[k + 1] = img.data[k + 2] = u; img.data[k + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 2);
  return t;
}

// ---------- poses ----------
// per arm: out (sideways raise), fwd (forward raise), bend (elbow), eout (forearm sideways), twist (wrist), hand
// L = viewer-left arm (character's right). Angles in degrees.
const A = (out, fwd, bend, eout, twist, hand) => ({ out, fwd, bend, eout, twist, hand });
const POSES = {
  idle:    { L: A(7, 2, 12, 0, 0, 'relax'),     R: A(7, 2, 12, 0, 0, 'relax'),     head: [0, 0, 0], shrug: 0 },
  talk:    { L: A(14, 22, 100, -18, 30, 'open'), R: A(14, 22, 100, -18, 30, 'open'), head: [0, 3, 0], shrug: 0 },
  shrug:   { L: A(22, 18, 88, 55, 95, 'open'),  R: A(22, 18, 88, 55, 95, 'open'),  head: [-7, 0, 4], shrug: 1 },
  present: { L: A(48, 28, 38, 25, 90, 'open'),  R: A(9, 4, 14, 0, 0, 'relax'),     head: [4, -10, 0], shrug: 0 },
  point:   { L: A(8, 2, 14, 0, 0, 'relax'),     R: A(45, 12, 15, 125, -70, 'point'), head: [-3, 5, 2], shrug: 0 },
  think:   { L: A(8, 2, 14, 0, 0, 'relax'),     R: A(92, 12, 22, 112, 0, 'relax'), head: [6, 8, 6], shrug: 0 },
  thumbs:  { L: A(8, 2, 14, 0, 0, 'relax'),     R: A(38, 25, 20, 110, 0, 'thumb'), head: [-3, 4, 0], shrug: 0 },
  wave:    { L: A(8, 2, 14, 0, 0, 'relax'),     R: A(80, 8, 10, 95, -90, 'open'), head: [-5, 4, -3], shrug: 0 },
  open:    { L: A(38, 22, 30, 20, 80, 'open'),  R: A(38, 22, 30, 20, 80, 'open'),  head: [0, 0, -4], shrug: 0 },
  hold:    { L: A(14, 22, 100, -18, 30, 'open'), R: A(8, 28, 140, 8, 90, 'grip'), head: [2, 4, 0], shrug: 0 },
};
// finger curls [index, middle, ring, pinky], thumb [spread, curl]
const HANDS = {
  relax: { f: [40, 48, 55, 62], th: [25, 30] },
  open:  { f: [4, 0, 5, 10], th: [55, 5] },
  point: { f: [0, 105, 110, 110], th: [15, 70] },
  thumb: { f: [110, 115, 115, 115], th: [8, -18] },
  grip:  { f: [8, 6, 8, 12], th: [55, -25] },
};

function buildCharacter(pal, hairStyle = 'quiff', look = {}) {
  const clay = clayNoise();
  const mat = (color, o = {}) => new THREE.MeshPhysicalMaterial({
    color, roughness: 0.62, metalness: 0, bumpMap: clay, bumpScale: 0.35, sheen: 0.25, sheenRoughness: 0.8, sheenColor: '#ffffff', ...o });
  const M = {
    skin: mat(pal.skin, { roughness: 0.55, clearcoat: 0.15, clearcoatRoughness: 0.6 }),
    hair: mat(pal.hair, { roughness: 0.5, bumpScale: 0.8 }),
    shirt: mat(pal.shirt, { roughness: 0.8, sheen: 0.6 }),
    shirtDark: mat(pal.shirtDark, { roughness: 0.8, sheen: 0.5 }),
    tee: mat(pal.tee, { roughness: 0.85 }),
    pants: mat(pal.pants, { roughness: 0.85, sheen: 0.4 }),
    shoe: mat(pal.shoe, { roughness: 0.5 }), sole: mat(pal.sole, { roughness: 0.7 }),
    eye: new THREE.MeshPhysicalMaterial({ color: pal.eye, roughness: 0.15, clearcoat: 1 }),
    pupil: new THREE.MeshPhysicalMaterial({ color: pal.pupil, roughness: 0.1, clearcoat: 1 }),
    glint: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
    mouth: mat(pal.mouth, { roughness: 0.7, bumpScale: 0 }), tongue: mat(pal.tongue, { bumpScale: 0 }),
    teeth: new THREE.MeshPhysicalMaterial({ color: '#FBFAF6', roughness: 0.3 }),
    blush: new THREE.MeshStandardMaterial({ color: '#E0725A', transparent: true, opacity: 0.18, roughness: 1 }),
  };
  const mesh = (geo, m, x = 0, y = 0, z = 0, parent) => {
    const o = new THREE.Mesh(geo, m); o.position.set(x, y, z); o.castShadow = true; o.receiveShadow = true;
    if (parent) parent.add(o); return o;
  };
  const sph = (r, seg = 48) => new THREE.SphereGeometry(r, seg, Math.round(seg * 0.75));
  const cap = (r, len) => new THREE.CapsuleGeometry(r, len, 12, 32);
  const rbox = (w, h, d, r) => new RoundedBoxGeometry(w, h, d, 6, r);

  const root = new THREE.Group();
  const body = new THREE.Group(); root.add(body);

  // shoes + legs
  for (const s of [-1, 1]) {
    const shoe = mesh(rbox(0.26, 0.15, 0.42, 0.07), M.shoe, s * 0.15, 0.1, 0.06, body);
    mesh(rbox(0.28, 0.05, 0.44, 0.02), M.sole, s * 0.15, 0.025, 0.06, body);
    mesh(cap(0.12, 0.55), M.pants, s * 0.14, 0.52, 0, body);
    shoe.rotation.y = s * D(-6);
  }
  mesh(rbox(0.52, 0.28, 0.34, 0.12), M.pants, 0, 0.92, 0, body); // hips

  // torso: tee + open overshirt
  const torso = new THREE.Group(); torso.position.y = 0.92; body.add(torso);
  mesh(rbox(0.46, 0.7, 0.32, 0.14), M.tee, 0, 0.4, 0, torso);
  for (const s of [-1, 1]) {
    const panel = mesh(rbox(0.30, 0.9, 0.38, 0.13), M.shirt, s * 0.17, 0.33, -0.01, torso);
    panel.rotation.y = s * D(8);
    const pocket = mesh(rbox(0.13, 0.12, 0.02, 0.01), M.shirtDark, s * 0.19, 0.52, 0.2, torso);
    pocket.rotation.y = s * D(8);
    const collar = mesh(rbox(0.14, 0.2, 0.05, 0.02), M.shirtDark, s * 0.1, 0.72, 0.15, torso);
    collar.rotation.set(D(-18), s * D(-10), s * D(28));
  }

  // head
  const neck = mesh(new THREE.CylinderGeometry(0.075, 0.085, 0.14, 24), M.skin, 0, 0.74, 0, torso);
  const head = new THREE.Group(); head.position.set(0, 0.78, 0.01); torso.add(head);
  const skull = mesh(sph(0.46, 64), M.skin, 0, 0.44, 0, head); skull.scale.set(1, 1.0, 0.92);
  for (const s of [-1, 1]) { const e = mesh(sph(0.1), M.skin, s * 0.45, 0.42, -0.02, head); e.scale.set(0.55, 1, 0.8); }
  // hair: cap + quiff blobs
  const hcap = mesh(sph(0.475, 64), M.hair, 0, 0.63, -0.08, head); hcap.scale.set(1.0, 0.74, 0.95);
  if (hairStyle === 'curly') {
    // big soft curls (see styles/refs/host_curly_hair_reference.png): a wide, smooth cloud of
    // large glossy blobs + a fringe row sitting just above the brows + side puffs over the ears
    const HM = mat(pal.hair, { roughness: 0.42, bumpScale: 0.08, clearcoat: 0.25, clearcoatRoughness: 0.5, sheen: 0.3 });
    const blob = (x, y, z, r, sx = 1, sy = 1, sz = 1) => { const m = mesh(sph(r, 48), HM, x, y, z, head); m.scale.set(sx, sy, sz); return m; };
    const hc = blob(0, 0.64, -0.06, 0.48, 1.02, 0.78, 0.98);           // under-layer cap
    // crown ring (back + sides), wider than the head for volume
    for (let i = 0; i < 11; i++) {
      const a = D(-160 + i * 32), r = 0.19 + (i % 2) * 0.025;
      blob(Math.sin(a) * 0.45, 0.66 + (i % 3) * 0.035, -0.06 + Math.cos(a) * -0.36, r);
    }
    // top layer
    for (const [x, y, z, r] of [[-0.2, 0.93, 0.02, 0.21], [0.05, 0.98, -0.02, 0.23], [0.27, 0.91, 0.0, 0.2], [-0.08, 0.92, -0.25, 0.22], [0.2, 0.9, -0.24, 0.2], [-0.32, 0.86, -0.15, 0.19], [0.36, 0.84, -0.14, 0.18]])
      blob(x, y, z, r);
    // fringe row: bottom edge ~y 0.64, just above the brows
    for (const [x, y, z, r] of [[-0.3, 0.76, 0.26, 0.15], [-0.12, 0.8, 0.33, 0.16], [0.07, 0.81, 0.34, 0.165], [0.25, 0.77, 0.28, 0.15], [0.4, 0.7, 0.17, 0.14], [-0.42, 0.7, 0.15, 0.14]])
      blob(x, y, z, r);
    // side puffs above the ears
    for (const sx of [-1, 1]) { blob(sx * 0.47, 0.55, -0.02, 0.15); blob(sx * 0.44, 0.47, -0.12, 0.12); }
  } else if (hairStyle !== 'quiff') {
    const HM = mat(pal.hair, { roughness: 0.42, bumpScale: 0.12, clearcoat: 0.25, clearcoatRoughness: 0.5, sheen: 0.3 });
    const blob = (x, y, z, r, sx = 1, sy = 1, sz = 1) => { const m = mesh(sph(r, 48), HM, x, y, z, head); m.scale.set(sx, sy, sz); return m; };
    if (hairStyle === 'buzz') { hcap.scale.set(1.0, 0.7, 0.96); hcap.position.y = 0.6; }
    else {
      blob(0, 0.66, -0.05, 0.49, 1.03, 0.76, 0.99);                                          // full crown
      // soft side-swept fringe (bottom edge stays above the brows, y ≈ 0.64)
      blob(-0.14, 0.79, 0.3, 0.2, 1.5, 0.55, 0.75).rotation.z = 0.18;
      blob(0.2, 0.77, 0.27, 0.17, 1.3, 0.5, 0.75).rotation.z = -0.25;
      for (const sx of [-1, 1]) blob(sx * 0.43, 0.6, -0.02, 0.15, 0.7, 1.1, 1);               // temples
    }
    if (hairStyle === 'bun') {
      blob(0, 1.05, -0.16, 0.21); blob(0, 0.93, -0.14, 0.13, 1.4, 0.6, 1.2);                 // top knot + wrap
    } else if (hairStyle === 'bob') {
      for (const sx of [-1, 1]) { blob(sx * 0.43, 0.36, -0.04, 0.2, 0.62, 1.55, 1.05); }        // chin-length sides
      blob(0, 0.42, -0.3, 0.42, 1.12, 0.95, 0.6);                                             // back
    } else if (hairStyle === 'long') {
      for (const sx of [-1, 1]) { blob(sx * 0.42, 0.25, -0.06, 0.18, 0.62, 2.3, 1.0); }         // long side locks past the shoulders
      const back = mesh(rbox(0.9, 1.0, 0.24, 0.12), HM, 0, 0.12, -0.3, head);
    } else if (hairStyle === 'ponytail') {
      blob(0, 0.72, -0.5, 0.11); const pt = mesh(cap(0.12, 0.42), HM, 0, 0.42, -0.6, head); pt.rotation.x = D(-18);
      blob(0, 0.16, -0.66, 0.13, 1, 1.2, 1);
    }
  } else {
    const quiff = mesh(sph(0.3, 64), M.hair, 0.03, 0.86, 0.1, head); quiff.scale.set(1.35, 0.62, 1.05); quiff.rotation.z = D(-6);
    const crown = mesh(sph(0.3, 64), M.hair, -0.02, 0.84, -0.12, head); crown.scale.set(1.3, 0.6, 1.1);
    for (const sx of [-1, 1]) { const side = mesh(sph(0.2), M.hair, sx * 0.3, 0.7, 0.02, head); side.scale.set(0.8, 0.9, 1.2); }
  }
  for (const s of [-1, 1]) { const sb = mesh(cap(0.035, 0.08), M.hair, s * 0.41, 0.5, 0.1, head); sb.rotation.z = s * D(8); }
  // face
  const eyes = [];
  for (const s of [-1, 1]) {
    const g = new THREE.Group(); g.position.set(s * 0.165, 0.43, 0.355); head.add(g);
    const w = mesh(sph(0.112), M.eye, 0, 0, 0, g); w.scale.set(1, 1.18, 0.62);
    const p = mesh(sph(0.058), M.pupil, s * -0.005, -0.008, 0.062, g); p.scale.set(1, 1.1, 0.5);
    mesh(sph(0.018, 16), M.glint, 0.022, 0.022, 0.09, g);
    eyes.push(g);
    const brow = mesh(cap(0.024, 0.11), M.hair, s * 0.17, 0.585, 0.4, head);
    brow.rotation.set(D(-12), 0, D(90) + s * D(-8));
    eyes.push(brow);
    const bl = mesh(sph(0.07, 24), M.blush, s * 0.25, 0.28, 0.35, head); bl.scale.set(1, 0.6, 0.3); bl.castShadow = false;
  }
  const nose = mesh(sph(0.058), M.skin, 0, 0.33, 0.43, head); nose.scale.set(1, 0.85, 0.8);
  if (look.lashes) for (const s of [-1, 1]) {
    for (let k = 0; k < 3; k++) { const l = mesh(cap(0.011, 0.045), M.pupil, s * (0.2 + k * 0.03), 0.535 - k * 0.012, 0.41 - k * 0.015, head); l.rotation.z = s * D(-50 - k * 18); l.castShadow = false; }
  }
  if (look.glasses) {
    const fm = new THREE.MeshPhysicalMaterial({ color: typeof look.glasses === 'string' ? look.glasses : '#1D1B1A', roughness: 0.3, clearcoat: 0.8 });
    for (const s of [-1, 1]) {
      const r = mesh(new THREE.TorusGeometry(0.135, 0.017, 12, 40), fm, s * 0.17, 0.43, 0.445, head); r.scale.set(1, 0.92, 1); r.castShadow = false;
      const arm = mesh(cap(0.014, 0.3), fm, s * 0.31, 0.45, 0.28, head); arm.rotation.x = Math.PI / 2; arm.castShadow = false;
    }
    const br = mesh(new THREE.TorusGeometry(0.04, 0.014, 8, 16, Math.PI), fm, 0, 0.44, 0.46, head); br.castShadow = false;
  }
  const mouthG = new THREE.Group(); mouthG.position.set(0, 0.19, 0.405); mouthG.rotation.x = D(-10); head.add(mouthG);
  const smile = mesh(new THREE.TorusGeometry(0.085, 0.016, 12, 32, Math.PI), M.mouth, 0, 0.03, 0, mouthG); smile.rotation.z = Math.PI;
  const open = mesh(sph(0.1, 32), M.mouth, 0, 0, -0.01, mouthG); open.scale.set(1, 0.3, 0.35);
  const teeth = mesh(rbox(0.12, 0.03, 0.03, 0.012), M.teeth, 0, 0.025, 0.02, mouthG);
  const tongue = mesh(sph(0.05, 24), M.tongue, 0, -0.03, 0.01, mouthG); tongue.scale.set(1.2, 0.5, 0.5);

  // arms
  function arm(s) {
    const sh = new THREE.Group(); sh.position.set(s * 0.34, 1.56, 0); body.add(sh);
    mesh(sph(0.115), M.shirt, 0, 0, 0, sh);
    mesh(cap(0.1, 0.3), M.shirt, 0, -0.2, 0, sh);
    const el = new THREE.Group(); el.position.y = -0.4; sh.add(el);
    mesh(sph(0.095), M.shirt, 0, 0, 0, el);
    mesh(cap(0.09, 0.26), M.shirt, 0, -0.17, 0, el);
    const cuff = mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.07, 24), M.shirtDark, 0, -0.32, 0, el);
    const wr = new THREE.Group(); wr.position.y = -0.36; el.add(wr);
    const hand = new THREE.Group(); hand.rotation.y = Math.PI; wr.add(hand); // palm (finger-curl side) faces the body at rest
    const palm = mesh(sph(0.1), M.skin, 0, -0.08, 0, hand); palm.scale.set(0.95, 1, 0.62);
    const fingers = [];
    [-0.05, -0.017, 0.017, 0.05].forEach((x, i) => {
      const f = new THREE.Group(); f.position.set(x * s, -0.155, 0.005); hand.add(f);
      mesh(cap(0.024, i === 0 || i === 3 ? 0.055 : 0.07), M.skin, 0, -0.045, 0, f);
      fingers.push(f);
    });
    const th = new THREE.Group(); th.position.set(s * -0.075, -0.07, -0.03); hand.add(th);
    mesh(cap(0.027, 0.06), M.skin, 0, -0.045, 0, th);
    return { sh, el, wr, hand, fingers, th, s };
  }
  const armL = arm(-1), armR = arm(1);
  // prop: a clay iPhone in the right hand, screen facing away from the palm (toward camera in the 'hold' pose)
  const phone = new THREE.Group();
  mesh(rbox(0.25, 0.48, 0.035, 0.045), mat('#1D1B1A', { roughness: 0.3, clearcoat: 0.8, bumpScale: 0 }), 0, 0, 0, phone);
  const sc = document.createElement('canvas'); sc.width = 256; sc.height = 512;
  (look.phoneScreen || pantrioScreen)(sc.getContext('2d'), 256, 512);
  const scr = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.44), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), toneMapped: false }));
  scr.position.z = 0.0185; phone.add(scr);
  // rigid grip: child of the right hand. Hand-local: fingers run along -y, the palm faces -z (after the hand flip).
  // Back of the phone sits just off the palm; the screen faces away from the palm.
  const grip = new THREE.Group(); grip.position.set(0, -0.31, -0.04); grip.scale.setScalar(0.82); armR.hand.add(grip);  // palm visible below the phone
  phone.rotation.set(Math.PI, 0, 0);       // screen → hand-local -z, phone 'up' → along the fingers
  grip.add(phone);
  phone.visible = false;
  return { root, body, torso, head, eyes, mouth: { smile, open, teeth, tongue }, armL, armR, props: { phone } };
}

// a generic app home screen for the clay phone prop (compositions pass their own via opts.phoneScreen)
function defaultPhoneScreen(g2, w, h, o = {}) {
  const hi = o.hi || '#FE8505', ink = o.ink || '#191715', paper = o.paper || '#F8F4F1', tint = o.tint || '#FFE2C4';
  g2.fillStyle = paper; g2.fillRect(0, 0, w, h);
  g2.fillStyle = hi; g2.fillRect(0, 0, w, 150);
  g2.fillStyle = ink; g2.font = '700 34px Inter, sans-serif'; g2.fillText(o.name || 'App', 22, 70);
  g2.font = '700 26px Inter, sans-serif'; (o.title || ['Hello', 'there']).slice(0, 2).forEach((t, i) => g2.fillText(t, 22, 112 + i * 28));
  for (const [y, c] of [[175, '#FFFFFF'], [290, '#FFFFFF'], [405, ink]]) { g2.fillStyle = c; g2.beginPath(); g2.roundRect(18, y, 220, 95, 18); g2.fill(); g2.strokeStyle = ink; g2.lineWidth = 5; g2.stroke(); }
  g2.fillStyle = tint; g2.fillRect(32, 190, 64, 64); g2.fillStyle = o.tint2 || '#DDEFD0'; g2.fillRect(32, 305, 64, 64);
  const L = o.labels || ['Get started', 'Explore', 'Open app'];
  g2.fillStyle = ink; g2.font = '700 22px Inter, sans-serif'; g2.fillText(L[0], 108, 230); g2.fillText(L[1], 108, 345);
  g2.fillStyle = hi; g2.fillText(L[2], 40, 462);
}
const pantrioScreen = (g2, w, h) => defaultPhoneScreen(g2, w, h, { name: 'Pantrio', title: ["What's for", 'dinner?'], labels: ['Snap fridge', 'Plan week', 'Start cooking'] });

function lerpPose(a, b, e) {
  const o = {};
  for (const side of ['L', 'R']) {
    o[side] = {};
    for (const k of ['out', 'fwd', 'bend', 'eout', 'twist']) o[side][k] = a[side][k] + (b[side][k] - a[side][k]) * e;
    o[side].hand = e < 0.5 ? a[side].hand : b[side].hand;
    o[side].handA = a[side].hand; o[side].handB = b[side].hand; o[side].handE = e;
  }
  o.head = a.head.map((v, i) => v + (b.head[i] - v) * e);
  o.shrug = a.shrug + (b.shrug - a.shrug) * e;
  return o;
}

function applyArm(arm, p) {
  const s = arm.s; // -1 viewer-left, +1 viewer-right
  arm.sh.rotation.set(D(-p.fwd), 0, s * D(p.out), 'XZY');
  arm.el.rotation.set(D(-p.bend), 0, s * D(p.eout), 'XZY');
  arm.wr.rotation.set(0, s * D(-p.twist) + s * D(-90), 0);
  const ha = HANDS[p.handA || p.hand], hb = HANDS[p.handB || p.hand], e = p.handE ?? 1;
  arm.fingers.forEach((f, i) => { f.rotation.x = D(ha.f[i] + (hb.f[i] - ha.f[i]) * e); });
  const sp = ha.th[0] + (hb.th[0] - ha.th[0]) * e, cu = ha.th[1] + (hb.th[1] - ha.th[1]) * e;
  arm.th.rotation.set(D(cu), 0, s * D(-sp));
}

// ---------- public API ----------
const instances = [];
export function host3d(container, opts = {}) {
  if (typeof container === 'string') container = document.querySelector(container);
  const { gl, env } = renderer();
  const pal = Object.assign({}, DEFAULT, opts.palette || {});
  const variant = opts.variant || 'full';
  const w = container.clientWidth, h = container.clientHeight;
  const ss = opts.supersample || 1.5;
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(w * ss); canvas.height = Math.round(h * ss);
  canvas.style.cssText = 'width:100%;height:100%;display:block';
  container.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  const scene = new THREE.Scene();
  scene.environment = env;
  scene.environmentIntensity = 0.55;
  const ch = buildCharacter(pal, opts.hair || 'quiff', { glasses: opts.glasses, lashes: opts.lashes, phoneScreen: opts.phoneScreen });
  scene.add(ch.root);
  const key = new THREE.DirectionalLight('#FFF4E6', 2.3);
  key.position.set(-3, 5, 6); key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048); key.shadow.radius = 6; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
  Object.assign(key.shadow.camera, { left: -2, right: 2, top: 3.2, bottom: -0.5, near: 1, far: 15 });
  scene.add(key);
  const rim = new THREE.DirectionalLight('#FFFFFF', 1.1); rim.position.set(4, 3, -4); scene.add(rim);
  scene.add(new THREE.HemisphereLight('#FFFFFF', '#B8AFA0', 0.5));
  if (variant === 'full' && opts.floorShadow !== false) {
    // soft contact shadow: radial-gradient blob under the feet (no hard shadow-map edges)
    const c = document.createElement('canvas'); c.width = c.height = 128;
    const g = c.getContext('2d'), rg = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    rg.addColorStop(0, 'rgba(40,30,20,0.55)'); rg.addColorStop(0.5, 'rgba(40,30,20,0.22)'); rg.addColorStop(1, 'rgba(40,30,20,0)');
    g.fillStyle = rg; g.fillRect(0, 0, 128, 128);
    const blob = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.7), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false }));
    blob.rotation.x = -Math.PI / 2; blob.position.set(0, 0.002, 0.05); scene.add(blob);
  }
  const cam = new THREE.PerspectiveCamera(variant === 'bust' ? 20 : 17, w / h, 0.1, 50);
  if (variant === 'bust') { cam.position.set(0, 2.12, 5.2); cam.lookAt(0, 2.06, 0); }
  else { const fitH = 2.95 / (2 * Math.tan(D(cam.fov / 2))); cam.position.set(0, 1.45, Math.max(fitH, 1.2 / (Math.tan(D(cam.fov / 2)) * cam.aspect))); cam.lookAt(0, 1.38, 0); }

  const keys = [{ t: -1, pose: opts.pose || 'idle' }];
  const looks = [{ t: -1, deg: opts.turn || 0 }];
  const propWins = [];
  const waves = [];
  const seed = opts.seed || 1, blend = 0.42;

  function poseAt(t) {
    let i = 0;
    while (i + 1 < keys.length && keys[i + 1].t <= t) i++;
    const cur = POSES[keys[i].pose];
    if (i === 0) return lerpPose(cur, cur, 1);
    const p = Math.min(1, (t - keys[i].t) / blend);
    const e = p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
    return lerpPose(POSES[keys[i - 1].pose], cur, e);
  }

  function update(t) {
    const P = poseAt(t);
    const br = Math.sin(t * 2 * Math.PI / 3.6 + seed);
    const drift = Math.sin(t * 1.3 + seed * 2);
    for (const w of waves) if (t >= w.t0 && t < w.t1) {
      const ramp = Math.min(1, (t - w.t0) / 0.25, (w.t1 - t) / 0.25);
      P.R.eout += Math.sin((t - w.t0) * Math.PI * 2 * 2.1) * 20 * ramp;
    }
    P.L.out += drift * 1.5; P.R.out += drift * 1.5; P.L.bend += drift * 3; P.R.bend -= drift * 3;
    applyArm(ch.armL, P.L); applyArm(ch.armR, P.R);
    ch.body.position.y = br * 0.006;
    ch.torso.scale.set(1 + br * 0.006, 1 + br * 0.004, 1 + br * 0.006);
    ch.armL.sh.position.y = ch.armR.sh.position.y = 1.56 + P.shrug * 0.05;
    const [tilt, turn, roll] = P.head;
    ch.head.rotation.set(D(tilt + Math.sin(t * 0.8 + seed) * 1.5), D(turn + Math.sin(t * 0.6 + seed * 3) * 3), D(roll + Math.sin(t * 0.9 + seed) * 1.5));
    ch.body.rotation.y = D(Math.sin(t * 0.5 + seed) * 2);
    // look direction: body turns fully, head leads slightly (feels like he's choosing to look)
    let li = 0; while (li + 1 < looks.length && looks[li + 1].t <= t) li++;
    const lk = looks[li], lp = li > 0 ? looks[li - 1].deg : lk.deg, lu = li > 0 ? Math.min(1, (t - lk.t) / 0.45) : 1;
    const le = lu < 0.5 ? 4 * lu * lu * lu : 1 - Math.pow(-2 * lu + 2, 3) / 2;
    const turnDeg = lp + (lk.deg - lp) * le, headLead = (lk.deg - lp) * (Math.min(1, lu * 1.6) - le);
    ch.root.rotation.y = D(turnDeg);
    for (const k in ch.props) {
      const w = propWins.find((p) => p.name === k && t >= p.t0 && t < p.t1);
      ch.props[k].visible = !!w;
      if (w) { const u = Math.min(1, (t - w.t0) / 0.35, (w.t1 - t) / 0.25); ch.props[k].scale.setScalar(Math.max(0.001, u < 1 ? u * (1 + Math.sin(u * Math.PI) * 0.25) : 1)); }
    }
    ch.head.rotation.y += D(headLead * 0.6);

    // blink
    const period = 3.3, ph = (t + seed * 0.77) % period;
    const bt = 1.4 + Math.abs(Math.sin(Math.floor((t + seed * 0.77) / period) * 12.9898)) * 1.4;
    const b = ph > bt && ph < bt + 0.14 ? 1 - Math.sin(((ph - bt) / 0.14) * Math.PI) * 0.93 : 1;
    ch.eyes.forEach((g, i) => { if (i % 2 === 0) g.scale.y = b; });

    // talk
    let a = 0;
    const env = window.TIMING && TIMING.env;
    if (env && opts.talk !== false && (!opts.talkWhen || opts.talkWhen(t))) a = Math.min(1, (env[Math.floor(t * (TIMING.envFps || 30))] || 0) * 1.2);
    ch.mouth.open.scale.set(0.95 - a * 0.1, 0.12 + a * 0.55, 0.35);
    ch.mouth.open.visible = a > 0.04;
    ch.mouth.teeth.visible = a > 0.2;
    ch.mouth.tongue.visible = a > 0.35;
    ch.mouth.smile.visible = a < 0.3;
    ch.mouth.smile.scale.set(1, 1 - a, 1);
    ch.eyes.forEach((g, i) => { if (i % 2 === 1) g.position.y = 0.585 + a * 0.015; });
  }

  const inst = {
    container, canvas,
    render(t) {
      update(t);
      if (gl.domElement.width !== canvas.width || gl.domElement.height !== canvas.height) gl.setSize(canvas.width, canvas.height, false);
      gl.render(scene, cam);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(gl.domElement, 0, 0);
    },
  };
  instances.push(inst);
  MG.call(-1, 1e9, (p, t) => {
    // only render hosts whose scene is visible this frame
    if (getComputedStyle(container).visibility === 'hidden' || getComputedStyle(container).opacity === '0') return;
    inst.render(t);
  });
  return {
    canvas,
    pose(t, name) { if (!POSES[name]) throw new Error('unknown pose ' + name); keys.push({ t, pose: name }); keys.sort((a, b) => a.t - b.t); return this; },
    wave(t0, t1) { waves.push({ t0, t1 }); this.pose(t0 - 0.3, 'wave'); return this; },
    prop(name, t0, t1) { propWins.push({ name, t0, t1 }); return this; },   // e.g. h.prop('phone', t0, t1) with pose 'hold'
    look(t, deg) { looks.push({ t, deg }); looks.sort((a, b) => a.t - b.t); return this; },   // 0 = at camera, + = toward viewer-right
    renderNow(t) { inst.render(t); },
  };
}

export { POSES, renderer, clayNoise, defaultPhoneScreen };
window.MG.host3d = host3d;
window.MG.POSES3D = POSES;
