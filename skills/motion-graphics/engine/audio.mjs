#!/usr/bin/env node
// Procedural music bed + UI sound effects + final mix (no samples, no licenses).
//
//   node audio.mjs <project-dir> [--bpm 104] [--key F] [--music 0.22]
// Inputs: <project>/audio/vo.wav (optional), <project>/cues.json (from render.mjs --cues)
// Output: <project>/audio/mix.wav
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const dir = path.resolve(process.argv[2] || '.');
const args = process.argv.slice(3);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const SR = 48000;
const cues = JSON.parse(fs.readFileSync(path.join(dir, 'cues.json'), 'utf8'));
const dur = cues.meta.duration;
const N = Math.ceil(dur * SR);
const sh = (c, a, o = {}) => execFileSync(c, a, { maxBuffer: 1 << 30, ...o });

// deterministic PRNG for noise
let seed = 1234567;
const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296) * 2 - 1;

// ---------- music ----------
const bpm = +opt('bpm', 104), beat = 60 / bpm;
const NOTES = { C: 0, 'C#': 1, D: 2, Eb: 3, E: 4, F: 5, 'F#': 6, G: 7, Ab: 8, A: 9, Bb: 10, B: 11 };
const root = 48 + NOTES[opt('key', 'F')]; // MIDI
const hz = (m) => 440 * Math.pow(2, (m - 69) / 12);
// I – vi – IV – V  (add9 colours), 1 bar each
const prog = [[0, 4, 7, 14], [-3, 0, 4, 11], [-7, -3, 0, 7], [-5, -1, 2, 9]];
const L = new Float32Array(N), R = new Float32Array(N);

function add(buf, at, len, fn, gain = 1) {
  const a = Math.max(0, Math.round(at * SR)), b = Math.min(N, a + Math.round(len * SR));
  for (let i = a; i < b; i++) buf[i] += fn((i - a) / SR) * gain;
}
const both = (at, len, fn, g, pan = 0) => { add(L, at, len, fn, g * (1 - Math.max(0, pan))); add(R, at, len, fn, g * (1 + Math.min(0, pan))); };

const bars = Math.ceil(dur / (beat * 4));
for (let bar = 0; bar < bars; bar++) {
  const t0 = bar * beat * 4, ch = prog[bar % 4];
  // soft pad (detuned sines, slow attack)
  for (const iv of ch.slice(0, 3)) {
    const f = hz(root + iv);
    both(t0, beat * 4.2, (t) => {
      const env = Math.min(1, t / 0.6) * Math.min(1, (beat * 4.2 - t) / 0.5);
      return env * (Math.sin(2 * Math.PI * f * t) + 0.5 * Math.sin(2 * Math.PI * f * 1.003 * t)) * 0.5;
    }, 0.05);
  }
  // bass on 1 and the "and" of 2
  for (const [bt, len] of [[0, 1.4], [1.5, 1], [2.5, 1.4]]) {
    const f = hz(root - 12 + ch[0]);
    both(t0 + bt * beat, len * beat, (t) => Math.exp(-t * 3) * Math.min(1, t / 0.01) * Math.sin(2 * Math.PI * f * t + 0.6 * Math.sin(2 * Math.PI * f * t)), 0.16);
  }
  // pluck arpeggio, 8ths, alternating pan
  const arp = [ch[0], ch[1], ch[2], ch[3], ch[2], ch[1], ch[3], ch[2]];
  arp.forEach((iv, k) => {
    const f = hz(root + 12 + iv);
    both(t0 + k * beat / 2, 0.5, (t) => Math.exp(-t * 9) * (Math.sin(2 * Math.PI * f * t) + 0.3 * Math.sin(4 * Math.PI * f * t)) * Math.min(1, t / 0.003), 0.07, k % 2 ? 0.35 : -0.35);
  });
  // kick on 1, 3 ; clap on 2, 4 ; shaker 8ths
  for (let b = 0; b < 4; b++) {
    const tb = t0 + b * beat;
    if (b % 2 === 0) both(tb, 0.3, (t) => Math.exp(-t * 14) * Math.sin(2 * Math.PI * (48 + 90 * Math.exp(-t * 30)) * t), 0.32);
    else both(tb, 0.18, (t) => Math.exp(-t * 28) * rnd(), 0.05);
    for (const h of [0, 0.5]) both(tb + h * beat, 0.05, (t) => Math.exp(-t * 90) * rnd(), h ? 0.03 : 0.018, h ? 0.2 : -0.2);
  }
}
// composed music (compose.py → FluidSynth) replaces the procedural bed when present
const musicFile = path.join(dir, 'audio', 'music.wav');
if (fs.existsSync(musicFile) && !args.includes('--synth')) {
  L.fill(0); R.fill(0);
  const raw = sh('ffmpeg', ['-v', 'error', '-i', musicFile, '-f', 'f32le', '-ac', '2', '-ar', String(SR), '-']);
  const m = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4);
  let pk = 0; for (let i = 0; i < m.length; i++) pk = Math.max(pk, Math.abs(m[i]));
  const g = 0.55 / (pk || 1);
  for (let i = 0; i < N && 2 * i + 1 < m.length; i++) { L[i] = m[2 * i] * g; R[i] = m[2 * i + 1] * g; }
  console.log('using composed music.wav');
}
// intro/outro fades
for (let i = 0; i < N; i++) {
  const t = i / SR, g = Math.min(1, t / 1.2, (dur - t) / 2.0);
  L[i] *= Math.max(0, g); R[i] *= Math.max(0, g);
}

