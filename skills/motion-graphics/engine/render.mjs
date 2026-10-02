#!/usr/bin/env node
// Frame-exact renderer: headless Chrome (playwright-core) -> JPEG frames -> ffmpeg.
//
//   node render.mjs <composition.html> --out video.mp4 [--workers 4] [--from 0 --to 12] [--scale 1]
//   node render.mjs <composition.html> --stills 1.5,4,9.2 --outdir review/   (PNG stills for self-review)
//   node render.mjs <composition.html> --cues cues.json                        (dump sfx cues + meta only)
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const file = path.resolve(args[0]);
const opt = (k, d) => { const i = args.indexOf('--' + k); return i >= 0 ? args[i + 1] : d; };
const workers = +opt('workers', 4);
const scale = +opt('scale', 1);

function run(cmd, a, stdin) {
  return new Promise((res, rej) => {
    const p = spawn(cmd, a, { stdio: [stdin ? 'pipe' : 'ignore', 'ignore', 'pipe'] });
    let err = '';
    p.stderr.on('data', (d) => (err += d));
    p.on('close', (c) => (c === 0 ? res() : rej(new Error(`${cmd} exited ${c}\n${err.slice(-2000)}`))));
    if (stdin) stdin(p);
  });
}

async function openPage(browser, meta) {
  const page = await browser.newPage({ viewport: { width: meta?.width || 1920, height: meta?.height || 1080 }, deviceScaleFactor: scale });
  page.on('pageerror', (e) => console.error('[page error]', e.message));
  page.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') console.error('[page]', m.text()); });
  await page.goto(pathToFileURL(file).href + (opt("query") ? "?" + opt("query") : ""));
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => window.__ready !== false, null, { timeout: 60000 });
  await page.evaluate(() => window.__setTime(0));
  return page;
}

// Metal ANGLE gives fast, stable WebGL on macOS; elsewhere let Chrome pick (GPU or SwiftShader).
const gpu = process.platform === 'darwin' ? ['--use-angle=metal'] : ['--enable-unsafe-swiftshader'];
const browser = await chromium.launch({ channel: process.env.MG_CHROME_CHANNEL || 'chrome', args: ['--disable-gpu-vsync', '--force-color-profile=srgb', '--allow-file-access-from-files', ...gpu, '--ignore-gpu-blocklist'] });
try {
  const probe = await openPage(browser);
  const meta = await probe.evaluate(() => ({ ...MG.meta }));
  const sfx = await probe.evaluate(() => MG.sfxList);
  const short = await probe.evaluate(() => (MG.captionReport ? MG.captionReport(1.2) : []));
  for (const c of short) console.warn(`[legibility] "${c.text}" is fully readable for only ${c.hold}s (min 1.2s) — reveal earlier or hold longer`);

  if (opt('cues')) {
    fs.writeFileSync(opt('cues'), JSON.stringify({ meta, sfx }, null, 1));
    console.log(`cues: ${sfx.length} sfx, duration ${meta.duration}s`);
  } else if (opt('stills')) {
    const outdir = path.resolve(opt('outdir', path.join(path.dirname(file), 'review')));
    fs.mkdirSync(outdir, { recursive: true });
    for (const s of opt('stills').split(',').map(Number)) {
      await probe.evaluate((t) => window.__setTime(t), s);
      const f = path.join(outdir, `still_${s.toFixed(2).padStart(6, '0')}.png`);
      await probe.screenshot({ path: f });
      console.log(f);
    }
  } else {
    const out = path.resolve(opt('out', path.join(path.dirname(file), 'out', 'video.mp4')));
    fs.mkdirSync(path.dirname(out), { recursive: true });
    const fps = meta.fps;
    const f0 = Math.round(+opt('from', 0) * fps);
    const f1 = Math.round(+opt('to', meta.duration) * fps);
    const total = f1 - f0;
    const n = Math.max(1, Math.min(workers, Math.ceil(total / 30)));
    const per = Math.ceil(total / n);
    const tmp = path.join(path.dirname(out), '.segments');
    fs.mkdirSync(tmp, { recursive: true });
    let done = 0;
    const t0 = Date.now();
    const pages = [probe, ...(await Promise.all(Array.from({ length: n - 1 }, () => openPage(browser, meta))))];
    await Promise.all(pages.map(async (page, w) => {
      const a = f0 + w * per, b = Math.min(f1, a + per);
      const seg = path.join(tmp, `seg_${w}.mp4`);
      await run('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-framerate', String(fps), '-c:v', 'mjpeg', '-i', '-',
        '-c:v', 'libx264', '-preset', 'medium', '-crf', '16', '-pix_fmt', 'yuv420p', '-r', String(fps), seg], async (p) => {
        for (let fr = a; fr < b; fr++) {
          await page.evaluate((t) => window.__setTime(t), fr / fps);
          const buf = await page.screenshot({ type: 'jpeg', quality: 94 });
          if (!p.stdin.write(buf)) await new Promise((r) => p.stdin.once('drain', r));
          if (++done % 60 === 0) process.stdout.write(`\r  frames ${done}/${total}  (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
        }
        p.stdin.end();
      });
    }));
    const list = path.join(tmp, 'list.txt');
    fs.writeFileSync(list, pages.map((_, w) => `file 'seg_${w}.mp4'`).join('\n'));
    const audio = opt('audio');
    const final = ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list];
    if (audio) final.push('-ss', String(f0 / fps), '-i', path.resolve(audio), '-map', '0:v', '-map', '1:a', '-c:a', 'aac', '-b:a', '192k', '-shortest');
    final.push('-c:v', 'copy', '-movflags', '+faststart', out);
    await run('ffmpeg', final);
    fs.rmSync(tmp, { recursive: true, force: true });
    console.log(`\n  wrote ${out}  (${total} frames, ${((Date.now() - t0) / 1000).toFixed(1)}s)`);
  }
} finally {
  await browser.close();
}
