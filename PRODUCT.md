# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Everyday households and makers**: people with clean recyclable packaging (PET bottles, HDPE milk jugs, glass jars and bottles, steel cans, cardboard boxes, Tetra Pak cartons, newspapers, worn cotton T-shirts, old denim) and common household tools (scissors, utility knife, hot glue gun, drill, awl, marker, ruler, sandpaper, paintbrush) who want practical, buildable objects rather than throwing usable material in the bin.
- **Students and eco-conscious beginners**: first-time upcyclers who need spatial clarity—seeing exact cut lines, folds, and assembly sequences in 3D before cutting a real container—so projects succeed on the first try.
- **Arbiter Hacks V1 judges (*Theme Track: Rethinking Waste*)**: technical and design evaluators judging Impact on Waste (35%), Technical Execution (25%), Feasibility (20%), and Presentation (20%).

## Product Purpose

ReMake 3D helps everyday households turn clean recyclable items and common household tools into useful everyday objects through interactive, step-by-step procedural 3D build guides. Success means a visitor can go from items sitting on their kitchen counter—either scanned from a photo on-device or picked manually—to a matched, feasible project, step through its interactive 3D assembly preview without ambiguity, and log completed builds to track honest reused-material weight locally.

## Positioning

Unlike static craft blogs or Pinterest boards that leave makers guessing where to cut or fold—and unlike cloud AI wrappers that upload household photos to external APIs or invent speculative CO₂e claims—ReMake 3D pairs deterministic material-and-tool matching and 100% on-device vision scanning (`Xenova/clip-vit-base-patch32` quantized `q8` WASM in a Web Worker, zero API keys, photos never leave the device) with an interactive procedural Three.js / React Three Fiber 3D step player synchronized to curated, source-attributed upcycling guides and transparent gram-based impact accounting.

## Operating Context

- **Real usage scenes**: kitchen table, balcony gardening bench, dorm desk, or home craft workbench in daylight or warm indoor lighting, often on a phone propped beside scissors and containers or a laptop open beside the workspace.
- **Core workflows**:
  1. **Catalog (`/`)**: Browse 20 curated, source-attributed upcycling guides across 11 household waste streams (87 procedural 3D steps, 2,256 g estimated reusable mass total).
  2. **Find & On-Device Vision Scan (`/find`)**: Upload or capture a photo for client-side CLIP classification (with explicit user confirmation before adding items), or search bilingual EN/VI material and tool aliases to build a quantity-tracked inventory.
  3. **Deterministic 3-Tier Matches (`/results`)**: Shareable URL query contract (`?material=<id>:<qty>&tool=<id>`) grouping all 20 guides into *Ready to make*, *Missing 1–2 items*, and *Inspiration*, explicitly listing still-needed items.
  4. **3D Step-by-Step Guide (`/project/[slug]`)**: Split-screen interactive Three.js / R3F `<Player />` synced with step list, materials/tools checklist, safety warnings, craft tips, `#step-N` deep-links, `?speed=0.25` slow-motion, `?record=1` canvas capture, arrow-key stepping, attributed sources, and local "I made this" toggle.
  5. **Local Impact Tracker (`/impact`)**: Tracks completed guides (counted once each), estimated reused grams, per-material breakdown in cross-tab synced `localStorage` (with in-memory fallback when storage is unavailable), and an honest methodology section explaining why ReMake 3D reports grams instead of speculative CO₂e (citing U.S. EPA WARM v16).

## Capabilities and Constraints

- **Stack**: Next.js 15 App Router, React 19, TypeScript, Tailwind CSS v4, Three.js / `@react-three/fiber` / `@react-three/drei`, `@huggingface/transformers` (client worker), Zod (server/build validation only — must never leak into `.next/static/` client bundles).
- **Hard invariants**:
  - Preserve all 20 project definitions, procedural 3D geometry/ops/reducer/camera/lighting logic (`lib/scene/ops.ts`, `primitives/*`, `three.ts`, `transition.ts`, `schema.ts`, `validate.ts`, `content/projects/*.ts`).
  - Preserve all URL contracts (`/`, `/find`, `/results?material=...&tool=...`, `/project/[slug]#step-N?speed=...&record=1`, `/impact`).
  - Preserve cross-tab `localStorage` impact store (`remake3d:impact:v1:made:*`), one-completion-per-guide semantics, and undo flow.
  - Preserve on-device photo scanning flow, explicit confirmation before adding detected items, and zero-network privacy guarantees after model weight download.
  - Keep `README.md` untouched during the UI redesign.

## Brand Commitments

- **Name**: ReMake 3D
- **Voice**: Practical, clear, tactile, honest, and grounded—speaks like a well-edited workshop manual rather than a marketing campaign or greenwashing brochure. Never fabricates CO₂e savings, user testimonials, or unverified metrics.
- **Redesign direction (from project brief)**: Replace the generic dark-green rounded-card AI-slop aesthetic with an intentional, tactile workshop-manual / craft-atelier / physical-print-meets-CAD identity: warm archival paper/workbench grounds, crisp ink typography with genuine personality, purposeful material-coded accents across waste streams (not monochrome emerald soup), sharp editorial layout rhythm, and specimen-card visual identity across the 20-project catalog.

## Evidence on Hand

- 20 validated, source-attributed project modules in `content/projects/*.ts` spanning 11 primary waste materials, 87 procedural 3D assembly steps, and 2,256 g total estimated reusable mass.
- Bilingual (EN + VI) normalized taxonomy of 20 materials/supplies and 9 household tools in `lib/taxonomy.ts`.
- Verified deterministic unit test suites (`lib/impact.test.ts`, `lib/match.test.ts`, `lib/scan.test.ts`, `lib/scene/scene.test.ts`, `lib/taxonomy.test.ts`).
- **Absences not to fabricate**: no user testimonials, no community user counts, no CO₂e savings claims, no paid tiers or accounts, no cloud backend claims.

## Product Principles

1. **Show the build, never hide the craft**: the procedural 3D model and concrete material recipes are the star; chrome recedes when a maker is working.
2. **Feasibility before inspiration**: match what is actually on the user's table first, clearly separating ready-to-make projects from near-misses.
3. **Radical honesty on waste metrics**: report catalog-estimated reused grams per material and cite methodology openly; never inflate impact with invented CO₂e numbers.
4. **Private, local, frictionless**: zero sign-up, zero API keys, on-device photo classification with explicit user confirmation, and local cross-tab progress persistence.
5. **Mode-disciplined craft**: persuade and invite on the landing catalog, operate with precision and calm clarity on Find/Results/Impact, and put the 3D artifact front and center on every Project guide.

## Accessibility & Inclusion

- Full keyboard navigability across catalog, pickers, 3D step controls (including Left/Right arrow stepping), and impact controls with high-contrast `focus-visible` indicators.
- Semantic landmarks, `aria-current`, `aria-pressed`, `aria-live="polite"` / `role="status"` announcements, WCAG AA contrast (≥4.5:1 body text, ≥3:1 large text/UI), `prefers-reduced-motion` respect, and zero horizontal overflow down to 390px mobile viewports.
