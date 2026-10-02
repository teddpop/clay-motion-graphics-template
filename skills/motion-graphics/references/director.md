# Director playbook

The Director gets the story right before a single frame is built. The style is fixed (`styles/clay-story.md`); the
story is invented fresh for every product from what it's worth to the viewer (`references/story.md`).

The user supplies **at minimum the product idea**. Opus invents everything else. **Never ask for screenshots, UI or
assets**: you write the app's screens as copy, and the props are clay. Use the user's colours, logo or copy if they offer them.

## Step 0: the product (always first, unless the request already describes it)
Ask what the video is for, but accept anything from a full brief down to nothing. One AskUserQuestion:
**"What's the video for?"**
- **My product** → they describe it in "Other" (name, what it does, who it's for; links or notes help)
- **A type of product, you invent the rest** → offer 3–4 categories that fit the conversation (e.g. fitness app,
  budgeting app, smart-home gadget, team tool); they can type their own
- **Surprise me** → you invent a plausible fictitious product
Then fill whatever is missing yourself: no name → invent one (or offer 3 in the interview); category only → invent
the product, its features and its screens; nothing → invent all of it. Mark invented details as assumptions in
`video.json → story` and in the approval package. Never present an invented product as the user's real one.

## The interview (one round, defaults for everything)
Ask once, in one AskUserQuestion call (≤ 4 questions, each with concrete options and a recommended first option), plus
a short free-text follow-up only if needed. Accept "you decide". Skip anything already answered.

1. **What it's worth.** "What changes for someone who uses it?" Offer 2–3 value statements you inferred (time back,
   money kept, worry gone, people connected, something made…). This is the most important answer.
2. **Who and when.** The viewer and the moment they feel the need. Offer 2 moments.
3. **Story shape + hero.** Propose the framework that fits (problem → solution, before/after, connection, absence /
   peace of mind, day in the life, delight, proof-first) and the hero (phone app / laptop web app / physical product).
   Give one line of why. Offer an alternative.
4. **Look & voice.** Brand hue (mood → hue: tangerine 55, gold 85, lime 120, mint 160, teal 195, water 230, cobalt 260,
   periwinkle 285, violet 300, pink 350), tagline options, the mascot (default Poko, or customise: name, gender, hair
   `quiff curly bun bob long ponytail buzz`, skin, glasses, outfit), extra characters if the story has people, length
   (30 / 35 s), CTA.
The voice matches each character (male → `am_*`/`bm_*`, female → `af_*`/`bf_*`). Offer 2–3 samples in the approval package.
If the user says "use your judgement", **don't ask**: decide, and write the reasoning into `video.json → story`.

## Then generate everything
1. Fill `story` (value, audience, feeling, framework, why) using `references/story.md`.
2. Write the script (`references/scriptwriting.md`) for *this* story: 70–100 words, every line a person would say.
3. Compose `scenes` from `references/scenes.md`; write any missing scene or prop rather than bending the story.
4. Write `screens` (realistic copy: names, amounts, times), `cast`, `brand` (hue + an SVG mark), `device` / `product.object`, `music`.
   Scaffold with `node engine/new-project.mjs <slug> --from <closest example>`, then **rewrite every field**. The example is a
   format reference, not a story template.
5. `node engine/spec.mjs projects/<slug>` validates (unknown scenes, missing lines/screens, unused lines).
6. Casting previews: `node engine/render.mjs engine/test/looks.html --query "hair=bun&glasses=1&skin=%238D5A3B&hairc=%231F1715&shirt=%23E0704F" --stills 0.5 --outdir projects/<slug>/review/cast`
   and voice samples (`engine/.venv/bin/python engine/tts_kokoro.py <voice> 1.0 out.wav "<a line>"`; play with `afplay`).

## The approval package (mandatory before VO/build)
One message:
1. **Story**: value → feeling → framework, in two or three sentences, and why this shape fits this product.
2. **Script**: `| # | scene | VO | caption | highlight |`, word count, estimated length.
3. **Storyboard**: `| scene | what happens on screen | hero (device screen / product) | props | background |`.
4. **Casting**: look sheet PNG(s), 2–3 voice samples per speaking character.
5. **Palette**: hue, hi/paper/ink swatches, brand mark.
Build only after approval or edits. If the user explicitly asked you to run end to end without stopping, put the
package in the final report instead.

## Other styles
`styles/highlighter-explainer.md` (55–65 s, 2D cards) is hand-built per `references/generation-prompt.md`. Use the same
value-first thinking, then its PAS+L structure (problem → why alternatives fail → big idea → 3 proofs → it learns you →
payoff → CTA), and write a `brief.md` with assumptions, beat sheet, brand tokens, and fictitious UI copy.

## Copy rules (all styles)
Second person or first person (a character telling their own story), present tense, contractions, short complete
sentences, concrete details (real items, numbers, times, places). Brand name at most 3 times. Tagline: short, natural,
specific to this product, never reused from another film.
