import { defineProject, type SceneOpInput } from "@/lib/scene/schema";

const board = { preset: "cardboard", color: "#bc8854" } as const;
const innerBoard = { preset: "cardboard", color: "#caa06e" } as const;
const paperTape = { preset: "cardboard", color: "#e5d5a7" } as const;

const tapeEdges: SceneOpInput[] = [
  { type: "add", duration: 0.2, object: { id: "tape-bl", parent: "base", primitive: "box", params: { width: 1.1, height: 14.0, depth: 1.1 }, transform: { position: [-11.82, 0.45, -7.32] }, material: paperTape } },
  { type: "add", duration: 0.2, object: { id: "tape-br", parent: "base", primitive: "box", params: { width: 1.1, height: 14.0, depth: 1.1 }, transform: { position: [11.82, 0.45, -7.32] }, material: paperTape } },
  { type: "add", duration: 0.2, object: { id: "tape-fl", parent: "base", primitive: "box", params: { width: 1.1, height: 6.5, depth: 1.1 }, transform: { position: [-11.82, 0.45, 7.32] }, material: paperTape } },
  { type: "add", duration: 0.2, object: { id: "tape-fr", parent: "base", primitive: "box", params: { width: 1.1, height: 6.5, depth: 1.1 }, transform: { position: [11.82, 0.45, 7.32] }, material: paperTape } },
];

