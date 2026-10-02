# Scene library

A film is `video.json` → `scenes`: an ordered list. Each scene covers 1–4 VO lines (`lines`) and runs from just before its
first line until the next scene starts. One continuous shot: the style layer carries the hero device or product,
captions, background colour and the narrator bubble across scenes. Every time is a cue: `"word"` (as spoken),
a number (seconds after the line starts), or `["word", offset]`.

Params common to all scenes: `lines` (required), `lead` (seconds before the first line the scene starts; defaults per
scene), `bg` (background change: `paper | hi | hi2 | warm | tint | #hex`).

| Scene | Use it for | Key params |
|---|---|---|
| `statement` | Hooks, truths, turns. Big kinetic type, optional prop beside it | `caption hi slot big bigAt captions[] prop{prop,at,size,motion: float/drop/pile/spin} pose look` |
| `problem-object` | The problem lives in a container with contents (fridge, wallet, inbox tray, gym bag, house) | `object at size turn big bigAt caption openAt dreadAt qAt items[{prop,label,named,slot,count,variants,size}]` |
| `clutter` | Overload: too many meetings, bills, tabs, notes; dread over the pile, then poof, stack or sweep | `props[{prop,count,variants,size}] area caption big resolve resolveAt dreadAt qAt pose` |
| `duo` | Value between people: bubbles, names, place/time, sun/moon; messages arc (or get lost) | `people[{who,label,place,sky,at}] messages{prop,miss,every} caption dread qAt poses[[who,line,cue,pose]]` |
| `idea` | Introduce the product with the product: wipe, mascot full-body, device peeks in or product rises | `kicker caption hi appAt screen reveal(device/product/none) hold(phone/none) burstAt who pose` |
| `product-hero` | Physical products: rise, slow turn, labelled callouts | `at size callouts[{text,at,anchor,side,dist}] kicker caption bg` |
| `device` | The product working on the phone or laptop, one step per line | `steps[{line,screen,caption,interaction,…}]` (see below) |
| `vignette` | Life moments: mascot full-body in a set of props; optional "meanwhile" inset; optional notification | `set[{prop,at,size,motion}] at pose poses hold inset{prop,at,r,label,drip,dreadAt,qAt} notify{title,text,at,pos} caption` |
| `shield` | Protection: a dome forms around the hero, threats bounce off | `at size radius domeAt threats{prop,count,size} target caption` |
| `stat` | Proof as a number counting up, props popping away or in | `value from prefix suffix label at props{prop,count} mode(away/in)` |
| `end` | Always last: brand name, tagline, CTA, mascot beside the hero, orbit | `brand tagline cta taglineText hi button url screen hero orbit` |

### `device` steps
`{ line, screen, caption, hi, interaction, at, screenAt, drop, lead, bg, pose, poses, look, badgeAt, dingAt, moveAt, toastAt, clearAt, … }`
- `screen`: a key of `video.json screens`. Phone kit: `screens/phone.js` (home-actions, camera-scan, result-card, step-timer,
  list-plan, home-card, dashboard-stat, goal-progress, chat-reply, calendar-week, form-success, map-route, player, checkout,
  lock-notify). Laptop kit: `screens/desktop.js` (board, summary, calendar, table). Previews: `engine/test/screens.html`.
- `interaction`: `scan-items` (the problem items land on the viewfinder, get labelled and sucked in), `pop-out` (a hero prop
  rises out of the screen, `heroAt` to place it beside the device), `side-prop` (a domain prop works beside the device;
  `satellites` with `satMode: toss|drop`, `puffs`, `sfx`), `row-props` (mini props beside list rows), `suck-in` (props pulled
  into the screen), `send` (props shoot out of the screen to `to`), `orbit`, `none`.
- Event cues for screens: `badgeAt` (pills, "seen" chips, notifications), `moveAt` (board card move), `toastAt`, `clearAt`.
- `drop: true` puts the music drop on that step's reveal.

## Style-layer API (what scenes use; `engine/style/clay-story/style.js`)
`S.caption(text, t, {slot, hi, sync, until})`, `S.clear(t)`, `S.bg(t, key, [x,y])`, `S.host.pose/look/hide/show`,
`S.full(t0, t1, {who, at, pose})`, `S.device.to(t, state)/show(t, screen, {ev})/el/rect/map/center`,
`S.product.to(t, {x,y,size})/away(t)`, `S.dread(rect, tG, tQ, tGone)`, `S.chip`, `S.tap`, `S.burst`, `S.confetti`,
`S.sfx` (one-whoosh rule), `S.prop(spec)`, `S.at(line, cue, off)`, `S.line(id)`, `S.front/back` (3D stages), `S.unz`,
`S.talkFor(castId)`, `S.carry` (hand-off between scenes, e.g. problem items).

## Writing a scene (when the story needs a move the library doesn't have)
1. Create `engine/scenes/<name>.js`:
   ```js
   export default {
     name: '<name>', lead: 0.35,                       // seconds before its first line it starts
     about: 'one line: when to use it',
     params: { caption: 'text', … },                   // document every param
     build(S, sc) {                                    // sc = params + { t0, t1, lines, i, prev, next, isFirst, isLast }
       S.product?.away(sc.t0);                         // if the scene doesn't feature the product
       const id = sc.lines[0];
       S.caption(sc.caption, S.line(id).start - 0.05, { hi: sc.hi });
       // …props via S.front.add(S.prop(spec), (o, t) => { … pure function of t … })
     },
   };
   ```
2. Register it in `engine/scenes/index.js`.
3. Use only the style API, `MG.*` timeline functions, and clay props. Everything must be a pure function of time
   (no CSS animations, timers, `Date.now`, unseeded randomness). Keep captions in the left column, objects in the right
   half, and anything you add off the mascot's face.
4. Render stills across the scene and check them before using it in a film.
