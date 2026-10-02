#!/usr/bin/env node
// Voiceover builder (free, offline): Kokoro neural TTS (or macOS `say`) -> per-line WAVs -> word timings -> vo.wav + timing.js
//
//   node vo.mjs <project-dir>
// Reads <project>/script.json:
//   { "engine": "kokoro", "voice": "af_heart", "speed": 1.0,   (say engine: "voice": "Samantha", "rate": 182) "lead": 0.6, "gap": 0.35, "tail": 1.5, "fps": 30,
//     "lines": [ { "id": "problem", "say": "Every meal app you've tried...", "pauseAfter": 0.5 } ] }
// Writes <project>/audio/vo.wav and <project>/timing.js (window.TIMING = { lines, env, envFps, duration }).
// Word timings come from whisper-cli (if a ggml model is found) else from a syllable-weighted estimate.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = path.resolve(process.argv[2] || '.');
const S = JSON.parse(fs.readFileSync(path.join(dir, 'script.json'), 'utf8'));
const SR = 48000, fps = S.fps || 30;
const here = path.dirname(fileURLToPath(import.meta.url));
// engine: "kokoro" (default, neural, local) or "say" (macOS built-in fallback)
const py = path.join(here, '.venv/bin/python');
const engine = S.engine || (fs.existsSync(py) && fs.existsSync(path.join(here, 'models/kokoro-v1.0.onnx')) ? 'kokoro' : 'say');
console.log(`TTS engine: ${engine}`);
const aud = path.join(dir, 'audio'), tmp = path.join(aud, 'lines');
fs.mkdirSync(tmp, { recursive: true });

const sh = (cmd, args, o = {}) => execFileSync(cmd, args, { maxBuffer: 1 << 30, ...o });
function findModel() {
  // $WHISPER_MODEL → the engine's own models/ (setup.sh downloads it) → a Homebrew-shipped model
  const c = [process.env.WHISPER_MODEL, path.join(here, 'models/ggml-small.en.bin'), path.join(here, 'models/ggml-base.en.bin'),
    '/opt/homebrew/share/whisper-cpp/ggml-base.en.bin', '/usr/local/share/whisper-cpp/ggml-base.en.bin'].filter(Boolean);
  return c.find((p) => fs.existsSync(p));
}
const model = findModel();
const hasWhisper = model && (() => { try { sh('which', ['whisper-cli']); return true; } catch { return false; } })();

function readPCM(file) {
  const raw = sh('ffmpeg', ['-v', 'error', '-i', file, '-f', 'f32le', '-ac', '1', '-ar', String(SR), '-']);
  return new Float32Array(raw.buffer, raw.byteOffset, raw.length / 4);
}
// trim leading/trailing silence so line starts are tight
function trim(x) {
  const th = 0.01; let a = 0, b = x.length - 1;
  while (a < b && Math.abs(x[a]) < th) a++;
  while (b > a && Math.abs(x[b]) < th) b--;
  return { pcm: x.slice(Math.max(0, a - 480), Math.min(x.length, b + 2400)), off: Math.max(0, a - 480) / SR };
}
const syl = (w) => Math.max(1, (w.toLowerCase().replace(/[^a-z]/g, '').match(/[aeiouy]+/g) || []).length);

