import type { ExtrudeParams } from "./params";
import { defineMesh } from "./types";

/**
 * Extruded 2D silhouette in the XY plane (optional cutouts and rounded bevel),
 * centred on Z = 0. Useful for fabric silhouettes with open handles, gable
 * end-panels, botanical leaves/petals, washers and hex nuts.
 */
export const extrude = defineMesh<ExtrudeParams>({
  id: "extrude",
  label: "Extrude",
  bounds(p) {
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const [x, y] of p.points) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const b = p.bevel;
    const hz = p.depth / 2 + b;
    return {
      min: [minX - b, minY - b, -hz],
      max: [maxX + b, maxY + b, hz],
    };
  },
});
