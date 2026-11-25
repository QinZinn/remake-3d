import { defineProject, type SceneOpInput } from "@/lib/scene/schema";

/** Build `add` ops for a ring of bottle caps arranged around the circular cardboard base. */
function capRingOps(prefix: string, count: number, ringRadius: number, colors: readonly string[]): SceneOpInput[] {
  const ops: SceneOpInput[] = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const x = Number((ringRadius * Math.cos(angle)).toFixed(2));
    const z = Number((ringRadius * Math.sin(angle)).toFixed(2));
    ops.push({
      type: "add",
      duration: 0.24,
      object: {
        id: `${prefix}-${i + 1}`,
        label: "Bottle cap",
        source: "bottle-cap",
        parent: "base",
        primitive: "cap",
        params: { height: 1.2, radius: 1.55 },
        transform: { position: [x, 0.5, z] },
        material: { preset: "plastic", color: colors[i % colors.length] },
      },
    });
  }
  return ops;
}

/**
 * Bottle cap sunburst mosaic medallion.
 * Arranges 19 clean plastic bottle caps in concentric rings on a circular
 * corrugated cardboard backing with an optional painted background and hanging loop.
 */
export default defineProject({
  slug: "bottle-cap-mosaic",
  title: "Bottle cap sunburst mosaic medallion",
  summary:
    "Sort nineteen clean plastic bottle caps by colour and glue them in concentric rings onto a circular scrap of corrugated cardboard to make a bright wall medallion.",
  difficulty: "easy",
  timeMinutes: 30,
  materials: [
    { id: "bottle-cap", qty: 19, unit: "clean plastic caps in 3–4 colours" },
    { id: "cardboard", qty: 1, unit: "21 cm circular disc from a shipping box" },
    { id: "hot-glue-stick", qty: 1 },
    { id: "acrylic-paint", qty: 1, unit: "background coat for cardboard disc", optional: true },
    { id: "cotton-string", qty: 1, unit: "15 cm loop for hanging", optional: true },
  ],
  tools: [
    { id: "hot-glue-gun" },
    { id: "scissors" },
    { id: "marker" },
    { id: "utility-knife", optional: true },
    { id: "ruler-tape", optional: true },
    { id: "paintbrush", optional: true },
  ],
  // 19 caps (~2 g each = 38 g) plus the retained 21 cm corrugated cardboard disc (~22 g); offcuts and consumables excluded.
  wasteDiverted: [
    { materialId: "bottle-cap", grams: 38 },
    { materialId: "cardboard", grams: 22 },
  ],
  sources: [
    {
      title: "Bottle cap mosaic Art & Craft",
      publisher: "World Scouting",
      url: "https://sdgs.scout.org/activity-type/bottle-cap-mosaic-art-craft",
      license: "Publisher copyright (reference only)",
      note: "Reference for making mosaic wall art with collected bottle caps, reused cardboard, and glue.",
    },
  ],
  camera: { position: [18, 22, 24], target: [0, 0.5, 0] },
  scene: {
    objects: [
      {
        id: "base",
        label: "Circular cardboard base",
        source: "cardboard",
        primitive: "solid",
        params: {
          points: [
            [10.5, 0],
            [10.5, 0.5],
          ],
        },
        material: { preset: "cardboard", color: "#b98a57" },
      },
    ],
  },
  steps: [
    {
      title: "Cut and prime the circular cardboard base",
      text: "Trace a 21 cm circle on a flat piece of scrap corrugated cardboard using a plate or ruler and marker, then cut out the disc cleanly with scissors or a utility knife. Optionally paint the front face a dark colour with acrylic paint and a paintbrush so bright bottle caps pop.",
      warning: "When using a utility knife on thick cardboard, cut on a scrap board with the blade angled away from your fingers.",
      ops: [{ type: "paint", target: "base", color: "#2f3a44", preset: "paint" }],
      camera: { position: [18, 22, 24], target: [0, 0.5, 0] },
    },
    {
      title: "Dry-fit the centre and inner petal ring",
      text: "Wash and dry nineteen bottle caps and group them by colour. Place one contrasting cap in the centre of the disc and arrange six matching caps evenly around it open-side down so you can adjust spacing before gluing.",
      tip: "Placing caps open-side down hides inner markings and gives a clean circular rim for hot glue to grip.",
      ops: [
        {
          type: "add",
          object: {
            id: "cap-center",
            label: "Centre bottle cap",
            source: "bottle-cap",
            parent: "base",
            primitive: "cap",
            params: { height: 1.2, radius: 1.55 },
            transform: { position: [0, 0.5, 0] },
            material: { preset: "plastic", color: "#e5b83b" },
          },
        },
        ...capRingOps("cap-in", 6, 3.6, ["#df643b"]),
      ],
      camera: { position: [0, 28, 12], target: [0, 0.5, 0] },
    },
    {
      title: "Lay out and glue the outer ring",
      text: "Arrange twelve caps in an alternating two-colour ring around the inner petals, leaving an even border inside the cardboard edge. Lift each cap one at a time, glue its open rim, and press it onto the disc. Secure the centre and inner ring the same way.",
      warning: "Keep fingertips away from hot melted glue and rest the glue gun on its stand between caps.",
      ops: capRingOps("cap-out", 12, 7.4, ["#2f7de1", "#2d9b83"]),
      camera: { position: [0, 34, 14], target: [0, 0.5, 0] },
    },
    {
      title: "Add a hanging loop (optional)",
      text: "Cut a 15 cm piece of cotton string with scissors, fold it into a loop, and hot-glue both ends neatly to the back top edge of the cardboard disc so the medallion can hang on a hook or peg.",
      tip: "Press a small scrap of leftover cardboard over the glued string ends on the back to reinforce the hanger.",
      ops: [
        {
          type: "thread",
          target: "base",
          id: "hanging-loop",
          path: [
            [-1.6, 0.25, -9.8],
            [-1.3, 0.25, -12.6],
            [0, 0.25, -14.2],
            [1.3, 0.25, -12.6],
            [1.6, 0.25, -9.8],
          ],
          radius: 0.2,
          material: { preset: "fabric", color: "#e5dcc8" },
        },
      ],
      camera: { position: [14, 18, -24], target: [0, 0.5, -9] },
    },
    {
      title: "Let set and display",
      text: "Give all glue joints a couple of minutes to cool completely, pull away any thin glue threads, and stand or hang your bottle cap medallion indoors away from moisture.",
      ops: [{ type: "transform", target: "base", position: [0, 10.2, 0], rotation: [75, 0, 0], arc: 2 }],
      camera: { position: [12, 16, 44], target: [0, 12.2, 0] },
    },
  ],
});
