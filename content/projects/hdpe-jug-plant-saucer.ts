import { defineProject, type SceneObjectInput, type SceneOpInput } from "@/lib/scene/schema";

const hdpe = { preset: "plastic", color: "#ebf0f2" } as const;
const hdpeRim = { preset: "plastic", color: "#dce4e7" } as const;
const guideInk = { preset: "paint", color: "#2a333b" } as const;

const roughTrimPieces: SceneObjectInput[] = [
  { id: "trim-front", parent: "saucer-base", primitive: "box", params: { width: 15, height: 0.55, depth: 0.28 }, transform: { position: [0, 4.5, 7.36] }, material: hdpeRim },
  { id: "trim-back", parent: "saucer-base", primitive: "box", params: { width: 15, height: 0.55, depth: 0.28 }, transform: { position: [0, 4.5, -7.36] }, material: hdpeRim },
  { id: "trim-left", parent: "saucer-base", primitive: "box", params: { width: 0.28, height: 0.55, depth: 14.44 }, transform: { position: [-7.36, 4.5, 0] }, material: hdpeRim },
  { id: "trim-right", parent: "saucer-base", primitive: "box", params: { width: 0.28, height: 0.55, depth: 14.44 }, transform: { position: [7.36, 4.5, 0] }, material: hdpeRim },
];

const markGuides: SceneOpInput[] = [
  { type: "add", duration: 0.2, object: { id: "mark-front", parent: "saucer-base", primitive: "box", params: { width: 15.2, height: 0.22, depth: 0.08 }, transform: { position: [0, 4.55, 7.56] }, material: guideInk } },
  { type: "add", duration: 0.2, object: { id: "mark-back", parent: "saucer-base", primitive: "box", params: { width: 15.2, height: 0.22, depth: 0.08 }, transform: { position: [0, 4.55, -7.56] }, material: guideInk } },
  { type: "add", duration: 0.2, object: { id: "mark-left", parent: "saucer-base", primitive: "box", params: { width: 0.08, height: 0.22, depth: 15.2 }, transform: { position: [-7.56, 4.55, 0] }, material: guideInk } },
  { type: "add", duration: 0.2, object: { id: "mark-right", parent: "saucer-base", primitive: "box", params: { width: 0.08, height: 0.22, depth: 15.2 }, transform: { position: [7.56, 4.55, 0] }, material: guideInk } },
];

