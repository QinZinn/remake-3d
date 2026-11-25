import { defineProject, type SceneOpInput } from "@/lib/scene/schema";

function circle2D(r: number, segs = 14): [number, number][] {
  return Array.from({ length: segs }, (_, i) => {
    const a = (i / segs) * Math.PI * 2;
    return [Number((r * Math.cos(a)).toFixed(3)), Number((r * Math.sin(a)).toFixed(3))];
  });
}

function hex2D(r: number): [number, number][] {
  return Array.from({ length: 6 }, (_, i) => {
    const a = (i / 6) * Math.PI * 2;
    return [Number((r * Math.cos(a)).toFixed(3)), Number((r * Math.sin(a)).toFixed(3))];
  });
}

const washerOuter = circle2D(0.86, 16);
const washerHole = circle2D(0.4, 12);
const nutOuter = hex2D(0.84);
const nutHole = circle2D(0.4, 12);

const steelFastener = { preset: "aluminium", color: "#cfd6de" } as const;
const brassFastener = { preset: "aluminium", color: "#e0be6e" } as const;
const zincFastener = { preset: "aluminium", color: "#bcc4ce" } as const;

/** Recognizable wood screws tumbled near the top of the left jar. */
const screwCluster: SceneOpInput[] = [
  [-1.2, 5.2, 0.8, 72, 24, 18],
  [0.9, 5.4, 0.5, 65, -40, 10],
  [-0.2, 5.5, -1.1, 80, 115, -14],
  [1.4, 5.1, -0.7, 75, -125, 22],
  [-0.8, 5.6, -0.1, 58, 60, -20],
].map(([x, y, z, rx, ry, rz], i): SceneOpInput => ({
  type: "add",
  duration: 0.08,
  object: {
    id: `screw-${i + 1}`,
    parent: "jar-left",
    primitive: "solid",
    params: {
      points: [
        [0.05, 0],
        [0.2, 1.5],
        [0.2, 2.05],
        [0.48, 2.15],
        [0.48, 2.38],
      ],
    },
    transform: { position: [x, y, z], rotation: [rx, ry, rz] },
    material: steelFastener,
  },
}));

/** Recognizable brass washers jumbled inside the center jar. */
const washerCluster: SceneOpInput[] = [
  [-1.1, 4.75, 0.7, 78, 12, 24],
  [0.85, 4.85, 0.9, 64, -22, -16],
  [0.1, 5.0, -0.95, 86, 35, 10],
  [-0.95, 4.95, -0.85, 70, -45, 28],
  [1.3, 4.65, -0.45, 82, 18, -32],
  [-0.1, 5.15, 0.25, 74, 0, 15],
].map(([x, y, z, rx, ry, rz], i): SceneOpInput => ({
  type: "add",
  duration: 0.08,
  object: {
    id: `washer-${i + 1}`,
    parent: "jar-center",
    primitive: "extrude",
    params: { points: washerOuter, holes: [washerHole], depth: 0.2, bevel: 0.03 },
    transform: { position: [x, y, z], rotation: [rx, ry, rz] },
    material: brassFastener,
  },
}));

/** Recognizable steel hex nuts tumbled inside the right jar. */
const nutCluster: SceneOpInput[] = [
  [-1.15, 5.2, 0.65, 72, 20, 14],
  [1.05, 5.3, 0.75, 55, -30, 22],
  [0.05, 5.45, -0.95, 85, 15, -18],
  [-1.0, 5.35, -0.7, 68, -42, 30],
  [1.15, 5.15, -0.55, 78, 36, -12],
  [0.0, 5.55, 0.2, 62, 8, 25],
].map(([x, y, z, rx, ry, rz], i): SceneOpInput => ({
  type: "add",
  duration: 0.08,
  object: {
    id: `nut-${i + 1}`,
    parent: "jar-right",
    primitive: "extrude",
    params: { points: nutOuter, holes: [nutHole], depth: 0.52, bevel: 0.05 },
    transform: { position: [x, y, z], rotation: [rx, ry, rz] },
    material: zincFastener,
  },
}));

function labelBandOps(jarId: string, suffix: string): SceneOpInput[] {
  return [
    {
      type: "add",
      duration: 0.28,
      object: {
        id: `band-${suffix}`,
        label: "Cardboard label band",
        source: "cardboard",
        parent: jarId,
        primitive: "sleeve",
        params: { height: 2.0, radius: 3.65 },
        transform: { position: [0, 1.4, 0] },
        material: { preset: "cardboard", color: "#cfa97a" },
      },
    },
    // Front cream write-on tag + crisp marker stroke so labels read clearly.
    {
      type: "add",
      duration: 0.14,
      object: {
        id: `tag-${suffix}`,
        parent: jarId,
        primitive: "box",
        params: { width: 2.9, height: 1.25, depth: 0.06 },
        transform: { position: [0, 1.78, 3.67] },
        material: { preset: "cardboard", color: "#f6f0e1" },
      },
    },
    {
      type: "add",
      duration: 0.1,
      object: {
        id: `mark-${suffix}`,
        parent: jarId,
        primitive: "box",
        params: { width: 1.9, height: 0.18, depth: 0.04 },
        transform: { position: [0, 2.32, 3.71] },
        material: { preset: "paint", color: "#2b3238" },
      },
    },
  ];
}

