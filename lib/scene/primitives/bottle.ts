import type { BottleParams } from "./params";
import { defineLathe, easeCos, type ProfilePoint } from "./types";

export const bottle = defineLathe<BottleParams>({
  id: "bottle",
  label: "Bottle",
  profile(p) {
    const pts: ProfilePoint[] = [];
    const r = p.radius;
    const bodyTop = p.height - p.neckHeight - p.shoulderHeight;
    // Base: flat resting ring rounding smoothly up into the heel.
    pts.push([0, 0], [r * 0.72, 0]);
    for (let i = 1; i <= 6; i++) {
      const a = (i / 6) * (Math.PI / 2);
      pts.push([r * 0.72 + r * 0.28 * Math.sin(a), r * 0.28 * (1 - Math.cos(a))]);
    }
    // Body with subtle heel groove and optional moulded grip ribs.
    const bodyStart = r * 0.3;
    const steps = 28;
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const y = bodyStart + (bodyTop - bodyStart) * t;
      let rr = r;
      if (p.ribs > 0) {
        const band = Math.sin(t * Math.PI * (p.ribs + 1));
        const ribDepth = Math.min(0.14, r * 0.032) * Math.max(0, -band) * (t > 0.1 && t < 0.9 ? 1 : 0);
        // Gentle ergonomic waist near the middle of ribbed PET bottles.
        const waist = Math.min(0.12, r * 0.024) * Math.exp(-Math.pow((t - 0.55) / 0.22, 2));
        rr = Math.max(r * 0.6, r - ribDepth - waist);
      }
      pts.push([rr, y]);
    }
    // Shoulder narrowing smoothly to the neck.
    for (let i = 1; i <= 16; i++) {
      const t = i / 16;
      pts.push([r + (p.neckRadius - r) * easeCos(t), bodyTop + p.shoulderHeight * t]);
    }
    // Neck with tamper/retaining collar ring and subtle thread lip.
    const neckBase = p.height - p.neckHeight;
    const lipR = p.neckRadius * 1.18;
    const threadR = p.neckRadius * 1.07;
    pts.push(
      [p.neckRadius, neckBase + p.neckHeight * 0.22],
      [lipR, neckBase + p.neckHeight * 0.27],
      [lipR, neckBase + p.neckHeight * 0.37],
      [p.neckRadius, neckBase + p.neckHeight * 0.42],
      [p.neckRadius, neckBase + p.neckHeight * 0.62],
      [threadR, neckBase + p.neckHeight * 0.68],
      [p.neckRadius, neckBase + p.neckHeight * 0.74],
      [threadR, neckBase + p.neckHeight * 0.82],
      [p.neckRadius, neckBase + p.neckHeight * 0.89],
      [p.neckRadius * 1.03, p.height - 0.06],
      [p.neckRadius, p.height],
    );
    return pts;
  },
});