export default defineProject({
  slug: "cardboard-mail-sorter",
  title: "Tiered cardboard mail sorter",
  summary:
    "Assemble seven flat panels from a sturdy shipping box into a three-slot upright desktop sorter that keeps letters, bills, and slim notebooks easy to see.",
  difficulty: "medium",
  timeMinutes: 35,
  materials: [
    { id: "cardboard", qty: 1, unit: "Sturdy shipping box cut into seven flat panels" },
    { id: "hot-glue-stick", qty: 2 },
    { id: "masking-tape", qty: 1, unit: "Strips to reinforce corners and exposed edges" },
    { id: "acrylic-paint", qty: 1, unit: "Optional exterior coat", optional: true },
  ],
  tools: [
    { id: "utility-knife" },
    { id: "ruler-tape" },
    { id: "marker" },
    { id: "hot-glue-gun" },
    { id: "scissors" },
    { id: "paintbrush", optional: true },
  ],
  // Seven retained corrugated panels (~145 g) cut from one medium shipping box; trim offcuts excluded.
  wasteDiverted: [{ materialId: "cardboard", grams: 145 }],
  sources: [
    {
      title: "DIY Desk Organizer",
      publisher: "Museum of Craft and Design",
      url: "https://sfmcd.org/project/diy-desk-organizer/",
      license: "Publisher copyright (reference only)",
      note: "Inspiration for building structured desk storage from salvaged cardboard; this three-slot tiered vertical mail sorter is an original design.",
    },
  ],
  camera: { position: [30, 36, 38], target: [0, 2, -2] },
  scene: {
    objects: [
      {
        id: "base",
        label: "Cardboard base panel",
        source: "cardboard",
        primitive: "box",
        params: { width: 24, height: 0.45, depth: 15 },
        material: board,
      },
      {
        id: "back-wall",
        label: "Tall back wall",
        parent: "base",
        source: "cardboard",
        primitive: "box",
        params: { width: 24, height: 18, depth: 0.45 },
        transform: { position: [0, 0.45, -7.28], rotation: [-90, 0, 0] },
        material: board,
      },
      {
        id: "side-left",
        label: "Left side wall",
        parent: "base",
        source: "cardboard",
        primitive: "box",
        params: { width: 0.45, height: 14, depth: 14.1 },
        transform: { position: [-11.78, 0.45, 0], rotation: [0, 0, 90] },
        material: board,
      },
      {
        id: "side-right",
        label: "Right side wall",
        parent: "base",
        source: "cardboard",
        primitive: "box",
        params: { width: 0.45, height: 14, depth: 14.1 },
        transform: { position: [11.78, 0.45, 0], rotation: [0, 0, -90] },
        material: board,
      },
      {
        id: "front-wall",
        label: "Low front lip",
        parent: "base",
        source: "cardboard",
        primitive: "box",
        params: { width: 24, height: 6.5, depth: 0.45 },
        transform: { position: [0, 0.45, 7.28], rotation: [90, 0, 0] },
        material: board,
      },
      {
        id: "divider-rear",
        label: "Rear internal divider",
        parent: "base",
        source: "cardboard",
        primitive: "box",
        params: { width: 23.1, height: 14, depth: 0.4 },
        transform: { position: [0, 0.7, 6.8], rotation: [-90, 0, 0] },
        material: innerBoard,
      },
      {
        id: "divider-front",
        label: "Front internal divider",
        parent: "base",
        source: "cardboard",
        primitive: "box",
        params: { width: 23.1, height: 10, depth: 0.4 },
        transform: { position: [0, 1.18, 4.8], rotation: [-90, 0, 0] },
        material: innerBoard,
      },
    ],
  },
  steps: [
    {
      title: "Cut panels and glue the back and side walls",
      text: "Measure and cut seven panels from dry corrugated cardboard: a 24 × 15 cm base, a 24 × 18 cm back wall, two 14.1 × 14 cm side walls (14.1 cm deep × 14 cm tall), two internal dividers (23.1 × 14 cm and 23.1 × 10 cm), and a 24 × 6.5 cm front lip. Hot-glue the tall back wall and both side walls squarely upright onto the base.",
      warning: "Cut thick corrugated cardboard over a scrap board using a straightedge and keep your guide hand behind the utility knife.",
      ops: [
        { type: "transform", target: "back-wall", rotation: [0, 0, 0], pivot: [0, 0, 0], duration: 0.7 },
        { type: "transform", target: "side-left", rotation: [0, 0, 0], pivot: [0, 0, 0], duration: 0.7 },
        { type: "transform", target: "side-right", rotation: [0, 0, 0], pivot: [0, 0, 0], duration: 0.7 },
      ],
      camera: { position: [28, 22, 34], target: [0, 8, 0] },
    },
    {
      title: "Install the stepped dividers and front lip",
      text: "Mark spacing every 5 cm from the back wall inside the box. Hot-glue the 14 cm divider into the rear mark, the 10 cm divider into the front mark, and close the front edge with the 6.5 cm lip so all three slots step down toward you.",
      tip: "Press each divider firmly against both side walls for ten seconds while the glue cools so the slots stay square.",
      ops: [
        { type: "transform", target: "divider-rear", position: [0, 0.45, -2.5], rotation: [0, 0, 0], arc: 5, duration: 0.8 },
        { type: "transform", target: "divider-front", position: [0, 0.45, 2.4], rotation: [0, 0, 0], arc: 5, duration: 0.8 },
        { type: "transform", target: "front-wall", rotation: [0, 0, 0], pivot: [0, 0, 0], duration: 0.65 },
      ],
      camera: { position: [26, 24, 32], target: [0, 8, 0] },
    },
    {
      title: "Bind the corners and paint exterior (optional)",
      text: "Wrap masking tape cleanly down the four outside corners to reinforce the glue joints and hide raw corrugated flutes. Optionally brush a coat of acrylic paint over the outside walls while leaving the inside dividers natural cardboard.",
      ops: [
        ...tapeEdges,
        { type: "paint", target: "back-wall", color: "#4a6c75", preset: "paint", duration: 0.5 },
        { type: "paint", target: "side-left", color: "#4a6c75", preset: "paint", duration: 0.5 },
        { type: "paint", target: "side-right", color: "#4a6c75", preset: "paint", duration: 0.5 },
        { type: "paint", target: "front-wall", color: "#4a6c75", preset: "paint", duration: 0.5 },
      ],
      camera: { position: [24, 20, 30], target: [0, 8.5, 0] },
    },
    {
      title: "Sort notebooks, envelopes, and cards by height",
      text: "Place taller folders or slim notebooks in the back tier, standard letters in the middle tier, and receipts or postcards in the front slot so every label stays visible at a glance.",
      ops: [
        {
          type: "add",
          object: {
            id: "notebook",
            label: "Notebook",
            parent: "base",
            primitive: "box",
            params: { width: 17.5, height: 21.5, depth: 1.6 },
            transform: { position: [-1.2, 0.5, -4.9] },
            material: { preset: "paint", color: "#35556e" },
          },
        },
        {
          type: "add",
          object: {
            id: "envelope",
            label: "Letter envelope",
            parent: "base",
            primitive: "box",
            params: { width: 18.0, height: 14.5, depth: 0.7 },
            transform: { position: [1.0, 0.5, 0.0] },
            material: { preset: "cardboard", color: "#f2ece0" },
          },
        },
        {
          type: "add",
          object: {
            id: "card-left",
            label: "Note card",
            parent: "base",
            primitive: "box",
            params: { width: 10.5, height: 9.8, depth: 0.45 },
            transform: { position: [-4.2, 0.5, 4.9] },
            material: { preset: "paint", color: "#d6855c" },
          },
        },
        {
          type: "add",
          object: {
            id: "card-right",
            label: "Receipt envelope",
            parent: "base",
            primitive: "box",
            params: { width: 9.5, height: 8.6, depth: 0.45 },
            transform: { position: [4.8, 0.5, 5.0] },
            material: { preset: "cardboard", color: "#e5d5a7" },
          },
        },
      ],
      camera: { position: [26, 24, 34], target: [0, 10, 0] },
    },
  ],
});
