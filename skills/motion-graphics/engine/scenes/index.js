/* Scene library. A scene is one storytelling move; the Director composes a film from them in video.json "scenes".
 * Contract (see references/scenes.md):
 *   export default { name, about, params, build(S, sc) }
 *   S  = the style layer (style/<style>/style.js)    sc = the scene's params + { t0, t1, lines, i, prev, next, isFirst, isLast }
 *   t0 = first line start − lead (0 for the first scene), t1 = next scene's t0. Derive every time from S.at(line, cue).
 * Add a scene: write scenes/<name>.js with the same shape and register it here.
 */
import statement from './statement.js';
import problemObject from './problem-object.js';
import clutter from './clutter.js';
import duo from './duo.js';
import idea from './idea.js';
import productHero from './product-hero.js';
import device from './device.js';
import vignette from './vignette.js';
import shield from './shield.js';
import stat from './stat.js';
import end from './end.js';

export const SCENES = Object.fromEntries([statement, problemObject, clutter, duo, idea, productHero, device, vignette, shield, stat, end].map((s) => [s.name, s]));
