import { defineProject, type SceneOpInput, type Vec3 } from "@/lib/scene/schema";

/** Build a tight helical twine wrap around the slender bottle neck. */
function neckWrapPath(radius: number, yStart: number, yEnd: number, turns: number): Vec3[] {
  const segments = turns * 14;
  const pts: Vec3[] = [];
  for (let i = 0; i <= segments; i++) {
    const t = i / segments;
    const angle = t * turns * Math.PI * 2;
    pts.push([
      Number((radius * Math.cos(angle)).toFixed(3)),
      Number((yStart + (yEnd - yStart) * t).toFixed(3)),
      Number((radius * Math.sin(angle)).toFixed(3)),
    ]);
  }
  return pts;
}

/** Graceful petal outline (base at origin, tip at +Y). */
const daisyPetal: [number, number][] = [
  [0, 0],
  [0.42, 0.55],
  [0.52, 1.35],
  [0.3, 1.95],
  [0, 2.15],
  [-0.3, 1.95],
  [-0.52, 1.35],
  [-0.42, 0.55],
];

/** Narrow green stem leaf outline. */
const stemLeaf: [number, number][] = [
  [0, 0],
  [0.48, 0.7],
  [0.54, 1.8],
  [0.24, 2.7],
  [0, 3.1],
  [-0.24, 2.7],
  [-0.54, 1.8],
  [-0.48, 0.7],
];

/** Build radial flower petals parented to a bloom disc. */
function bloomPetals(
  prefix: string,
  parent: string,
  count: number,
  petalColor: string,
  scale = 1,
): SceneOpInput[] {
  return Array.from({ length: count }, (_, i): SceneOpInput => {
    const yaw = (i / count) * 360;
    return {
      type: "add",
      duration: 0.08,
      object: {
        id: `${prefix}-p${i + 1}`,
        parent,
        primitive: "extrude",
        params: { points: daisyPetal, depth: 0.08, bevel: 0.025, curve: true },
        transform: {
          position: [0, 0.22, 0],
          rotation: [68, yaw, 0],
          scale: [scale, scale, 1],
        },
        material: { preset: "paint", color: petalColor },
      },
    };
  });
}

/**
 * Intact glass bottle bud vase.
 * Transforms a clean, uncut slender glass bottle into a decorative bud vase
 * using cotton-string neck wrapping and an optional painted lower colour band.
 */