// ---------- duck under VO ----------
let vo = null;
const voFile = path.join(dir, 'audio', 'vo.wav');
if (fs.existsSync(voFile)) {
  const raw = sh('ffmpeg', ['-v', 'error', '-i', voFile, '-f', 'f32le', '-ac', '1', '-ar', String(SR), '-']);
  vo = new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4);
  let e = 0;
  for (let i = 0; i < N; i++) {
    const x = Math.abs(vo[i] || 0);
    e = x > e ? e + (x - e) * 0.01 : e + (x - e) * 0.00008; // fast attack, slow release
    const g = 1 - Math.min(0.55, e * 4);
    L[i] *= g; R[i] *= g;
  }
}
const musicGain = +opt('music', 0.8);
for (let i = 0; i < N; i++) { L[i] *= musicGain; R[i] *= musicGain; }

// ---------- sfx ----------
const SFX = {
  pop: (t) => Math.exp(-t * 45) * Math.sin(2 * Math.PI * (600 + 500 * Math.exp(-t * 50)) * t) * 0.35,
  tick: (t) => Math.exp(-t * 200) * Math.sin(2 * Math.PI * 2200 * t) * 0.3,
  tap: (t) => Math.exp(-t * 90) * (Math.sin(2 * Math.PI * 1200 * t) * 0.5 + Math.sin(2 * Math.PI * 1800 * t) * 0.25),
  whoosh: (() => { let lp = 0; return (t) => { const c = 0.015 + 0.12 * Math.sin(Math.PI * Math.min(1, t / 0.5)); lp += (rnd() - lp) * c; return lp * Math.sin(Math.PI * Math.min(1, t / 0.5)) * 0.35; }; })(),
  thunk: (t) => Math.exp(-t * 22) * Math.sin(2 * Math.PI * (60 + 120 * Math.exp(-t * 25)) * t) * 0.7 + Math.exp(-t * 60) * rnd() * 0.15,
  ding: (t) => Math.exp(-t * 4) * (Math.sin(2 * Math.PI * 1318.5 * t) + 0.5 * Math.sin(2 * Math.PI * 1975.5 * t)) * 0.16,
  chime: (t) => [1046.5, 1318.5, 1568, 2093].reduce((a, f, k) => a + (t > k * 0.07 ? Math.exp(-(t - k * 0.07) * 3.5) * Math.sin(2 * Math.PI * f * (t - k * 0.07)) : 0), 0) * 0.09,
  shutter: (t) => (t < 0.012 || (t > 0.07 && t < 0.085) ? rnd() * 0.5 : 0) + Math.exp(-t * 120) * Math.sin(2 * Math.PI * 900 * t) * 0.2,
  sizzle: (() => { let hp = 0, prev = 0; return (t) => { const n = rnd(); hp = 0.9 * (hp + n - prev); prev = n; const crackle = rnd() > 0.995 ? rnd() * 0.6 : 0; return (hp * 0.06 + crackle) * Math.min(1, t / 0.2, (2.2 - t) / 0.4); }; })(),
  error: (t) => Math.exp(-t * 10) * Math.sign(Math.sin(2 * Math.PI * 180 * t)) * 0.06 * (t < 0.09 || (t > 0.13 && t < 0.22) ? 1 : 0),
};
const LEN = { pop: 0.2, tick: 0.05, tap: 0.08, whoosh: 0.55, thunk: 0.35, ding: 1.0, chime: 1.2, shutter: 0.15, sizzle: 2.2, error: 0.3 };
for (const c of cues.sfx) {
  const fn = SFX[c.name]; if (!fn) { console.warn('unknown sfx', c.name); continue; }
  both(c.t, LEN[c.name], fn, 0.55 * (c.gain ?? 1));
}

// ---------- mix ----------
const inter = new Float32Array(N * 2);
let peak = 0;
for (let i = 0; i < N; i++) {
  const v = vo ? vo[i] || 0 : 0;
  inter[2 * i] = L[i] + v; inter[2 * i + 1] = R[i] + v;
  peak = Math.max(peak, Math.abs(inter[2 * i]), Math.abs(inter[2 * i + 1]));
}
const norm = peak > 0.89 ? 0.89 / peak : 1;
for (let i = 0; i < inter.length; i++) inter[i] = Math.tanh(inter[i] * norm * 1.1) / Math.tanh(1.1);
sh('ffmpeg', ['-v', 'error', '-y', '-f', 'f32le', '-ar', String(SR), '-ac', '2', '-i', '-', '-af', 'loudnorm=I=-16:TP=-1.5:LRA=11', '-ar', String(SR), path.join(dir, 'audio', 'mix.wav')], { input: Buffer.from(inter.buffer) });
console.log(`mix.wav written (${dur}s, ${cues.sfx.length} sfx)`);
