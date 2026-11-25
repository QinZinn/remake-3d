import { defineProject, type Vec3 } from "@/lib/scene/schema";

/** Build a smooth helical cord path hugging the outside of the can. */
function coilPath(radius: number, yStart: number, yEnd: number, turns: number): Vec3[] {
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
 * Steel food can pencil cup.
 * Uses an already smooth-edged clean food can, optional paint coat, and
 * cushioned cotton-string bands around the rim and base.
 */
export default defineProject({
  slug: "steel-can-pencil-cup",
  title: "Steel can pencil cup",
  summary:
    "Turn one clean, smooth-edged steel food can into a sturdy desk cup for pens and pencils, finished with cushioned cotton-cord bands at the rim and base and an optional painted body.",
  difficulty: "easy",
  timeMinutes: 25,
  materials: [
    { id: "steel-can", qty: 1, unit: "400 g food can (smooth-edged)" },
    { id: "cotton-string", qty: 1, unit: "about 2 m twine or cord for rim and base bands" },
    { id: "hot-glue-stick", qty: 1 },
    { id: "acrylic-paint", qty: 1, unit: "small coat for outer body", optional: true },
  ],
  tools: [
    { id: "scissors" },
    { id: "hot-glue-gun" },
    { id: "paintbrush", optional: true },
    { id: "ruler-tape", optional: true },
  ],
  wasteDiverted: [{ materialId: "steel-can", grams: 45 }],
  sources: [
    {
      title: "DIY Desk Organizer",
      publisher: "Museum of Craft and Design",
      url: "https://sfmcd.org/project/diy-desk-organizer/",
      license: "Publisher copyright (reference only)",
      note: "Reference for repurposing clean discarded tin cans and jars into desk organizers.",
    },
  ],
  camera: { position: [22, 16, 30], target: [0, 5.5, 0] },
  scene: {
    objects: [
      {
        id: "can",
        label: "Steel food can",
        source: "steel-can",
        primitive: "can",
        params: { height: 11, radius: 3.7, topRadius: 3.65 },
        material: { preset: "aluminium", color: "#b8bec6" },
      },
      {
        id: "label",
        label: "Paper label",
        primitive: "sleeve",
        params: { height: 8.4, radius: 3.75 },
        transform: { position: [0, 1.2, 0] },
        material: { preset: "paint", color: "#c95b45" },
      },
    ],
  },
  steps: [
    {
      title: "Wash, strip and inspect the rim",
      text: "Wash an empty, already smooth-edged steel food can in warm soapy water, peel off the paper wrapper, and dry it completely so the metal does not rust. Check the entire opening with a folded cloth rather than bare fingers to confirm no jagged tab remains.",
      tip: "If label glue sticks to the steel, soak the can in warm soapy water for ten minutes before wiping it clean.",
      warning:
        "Start with a can opened by a smooth-edge opener. Never run bare fingers around a freshly opened lip, and discard any can with sharp, jagged tears.",
      ops: [{ type: "remove", target: "label", away: [-16, 0, 5] }],
      camera: { position: [22, 16, 30], target: [0, 5.5, 0] },
    },
    {
      title: "Paint the body (optional)",
      text: "For a coloured finish, brush a thin coat of acrylic paint over the dry outer wall. Let it dry and add a second coat if needed.",
      tip: "Two thin paint coats cover bare metal much more evenly than one heavy coat.",
      ops: [{ type: "paint", target: "can", color: "#3d6b73", preset: "paint" }],
      camera: { position: [16, 18, 22], target: [0, 8, 0] },
    },
    {
      title: "Wrap a cushioned cord collar at the rim",
      text: "Anchor one end of cotton string just below the top lip with a small dot of hot glue, wind three snug turns up to the rim to create a soft finger-friendly edge, and glue and trim the tail neatly with scissors.",
      warning: "Keep fingers clear of the hot glue nozzle and press the cord down using a scrap stick or cool tool handle.",
      ops: [
        {
          type: "thread",
          target: "can",
          id: "rim-cord",
          path: coilPath(3.86, 9.55, 10.62, 3),
          radius: 0.22,
          material: { preset: "fabric", color: "#dfd4be" },
        },
      ],
      camera: { position: [14, 15, 18], target: [0, 9.6, 0] },
    },
    {
      title: "Add a matching base grip band",
      text: "Measure about 1 cm up from the bottom edge if you want even spacing, then wrap two snug turns of cotton string around the lower body, securing the start and end with small dabs of hot glue and trimming flush with scissors.",
      tip: "Keep the cord slightly above the bottom seam so the steel base still sits completely flat on your desk.",
      ops: [
        {
          type: "thread",
          target: "can",
          id: "base-cord",
          path: coilPath(3.86, 1.0, 1.85, 2),
          radius: 0.22,
          material: { preset: "fabric", color: "#dfd4be" },
        },
      ],
      camera: { position: [16, 6, 22], target: [0, 2.5, 0] },
    },
    {
      title: "Load with pens and desk tools",
      text: "Check that all glue points have cooled and set, then fill the finished cup with pencils, pens, markers, or small scissors. Wipe the outside with a dry cloth whenever needed.",
      ops: [
        {
          type: "add",
          duration: 0.35,
          object: {
            id: "pencil-1",
            label: "Pencil",
            parent: "can",
            primitive: "solid",
            params: {
              points: [
                [0.36, 0],
                [0.36, 14.0],
              ],
            },
            transform: { position: [-0.85, 0.35, 0.3], rotation: [6, 0, -9] },
            material: { preset: "paint", color: "#e0aa3a" },
          },
        },
        {
          type: "add",
          duration: 0.16,
          object: {
            id: "pencil-1.cone",
            parent: "pencil-1",
            primitive: "solid",
            params: {
              points: [
                [0.36, 0],
                [0.14, 1.35],
              ],
            },
            transform: { position: [0, 14.0, 0] },
            material: { preset: "wood", color: "#deb986" },
          },
        },
        {
          type: "add",
          duration: 0.12,
          object: {
            id: "pencil-1.lead",
            parent: "pencil-1",
            primitive: "solid",
            params: {
              points: [
                [0.14, 0],
                [0.03, 0.52],
              ],
            },
            transform: { position: [0, 15.35, 0] },
            material: { preset: "paint", color: "#2c2f34" },
          },
        },
        {
          type: "add",
          duration: 0.35,
          object: {
            id: "pencil-2",
            label: "Coloured pencil",
            parent: "can",
            primitive: "solid",
            params: {
              points: [
                [0.36, 0],
                [0.36, 13.4],
              ],
            },
            transform: { position: [0.85, 0.35, -0.4], rotation: [-6, 0, 9] },
            material: { preset: "paint", color: "#c95b45" },
          },
        },
        {
          type: "add",
          duration: 0.16,
          object: {
            id: "pencil-2.ferrule",
            parent: "pencil-2",
            primitive: "solid",
            params: {
              points: [
                [0.38, 0],
                [0.38, 0.85],
              ],
            },
            transform: { position: [0, 13.4, 0] },
            material: { preset: "aluminium", color: "#cfd4db" },
          },
        },
        {
          type: "add",
          duration: 0.14,
          object: {
            id: "pencil-2.eraser",
            parent: "pencil-2",
            primitive: "solid",
            params: {
              points: [
                [0.35, 0],
                [0.35, 0.68],
                [0.24, 0.78],
              ],
            },
            transform: { position: [0, 14.25, 0] },
            material: { preset: "paint", color: "#e39a9a" },
          },
        },
        {
          type: "add",
          duration: 0.35,
          object: {
            id: "pencil-3",
            label: "Pen",
            parent: "can",
            primitive: "solid",
            params: {
              points: [
                [0.42, 0],
                [0.42, 14.1],
                [0.2, 15.0],
              ],
            },
            transform: { position: [0.1, 0.35, 0.9], rotation: [-8, 0, -4] },
            material: { preset: "plastic", color: "#2d4b73" },
          },
        },
        {
          type: "add",
          duration: 0.14,
          object: {
            id: "pencil-3.clip",
            parent: "pencil-3",
            primitive: "box",
            params: { width: 0.14, height: 2.8, depth: 0.14 },
            transform: { position: [0, 11.4, 0.45] },
            material: { preset: "aluminium", color: "#d5dae0" },
          },
        },
      ],
      camera: { position: [22, 19, 32], target: [0, 7.5, 0] },
    },
  ],
});
