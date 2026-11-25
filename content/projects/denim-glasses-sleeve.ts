import { defineProject } from "@/lib/scene/schema";

const denim = { preset: "fabric", color: "#364f70" } as const;
const denimSeam = { preset: "fabric", color: "#2b405c" } as const;
const cottonLiner = { preset: "fabric", color: "#ebe4d5" } as const;
const glassesFrame = { preset: "plastic", color: "#262b30" } as const;

export default defineProject({
  slug: "denim-glasses-sleeve",
  title: "Lined denim glasses sleeve",
  summary:
    "Bond a soft cotton T-shirt liner inside a scrap of old jeans leg and fold it into a padded, no-sew pouch that shields glasses from scratches.",
  difficulty: "easy",
  timeMinutes: 25,
  materials: [
    { id: "jeans", qty: 1, unit: "Clean 18 × 18 cm rectangle from old jeans leg" },
    { id: "t-shirt", qty: 1, unit: "Clean 16.5 × 17 cm soft cotton jersey scrap" },
    { id: "hot-glue-stick", qty: 1 },
  ],
  tools: [
    { id: "scissors" },
    { id: "ruler-tape" },
    { id: "marker" },
    { id: "hot-glue-gun" },
  ],
  // Retained denim outer shell (~45 g) and soft cotton jersey liner (~15 g) cut from worn clothing.
  wasteDiverted: [
    { materialId: "jeans", grams: 45 },
    { materialId: "t-shirt", grams: 15 },
  ],
  sources: [
    {
      title: "DIY Desk Organizer",
      publisher: "Museum of Craft and Design",
      url: "https://sfmcd.org/project/diy-desk-organizer/",
      license: "Publisher copyright (reference only)",
      note: "General inspiration for simple glue-assembled scrap fabric accessories; this lined denim glasses pouch is an original design.",
    },
    {
      title: "Shop Waste-Free with Reusable T-Shirt Bags",
      publisher: "NOAA Marine Debris Program",
      url: "https://marinedebris.noaa.gov/shop-waste-free-reusable-t-shirt-bags",
      license: "Public domain (U.S. government work)",
      note: "General reference for cutting clean cotton jersey from worn T-shirts; adapted here as an original scratch-free inner glasses liner.",
    },
  ],
  camera: { position: [12, 34, 30], target: [4, 0.5, 0] },
  scene: {
    objects: [
      {
        id: "denim-back",
        label: "Denim outer panel (back half)",
        source: "jeans",
        primitive: "box",
        params: { width: 9.0, height: 18.0, depth: 0.35 },
        transform: { position: [-4.5, 0.2, 9.0], rotation: [-90, 0, 0] },
        material: denim,
      },
      {
        id: "denim-front",
        label: "Denim outer panel (front half)",
        parent: "denim-back",
        source: "jeans",
        primitive: "box",
        params: { width: 9.0, height: 18.0, depth: 0.35 },
        transform: { position: [9.0, 0, 0] },
        material: denim,
      },
      {
        id: "liner-back",
        label: "Soft cotton T-shirt liner",
        source: "t-shirt",
        primitive: "box",
        params: { width: 8.2, height: 16.8, depth: 0.22 },
        transform: { position: [16.0, 0.15, 8.4], rotation: [-90, 0, 0] },
        material: cottonLiner,
      },
      {
        id: "liner-front",
        label: "Soft cotton T-shirt liner",
        source: "t-shirt",
        primitive: "box",
        params: { width: 8.2, height: 16.8, depth: 0.22 },
        transform: { position: [24.2, 0.15, 8.4], rotation: [-90, 0, 0] },
        material: cottonLiner,
      },
    ],
  },
  steps: [
    {
      title: "Cut panels and glue the cotton liner flat",
      text: "Cut an 18 × 18 cm rectangle from a clean, flat section of old jeans leg and a slightly smaller 16.5 × 17 cm rectangle from a soft cotton T-shirt. Centre the cotton lining on the inside face of the denim and tack the perimeter down with thin dots of hot glue so lenses never rub against rough twill.",
      tip: "Keep glue beads thin and flat near the edges so no hard bumps press against your lenses.",
      ops: [
        { type: "attach", target: "liner-back", parent: "denim-back", transform: { position: [0.3, 0.7, 0.29] }, duration: 0.8 },
        { type: "attach", target: "liner-front", parent: "denim-front", transform: { position: [-0.3, 0.7, 0.29] }, duration: 0.8 },
      ],
      camera: { position: [6, 30, 26], target: [0, 0.5, 0] },
    },
    {
      title: "Fold the lined fabric in half lengthwise",
      text: "Fold the denim in half with the soft cotton T-shirt liner facing inward to form a padded 9 × 18 cm sleeve. Crease the folded spine firmly with your fingers or the flat edge of a ruler.",
      ops: [
        { type: "transform", target: "denim-front", position: [0, 0, 1.6], rotation: [0, -180, 0], pivot: [-4.5, 9, 0], duration: 1.1 },
        {
          type: "add",
          object: {
            id: "fold-spine",
            parent: "denim-back",
            source: "jeans",
            primitive: "box",
            params: { width: 0.42, height: 18.0, depth: 1.85 },
            transform: { position: [4.45, 0, 0.8] },
            material: denim,
          },
        },
      ],
      camera: { position: [14, 24, 24], target: [-3, 1, 0] },
    },
    {
      title: "Seal the bottom and open side with hot glue",
      text: "Run a steady, narrow line of hot glue along the inside of the bottom edge and the open long side edge, leaving the top mouth completely open. Press the denim layers together carefully using a ruler edge until cool.",
      warning: "Hot glue can soak slightly through knit fabric—press the seam closed with a ruler or wooden scrap rather than bare fingertips.",
      ops: [
        {
          type: "add",
          object: {
            id: "seam-bottom",
            parent: "denim-back",
            primitive: "box",
            params: { width: 9.0, height: 0.5, depth: 1.85 },
            transform: { position: [0, 0, 0.8] },
            material: denimSeam,
          },
        },
        {
          type: "add",
          object: {
            id: "seam-side",
            parent: "denim-back",
            primitive: "box",
            params: { width: 0.5, height: 18.0, depth: 1.85 },
            transform: { position: [-4.4, 0, 0.8] },
            material: denimSeam,
          },
        },
        {
          type: "add",
          object: {
            id: "stitch-accent",
            parent: "denim-back",
            primitive: "box",
            params: { width: 0.14, height: 17.2, depth: 0.08 },
            transform: { position: [-3.9, 0.4, 1.81] },
            material: { preset: "cardboard", color: "#d6a456" },
          },
        },
      ],
      camera: { position: [12, 22, 22], target: [-4, 1, 0] },
    },
    {
      title: "Check the fit with a pair of glasses",
      text: "Once all glue seams are completely cool, trim any loose denim threads along the top opening and slide your folded glasses into the cotton-lined sleeve to confirm a snug, easy-to-pull fit.",
      ops: [
        { type: "transform", target: "denim-back", position: [0, 0, -0.8], rotation: [0, 0, 0], arc: 3.5, duration: 1.0 },
        {
          type: "add",
          object: {
            id: "glasses-bridge",
            label: "Eyeglasses",
            parent: "denim-back",
            primitive: "box",
            params: { width: 1.2, height: 0.35, depth: 0.35 },
            transform: { position: [0, 19.6, 0.8] },
            material: glassesFrame,
          },
        },
        {
          type: "add",
          object: {
            id: "glasses-lens-left",
            parent: "denim-back",
            primitive: "box",
            params: { width: 3.1, height: 3.4, depth: 0.25 },
            transform: { position: [-2.0, 17.4, 0.8] },
            material: { preset: "glass", color: "#d7e6ec" },
          },
        },
        {
          type: "add",
          object: {
            id: "glasses-lens-right",
            parent: "denim-back",
            primitive: "box",
            params: { width: 3.1, height: 3.4, depth: 0.25 },
            transform: { position: [2.0, 17.4, 0.8] },
            material: { preset: "glass", color: "#d7e6ec" },
          },
        },
        {
          type: "add",
          object: {
            id: "glasses-rim-top-l",
            parent: "denim-back",
            primitive: "box",
            params: { width: 3.3, height: 0.35, depth: 0.35 },
            transform: { position: [-2.0, 20.6, 0.8] },
            material: glassesFrame,
          },
        },
        {
          type: "add",
          object: {
            id: "glasses-rim-top-r",
            parent: "denim-back",
            primitive: "box",
            params: { width: 3.3, height: 0.35, depth: 0.35 },
            transform: { position: [2.0, 20.6, 0.8] },
            material: glassesFrame,
          },
        },
      ],
      camera: { position: [16, 18, 28], target: [0, 10.5, 0] },
    },
  ],
});
