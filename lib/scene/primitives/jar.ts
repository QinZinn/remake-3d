import { z } from "zod";
import { definePrimitive, easeCos, type ProfilePoint } from "./types";

export const JarParams = z.object({
  height: z.number().positive().default(12),
  radius: z.number().positive().default(4.2),
  mouthRadius: z.number().positive().default(3.4),
  shoulderHeight: z.number().positive().default(1.6),
  /** Height of the threaded band at the top. */
  threadHeight: z.number().positive().default(1.2),
});

export const jar = definePrimitive({
  id: "jar",
  label: "Jar",
  params: JarParams,
  profile(p) {
    const pts: ProfilePoint[] = [];
    const r = p.radius;
    const corner = Math.min(0.8, r * 0.2);
    pts.push([0, 0], [r - corner, 0]);
    for (let i = 1; i <= 6; i++) {
      const a = (i / 6) * (Math.PI / 2);
      pts.push([r - corner + corner * Math.sin(a), corner * (1 - Math.cos(a))]);
    }
    const bodyTop = p.height - p.threadHeight - p.shoulderHeight;
    pts.push([r, bodyTop]);
    for (let i = 1; i <= 10; i++) {
      const t = i / 10;
      pts.push([r + (p.mouthRadius - r) * easeCos(t), bodyTop + p.shoulderHeight * t]);
    }
    const tb = p.height - p.threadHeight;
    const n = 3;
    for (let i = 0; i < n; i++) {
      const y0 = tb + (p.threadHeight * i) / n;
      const h = p.threadHeight / n;
      pts.push([p.mouthRadius * 1.035, y0 + h * 0.35], [p.mouthRadius, y0 + h * 0.7]);
    }
    pts.push([p.mouthRadius, p.height]);
    return pts;
  },
});
