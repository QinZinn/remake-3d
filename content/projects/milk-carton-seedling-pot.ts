import { defineProject, type SceneObjectInput } from "@/lib/scene/schema";

const cartonCream = { preset: "paint", color: "#f1eee2" } as const;
const cartonInner = { preset: "cardboard", color: "#e6e2d4" } as const;
const cartonPrint = { preset: "paint", color: "#629474" } as const;
const cartonAccent = { preset: "paint", color: "#4a785c" } as const;
const soilMix = { preset: "soil", color: "#4e3628" } as const;

/** Build a circular polygon in 2D for real punched drainage holes. */
function circle2D(cx: number, cy: number, r: number, segs = 14): [number, number][] {
  return Array.from({ length: segs }, (_, i) => {
    const a = (i / segs) * Math.PI * 2;
    return [Number((cx + r * Math.cos(a)).toFixed(3)), Number((cy + r * Math.sin(a)).toFixed(3))];
  });
}

const holePositions = [-2.2, 0, 2.2];

const plugs: SceneObjectInput[] = holePositions.map((x, index) => ({
  id: `plug.${index}`,
  primitive: "solid",
  params: {
    points: [
      [0.4, 0],
      [0.4, 0.24],
    ],
  },
  transform: { position: [x, 0, 0] },
  material: cartonInner,
}));

/** Triangular closed gable side wall (eliminates the open holes in the roof ends). */
const gableTriangle: [number, number][] = [
  [-4.3, 0],
  [4.3, 0],
  [0, 3.65],
];

/** Small curved cotyledon leaf for the emerging seedling. */
const sproutLeaf: [number, number][] = [
  [0, 0],
  [0.65, 0.45],
  [0.85, 1.35],
  [0.45, 2.15],
  [0, 2.45],
  [-0.45, 2.15],
  [-0.85, 1.35],
  [-0.65, 0.45],
];

