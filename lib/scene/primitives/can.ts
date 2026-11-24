import { z } from "zod";
import { definePrimitive, easeCos, type ProfilePoint } from "./types";

export const CanParams = z.object({
  height: z.number().positive().default(12.2),
  radius: z.number().positive().default(3.3),
  topRadius: z.number().positive().default(2.7),
});

export const can = definePrimitive({
  id: "can",
  label: "Can",
  params: CanParams,
  profile(p) {
    const pts: ProfilePoint[] = [];
    const r = p.radius;
    // Domed base taper.
    pts.push([0, 0.35], [r * 0.75, 0], [r * 0.95, 0.25], [r, 0.8]);
    const neck = p.height - 1.3;
    pts.push([r, neck]);
    for (let i = 1; i <= 8; i++) {
      const t = i / 8;
      pts.push([r + (p.topRadius - r) * easeCos(t), neck + 1.0 * t]);
    }
    pts.push([p.topRadius * 1.04, p.height - 0.15], [p.topRadius, p.height], [p.topRadius * 0.92, p.height]);
    return pts;
  },
});
