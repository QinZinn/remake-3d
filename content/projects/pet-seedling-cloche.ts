import { defineProject } from "@/lib/scene/schema";

export default defineProject({
  slug: "pet-seedling-cloche",
  title: "PET bottle mini seedling cover",
  summary:
    "Remove the cap and base from a clear 2 L PET bottle to make a vented mini greenhouse cover that shields a young seedling from cool wind.",
  difficulty: "easy",
  timeMinutes: 10,
  materials: [
    { id: "pet-bottle", qty: 1, unit: "Clean 2 L clear bottle" },
    { id: "plant-seedling", qty: 1, unit: "Young garden or pot seedling" },
    { id: "potting-soil", qty: 1, unit: "Garden bed or pot soil", optional: true },
  ],
  tools: [
    { id: "utility-knife" },
    { id: "scissors" },
    { id: "marker" },
    { id: "sandpaper" },
    { id: "ruler-tape", optional: true },
  ],
  // Retained upper ~25 cm clear dome (~31 g of a ~40 g 2 L PET bottle); the cut-off base ring and cap go to recycling.
  wasteDiverted: [{ materialId: "pet-bottle", grams: 31 }],
  sources: [
    {
      title: "Up-Cycle When Gardening",
      publisher: "Oregon State University Extension",
      url: "https://extension.oregonstate.edu/imported-publication/cycle-when-gardening",
      license: "Publisher copyright (reference only)",
      note: "Describes cutting the bottom off a clear plastic bottle and leaving the cap off to make a vented mini-greenhouse cover over young plants; step wording and measurements here are original.",
    },
  ],
  camera: { position: [30, 24, 46], target: [0, 14, 0] },
  scene: {
    objects: [
      {
        id: "bottle",
        label: "Clear 2 L PET bottle",
        source: "pet-bottle",
        primitive: "bottle",
        params: { height: 30, radius: 5.2, neckRadius: 1.4, neckHeight: 2.6, shoulderHeight: 8, ribs: 2 },
        material: { preset: "pet" },
      },
      {
        id: "cap",
        label: "Bottle cap",
        source: "bottle-cap",
        primitive: "cap",
        params: { height: 1.4, radius: 1.75 },
        transform: { position: [0, 28.85, 0] },
        material: { preset: "plastic", color: "#2d8a68" },
      },
      {
        id: "label",
        label: "Bottle label",
        primitive: "sleeve",
        params: { height: 7.5, radius: 5.26 },
        transform: { position: [0, 8.5, 0] },
        material: { preset: "paint", color: "#3d7ab8" },
      },
    ],
  },
  steps: [
    {
      title: "Wash, strip the label, and remove the cap",
      text: "Rinse a clean 2 L clear PET bottle in warm water and peel off the label so sunlight passes cleanly to the plant. Unscrew and set aside the cap—leaving the neck open acts as a built-in vent for excess warmth and humidity.",
      tip: "Soak stubborn label glue in warm soapy water for a few minutes before rubbing it clean.",
      ops: [
        { type: "remove", target: "label", away: [-18, 0, 5] },
        { type: "remove", target: "cap", away: [10, 10, 0] },
      ],
      camera: { position: [30, 24, 46], target: [0, 14, 0] },
    },
    {
      title: "Mark and cut off the bottom 5 cm",
      text: "Measure about 5 cm up from the base, draw a guide line all the way around with a marker, poke a starter slit with a utility knife, and follow the line with scissors to remove the closed bottom.",
      warning: "Cut away from your supporting hand when making the starter slit. Have an adult start the cut if needed.",
      ops: [{ type: "cut", target: "bottle", y: 5, gap: 3.0 }],
      camera: { position: [26, 16, 40], target: [0, 10, 0] },
    },
    {
      title: "Smooth the cut bottom rim",
      text: "Recycle the cut-off base ring. Trim any sharp points along the open bottom rim with scissors and lightly run sandpaper around the edge so it presses cleanly into soil without snagging gloves or leaves.",
      ops: [
        { type: "remove", target: "bottle.bottom", away: [18, -2, 0] },
        { type: "transform", target: "bottle.top", position: [0, -5, 0] },
      ],
      camera: { position: [24, 15, 36], target: [0, 11, 0] },
    },
    {
      title: "Set the vented cover over a seedling",
      text: "Centre the open-bottom dome over a young seedling and twist the lower rim 1–2 cm into the soil so breezes cannot knock it over. Keep the cap off for airflow, and lift the cover off once the plant outgrows the space.",
      warning: "Lift the cover off during hot midday sun so trapped warmth does not overheat tender leaves.",
      ops: [
        { type: "transform", target: "bottle.top", position: [15, 1, 0], arc: 6, duration: 0.9 },
        {
          type: "add",
          object: {
            id: "soil-bed",
            label: "Garden soil mound",
            primitive: "solid",
            params: {
              points: [
                [11, 0],
                [10.5, 2.4],
                [9.4, 3.2],
              ],
            },
            material: { preset: "soil" },
          },
        },
        {
          type: "thread",
          target: "soil-bed",
          id: "seedling-stem",
          path: [[0, 3.0, 0], [0.15, 6.2, 0.1], [-0.1, 9.6, 0]],
          radius: 0.14,
          material: { preset: "paint", color: "#437845" },
          duration: 0.45,
        },
        {
          type: "thread",
          target: "soil-bed",
          id: "seedling-leaf-1",
          path: [[0.1, 7.6, 0.05], [1.4, 8.7, 0.3], [2.4, 8.6, 0.5]],
          radius: 0.28,
          material: { preset: "paint", color: "#5e9650" },
          duration: 0.35,
        },
        {
          type: "thread",
          target: "soil-bed",
          id: "seedling-leaf-2",
          path: [[-0.05, 8.4, 0], [-1.3, 9.5, -0.3], [-2.2, 9.3, -0.5]],
          radius: 0.28,
          material: { preset: "paint", color: "#578f4b" },
          duration: 0.35,
        },
        { type: "transform", target: "bottle.top", position: [0, -3.2, 0], arc: 10, duration: 1.2 },
      ],
      camera: { position: [26, 22, 42], target: [0, 12, 0] },
    },
  ],
});
