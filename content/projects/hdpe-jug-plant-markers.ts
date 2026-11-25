import { defineProject, type SceneOpInput } from "@/lib/scene/schema";

const hdpe = { preset: "plastic", color: "#ebf0f2" } as const;
const hdpePanel = { preset: "plastic", color: "#f4f7f8" } as const;
const ink = { preset: "paint", color: "#232a30" } as const;

const stripXs = [-7.5, -4.5, -1.5, 1.5, 4.5, 7.5] as const;

const addStrips: SceneOpInput[] = stripXs.flatMap((x, index): SceneOpInput[] => {
  const id = `marker-${index + 1}`;
  return [
    {
      type: "add",
      duration: 0.14,
      object: {
        id,
        label: `Plant marker ${index + 1}`,
        source: "hdpe-jug",
        primitive: "box",
        params: { width: 2.0, height: 10.0, depth: 0.22 },
        transform: { position: [x, 0.15, 4.5], rotation: [-90, 0, 0] },
        material: hdpePanel,
      },
    },
    {
      type: "add",
      duration: 0.05,
      object: {
        id: `${id}.tip-mid`,
        parent: id,
        primitive: "box",
        params: { width: 1.25, height: 1.1, depth: 0.21 },
        transform: { position: [0, -1.1, 0] },
        material: hdpePanel,
      },
    },
    {
      type: "add",
      duration: 0.05,
      object: {
        id: `${id}.tip-point`,
        parent: id,
        primitive: "box",
        params: { width: 0.55, height: 1.0, depth: 0.2 },
        transform: { position: [0, -2.1, 0] },
        material: hdpePanel,
      },
    },
    {
      type: "add",
      duration: 0.05,
      object: {
        id: `${id}.trim`,
        parent: id,
        primitive: "box",
        params: { width: 2.0, height: 2.1, depth: 0.24 },
        transform: { position: [0, -2.1, 0] },
        material: hdpe,
      },
    },
  ];
});

const shapeAndLabelMarkers: SceneOpInput[] = [
  ...stripXs.map((_, index): SceneOpInput => ({
    type: "remove",
    target: `marker-${index + 1}.trim`,
    away: [0, -4, 0],
    duration: 0.18,
  })),
  ...stripXs.flatMap((_, index): SceneOpInput[] => [
    {
      type: "add",
      duration: 0.12,
      object: {
        id: `label-${index + 1}.line-a`,
        parent: `marker-${index + 1}`,
        primitive: "box",
        params: { width: 0.26, height: 4.8, depth: 0.05 },
        transform: { position: [-0.28, 3.2, 0.13] },
        material: ink,
      },
    },
    {
      type: "add",
      duration: 0.12,
      object: {
        id: `label-${index + 1}.line-b`,
        parent: `marker-${index + 1}`,
        primitive: "box",
        params: { width: 0.18, height: 3.6, depth: 0.05 },
        transform: { position: [0.24, 3.8, 0.13] },
        material: ink,
      },
    },
  ]),
];

const plantMarkers: SceneOpInput[] = stripXs.map((x, index): SceneOpInput => ({
  type: "transform",
  target: `marker-${index + 1}`,
  position: [x, 3.2, 0],
  rotation: [0, 0, 0],
  arc: 2.5,
  duration: 0.28,
}));

