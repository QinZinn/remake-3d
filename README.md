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

Open [/find](http://localhost:3000/find) to scan a photo or choose materials, set quantities, and add tools. The matcher
orders all catalog projects in three groups based on required items covered: ready to make,
missing 1–2 items, and inspiration. Optional items improve a match's score and never put it in
a lower group. Equal scores favour the project that reuses more of what you selected by estimated weight.
Edit inventory from the results page or share the results URL to reopen the same selection.

## Vision scan

Open `/find` and choose or take a photo. Scanning uses a quantized CLIP model with ReMake 3D's inventory labels in the browser. The first scan needs internet access to download roughly 155 MB of weights. The browser can cache model files for later use. Photos stay on the device and scanning requires no API key.

The model makes suggestions from the photo and overlapping regions. Review them before adding them to your inventory. Manual entry remains available while the model loads and if scanning fails.
