import type { TubeParams } from "./params";
import { defineMesh } from "./types";

/** A round tube following a path of local points: a wick, string, wire or straw. */
export const tube = defineMesh<TubeParams>({
  id: "tube",
  label: "Tube",
  bounds(p) {
    const min = [Infinity, Infinity, Infinity];
    const max = [-Infinity, -Infinity, -Infinity];
    for (const pt of p.points) {
      for (let i = 0; i < 3; i++) {
        min[i] = Math.min(min[i], pt[i] - p.radius);
        max[i] = Math.max(max[i], pt[i] + p.radius);
      }
    }
    return { min: [min[0], min[1], min[2]], max: [max[0], max[1], max[2]] };
  },
});
