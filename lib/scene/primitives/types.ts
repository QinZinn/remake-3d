import type { z } from "zod";

/** A point of a lathe profile: [radius, y]. Units are centimetres, y = 0 is the base. */
export type ProfilePoint = readonly [r: number, y: number];

/**
 * A primitive is a parametric shape. Today every primitive is a solid of
 * revolution (a lathe profile), which is what lets `cut` split it along y.
 * A non-lathe primitive (box, sheet) would add its own geometry builder; see
 * docs/scene-dsl.md.
 */
export interface PrimitiveDef<S extends z.ZodType = z.ZodType> {
  id: string;
  label: string;
  /** Zod schema for params, every field defaulted so `{}` is valid. */
  params: S;
  /** Outer surface from the base centre to the top, y non-decreasing. */
  profile(params: z.output<S>): ProfilePoint[];
}

export function definePrimitive<S extends z.ZodType>(def: PrimitiveDef<S>): PrimitiveDef<S> {
  return def;
}

/** Smoothstep-ish ease for shoulders, 0..1 -> 0..1. */
export function easeCos(t: number): number {
  return (1 - Math.cos(Math.PI * t)) / 2;
}
