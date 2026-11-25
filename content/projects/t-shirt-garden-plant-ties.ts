import { defineProject, type SceneObjectInput, type SceneOpInput, type Vec3 } from "@/lib/scene/schema";

const jersey = { preset: "fabric", color: "#587866" } as const;
const jerseyHem = { preset: "fabric", color: "#4a6656" } as const;

const bandZs = [1.5, 4.5, 7.5, 10.5] as const;
const spreadZs = [-7.5, -2.5, 2.5, 7.5] as const;

const bands: SceneObjectInput[] = bandZs.map((z, index) => ({
  id: `band-${index + 1}`,
  label: `Jersey strip ${index + 1}`,
  source: "t-shirt",
  primitive: "box",
  params: { width: 26, height: 0.9, depth: 2.8 },
  transform: { position: [0, 0.1, z] },
  material: jersey,
}));

function cordWave(z: number): Vec3[] {
  return [
    [-17, 0.45, z - 0.25],
    [-9, 0.45, z + 0.3],
    [0, 0.45, z - 0.2],
    [9, 0.45, z + 0.3],
    [17, 0.45, z - 0.2],
  ];
}

const curledCords: SceneOpInput[] = spreadZs.map((z, index): SceneOpInput => ({
  type: "add",
  duration: 0.25,
  object: {
    id: `cord-${index + 1}`,
    label: `Curled plant tie ${index + 1}`,
    source: "t-shirt",
    primitive: "tube",
    params: { points: cordWave(z), radius: 0.38 },
    material: jersey,
  },
}));

