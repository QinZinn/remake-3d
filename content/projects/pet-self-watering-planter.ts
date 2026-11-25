import { defineProject, type SceneOpInput } from "@/lib/scene/schema";

/** Soft botanical herb leaf outline (base at origin, tip at +Y). */
const basilLeaf: [number, number][] = [
  [0, 0],
  [1.05, 0.9],
  [1.45, 2.3],
  [0.9, 3.8],
  [0, 4.5],
  [-0.9, 3.8],
  [-1.45, 2.3],
  [-1.05, 0.9],
];

const herbLeaves: SceneOpInput[] = [
  {
    type: "add",
    duration: 0.25,
    object: {
      id: "seedling.stem.main",
      label: "Herb stem",
      primitive: "tube",
      params: {
        // World-space coordinates emerging from the soil surface at y ≈ 17.8 cm.
        points: [
          [0, 17.2, 0],
          [0.12, 20.6, 0.08],
          [-0.08, 23.8, 0.12],
          [0.04, 26.2, 0.06],
        ],
        radius: 0.22,
      },
      material: { preset: "paint", color: "#3d7a42" },
    },
  },
  {
    type: "add",
    duration: 0.22,
    object: {
      id: "seedling.stem.side",
      primitive: "tube",
      params: {
        points: [
          [0.04, 19.6, 0.05],
          [-0.9, 21.8, 0.45],
          [-1.7, 23.4, 0.7],
        ],
        radius: 0.16,
      },
      material: { preset: "paint", color: "#458449" },
    },
  },
  // Lush paired basil leaves fanning gently outward and upward in world space.
  {
    type: "add",
    duration: 0.2,
    object: {
      id: "seedling.leaf.1",
      primitive: "extrude",
      params: { points: basilLeaf, depth: 0.14, bevel: 0.04, curve: true },
      transform: { position: [0.1, 21.4, 0.1], rotation: [52, 25, -42] },
      material: { preset: "paint", color: "#488f4c" },
    },
  },
  {
    type: "add",
    duration: 0.2,
    object: {
      id: "seedling.leaf.2",
      primitive: "extrude",
      params: { points: basilLeaf, depth: 0.14, bevel: 0.04, curve: true },
      transform: { position: [-0.08, 21.6, 0.1], rotation: [50, -30, 46] },
      material: { preset: "paint", color: "#3f8444" },
    },
  },
  {
    type: "add",
    duration: 0.2,
    object: {
      id: "seedling.leaf.3",
      primitive: "extrude",
      params: { points: basilLeaf, depth: 0.14, bevel: 0.04, curve: true },
      transform: { position: [0.02, 24.4, 0.12], rotation: [42, 65, -28], scale: [0.85, 0.85, 1] },
      material: { preset: "paint", color: "#58a358" },
    },
  },
  {
    type: "add",
    duration: 0.2,
    object: {
      id: "seedling.leaf.4",
      primitive: "extrude",
      params: { points: basilLeaf, depth: 0.14, bevel: 0.04, curve: true },
      transform: { position: [-0.04, 24.6, 0.08], rotation: [-46, -55, 30], scale: [0.8, 0.8, 1] },
      material: { preset: "paint", color: "#62ae5e" },
    },
  },
  {
    type: "add",
    duration: 0.2,
    object: {
      id: "seedling.leaf.5",
      primitive: "extrude",
      params: { points: basilLeaf, depth: 0.14, bevel: 0.04, curve: true },
      transform: { position: [-1.65, 23.3, 0.68], rotation: [48, -12, 54], scale: [0.78, 0.78, 1] },
      material: { preset: "paint", color: "#509853" },
    },
  },
  {
    type: "add",
    duration: 0.2,
    object: {
      id: "seedling.leaf.6",
      primitive: "extrude",
      params: { points: basilLeaf, depth: 0.14, bevel: 0.04, curve: true },
      transform: { position: [0.04, 26.0, 0.06], rotation: [32, 12, -14], scale: [0.64, 0.64, 1] },
      material: { preset: "paint", color: "#6cb866" },
    },
  },
];

/**
 * Hero project: a self-watering planter from one PET bottle.
 * Steps are written in our own words; sources are listed for credit and
 * further reading, not copied.
 */
