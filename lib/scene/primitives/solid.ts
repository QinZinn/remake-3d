import type { SolidParams } from "./params";
import { defineLathe, type ProfilePoint } from "./types";

/** Closed solid of revolution: the given outline, capped at both ends on the axis. */
export const solid = defineLathe<SolidParams>({
  id: "solid",
  label: "Solid",
  profile(p) {
    const pts = p.points as ProfilePoint[];
    const first = pts[0];
    const last = pts[pts.length - 1];
    const out: ProfilePoint[] = [];
    if (first[0] > 0) out.push([0, first[1]]);
    out.push(...pts);
    if (last[0] > 0) out.push([0, last[1]]);
    return out;
  },
});