export default defineProject({
  slug: "glass-bottle-bud-vase",
  title: "Twine-wrapped glass bottle bud vase",
  summary:
    "Turn one clean, intact slender glass bottle into a single-stem bud vase with a snug cotton-cord neck wrap and an optional painted lower band—no glass cutting, drilling, or heat required.",
  difficulty: "easy",
  timeMinutes: 20,
  materials: [
    { id: "glass-bottle", qty: 1, unit: "330–500 ml intact slender bottle" },
    { id: "cotton-string", qty: 1, unit: "about 1.5 m twine or cord for neck wrap" },
    { id: "acrylic-paint", qty: 1, unit: "small amount for lower colour band", optional: true },
  ],
  tools: [
    { id: "scissors" },
    { id: "paintbrush", optional: true },
    { id: "hot-glue-gun", optional: true },
    { id: "ruler-tape", optional: true },
  ],
  wasteDiverted: [{ materialId: "glass-bottle", grams: 240 }],
  sources: [
    {
      title: "Fun Ways To Reuse Wine Bottles and Corks",
      publisher: "Earth911",
      url: "https://earth911.com/diy/ways-to-reuse-wine-bottles-and-corks/",
      license: "Publisher copyright (reference only)",
      note: "See the examples of using intact wine bottles as vases.",
    },
  ],
  camera: { position: [26, 20, 42], target: [0, 12.5, 0] },
  scene: {
    objects: [
      {
        id: "bottle",
        label: "Glass bottle",
        source: "glass-bottle",
        primitive: "bottle",
        params: { height: 25, radius: 3.5, neckRadius: 1.25, neckHeight: 5.5, shoulderHeight: 5.5, ribs: 0 },
        material: { preset: "glass", color: "#d8ece3" },
      },
      {
        id: "cap",
        label: "Bottle cap",
        primitive: "cap",
        params: { height: 1.5, radius: 1.48 },
        transform: { position: [0, 23.7, 0] },
        material: { preset: "aluminium", color: "#ccb684" },
      },
      {
        id: "label",
        label: "Paper label",
        primitive: "sleeve",
        params: { height: 7.4, radius: 3.55 },
        transform: { position: [0, 4.4, 0] },
        material: { preset: "cardboard", color: "#ded2b8" },
      },
      {
        id: "label.accent",
        parent: "label",
        primitive: "sleeve",
        params: { height: 1.3, radius: 3.58 },
        transform: { position: [0, 5.2, 0] },
        material: { preset: "paint", color: "#8c5c42" },
      },
    ],
  },
  steps: [
    {
      title: "Wash, inspect and strip the intact bottle",
      text: "Rinse an empty, intact glass bottle in warm soapy water, remove and recycle the cap, and soak off the paper label completely. Dry the outside thoroughly so paint and cord grip cleanly.",
      tip: "Wipe the outside with a little rubbing alcohol or dry kitchen towel to remove lingering label residue.",
      warning: "Use only an intact, uncracked glass bottle. Do not cut, drill, score, or heat the glass.",
      ops: [
        { type: "remove", target: "cap", away: [10, 8, 0] },
        { type: "remove", target: "label", away: [-18, 0, 5] },
      ],
      camera: { position: [26, 20, 42], target: [0, 12.5, 0] },
    },
    {
      title: "Paint a lower colour band (optional)",
      text: "For a dipped ceramic look, measure about 10 cm up from the base with a ruler and brush two thin coats of acrylic paint around the lower body, leaving the upper glass clear so you can see the water level. Let the paint cure fully before wrapping.",
      tip: "Leave the whole bottle unpainted if you want to showcase tinted green or amber glass.",
      ops: [
        {
          type: "add",
          duration: 0.85,
          object: {
            id: "paint-band",
            label: "Painted lower band",
            parent: "bottle",
            primitive: "sleeve",
            params: { height: 9.2, radius: 3.55 },
            transform: { position: [0, 0.98, 0] },
            material: { preset: "paint", color: "#c47452" },
          },
        },
        {
          type: "add",
          duration: 0.4,
          object: {
            id: "paint-rim",
            parent: "bottle",
            primitive: "sleeve",
            params: { height: 0.45, radius: 3.57 },
            transform: { position: [0, 9.75, 0] },
            material: { preset: "paint", color: "#efe6d6" },
          },
        },
      ],
      camera: { position: [22, 13, 34], target: [0, 7.5, 0] },
    },
    {
      title: "Wrap cotton string around the neck",
      text: "Tie one end of cotton string snugly around the bottle neck just above the ridge, wind five tight coils upward so each turn presses against the last, and tie off or tuck the end under the final loop (using an optional tiny dab of glue on the cord itself rather than the glass). Trim loose tails with scissors.",
      tip: "Keeping steady tension as you wind locks the wrap neatly in place even without glue.",
      ops: [
        {
          type: "thread",
          target: "bottle",
          id: "neck-wrap",
          path: neckWrapPath(1.44, 21.8, 24.15, 6),
          radius: 0.2,
          material: { preset: "fabric", color: "#e8dec8" },
        },
      ],
      camera: { position: [14, 24, 21], target: [0, 22, 0] },
    },
    {
      title: "Add clean water for fresh stems",
      text: "Fill the finished bottle about halfway with clean tap water if you are displaying fresh cuttings—or leave it dry for dried grasses and seed pods.",
      ops: [{ type: "fill", target: "bottle", id: "water", level: 0.53, inset: 0.92, material: { preset: "water", color: "#74bdd9" } }],
      camera: { position: [24, 18, 36], target: [0, 12.5, 0] },
    },
    {
      title: "Arrange flowers or dry cuttings",
      text: "Trim one or two fresh flowers or cleaned dry cuttings on hand with scissors to roughly one-and-a-half times the bottle height, strip any lower leaves that would sit underwater, and place the stems through the narrow neck.",
      tip: "Refresh the water every few days for live stems so the clear glass stays bright.",
      ops: [
        {
          type: "add",
          duration: 0.35,
          object: {
            id: "stem-1",
            label: "Flower stem",
            parent: "bottle",
            primitive: "tube",
            params: {
              points: [
                [-0.35, 3, 0.2],
                [-0.2, 14, 0.1],
                [0, 24, 0],
                [0.7, 29.2, 0.4],
                [1.6, 33.4, 0.85],
              ],
              radius: 0.16,
            },
            material: { preset: "paint", color: "#447843" },
          },
        },
        {
          type: "add",
          duration: 0.2,
          object: {
            id: "leaf-1",
            parent: "bottle",
            primitive: "extrude",
            params: { points: stemLeaf, depth: 0.08, bevel: 0.025, curve: true },
            transform: { position: [0.55, 28.4, 0.35], rotation: [42, 22, -38] },
            material: { preset: "paint", color: "#4e8a4a" },
          },
        },
        {
          type: "add",
          duration: 0.22,
          object: {
            id: "bloom-1",
            label: "Golden daisy",
            parent: "bottle",
            primitive: "solid",
            params: {
              points: [
                [0.18, 0],
                [0.58, 0.18],
                [0.64, 0.42],
                [0.42, 0.56],
              ],
            },
            transform: { position: [1.62, 33.3, 0.86], rotation: [54, 16, -16] },
            material: { preset: "paint", color: "#c9832a" },
          },
        },
        ...bloomPetals("b1", "bloom-1", 8, "#f5cc53", 1.25),
        {
          type: "add",
          duration: 0.35,
          object: {
            id: "stem-2",
            label: "Second stem",
            parent: "bottle",
            primitive: "tube",
            params: {
              points: [
                [0.35, 4, -0.2],
                [0.1, 16, -0.1],
                [-0.1, 24.4, -0.1],
                [-1.1, 28.6, -0.45],
                [-2.2, 31.6, -0.8],
              ],
              radius: 0.14,
            },
            material: { preset: "paint", color: "#52884d" },
          },
        },
        {
          type: "add",
          duration: 0.2,
          object: {
            id: "leaf-2",
            parent: "bottle",
            primitive: "extrude",
            params: { points: stemLeaf, depth: 0.08, bevel: 0.025, curve: true },
            transform: { position: [-0.9, 27.6, -0.35], rotation: [35, -35, 44], scale: [0.85, 0.85, 1] },
            material: { preset: "paint", color: "#589452" },
          },
        },
        {
          type: "add",
          duration: 0.22,
          object: {
            id: "bloom-2",
            label: "White bloom",
            parent: "bottle",
            primitive: "solid",
            params: {
              points: [
                [0.16, 0],
                [0.5, 0.16],
                [0.56, 0.36],
                [0.34, 0.48],
              ],
            },
            transform: { position: [-2.22, 31.5, -0.8], rotation: [50, -18, 22] },
            material: { preset: "paint", color: "#e8b43a" },
          },
        },
        ...bloomPetals("b2", "bloom-2", 7, "#faf6ee", 1.15),
      ],
      // Generous vertical framing so the glass base and tallest petals never clip on desktop or mobile.
      camera: { position: [30, 26, 58], target: [0, 17.5, 0] },
    },
  ],
});