/**
 * Glass jar hardware sorter.
 * Repurposes three intact food jars with screw lids into a colour-coded,
 * clearly labelled bench organizer without cutting, drilling, or heating glass.
 */
export default defineProject({
  slug: "glass-jar-hardware-sorter",
  title: "Colour-coded glass jar hardware sorter",
  summary:
    "Turn three intact glass food jars and a scrap of cardboard into a tidy workbench sorter for screws, washers, and nuts—with painted lids for top-down identification and slim cardboard label bands that leave the glass clear.",
  difficulty: "easy",
  timeMinutes: 25,
  materials: [
    { id: "glass-jar", qty: 3, unit: "250–350 ml intact jars with screw lids" },
    { id: "cardboard", qty: 1, unit: "scrap piece for three 2 cm label bands" },
    { id: "hot-glue-stick", qty: 1 },
    { id: "acrylic-paint", qty: 1, unit: "accent colours for lids", optional: true },
  ],
  tools: [
    { id: "scissors" },
    { id: "marker" },
    { id: "hot-glue-gun" },
    { id: "ruler-tape", optional: true },
    { id: "paintbrush", optional: true },
  ],
  wasteDiverted: [
    { materialId: "glass-jar", grams: 540 },
    { materialId: "cardboard", grams: 12 },
  ],
  sources: [
    {
      title: "DIY Desk Organizer",
      publisher: "Museum of Craft and Design",
      url: "https://sfmcd.org/project/diy-desk-organizer/",
      license: "Publisher copyright (reference only)",
      note: "Reference for using clean discarded glass jars and cans to sort small everyday items.",
    },
  ],
  camera: { position: [0, 15, 42], target: [0, 5.5, 0] },
  scene: {
    objects: [
      {
        id: "jar-left",
        label: "Glass jar 1",
        source: "glass-jar",
        primitive: "jar",
        params: { height: 11, radius: 3.6, mouthRadius: 2.9, shoulderHeight: 1.4, threadHeight: 1.0 },
        transform: { position: [-9.0, 0, 0] },
        material: { preset: "glass" },
      },
      {
        id: "lid-left",
        label: "Jar lid 1",
        parent: "jar-left",
        primitive: "cap",
        params: { height: 1.3, radius: 3.1 },
        transform: { position: [0, 9.9, 0] },
        material: { preset: "aluminium", color: "#cfd3d9" },
      },
      {
        id: "label-left",
        label: "Old paper label",
        parent: "jar-left",
        primitive: "sleeve",
        params: { height: 5.4, radius: 3.65 },
        transform: { position: [0, 2.2, 0] },
        material: { preset: "cardboard", color: "#d6c8a8" },
      },
      {
        id: "jar-center",
        label: "Glass jar 2",
        source: "glass-jar",
        primitive: "jar",
        params: { height: 11, radius: 3.6, mouthRadius: 2.9, shoulderHeight: 1.4, threadHeight: 1.0 },
        transform: { position: [0, 0, 0] },
        material: { preset: "glass" },
      },
      {
        id: "lid-center",
        label: "Jar lid 2",
        parent: "jar-center",
        primitive: "cap",
        params: { height: 1.3, radius: 3.1 },
        transform: { position: [0, 9.9, 0] },
        material: { preset: "aluminium", color: "#cfd3d9" },
      },
      {
        id: "label-center",
        label: "Old paper label",
        parent: "jar-center",
        primitive: "sleeve",
        params: { height: 5.4, radius: 3.65 },
        transform: { position: [0, 2.2, 0] },
        material: { preset: "cardboard", color: "#c79a6b" },
      },
      {
        id: "jar-right",
        label: "Glass jar 3",
        source: "glass-jar",
        primitive: "jar",
        params: { height: 11, radius: 3.6, mouthRadius: 2.9, shoulderHeight: 1.4, threadHeight: 1.0 },
        transform: { position: [9.0, 0, 0] },
        material: { preset: "glass" },
      },
      {
        id: "lid-right",
        label: "Jar lid 3",
        parent: "jar-right",
        primitive: "cap",
        params: { height: 1.3, radius: 3.1 },
        transform: { position: [0, 9.9, 0] },
        material: { preset: "aluminium", color: "#cfd3d9" },
      },
      {
        id: "label-right",
        label: "Old paper label",
        parent: "jar-right",
        primitive: "sleeve",
        params: { height: 5.4, radius: 3.65 },
        transform: { position: [0, 2.2, 0] },
        material: { preset: "cardboard", color: "#9eb39b" },
      },
    ],
  },
  steps: [
    {
      title: "Wash the jars and strip old labels",
      text: "Wash three clean, intact glass jars and their screw lids in warm soapy water, soak off the original paper labels, and let every jar air-dry completely inside so metal fasteners will not rust. Check each jar for chips or cracks before you begin.",
      tip: "Rubbing a little baking soda and cooking oil over sticky glue residue lifts it cleanly before a final soapy rinse.",
      warning: "Use only intact, uncracked glass jars. Never cut, drill, score, or apply flame to the glass.",
      ops: [
        { type: "remove", target: "label-left", away: [-6, 0, 12], duration: 0.6 },
        { type: "remove", target: "label-center", away: [0, 0, 14], duration: 0.6 },
        { type: "remove", target: "label-right", away: [6, 0, 12], duration: 0.6 },
      ],
      camera: { position: [0, 15, 42], target: [0, 5.5, 0] },
    },
    {
      title: "Colour-code the lids (optional)",
      text: "Brush a thin coat of acrylic paint onto the top outside surface of each clean, dry lid—using a different colour per hardware type so you can identify jars from above in a drawer or toolbox. Leave the inside threads bare so the lids still screw smoothly.",
      tip: "Skip painting if you prefer bare metal lids and rely on the front cardboard label bands instead.",
      ops: [
        { type: "paint", target: "lid-left", color: "#3b7a78", preset: "paint", duration: 0.55 },
        { type: "paint", target: "lid-center", color: "#d19334", preset: "paint", duration: 0.55 },
        { type: "paint", target: "lid-right", color: "#be543c", preset: "paint", duration: 0.55 },
      ],
      camera: { position: [12, 24, 30], target: [0, 8.5, 0] },
    },
    {
      title: "Cut and wrap cardboard label bands",
      text: "Cut three slim 2 cm strips from scrap cardboard with scissors (measuring with a ruler if you want them uniform), write the fastener size on each band with a permanent marker, wrap each strip snugly around the lower body of a jar, and hot-glue only the overlapping cardboard ends together.",
      tip: "Gluing cardboard-to-cardboard creates a snug, removable collar and keeps hot glue off the glass surface.",
      ops: [...labelBandOps("jar-left", "left"), ...labelBandOps("jar-center", "center"), ...labelBandOps("jar-right", "right")],
      camera: { position: [4, 10, 34], target: [0, 4.5, 0] },
    },
    {
      title: "Open the jars and sort your hardware",
      text: "Unscrew the dry lids and set them upside down on the bench behind each jar. Pour one category of small hardware—such as wood screws, brass washers, and hex nuts—into each jar so fasteners are easy to inspect through the clear glass.",
      ops: [
        // Set lids resting upside-down on the workbench (y = 1.3 with rotation X = 180 places lid top flush at y = 0).
        { type: "transform", target: "lid-left", position: [0, 1.3, -8.2], rotation: [180, 0, 0], arc: 5.5, duration: 0.55 },
        { type: "transform", target: "lid-center", position: [0, 1.3, -8.2], rotation: [180, 0, 0], arc: 5.5, duration: 0.55 },
        { type: "transform", target: "lid-right", position: [0, 1.3, -8.2], rotation: [180, 0, 0], arc: 5.5, duration: 0.55 },
        // Bright brushed-metal hardware fill + recognizable 3D screws, brass washers and hex nuts on top.
        { type: "fill", target: "jar-left", id: "hardware-left", level: 0.46, inset: 0.9, material: { preset: "paint", color: "#9da6b0" }, duration: 0.6 },
        ...screwCluster,
        { type: "fill", target: "jar-center", id: "hardware-center", level: 0.42, inset: 0.9, material: { preset: "paint", color: "#c5a15a" }, duration: 0.6 },
        ...washerCluster,
        { type: "fill", target: "jar-right", id: "hardware-right", level: 0.46, inset: 0.9, material: { preset: "paint", color: "#8c95a0" }, duration: 0.6 },
        ...nutCluster,
      ],
      camera: { position: [12, 24, 34], target: [0, 5.0, -2.0] },
    },
    {
      title: "Reseal and group on the workbench",
      text: "Screw each colour-coded lid back onto its matching jar until finger-tight, then line the jars up together on a shelf or workbench with the marked label bands facing forward.",
      ops: [
        { type: "transform", target: "lid-left", position: [0, 9.9, 0], rotation: [0, 0, 0], arc: 5, duration: 0.55 },
        { type: "transform", target: "lid-center", position: [0, 9.9, 0], rotation: [0, 0, 0], arc: 5, duration: 0.55 },
        { type: "transform", target: "lid-right", position: [0, 9.9, 0], rotation: [0, 0, 0], arc: 5, duration: 0.55 },
        { type: "transform", target: "jar-left", position: [-7.9, 0, 0], duration: 0.5 },
        { type: "transform", target: "jar-right", position: [7.9, 0, 0], duration: 0.5 },
      ],
      camera: { position: [-14, 15, 36], target: [0, 5.5, 0] },
    },
  ],
});
