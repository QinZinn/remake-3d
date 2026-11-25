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

## Vision scan (optional)

`/find` lets you select or capture a photo, preview it locally, and press **Scan photo** to call `POST /api/scan` and review suggested materials and tools before adding them to your inventory.

To enable photo scanning locally, copy `.env.example` to `.env.local` and set your server-side Anthropic API key:

```sh
cp .env.example .env.local
```

- `ANTHROPIC_API_KEY` — required on the server to call the Claude Messages API (`POST /api/scan`).
- `ANTHROPIC_VISION_MODEL` — optional server-only override (defaults to `claude-haiku-5-5`).

If `ANTHROPIC_API_KEY` is not set, `/api/scan` returns a graceful unavailable response (`503`) and manual inventory selection continues to work normally. The browser resizes photos and exports a JPEG without the original file metadata before upload. The scan route accepts JPEG, PNG, or WebP up to 4 MiB and does not log or save the image.
