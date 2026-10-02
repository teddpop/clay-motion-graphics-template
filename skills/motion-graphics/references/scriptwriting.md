# Scriptwriting: VO that sounds human

The VO is the spine of the video: every word reveal, card, and pose hangs off it. A script that sounds
like ad-speak makes the whole video feel machine-made, however good the animation is.

## The rule that matters most
**Write the way a friendly person would actually say it out loud, then trim.** Never write in
"headline-ese" and then read it aloud. Headlines are condensed *from* natural VO. The VO is never a
string of headlines.

## Story first (user feedback: feature-list scripts are "bad")
Tell one story the viewer recognises, built from what the product is worth to them (`references/story.md`), and let
features appear only as the evidence. There is no fixed arc: a meal app, a team tool and a leak sensor got three
different shapes. What every script shares: it opens in the viewer's world, the product arrives early enough to be the
hero, the payoff is a change in someone's life, and it ends on the brand, a tagline, and a CTA, each spoken as its own beat.
Approved examples (all different): Pantrio "Knowing what to cook is hard. It's six o'clock, you're staring into the fridge…";
Baton "Your team doesn't need another status meeting. I'm in Lisbon, Sam's in Denver…"; Hush "Most water damage starts
with one tiny drip. Like the pipe under your sink, dripping away while you're at the beach."

## No dead air (user feedback on the story cut)
Long pauses left for visuals read as "awkward silences". Narrate continuously: pauses ≤ 0.5 s between lines, and let
visuals play *under* the VO. The only deliberate pauses are in the brand ending, spoken as separate beats:
"[Product]." (pause) "[Tagline]." (pause) "[CTA]." 

## Hard rules
1. **Read-aloud test.** Every line must sound natural spoken by a real person to a friend. If you
   wouldn't say it in conversation, rewrite it.
2. **No invented idioms or broken grammar for "punch."** These all failed review:
   | ❌ Rejected | Why | ✅ Human version |
   |---|---|---|
   | "It learns you." | Not English | "It learns from you." |
   | "Grocery lists just list." | Cute on paper, meaningless aloud | "Grocery lists can't think for you." |
   | "Dinner holds." | Jargon nobody says | "Don't worry, dinner can wait." |
   | "From meant to made." | Wordplay that needs decoding | "The meals you plan are the meals you actually make." |
   | "Which nights hold?" | Borrowed from the reference, meaningless for food | "Which nights you actually cook." |
3. **Don't copy the reference's wording.** Copy its *structure* (problem → fails → big idea → proofs
   → learning → payoff → CTA) and its *rhythm*. Phrases that worked for one product ("blocks with
   context," "the clock holds") usually don't make sense for another.
4. **Complete thoughts.** Subject + verb. Fragments are fine only when a person would actually use them
   ("Missing an ingredient halfway through?").
5. **Contractions and plain words.** "It'll," "you've," "don't." Say "use," not "leverage," and "help," not "empower."
6. **One idea per line, 6–16 words.** The longest line should still fit comfortably in one breath.
7. **Concrete over abstract.** "Soccer practice on Tuesday" beats "your schedule." Real items, numbers, and times.
8. **Parallel lists must be parallel *and* natural.** Check each item on its own: "Recipe apps bury
   you in options. Grocery lists can't think for you. And meal plans feel like homework."
9. **Brand name at most 3 times.** Big idea, CTA, tagline.
10. **Headline ≠ transcript.** The on-screen headline is a 2–6 word distillation of the line's point. It
    must be correct English on its own ("It learns from you." not "It learns you.").

## Self-review before showing the user
- Read each line aloud in your head at speaking pace. Flag anything a person wouldn't say.
- Ask of each line: "Would a sceptical friend understand this the first time?"
- Check each headline reads as a correct sentence or phrase in isolation.
- Check total runtime: ~2.6 words/second for Kokoro at speed 1.0. A 55 s video is about 140 words.

## Pronunciation check (after every VO render)
`vo.mjs` round-trips every line through whisper and prints `[pronunciation]` when a scripted word isn't heard back.
Invented brand names are the usual casualty, especially said alone ("Hush." came out as "Hashi" in `bm_george`; `bm_lewis`
said it cleanly). Homophones ("sensor"/"censor") are fine. For a real miss: listen, then rephrase, respell the `say` text
(keep display text correct), or pick another voice.

Kokoro can slur word boundaries: "the more you cook, the better…" sounded like "cooks". Re-transcribe any line
the user flags (`whisper-cli -f audio/lines/<id>.wav`). If it's ambiguous, rephrase so the word ends before a clear
consonant ("the more you cook with it, the better…"), then re-check.

## Script approval gate (mandatory)
Show the user a table **before** generating VO or building anything:

| # | Beat | VO (spoken) | On-screen headline | Highlight |

Include the voice and host casting (see below) in the same message. Build only after the user approves
or edits it. Script fixes cost seconds now and a full re-render later.

## Casting: voice ↔ host must match
- The narrator is the host, so the voice gender and age must match the character. Male host → `am_*` or
  `bm_*` voice; female host → `af_*` or `bf_*`.
- Offer 2–3 voice samples of the same line so the user can pick (`engine/tts_kokoro.py`).
- Male voices: `am_michael` (warm, clear, default), `am_fenrir` (deeper), `am_puck` (upbeat),
  `am_echo`, `am_adam`, `bm_george` (UK), `bm_lewis` (UK). Blend for a custom timbre: `am_michael:0.6,am_puck:0.4`.
- Female voices: `af_heart` (default), `af_bella`, `af_nicole`, `bf_emma` (UK).
- Host look is set in `palette` + `hair` options on `MG.host3d` (skin tone, hair colour, hair style
  `quiff` | `curly`, outfit colours). Confirm the look with a pose preview before the full render.