export default defineProject({
  slug: "pet-self-watering-planter",
  title: "Self-watering planter from a PET bottle",
  summary:
    "Turn one empty drinks bottle into a two-part planter: the top half holds soil upside down, the bottom half is a water reservoir, and a cotton wick keeps the soil moist for days.",
  difficulty: "easy",
  timeMinutes: 20,
  materials: [
    { id: "pet-bottle", qty: 1, unit: "1.5–2 L bottle" },
    { id: "t-shirt", qty: 1, unit: "strip, about 2 × 25 cm (the wick)" },
    { id: "potting-soil", qty: 1, unit: "cup" },
    { id: "plant-seedling", qty: 1 },
    { id: "acrylic-paint", qty: 1, optional: true },
  ],
  tools: [
    { id: "utility-knife" },
    { id: "scissors" },
    { id: "marker" },
    { id: "ruler-tape", optional: true },
    { id: "sandpaper", optional: true },
    { id: "paintbrush", optional: true },
  ],
  wasteDiverted: [
    { materialId: "pet-bottle", grams: 40 },
    { materialId: "t-shirt", grams: 10 },
  ],
  sources: [
    {
      title: "From Trash to Terrarium",
      publisher: "NOAA Marine Debris Program",
      url: "https://marinedebris.noaa.gov/trash-terrarium",
      license: "Public domain (U.S. Government work)",
      note: "Bottle-and-string wick planter; basis for the cut height and wick idea.",
    },
    {
      title: "What You Can Do to Reduce Plastic Waste",
      publisher: "U.S. Environmental Protection Agency",
      url: "https://www.epa.gov/plastics/what-you-can-do-reduce-plastic-waste",
      license: "Public domain (U.S. Government work)",
      note: "Why reusing and repurposing bottles prevents plastic waste.",
    },
    {
      title: "Self-Watering Planter System Made From 2L Coke Bottle",
      publisher: "Instructables",
      url: "https://www.instructables.com/Self-Watering-Planter-System-Made-From-2L-Coke-Bot/",
      license: "CC BY-NC-SA 4.0 (as shown on the page); linked for reference only, no text or images copied",
      note: "By natdragon5000 on Instructables.",
    },
  ],
  camera: { position: [34, 28, 52], target: [0, 15, 0] },
  scene: {
    objects: [
      {
        id: "bottle",
        label: "PET bottle",
        source: "pet-bottle",
        primitive: "bottle",
        params: { height: 30, radius: 5, neckRadius: 1.4, neckHeight: 2.6, shoulderHeight: 8, ribs: 2 },
        material: { preset: "pet" },
      },
      {
        id: "cap",
        label: "Bottle cap",
        source: "bottle-cap",
        primitive: "cap",
        params: { height: 1.4, radius: 1.75 },
        transform: { position: [0, 28.85, 0] },
        material: { preset: "plastic", color: "#2f7de1" },
      },
      {
        id: "label",
        label: "Label",
        primitive: "sleeve",
        params: { height: 7.2, radius: 5.06 },
        transform: { position: [0, 7.8, 0] },
        material: { preset: "paint", color: "#d1493b" },
      },
      {
        id: "label.stripe",
        parent: "label",
        primitive: "sleeve",
        params: { height: 1.5, radius: 5.09 },
        transform: { position: [0, 2.8, 0] },
        material: { preset: "paint", color: "#f6efe2" },
      },
    ],
  },
  steps: [
    {
      title: "Empty, rinse and strip the bottle",
      text: "Pour out any leftover drink, rinse the bottle with warm water and shake it dry. Unscrew the cap and peel off the label so light can reach the roots and you can see the water level later.",
      tip: "Soak a stubborn label in warm soapy water for a few minutes and it slides off.",
      ops: [
        { type: "remove", target: "cap", away: [12, 10, 0] },
        { type: "remove", target: "label", away: [-20, 0, 6] },
      ],
    },
    {
      title: "Mark the cut line",
      text: "Measure about one third down from the top of the bottle, just below where the shoulder starts to narrow, and draw a line all the way around with a marker. The top piece becomes the pot, the bottom piece the water tank.",
      tip: "Hold the marker still on a book of the right height and turn the bottle against it for a perfectly level line.",
      ops: [
        {
          type: "add",
          duration: 0.55,
          object: {
            id: "cut-guide",
            label: "Marker guide line",
            primitive: "sleeve",
            params: { height: 0.24, radius: 5.05 },
            transform: { position: [0, 18.88, 0] },
            material: { preset: "paint", color: "#22292f" },
          },
        },
      ],
      camera: { position: [26, 25, 44], target: [0, 18, 0] },
    },
    {
      title: "Cut the bottle in two",
      text: "Push the tip of the utility knife through the line to start a slot, then finish the cut around the bottle with scissors, following your mark.",
      warning: "Cut away from your hand and keep fingers clear of the blade. Children should leave the cutting to an adult.",
      ops: [
        { type: "remove", target: "cut-guide", away: [0, 0, 0], duration: 0.15 },
        { type: "cut", target: "bottle", y: 19, gap: 2.6 },
      ],
      camera: { position: [30, 28, 52], target: [0, 17, 0] },
    },
    {
      title: "Smooth the cut edges",
      text: "Run a piece of sandpaper along both cut rims, or trim off any jagged bits with scissors, so the edges will not scratch your hands when you lift the pot out to refill the tank.",
      ops: [],
      camera: { position: [22, 24, 34], target: [0, 19.5, 0] },
    },
    {
      title: "Prepare the wick",
      text: "Cut a strip of old cotton T-shirt about two centimetres wide and twenty-five long. Wet it, then feed it through the neck of the top piece so several centimetres sit inside the pot and the rest hangs out of the mouth.",
      tip: "Cotton wicks water well; synthetic fabric barely does. Pre-wetting the strip gets the flow started.",
      ops: [
        {
          type: "thread",
          target: "bottle.top",
          id: "wick",
          // In the top piece's own frame (the bottle's original coordinates): from inside the pot, out through the neck.
          path: [
            [0.8, 21.5, 0.3],
            [0.4, 24.5, 0],
            [0, 27.5, 0],
            [0, 30, 0],
            [0, 32.8, 0.25],
            [0.35, 35.8, 0.65],
          ],
          radius: 0.4,
          material: { preset: "fabric", color: "#ede5d4" },
        },
      ],
      camera: { position: [24, 36, 42], target: [0, 26, 0] },
    },
    {
      title: "Turn the top upside down into the tank",
      text: "Flip the top piece over and sit it in the bottom piece, neck down, so the wick hangs into the tank. The shoulder of the bottle rests on the rim and holds the pot in place.",
      ops: [{ type: "transform", target: "bottle.top", position: [0, 38.6, 0], rotation: [180, 0, 0], arc: 9 }],
      camera: { position: [32, 26, 50], target: [0, 14, 0] },
    },
    {
      title: "Paint the water tank (optional)",
      text: "Lift the pot out and paint or wrap a decorative opaque band around the water reservoir, leaving a peek of clear plastic at the rim and base so you can still check the water level while blocking algae growth.",
      ops: [
        {
          type: "add",
          duration: 0.85,
          object: {
            id: "tank.wrap",
            label: "Painted tank sleeve",
            parent: "bottle.bottom",
            primitive: "sleeve",
            params: { height: 11.4, radius: 5.06 },
            transform: { position: [0, 2.2, 0] },
            material: { preset: "paint", color: "#4d7a5d" },
          },
        },
        {
          type: "add",
          duration: 0.45,
          object: {
            id: "tank.trim",
            parent: "tank.wrap",
            primitive: "sleeve",
            params: { height: 0.65, radius: 5.09 },
            transform: { position: [0, 10.75, 0] },
            material: { preset: "paint", color: "#ece4d4" },
          },
        },
      ],
      camera: { position: [28, 22, 46], target: [0, 11.5, 0] },
    },
    {
      title: "Add water and soil",
      text: "Lift the pot out, fill the tank about a third full of water, and put the pot back so the wick dips into it. Fill the pot with potting soil, pressing it gently around the wick.",
      tip: "Keep the water level below the bottle neck so the soil never sits in water.",
      ops: [
        { type: "transform", target: "bottle.top", position: [12.5, 45, 0], arc: 9, duration: 0.9 },
        { type: "fill", target: "bottle.bottom", id: "water", level: 0.34, material: { preset: "water", color: "#6ec0e6" }, duration: 1.1 },
        { type: "transform", target: "bottle.top", position: [0, 38.6, 0], arc: 9, duration: 0.9 },
        { type: "fill", target: "bottle.top", id: "soil", level: 0.84, material: { preset: "soil", color: "#4d3627" }, duration: 1.1 },
      ],
      camera: { position: [16, 48, 42], target: [3, 12, 0] },
    },
    {
      title: "Plant and place",
      text: "Plant your seedling or sow a few seeds, water the soil once from the top to settle it, and put the planter somewhere bright. Top up the tank whenever the level drops; the wick does the rest.",
      tip: "Herbs such as basil and mint are easy first plants for this planter.",
      ops: herbLeaves,
      camera: { position: [28, 28, 46], target: [0, 15.5, 0] },
    },
  ],
});
