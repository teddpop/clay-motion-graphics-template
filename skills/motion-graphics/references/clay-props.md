# Clay props: packs, the problem-object contract, and authoring rules

All subject art is Three.js geometry (including a physical product itself: `video.json product.object`) in the same clay material as the mascot. Nothing is downloaded or generated
by an image model.

## Packs (`engine/props/*.js`, all loaded by the Clay Story style)
| Pack | Props | Container |
|---|---|---|
| `food` | tomato, egg, eggWhole, avocado, carrot, broccoli, lemon, chili, mushroom, riceBowl, pan, plate, milk, herb, garlic, cheese, pepper, cabbage, riceTub, steam | `fridge` |
| `finance` | coin, coinStack, piggyBank, card, receipt, cash, coffee, appTile, chartBars | `wallet` |
| `office` | laptop, mug, stickyNote, paperStack, plant, envelope, calendarPad, pencil, clock | `inboxTray` |
| `fitness` | dumbbell, kettlebell, bottle, sneaker, apple, stopwatch, medal, heartRate | `gymBag` |
| `home` | sensorPuck (smart device), pipe, waterDrop, valve, suitcase, umbrella, sun, moon, cloud, sofa, lamp, key, palm, towel | `house` |
| `ui` (any domain) | pin, star, heart, check, bell, bulb, chatBubble, magnifier, lock, gear, sparkle, phone | `giftBox` |

Preview: `node engine/render.mjs engine/test/props.html --stills 1 --outdir engine/test/props --query pack=finance,ui`.
Factories take options, e.g. `card({ color, label, number })`, `appTile({ color, glyph: 'play'|'note'|'A' })`,
`receipt({ title, total })`, `stickyNote({ color, text })`, `calendarPad({ day })`. In `video.json`: `{ "prop": "card", "opts": { … } }`.

## Problem-object contract (the opening scene works with any container)
```js
obj.userData.open = (u) => { /* 0 closed → 1 open; small negatives are used for the anticipation */ };
obj.userData.slots = [{ pos: [x, y, z], size, spread? }, …];   // local resting spots, object units (~1 across)
```
Items listed in a `problem-object` scene's `items` sit at `slots[item.slot]` in the object's **local space** (so they rest on shelves or in
pockets with no clipping), float out as they're named, and continue into the story. `count > 1` spreads copies along x by
`spread`. The dread FX is placed from the object's projected bounding box automatically.

## Writing a new prop (do this whenever the product needs one that doesn't exist)
1. Add it to the most fitting pack (or create `engine/props/<domain>.js` and import it in `engine/style/clay-story/film.js`).
2. Use only `mat()` (clay material), rounded primitives (`sph`, `cap`, `rbox`, `cyl`, lathe/extrude with bevels) and
   `decal()` for printed labels. About **1 world unit across**, centred on the origin, readable face toward **+z**.
3. Chunky and simple: 3–10 parts, soft bevels, saturated but not neon colours, a darker accent for depth.
4. Containers: hinge group for the lid/door + `userData.open` + 3 `slots` (two big, one small with `spread`).
5. Preview it in `engine/test/props.html` before using it in a film, and look at the PNG.

## Gotchas
- Face-forward items (egg, lemon, coin, card) need a `tilt` and integer `spin` so they land facing the camera.
- Objects pushed toward the camera (z > 0) are enlarged and shifted by perspective (K = 20 / (20 − z)); the template
  pre-compensates with `unz`. Do the same in custom code.
- Keep orbits below the mascot's face (chest height).
- Props in hands are parented rigidly to the hand (see `host3d.js` phone grip), never placed next to it in screen space.
- Containers get a fixed rest transform (no idle wobble) so items inside stay put.
- Z-order is DOM order: `#stBack` (behind the phone) and `#stFront` (in front) sandwich the phone for orbits.
