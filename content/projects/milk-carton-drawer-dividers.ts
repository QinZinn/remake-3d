import { defineProject, type SceneObjectInput, type SceneOpInput } from "@/lib/scene/schema";

const carton = { preset: "cardboard", color: "#ebe7d2" } as const;
const tape = { preset: "cardboard", color: "#e3d1a2" } as const;

const cellSpecs = [
  { id: "cell-1", startX: -14.4, grid: [-3.85, 0, -3.85] as const, accent: "#6d9a86" },
  { id: "cell-2", startX: -4.8, grid: [3.85, 0, -3.85] as const, accent: "#5a86a8" },
  { id: "cell-3", startX: 4.8, grid: [-3.85, 0, 3.85] as const, accent: "#c78654" },
  { id: "cell-4", startX: 14.4, grid: [3.85, 0, 3.85] as const, accent: "#8d7ea8" },
] as const;

function buildCarton(id: string, x: number, accent: string): SceneObjectInput[] {
  const accentMat = { preset: "cardboard", color: accent } as const;
  return [
    { id, label: "Milk carton base", source: "milk-carton", primitive: "box", params: { width: 7.6, height: 0.24, depth: 7.6 }, transform: { position: [x, 0, 0] }, material: carton },
    { id: `${id}.front`, parent: id, primitive: "box", params: { width: 7.6, height: 6.0, depth: 0.22 }, transform: { position: [0, 0, 3.69] }, material: accentMat },
    { id: `${id}.back`, parent: id, primitive: "box", params: { width: 7.6, height: 6.0, depth: 0.22 }, transform: { position: [0, 0, -3.69] }, material: carton },
    { id: `${id}.left`, parent: id, primitive: "box", params: { width: 0.22, height: 6.0, depth: 7.16 }, transform: { position: [-3.69, 0, 0] }, material: carton },
    { id: `${id}.right`, parent: id, primitive: "box", params: { width: 0.22, height: 6.0, depth: 7.16 }, transform: { position: [3.69, 0, 0] }, material: carton },
    { id: `${id}.top`, parent: id, primitive: "box", params: { width: 7.6, height: 6.8, depth: 7.6 }, transform: { position: [0, 6.0, 0] }, material: carton },
    { id: `${id}.roof-f`, parent: `${id}.top`, primitive: "box", params: { width: 7.6, height: 4.55, depth: 0.2 }, transform: { position: [0, 6.8, 3.69], rotation: [-55, 0, 0] }, material: accentMat },
    { id: `${id}.roof-b`, parent: `${id}.top`, primitive: "box", params: { width: 7.6, height: 4.55, depth: 0.2 }, transform: { position: [0, 6.8, -3.69], rotation: [55, 0, 0] }, material: accentMat },
    { id: `${id}.ridge`, parent: `${id}.top`, primitive: "box", params: { width: 7.6, height: 0.45, depth: 0.22 }, transform: { position: [0, 9.4, 0] }, material: accentMat },
  ];
}

const addTapeRims: SceneOpInput[] = cellSpecs.flatMap(({ id }): SceneOpInput[] => [
  { type: "add", duration: 0.08, object: { id: `${id}.rim-f`, parent: id, primitive: "box", params: { width: 7.72, height: 0.65, depth: 0.34 }, transform: { position: [0, 5.45, 3.69] }, material: tape } },
  { type: "add", duration: 0.08, object: { id: `${id}.rim-b`, parent: id, primitive: "box", params: { width: 7.72, height: 0.65, depth: 0.34 }, transform: { position: [0, 5.45, -3.69] }, material: tape } },
  { type: "add", duration: 0.08, object: { id: `${id}.rim-l`, parent: id, primitive: "box", params: { width: 0.34, height: 0.65, depth: 7.38 }, transform: { position: [-3.69, 5.45, 0] }, material: tape } },
  { type: "add", duration: 0.08, object: { id: `${id}.rim-r`, parent: id, primitive: "box", params: { width: 0.34, height: 0.65, depth: 7.38 }, transform: { position: [3.69, 5.45, 0] }, material: tape } },
]);

