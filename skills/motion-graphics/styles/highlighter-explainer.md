# Style: Highlighter Explainer

Extracted from `Styles and Examples/126E5404-…mp4` (a 67 s product explainer for a focus app).
Voiceover-led SaaS explainer: a friendly mascot host, kinetic headline type that is revealed
word-by-word in sync with the VO, a single highlighter accent colour sweeping behind the key
word, and clean product-UI cards that prove each claim.

---

## 1. The feel in one sentence
Calm, confident, witty, and fast to read. Every scene makes one claim in ≤ 6 words and shows one
piece of UI that proves it. Nothing decorative moves.

## 2. Canvas & grid (design at 1920×1080, 30 fps)
| Token | Value (1080p) | Notes |
|---|---|---|
| Safe margin left | 105 px | Headline, logo, and avatar all share this left edge |
| Logo | top-left, x 105 / y 70, ~130 px wide | Present in every scene except the end card |
| Headline block | x 105, top ≈ 270–330 | Left column, max width ≈ 780 px |
| Avatar bubble | circle ⌀ ≈ 410 px, centre ≈ (315, 805) | Bottom-left, 4 px ink outline |
| UI card column | right half, x ≈ 1060–1840 | Cards stack vertically with 30–40 px gaps |
| Full-body host | right third, feet cropped at bottom edge | Used for hero, "big idea" and end scenes |

Two layouts alternate:
- **A. Proof layout**: headline top-left, avatar bubble bottom-left, UI card(s) on the right. (~75 % of scenes)
- **B. Hero layout**: headline left, full-body host on the right, sometimes one card overlapping the host's hand.

## 3. Colour
One neutral base, one ink, one brand highlighter. Background colour changes per *act* to mark the story beat.

| Role | Reference value | Rule |
|---|---|---|
| Paper (default bg) | `#F4F4EF` warm off-white | Problem & payoff acts |
| Sage (secondary bg) | `#D3DACB` / `#AFC56E` | "Frustration" and "learning" acts |
| Ink (dark bg + text) | `#161917` near-black green | One dark act for the key differentiator |
| Highlighter (brand) | `#D4FF3A`-ish lime | Highlight marker, card glow edge, big-idea bg |
| Muted text | `#8E918A` | Sub-headlines and words mid-reveal |
| Card | `#FFFFFF`, 3 px ink border, radius 14 px | Hard offset shadow: 8 px 8 px 0 ink (no blur) |
| Alert red | `#E5484D` | Only for ✕ "fails" badges and brand icons |

**Re-toning to a brand hue (preferred way to change colour):** keep the reference's saturation/lightness
structure and only change the hue: `python3 engine/retone.py <oklch-hue>` (tangerine 55, coral 30, cobalt 260…).
It works in OKLCH so perceived saturation matches the demo. Render a palette board (all acts × candidate
tones, with a headline and the host) and let the user pick before building. Check the host outfit contrasts
with the chosen hue (a teal shirt disappears on cobalt).

**Lively variant (alternative):** instead of paper/sage, give each act its own
saturated pastel so the video feels energetic: butter `#FFE066` (problem), coral/tangerine `#FF9F6B`
(fails / big idea / payoff), mint `#8FD3B6` (proofs), sky `#9CC8FF` (stuck), lilac `#C9B3FF` (learning), plus one
deep act (plum `#2B1E3F` or navy) for the key differentiator. Rules: ink text stays near-black; the
highlighter becomes white (or the brand colour on light acts) so it never matches the background; cards stay white
with ink borders. Ask in the Director interview: "calm (paper) or lively (colour per act)?"

**To swap brands:** replace the highlighter with the product's brand colour (it must keep ≥ 4.5:1 contrast
with ink text on top of it) and tint the sage to match. Keep paper and ink.

## 4. Typography
- **Headline:** geometric/neo-grotesk sans (Inter, weight 600, tracking −0.02em), 92–110 px at 1080p,
  line-height 1.02. Sentence case with a trailing full stop. Two lines max.
- **Kicker / setup line:** same family, weight 450, ~40 px, muted colour, sits above the headline.
- **UI labels:** monospace (JetBrains Mono) ALL CAPS 18–22 px, tracking +0.06em, for tags like
  `SESSION RECORD`, `LEARNED`, `STUCK · Clock held`.
- **UI body:** sans 24–30 px, weight 500–600.
- **Numbers:** monospace, large (e.g. `45:00`, `90 min`), because they read as data.

