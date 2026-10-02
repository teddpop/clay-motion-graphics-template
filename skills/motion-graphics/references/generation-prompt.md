# Build prompt: composition spec

Use this as the working instruction when turning a brief and beat sheet into `composition.html`.
(It also works as a standalone prompt for stock Opus. Paste it together with the style file and brief.)

---

> You are a senior motion designer who writes code. Build a 1920×1080, 30 fps motion-graphics video
> as a single deterministic HTML file. Every pixel must be a pure function of time `t`.
>
> **Inputs:** the style guide (`styles/<style>.md`), the brief and beat sheet (`brief.md`), and VO timing
> (`timing.js` → `window.TIMING`).
>
> **Hard rules**
> 1. Load `engine/base.css`, an import map for `three`, `engine/runtime.js`, `timing.js`; main code in a module
>    script that imports `engine/host3d.js` (set `window.__ready` false → true). Call
>    `MG.setup({ width:1920, height:1080, fps:30, duration: TIMING.duration })`.
> 2. Never hard-code a time. Derive every time from the VO: `MG.cues(id, headline)` for word reveals,
>    `MG.cue(id, 'word')` for UI beats, `MG.line(id).start/.end` for scene bounds. Offsets like
>    `cue - 0.2` are fine (cards land ~200 ms before the word).
> 3. One `.scene` div per beat, shown with `MG.show(el, t0, t1)`. Scene `t1` is the next scene's `t0`.
>    No gaps and no black frames.
> 4. Motion only through `MG.tween / pop / out / words / count / type / call`. No CSS transitions or
>    keyframes, rAF, timers, `Date.now()`, or randomness without a seed.
> 5. Follow the style's tokens exactly: margins, type sizes, colours, card borders and shadows, ≤ 1
>    highlight per headline, ≤ 3 cards on screen.
> 6. Every UI card uses realistic, specific fictitious content from the brief. No lorem ipsum, no "Feature 1".
> 7. Each card must *do something* while on screen (type, select, fill, tween, stamp, badge). Static
>    cards are dead air.
> 8. The host (`MG.host3d`) is always alive: set a pose per beat (`h.pose(t, name)`) that matches the line's emotion.
>    Shrug on problems, point on insights, think on "stuck", present or open on the big idea, thumbs or wave on the CTA.
> 9. Register sfx for every card pop, stamp, badge, number tick, and wipe.
> 10. Use CSS variables for brand tokens at the top so a re-brand is a 6-line change.
>
> **Structure the file as:** tokens (CSS vars) → static DOM for all scenes → one `<script>` with a
> section per beat, each section starting with `const s = MG.line('<id>')`.

---

## Craft notes (what separates great from okay)
- **Anticipate the VO.** UI enters 150–250 ms before it's named; headline words land *on* the word.
- **Hold.** After a headline completes, let it sit ≥ 0.8 s before clearing. Viewers need to read it twice.
- **Clear out, don't cross-dissolve.** Old headline: `MG.out` over 0.25 s just before the next line starts.
- **One focal point at a time.** When the card state changes, nothing else moves.
- **Motion hierarchy:** headline (fast, small travel) < cards (medium, overshoot) < scene wipes (large, slow).
- **Numbers tell the story.** Tween them (90 → 50) with a tick sfx and a highlight on the final value.
- **Big-beat colour changes** use a circle wipe from behind the host (`clip` tween on a full-bleed layer with `data-cx/cy`).
- **Ending:** CTA → tagline builds → logo lockup + URL + device mockup; hold the last frame ≥ 1.5 s.

## Caption legibility (user feedback: "text goes away so fast you can't read it")
With continuous VO, word-synced reveals finish at the END of a line, just as the next line starts, so the
caption is readable for ~0 s. Rule: **build each caption fast (≈80 ms/word) at the START of its beat, then hold
it until the next caption replaces it.** Every caption must be fully readable ≥ 1.2 s (aim 1.5 s+).
`render.mjs` prints `[legibility]` warnings from `MG.captionReport()`. Treat them as build failures.
Use the word-synced `MG.words` reveal only for long holds (hero lines, brand lockup).

## Review checklist (run on stills every pass)
- [ ] No `[legibility]` warnings (every caption readable ≥ 1.2 s)
- [ ] No `cue: … not in line` warnings in the render log
- [ ] Scene backgrounds use literal colours (no self-referencing CSS vars)
- [ ] Headline fits in 2 lines inside the 820 px column; nothing touches the avatar or cards
- [ ] Exactly one highlighter behind the key word; it isn't clipped or offset
- [ ] All words have settled to ink by the end of the line (no leftover grey)
- [ ] Cards align to the right column, stay on-grid, show the hard shadow, and don't overlap each other
- [ ] Logo present top-left (except the end card)
- [ ] Host pose matches the line and the eyes and mouth look natural (not mid-blink in hero frames)
- [ ] No empty or black frame at any scene boundary (check t = boundary ± 1 frame)
- [ ] Background colour follows the act plan
- [ ] End card holds; URL legible
