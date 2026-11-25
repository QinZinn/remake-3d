import { defineProject, type SceneObjectInput, type SceneOpInput, type Vec3 } from "@/lib/scene/schema";

const jersey = { preset: "fabric", color: "#2d6c73" } as const;
const jerseyShade = { preset: "fabric", color: "#255a60" } as const;
const jerseyInner = { preset: "fabric", color: "#1f4d52" } as const;
const hem = { preset: "fabric", color: "#347880" } as const;
const knotFabric = { preset: "fabric", color: "#24575d" } as const;

/**
 * Curved T-shirt / tote silhouette with tapered waist, deep curved armholes,
 * clean shoulder straps and a scooped U-neckline.
 * Height spans y = 0..38.8 cm; width spans x = -16.2..16.2 cm.
 */
const shirtPanelOutline: [number, number][] = [
  [-16.0, 0.2],
  [16.0, 0.2],
  [16.2, 9],
  [15.6, 18],
  [15.2, 24.4],
  [13.4, 27.4],
  [12.4, 32.0],
  [12.0, 38.6],
  [8.4, 38.6],
  [7.8, 35.6],
  [7.0, 30.2],
  [4.4, 26.0],
  [0, 24.4],
  [-4.4, 26.0],
  [-7.0, 30.2],
  [-7.8, 35.6],
  [-8.4, 38.6],
  [-12.0, 38.6],
  [-12.4, 32.0],
  [-13.4, 27.4],
  [-15.2, 24.4],
  [-15.6, 18],
  [-16.2, 9],
];

/** Authentic T-shirt short-sleeve silhouette with crisp straight outer cuff. */
function sleeveOutline(side: -1 | 1): [number, number][] {
  const pts: [number, number][] = [
    [15.3, 24.5],
    [22.4, 20.6],
    [26.2, 29.8],
    [20.2, 35.6],
    [12.2, 38.7],
    [12.3, 34.4],
    [12.7, 30.2],
    [13.8, 26.8],
  ];
  return side === 1 ? pts : pts.map(([x, y]) => [-x, y] as [number, number]).reverse();
}

/** Crew-neck upper chest offcut sitting snugly inside the U-scoop opening. */
const neckOffcutOutline: [number, number][] = [
  [-7.9, 38.2],
  [-5.2, 35.9],
  [0, 34.8],
  [5.2, 35.9],
  [7.9, 38.2],
  [7.6, 34.2],
  [6.8, 30.0],
  [4.2, 26.0],
  [0, 24.5],
  [-4.2, 26.0],
  [-6.8, 30.0],
  [-7.6, 34.2],
];

/** Ribbed crew-neck collar arc tracing the top edge of the neck offcut. */
const collarPath: Vec3[] = [
  [-8.0, 38.2, 0],
  [-5.1, 35.9, 0],
  [0, 34.8, 0],
  [5.1, 35.9, 0],
  [8.0, 38.2, 0],
];

/** Tapered side-gusset panel that closes each side seam cleanly as the tote opens. */
const gussetOutline: [number, number][] = [
  [-0.5, 0.2],
  [0.5, 0.2],
  [2.3, 23.6],
  [-2.3, 23.6],
];

/** Continuous open fabric handle loop arching cleanly from front strap to back strap. */
function handleArchPath(side: -1 | 1): Vec3[] {
  const x = side * 10.2;
  return [
    [x, 37.8, 3.65],
    [x, 40.8, 2.55],
    [x, 42.6, 0],
    [x, 40.8, -2.55],
    [x, 37.8, -3.65],
  ];
}

// 10 pairs of front + back fringe strips along the 32 cm hem.
const fringeIndices = Array.from({ length: 10 }, (_, i) => ({
  index: i,
  x: -14.4 + i * 3.2,
  tilt: i % 2 === 0 ? -13 : 13,
}));

const cutFringeOps: SceneOpInput[] = fringeIndices.flatMap(({ index, x }): SceneOpInput[] => [
  {
    type: "add",
    duration: 0.06,
    object: {
      id: `fringe.f.${index}`,
      parent: "body",
      primitive: "box",
      params: { width: 2.55, height: 4.2, depth: 0.34 },
      transform: { position: [x, -4.15, -0.34] },
      material: hem,
    },
  },
  {
    type: "add",
    duration: 0.06,
    object: {
      id: `fringe.b.${index}`,
      parent: "body",
      primitive: "box",
      params: { width: 2.55, height: 4.2, depth: 0.34 },
      transform: { position: [x, -4.15, 0.34] },
      material: jerseyShade,
    },
  },
]);

