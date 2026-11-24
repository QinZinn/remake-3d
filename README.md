# ReMake 3D

Upcycling ideas from the materials and tools you already have, with a step-by-step procedural 3D preview of every project.

Built for Arbiter Hacks V1 (Theme Track: Rethinking Waste).

## Develop

Requires Node 20+ and pnpm.

```sh
pnpm install
pnpm dev          # http://localhost:3000
pnpm test         # Vitest: schema, ops, transitions, catalog
pnpm lint
pnpm build        # also validates every catalog project with Zod
```

Open `/project/pet-self-watering-planter`. Arrow keys step, `#step-N` deep-links, `?speed=0.25` slows the animations.

How projects and their 3D steps are written, and how to add ops or primitives: [docs/scene-dsl.md](docs/scene-dsl.md).
