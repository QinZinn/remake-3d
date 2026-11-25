/**
 * Zod schemas for primitive params. Kept apart from the shape functions so
 * the client bundle (which only draws already-parsed projects) has no zod.
 * Every field has a default, so `{}` is valid; refinements reject sizes that
 * would give a broken shape.
 */
import { z } from "zod";

const pos = () => z.number().positive();

export const BottleParams = z
  .object({
    height: pos().default(30),
    radius: pos().default(4.5),
    neckRadius: pos().default(1.4),
    neckHeight: pos().default(2.6),
    shoulderHeight: pos().default(8),
    /** Number of shallow grip rings on the body (0 for none). */
    ribs: z.number().int().min(0).max(8).default(2),
  })
  .refine((p) => p.neckHeight + p.shoulderHeight + p.radius * 0.3 < p.height, {
    message: "bottle: neckHeight + shoulderHeight (+ the rounded base, 0.3 × radius) must be less than height",
  })
  .refine((p) => p.neckRadius < p.radius, { message: "bottle: neckRadius must be less than radius" });

export const JarParams = z
  .object({
    height: pos().default(12),
    radius: pos().default(4.2),
    mouthRadius: pos().default(3.4),
    shoulderHeight: pos().default(1.6),
    /** Height of the threaded band at the top. */
    threadHeight: pos().default(1.2),
  })
  .refine((p) => p.threadHeight + p.shoulderHeight + Math.min(0.8, p.radius * 0.2) < p.height, {
    message: "jar: threadHeight + shoulderHeight (+ the rounded base) must be less than height",
  })
  .refine((p) => p.mouthRadius <= p.radius, { message: "jar: mouthRadius must not exceed radius" });

export const CanParams = z
  .object({
    height: pos().default(12.2),
    radius: pos().default(3.3),
    topRadius: pos().default(2.7),
  })
  .refine((p) => p.height > 2.4, { message: "can: height must be more than 2.4 (base and top rims)" })
  .refine((p) => p.topRadius <= p.radius, { message: "can: topRadius must not exceed radius" });

export const CapParams = z.object({
  height: pos().default(1.4),
  radius: pos().default(1.75),
});

export const SleeveParams = z.object({
  height: pos().default(7),
  radius: pos().default(5.05),
});

/** A closed solid of revolution from [radius, y] points (used by `fill`, or hand-authored). */
export const SolidParams = z.object({
  points: z.array(z.tuple([z.number().min(0), z.number()])).min(2),
});

/** A tube along a path of local points (used by `thread`). */
export const TubeParams = z.object({
  points: z.array(z.tuple([z.number(), z.number(), z.number()])).min(2),
  radius: pos().default(0.3),
});

export const BoxParams = z.object({
  width: pos().default(10),
  height: pos().default(4),
  depth: pos().default(6),
});

const Vec2 = z.tuple([z.number(), z.number()]);

/** Extruded 2D closed outline in XY with optional holes, bevel and smooth curve sampling. */
export const ExtrudeParams = z.object({
  points: z.array(Vec2).min(3).default([
    [-2, 0],
    [2, 0],
    [2, 4],
    [-2, 4],
  ]),
  holes: z.array(z.array(Vec2).min(3)).default([]),
  depth: pos().default(1),
  bevel: z.number().min(0).default(0),
  curve: z.boolean().default(false),
});

export const PRIMITIVE_PARAMS = {
  bottle: BottleParams,
  jar: JarParams,
  can: CanParams,
  cap: CapParams,
  sleeve: SleeveParams,
  solid: SolidParams,
  tube: TubeParams,
  box: BoxParams,
  extrude: ExtrudeParams,
} as const;

export type BottleParams = z.output<typeof BottleParams>;
export type JarParams = z.output<typeof JarParams>;
export type CanParams = z.output<typeof CanParams>;
export type CapParams = z.output<typeof CapParams>;
export type SleeveParams = z.output<typeof SleeveParams>;
export type SolidParams = z.output<typeof SolidParams>;
export type TubeParams = z.output<typeof TubeParams>;
export type BoxParams = z.output<typeof BoxParams>;
export type ExtrudeParams = z.output<typeof ExtrudeParams>;
