# interaction lab

Small interactions that Claude builds for me in waves of six, following the [rules](RULES.md). I try each one on my Mac, keep the ones I like and drop the rest. The [site](https://ultrararebinary.github.io/interaction-lab/) only shows the ones I kept, newest first, each with a line on why. A [Taste](https://ultrararebinary.github.io/interaction-lab/#/taste) page sums up what I tend to keep.

Most of them are ordinary interface parts, like a switch, a field or a menu, done in a way I hadn't seen. They are rough on purpose. When one deserves more care, it becomes a real component in [experiments](https://github.com/ultrararebinary/experiments), my other lab.

I'm Yann, a student learning design engineering. You can find me on [X](https://x.com/yannworks).

## Where the idea comes from

Emil Kowalski showed his [interaction lab](https://x.com/emilkowalski/status/2115789995860517254) in October 2026: a system builds him new interactions every day from rules he set in advance, and he keeps the ones he likes, so the lab drifts toward his taste. This lab borrows that loop and the shape of his cards (a name, the gesture, a live stage, a line on how it works, one accent color). The interactions, their names and the look are my own.

## How it works

Each interaction is a folder in `interactions/` with an `index.tsx` and a `.css`, and nothing beyond React. A wave adds six of them. On the dev server, every card has a small review panel: Keep or Drop, what made the call (idea, motion, look, feel) and a note. The reviews are saved to a local file that never leaves my Mac.

After a few waves, Claude reads the reviews, looks for what keeps coming back, and checks its reading with me. The cards I kept go into `kept.json` with their public line, the Taste page gets rewritten, and the code of the dropped ones is deleted.

The published build only contains the cards listed in `kept.json`. A check after every build fails if a card that wasn't kept, or the review panel, slips in.

## Run it

```bash
npm install
npm run dev      # http://localhost:4330/interaction-lab/, with the review panel
npm run check    # with the dev server running: console errors, 390 px, both themes, reduced motion
npm run build    # the public site in dist/
npm run preview  # the public site at http://localhost:4331/interaction-lab/
```

## License

MIT
