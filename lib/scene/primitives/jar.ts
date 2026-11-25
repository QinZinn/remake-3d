import type { JarParams } from "./params";
import { defineLathe, easeCos, type ProfilePoint } from "./types";

export const jar = defineLathe<JarParams>({
  id: "jar",
  label: "Jar",
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
    // Slight recessed heel band and straight glass body.
    pts.push([r, corner + 0.15], [r, bodyTop]);
    for (let i = 1; i <= 12; i++) {
      const t = i / 12;
      pts.push([r + (p.mouthRadius - r) * easeCos(t), bodyTop + p.shoulderHeight * t]);
    }
    // Glass neck collar and smooth jar thread rings.
    const tb = p.height - p.threadHeight;
    pts.push([p.mouthRadius * 1.03, tb + p.threadHeight * 0.08], [p.mouthRadius, tb + p.threadHeight * 0.16]);
    const n = 2;
    for (let i = 0; i < n; i++) {
      const y0 = tb + p.threadHeight * 0.2 + ((p.threadHeight * 0.65) * i) / n;
      const h = (p.threadHeight * 0.65) / n;
      pts.push([p.mouthRadius * 1.04, y0 + h * 0.35], [p.mouthRadius, y0 + h * 0.72]);
    }
    pts.push([p.mouthRadius * 1.02, p.height - 0.05], [p.mouthRadius, p.height]);
    return pts;
  },
});
