/**
 * Primitive registry. Pure data and maths: no zod (see params.ts), no three.js
 * (see lib/scene/three.ts).
 */
import { bottle } from "./bottle";
import { box } from "./box";
import { can } from "./can";
import { cap } from "./cap";
import { jar } from "./jar";
import { sleeve } from "./sleeve";
import { solid } from "./solid";
import { tube } from "./tube";
import type { Bounds, LatheDef, MeshDef, PrimitiveDef, ProfilePoint } from "./types";

export type { Bounds, LatheDef, MeshDef, PrimitiveDef, ProfilePoint } from "./types";

/** Add a new primitive here, in `PRIMITIVE_PARAMS` (params.ts) and in `SceneObjectSchema`. */
export const PRIMITIVES = { bottle, jar, can, cap, sleeve, solid, tube, box } as const;

export type PrimitiveId = keyof typeof PRIMITIVES;
export const PRIMITIVE_IDS = Object.keys(PRIMITIVES) as [PrimitiveId, ...PrimitiveId[]];

type KindOf<K extends PrimitiveId> = (typeof PRIMITIVES)[K]["kind"];
export type LatheId = { [K in PrimitiveId]: KindOf<K> extends "lathe" ? K : never }[PrimitiveId];
export type MeshId = { [K in PrimitiveId]: KindOf<K> extends "mesh" ? K : never }[PrimitiveId];

export function getPrimitive(id: PrimitiveId): PrimitiveDef<unknown> {
  return PRIMITIVES[id] as unknown as PrimitiveDef<unknown>;
}

export function isLathe(id: PrimitiveId): boolean {
  return PRIMITIVES[id].kind === "lathe";
}

/** Full profile of a lathe primitive. `params` must already be parsed (defaults filled). */
export function profileOf(id: PrimitiveId, params: unknown): ProfilePoint[] {
  const def = getPrimitive(id);
  if (def.kind !== "lathe") throw new Error(`primitive \`${id}\` is not a lathe`);
  return (def as LatheDef<unknown>).profile(params);
}

/** Local bounds of a mesh primitive. */
export function meshBounds(id: PrimitiveId, params: unknown): Bounds {
  const def = getPrimitive(id);
  if (def.kind !== "mesh") throw new Error(`primitive \`${id}\` is not a mesh`);
  return (def as MeshDef<unknown>).bounds(params);
}

/** Why a lathe profile is unusable, or null. Lathes must start at y = 0. */
export function profileProblem(profile: readonly ProfilePoint[]): string | null {
  if (profile.length < 2) return "profile needs at least 2 points";
  for (let i = 0; i < profile.length; i++) {
    const [r, y] = profile[i];
    if (!Number.isFinite(r) || !Number.isFinite(y)) return `profile point ${i} is not finite`;
    if (r < 0) return `profile point ${i} has a negative radius (${r.toFixed(2)})`;
    if (i > 0 && y < profile[i - 1][1] - 1e-9) return `profile goes down at point ${i} (y ${profile[i - 1][1].toFixed(2)} -> ${y.toFixed(2)})`;
  }
  if (Math.abs(profile[0][1]) > 1e-9) return `profile must start at y = 0 (starts at ${profile[0][1].toFixed(2)})`;
  return null;
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

/** Largest radius of a profile. */
export function profileMaxRadius(profile: readonly ProfilePoint[]): number {
  return profile.reduce((m, [r]) => Math.max(m, r), 0);
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
    // Visit the boundaries in the order this segment reaches them.
    for (const bound of prev[1] <= a[1] ? [yMin, yMax] : [yMax, yMin]) {
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

/** Radius of a profile at height y (largest at that height), for cut markers. */
export function radiusAt(profile: readonly ProfilePoint[], y: number): number {
  let best = 0;
  for (let i = 1; i < profile.length; i++) {
    const [r0, y0] = profile[i - 1];
    const [r1, y1] = profile[i];
    if ((y0 <= y && y <= y1) || (y1 <= y && y <= y0)) {
      best = Math.max(best, y1 === y0 ? Math.max(r0, r1) : r0 + ((r1 - r0) * (y - y0)) / (y1 - y0));
    }
  }
  return best;
}