const tieFringeOps: SceneOpInput[] = fringeIndices.flatMap(({ index, x, tilt }): SceneOpInput[] => [
  {
    type: "transform",
    target: `fringe.f.${index}`,
    position: [x, -2.6, -0.24],
    rotation: [20, 0, tilt],
    scale: [0.76, 0.62, 1.3],
    duration: 0.07,
  },
  {
    type: "transform",
    target: `fringe.b.${index}`,
    position: [x, -2.6, 0.24],
    rotation: [-20, 0, -tilt],
    scale: [0.76, 0.62, 1.3],
    duration: 0.07,
  },
  {
    type: "add",
    duration: 0.05,
    object: {
      id: `knot.${index}`,
      parent: "body",
      primitive: "solid",
      params: {
        points: [
          [0.6, 0],
          [1.08, 0.42],
          [1.16, 0.92],
          [0.88, 1.38],
          [0.44, 1.54],
        ],
      },
      transform: { position: [x, -1.35, 0], rotation: [0, 0, tilt * 0.4] },
      material: knotFabric,
    },
  },
]);

const initialObjects: SceneObjectInput[] = [
  // Shared bottom-seam spine: carries the entire shirt/tote when standing up.
  {
    id: "body",
    label: "T-shirt bottom seam",
    source: "t-shirt",
    primitive: "box",
    params: { width: 31.8, height: 0.6, depth: 0.86 },
    transform: { position: [0, 0.85, -18], rotation: [90, 0, 0] },
    material: jerseyShade,
  },
  // Front & back curved jersey panels with real U-scoop neck & armhole cutouts.
  {
    id: "panel.front",
    label: "Shirt front layer",
    parent: "body",
    primitive: "extrude",
    params: { points: shirtPanelOutline, depth: 0.36, bevel: 0.14, curve: true },
    transform: { position: [0, 0, -0.35] },
    material: jersey,
  },
  {
    id: "panel.back",
    label: "Shirt back layer",
    parent: "body",
    primitive: "extrude",
    params: { points: shirtPanelOutline, depth: 0.36, bevel: 0.14, curve: true },
    transform: { position: [0, 0, 0.35] },
    material: jerseyShade,
  },
  // Removable T-shirt sleeves with crisp hemmed cuffs.
  {
    id: "sleeve.left",
    label: "Left sleeve",
    parent: "body",
    primitive: "extrude",
    params: { points: sleeveOutline(-1), depth: 0.94, bevel: 0.12, curve: false },
    material: jersey,
  },
  {
    id: "sleeve.right",
    label: "Right sleeve",
    parent: "body",
    primitive: "extrude",
    params: { points: sleeveOutline(1), depth: 0.94, bevel: 0.12, curve: false },
    material: jersey,
  },
  // Removable crew-neck offcut + ribbed collar trim.
  {
    id: "neck.offcut",
    label: "Neckline offcut",
    parent: "body",
    primitive: "extrude",
    params: { points: neckOffcutOutline, depth: 0.9, bevel: 0.12, curve: true },
    material: jersey,
  },
  {
    id: "collar.rib",
    label: "Ribbed collar",
    parent: "neck.offcut",
    primitive: "tube",
    params: { points: collarPath, radius: 0.56 },
    material: hem,
  },
  // Uncut lower hem strip (slit into fringe in step 2).
  {
    id: "uncut-hem",
    label: "Uncut hem",
    parent: "body",
    primitive: "box",
    params: { width: 32.0, height: 4.15, depth: 1.0 },
    transform: { position: [0, -4.15, 0] },
    material: hem,
  },
];

