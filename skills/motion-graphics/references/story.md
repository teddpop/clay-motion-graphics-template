# Story: from what the product is worth to a film

The style is fixed; the story is not. Every product gets its own story, built from what it is actually worth to the
person watching. **Never start from a previous film's structure.** Pantrio, Baton and Hush (in `examples/`) are three
different stories in the same style, shown so you can see the range, not so you can copy one.

## 1. Find the value (before any scene or line)
Answer these in `video.json` → `story` (the renderer ignores this block; it's your reasoning, and the user sees it in
the approval package):

| Question | Why it matters |
|---|---|
| **What changes in someone's life** when they use it? Concretely: time back, money kept, stress gone, a disaster avoided, a person reached, something made, a feeling | This is the film's payoff. Features are only evidence |
| **Who is watching**, and in what moment do they feel the need? | Picks the opening and the vocabulary |
| **What feeling** should they leave with? relief, calm, confidence, delight, pride, belonging, excitement | Picks pacing, colour energy, music, mascot acting |
| **Where does the problem live?** In a thing (fridge, wallet), between people, in time (deadlines, waiting), in uncertainty (risk, worry), or nowhere (pure delight) | Picks the opening scene |
| **What is the hero?** An app on a phone, a web app on a laptop, a physical product, a service (people) | Picks `device.type` / `product.object` |
| **What is the honest proof?** A moment on screen, a number, a before/after, a reaction | Picks the proof scene |

If the user gave only a product idea, propose answers and confirm them in the interview.

## 2. Pick a story shape (framework)
Choose the one that fits the value, then adapt it. Mixing is fine.

| Framework | Use when | Typical scene flow |
|---|---|---|
| **Problem → solution** | A clear, everyday pain the product removes | `statement`/`problem-object`/`clutter` → `idea` → `device` (2–3 steps) → `end` |
| **Before / after** | The change is the story (chaos → calm, slow → fast) | `clutter` (before) → `idea` → `device` or `vignette` (after) → `stat` → `end` |
| **Connection** | Value lives between people (teams, family, buyers/sellers) | `clutter`/`statement` → `duo` (out of sync) → `idea` → `device` (bridge) → `stat`/`duo` (in sync) → `end` |
| **Absence / peace of mind** | The value is that something bad *doesn't* happen (security, insurance, monitoring) | `statement` (the small threat) → `vignette` (your life + "meanwhile" inset) → `product-hero` → `shield` → `vignette` (life goes on) → `end` |
| **Day in the life** | A habit or companion product used across a day | `vignette` × 2–3 (morning/afternoon/night) with `device` moments in between → `end` |
| **Delight / show-off** | Creative, fun, aesthetic products with no pain to solve | `statement` (the wish) → `product-hero` or `device` with big reveals → `stat`/`vignette` (the result admired) → `end` |
| **Proof-first** | Strong numbers or a dramatic result (B2B, performance) | `stat` → `statement` (why it matters) → `idea` → `device` → `end` |

Rules of thumb:
- Open on the viewer's world (a moment, a feeling, a truth), not on the product. The product arrives by about 30–40 %.
- One idea per scene; 5–7 scenes for 30–35 s. Every scene is a VO line or two.
- Show the product doing the thing it's valued for. If it's invisible (peace of mind), show the absence and the protection.
- Only use `problem-object` when the problem really lives in a container with nameable contents.
- The end scene is always last, but its tagline and CTA come from this product ("Pre-order", "Try it with your team").
- The mascot is the narrator. More characters (`cast`) when the story has people in it; give them lines (`speaker`).

## 3. Write the script from the value
`references/scriptwriting.md` has the rules (human, story first, continuous). Write the lines to tell *this* story,
then attach them to scenes. Typical length: 70–100 words for 30–35 s.

## 4. Compose the scenes
Pick scenes from `references/scenes.md`, fill their params, and design the app screens (`screens`) with realistic copy.
If no scene expresses a moment you need, **write a new scene** (`references/scenes.md` § Writing a scene). Don't bend the
story to fit the library.

## Three examples (all in `examples/`)
| | Pantrio (meal app) | Baton (remote-team board) | Hush (leak sensor) |
|---|---|---|---|
| Value | Dinner decided from what you have | Work hands off across time zones, no status meetings | A leak stopped before it becomes a flood |
| Feeling | Relief | Relief + connection | Calm |
| Problem lives | In a thing (the fridge) | Between people | In uncertainty (while you're away) |
| Hero | Phone app | Laptop web app | Physical product |
| Framework | Problem → solution | Connection | Absence / peace of mind |
| Scenes | statement → problem-object → idea → device ×4 → end | clutter → duo → idea → device ×2 → stat → end | statement → vignette (+inset) → product-hero → shield → vignette (+notification) → end |
| Proof | The app doing it on screen | A number (4 meetings a week) | The protection, then life carrying on |
