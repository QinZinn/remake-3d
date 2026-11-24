import { z } from "zod";
import { definePrimitive, easeCos, type ProfilePoint } from "./types";

export const BottleParams = z.object({
  height: z.number().positive().default(30),
  radius: z.number().positive().default(4.5),
  neckRadius: z.number().positive().default(1.4),
  neckHeight: z.number().positive().default(2.6),
  shoulderHeight: z.number().positive().default(8),
  /** Number of shallow grip rings on the body (0 for none). */
  ribs: z.number().int().min(0).max(8).default(2),
});

export const bottle = definePrimitive({
  id: "bottle",
  label: "Bottle",
  params: BottleParams,
  profile(p) {
    const pts: ProfilePoint[] = [];
    const r = p.radius;
    const bodyTop = p.height - p.neckHeight - p.shoulderHeight;
    // Base: flat centre rounding up into the wall.
    pts.push([0, 0], [r * 0.7, 0]);
    for (let i = 1; i <= 6; i++) {
      const a = (i / 6) * (Math.PI / 2);
      pts.push([r * 0.7 + r * 0.3 * Math.sin(a), r * 0.3 * (1 - Math.cos(a))]);
    }
    // Body with optional grip ribs.
    const bodyStart = r * 0.3;
    const steps = 24;
    for (let i = 1; i <= steps; i++) {
      const y = bodyStart + ((bodyTop - bodyStart) * i) / steps;
      let rr = r;
      if (p.ribs > 0) {
        const t = (y - bodyStart) / (bodyTop - bodyStart);
        const band = Math.sin(t * Math.PI * (p.ribs + 1));
        rr = r - 0.12 * Math.max(0, -band) * (t > 0.1 && t < 0.9 ? 1 : 0);
      }
      pts.push([rr, y]);
    }
    // Shoulder narrowing to the neck.
    for (let i = 1; i <= 16; i++) {
      const t = i / 16;
      pts.push([r + (p.neckRadius - r) * easeCos(t), bodyTop + p.shoulderHeight * t]);
    }
    // Neck with a thread lip.
    const neckBase = p.height - p.neckHeight;
    const lipR = p.neckRadius * 1.18;
    pts.push(
      [p.neckRadius, neckBase + p.neckHeight * 0.25],
      [lipR, neckBase + p.neckHeight * 0.3],
      [lipR, neckBase + p.neckHeight * 0.4],
      [p.neckRadius, neckBase + p.neckHeight * 0.45],
      [p.neckRadius, p.height],
    );
    return pts;
  },
});
