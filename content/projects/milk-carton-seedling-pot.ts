import { defineProject, type SceneObjectInput } from "@/lib/scene/schema";

const carton = { preset: "cardboard", color: "#e8e5c8" } as const;
const print = { preset: "cardboard", color: "#83a98c" } as const;
const mix = { preset: "soil", color: "#4e3628" } as const;
const plugs = [-2, 0, 2].map((x, index): SceneObjectInput => ({
  id: `plug.${index}`, primitive: "box", params: { width: 0.36, height: 0.22, depth: 0.38 },
  transform: { position: [x, 0, 0] }, material: carton,
}));
const baseSegments = [[-4.4, -2.18], [-1.82, -0.18], [0.18, 1.82], [2.18, 4.4]].map(
  ([left, right], index): SceneObjectInput => ({
    id: `base.strip-${index}`, primitive: "box",
    params: { width: right - left, height: 0.22, depth: 0.38 },
    transform: { position: [(right + left) / 2, 0, 0] }, material: carton,
  }),
);

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
  sources: [{
    title: "Containers and Potting Soil for Indoor Seed Starting",
    publisher: "University of Maryland Extension",
    url: "https://www.extension.umd.edu/resource/containers-and-potting-soil-indoor-seed-starting",
    license: "Publisher copyright (reference only)",
    note: "Supports reusing milk cartons with drainage holes and choosing a seed-starting mix.",
  }],
  camera: { position: [23, 26, 28], target: [0, 9, 0] },
  scene: {
    objects: [
      { id: "front", source: "milk-carton", primitive: "box", params: { width: 8.8, height: 9, depth: 0.22 }, transform: { position: [0, 0, 4.29] }, material: print },
      { id: "back", primitive: "box", params: { width: 8.8, height: 9, depth: 0.22 }, transform: { position: [0, 0, -4.29] }, material: carton },
      { id: "left", primitive: "box", params: { width: 0.22, height: 9, depth: 8.36 }, transform: { position: [-4.29, 0, 0] }, material: carton },
      { id: "right", primitive: "box", params: { width: 0.22, height: 9, depth: 8.36 }, transform: { position: [4.29, 0, 0] }, material: carton },
      { id: "base.front", primitive: "box", params: { width: 8.8, height: 0.22, depth: 4.21 }, transform: { position: [0, 0, 2.295] }, material: carton },
      { id: "base.back", primitive: "box", params: { width: 8.8, height: 0.22, depth: 4.21 }, transform: { position: [0, 0, -2.295] }, material: carton },
      ...baseSegments,
      ...plugs,
      { id: "carton-top", primitive: "box", params: { width: 8.8, height: 7.5, depth: 8.8 }, transform: { position: [0, 9, 0] }, material: carton },
      { id: "roof.front", parent: "carton-top", primitive: "box", params: { width: 8.8, height: 5.24, depth: 0.22 }, transform: { position: [0, 7.5, 4.29], rotation: [-55, 0, 0] }, material: print },
      { id: "roof.back", parent: "carton-top", primitive: "box", params: { width: 8.8, height: 5.24, depth: 0.22 }, transform: { position: [0, 7.5, -4.29], rotation: [55, 0, 0] }, material: print },
      { id: "roof.ridge", parent: "carton-top", primitive: "box", params: { width: 8.8, height: 0.5, depth: 0.23 }, transform: { position: [0, 10.5, 0] }, material: print },
    ],
  },
  steps: [
    {
      title: "Trim the clean carton",
      text: "Rinse and dry the carton. Mark a line around it about 9 cm above the base. Make a starter slit on the line, then follow it with scissors to lift away the top.",
      warning: "Set the carton on a cutting board and keep your other hand clear of the blade. Have an adult make the starter slit where needed.",
      ops: [{ type: "remove", target: "carton-top", away: [9, 6, 0], duration: 0.95 }],
      camera: { position: [19, 21, 20], target: [0, 4.5, 0] },
    },
    {
      title: "Open drainage holes",
      text: "Turn the empty base over and punch three small holes with an awl or nail. Set the pot on a waterproof saucer to catch drips.",
      warning: "Support the base on scrap wood while punching. Keep fingers out of the path of the point.",
      ops: plugs.map(({ id }) => ({ type: "remove", target: id, away: [0, 2, 0], duration: 0.34 })),
      camera: { position: [12, 24, 14], target: [0, 3.5, 0] },
    },
    {
      title: "Fill with damp mix",
      text: "Spoon in lightly moistened seed-starting mix. Leave space under the rim so you can water without spilling.",
      ops: [{
        type: "add",
        object: { id: "mix", primitive: "box", params: { width: 8.3, height: 6.25, depth: 8.3 }, transform: { position: [0, 0.22, 0] }, material: mix },
      }],
    },
    {
      title: "Sow and set in the light",
      text: "Sow according to the depth on your seed packet. Water gently and keep the mix moist. Once seedlings emerge, give them bright light and drain the saucer after watering.",
      tip: "Peel the carton away at transplanting so none of the coated board goes into the soil.",
      ops: [
        { type: "add", object: { id: "seed", primitive: "solid", params: { points: [[0.15, 0], [0.21, 0.08], [0.11, 0.17]] }, transform: { position: [0, 8.5, 0] }, material: { preset: "wood", color: "#d5aa60" } } },
        { type: "transform", target: "seed", position: [0, 6.15, 0], duration: 0.65 },
      ],
      camera: { position: [11, 19, 16], target: [0, 5, 0] },
    },
  ],
});