export default defineProject({
  slug: "milk-carton-drawer-dividers",
  title: "Milk carton drawer dividers",
  summary:
    "Trim four clean paper milk cartons to an even drawer height, cover their cut rims with masking tape, and join them into a rigid 2 × 2 drawer organizer.",
  difficulty: "easy",
  timeMinutes: 25,
  materials: [
    { id: "milk-carton", qty: 4, unit: "Clean, dry 1 L gable-top cartons" },
    { id: "masking-tape", qty: 1, unit: "Strips to bind the cut rims" },
    { id: "hot-glue-stick", qty: 1 },
  ],
  tools: [
    { id: "utility-knife" },
    { id: "scissors" },
    { id: "ruler-tape" },
    { id: "marker" },
    { id: "hot-glue-gun" },
  ],
  // Four retained 6 cm carton bases (~12 g each = 48 g); discarded upper gable tops go to recycling.
  wasteDiverted: [{ materialId: "milk-carton", grams: 48 }],
  sources: [
    {
      title: "DIY Desk Organizer",
      publisher: "Museum of Craft and Design",
      url: "https://sfmcd.org/project/diy-desk-organizer/",
      license: "Publisher copyright (reference only)",
      note: "Inspiration for turning clean household packaging into tidy storage compartments; this four-carton 2 × 2 drawer divider grid is an original design.",
    },
  ],
  camera: { position: [14, 24, 38], target: [0, 7, 0] },
  scene: {
    objects: cellSpecs.flatMap(({ id, startX, accent }) => buildCarton(id, startX, accent)),
  },
  steps: [
    {
      title: "Measure 6 cm and cut off all four carton tops",
      text: "Rinse and completely dry four matching milk cartons. Check your drawer depth, mark a 6 cm height line around each carton with a ruler and marker, make a starter slit with a utility knife, and trim off the tops cleanly with scissors.",
      warning: "Rest each carton on a flat surface when starting the cut with a utility knife and keep your fingers well clear of the blade.",
      ops: cellSpecs.map(({ id }): SceneOpInput => ({
        type: "remove",
        target: `${id}.top`,
        away: [0, 12, 0],
        duration: 0.4,
      })),
      camera: { position: [12, 20, 32], target: [0, 3.5, 0] },
    },
    {
      title: "Bind the cut rims with masking tape",
      text: "Press strips of masking tape halfway along the outside of each cut edge and fold the remaining half smoothly inside the wall. Taping the rims strengthens the corners and keeps paper fibres from fraying.",
      ops: addTapeRims,
      camera: { position: [10, 18, 28], target: [0, 4.5, 0] },
    },
    {
      title: "Glue the four cells into a 2 × 2 grid",
      text: "Arrange the four trimmed boxes in a neat 2 × 2 square, run two vertical beads of hot glue along the touching outer walls, and hold each pair flush until the glue cools so the grid moves as one rigid unit.",
      tip: "Expand the layout to 2 × 3 or 3 × 3 if you want to fill a wider desk or kitchen drawer.",
      ops: cellSpecs.map(({ id, grid }): SceneOpInput => ({
        type: "transform",
        target: id,
        position: [grid[0], grid[1], grid[2]],
        arc: 2.5,
        duration: 0.6,
      })),
      camera: { position: [16, 20, 22], target: [0, 3, 0] },
    },
    {
      title: "Drop into a drawer and sort small items",
      text: "Set the finished divider block inside a shallow drawer and assign each square cell to one category—such as sticky notes, tape rolls, erasers, and coiled cables—so small items stay separated.",
      ops: [
        {
          type: "add",
          object: {
            id: "notes-pad",
            label: "Sticky note pad",
            parent: "cell-1",
            primitive: "box",
            params: { width: 5.8, height: 2.4, depth: 5.8 },
            transform: { position: [0, 0.25, 0] },
            material: { preset: "cardboard", color: "#f0d36e" },
          },
        },
        {
          type: "add",
          object: {
            id: "tape-roll",
            label: "Tape roll",
            parent: "cell-2",
            primitive: "sleeve",
            params: { radius: 2.5, height: 2.0 },
            transform: { position: [0, 0.25, 0] },
            material: { preset: "cardboard", color: "#e6d8b5" },
          },
        },
        {
          type: "add",
          object: {
            id: "eraser",
            label: "Eraser",
            parent: "cell-3",
            primitive: "box",
            params: { width: 4.2, height: 1.3, depth: 2.1 },
            transform: { position: [-0.4, 0.25, 0.4], rotation: [0, 18, 0] },
            material: { preset: "plastic", color: "#e8ecee" },
          },
        },
        {
          type: "thread",
          target: "cell-4",
          id: "cable-coil",
          path: [
            [-1.8, 0.8, -1.2],
            [1.6, 0.9, -1.6],
            [2.0, 1.1, 1.4],
            [-1.5, 1.3, 1.8],
            [-1.8, 1.5, -0.8],
            [1.2, 1.7, -1.0],
          ],
          radius: 0.28,
          material: { preset: "plastic", color: "#353c45" },
          duration: 0.7,
        },
      ],
      camera: { position: [14, 21, 18], target: [0, 3, 0] },
    },
  ],
});
