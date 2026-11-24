import type { CapParams } from "./params";
import { defineLathe, type ProfilePoint } from "./types";

/** Screw cap, open side down. */
export const cap = defineLathe<CapParams>({
  id: "cap",
  label: "Cap",
  profile(p) {
    const pts: ProfilePoint[] = [];
    const ridges = 10;
    pts.push([p.radius * 0.92, 0]);
    for (let i = 0; i < ridges; i++) {
      const y = (p.height * 0.85 * (i + 0.5)) / ridges;
      pts.push([i % 2 ? p.radius : p.radius * 1.03, y]);
    }
    pts.push([p.radius, p.height * 0.9], [p.radius * 0.9, p.height], [0, p.height]);
    return pts;
  },
});