export default defineProject({
  slug: "t-shirt-no-sew-tote",
  title: "No-sew T-shirt tote",
  summary: "Cut handles and knot the hem of a cotton tee to make a soft bag for light errands.",
  difficulty: "easy",
  timeMinutes: 25,
  materials: [{ id: "t-shirt", qty: 1, unit: "One clean cotton T-shirt" }],
  tools: [{ id: "scissors" }, { id: "ruler-tape", optional: true }],
  wasteDiverted: [{ materialId: "t-shirt", grams: 120 }],
  sources: [
    {
      title: "Shop Waste-Free with Reusable T-Shirt Bags",
      publisher: "NOAA Marine Debris Program",
      url: "https://marinedebris.noaa.gov/shop-waste-free-reusable-t-shirt-bags",
      license: "Public domain (U.S. government work)",
      note: "Reference for cutting the neck and sleeves and knotting the bottom seam.",
    },
  ],
  camera: { position: [14, 64, 64], target: [0, 0.5, 1] },
  scene: { objects: initialObjects },
  steps: [
    {
      title: "Cut the handle openings",
      text: "Lay the shirt flat with both layers lined up. Cut off the sleeves at the armholes, then widen the neck opening through both layers. Leave a broad band of fabric on each shoulder for a handle.",
      tip: "Keep the sleeve scraps for cleaning cloths.",
      ops: [
        { type: "remove", target: "sleeve.left", away: [-12, 2, -2], duration: 0.6 },
        { type: "remove", target: "sleeve.right", away: [12, 2, -2], duration: 0.6 },
        { type: "remove", target: "neck.offcut", away: [0, 8, -3], duration: 0.65 },
      ],
      camera: { position: [12, 54, 54], target: [0, 0.5, 1] },
    },
    {
      title: "Cut a row of fringe",
      text: "With the front and back still aligned, cut parallel slits through both layers. Make them about 4 cm long, spaced about 3 cm apart.",
      ops: [{ type: "remove", target: "uncut-hem", away: [0, -3, -1], duration: 0.35 }, ...cutFringeOps],
      camera: { position: [0, 38, -50], target: [0, 0, -14] },
    },
    {
      title: "Tie the bottom seam",
      text: "Double-knot each front strip to the strip directly behind it. Close any gaps by tying a tail to its neighbour, then stand the bag up by its handles.",
      tip: "Test it with light objects first and tighten any loose knots.",
      ops: [
        ...tieFringeOps,
        // Lift the knotted tote upright and open the front/back layers to show the hollow pouch & open arched handles.
        { type: "transform", target: "body", position: [0, 3.2, 0], rotation: [0, 0, 0], pivot: [0, 0, 0], arc: 3.5, duration: 0.9 },
        { type: "transform", target: "panel.front", position: [0, 0, 0.25], rotation: [5.3, 0, 0], pivot: [0, 0, 0], duration: 0.5 },
        { type: "transform", target: "panel.back", position: [0, 0, -0.25], rotation: [-5.3, 0, 0], pivot: [0, 0, 0], duration: 0.5 },
        // Side fabric gussets seal the pouch edges cleanly while leaving the top mouth hollow.
        {
          type: "add",
          duration: 0.3,
          object: {
            id: "gusset.left",
            parent: "body",
            primitive: "extrude",
            params: { points: gussetOutline, depth: 0.32, bevel: 0.06 },
            transform: { position: [-15.3, 0, 0], rotation: [0, 90, 0] },
            material: jerseyInner,
          },
        },
        {
          type: "add",
          duration: 0.3,
          object: {
            id: "gusset.right",
            parent: "body",
            primitive: "extrude",
            params: { points: gussetOutline, depth: 0.32, bevel: 0.06 },
            transform: { position: [15.3, 0, 0], rotation: [0, 90, 0] },
            material: jerseyInner,
          },
        },
        // Open arched handle loops joining front and back straps over the hollow top.
        {
          type: "add",
          duration: 0.35,
          object: {
            id: "handle.left",
            label: "Left handle loop",
            parent: "body",
            primitive: "tube",
            params: { points: handleArchPath(-1), radius: 1.12 },
            material: jersey,
          },
        },
        {
          type: "add",
          duration: 0.35,
          object: {
            id: "handle.right",
            label: "Right handle loop",
            parent: "body",
            primitive: "tube",
            params: { points: handleArchPath(1), radius: 1.12 },
            material: jersey,
          },
        },
      ],
      camera: { position: [38, 40, 88], target: [0, 22, 0] },
    },
  ],
});
