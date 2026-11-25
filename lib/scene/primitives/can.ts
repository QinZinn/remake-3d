import type { CanParams } from "./params";
import { defineLathe, easeCos, type ProfilePoint } from "./types";

export const can = defineLathe<CanParams>({
  id: "can",
  label: "Can",
  profile(p) {
    const pts: ProfilePoint[] = [];
    const r = p.radius;
    // Recessed base chime and rolled lower seam bead.
    pts.push(
      [0, 0],
      [r * 0.84, 0],
      [r * 0.96, 0.12],
      [r * 1.015, 0.22],
      [r * 1.015, 0.42],
      [r, 0.56],
    );
    // Body with subtle horizontal strengthening beads (classic steel food can).
    const bodyStart = 0.8;
    const neck = p.height - 1.3;
    const steps = 28;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const y = bodyStart + (neck - bodyStart) * t;
      let rr = r;
      if (t > 0.16 && t < 0.84 && neck - bodyStart > 4) {
        const wave = Math.sin(((t - 0.16) / 0.68) * Math.PI * 10);
        rr = r - Math.min(0.055, r * 0.015) * Math.max(0, wave);
      }
      pts.push([rr, y]);
    }
    // Slight inward taper to top rolled lip.
    for (let i = 1; i <= 8; i++) {
      const t = i / 8;
      pts.push([r + (p.topRadius - r) * easeCos(t), neck + 0.92 * t]);
    }
    // Rolled safety rim bead.
    pts.push(
      [p.topRadius * 1.04, p.height - 0.24],
      [p.topRadius * 1.045, p.height - 0.08],
      [p.topRadius, p.height],
      [p.topRadius * 0.94, p.height],
    );
    return pts;
  },
});
