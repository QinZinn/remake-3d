import type { CapParams } from "./params";
import { defineLathe } from "./types";

/** Screw cap, open side down, with subtle lower bead and rounded top edge. */
export const cap = defineLathe<CapParams>({
  id: "cap",
  label: "Cap",
  profile(p) {
    const r = p.radius;
    const h = p.height;
    return [
      [r * 0.985, 0],
      [r * 1.02, h * 0.09],
      [r * 1.02, h * 0.2],
      [r, h * 0.27],
      [r, h * 0.78],
      [r * 0.97, h * 0.89],
      [r * 0.9, h * 0.97],
      [r * 0.82, h],
      [0, h],
    ];
  },
});
