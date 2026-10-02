#!/usr/bin/env node
// One-shot pipeline:  node build.mjs <project-dir> [--skip-vo] [--skip-music] [--workers 4] [--from s --to s] [--stills 1,2,3]
//   0. spec.mjs     video.json  -> video.js + script.json + composition.html   (spec-driven projects)
//   1. vo.mjs       script.json -> audio/vo.wav + timing.js
//   2. compose.py               -> audio/music.wav + music.js   (drop/hit derived from the VO + scenes)
//   3. render.mjs   --cues      -> cues.json (sfx cue list + duration; prints [legibility] + cue warnings)
//   4. audio.mjs                -> audio/mix.wav (music + sfx + VO)
//   5. render.mjs               -> out/<name>.mp4         (--stills: review PNGs instead of the MP4)
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dir = path.resolve(process.argv[2]);
const args = process.argv.slice(3);
const has = (k) => args.includes('--' + k);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const node = (script, a) => execFileSync(process.execPath, [path.join(here, script), ...a], { stdio: 'inherit' });

const comp = path.join(dir, 'composition.html');
const vj = path.join(dir, 'video.json');
if (fs.existsSync(vj)) node('spec.mjs', [dir]);
if (!has('skip-vo') && fs.existsSync(path.join(dir, 'script.json'))) node('vo.mjs', [dir]);

if (fs.existsSync(vj) && !has('skip-music')) {
  const V = JSON.parse(fs.readFileSync(vj, 'utf8'));
  const win = {}; new Function('window', fs.readFileSync(path.join(dir, 'timing.js'), 'utf8'))(win);
  const T = win.TIMING, norm = (s) => s.toLowerCase().replace(/[^a-z0-9']/g, '');
  const cue = (id, w) => { const L = T.lines[id]; if (typeof w === 'number') return L.start + w; const x = L.words.find((q) => norm(q.w) === norm(w)); return x ? x.t : L.start; };
  // hit = the end scene's first (brand) line; drop = music.drop cue, else the first step/scene marked drop: true, else the idea line
  const endSc = V.scenes.findLast((x) => x.scene === 'end'), hitT = T.lines[endSc.brand || endSc.lines[0]].start;
  const steps = V.scenes.flatMap((x) => (x.steps || []).map((st) => ({ ...st })).concat(x.drop ? [{ line: x.lines[0], at: x.dropAt ?? 0.3 }] : []));
  const ds = V.music?.drop ? { line: V.music.drop[0], at: V.music.drop[1] } : steps.find((x) => x.drop) || { line: (V.scenes.find((x) => x.scene === 'idea') || V.scenes[1]).lines[0], at: 0.5 };
  const drop = ds.screenAt != null ? cue(ds.line, ds.screenAt) : cue(ds.line, ds.at ?? 0);
  const m = V.music || {};
  execFileSync('python3', [path.join(here, 'compose.py'), dir, '--duration', String(T.duration), '--hit', String(hitT),
    '--drop', drop.toFixed(2), '--key', m.key || 'G', '--bpm-near', String(m.bpmNear || 96)], { stdio: 'inherit' });
}

node('render.mjs', [comp, '--cues', path.join(dir, 'cues.json')]);
node('audio.mjs', [dir, ...(opt('bpm') ? ['--bpm', opt('bpm')] : []), ...(opt('key') ? ['--key', opt('key')] : [])]);
if (opt('stills')) { node('render.mjs', [comp, '--stills', opt('stills'), '--outdir', path.join(dir, 'review')]); process.exit(0); }
const out = path.join(dir, 'out', `${path.basename(dir)}.mp4`);
const r = ['--out', out, '--audio', path.join(dir, 'audio', 'mix.wav'), '--workers', opt('workers', '4')];
if (opt('from')) r.push('--from', opt('from'));
if (opt('to')) r.push('--to', opt('to'));
node('render.mjs', [comp, ...r]);
