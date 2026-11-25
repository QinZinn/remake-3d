import { defineProject, type Vec3 } from "@/lib/scene/schema";

/** Build a tight helical twine wrap around the slender bottle neck. */
function neckWrapPath(radius: number, yStart: number, yEnd: number, turns: number): Vec3[] {
  const segments = turns * 12;
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
  camera: { position: [28, 22, 42], target: [0, 12.5, 0] },
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
        params: { height: 1.5, radius: 1.5 },
        transform: { position: [0, 23.7, 0] },
        material: { preset: "aluminium", color: "#c2b086" },
      },
      {
        id: "label",
        label: "Paper label",
        primitive: "sleeve",
        params: { height: 7.5, radius: 3.55 },
        transform: { position: [0, 4.5, 0] },
        material: { preset: "paint", color: "#d4c7a9" },
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
      camera: { position: [28, 22, 42], target: [0, 12.5, 0] },
    },
    {
      title: "Paint a lower colour band (optional)",
      text: "For a dipped ceramic look, measure about 10 cm up from the base with a ruler and brush two thin coats of acrylic paint around the lower body, leaving the upper glass clear so you can see the water level. Let the paint cure fully before wrapping.",
      tip: "Leave the whole bottle unpainted if you want to showcase tinted green or amber glass.",
      ops: [
        {
          type: "add",
          object: {
            id: "paint-band",
            label: "Painted lower band",
            parent: "bottle",
            primitive: "sleeve",
            params: { height: 9.5, radius: 3.55 },
            transform: { position: [0, 1.2, 0] },
            material: { preset: "paint", color: "#c77d5c" },
          },
        },
      ],
      camera: { position: [22, 12, 32], target: [0, 7, 0] },
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
          path: neckWrapPath(1.46, 22.15, 24.35, 5),
          radius: 0.19,
          material: { preset: "fabric", color: "#e6dcc8" },
        },
      ],
      camera: { position: [14, 24, 20], target: [0, 22, 0] },
    },
    {
      title: "Add clean water for fresh stems",
      text: "Fill the finished bottle about halfway with clean tap water if you are displaying fresh cuttings—or leave it dry for dried grasses and seed pods.",
      ops: [{ type: "fill", target: "bottle", id: "water", level: 0.52, inset: 0.92, material: { preset: "water" } }],
      camera: { position: [24, 18, 34], target: [0, 12, 0] },
    },
    {
      title: "Arrange flowers or dry cuttings",
      text: "Trim one or two fresh flowers or cleaned dry cuttings on hand with scissors to roughly one-and-a-half times the bottle height, strip any lower leaves that would sit underwater, and place the stems through the narrow neck.",
      tip: "Refresh the water every few days for live stems so the clear glass stays bright.",
      ops: [
        {
          type: "add",
          object: {
            id: "stem-1",
            label: "Flower stem",
            parent: "bottle",
            primitive: "tube",
            params: {
              points: [
                [-0.4, 3, 0.2],
                [-0.2, 14, 0.1],
                [0, 24, 0],
                [0.8, 30, 0.4],
                [1.8, 35, 0.9],
              ],
              radius: 0.16,
            },
            material: { preset: "paint", color: "#4e7a48" },
          },
        },
        {
          type: "add",
          object: {
            id: "bloom-1",
            label: "Flower bloom",
            parent: "bottle",
            primitive: "solid",
            params: {
              points: [
                [0.15, 0],
                [0.9, 0.5],
                [1.3, 1.5],
                [0.85, 2.3],
                [0.3, 2.5],
              ],
            },
            transform: { position: [1.8, 34.8, 0.9], rotation: [12, 0, -16] },
            material: { preset: "paint", color: "#e5b84b" },
          },
        },
        {
          type: "add",
          object: {
            id: "stem-2",
            label: "Second stem",
            parent: "bottle",
            primitive: "tube",
            params: {
              points: [
                [0.4, 4, -0.2],
                [0.1, 16, -0.1],
                [-0.1, 24.5, -0.1],
                [-1.2, 29.5, -0.5],
                [-2.2, 33, -0.8],
              ],
              radius: 0.14,
            },
            material: { preset: "paint", color: "#5e8c54" },
          },
        },
        {
          type: "add",
          object: {
            id: "bloom-2",
            label: "Second bloom",
            parent: "bottle",
            primitive: "solid",
            params: {
              points: [
                [0.12, 0],
                [0.75, 0.4],
                [1.05, 1.2],
                [0.65, 1.9],
                [0.25, 2.1],
              ],
            },
            transform: { position: [-2.2, 32.8, -0.8], rotation: [-10, 0, 18] },
            material: { preset: "paint", color: "#f2eee6" },
          },
        },
      ],
      camera: { position: [30, 28, 52], target: [0, 18, 0] },
    },
  ],
});
