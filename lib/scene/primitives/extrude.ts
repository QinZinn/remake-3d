import type { ExtrudeParams } from "./params";
import { defineMesh } from "./types";

type Vec2 = readonly [number, number];

/**
 * Pure 2D closed centripetal Catmull-Rom contour sampler (alpha = 0.5).
 * Shared by `extrude.bounds` and `three.ts` so bounds match rendered geometry.
 */
export function sampleExtrudeContour(points: readonly Vec2[], curve: boolean): Vec2[] {
  const n = points.length;
  if (!curve || n < 3) return points.map(([x, y]) => [x, y]);

  const samples = Math.max(24, n * 6);
  const out: Vec2[] = [];

  const distPow = (a: Vec2, b: Vec2) => {
    const d = Math.hypot(b[0] - a[0], b[1] - a[1]);
    return d < 1e-9 ? 1e-4 : Math.sqrt(d); // alpha = 0.5 (centripetal)
  };

  for (let s = 0; s < samples; s++) {
    const u = (s / samples) * n;
    const i = Math.floor(u) % n;
    const localU = u - Math.floor(u);

    const p0 = points[(i - 1 + n) % n];
    const p1 = points[i];
    const p2 = points[(i + 1) % n];
    const p3 = points[(i + 2) % n];

    const t0 = 0;
    const t1 = t0 + distPow(p0, p1);
    const t2 = t1 + distPow(p1, p2);
    const t3 = t2 + distPow(p2, p3);
    const t = t1 + (t2 - t1) * localU;

    const lerp2 = (a: Vec2, b: Vec2, ta: number, tb: number): Vec2 => {
      const f = (t - ta) / (tb - ta);
      return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    };

    const a1 = lerp2(p0, p1, t0, t1);
    const a2 = lerp2(p1, p2, t1, t2);
    const a3 = lerp2(p2, p3, t2, t3);
    const b1 = lerp2(a1, a2, t0, t2);
    const b2 = lerp2(a2, a3, t1, t3);
    out.push(lerp2(b1, b2, t1, t2));
  }
  return out;
}

/** Ensure contour is counter-clockwise (matching Three.js ExtrudeGeometry bevel normals). */
function toCCW(pts: readonly Vec2[]): Vec2[] {
  let area2 = 0;
  for (let i = 0; i < pts.length; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[(i + 1) % pts.length];
    area2 += x0 * y1 - x1 * y0;
  }
  return area2 < 0 ? [...pts].reverse() : [...pts];
}

/**
 * Extruded 2D silhouette in the XY plane (optional cutouts and rounded bevel),
 * centred on Z = 0. Useful for fabric silhouettes with open handles, gable
 * end-panels, botanical leaves/petals, washers and hex nuts.
 */
export const extrude = defineMesh<ExtrudeParams>({
  id: "extrude",
  label: "Extrude",
  bounds(p) {
    const contour = toCCW(sampleExtrudeContour(p.points, p.curve));
    const n = contour.length;
    const b = p.bevel;
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    const include = (x: number, y: number) => {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    };

    for (let i = 0; i < n; i++) {
      const prev = contour[(i - 1 + n) % n];
      const curr = contour[i];
      const next = contour[(i + 1) % n];
      include(curr[0], curr[1]);

      if (b > 0) {
        const dx1 = curr[0] - prev[0];
        const dy1 = curr[1] - prev[1];
        const len1 = Math.hypot(dx1, dy1);
        const dx2 = next[0] - curr[0];
        const dy2 = next[1] - curr[1];
        const len2 = Math.hypot(dx2, dy2);
        if (len1 > 1e-9 && len2 > 1e-9) {
          // Outward unit normals for CCW contour.
          const n1x = dy1 / len1;
          const n1y = -dx1 / len1;
          const n2x = dy2 / len2;
          const n2y = -dx2 / len2;
          const denom = 1 + n1x * n2x + n1y * n2y;
          if (denom > 1e-4) {
            include(curr[0] + ((n1x + n2x) / denom) * b, curr[1] + ((n1y + n2y) / denom) * b);
          } else {
            include(curr[0] + n1x * b, curr[1] + n1y * b);
            include(curr[0] + n2x * b, curr[1] + n2y * b);
          }
        }
      }
    }

    const hz = p.depth / 2 + b;
    return {
      min: [minX, minY, -hz],
      max: [maxX, maxY, hz],
    };
  },
});