export default defineProject({
  slug: "hdpe-jug-plant-markers",
  title: "HDPE milk jug plant markers",
  summary:
    "Cut the flat side panels of a clean HDPE milk jug into waterproof, reusable garden stakes for labelling herbs, seed trays, and vegetable rows.",
  difficulty: "easy",
  timeMinutes: 15,
  materials: [
    { id: "hdpe-jug", qty: 1, unit: "Clean 3.8 L (1-gallon) milk jug" },
  ],
  tools: [
    { id: "utility-knife" },
    { id: "scissors" },
    { id: "marker" },
    { id: "ruler-tape" },
  ],
  // Six retained waterproof stakes cut from flat side panels (~18 g of a ~60 g gallon jug); unused offcuts go to recycling.
  wasteDiverted: [{ materialId: "hdpe-jug", grams: 18 }],
  sources: [
    {
      title: "Up-Cycle When Gardening",
      publisher: "Oregon State University Extension",
      url: "https://extension.oregonstate.edu/imported-publication/cycle-when-gardening",
      license: "Publisher copyright (reference only)",
      note: "Mentions cutting clean plastic milk jugs into garden plant markers; strip sizing and step sequence here are original.",
    },
  ],
  camera: { position: [24, 22, 32], target: [0, 11, 0] },
  scene: {
    objects: [
      {
        id: "jug-shell",
        label: "HDPE milk jug",
        source: "hdpe-jug",
        primitive: "box",
        params: { width: 15, height: 15, depth: 14.4 },
        transform: { position: [0, 0, -0.3] },
        material: hdpe,
      },
      {
        id: "jug-shoulder-lower",
        parent: "jug-shell",
        primitive: "box",
        params: { width: 13.4, height: 2.6, depth: 13.4 },
        transform: { position: [0, 15, 0] },
        material: hdpe,
      },
      {
        id: "jug-shoulder-upper",
        parent: "jug-shell",
        primitive: "box",
        params: { width: 9.2, height: 2.2, depth: 9.2 },
        transform: { position: [0, 17.6, 0] },
        material: hdpe,
      },
      {
        id: "jug-neck",
        parent: "jug-shell",
        primitive: "sleeve",
        params: { radius: 2.0, height: 2.2 },
        transform: { position: [0, 19.8, 0] },
        material: hdpe,
      },
      {
        id: "jug-cap",
        label: "Jug cap",
        parent: "jug-shell",
        primitive: "cap",
        params: { radius: 2.25, height: 1.4 },
        transform: { position: [0, 20.9, 0] },
        material: { preset: "plastic", color: "#d6453a" },
      },
      {
        id: "jug-handle",
        parent: "jug-shell",
        primitive: "tube",
        params: {
          points: [
            [5.6, 16.4, 0],
            [8.8, 15.6, 0],
            [9.4, 12.0, 0],
            [8.8, 8.4, 0],
            [6.4, 7.6, 0],
          ],
          radius: 0.9,
        },
        material: hdpe,
      },
      {
        id: "front-panel",
        label: "Flat side panel",
        source: "hdpe-jug",
        primitive: "box",
        params: { width: 13, height: 12, depth: 0.24 },
        transform: { position: [0, 1.5, 7.05] },
        material: hdpePanel,
      },
    ],
  },
  steps: [
    {
      title: "Wash the jug and cut out a flat panel",
      text: "Rinse a clean HDPE milk jug with warm soapy water, dry it, and remove the cap. Pierce the edge of one flat side panel with a utility knife to start a slot, then use scissors to cut out a clean rectangular sheet.",
      warning: "Cut away from your fingers when starting the slot with a utility knife, and switch to scissors for the full outline.",
      ops: [
        { type: "remove", target: "jug-cap", away: [0, 8, 0], duration: 0.45 },
        { type: "remove", target: "jug-shell", away: [-20, 4, -8], duration: 0.85 },
        { type: "transform", target: "front-panel", position: [0, 0.15, 6], rotation: [-90, 0, 0], arc: 3 },
      ],
      camera: { position: [0, 24, 22], target: [0, 0.5, 0] },
    },
    {
      title: "Mark and cut six even strips",
      text: "Use a ruler and marker to divide the flat sheet into six strips about 2 cm wide and 12 cm long. Cut straight along each line with scissors so the stakes stay rigid when pressed into soil.",
      tip: "Cut additional panels from the other flat walls of the jug if you want a larger batch of markers.",
      ops: [
        { type: "remove", target: "front-panel", away: [0, 2, 0], duration: 0.3 },
        ...addStrips,
      ],
      camera: { position: [0, 26, 22], target: [0, 0.5, 0] },
    },
    {
      title: "Snip pointed tips and write plant names",
      text: "Trim both corners off one end of each strip at an angle to form a gentle point that slips easily into potting mix. Write the plant name and sowing date on the upper half using a waterproof permanent marker.",
      tip: "Round off any sharp corner burrs with scissors and let the marker ink dry for a minute before handling.",
      ops: shapeAndLabelMarkers,
      camera: { position: [0, 22, 19], target: [0, 0.5, 1] },
    },
    {
      title: "Press the markers into pots or beds",
      text: "Push the pointed end of each waterproof marker a few centimetres into moist soil beside your seeds or seedlings with the written label facing upward so it stays legible through watering.",
      ops: [
        {
          type: "add",
          object: {
            id: "soil-bed",
            label: "Potting soil bed",
            primitive: "box",
            params: { width: 22, height: 3.0, depth: 9.5 },
            transform: { position: [0, 0, 0] },
            material: { preset: "soil" },
          },
        },
        ...plantMarkers,
      ],
      camera: { position: [18, 16, 26], target: [0, 7, 0] },
    },
  ],
});
