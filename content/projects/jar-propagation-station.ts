import { defineProject, type SceneObjectInput, type SceneOpInput } from "@/lib/scene/schema";

const board = { preset: "cardboard", color: "#bc8a56" } as const;
const collarBoard = { preset: "cardboard", color: "#cfa16d" } as const;

const trayRails: SceneObjectInput[] = [
  { id: "rail-front", parent: "tray-base", primitive: "box", params: { width: 21, height: 3.2, depth: 0.4 }, transform: { position: [0, 0.45, 5.25], rotation: [90, 0, 0] }, material: board },
  { id: "rail-back", parent: "tray-base", primitive: "box", params: { width: 21, height: 3.2, depth: 0.4 }, transform: { position: [0, 0.45, -5.25], rotation: [-90, 0, 0] }, material: board },
  { id: "rail-left", parent: "tray-base", primitive: "box", params: { width: 0.4, height: 3.2, depth: 9.7 }, transform: { position: [-10.5, 0.45, 0], rotation: [0, 0, 90] }, material: board },
  { id: "rail-right", parent: "tray-base", primitive: "box", params: { width: 0.4, height: 3.2, depth: 9.7 }, transform: { position: [10.5, 0.45, 0], rotation: [0, 0, -90] }, material: board },
];

const foldTray: SceneOpInput[] = [
  { type: "transform", target: "rail-back", rotation: [0, 0, 0], pivot: [0, 0, 0], duration: 0.5 },
  { type: "transform", target: "rail-left", rotation: [0, 0, 0], pivot: [0, 0, 0], duration: 0.5 },
  { type: "transform", target: "rail-right", rotation: [0, 0, 0], pivot: [0, 0, 0], duration: 0.5 },
  { type: "transform", target: "rail-front", rotation: [0, 0, 0], pivot: [0, 0, 0], duration: 0.5 },
];

function jarSetup(side: "left" | "right", x: number, labelColor: string): SceneObjectInput[] {
  return [
    {
      id: `jar-${side}`,
      label: `Glass jar (${side})`,
      source: "glass-jar",
      primitive: "jar",
      params: { height: 11.5, radius: 3.6, mouthRadius: 2.7, shoulderHeight: 1.5, threadHeight: 1.1 },
      transform: { position: [x, 0, -12.5] },
      material: { preset: "glass" },
    },
    {
      id: `lid-${side}`,
      parent: `jar-${side}`,
      primitive: "cap",
      params: { height: 1.2, radius: 2.9 },
      transform: { position: [0, 10.5, 0] },
      material: { preset: "aluminium", color: "#c2c6cc" },
    },
    {
      id: `label-${side}`,
      parent: `jar-${side}`,
      primitive: "sleeve",
      params: { height: 5.0, radius: 3.65 },
      transform: { position: [0, 2.4, 0] },
      material: { preset: "paint", color: labelColor },
    },
  ];
}

