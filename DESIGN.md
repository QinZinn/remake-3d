---
name: ReMake 3D
description: Architectural workshop manual and interactive 3D upcycling craft system built on cool archival drafting paper, crisp carbon ink, vermilion cut-line accents, and material-stream orthographic schematics.
colors:
  paper: "#ecefeb"
  plate: "#f9fbf8"
  kraft-mat: "#dfe4df"
  drafting-board: "#191f1c"
  ink: "#161917"
  ink-secondary: "#434843"
  ink-muted: "#565c56"
  rule: "#c5ccc5"
  rule-subtle: "#d6dcd6"
  vermilion: "#b53218"
  vermilion-hover: "#922510"
  cobalt: "#1b4c77"
  sage: "#1a573c"
  sage-tint: "#dfede5"
  ochre: "#754008"
  ochre-tint: "#faf0dc"
  crimson: "#941f24"
  crimson-tint: "#fbeae9"
  stream-plastic: "#1d5e82"
  stream-paper: "#965819"
  stream-glass: "#196b63"
  stream-metal: "#485867"
  stream-textile: "#8c3852"
typography:
  display:
    fontFamily: "Bricolage Grotesque, Source Sans 3, system-ui, sans-serif"
    fontSize: "4.35rem"
    fontWeight: 700
    lineHeight: 0.98
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Bricolage Grotesque, Source Sans 3, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 700
    lineHeight: 1.08
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Bricolage Grotesque, Source Sans 3, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 700
    lineHeight: 1.24
    letterSpacing: "-0.015em"
  body:
    fontFamily: "Source Sans 3, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
    letterSpacing: "0em"
  spec:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: "0.02em"
rounded:
  xs: "2px"
  sm: "3px"
  md: "4px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  2xl: "48px"
components:
  button-primary:
    backgroundColor: "{colors.vermilion}"
    textColor: "{colors.plate}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  button-primary-hover:
    backgroundColor: "{colors.vermilion-hover}"
    textColor: "{colors.plate}"
    rounded: "{rounded.md}"
  button-secondary:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "10px 20px"
  specimen-card:
    backgroundColor: "{colors.plate}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "20px"
  workbench-tray:
    backgroundColor: "{colors.kraft-mat}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "24px"
---

## Overview

ReMake 3D's visual world draws from physical industrial craft manuals (Enzo Mari's *Autoprogettazione* and technical shop-drawing plates) paired with crisp CAD drafting discipline. Every screen sits on cool mineral drafting bond (`#ecefeb`), elevated white plates (`#f9fbf8`), and recessed workbench mats (`#dfe4df`), framed by hairline rules (`#c5ccc5`) and sharp `4px` architectural corners.

Surface ambition scales intentionally by visitor mode:
- **Landing & Catalog (`/`) — Persuade + Experience**: asymmetric 12-column opening spread pairing the headline, working entry actions, and live catalog ledger with an interactive dark orthographic blueprint plate (`HeroDraftingPlate`) and filterable 20-specimen catalog index.
- **Find (`/find`), Matches (`/results`), Impact (`/impact`) — Operate**: calm, high-contrast workbench utility with clear hierarchy, flat non-nested containers, consistent controls, and unambiguous empty/loading/error/confirmed states.
- **3D Build Guide (`/project/[slug]`) — Experience + Operate**: expansive warm-mineral 3D studio stage (`#e4e8e3`) on the left / sticky mobile top paired with a structured workshop manual column on the right.

## Colors

- **Grounds & ink**: Mineral drafting paper (`--bg-paper: #ecefeb`), crisp plate white (`--bg-plate: #f9fbf8`), recessed workbench tray (`--bg-kraft: #dfe4df`), dark drafting board (`--bg-board: #191f1c`), carbon ink (`--ink: #161917`), graphite secondary ink (`--ink-secondary: #434843`), muted metadata ink (`--ink-muted: #565c56`). All body and secondary text pairs exceed WCAG AA 4.5:1 contrast.
- **Action & semantic roles**:
  - **Workshop Vermilion (`#b53218`, hover `#922510`)**: reserved for primary actions, active cut-line indicators, active 3D step badges, and the 3D playback progress track.
  - **Drafting Cobalt (`#1b4c77`)**: focus rings, interactive links, and craft tip callouts.
  - **Botanical Sage (`#1a573c` / `#dfede5`)**: reserved strictly for "Made" completion states, "Ready to make" indicators, and completed step checkmarks.
  - **Ochre Amber (`#754008` / `#faf0dc`)**: safety warnings, storage-unavailable notices, and "Still needed" match callouts.
  - **Crimson (`#941f24` / `#fbeae9`)**: scan validation and model error alerts.
- **Material-stream swatch system (`app/components/materialMeta.tsx`)**: Every taxonomy material category carries a disciplined ink, mat tint, hairline rule, and bar fill — Plastic (cobalt `#1d5e82`), Paper & Card (kraft ochre `#965819`), Glass (bottle teal `#196b63`), Metal (galvanized slate `#485867`), Textile (loom plum `#8c3852`), and Supply/Wood/Rubber (workshop olive/umber).

