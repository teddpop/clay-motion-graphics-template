# Style: Clay Story (default)

A **look and a way of moving**, not a plot. Story is decided per product (`references/story.md`) and composed from scenes
(`references/scenes.md`); this file defines what every film in the style shares. The style layer
(`engine/style/clay-story/style.js` + `style.css`) enforces most of it automatically.

Reference films (three different stories, same style): `examples/pantrio` (phone app, problem → solution),
`examples/baton` (laptop web app, connection), `examples/hush` (physical product, absence / peace of mind).

## 1. Format
1920×1080, 30 fps, 30–35 s (up to 45 s if the story needs it), MP4 with VO + composed music + light SFX.
**One continuous shot**: no hard cuts. Changes happen through circle wipes, objects travelling, and the hero moving.

## 2. Look
- **Clay 3D everything**: the mascot (`engine/host3d.js`) and all subject art (`engine/props/*`), same material and light.
  No flat icons, emoji or stock art as subject matter.
- **Palette** from one brand hue (`brand.hue` → `retone.py`, demo saturation): paper, warm grey, highlighter (hi),
  light highlighter (hi2), tint, ink. Background per act: paper / hi / hi2 / warm / tint. The end card is on hi.
- **Type**: Inter, tight tracking. Captions 80–96 px, weight 680, one highlighter word. Mono (JetBrains) for UI labels and pills.
- **UI**: hard-shadow cards (3 px ink border, 4–6 px offset shadow), rounded 14–22 px, realistic copy.

## 3. Layout grid
- Captions in the left column (x 105, width 840; 660 when the hero is a laptop), top ≈ 250. Logo top-left until the end card.
- Narrator bubble: 410 px circle, bottom-left (110, 600).
- Hero on the right: phone 450×900 centred at (1225, 540); laptop 1040×700 centred at (1320, 520); a 3D product around (1250–1450, 560–600).
- Full-body cast: idea/centre spot (≈690–1330), end spot (1480+). Props stay off faces and out of the caption column.

## 4. The cast
- The narrator is the mascot (default Poko; customise per product). It **talks from the bubble** whenever it's not on
  screen full-body, gestures on every line, gets a small bump when a new line starts, and **looks at camera** by default,
  glancing (+deg) at objects only while showing them.
- Full-body moments are for big beats (introducing the product, life vignettes, the end card); the bubble hides
  automatically. Extra characters (`cast`) appear in their own bubbles or full-body and lip-sync only on their lines (`speaker`).
- Voice matches each character's gender and age (Kokoro). Comic emotion (anime dread: gloom curtain, squiggles, "?")
  goes on objects and situations, **never on a character**.

## 5. Motion rules
- Something always travels: props fly on arcs, orbit, drop, get pulled into screens. Nothing pops and sits dead.
- Anticipation and overshoot on entrances (outBack), squash on landings, follow-through wobble.
- The hero device or product persists across scenes and changes state (peek → centre → end) rather than cutting.
- Screens change by sliding up/out and rising in; taps show a ripple; each screen has something moving while visible.
- Reward beats: bursts on wins, confetti on the CTA.

## 6. Timing rules
- Continuous narration: gaps ≤ 0.5 s between lines (the brand ending's 0.55–0.6 s pauses are the exception).
- Captions build fast (80 ms/word) at the start of their line and hold until the next one: ≥ 1.2 s fully readable
  (`[legibility]` lint). Big kicker text letter-by-letter; word-synced captions only for long holds.
- Every time comes from the VO (`timing.js`). Music: drop on the product's key reveal, final hit on the brand name (`build.mjs` derives both).

## 7. Sound
Composed music (compose.py → FluidSynth), ducked under VO. SFX are gentle: pop, tap, tick, ding, chime, plus a domain
sound when it helps (sizzle). **One whoosh per film, maximum** (`S.sfx` warns).

## 8. Ending (always)
Brand name (letters + mark), tagline, CTA: three spoken beats. The hero stays alive (the device keeps animating, or the
product turns), the mascot full-body beside it waves then thumbs-up, and clay props orbit. Tagline and CTA belong to this
product ("Pre-order", "Try it with your team").

## 9. Do / don't
- Do: build each film's story from its value; write new scenes and props when needed.
- Do: invent specific, realistic UI copy. Don't ask the user for screenshots.
- Don't: reuse another film's structure, lines or tagline; feature-list scripts; ad-speak; long silences; tiny UI;
  captions under 1.2 s; a mascot looking sideways all the time; more than one whoosh.

## 10. Review checklist
- [ ] Log clean: no `[legibility]`, `[pronunciation]` (real misses), `cue: … not in line`, `clay-story:` errors
- [ ] The first 3 seconds are the viewer's world, not a logo or a feature
- [ ] The value (story.value) is visible on screen, not just said
- [ ] Captions left, hero right, nothing over faces; bubble never duplicates a full-body narrator
- [ ] Every screen has realistic copy and moves; no empty frames at scene hand-offs
- [ ] One whoosh; music drop on the reveal, hit on the brand name; 30–35 s; end card holds ≥ 3 s
