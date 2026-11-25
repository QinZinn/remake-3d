# ReMake 3D

Upcycling ideas from the materials and tools you already have, with a step-by-step procedural 3D preview of every project.

Built for Arbiter Hacks V1 (Theme Track: Rethinking Waste).

## Develop

Requires Node `^22.12.0 || ^24.0.0 || >=26.0.0` (the range Vitest 5 supports, also in `package.json` `engines`) and pnpm.

```sh
pnpm install
pnpm dev          # http://localhost:3000
pnpm test         # Vitest: schema, ops, transitions, catalog, matching, impact
pnpm lint
pnpm build        # also validates every catalog project with Zod
```

Open `/project/pet-self-watering-planter`. Arrow keys step, `#step-N` deep-links, `?speed=0.25` slows the animations. Select **I made this** on any guide (or **Undo** to revert) and open [/impact](http://localhost:3000/impact) to view your local totals.

How projects and their 3D steps are written, and how to add ops or primitives: [docs/scene-dsl.md](docs/scene-dsl.md).

Open [/find](http://localhost:3000/find) to scan a photo or choose materials, set quantities, and add tools. The matcher
orders all catalog projects in three groups based on required items covered: ready to make,
missing 1–2 items, and inspiration. Optional items improve a match's score and never put it in
a lower group. Equal scores favour the project that reuses more of what you selected by estimated weight.
Edit inventory from the results page or share the results URL to reopen the same selection.

## Vision scan

Open `/find` and choose or take a photo. Scanning uses a quantized CLIP model with ReMake 3D's inventory labels in the browser. The first scan needs internet access to download roughly 155 MB of weights. The browser can cache model files for later use. Photos stay on the device and scanning requires no API key.

The model makes suggestions from the photo and overlapping regions. Review them before adding them to your inventory. Manual entry remains available while the model loads and if scanning fails.

## Impact tracker

Select **I made this** on any guide to record a completed project, or **Undo** on the guide or `/impact` to remove it. Open `/impact` from the header, homepage, or any guide to see completed guides, overall estimated reused grams, and a breakdown by material using the shared taxonomy labels.

### Methodology

- **Weight estimates**: Totals sum each completed guide's catalog `wasteDiverted` grams, recorded once per guide. Real-world mass varies by container size, thickness, and fabric.
- **One completion per guide**: Each guide counts once toward your totals.
- **Local-only storage**: Completions are stored in per-guide browser `localStorage` entries on the current device and stay synced across open tabs without losing edits to distinct guides. No data is sent to a server; if browser storage is unavailable, edits remain in memory for the current tab session.
- **No CO₂e figures**: ReMake 3D reports estimated reused material mass in grams rather than CO₂e savings. Defensible lifecycle models such as [U.S. EPA WARM (Management Practices, v16)](https://www.epa.gov/system/files/documents/2024-01/warm_management_practices_v16_dec.pdf) depend on both a local disposal baseline assumption (whether the item would otherwise be landfilled, combusted, or recycled) and whether the project actually displaces a new purchase—neither of which this catalog tracks.
