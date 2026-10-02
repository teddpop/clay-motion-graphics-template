#!/usr/bin/env node
// Scaffold a project:   node new-project.mjs <slug> [--from <example name>|<path/to/video.json>] [--dir <projects folder>]
//   creates <projects folder>/<slug>/ (default ./projects) with a video.json copied from examples/ for the Director to
//   rewrite completely (the example is a format reference, not a story to reuse), then runs spec.mjs.
//   New version of an existing film = new slug (keep every prior render).
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const [slug, ...rest] = process.argv.slice(2);
if (!slug) { console.error('usage: node new-project.mjs <slug> [--from example|pantrio|file]'); process.exit(1); }
const opt = (k, d) => (rest.includes('--' + k) ? rest[rest.indexOf('--' + k) + 1] : d);
const from = opt('from', 'pantrio');
const projects = path.resolve(opt('dir', 'projects'));
const dir = path.join(projects, slug);
if (fs.existsSync(path.join(dir, 'video.json'))) { console.error(`${dir}/video.json exists — pick a new slug (e.g. ${slug}-v2); prior versions are kept`); process.exit(1); }
fs.mkdirSync(dir, { recursive: true });
const ex = path.join(here, '../examples', `${from}.video.json`);
const src = fs.existsSync(ex) ? ex : path.resolve(from);
fs.copyFileSync(src, path.join(dir, 'video.json'));
execFileSync(process.execPath, [path.join(here, 'spec.mjs'), dir], { stdio: 'inherit' });
console.log(`\nscaffolded ${dir}\nnext: rewrite video.json for the new product → approval package → node engine/vo.mjs ${dir} → node engine/build.mjs ${dir} --skip-vo --stills …`);