export default defineProject({
  slug: "milk-carton-seedling-pot",
  title: "Milk carton seedling pot",
  summary: "Trim a clean paper milk carton into a square pot for starting seeds on a tray.",
  difficulty: "easy",
  timeMinutes: 20,
  materials: [
    { id: "milk-carton", qty: 1, unit: "One clean gable-top carton" },
    { id: "potting-soil", qty: 1, unit: "Enough seed-starting mix to fill the base" },
    { id: "plant-seedling", qty: 1, unit: "A few seeds from one packet" },
  ],
  tools: [{ id: "utility-knife" }, { id: "scissors" }, { id: "nail-awl" }, { id: "marker" }, { id: "ruler-tape", optional: true }],
  wasteDiverted: [{ materialId: "milk-carton", grams: 16 }],
  sources: [
    {
      title: "Containers and Potting Soil for Indoor Seed Starting",
      publisher: "University of Maryland Extension",
      url: "https://www.extension.umd.edu/resource/containers-and-potting-soil-indoor-seed-starting",
      license: "Publisher copyright (reference only)",
      note: "Supports reusing milk cartons with drainage holes and choosing a seed-starting mix.",
    },
  ],
  camera: { position: [24, 24, 30], target: [0, 10, 0] },
  scene: {
    objects: [
      // Perforated carton base with 3 real circular drainage holes (filled by plugs until step 2).
      {
        id: "base",
        source: "milk-carton",
        primitive: "extrude",
        params: {
          points: [
            [-4.3, -4.3],
            [4.3, -4.3],
            [4.3, 4.3],
            [-4.3, 4.3],
          ],
          holes: holePositions.map((x) => circle2D(x, 0, 0.4)),
          depth: 0.24,
        },
        transform: { position: [0, 0.12, 0], rotation: [90, 0, 0] },
        material: cartonInner,
      },
      ...plugs,
      // Four hollow lower pot walls (8.6 x 8.6 x 9.0 cm) with wrap-around printed dairy graphic band.
      { id: "front", primitive: "box", params: { width: 8.6, height: 9, depth: 0.22 }, transform: { position: [0, 0, 4.19] }, material: cartonCream },
      { id: "back", primitive: "box", params: { width: 8.6, height: 9, depth: 0.22 }, transform: { position: [0, 0, -4.19] }, material: cartonCream },
      { id: "left", primitive: "box", params: { width: 0.22, height: 9, depth: 8.16 }, transform: { position: [-4.19, 0, 0] }, material: cartonCream },
      { id: "right", primitive: "box", params: { width: 0.22, height: 9, depth: 8.16 }, transform: { position: [4.19, 0, 0] }, material: cartonCream },
      // Continuous printed green lower graphic bands around all 4 sides (no z-fighting).
      { id: "band.front", primitive: "box", params: { width: 8.64, height: 5.2, depth: 0.04 }, transform: { position: [0, 1.4, 4.31] }, material: cartonPrint },
      { id: "band.back", primitive: "box", params: { width: 8.64, height: 5.2, depth: 0.04 }, transform: { position: [0, 1.4, -4.31] }, material: cartonPrint },
      { id: "band.left", primitive: "box", params: { width: 0.04, height: 5.2, depth: 8.64 }, transform: { position: [-4.31, 1.4, 0] }, material: cartonPrint },
      { id: "band.right", primitive: "box", params: { width: 0.04, height: 5.2, depth: 8.64 }, transform: { position: [4.31, 1.4, 0] }, material: cartonPrint },
      // Upper carton body + fully closed gable roof + twist pouring cap (lifts off in step 1).
      { id: "carton-top", primitive: "box", params: { width: 8.6, height: 7.4, depth: 8.6 }, transform: { position: [0, 9.02, 0] }, material: cartonCream },
      { id: "top.band.f", parent: "carton-top", primitive: "box", params: { width: 8.64, height: 1.2, depth: 0.04 }, transform: { position: [0, 5.4, 4.31] }, material: cartonAccent },
      { id: "top.band.b", parent: "carton-top", primitive: "box", params: { width: 8.64, height: 1.2, depth: 0.04 }, transform: { position: [0, 5.4, -4.31] }, material: cartonAccent },
      { id: "top.band.l", parent: "carton-top", primitive: "box", params: { width: 0.04, height: 1.2, depth: 8.64 }, transform: { position: [-4.31, 5.4, 0] }, material: cartonAccent },
      { id: "top.band.r", parent: "carton-top", primitive: "box", params: { width: 0.04, height: 1.2, depth: 8.64 }, transform: { position: [4.31, 5.4, 0] }, material: cartonAccent },
      // Sloped gable roof panels (front and back).
      {
        id: "roof.front",
        parent: "carton-top",
        primitive: "box",
        params: { width: 8.64, height: 5.64, depth: 0.2 },
        transform: { position: [0, 7.36, 4.24], rotation: [-49.7, 0, 0] },
        material: cartonPrint,
      },
      {
        id: "roof.back",
        parent: "carton-top",
        primitive: "box",
        params: { width: 8.64, height: 5.64, depth: 0.2 },
        transform: { position: [0, 7.36, -4.24], rotation: [49.7, 0, 0] },
        material: cartonPrint,
      },
      // Closed recessed triangular gable side gussets (left and right).
      {
        id: "gable.left",
        parent: "carton-top",
        primitive: "extrude",
        params: { points: gableTriangle, depth: 0.22 },
        transform: { position: [-4.16, 7.4, 0], rotation: [0, 90, 0] },
        material: cartonCream,
      },
      {
        id: "gable.right",
        parent: "carton-top",
        primitive: "extrude",
        params: { points: gableTriangle, depth: 0.22 },
        transform: { position: [4.16, 7.4, 0], rotation: [0, 90, 0] },
        material: cartonCream,
      },
      // Crimped top ridge fin.
      {
        id: "roof.ridge",
        parent: "carton-top",
        primitive: "box",
        params: { width: 8.66, height: 1.05, depth: 0.34 },
        transform: { position: [0, 10.95, 0] },
        material: cartonAccent,
      },
      // White plastic twist pouring spout on the front gable slope.
      {
        id: "spout.cap",
        label: "Pouring cap",
        parent: "carton-top",
        primitive: "cap",
        params: { height: 0.85, radius: 1.05 },
        transform: { position: [1.65, 9.15, 2.35], rotation: [40.3, 0, 0] },
        material: { preset: "plastic", color: "#f5f4ee" },
      },
    ],
  },
  steps: [
    {
      title: "Trim the clean carton",
      text: "Rinse and dry the carton. Mark a line around it about 9 cm above the base. Make a starter slit on the line, then follow it with scissors to lift away the top.",
      warning: "Set the carton on a cutting board and keep your other hand clear of the blade. Have an adult make the starter slit where needed.",
      ops: [{ type: "remove", target: "carton-top", away: [10, 7, 0], duration: 0.95 }],
      camera: { position: [18, 20, 22], target: [0, 4.5, 0] },
    },
    {
      title: "Open drainage holes",
      text: "Turn the empty base over and punch three small holes with an awl or nail. Set the pot on a waterproof saucer to catch drips.",
      warning: "Support the base on scrap wood while punching. Keep fingers out of the path of the point.",
      ops: [
        ...plugs.map(({ id }) => ({ type: "remove" as const, target: id, away: [0, 2.2, 0] as [number, number, number], duration: 0.32 })),
        {
          type: "add",
          duration: 0.55,
          object: {
            id: "saucer",
            label: "Drip saucer",
            primitive: "can",
            params: { height: 2.5, radius: 7.4, topRadius: 7.4 },
            transform: { position: [0, -0.02, 0], scale: [1, 0.52, 1] },
            material: { preset: "paint", color: "#9c5438" },
          },
        },
      ],
      camera: { position: [10, 29, 13], target: [0, 1.5, 0] },
    },
    {
      title: "Fill with damp mix",
      text: "Spoon in lightly moistened seed-starting mix. Leave space under the rim so you can water without spilling.",
      ops: [
        {
          type: "add",
          duration: 0.8,
          object: {
            id: "mix",
            label: "Seed-starting mix",
            primitive: "box",
            params: { width: 8.12, height: 6.7, depth: 8.12 },
            transform: { position: [0, 0.25, 0] },
            material: soilMix,
          },
        },
        {
          type: "add",
          duration: 0.45,
          object: {
            id: "mix.mound",
            primitive: "solid",
            params: {
              points: [
                [3.6, 0],
                [2.8, 0.35],
                [1.4, 0.6],
                [0, 0.68],
              ],
            },
            transform: { position: [0, 6.9, 0] },
            material: soilMix,
          },
        },
      ],
      camera: { position: [17, 19, 22], target: [0, 5, 0] },
    },
    {
      title: "Sow and set in the light",
      text: "Sow according to the depth on your seed packet. Water gently and keep the mix moist. Once seedlings emerge, give them bright light and drain the saucer after watering.",
      tip: "Peel the carton away at transplanting so none of the coated board goes into the soil.",
      ops: [
        {
          type: "add",
          duration: 0.3,
          object: {
            id: "seed",
            primitive: "solid",
            params: {
              points: [
                [0.2, 0],
                [0.28, 0.14],
                [0.14, 0.28],
              ],
            },
            transform: { position: [0, 9.5, 0] },
            material: { preset: "wood", color: "#d5aa60" },
          },
        },
        { type: "transform", target: "seed", position: [0, 7.1, 0], duration: 0.5 },
        {
          type: "add",
          duration: 0.35,
          object: {
            id: "sprout.stem",
            label: "Seedling stem",
            primitive: "tube",
            params: {
              points: [
                [0, 7.3, 0],
                [0.1, 9.2, 0.08],
                [-0.08, 11.1, 0.12],
              ],
              radius: 0.14,
            },
            material: { preset: "paint", color: "#4e8f48" },
          },
        },
        {
          type: "add",
          duration: 0.28,
          object: {
            id: "sprout.leaf.left",
            primitive: "extrude",
            params: { points: sproutLeaf, depth: 0.1, bevel: 0.03, curve: true },
            transform: { position: [-0.08, 10.95, 0.12], rotation: [55, 16, 48] },
            material: { preset: "paint", color: "#5ea84f" },
          },
        },
        {
          type: "add",
          duration: 0.28,
          object: {
            id: "sprout.leaf.right",
            primitive: "extrude",
            params: { points: sproutLeaf, depth: 0.1, bevel: 0.03, curve: true },
            transform: { position: [-0.05, 10.85, 0.12], rotation: [50, -24, -52] },
            material: { preset: "paint", color: "#68b357" },
          },
        },
      ],
      camera: { position: [18, 18, 25], target: [0, 5.8, 0] },
    },
  ],
});
