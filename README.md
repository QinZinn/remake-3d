# ReMake 3D

Upcycling ideas from the materials and tools you already have, with a step-by-step procedural 3D preview of every project.

Built for Arbiter Hacks V1 (Theme Track: Rethinking Waste).

## Develop

Requires Node `^22.12.0 || ^24.0.0 || >=26.0.0` (the range Vitest 5 supports, also in `package.json` `engines`) and pnpm.

```sh
pnpm install
pnpm dev          # http://localhost:3000
pnpm test         # Vitest: schema, ops, transitions, catalog
pnpm lint
pnpm build        # also validates every catalog project with Zod
```

Open `/project/pet-self-watering-planter`. Arrow keys step, `#step-N` deep-links, `?speed=0.25` slows the animations.

How projects and their 3D steps are written, and how to add ops or primitives: [docs/scene-dsl.md](docs/scene-dsl.md).

Open [/find](http://localhost:3000/find) to choose materials, set quantities, and add tools. The matcher
orders all catalog projects in three groups based on required items covered: ready to make,
missing 1–2 items, and inspiration. Optional items improve a match's score and never put it in
a lower group. Equal scores favour the project that reuses more of what you selected by estimated weight.
Edit inventory from the results page or share the results URL to reopen the same selection.