const lines = {}, chunks = [];
let cursor = S.lead ?? 0.6;
for (const L of S.lines) {
  const raw = path.join(tmp, `${L.id}.raw.wav`), wav = path.join(tmp, `${L.id}.wav`);
  if (engine === 'kokoro') {
    const voice = L.voice || S.voice || 'af_heart', speed = L.speed || S.speed || 1.0;
    sh(py, [path.join(here, 'tts_kokoro.py'), voice, String(speed), raw, L.say], { stdio: ['ignore', 'ignore', 'pipe'] });
  } else {
    const voice = L.voice || S.voice || 'Samantha', rate = L.rate || S.rate || 182;
    sh('say', ['-v', voice, '-r', String(rate), '-o', raw.replace(/wav$/, 'aiff'), L.say]);
    sh('ffmpeg', ['-v', 'error', '-y', '-i', raw.replace(/wav$/, 'aiff'), raw]);
  }
  const { pcm } = trim(readPCM(raw));
  // write trimmed line wav (16k mono for whisper)
  sh('ffmpeg', ['-v', 'error', '-y', '-f', 'f32le', '-ar', String(SR), '-ac', '1', '-i', '-', '-ar', '16000', wav], { input: Buffer.from(pcm.buffer) });
  const dur = pcm.length / SR;
  const spoken = L.say.split(/\s+/).filter(Boolean);
  let words = null;
  if (hasWhisper) {
    try {
      sh('whisper-cli', ['-m', model, '-f', wav, '-ml', '1', '-sow', '-oj', '-of', wav.replace(/\.wav$/, ''), '-np'], { stdio: 'ignore' });
      const j = JSON.parse(fs.readFileSync(wav.replace(/\.wav$/, '.json'), 'utf8'));
      const ws = j.transcription.map((s) => ({ w: s.text.trim(), t: s.offsets.from / 1000, e: s.offsets.to / 1000 })).filter((s) => s.w);
      // pronunciation check: every scripted word should be heard back (invented brand names are the usual casualty)
      const nrm = (w) => w.toLowerCase().replace(/[^a-z0-9']/g, '');
      const heard = new Set(ws.map((x) => nrm(x.w))), missing = spoken.map(nrm).filter((w) => w && !heard.has(w));
      if (missing.length) console.warn(`  [pronunciation] ${L.id}: whisper heard "${ws.map((x) => x.w).join(' ')}" — not heard: ${missing.join(', ')}. Listen (afplay audio/lines/${L.id}.wav); if it's wrong, rephrase, respell in "say", or try another voice`);
      // align whisper tokens to script words when counts match; otherwise keep whisper's own tokens
      // counts match → take whisper times 1:1. Otherwise (whisper merged/misheard words) project the script
      // words onto whisper's character timeline so every script word still gets a sensible time.
      if (ws.length === spoken.length) words = ws.map((s, i) => ({ ...s, w: spoken[i] }));
      else {
        const clean = (w) => w.replace(/[^\p{L}\p{N}']/gu, '');
        const tl = []; let c = 0;
        for (const s of ws) { const n = Math.max(1, clean(s.w).length); tl.push({ c0: c, c1: c + n, t: s.t, e: s.e }); c += n; }
        const at = (pos) => { const k = tl.find((x) => pos <= x.c1) || tl[tl.length - 1]; const f = Math.min(1, Math.max(0, (pos - k.c0) / (k.c1 - k.c0))); return k.t + (k.e - k.t) * f; };
        const tot = spoken.reduce((a, w) => a + Math.max(1, clean(w).length), 0);
        let acc = 0;
        words = spoken.map((w) => { const n = Math.max(1, clean(w).length); const r = { w, t: at((acc / tot) * c), e: at(((acc + n) / tot) * c) }; acc += n; return r; });
        console.log(`  (${L.id}: whisper heard ${ws.length} words vs ${spoken.length} scripted — projected script words onto whisper timing)`);
      }
    } catch (e) { console.warn('whisper failed for', L.id, e.message); }
  }
  if (!words) {
    const tot = spoken.reduce((a, w) => a + syl(w) + 0.6, 0);
    let acc = 0.05;
    words = spoken.map((w) => { const d = ((syl(w) + 0.6) / tot) * (dur - 0.1); const r = { w, t: acc, e: acc + d }; acc += d; return r; });
  }
  const start = cursor;
  lines[L.id] = { start: +start.toFixed(3), end: +(start + dur).toFixed(3), text: L.say,
    words: words.map((w) => ({ w: w.w, t: +(start + w.t).toFixed(3), e: +(start + w.e).toFixed(3) })) };
  chunks.push({ at: start, pcm });
  cursor = start + dur + (L.pauseAfter ?? S.gap ?? 0.35);
  console.log(`${L.id.padEnd(14)} ${start.toFixed(2)}s  +${dur.toFixed(2)}s  ${hasWhisper ? 'whisper' : 'estimate'}`);
}
const duration = +(cursor + (S.tail ?? 1.5)).toFixed(2);

// mix into one buffer + per-frame mouth envelope
const out = new Float32Array(Math.ceil(duration * SR));
for (const c of chunks) out.set(c.pcm, Math.round(c.at * SR));
const n = Math.ceil(duration * fps), hop = SR / fps, env = new Array(n).fill(0);
let peak = 0;
for (let i = 0; i < n; i++) {
  let s = 0; const a = Math.floor(i * hop), b = Math.min(out.length, Math.floor((i + 1) * hop));
  for (let k = a; k < b; k++) s += out[k] * out[k];
  env[i] = Math.sqrt(s / Math.max(1, b - a)); peak = Math.max(peak, env[i]);
}
for (let i = 0; i < n; i++) env[i] = +(Math.min(1, env[i] / (peak * 0.6)) ** 0.8).toFixed(2);
sh('ffmpeg', ['-v', 'error', '-y', '-f', 'f32le', '-ar', String(SR), '-ac', '1', '-i', '-', path.join(aud, 'vo.wav')], { input: Buffer.from(out.buffer) });

fs.writeFileSync(path.join(dir, 'timing.js'),
  `// generated by vo.mjs — do not edit\nwindow.TIMING = ${JSON.stringify({ duration, envFps: fps, lines, env })};\n`);
console.log(`\nvo.wav + timing.js written — total ${duration}s`);
