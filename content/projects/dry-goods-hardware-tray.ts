import { defineProject, type SceneObjectInput, type SceneOpInput } from "@/lib/scene/schema";

const board = { preset: "cardboard", color: "#bc8954" } as const;
const dividerBoard = { preset: "cardboard", color: "#cca06e" } as const;
const paperTape = { preset: "cardboard", color: "#e4d3a5" } as const;

const walls: SceneObjectInput[] = [
  { id: "wall-front", parent: "tray-base", primitive: "box", params: { width: 26, height: 3.2, depth: 0.4 }, transform: { position: [0, 0.45, 9.0], rotation: [90, 0, 0] }, material: board },
  { id: "wall-back", parent: "tray-base", primitive: "box", params: { width: 26, height: 3.2, depth: 0.4 }, transform: { position: [0, 0.45, -9.0], rotation: [-90, 0, 0] }, material: board },
  { id: "wall-left", parent: "tray-base", primitive: "box", params: { width: 0.4, height: 3.2, depth: 17.2 }, transform: { position: [-13.0, 0.45, 0], rotation: [0, 0, 90] }, material: board },
  { id: "wall-right", parent: "tray-base", primitive: "box", params: { width: 0.4, height: 3.2, depth: 17.2 }, transform: { position: [13.0, 0.45, 0], rotation: [0, 0, -90] }, material: board },
];

const corners: SceneObjectInput[] = [
  { id: "corner-fl", parent: "tray-base", primitive: "box", params: { width: 3.2, height: 0.42, depth: 3.2 }, transform: { position: [-14.6, 0.03, 10.6] }, material: board },
  { id: "corner-fr", parent: "tray-base", primitive: "box", params: { width: 3.2, height: 0.42, depth: 3.2 }, transform: { position: [14.6, 0.03, 10.6] }, material: board },
  { id: "corner-bl", parent: "tray-base", primitive: "box", params: { width: 3.2, height: 0.42, depth: 3.2 }, transform: { position: [-14.6, 0.03, -10.6] }, material: board },
  { id: "corner-br", parent: "tray-base", primitive: "box", params: { width: 3.2, height: 0.42, depth: 3.2 }, transform: { position: [14.6, 0.03, -10.6] }, material: board },
];

const capSpecs = [
  { id: "well-1", x: -10.5, z: -3.8, color: "#2d8a82" },
  { id: "well-2", x: -6.5, z: -3.8, color: "#2d8a82" },
  { id: "well-3", x: -2.5, z: -3.8, color: "#2d8a82" },
  { id: "well-4", x: 1.5, z: -3.8, color: "#2d8a82" },
  { id: "well-5", x: -10.5, z: 3.8, color: "#3b6ea5" },
  { id: "well-6", x: -6.5, z: 3.8, color: "#3b6ea5" },
  { id: "well-7", x: -2.5, z: 3.8, color: "#3b6ea5" },
  { id: "well-8", x: 1.5, z: 3.8, color: "#3b6ea5" },
] as const;

const addCapWells: SceneOpInput[] = capSpecs.map(({ id, x, z, color }): SceneOpInput => ({
  type: "add",
  duration: 0.16,
  object: {
    id,
    label: "Bottle-cap sorting well",
    source: "bottle-cap",
    parent: "tray-base",
    primitive: "cap",
    params: { height: 1.5, radius: 1.85 },
    // Caps default open-side down; flipping 180° around X places the closed base on the tray (y = 0.45) and opens the cup upward.
    transform: { position: [x, 1.95, z], rotation: [180, 0, 0] },
    material: { preset: "plastic", color },
  },
}));

const tapeCorners: SceneOpInput[] = [
  { type: "add", duration: 0.12, object: { id: "tape-fl", parent: "tray-base", primitive: "box", params: { width: 1.0, height: 2.8, depth: 1.0 }, transform: { position: [-13.0, 0.55, 9.0] }, material: paperTape } },
  { type: "add", duration: 0.12, object: { id: "tape-fr", parent: "tray-base", primitive: "box", params: { width: 1.0, height: 2.8, depth: 1.0 }, transform: { position: [13.0, 0.55, 9.0] }, material: paperTape } },
  { type: "add", duration: 0.12, object: { id: "tape-bl", parent: "tray-base", primitive: "box", params: { width: 1.0, height: 2.8, depth: 1.0 }, transform: { position: [-13.0, 0.55, -9.0] }, material: paperTape } },
  { type: "add", duration: 0.12, object: { id: "tape-br", parent: "tray-base", primitive: "box", params: { width: 1.0, height: 2.8, depth: 1.0 }, transform: { position: [13.0, 0.55, -9.0] }, material: paperTape } },
];

