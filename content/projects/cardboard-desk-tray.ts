import { defineProject, type SceneObjectInput, type SceneOpInput } from "@/lib/scene/schema";

const board = { preset: "cardboard", color: "#bc8752" } as const;
const paperTape = { preset: "cardboard", color: "#e3d2a4" } as const;

const walls: SceneObjectInput[] = [
  { id: "front", primitive: "box", params: { width: 24, height: 4, depth: 0.35 }, transform: { position: [0, 0.2, 8], rotation: [90, 0, 0] }, material: board },
  { id: "back", primitive: "box", params: { width: 24, height: 4, depth: 0.35 }, transform: { position: [0, 0.2, -8], rotation: [-90, 0, 0] }, material: board },
  { id: "left", primitive: "box", params: { width: 0.35, height: 4, depth: 15.65 }, transform: { position: [-12, 0.2, 0], rotation: [0, 0, 90] }, material: board },
  { id: "right", primitive: "box", params: { width: 0.35, height: 4, depth: 15.65 }, transform: { position: [12, 0.2, 0], rotation: [0, 0, -90] }, material: board },
];

const corners: SceneObjectInput[] = [
  { id: "corner.fl", primitive: "box", params: { width: 4, height: 0.36, depth: 4 }, transform: { position: [-14, 0.02, 10] }, material: board },
  { id: "corner.fr", primitive: "box", params: { width: 4, height: 0.36, depth: 4 }, transform: { position: [14, 0.02, 10] }, material: board },
  { id: "corner.bl", primitive: "box", params: { width: 4, height: 0.36, depth: 4 }, transform: { position: [-14, 0.02, -10] }, material: board },
  { id: "corner.br", primitive: "box", params: { width: 4, height: 0.36, depth: 4 }, transform: { position: [14, 0.02, -10] }, material: board },
];

const fold: SceneOpInput[] = [
  { type: "transform", target: "back", rotation: [0, 0, 0], pivot: [0, 0, 0], duration: 0.65 },
  { type: "transform", target: "left", rotation: [0, 0, 0], pivot: [0, 0, 0], duration: 0.65 },
  { type: "transform", target: "right", rotation: [0, 0, 0], pivot: [0, 0, 0], duration: 0.65 },
  { type: "transform", target: "front", rotation: [0, 0, 0], pivot: [0, 0, 0], duration: 0.65 },
];

const tapeCorners: SceneOpInput[] = [-1, 1].flatMap((x) => [-1, 1].flatMap((z): SceneOpInput[] => [
  {
    type: "add", duration: 0.22,
    object: {
      id: `tape.${x > 0 ? "r" : "l"}${z > 0 ? "f" : "b"}.long`,
      primitive: "box", params: { width: 2.15, height: 3.4, depth: 0.07 },
      transform: { position: [x * 11.07, 0.45, z * 8.21] }, material: paperTape,
    },
  },
  {
    type: "add", duration: 0.22,
    object: {
      id: `tape.${x > 0 ? "r" : "l"}${z > 0 ? "f" : "b"}.short`,
      primitive: "box", params: { width: 0.07, height: 3.4, depth: 2.15 },
      transform: { position: [x * 12.21, 0.45, z * 7.08] }, material: paperTape,
    },
  },
]));

export default defineProject({
  slug: "cardboard-desk-tray",
  title: "Fold-up cardboard desk tray",
  summary: "Turn one sheet from a shipping box into a low tray for notes, pens and pocket clutter.",
  difficulty: "easy",
  timeMinutes: 20,
  materials: [
    { id: "cardboard", qty: 1, unit: "One flat 32 × 24 cm piece" },
    { id: "masking-tape", qty: 1, unit: "Four short strips" },
  ],
  tools: [{ id: "scissors" }, { id: "ruler-tape" }, { id: "marker" }],
  wasteDiverted: [{ materialId: "cardboard", grams: 26 }],
  sources: [{
    title: "DIY Desk Organizer",
    publisher: "Museum of Craft and Design",
    url: "https://sfmcd.org/project/diy-desk-organizer/",
    license: "Publisher copyright (reference only)",
    note: "Inspiration for using discarded cardboard to organize a desk. The single-sheet tray is our own design.",
  }],
  camera: { position: [32, 48, 44], target: [0, 0, 0] },
  scene: {
    objects: [
      { id: "base", source: "cardboard", primitive: "box", params: { width: 24, height: 0.4, depth: 16 }, transform: { position: [0, 0, 0] }, material: board },
      ...walls,
      ...corners,
    ],
  },
  steps: [
    {
      title: "Cut out four corner squares",
      text: "Cut a clean panel 32 by 24 cm. Draw a line 4 cm in from each edge. At every corner, cut away the 4 cm square so the four remaining flaps can fold independently.",
      tip: "A dry panel with no crushed creases gives the tray a firmer base.",
      ops: corners.map(({ id }) => ({ type: "remove", target: id, away: [0, 5, 4], duration: 0.35 })),
    },
    {
      title: "Fold up the sides",
      text: "Hold your ruler along a line and bend the flap upward against it. Repeat for the other three sides until the corners meet.",
      ops: fold,
      camera: { position: [28, 25, 33], target: [0, 2, 0] },
    },
    {
      title: "Tape the corners",
      text: "Pinch two walls together, then wrap a strip of tape around the outside of their corner. Press it down on both walls and repeat at the other corners.",
      tip: "Use it for dry, light items. A damp cloth can soften the cardboard.",
      ops: tapeCorners,
    },
  ],
});
