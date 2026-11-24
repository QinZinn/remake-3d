import { defineProject } from "@/lib/scene/schema";

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
      license: "Author's Instructables license; linked for reference only, no text or images copied",
    },
  ],
  camera: { position: [38, 30, 52], target: [0, 15, 0] },
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
        params: { height: 7, radius: 5.06 },
        transform: { position: [0, 8, 0] },
        material: { preset: "paint", color: "#d94b3d" },
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
      ops: [],
      camera: { position: [20, 24, 28], target: [0, 19, 0] },
    },
    {
      title: "Cut the bottle in two",
      text: "Push the tip of the utility knife through the line to start a slot, then finish the cut around the bottle with scissors, following your mark.",
      warning: "Cut away from your hand and keep fingers clear of the blade. Children should leave the cutting to an adult.",
      ops: [{ type: "cut", target: "bottle", y: 19, gap: 2.5 }],
      camera: { position: [26, 26, 36], target: [0, 17, 0] },
    },
    {
      title: "Smooth the cut edges",
      text: "Run a piece of sandpaper along both cut rims, or trim off any jagged bits with scissors, so the edges will not scratch your hands when you lift the pot out to refill the tank.",
      ops: [],
    },
    {
      title: "Prepare the wick",
      text: "Cut a strip of old cotton T-shirt about two centimetres wide and twenty-five long. Wet it, then push one end up through the neck of the top piece so a short tail sits inside the pot and the rest hangs out of the mouth.",
      tip: "Cotton wicks water well; synthetic fabric barely does. Pre-wetting the strip gets the flow started.",
      ops: [],
      camera: { position: [16, 34, 22], target: [0, 26, 0] },
    },
    {
      title: "Paint the water tank (optional)",
      text: "Paint the outside of the bottom piece in an opaque colour, or wrap it in paper. Keeping light out of the reservoir stops green algae growing in the water.",
      ops: [{ type: "paint", target: "bottle.bottom", color: "#4f7a5a", preset: "paint" }],
      camera: { position: [30, 18, 40], target: [0, 9, 0] },
    },
    {
      title: "Turn the top upside down into the tank",
      text: "Flip the top piece over and sit it in the bottom piece, neck down, so the wick hangs into the tank. The shoulder of the bottle rests on the rim and holds the pot in place.",
      ops: [{ type: "transform", target: "bottle.top", position: [0, 38.6, 0], rotation: [180, 0, 0] }],
      camera: { position: [36, 26, 48], target: [0, 13, 0] },
    },
    {
      title: "Add water and soil",
      text: "Lift the pot out, fill the tank about a third full of water, and put the pot back so the wick dips into it. Fill the pot with potting soil, pressing it gently around the wick.",
      tip: "Keep the water level below the bottle neck so the soil never sits in water.",
      ops: [],
    },
    {
      title: "Plant and place",
      text: "Plant your seedling or sow a few seeds, water the soil once from the top to settle it, and put the planter somewhere bright. Top up the tank whenever the level drops; the wick does the rest.",
      tip: "Herbs such as basil and mint are easy first plants for this planter.",
      ops: [],
      camera: { position: [42, 34, 56], target: [0, 15, 0] },
    },
  ],
});
