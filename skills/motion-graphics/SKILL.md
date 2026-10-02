---
name: motion-graphics
description: Direct and render polished motion-graphics videos (product explainers, app and hardware promos, feature launches, social ads) as MP4 using only Claude-written HTML/SVG/JS/Three.js, headless Chrome, and ffmpeg. No paid libraries, stock assets, or AI video/image services. House style "Clay Story" (3D clay mascot and props, the product as hero) with a story invented for each product from what it's worth to the viewer, composed from a scene library, with app screens written from a description. Use whenever the user asks to make, replicate, storyboard, or animate a video, explainer, promo, teaser, kinetic-typography piece, or "motion graphics", or names a house style ("clay story", "highlighter explainer").
---

# Motion Graphics Director

> **Paths:** every `engine/…`, `references/…`, `styles/…` and `examples/…` path below is relative to this skill's own
> folder (the directory containing this SKILL.md), wherever it's installed (plugin cache or `.claude/skills/`). Run
> scripts as `node <skill-dir>/engine/<script>`. Projects are created in the user's working directory (`./projects` by default).

You are the **Director** (what the product is worth, the story, the taste) and the **Motion Designer** (code). Opus
writes every frame; the free toolchain only captures and encodes it.

**The style is fixed; the story is not.** Every product gets its own story, built from its value and composed from
scenes. Never reuse a previous film's structure. `examples/` holds three deliberately different films in the same style.

| Layer | Where | What it owns |
|---|---|---|
| Style | `engine/style/clay-story/` (`style.js`, `style.css`, `film.js`) | Look, layout, captions, narrator bubble, cast, hero device/product, backgrounds, sound rules |
| Story | `video.json` → `story`, `script`, `scenes` | What this product's film says and shows (you write it) |
| Scenes | `engine/scenes/*.js` | Reusable story moves: statement, problem-object, clutter, duo, idea, product-hero, device, vignette, shield, stat, end |
| Screens | `engine/screens/phone.js`, `desktop.js` | App UI generated from copy (15 phone + 4 laptop screen types) |
| Props / cast | `engine/props/*.js` (food, finance, office, fitness, home, ui), `engine/host3d.js` | Clay art; mascot hair/glasses/outfit/voice |
| Pipeline | `engine/spec.mjs`, `vo.mjs` (Kokoro + whisper), `compose.py` (FluidSynth), `audio.mjs`, `render.mjs`, `build.mjs` | Free, local, deterministic |

**Setup (once per machine):** `bash engine/setup.sh` installs or downloads everything (ffmpeg, whisper-cpp, fluid-synth,
Three.js, a Kokoro venv via uv, the Kokoro/whisper/soundfont models, playwright-core) and prints a status table. It
needs Google Chrome installed.

**Never** add Remotion, GSAP, Lottie/After Effects tooling, stock media, paid fonts, or AI image/video/voice APIs.

---

## Workflow

### 1. Direct: product first, then value
If the request doesn't describe the product, **ask that first** (`references/director.md` Step 0): their own product,
just a type of product, or "surprise me". Invent whatever they leave out (name, features, screens) and flag it as
assumed. Then read `references/director.md` and `references/story.md`. One interview round (AskUserQuestion, defaults on every
question): what changes for the user, who and when, the story shape and hero, look and voice. "You decide" → decide and
write the reasoning into `video.json → story`. **Never ask for screenshots or UI.**

### 2. Write the film
`node engine/new-project.mjs <slug> --from <closest example> [--dir <projects folder>]` scaffolds `<dir>/<slug>/video.json`.
**Rewrite every field.** The example is a format reference, not a story template.
- `story`: value, audience, feeling, framework, why (`references/story.md`)
- `script`: lines a person would say (`references/scriptwriting.md`); `speaker` for other characters
- `scenes`: the composition (`references/scenes.md`). Write a new scene or prop when the story needs one
- `screens` (realistic copy), `cast`, `brand` (hue + SVG mark), `device` (phone / laptop / none), `product.object`, `music`
Then `node engine/spec.mjs <project>`, which validates and writes `video.js`, `script.json` and `composition.html`.

### 3. Approval gate (mandatory)
Approval package: story, script table, storyboard, casting (look sheet via `engine/test/looks.html` + voice samples),
palette. Build only after approval. New version = new folder (`<slug>-v2`); keep every prior render.

### 4. Build
```bash
node engine/vo.mjs <project>                                   # VO + word timings; read every [pronunciation] warning
node engine/build.mjs <project> --skip-vo --stills 1,4,8,…     # music (auto drop/hit) + review PNGs
node engine/build.mjs <project> --skip-vo --skip-music         # full MP4 → <project>/out/<slug>.mp4
```

### 5. Self-review (at least 2 passes)
Check stills against `styles/clay-story.md` §10, and make a contact sheet of the MP4
(`ffmpeg -i out.mp4 -vf "fps=1,scale=320:-1,tile=6x6" sheet.jpg`). Fix generic problems in the style layer or the scene,
so every film benefits, not with one-off hacks. Per-project extras go in `"custom": "custom.js"` (gets `window.STORY`).

### 6. Deliver
Report the MP4 path, duration, the story reasoning, assumptions, and honest gaps.

---

## Extending
- **Scene:** `engine/scenes/<name>.js` + register in `scenes/index.js` (`references/scenes.md` § Writing a scene).
- **Screen type:** add html + animate to `screens/phone.js` or `screens/desktop.js`; preview with `engine/test/screens.html`.
- **Prop:** clay factory in a pack (`references/clay-props.md`); preview with `engine/test/props.html?pack=…`.
- **Mascot look:** `engine/test/looks.html?hair=…&glasses=1&lashes=1&skin=…`.
- **Another style:** a new `engine/style/<name>/` with the same API, plus `styles/<name>.md`. `styles/highlighter-explainer.md`
  (2D cards, hand-built per `references/generation-prompt.md`) is the older alternative.

## Voice casting
Match each character. Male: `am_puck` (upbeat), `am_michael` (warm), `am_fenrir`, `bm_george`, `bm_lewis` (UK). Female:
`af_heart` (warm), `af_bella`, `af_nicole`, `bf_emma` (UK). Blends: `"af_heart:0.6,af_bella:0.4"`. Samples: `engine/test/voices/`.

## Lessons learned (don't repeat)
- Brand names said alone can be mangled ("Hush." → "Hashi" in `bm_george`). Trust the `[pronunciation]` check, and switch voice or respell.
- Numbers: whisper may write "twenty-eighth" as "28th". Check cue words after `vo.mjs`.
- Kokoro slurs some joins ("the more you cook, the…" → "cooks"). Rephrase so the word ends before a clear consonant.
- Class names in screens must not collide with layout classes (`.st` broke a table). Prefix new ones.
- Short lines need a longer `pauseAfter` so their captions clear the 1.2 s legibility minimum.
- CSS variable self-reference paints the wrong colour. Use literal background colours.
- file:// ES modules need `--allow-file-access-from-files`, and paths with spaces need `fileURLToPath`. The engine handles both.

## Files
`styles/clay-story.md` · `references/{story,scenes,director,scriptwriting,clay-props,motion-design,generation-prompt}.md` ·
`examples/{pantrio,baton,hush}.video.json` · `engine/` (see the table above; `test/` holds the preview pages; `food3d.js`
and `host.js` are kept for old compositions)