export default defineProject({
  slug: "hdpe-jug-plant-saucer",
  title: "HDPE milk jug plant saucer",
  summary:
    "Cut the watertight base of a clean gallon HDPE milk jug into a sturdy drip saucer that catches excess runoff beneath houseplants and seed pots.",
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
    { id: "sandpaper" },
  ],
  // Retained 4.5 cm watertight jug base (~22 g of a ~60 g gallon jug); the upper body goes to recycling or plant markers.
  wasteDiverted: [{ materialId: "hdpe-jug", grams: 22 }],
  sources: [
    {
      title: "Up-Cycle When Gardening",
      publisher: "Oregon State University Extension",
      url: "https://extension.oregonstate.edu/imported-publication/cycle-when-gardening",
      license: "Publisher copyright (reference only)",
      note: "Mentions cutting the bottom of a plastic gallon jug into a plant saucer; step sequence and rim smoothing here are original.",
    },
  ],
  camera: { position: [24, 22, 32], target: [0, 11, 0] },
  scene: {
    objects: [
      {
        id: "saucer-base",
        label: "HDPE jug base",
        source: "hdpe-jug",
        primitive: "box",
        params: { width: 15, height: 0.35, depth: 15 },
        material: hdpe,
      },
      { id: "wall-front", parent: "saucer-base", primitive: "box", params: { width: 15, height: 4.5, depth: 0.28 }, transform: { position: [0, 0, 7.36] }, material: hdpe },
      { id: "wall-back", parent: "saucer-base", primitive: "box", params: { width: 15, height: 4.5, depth: 0.28 }, transform: { position: [0, 0, -7.36] }, material: hdpe },
      { id: "wall-left", parent: "saucer-base", primitive: "box", params: { width: 0.28, height: 4.5, depth: 14.44 }, transform: { position: [-7.36, 0, 0] }, material: hdpe },
      { id: "wall-right", parent: "saucer-base", primitive: "box", params: { width: 0.28, height: 4.5, depth: 14.44 }, transform: { position: [7.36, 0, 0] }, material: hdpe },
      ...roughTrimPieces,
      {
        id: "jug-upper",
        label: "Upper milk jug",
        source: "hdpe-jug",
        primitive: "box",
        params: { width: 15, height: 10.0, depth: 15 },
        transform: { position: [0, 5.05, 0] },
        material: hdpe,
      },
      { id: "jug-shoulder-1", parent: "jug-upper", primitive: "box", params: { width: 13.4, height: 2.5, depth: 13.4 }, transform: { position: [0, 10.0, 0] }, material: hdpe },
      { id: "jug-shoulder-2", parent: "jug-upper", primitive: "box", params: { width: 9.2, height: 2.2, depth: 9.2 }, transform: { position: [0, 12.5, 0] }, material: hdpe },
      { id: "jug-neck", parent: "jug-upper", primitive: "sleeve", params: { radius: 2.0, height: 2.2 }, transform: { position: [0, 14.7, 0] }, material: hdpe },
      { id: "jug-cap", label: "Jug cap", parent: "jug-upper", primitive: "cap", params: { radius: 2.25, height: 1.4 }, transform: { position: [0, 15.8, 0] }, material: { preset: "plastic", color: "#2d78c4" } },
      {
        id: "jug-handle",
        parent: "jug-upper",
        primitive: "tube",
        params: {
          points: [
            [5.6, 11.4, 0],
            [8.8, 10.6, 0],
            [9.4, 7.0, 0],
            [8.8, 3.4, 0],
            [6.4, 2.6, 0],
          ],
          radius: 0.9,
        },
        material: hdpe,
      },
    ],
  },
  steps: [
    {
      title: "Wash the jug and mark a 4.5 cm line",
      text: "Rinse an empty gallon HDPE jug thoroughly and remove the cap. Measure 4.5 cm up from the flat base with a ruler and trace a level cut line all the way around the four sides with a permanent marker.",
      tip: "Rest your marker on a small book of the right height and rotate the jug against the tip for an even line.",
      ops: [
        { type: "remove", target: "jug-cap", away: [0, 8, 0], duration: 0.45 },
        ...markGuides,
      ],
      camera: { position: [22, 12, 26], target: [0, 5.5, 0] },
    },
    {
      title: "Cut off the upper jug along the line",
      text: "Make a short starter slit on your mark with a utility knife, then cut carefully around all four sides with scissors to lift away the upper jug. Save the clean flat walls if you want to cut plant markers later.",
      warning: "Keep your supporting hand behind the blade when making the starter slit. Have an adult handle the utility knife if needed.",
      ops: [
        { type: "remove", target: "jug-upper", away: [14, 12, 0], duration: 0.9 },
        { type: "remove", target: "mark-front", away: [0, 3, 2], duration: 0.15 },
        { type: "remove", target: "mark-back", away: [0, 3, -2], duration: 0.15 },
        { type: "remove", target: "mark-left", away: [-2, 3, 0], duration: 0.15 },
        { type: "remove", target: "mark-right", away: [2, 3, 0], duration: 0.15 },
      ],
      camera: { position: [20, 16, 24], target: [0, 3, 0] },
    },
    {
      title: "Level and sand the cut rim",
      text: "Trim away any uneven steps around the upper edge with scissors so all four walls sit at the same height, then lightly rub sandpaper around the cut rim until it feels smooth to the touch.",
      tip: "Wipe away plastic dust with a damp cloth before putting the saucer on furniture.",
      ops: roughTrimPieces.map(({ id }) => ({ type: "remove", target: id, away: [0, 4, 0], duration: 0.28 })),
      camera: { position: [18, 13, 22], target: [0, 2.5, 0] },
    },
    {
      title: "Place a potted plant inside the saucer",
      text: "Set the finished waterproof tray on a sill or shelf and centre a potted plant inside. Check the saucer after watering and empty standing runoff so roots do not stay waterlogged.",
      ops: [
        {
          type: "add",
          object: {
            id: "drip-water",
            label: "Caught runoff water",
            parent: "saucer-base",
            primitive: "box",
            params: { width: 14.3, height: 0.55, depth: 14.3 },
            transform: { position: [0, 0.36, 0] },
            material: { preset: "water" },
          },
        },
        {
          type: "add",
          object: {
            id: "demo-pot",
            label: "Plant pot",
            parent: "saucer-base",
            primitive: "solid",
            params: {
              points: [
                [3.8, 0],
                [4.85, 9.8],
                [5.15, 9.8],
                [5.15, 11.0],
                [4.6, 11.0],
              ],
            },
            transform: { position: [0, 0.4, 0] },
            material: { preset: "paint", color: "#b96747" },
          },
        },
        {
          type: "add",
          object: {
            id: "demo-soil",
            parent: "demo-pot",
            primitive: "solid",
            params: { points: [[4.45, 0], [4.45, 0.35]] },
            transform: { position: [0, 10.65, 0] },
            material: { preset: "soil" },
          },
        },
        {
          type: "thread",
          target: "demo-pot",
          id: "demo-stem",
          path: [[0, 10.8, 0], [0.2, 14.2, 0.1], [-0.1, 17.5, -0.1]],
          radius: 0.16,
          material: { preset: "paint", color: "#457644" },
          duration: 0.5,
        },
        {
          type: "thread",
          target: "demo-pot",
          id: "demo-leaf-1",
          path: [[0.15, 14.4, 0.1], [1.6, 15.6, 0.4], [2.9, 15.4, 0.7]],
          radius: 0.32,
          material: { preset: "paint", color: "#5e944e" },
          duration: 0.35,
        },
        {
          type: "thread",
          target: "demo-pot",
          id: "demo-leaf-2",
          path: [[0.0, 15.5, 0.0], [-1.5, 16.8, -0.3], [-2.8, 16.5, -0.5]],
          radius: 0.32,
          material: { preset: "paint", color: "#558c47" },
          duration: 0.35,
        },
      ],
      camera: { position: [24, 20, 30], target: [0, 7, 0] },
    },
  ],
});
