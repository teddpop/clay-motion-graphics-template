# Motion design: going beyond "cards that pop"

User feedback (2026-09-30): v1–v3 "motion graphics aren't that great". Cards popped in and held,
words faded up, scenes hard-cut, and there was almost no subject-matter art. The 35 s Pantrio cut
(`projects/pantrio-35`) is the reference for the fuller treatment. Use this checklist on every video.

## Round-2 feedback (learned on the Pantrio story cut; now enforced by the Clay Story style layer)
- **Story beats features.** Open on a relatable moment ("It's six o'clock, and you're staring into the fridge again")
  and let the product solve it. A list of claims = "the script is bad".
- **The product UI is the hero.** A big phone (≈450×900) centre-stage for most of the film, with real, specific app
  screens that change on cue (scan → result → cook mode → week plan → home). Clay art *interacts with the screen*
  (gets scanned, sucked in, pops out) instead of competing with it.
- **One continuous shot** beats many cuts: move/fade elements out, change backgrounds with circle wipes from the phone.
- **Sound restraint:** max ONE whoosh per film. Use tap / tick / shutter / sizzle / chime at low gain; let the music carry energy.
- **Clay food is loved.** Keep it, but in service of the story.
- **Host = persistent avatar bubble** (user request): the mascot (default name **Poko**) talks from a circle
  bottom-left for the whole film. Gesture per VO line, a small scale bump on each new line, and the bubble glides
  beside the phone to wave on the end card. Poko goes **full-body only for the big-idea line** ("Pantrio is a
  kitchen app that thinks for you."), with the bubble stepping aside. Reference: `projects/pantrio-story-v2`.
- **Gaze:** Poko must look straight at the camera most of the time (he's talking to the viewer) and only turn
  toward the fridge / phone when showing something, then come back. Use `host.look(t, deg)` (0 = camera).
  A fixed `turn` makes him look sideways the whole time (user complaint).
- **Comic emphasis:** anime-style dread (gloom curtain lines, dark tint, wobbling squiggles, then bobbing "?") goes on
  the *object* causing the problem (the fridge), not on Poko. Recipe: `projects/pantrio-story-v6` (`#dread` SVG layer).
- **Introduce the product with the product:** on the big-idea line the real app pops up from the bottom (≈2/3 visible,
  lower-right) while Poko holds a clay phone (`pose 'hold'` + `h.prop('phone', t0, t1)`). The same phone then
  glides to centre for the next scene.
- **Music sync:** tune VO pauses so the product reveal and the brand line land on bar downbeats, then run
  `compose.py --drop <reveal> --hit <brand line>`.

## Principles
1. **Something always travels.** Every scene has at least one object moving *through* space: flying, arcing,
   orbiting, or being pushed. It shouldn't just appear in place.
2. **Show the subject, not just UI.** Build clay 3D art of the product's world (`engine/food3d.js` has food
   for cooking apps; add a factory for other domains in the same style). The art serves the product UI: it
   interacts with the phone screen rather than replacing it.
3. **Cause and effect.** Objects interact: ingredients leave the fridge and land in the pan, the pan sizzles
   and throws the dish onto the card, an egg hops off the list, the milk carton gets ✕'d and swapped out.
4. **Transitions are choreography, never hard cuts:**
   - zoom-through: a hero object flies into the lens, fills the frame, then an iris opens (hook → big idea)
   - layered stripe wipe: 3 skewed bands in palette colours (`MG.stripes`)
   - push: the old scene slides out as the new one slides in with overshoot
   - circle reveal from the host or an object (`clip` tween with `data-cx/cy`)
   Vary them. Don't repeat the same transition twice in a row.
5. **Kinetic type with weight.** Per-letter rise with rotation + overshoot (`MG.letters`) for headlines.
   Use a slam (scale punch + shake + thunk, `MG.slam`) for the hook's key word. Swap the headline mid-scene
   when the VO turns ("What's in your fridge?" → "Tonight's dinner, sorted.").
6. **The 12 principles, cheaply:** anticipation (door overshoot), squash & stretch (`MG.fly` landings),
   follow-through (wobble settle), arcs (all flights arc), secondary action (steam, sparkles, confetti), and
   staging (one focal action at a time).
7. **Depth.** Orbit rings render on two stage layers (behind/in front of the host) so food passes behind him.
8. **Never frozen.** `MG.drift` a slow 3–5 % push-in on every scene wrapper, host idle motion, and a food idle bob.
9. **Reward beats:** bursts (`MG.burst`) on every "win", confetti on the payoff, and a digit roll (`MG.roll`)
   for number changes.
10. **Pacing for 30–35 s:** about 9 VO lines at Kokoro speed 1.0, with 0.8–1.0 s pauses after lines that
    carry a big visual moment (fridge→pan, payoff). Leave a 4–5 s end card.

## Toolkit
- `engine/fx.js`: `letters`, `slam`, `stripes`, `burst`, `confetti`, `drift`, `slide`, `roll`
- `engine/clay3d.js` + `engine/props/*.js` (see `clay-props.md`): `MG.stage3d(el)` transparent 3D layer (screen-px coordinates via `st.px`), `MG.food.*`
  / `MG.props.*` (food, finance, office, fitness, ui packs), motion helpers `MG.place`, `MG.fly` (arc + tumble that always settles
  to the intended facing + squash on landing + optional `out` exit), `MG.orbit`
- Preview props: `engine/test/props.html?pack=…`, screens: `engine/test/screens.html`, mascot looks: `engine/test/looks.html`

## Gotchas
- **Props in hands:** never place a prop *next to* a hand in screen/world space. That clips through the fingers.
  Parent it rigidly to the hand (`armR.hand`) with a grip offset: back of the phone on a flat palm, long axis along
  the fingers, palm visible below it, thumb at the side. The 'hold' pose (R arm 8,28,140,8, twist 90) turns the
  screen to camera. Preview grips with `engine/test/hold.html` (it renders several arm-angle variants side by side).
- Keep orbiting props below the host's face (chest height).
- Objects that sit *inside* another 3D object (food on fridge shelves) must be positioned in that object's local
  space (`new Vector3(lx, ly, lz).applyMatrix4(restMatrix)`), not in screen px, or they clip through trays.
  Give such containers a fixed rest transform (no idle wobble).
- End scene: Poko full-body beside the phone, with the phone screen still animating (dish pops onto the card, CTA tap).
- 3D objects pushed forward in depth (z > 0, e.g. to sit in front of a fridge door) are enlarged and shifted
  outward by perspective (K = 20 / (20 - z)). Pre-compensate the target px and size (`unz` in pantrio-story-v2)
  or they miss UI targets like the phone viewfinder.
- Z-order = DOM order. Put a stage canvas *between* elements to sandwich 3D art (fridge body → stage → door).
- Face-forward items (egg, lemon, avocado) need `tilt` and integer `spin` so they land facing the camera.
- A zoom-through object must present its most readable side to the lens (the tomato's red cheek, not its leaves).
- Anything pushed or zoomed must still have content on screen during the move (pop cards early).