## Typography

Loaded via `next/font/google` in `app/layout.tsx` (self-hosted at build time):
- **Display & Headings (`--font-display`)**: `Bricolage Grotesque` (500–800) with tight display tracking (`-0.03em` to `-0.015em`) and `text-wrap: balance`.
- **Body & UI (`--font-sans`)**: `Source Sans 3` (400–700) with `text-wrap: pretty` and constrained prose measures (`48ch`–`60ch`).
- **Specifications & Numerals (`--font-mono`)**: `JetBrains Mono` (400–600) with `font-variant-numeric: tabular-nums`, reserved strictly for real measurements, gram weights, quantities, step indices (`01 / 09`), and catalog codes.
- **Minimum size floor**: 12px (`text-xs`) for metadata and body captions, 11px minimum only for compact mono badges/codes.

## Layout

- Centered `max-w-6xl` (`1152px`) container with `px-5 sm:px-8` gutters across `/`, `/find`, `/results`, and `/impact`.
- Full-bleed `max-w-[1600px]` split workbench (`lg:h-screen lg:flex-row`) on `/project/[slug]`, with a `50vh` sticky 3D stage on mobile and `31rem` independently scrolling manual column on desktop.
- Major sections separate via full-width `1px` architectural hairline rules (`--rule`) with generous vertical rhythm and zero horizontal overflow down to `390px`.

## Elevation & Depth

- Tonal surface layering and crisp `1px` borders carry hierarchy rather than heavy drop shadows.
- Interactive specimen cards (`ProjectCard`) and the active stepper plate use a subtle paper-lift shadow (`0 6px 18px -10px rgba(22, 25, 23, 0.22)`) on hover/active state only.
- Floating 3D transport chrome in `lib/scene/Player.tsx` uses translucent plate white (`#f9fbf8/95`) with light backdrop blur over the 3D canvas.

## Shapes

- Sharp architectural corners (`rounded-[4px]` on cards, panels, buttons, inputs; `rounded-[3px]` on compact chips, step badges, and nav items; `rounded-[2px]` on progress tracks).
- Circles are reserved strictly for functional geometry: material-stream status dots (`h-2 w-2 rounded-full`) and the circular 3D play/pause transport button.
- Custom single-weight `1.5px` stroke SVG icon library (`app/components/Icons.tsx`) and 11 bespoke orthographic recyclable schematics (`MaterialSchematic` in `app/components/materialMeta.tsx`) with vermilion dashed cut/fold lines.

## Components

- **`CatalogHeader`**: Single-line architectural top bar with geometric `BrandMark`, `Bricolage Grotesque` wordmark, and bottom-bar active navigation indicator (`aria-current="page"`).
- **`HeroDraftingPlate`**: Dark drafting-board SVG blueprint plate on `/` featuring an SVG `<pattern>` blueprint grid, orthographic PET planter assembly stages (`01 Raw bottle`, `02 Mark & cut`, `03 Invert & wick`), and deep links to `/project/pet-self-watering-planter#step-N`.
- **`CatalogBrowser` + `ProjectCard`**: SSR-rendered 20-specimen index with client-side material-stream filter chips, instant text search, material-tinted orthographic schematic header band, difficulty/time/step mono footer, and flat top-ruled "Still needed" slot for `/results`.
- **`PhotoScanPanel` & `InventoryForm`**: Flat, non-nested workbench panels with hairline dividers, on-device CLIP photo scan preview/review states, bilingual EN/VI alias pickers with material dots, and sticky recessed workbench tray with mono quantity controls.
- **`ProjectView`, `Player`, & `MadeThisControl`**: Warm mineral 3D stage (`#e4e8e3`), vermilion progress track & transport HUD, structured 4-cell spec strip, toggleable "I made this" / "Made" + "Undo" stamp block, Bill of Materials, numbered assembly stepper with ochre Safety and cobalt Tip banners, and attributed Sources cards.
- **`ImpactDashboard`**: Single unified 3-column architectural ledger bar (no 3-box SaaS metric card template), material-stream color-coded proportion bars, ruled completed-guides log, and constrained-measure methodology section.

## Do's and Don'ts

- **Do** preserve browser surface theming (`::selection`, `caret-color`, `scrollbar-color`, `focus-visible` cobalt ring, `tabular-nums`, `prefers-reduced-motion`).
- **Do** keep every interactive surface flat (hairline dividers instead of nested bordered cards) and reserve vermilion strictly for primary actions and active cut/step cues.
- **Do** keep `ProjectCardData` / `ImpactProjectSummary` serialized on the server so Zod and 3D scene modules never leak into client bundles.
- **Don't** add eyebrows/kickers above headings, decorative section numbers, emoji/unicode glyphs as UI icons, rounded-2xl card templates, or one-sided accent borders.
- **Don't** fabricate CO₂e savings, user counts, or testimonials; keep all impact claims grounded in catalog-estimated reused grams.
