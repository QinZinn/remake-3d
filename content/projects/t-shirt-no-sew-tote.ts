import { defineProject, type SceneOpInput } from "@/lib/scene/schema";

const jersey = { preset: "fabric", color: "#326f76" } as const;
const hem = { preset: "fabric", color: "#397980" } as const;

const pairs = Array.from({ length: 12 }, (_, index) => ({
  id: `fringe.${index}`,
  x: -16.5 + index * 3,
  rotation: index % 2 === 0 ? -14 : 14,
}));

const cutFringe: SceneOpInput[] = pairs.map(({ id, x }) => ({
  type: "add", duration: 0.08,
  object: {
    id, parent: "body", primitive: "box", params: { width: 2.62, height: 4.1, depth: 1 },
    transform: { position: [x, -4.1, 0] }, material: hem,
  },
}));

const tieFringe: SceneOpInput[] = pairs.map(({ id, x, rotation }) => ({
  type: "transform", target: id, position: [x, -2.6, 0], rotation: [0, 0, rotation], scale: [0.85, 0.63, 1.55], duration: 0.1,
}));

export default defineProject({
  slug: "t-shirt-no-sew-tote",
  title: "No-sew T-shirt tote",
  summary: "Cut handles and knot the hem of a cotton tee to make a soft bag for light errands.",
  difficulty: "easy",
  timeMinutes: 25,
  materials: [{ id: "t-shirt", qty: 1, unit: "One clean cotton T-shirt" }],
  tools: [{ id: "scissors" }, { id: "ruler-tape", optional: true }],
  wasteDiverted: [{ materialId: "t-shirt", grams: 120 }],
  sources: [{
    title: "Shop Waste-Free with Reusable T-Shirt Bags",
    publisher: "NOAA Marine Debris Program",
    url: "https://marinedebris.noaa.gov/shop-waste-free-reusable-t-shirt-bags",
    license: "Public domain (U.S. government work)",
    note: "Reference for cutting the neck and sleeves and knotting the bottom seam.",
  }],
  camera: { position: [19, 57, 61], target: [0, 0, 1] },
  scene: {
    objects: [
      { id: "body", source: "t-shirt", primitive: "box", params: { width: 36, height: 34, depth: 1.15 }, transform: { position: [0, 0.8, -20], rotation: [90, 0, 0] }, material: jersey },
      { id: "shoulder.left", parent: "body", primitive: "box", params: { width: 7, height: 8, depth: 1.1 }, transform: { position: [-13.5, 34, 0] }, material: jersey },
      { id: "shoulder.right", parent: "body", primitive: "box", params: { width: 7, height: 8, depth: 1.1 }, transform: { position: [13.5, 34, 0] }, material: jersey },
      { id: "neck.offcut", parent: "body", primitive: "box", params: { width: 20, height: 4.5, depth: 1.05 }, transform: { position: [0, 34, 0] }, material: jersey },
      { id: "sleeve.left", parent: "body", primitive: "box", params: { width: 12.4, height: 11, depth: 1.05 }, transform: { position: [-19, 27, 0], rotation: [0, 0, 31] }, material: jersey },
      { id: "sleeve.right", parent: "body", primitive: "box", params: { width: 12.4, height: 11, depth: 1.05 }, transform: { position: [19, 27, 0], rotation: [0, 0, -31] }, material: jersey },
      { id: "uncut-hem", parent: "body", primitive: "box", params: { width: 36, height: 4.1, depth: 1.08 }, transform: { position: [0, -4.1, 0] }, material: hem },
    ],
  },
  steps: [
    {
      title: "Cut the handle openings",
      text: "Lay the shirt flat with both layers lined up. Cut off the sleeves at the armholes, then widen the neck opening through both layers. Leave a broad band of fabric on each shoulder for a handle.",
      tip: "Keep the sleeve scraps for cleaning cloths.",
      ops: [
        { type: "remove", target: "sleeve.left", away: [-11, 0, -4], duration: 0.6 },
        { type: "remove", target: "sleeve.right", away: [11, 0, -4], duration: 0.6 },
        { type: "remove", target: "neck.offcut", away: [0, 6, -3], duration: 0.65 },
      ],
    },
    {
      title: "Cut a row of fringe",
      text: "With the front and back still aligned, cut parallel slits through both layers. Make them about 4 cm long, spaced about 3 cm apart.",
      ops: [{ type: "remove", target: "uncut-hem", away: [0, -2, -1], duration: 0.35 }, ...cutFringe],
      camera: { position: [0, 37, -52], target: [0, 0, -16] },
    },
    {
      title: "Tie the bottom seam",
      text: "Double-knot each front strip to the strip directly behind it. Close any gaps by tying a tail to its neighbour, then stand the bag up by its handles.",
      tip: "Test it with light objects first and tighten any loose knots.",
      ops: [
        ...tieFringe,
        { type: "transform", target: "body", position: [0, 3.5, 0], rotation: [0, 0, 0], pivot: [0, 0, 0], arc: 3, duration: 1.1 },
      ],
      camera: { position: [31, 34, 59], target: [0, 22, 0] },
    },
  ],
});
