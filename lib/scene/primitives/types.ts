/** A point of a lathe profile: [radius, y]. Units are centimetres, y = 0 is the base. */
export type ProfilePoint = readonly [r: number, y: number];
export type Vec3 = readonly [number, number, number];

/** Axis-aligned local bounds. */
export interface Bounds {
  min: Vec3;
  max: Vec3;
}

/**
 * A solid of revolution. `cut` and `fill` work on lathes because a lathe can
 * be split exactly along y by slicing its profile.
 */
export interface LatheDef<P> {
  kind: "lathe";
  id: string;
  label: string;
  /** Outer surface from the base centre to the top, y non-decreasing, r >= 0. */
  profile(params: P): ProfilePoint[];
}

/**
 * Any other shape (tube, box, sheet). Its three.js geometry is registered in
 * `lib/scene/three.ts` (`MESH_GEOMETRY`), so this file stays free of three.js.
 */
export interface MeshDef<P> {
  kind: "mesh";
  id: string;
  label: string;
  bounds(params: P): Bounds;
}

export type PrimitiveDef<P = never> = LatheDef<P> | MeshDef<P>;

export function defineLathe<P>(def: Omit<LatheDef<P>, "kind">): LatheDef<P> {
  return { kind: "lathe", ...def };
}

export function defineMesh<P>(def: Omit<MeshDef<P>, "kind">): MeshDef<P> {
  return { kind: "mesh", ...def };
}

/** Smoothstep-ish ease for shoulders, 0..1 -> 0..1. */
export function easeCos(t: number): number {
  return (1 - Math.cos(Math.PI * t)) / 2;
}