export default defineProject({
  slug: "jar-propagation-station",
  title: "Glass jar stem propagation station",
  summary:
    "Set two intact glass jars into a fitted cardboard stability cradle with slotted mouth collars to root herb or houseplant cuttings cleanly on a bright sill.",
  difficulty: "easy",
  timeMinutes: 25,
  materials: [
    { id: "glass-jar", qty: 2, unit: "Clean intact 250 ml glass jars" },
    { id: "cardboard", qty: 1, unit: "Corrugated scrap for tray and two collars" },
    { id: "plant-seedling", qty: 2, unit: "Fresh stem cuttings (e.g. basil, mint, or pothos)" },
    { id: "hot-glue-stick", qty: 1 },
    { id: "masking-tape", qty: 1, unit: "Short strips for tray corners", optional: true },
  ],
  tools: [
    { id: "scissors" },
    { id: "utility-knife" },
    { id: "hot-glue-gun" },
    { id: "marker" },
    { id: "ruler-tape" },
  ],
  // Two intact 250 ml glass jars (~170 g each = 340 g) plus retained corrugated cardboard cradle and collars (~38 g).
  wasteDiverted: [
    { materialId: "glass-jar", grams: 340 },
    { materialId: "cardboard", grams: 38 },
  ],
  sources: [
    {
      title: "Up-Cycle When Gardening",
      publisher: "Oregon State University Extension",
      url: "https://extension.oregonstate.edu/imported-publication/cycle-when-gardening",
      license: "Publisher copyright (reference only)",
      note: "Supports reusing intact glass jars to start and root plants in water; the cardboard stability cradle and stem collars here are original.",
    },
  ],
  camera: { position: [22, 24, 34], target: [0, 4, -4] },
  scene: {
    objects: [
      {
        id: "tray-base",
        label: "Cardboard tray base",
        source: "cardboard",
        primitive: "box",
        params: { width: 21, height: 0.45, depth: 10.5 },
        material: board,
      },
      ...trayRails,
      ...jarSetup("left", -5.2, "#d8c49b"),
      ...jarSetup("right", 5.2, "#9bb59a"),
    ],
  },
  steps: [
    {
      title: "Wash the jars and fold up the cardboard cradle",
      text: "Wash two intact glass jars in warm soapy water, remove their lids and paper labels, and inspect for cracks. Fold up the four 3.2 cm cardboard tray walls, secure the corners with hot glue or masking tape, and glue a central cardboard strip so the jars cannot bump together.",
      warning: "Use only intact, uncracked glass jars. Never cut, drill, or heat glass.",
      ops: [
        { type: "remove", target: "lid-left", away: [-4, 8, 0], duration: 0.35 },
        { type: "remove", target: "lid-right", away: [4, 8, 0], duration: 0.35 },
        { type: "remove", target: "label-left", away: [-10, 0, 4], duration: 0.35 },
        { type: "remove", target: "label-right", away: [10, 0, 4], duration: 0.35 },
        ...foldTray,
        {
          type: "add",
          object: {
            id: "tray-divider",
            label: "Centre divider",
            parent: "tray-base",
            source: "cardboard",
            primitive: "box",
            params: { width: 0.4, height: 3.2, depth: 9.7 },
            transform: { position: [0, 0.45, 0] },
            material: board,
          },
        },
      ],
      camera: { position: [20, 20, 30], target: [0, 5, -3] },
    },
    {
      title: "Seat the jars in the cradle and add water",
      text: "Set both clean jars snugly into the two bays of the cardboard cradle, then pour room-temperature tap water into each jar until it is roughly two-thirds full.",
      tip: "Wipe any spilled drops off the cardboard base so the tray stays dry and firm.",
      ops: [
        { type: "attach", target: "jar-left", parent: "tray-base", transform: { position: [-5.2, 0.45, 0] }, duration: 0.8 },
        { type: "attach", target: "jar-right", parent: "tray-base", transform: { position: [5.2, 0.45, 0] }, duration: 0.8 },
        { type: "fill", target: "jar-left", id: "water-left", level: 0.72, inset: 0.92, material: { preset: "water" } },
        { type: "fill", target: "jar-right", id: "water-right", level: 0.72, inset: 0.92, material: { preset: "water" } },
      ],
      camera: { position: [16, 18, 28], target: [0, 6.5, 0] },
    },
    {
      title: "Rest slotted cardboard collars across the rims",
      text: "Cut two 6 × 6 cm cardboard squares with scissors and slice a narrow 6 mm slot halfway into the centre of each square. Rest a collar across each jar mouth to hold cuttings centred without dipping their leaves into the water.",
      ops: [
        { type: "add", duration: 0.3, object: { id: "collar-left-a", parent: "jar-left", source: "cardboard", primitive: "box", params: { width: 2.7, height: 0.3, depth: 5.8 }, transform: { position: [-1.65, 11.55, 0] }, material: collarBoard } },
        { type: "add", duration: 0.3, object: { id: "collar-left-b", parent: "jar-left", source: "cardboard", primitive: "box", params: { width: 2.7, height: 0.3, depth: 5.8 }, transform: { position: [1.65, 11.55, 0] }, material: collarBoard } },
        { type: "add", duration: 0.3, object: { id: "collar-right-a", parent: "jar-right", source: "cardboard", primitive: "box", params: { width: 2.7, height: 0.3, depth: 5.8 }, transform: { position: [-1.65, 11.55, 0] }, material: collarBoard } },
        { type: "add", duration: 0.3, object: { id: "collar-right-b", parent: "jar-right", source: "cardboard", primitive: "box", params: { width: 2.7, height: 0.3, depth: 5.8 }, transform: { position: [1.65, 11.55, 0] }, material: collarBoard } },
      ],
      camera: { position: [14, 21, 22], target: [0, 11, 0] },
    },
    {
      title: "Insert fresh stem cuttings and set in bright light",
      text: "Strip the bottom leaves from two healthy cuttings so bare stem nodes sit below the waterline while the top leaves rest dry above the cardboard collar. Place the station in bright, indirect light and refresh the water every few days.",
      tip: "Once roots reach 3–5 cm long, transplant the cuttings gently into damp potting mix.",
      ops: [
        {
          type: "thread",
          target: "jar-left",
          id: "cutting-left",
          path: [[0.2, 2.8, 0], [0.1, 7.2, 0.1], [0, 11.8, 0], [-0.3, 15.8, 0.2]],
          radius: 0.16,
          material: { preset: "paint", color: "#437845" },
          duration: 0.6,
        },
        {
          type: "thread",
          target: "jar-left",
          id: "leaf-left-1",
          path: [[-0.2, 14.5, 0.15], [-1.7, 15.9, 0.5], [-2.9, 15.6, 0.7]],
          radius: 0.34,
          material: { preset: "paint", color: "#5e9650" },
          duration: 0.35,
        },
        {
          type: "thread",
          target: "jar-left",
          id: "leaf-left-2",
          path: [[-0.25, 15.4, 0.2], [1.2, 16.9, -0.2], [2.4, 16.6, -0.4]],
          radius: 0.34,
          material: { preset: "paint", color: "#548c48" },
          duration: 0.35,
        },
        {
          type: "thread",
          target: "jar-right",
          id: "cutting-right",
          path: [[-0.2, 3.0, 0], [-0.1, 7.4, -0.1], [0, 11.8, 0], [0.35, 16.2, -0.15]],
          radius: 0.16,
          material: { preset: "paint", color: "#437845" },
          duration: 0.6,
        },
        {
          type: "thread",
          target: "jar-right",
          id: "leaf-right-1",
          path: [[0.25, 14.8, -0.1], [1.8, 16.2, -0.4], [3.0, 15.9, -0.6]],
          radius: 0.34,
          material: { preset: "paint", color: "#5e9650" },
          duration: 0.35,
        },
        {
          type: "thread",
          target: "jar-right",
          id: "leaf-right-2",
          path: [[0.3, 15.8, -0.15], [-1.1, 17.2, 0.3], [-2.2, 16.9, 0.5]],
          radius: 0.34,
          material: { preset: "paint", color: "#548c48" },
          duration: 0.35,
        },
      ],
      camera: { position: [20, 20, 32], target: [0, 10, 0] },
    },
  ],
});
