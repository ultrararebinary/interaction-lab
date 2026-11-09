# Working in this repository

This is Yann's interaction lab (future GitHub repo `ultrararebinary/interaction-lab`, MIT). Claude builds interactions in waves, Yann reviews them on the dev server, and only the ones he keeps are published. Read `docs/decisions.md` before changing anything: it records the decisions made with Yann and wins over your own preferences. A decision changes only when Yann asks, with the date and the reason added to that file.

Talk to Yann in French. Code, comments and everything published in the repo stay in English.

## The loop

Two skills in AIOS run the lab. Use them rather than improvising the steps.

- `lab-wave` (`/Users/yann/AIOS/.agents/skills/lab-wave/`) builds a wave of six interactions, checks them, starts the dev server and stops. The rest belongs to Yann.
- `lab-taste` (`/Users/yann/AIOS/.agents/skills/lab-taste/`) reads the reviews of a series of waves, checks its reading with Yann, then writes the taste profile, the public Taste page and `kept.json`, and deletes the dropped cards.

`RULES.md` holds the rules every wave follows. Yann edits it; lab-taste only proposes changes.

## Structure

- `interactions/<slug>/` holds one interaction: `index.tsx` (exports `meta` and a default component) and `<slug>.css`. No other file, no import from outside the folder except `react` (and `motion` only if the idea needs it). The type of `meta` is `Meta` in `src/interactions.ts`. `interactions/latch/` is the reference card (wave 0, a trial that is never analysed).
- `src/` is the site: the lab grid (`Lab.tsx`), the shared card frame (`Card.tsx`), the Taste page (`Taste.tsx`, rendering `content/taste.md`). The review panel lives in `src/review/` and is loaded only when `import.meta.env.DEV` is true.
- `plugins/lab.ts` is a Vite plugin. It builds the list of interactions (all of them on the dev server, only those in `kept.json` in a build) and, on the dev server only, saves reviews through `/__lab/feedback`.
- `kept.json` lists the kept interactions with the day they were kept and their public line. It is the only place that decides what gets published.
- `content/taste.md` is the public Taste page.
- `.lab/` is ignored by git and stays on Yann's Mac: `feedback.json` (raw reviews, written by the panel), `ideas.json` (every idea ever built, kept or dropped, so none comes back), `TASTE.md` (the private taste profile lab-wave reads, in French) and `shots/` (pictures from `npm run check`).
- `STATE.md` tracks where the project stands. Update it after each wave and each taste reading.

## Skills

For motion and interaction, read Emil Kowalski's files copied in `/Users/yann/AIOS/.agents/skills/site-studio/sources/emil/` (animate, choreograph, gestures, apple-design, emil-design-eng, and prototype for variants), as lab-wave describes. Use `humanizer` for everything visible on the site and for the README. Do not load other design, interface or animation skills unless Yann asks.

## Before saying a wave is done

1. `npm run build` passes. It runs the type check first and the public check last (`scripts/check-public.mjs`: no review panel, no card that wasn't kept).
2. With the dev server running, `npm run check -- --wave <n>` passes: no console error and nothing overflowing, in both themes, with and without reduced motion, at 390 and 1280 px. Look at the pictures it saves in `.lab/shots/`.
3. Open each card in the browser and try its written gesture once, with the mouse. A screenshot does not prove a motion: read the transform at a few moments when it matters.
4. Read each interaction's reduced-motion branch: nothing moves unless the hand moves it.
5. Nothing goes online without a push to `main`, and nothing is pushed without Yann's go-ahead.
