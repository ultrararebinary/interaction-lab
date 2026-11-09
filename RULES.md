# Rules

These are the rules every wave of the lab follows. Claude reads this file before building a wave, and Yann can change it whenever he likes. When a change comes out of the reviews, lab-taste proposes it and Yann decides.

## What a wave is

- Six new interactions, each in a single version.
- Four build on the taste profile and two explore directions the lab hasn't tried. Until a profile exists, all six explore.
- A card gets two or three variants only when the idea depends on a setting (a duration, a stiffness, a threshold). The variants then differ on that setting and nothing else.

## The card

1. One idea per card, named with one original word.
2. The gesture is written on the card as a verb and its result: "drag the knob · it snaps past halfway".
3. The stage is interesting before you touch it, and it answers the moment you do.
4. A "how it works" line gives the key values of the effect, like "spring 0.32 s · no overshoot", so you can see how it is tuned.
5. One accent color, and only where the hand acts.
6. The same frame for every card, so they compare at a glance.

## Content

- Ordinary interface parts done in a way that hasn't been seen before: button, switch, slider, field, list, menu, tooltip, text, and so on. Physics simulations and generative art are not the point.
- Nothing that already exists in the lab, kept or dropped, or in [experiments](https://github.com/ultrararebinary/experiments).
- No copies of Emil Kowalski's interactions, whose lab inspired this one.
- None of the default looks that make interfaces interchangeable: cream backgrounds by default, italic words in headings for an "editorial" feel, 01 / 02 / 03 numbering, monospace labels, pill buttons everywhere, purple-to-blue gradients, frosted glass, library icons in colored rounded squares, bento grids, fade-in on scroll. The exception is what experiments chose on purpose and recorded in its decisions, such as the bento grid of Shoji Bento: those stay allowed, as long as the idea itself is new.

## Code

- Each interaction lives in its own folder, `interactions/<name>/`, with an `index.tsx` and a `.css`.
- No dependency beyond React. Motion only if the idea can't work without it. No WebGL.
- The folder may read the lab's color tokens (`--accent`, `--text`, `--muted`, `--control`, `--ring`, `--stage`), with a fallback, and nothing else from the site.

## The floor

The lab is raw on purpose, but every card clears this:

- The written gesture works with a mouse and with touch.
- Reduced motion is respected: no movement the hand didn't cause, fades at most.
- The card reads well in both themes and at 390 px wide.
- The console shows no errors.