export default defineProject({
  slug: "t-shirt-garden-plant-ties",
  title: "Old T-shirt garden plant ties",
  summary:
    "Slice horizontal strips from the lower body of a worn cotton T-shirt and stretch them into soft, curled ties that secure plant stems to garden stakes without rubbing.",
  difficulty: "easy",
  timeMinutes: 15,
  materials: [
    { id: "t-shirt", qty: 1, unit: "Clean old cotton T-shirt" },
    { id: "plant-seedling", qty: 1, unit: "Staked garden plant to support", optional: true },
  ],
  tools: [
    { id: "scissors" },
    { id: "ruler-tape", optional: true },
  ],
  // Retained soft cotton ties cut from the lower half of a worn T-shirt (~40 g); upper fabric can be saved for cleaning cloths.
  wasteDiverted: [{ materialId: "t-shirt", grams: 40 }],
  sources: [
    {
      title: "Up-Cycle When Gardening",
      publisher: "Oregon State University Extension",
      url: "https://extension.oregonstate.edu/imported-publication/cycle-when-gardening",
      license: "Publisher copyright (reference only)",
      note: "Supports reusing worn fabric strips in the garden to tie up stems without cutting into bark or soft tissue.",
    },
    {
      title: "Shop Waste-Free with Reusable T-Shirt Bags",
      publisher: "NOAA Marine Debris Program",
      url: "https://marinedebris.noaa.gov/shop-waste-free-reusable-t-shirt-bags",
      license: "Public domain (U.S. government work)",
      note: "General reference for cutting old cotton T-shirt jersey; the curled figure-eight plant-tie guide here is original.",
    },
  ],
  camera: { position: [14, 38, 34], target: [0, 0.5, 0] },
  scene: {
    objects: [
      {
        id: "shirt-upper",
        label: "Upper cotton T-shirt",
        source: "t-shirt",
        primitive: "box",
        params: { width: 26, height: 0.9, depth: 17 },
        transform: { position: [0, 0.1, -8.6] },
        material: jersey,
      },
      {
        id: "sleeve-left",
        parent: "shirt-upper",
        primitive: "box",
        params: { width: 8.5, height: 0.85, depth: 7.5 },
        transform: { position: [-15.2, 0, -3.5], rotation: [0, 22, 0] },
        material: jersey,
      },
      {
        id: "sleeve-right",
        parent: "shirt-upper",
        primitive: "box",
        params: { width: 8.5, height: 0.85, depth: 7.5 },
        transform: { position: [15.2, 0, -3.5], rotation: [0, -22, 0] },
        material: jersey,
      },
      ...bands,
      {
        id: "hem-trim",
        label: "Stitched bottom hem",
        primitive: "box",
        params: { width: 26, height: 0.95, depth: 2.0 },
        transform: { position: [0, 0.1, 13.0] },
        material: jerseyHem,
      },
    ],
  },
  steps: [
    {
      title: "Trim the hem and slice 3 cm rings",
      text: "Lay a clean cotton T-shirt flat and cut off the thick stitched bottom hem. Cut straight across both layers every 3 cm to create four even horizontal fabric loops from the lower body.",
      tip: "Save the upper shirt body and sleeves as reusable household dusting rags.",
      ops: [
        { type: "remove", target: "hem-trim", away: [0, 2, 10], duration: 0.45 },
        { type: "remove", target: "shirt-upper", away: [0, 3, -16], duration: 0.75 },
        ...spreadZs.map((z, index): SceneOpInput => ({
          type: "transform",
          target: `band-${index + 1}`,
          position: [0, 0.1, z],
          duration: 0.35,
        })),
      ],
      camera: { position: [0, 34, 24], target: [0, 0.5, 0] },
    },
    {
      title: "Snip each loop open into a ribbon",
      text: "Cut once across one folded side of each fabric loop with scissors so every ring opens out into a long, single-layer ribbon.",
      ops: spreadZs.map((_, index): SceneOpInput => ({
        type: "transform",
        target: `band-${index + 1}`,
        scale: [1.32, 0.48, 1.0],
        duration: 0.3,
      })),
      camera: { position: [0, 32, 24], target: [0, 0.5, 0] },
    },
    {
      title: "Stretch each strip until the edges curl",
      text: "Grip both ends of a cotton jersey ribbon and pull firmly. The knitted fabric stretches lengthwise and curls inward automatically into a soft, rounded cord with no raw edges rubbing against stems.",
      tip: "Avoid woven cotton shirts for this step; jersey knit is what curls neatly when tugged.",
      ops: [
        ...bandZs.map((_, index): SceneOpInput => ({
          type: "remove",
          target: `band-${index + 1}`,
          away: [0, 1.5, 0],
          duration: 0.18,
        })),
        ...curledCords,
      ],
      camera: { position: [0, 28, 22], target: [0, 0.5, 0] },
    },
    {
      title: "Tie a loose figure-eight around stake and stem",
      text: "Wrap one soft tie around your garden stake, cross the ends between the stake and the plant stem to form a gentle figure-eight cushion, and tie a loose bow on the stake side so the stem has room to thicken.",
      ops: [
        { type: "remove", target: "cord-1", away: [-8, 4, 0], duration: 0.25 },
        { type: "transform", target: "cord-2", position: [12, 0, 5.5], scale: [0.45, 1, 1], duration: 0.35 },
        { type: "transform", target: "cord-3", position: [12, 0, 2.0], scale: [0.45, 1, 1], duration: 0.35 },
        { type: "transform", target: "cord-4", position: [12, 0, -1.5], scale: [0.45, 1, 1], duration: 0.35 },
        {
          type: "add",
          object: {
            id: "soil-mound",
            label: "Garden soil",
            primitive: "solid",
            params: { points: [[7.5, 0], [7.0, 2.2]] },
            transform: { position: [-2, 0, 0] },
            material: { preset: "soil" },
          },
        },
        {
          type: "add",
          object: {
            id: "stake",
            label: "Garden stake",
            primitive: "solid",
            params: { points: [[0.45, 0], [0.45, 25]] },
            transform: { position: [-4.2, 1.5, 0] },
            material: { preset: "wood", color: "#b68e56" },
          },
        },
        {
          type: "add",
          object: {
            id: "plant-stem",
            label: "Plant stem",
            primitive: "tube",
            params: {
              points: [
                [0.2, 1.8, 0],
                [0.4, 8.5, 0.2],
                [0.2, 15.0, 0],
                [0.5, 21.5, -0.2],
              ],
              radius: 0.24,
            },
            material: { preset: "paint", color: "#437845" },
          },
        },
        {
          type: "add",
          object: {
            id: "plant-leaf-1",
            primitive: "tube",
            params: { points: [[0.3, 18.0, -0.05], [2.0, 19.3, 0.4], [3.5, 19.0, 0.7]], radius: 0.38 },
            material: { preset: "paint", color: "#5f9650" },
          },
        },
        {
          type: "add",
          object: {
            id: "plant-leaf-2",
            primitive: "tube",
            params: { points: [[0.25, 11.2, 0.15], [1.9, 12.2, -0.4], [3.2, 11.9, -0.7]], radius: 0.35 },
            material: { preset: "paint", color: "#568c48" },
          },
        },
        {
          type: "thread",
          target: "stake",
          id: "figure-eight-tie",
          path: [
            [-0.85, 13.2, -0.5],
            [-0.95, 13.3, 0.55],
            [0.25, 13.4, 0.9],
            [2.2, 13.45, 0.0],
            [4.15, 13.5, -0.95],
            [5.35, 13.5, 0.0],
            [4.15, 13.55, 0.95],
            [2.2, 13.6, 0.0],
            [0.25, 13.65, -0.9],
            [-0.85, 13.7, -0.4],
            [-1.9, 12.7, -0.9],
          ],
          radius: 0.26,
          material: jersey,
          duration: 1.4,
        },
      ],
      camera: { position: [14, 18, 28], target: [-1, 12.5, 0] },
    },
  ],
});
