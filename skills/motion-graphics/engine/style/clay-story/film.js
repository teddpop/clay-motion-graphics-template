/* Clay Story film bootstrap: reads window.VIDEO (video.json → video.js), TIMING (vo.mjs), MUSIC (compose.py),
 * builds the style layer, then runs the Director's scene list in order. The film is whatever video.json "scenes" says;
 * this file knows nothing about any story.
 */
import '../../host3d.js';
import '../../clay3d.js';
import '../../props/food.js';
import '../../props/finance.js';
import '../../props/office.js';
import '../../props/fitness.js';
import '../../props/home.js';
import '../../props/ui.js';
import { makeStyle } from './style.js';
import { SCENES } from '../../scenes/index.js';

await document.fonts.ready;
const V = window.VIDEO;
MG.setup({ width: 1920, height: 1080, fps: 30, duration: TIMING.duration });
const S = makeStyle(V);
const list = V.scenes.map((sc, i) => ({ ...sc, i }));
list.forEach((sc, i) => {
  if (!SCENES[sc.scene]) throw new Error(`clay-story: unknown scene "${sc.scene}" (scenes/index.js has: ${Object.keys(SCENES).join(', ')})`);
  if (!sc.lines?.length) throw new Error(`clay-story: scene ${i} (${sc.scene}) has no lines`);
  sc.t0 = i === 0 ? 0 : MG.line(sc.lines[0]).start - (sc.lead ?? SCENES[sc.scene].lead ?? 0.35);
});
list.forEach((sc, i) => Object.assign(sc, { t1: list[i + 1]?.t0 ?? TIMING.duration, prev: list[i - 1], next: list[i + 1], isFirst: i === 0, isLast: i === list.length - 1 }));
for (const sc of list) SCENES[sc.scene].build(S, sc);
S.compile();
window.STORY = { S, scenes: list };
if (V.custom) await import(new URL(V.custom, location.href).href);
window.__ready = true;
