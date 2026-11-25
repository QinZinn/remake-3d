import { defineProject } from "@/lib/scene/schema";

const newsprint = { preset: "cardboard", color: "#dddcd0" } as const;

export default defineProject({
  slug: "newspaper-seed-pot",
  title: "Roll-up newspaper seed pot",
  summary: "Wrap yesterday’s newspaper around a can to make a small pot for a seedling.",
  difficulty: "easy",
  timeMinutes: 15,
  materials: [
    { id: "newspaper", qty: 1, unit: "Four plain newsprint layers" },
    { id: "steel-can", qty: 1, unit: "One smooth-edged can, used as a form" },
    { id: "masking-tape", qty: 1, unit: "A few short strips" },
    { id: "potting-soil", qty: 1, unit: "A handful of seed-starting mix" },
    { id: "plant-seedling", qty: 1, unit: "One small seedling" },
  ],
  tools: [{ id: "scissors" }],
  wasteDiverted: [{ materialId: "newspaper", grams: 6 }],
  sources: [{
    title: "Garden Equipment and Items to Make for the Maine Garden",
    publisher: "University of Maine Cooperative Extension",
    url: "https://extension.umaine.edu/publications/2763e/",
    license: "Publisher copyright (reference only)",
    note: "See the section on round newspaper pots and its advice about using a waterproof tray.",
  }],
  camera: { position: [21, 19, 25], target: [0, 4, 0] },
  scene: {
    objects: [
      { id: "form", source: "steel-can", primitive: "can", params: { height: 9, radius: 3.6, topRadius: 3.5 }, transform: { position: [-4, 4, 0] }, material: { preset: "aluminium" } },
      { id: "paper", source: "newspaper", primitive: "box", params: { width: 24, height: 0.22, depth: 10 }, transform: { position: [4, 0, 8] }, material: newsprint },
    ],
  },
  steps: [
    {
      title: "Wrap the can",
      text: "Cut four strips of plain newspaper about 10 cm wide and long enough to overlap around the can. Stack the strips, roll them around the can with 4 cm hanging past the closed base, and tape the overlap.",
      warning: "Use a clean can with a smooth opening. Skip cans with a sharp rim or rust.",
      ops: [
        { type: "remove", target: "paper", away: [-4, 3, 0], duration: 0.55 },
        { type: "add", object: { id: "pot", primitive: "sleeve", source: "newspaper", params: { radius: 3.8, height: 10 }, transform: { position: [-4, 0, 0] }, material: newsprint } },
      ],
    },
    {
      title: "Fold the bottom shut",
      text: "Turn the wrapped can over. Fold the overhanging paper across the closed end a little at a time. Press the folds flat and use a short strip of tape to secure them.",
      ops: [
        { type: "add", object: { id: "pot.bottom", parent: "pot", primitive: "solid", params: { points: [[3.8, 0], [3.8, 0.24]] }, material: newsprint } },
        { type: "transform", target: "pot", scale: [1, 0.63, 1] },
        { type: "transform", target: "form", position: [-4, 0.3, 0] },
      ],
      camera: { position: [15, 20, 21], target: [-4, 4, 0] },
    },
    {
      title: "Slide the form out",
      text: "Stand the pot on its folded base. Hold the paper gently as you pull the can straight up, then put the pot on a waterproof tray.",
      tip: "If the paper sticks, turn the can slightly as you lift.",
      ops: [{ type: "remove", target: "form", away: [0, 11, 0], duration: 0.95 }],
    },
    {
      title: "Add mix and a seedling",
      text: "Fill the pot almost to the top with damp seed-starting mix. Make space for a seedling’s roots, settle it into the hole and lightly firm the mix around it.",
      tip: "Keep the pot on the tray as the paper softens. Remove tape before transplanting.",
      ops: [
        { type: "fill", target: "pot", level: 0.77, material: { preset: "soil" } },
        { type: "thread", target: "pot", id: "stem", path: [[0, 7.6, 0], [0.12, 10.3, 0.1], [-0.18, 12.2, 0.2]], radius: 0.09, material: { preset: "paint", color: "#427645" } },
        { type: "thread", target: "pot", id: "leaf.left", path: [[0, 11.4, 0.1], [-0.62, 11.85, 0.19], [-1.48, 11.88, 0.25]], radius: 0.15, material: { preset: "paint", color: "#63984d" }, duration: 0.42 },
        { type: "thread", target: "pot", id: "leaf.right", path: [[0, 10.8, 0.1], [0.72, 11.26, 0.02], [1.32, 11.32, -0.14]], radius: 0.13, material: { preset: "paint", color: "#5d9354" }, duration: 0.42 },
      ],
    },
  ],
});
