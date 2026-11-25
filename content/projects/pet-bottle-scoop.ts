import { defineProject } from "@/lib/scene/schema";

/**
 * Dry-goods utility scoop from a clean PET bottle.
 * Keeps the upper bottle body, shoulder, neck, and screw cap as a lightweight
 * scoop strictly for dry non-food goods such as potting soil or garden mulch.
 */
export default defineProject({
  slug: "pet-bottle-scoop",
  title: "PET bottle garden scoop",
  summary:
    "Reuse the top of a PET drinks bottle and its cap as a scoop for dry potting mix.",
  difficulty: "easy",
  timeMinutes: 15,
  materials: [
    { id: "pet-bottle", qty: 1, unit: "1–1.5 L clean bottle" },
    { id: "bottle-cap", qty: 1, unit: "matching screw cap" },
    { id: "potting-soil", qty: 1, unit: "or other dry non-food goods to scoop", optional: true },
  ],
  tools: [
    { id: "utility-knife" },
    { id: "scissors" },
    { id: "marker" },
    { id: "sandpaper" },
    { id: "ruler-tape" },
  ],
  // Only the retained upper bottle (~62% of a ~38 g bottle, including the heavier neck) and its cap are counted; the discarded base offcut is excluded.
  wasteDiverted: [
    { materialId: "pet-bottle", grams: 24 },
    { materialId: "bottle-cap", grams: 2 },
  ],
  sources: [
    {
      title: "Handy Go Green Scoops",
      publisher: "Instructables",
      url: "https://www.instructables.com/Handy-Go-Green-Scoops/",
      license: "Reference only (Creative Commons license version not confirmed); no text or images copied",
      note: "By DebH57 on Instructables; adapted here using a clean PET bottle strictly for dry non-food goods.",
    },
  ],
  camera: { position: [32, 24, 48], target: [0, 13, 0] },
  scene: {
    objects: [
      {
        id: "bottle",
        label: "PET bottle",
        source: "pet-bottle",
        primitive: "bottle",
        params: { height: 26, radius: 4.3, neckRadius: 1.4, neckHeight: 2.5, shoulderHeight: 7, ribs: 2 },
        material: { preset: "pet" },
      },
      {
        id: "cap",
        label: "Bottle cap",
        source: "bottle-cap",
        primitive: "cap",
        params: { height: 1.4, radius: 1.75 },
        transform: { position: [0, 24.85, 0] },
        material: { preset: "plastic", color: "#2d8a68" },
      },
      {
        id: "label",
        label: "Bottle label",
        primitive: "sleeve",
        params: { height: 6.5, radius: 4.35 },
        transform: { position: [0, 7.5, 0] },
        material: { preset: "paint", color: "#e07a38" },
      },
    ],
  },
  steps: [
    {
      title: "Wash, dry and strip the bottle",
      text: "Rinse a clean 1–1.5 L PET bottle thoroughly, unscrew the cap so the inside dries completely without trapping moisture, and peel off the wrapper. Keep the cap nearby—it seals the handle end of the scoop once cut.",
      tip: "Dry the inside fully before using the scoop so soil or granules do not stick to the plastic.",
      ops: [
        { type: "remove", target: "label", away: [-18, 0, 6] },
        { type: "transform", target: "cap", position: [10, 0, 0], arc: 6 },
      ],
      camera: { position: [32, 24, 48], target: [0, 13, 0] },
    },
    {
      title: "Mark and cut off the lower base",
      text: "Measure about 10 cm up from the base with a ruler and draw a guide line around the body with a permanent marker. Push the tip of a utility knife through the line to start a slot, then finish cutting all the way around with scissors.",
      warning: "Cut away from your body and keep fingers well clear of the blade. An adult should make the starter slot.",
      ops: [{ type: "cut", target: "bottle", y: 10, gap: 2.5 }],
      camera: { position: [26, 20, 42], target: [0, 12, 0] },
    },
    {
      title: "Smooth the cut rim and refit the cap",
      text: "Set the cut-off base aside for recycling. Trim any jagged points along the open mouth with scissors—angling one side slightly if you prefer a tapered lip—then sand the entire cut edge with sandpaper until smooth. Screw the cap back on tightly to seal the handle end.",
      tip: "Wipe the sanded rim with a cloth; if it catches fibres, give that spot a few extra passes with sandpaper.",
      ops: [
        { type: "remove", target: "bottle.bottom", away: [18, -2, 0] },
        { type: "transform", target: "bottle.top", position: [0, -10, 0] },
        { type: "attach", target: "cap", parent: "bottle.top", transform: { position: [0, 24.85, 0] } },
      ],
      camera: { position: [22, 18, 34], target: [0, 8, 0] },
    },
    {
      title: "Scoop dry non-food goods",
      text: "Grip the scoop by its capped neck and dip into dry non-food materials such as potting soil, perlite, mulch, or laundry granules. Tilt the open mouth slightly upward as you lift so the contents settle cleanly against the closed shoulder.",
      warning: "Reserve this scoop strictly for dry non-food goods; hand-cut plastic rims are hard to sanitise for food use.",
      ops: [
        { type: "transform", target: "bottle.top", position: [13, 12.5, 0], rotation: [0, 0, 110], arc: 4 },
        { type: "fill", target: "bottle.top", id: "scoop-fill", level: 0.65, inset: 0.94, material: { preset: "soil" } },
      ],
      camera: { position: [10, 22, 34], target: [-2, 6, 0] },
    },
  ],
});
