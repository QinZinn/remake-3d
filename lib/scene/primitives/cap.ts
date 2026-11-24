import { z } from "zod";
import { definePrimitive, type ProfilePoint } from "./types";

export const CapParams = z.object({
  height: z.number().positive().default(1.4),
  radius: z.number().positive().default(1.75),
});

/** Screw cap, open side down. */
export const cap = definePrimitive({
  id: "cap",
  label: "Cap",
  params: CapParams,
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
