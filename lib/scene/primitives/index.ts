import { bottle } from "./bottle";
import { can } from "./can";
import { cap } from "./cap";
import { jar } from "./jar";
import { sleeve } from "./sleeve";
import type { PrimitiveDef, ProfilePoint } from "./types";

export type { PrimitiveDef, ProfilePoint } from "./types";

/** Registry of primitives. Add a new one here and in `SceneObjectSchema`. */
export const PRIMITIVES = { bottle, jar, can, cap, sleeve } as const;

export type PrimitiveId = keyof typeof PRIMITIVES;
export const PRIMITIVE_IDS = Object.keys(PRIMITIVES) as [PrimitiveId, ...PrimitiveId[]];

export function getPrimitive(id: PrimitiveId): PrimitiveDef {
  return PRIMITIVES[id] as unknown as PrimitiveDef;
}

/** Full profile of a primitive for (possibly partial) params. */
export function profileOf(id: PrimitiveId, params: unknown): ProfilePoint[] {
  const def = getPrimitive(id);
  return def.profile(def.params.parse(params ?? {}));
}

/** [minY, maxY] of a profile. */
export function profileRange(profile: readonly ProfilePoint[]): [number, number] {
  let lo = Infinity;
  let hi = -Infinity;
  for (const [, y] of profile) {
    lo = Math.min(lo, y);
    hi = Math.max(hi, y);
  }
  return [lo, hi];
}

/**
 * Keep the part of a profile with y in [yMin, yMax], interpolating new end
 * points exactly on the boundaries. This is how `cut` splits a lathe shape.
 */
export function sliceProfile(profile: readonly ProfilePoint[], yMin: number, yMax: number): ProfilePoint[] {
  const out: ProfilePoint[] = [];
  const inside = (y: number) => y >= yMin - 1e-9 && y <= yMax + 1e-9;
  const push = (p: ProfilePoint) => {
    const last = out[out.length - 1];
    if (!last || Math.abs(last[0] - p[0]) > 1e-9 || Math.abs(last[1] - p[1]) > 1e-9) out.push(p);
  };
  for (let i = 0; i < profile.length; i++) {
    const a = profile[i];
    if (i === 0) {
      if (inside(a[1])) push(a);
      continue;
    }
    const prev = profile[i - 1];
    for (const bound of [yMin, yMax]) {
      const crosses = (prev[1] - bound) * (a[1] - bound) < 0;
      if (crosses) {
        const t = (bound - prev[1]) / (a[1] - prev[1]);
        push([prev[0] + (a[0] - prev[0]) * t, bound]);
      }
    }
    if (inside(a[1])) push(a);
  }
  return out;
}

/** Radius of a profile at height y (first crossing), for cut markers. */
export function radiusAt(profile: readonly ProfilePoint[], y: number): number {
  for (let i = 1; i < profile.length; i++) {
    const [r0, y0] = profile[i - 1];
    const [r1, y1] = profile[i];
    if ((y0 <= y && y <= y1) || (y1 <= y && y <= y0)) {
      if (y1 === y0) return Math.max(r0, r1);
      return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0);
    }
  }
  return 0;
}