export default defineProject({
  slug: "dry-goods-hardware-tray",
  title: "Bottle-cap & cardboard hardware tray",
  summary:
    "Build a shallow corrugated cardboard tray fitted with eight clean plastic bottle caps glued open-side up to keep tiny screws, washers, and beads from rolling away.",
  difficulty: "easy",
  timeMinutes: 25,
  materials: [
    { id: "cardboard", qty: 1, unit: "Flat corrugated scrap for 32.4 × 24.4 cm tray sheet and divider" },
    { id: "bottle-cap", qty: 8, unit: "Clean wide plastic caps (milk or juice caps work best)" },
    { id: "hot-glue-stick", qty: 1 },
    { id: "masking-tape", qty: 1, unit: "Four short corner strips", optional: true },
  ],
  tools: [
    { id: "scissors" },
    { id: "ruler-tape" },
    { id: "marker" },
    { id: "hot-glue-gun" },
    { id: "utility-knife", optional: true },
  ],
  // Eight clean plastic caps (~3 g each = 24 g) plus retained corrugated cardboard tray and divider (~34 g).
  wasteDiverted: [
    { materialId: "bottle-cap", grams: 24 },
    { materialId: "cardboard", grams: 34 },
  ],
  sources: [
    {
      title: "DIY Desk Organizer",
      publisher: "Museum of Craft and Design",
      url: "https://sfmcd.org/project/diy-desk-organizer/",
      license: "Publisher copyright (reference only)",
      note: "Inspiration for building structured desktop trays from salvaged cardboard; this bottle-cap well workbench tray is an original design.",
    },
    {
      title: "Bottle cap mosaic Art & Craft",
      publisher: "World Scouting",
      url: "https://sdgs.scout.org/activity-type/bottle-cap-mosaic-art-craft",
      license: "Publisher copyright (reference only)",
      note: "Reference for bonding clean discarded plastic bottle caps onto corrugated cardboard with glue; adapted here open-side up into an original hardware sorting tray.",
    },
  ],
  camera: { position: [22, 34, 34], target: [0, 1, 0] },
  scene: {
    objects: [
      {
        id: "tray-base",
        label: "Cardboard tray base",
        source: "cardboard",
        primitive: "box",
        params: { width: 26, height: 0.45, depth: 18 },
        material: board,
      },
      ...walls,
      ...corners,
    ],
  },
  steps: [
    {
      title: "Trim the corner squares and fold up the tray",
      text: "Mark a 3.2 cm border all around a flat 32.4 × 24.4 cm cardboard sheet, snip out the four corner squares with scissors, fold the four rim flaps upright against a ruler, and secure each outside corner with masking tape or hot glue.",
      ops: [
        ...corners.map(({ id }): SceneOpInput => ({ type: "remove", target: id, away: [0, 5, 3], duration: 0.25 })),
        { type: "transform", target: "wall-back", rotation: [0, 0, 0], pivot: [0, 0, 0], duration: 0.5 },
        { type: "transform", target: "wall-left", rotation: [0, 0, 0], pivot: [0, 0, 0], duration: 0.5 },
        { type: "transform", target: "wall-right", rotation: [0, 0, 0], pivot: [0, 0, 0], duration: 0.5 },
        { type: "transform", target: "wall-front", rotation: [0, 0, 0], pivot: [0, 0, 0], duration: 0.5 },
        ...tapeCorners,
      ],
      camera: { position: [22, 24, 30], target: [0, 2, 0] },
    },
    {
      title: "Glue in a bay divider for longer tools",
      text: "Cut a 17.2 × 2.8 cm corrugated strip and hot-glue it upright about 8.5 cm in from the right rim. This separates an open side bay for screwdrivers or longer bolts from the small-parts well section.",
      ops: [
        {
          type: "add",
          object: {
            id: "bay-divider",
            label: "Side bay divider",
            parent: "tray-base",
            source: "cardboard",
            primitive: "box",
            params: { width: 0.4, height: 2.8, depth: 17.2 },
            transform: { position: [3.9, 0.45, 0] },
            material: dividerBoard,
          },
        },
      ],
      camera: { position: [18, 22, 26], target: [1, 2, 0] },
    },
    {
      title: "Glue eight clean bottle caps open-side up",
      text: "Wash and dry eight plastic bottle caps, arrange them open-side up in two neat rows of four across the left section, and bond each cap’s flat underside to the cardboard base with a dab of hot glue.",
      tip: "Using two cap colours makes it easy to separate metric and imperial fasteners or sequential disassembly steps.",
      warning: "Keep fingertips clear of melted hot glue when pressing each shallow cap down onto the tray.",
      ops: addCapWells,
      camera: { position: [14, 24, 24], target: [-2, 1.5, 0] },
    },
    {
      title: "Sort tiny hardware and bench tools",
      text: "Drop small screws, brass washers, hex nuts, or craft beads into individual cap wells so they stay corralled while you work, and lay a screwdriver or tweezers in the right-hand bay.",
      ops: [
        { type: "fill", target: "well-1", id: "parts-1", level: 0.65, inset: 0.86, material: { preset: "aluminium", color: "#8c949e" }, duration: 0.35 },
        { type: "fill", target: "well-2", id: "parts-2", level: 0.6, inset: 0.86, material: { preset: "aluminium", color: "#b89b5e" }, duration: 0.35 },
        { type: "fill", target: "well-3", id: "parts-3", level: 0.55, inset: 0.86, material: { preset: "aluminium", color: "#6f7782" }, duration: 0.35 },
        { type: "fill", target: "well-5", id: "parts-5", level: 0.6, inset: 0.86, material: { preset: "paint", color: "#c77246" }, duration: 0.35 },
        { type: "fill", target: "well-6", id: "parts-6", level: 0.5, inset: 0.86, material: { preset: "aluminium", color: "#9ba3ad" }, duration: 0.35 },
        {
          type: "add",
          object: {
            id: "driver-handle",
            label: "Screwdriver",
            parent: "tray-base",
            primitive: "solid",
            params: { points: [[0.85, 0], [0.95, 6.2], [0.55, 7.0]] },
            transform: { position: [8.4, 1.35, -6.2], rotation: [90, 0, 0] },
            material: { preset: "plastic", color: "#c9583e" },
          },
        },
        {
          type: "add",
          object: {
            id: "driver-shaft",
            parent: "driver-handle",
            primitive: "solid",
            params: { points: [[0.22, 0], [0.22, 6.6]] },
            transform: { position: [0, 6.8, 0] },
            material: { preset: "aluminium", color: "#c5cbd1" },
          },
        },
      ],
      camera: { position: [18, 22, 26], target: [0, 2, 0] },
    },
  ],
});
