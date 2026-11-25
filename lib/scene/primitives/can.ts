import type { CanParams } from "./params";
import { defineLathe, easeCos, type ProfilePoint } from "./types";

export const can = defineLathe<CanParams>({
  id: "can",
  label: "Can",
  profile(p) {
    const pts: ProfilePoint[] = [];
    const r = p.radius;
    // Base rim (flat underside, rounded edge).
    pts.push([0, 0], [r * 0.75, 0], [r * 0.95, 0.25], [r, 0.8]);
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