## 5. Motion vocabulary (the signature)
| Move | Spec |
|---|---|
| **Word-by-word reveal** | Each word starts exactly when the VO says it. It fades in (0→1, 180 ms), rises 18 px→0 (easeOutCubic 300 ms), and starts in *muted grey*, settling to ink over ~250 ms. So the leading edge of the sentence is always grey. |
| **Highlighter sweep** | A brand-coloured rectangle behind the key word(s) wipes left→right (scaleX 0→1, origin left, 350 ms, easeOutExpo), starting as the word lands. Padding 0.08em 0.14em, no radius. Only 1 highlight per headline. |
| **Card entrance** | Opacity 0→1, scale 0.94→1, y +24→0, easeOutBack(1.4), 450 ms. Stacked cards stagger 150–250 ms. |
| **Card state change** | Content inside a card updates in place (a typed query, a chip gets selected, a bar fills, a number tweens 90→50). The card itself does not move. |
| **Fail badge** | Red ✕ circle pops onto a card's top-right corner (scale 0→1.15→1, 300 ms). |
| **Stamp** | Tilted pill stamp (e.g. `KEPT`) slams in: scale 1.8→1, rotate −14°→−8°, 250 ms, tiny 4 px shake. |
| **Circle wipe** | Scene changes on big beats: the new background grows as a circle from a point (often behind the host), ~600 ms easeInOutCubic. |
| **Crossfade host** | Between hero shots the host crossfades between poses (200–300 ms) instead of animating limbs. |
| **Background colour cut** | Hard cuts between acts are fine; the headline area clears and the next sentence builds. |
| **Idle life** | Host is never frozen: 1–2 px breathing bob, blinks every 2–4 s, talk-mouth while VO plays. |

Global rules: no motion blur, no parallax, no camera moves, no bouncing text. Things arrive and then
hold still so they can be read. Easing is always *out* (fast start, soft landing) except wipes.

## 6. Pacing (from the reference beat map)
- ~16 VO sentences in 63 s, so a new headline roughly every 3.5–4.5 s.
- Headline holds fully built for ≥ 1 s after the last word before it clears.
- UI cards enter ~200 ms *before* the VO mentions what they show, so the viewer's eye is already there.
- Act lengths: Problem 10 s → Big idea 8 s → Proof ×3 at 5 s each → Learning 16 s → Payoff 6 s → CTA 7 s.

## 7. Story structure (the template this style implies)
1. **Problem, relatable** ("Every X you've tried became one more thing to manage.") Host full-body, shrugging, with product-category icons floating around.
2. **Why alternatives fail**: a 3-part list sentence ("Blockers block blindly. Timers just count. Planners become work."), each with a card that gets a red ✕.
3. **Big idea**: bg switches to the highlighter colour. "A [category] that [differentiator]." Host full-body, confident.
4. **Proof 1–3**: dark or paper bg, one claim + one live UI card each ("It understands the work." / "Context, not a blocklist." / "Stuck? One smaller move.").
5. **It learns / personalises**: plan vs actual numbers tween; `LEARNED` insight chips stack up.
6. **Payoff**: "From meant to done." A receipt/record card with a stamp.
7. **CTA**: "Try [Brand] for free today." Host thumbs-up. Then the tagline builds, then logo lockup with device mockup plus the URL in mono.

## 8. Host character
- Friendly, stylised 3D-toy proportions: big head (≈ 1/4 body height), large white eyes, simple
  smile, muted-olive overshirt over a white tee, dark trousers, white sneakers.
- Curly-hair look reference: `styles/refs/host_curly_hair_reference.png` (`hair: 'curly'`). Big, smooth,
  glossy clay blobs, a fringe just above the brows, side puffs over the ears.
- Poses used: idle-talk, shrug (palms up), point (index up), present (open palm to side), hand-to-head
  (thinking/stuck), thumbs-up, wave.
- **Free-stack implementation:** `engine/host3d.js`, a real-time 3D clay toy (Three.js). It uses matte clay
  materials with a subtle fingerprint bump, soft key, rim, and environment light, and a contact-shadow blob. It gets
  close to the reference look. Recolour the outfit to the brand via `palette`.

## 9. Audio
- Warm, conversational VO (Kokoro `af_heart` at speed 1.0 matches the reference energy). No music drops. A light, bright music bed ducked under the VO.
- Subtle UI sounds: soft pop on card entrance, tick on number changes, thunk on stamp.

## 10. Don'ts
- No gradients on backgrounds, no glassmorphism, no drop-shadow blur, no emoji.
- Never more than one highlighted phrase on screen.
- Never more than 3 cards on screen.
- Never put body copy in the headline column. Headlines only.
