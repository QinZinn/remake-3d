import { z } from "zod";
import { MATERIAL_IDS, TOOL_IDS } from "@/lib/taxonomy";
import { BottleParams, CanParams, CapParams, JarParams, SleeveParams, SolidParams, TubeParams } from "./primitives/params";
import { validateSteps } from "./validate";

// ---------------------------------------------------------------- basics

export const Vec3 = z.tuple([z.number(), z.number(), z.number()]);
export type Vec3 = z.infer<typeof Vec3>;

export const HexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "expected a #rrggbb colour");

/** Object ids: lower-case, dot-separated segments (cut parts append `.top`/`.bottom`). */
export const ObjectId = z.string().regex(/^[a-z][a-z0-9-]*(\.[a-z0-9-]+)*$/, "expected an id like `bottle` or `bottle.top`");

export const MaterialId = z.enum(MATERIAL_IDS);
export const ToolId = z.enum(TOOL_IDS);

// ---------------------------------------------------------------- scene objects

/** Visual (render) material presets; distinct from taxonomy materials. */
export const MATERIAL_PRESETS = ["pet", "glass", "aluminium", "plastic", "cardboard", "fabric", "soil", "water", "wood", "paint"] as const;
export const RenderMaterial = z.object({
  preset: z.enum(MATERIAL_PRESETS),
  color: HexColor.optional(),
  opacity: z.number().min(0).max(1).optional(),
});
export type RenderMaterial = z.infer<typeof RenderMaterial>;

export const Transform = z.object({
  position: Vec3.default([0, 0, 0]),
  /** Euler XYZ, degrees. */
  rotation: Vec3.default([0, 0, 0]),
  scale: Vec3.default([1, 1, 1]),
});
export type Transform = z.infer<typeof Transform>;

const objectBase = {
  id: ObjectId,
  label: z.string().optional(),
  /** Which taxonomy material this object depicts (for highlighting). */
  source: MaterialId.optional(),
  /** Parent object: this object's transform is relative to it, so it moves with it. */
  parent: ObjectId.optional(),
  transform: Transform.default({ position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] }),
  material: RenderMaterial,
};

// One branch per primitive so params are typed per shape.
export const SceneObjectSchema = z.discriminatedUnion("primitive", [
  z.object({ ...objectBase, primitive: z.literal("bottle"), params: BottleParams.default(BottleParams.parse({})) }),
  z.object({ ...objectBase, primitive: z.literal("jar"), params: JarParams.default(JarParams.parse({})) }),
  z.object({ ...objectBase, primitive: z.literal("can"), params: CanParams.default(CanParams.parse({})) }),
  z.object({ ...objectBase, primitive: z.literal("cap"), params: CapParams.default(CapParams.parse({})) }),
  z.object({ ...objectBase, primitive: z.literal("sleeve"), params: SleeveParams.default(SleeveParams.parse({})) }),
  z.object({ ...objectBase, primitive: z.literal("solid"), params: SolidParams }),
  z.object({ ...objectBase, primitive: z.literal("tube"), params: TubeParams }),
]);
export type SceneObject = z.infer<typeof SceneObjectSchema>;
export type SceneObjectInput = z.input<typeof SceneObjectSchema>;

export const SceneSchema = z.object({
  objects: z.array(SceneObjectSchema).min(1),
});
export type Scene = z.infer<typeof SceneSchema>;

// ---------------------------------------------------------------- ops

const opBase = {
  target: ObjectId,
  /** Seconds this op takes in the forward animation; each op has a default. */
  duration: z.number().positive().max(10).optional(),
};

/** Split a lathe object at local height `y` into `<target>.top` and `<target>.bottom`. */
export const CutOp = z.object({
  type: z.literal("cut"),
  ...opBase,
  y: z.number(),
  /** How far the top part lifts after the cut (cm). */
  gap: z.number().min(0).default(1.5),
  parts: z.object({ top: ObjectId, bottom: ObjectId }).optional(),
});

/** Take an object out of the scene; it animates away along `away`. */
export const RemoveOp = z.object({
  type: z.literal("remove"),
  ...opBase,
  away: Vec3.default([18, 6, 0]),
});

/** Tween an object's colour (and optionally opacity / preset). */
export const PaintOp = z.object({
  type: z.literal("paint"),
  ...opBase,
  color: HexColor,
  opacity: z.number().min(0).max(1).optional(),
  preset: z.enum(MATERIAL_PRESETS).optional(),
});

/** Move / rotate / scale an object to an absolute transform (only given fields change). */
export const TransformOp = z.object({
  type: z.literal("transform"),
  ...opBase,
  position: Vec3.optional(),
  rotation: Vec3.optional(),
  scale: Vec3.optional(),
  /** Lift (cm, world y) at the middle of the move, so a flipped part clears what is below it. */
  arc: z.number().min(0).default(0),
});

/** Bring a new object into the scene (it fades in). */
export const AddOp = z.object({
  type: z.literal("add"),
  object: SceneObjectSchema,
  duration: opBase.duration,
});

/**
 * Fill a lathe container (soil, water, sand) to `level` (0..1 of its height),
 * measured from whichever end is lowest in the world, so it works upside down.
 * Creates a child of the container, `id` (default `<target>.fill`).
 */
export const FillOp = z.object({
  type: z.literal("fill"),
  ...opBase,
  id: ObjectId.optional(),
  level: z.number().gt(0).max(1).default(0.8),
  /** Radius factor so the fill sits inside the container wall. */
  inset: z.number().gt(0).max(1).default(0.94),
  material: RenderMaterial.default({ preset: "soil" }),
});

/**
 * Thread a string, wick or wire along `path` (points in the target's local
 * frame). Creates a tube `id` as a child of the target; it grows along the path.
 */
export const ThreadOp = z.object({
  type: z.literal("thread"),
  ...opBase,
  id: ObjectId,
  path: z.array(Vec3).min(2),
  radius: z.number().positive().default(0.3),
  material: RenderMaterial.default({ preset: "fabric" }),
});

export const SceneOpSchema = z.discriminatedUnion("type", [CutOp, RemoveOp, PaintOp, TransformOp, AddOp, FillOp, ThreadOp]);
export type SceneOp = z.infer<typeof SceneOpSchema>;
export type SceneOpInput = z.input<typeof SceneOpSchema>;
export type OpType = SceneOp["type"];
export type OpOf<T extends OpType> = Extract<SceneOp, { type: T }>;

// ---------------------------------------------------------------- project

export const CameraSchema = z.object({ position: Vec3, target: Vec3 });
export type CameraView = z.infer<typeof CameraSchema>;

export const StepSchema = z.object({
  title: z.string().min(1),
  text: z.string().min(1),
  tip: z.string().optional(),
  warning: z.string().optional(),
  ops: z.array(SceneOpSchema).default([]),
  camera: CameraSchema.optional(),
});
export type Step = z.infer<typeof StepSchema>;

export const SourceSchema = z.object({
  title: z.string().min(1),
  publisher: z.string().min(1),
  url: z.url(),
  license: z.string().min(1),
  note: z.string().optional(),
});
export type Source = z.infer<typeof SourceSchema>;

export const BaseProjectSchema = z.object({
  slug: z.string().regex(/^[a-z0-9]+(-[a-z0-9]+)*$/),
  title: z.string().min(1),
  summary: z.string().min(1),
  difficulty: z.enum(["easy", "medium", "hard"]),
  timeMinutes: z.number().int().positive(),
  materials: z.array(z.object({ id: MaterialId, qty: z.number().positive(), unit: z.string().optional(), optional: z.boolean().optional() })).min(1),
  tools: z.array(z.object({ id: ToolId, optional: z.boolean().optional() })),
  wasteDiverted: z.array(z.object({ materialId: MaterialId, grams: z.number().positive() })),
  sources: z.array(SourceSchema).min(1),
  scene: SceneSchema,
  /** Default camera for the overview (step 0). */
  camera: CameraSchema.optional(),
  steps: z.array(StepSchema).min(1),
});

/** A project, including checks that need the scene: unique ids and every op target existing when applied. */
export const ProjectSchema = BaseProjectSchema.superRefine((p, ctx) => {
  for (const issue of validateSteps(p.scene, p.steps)) {
    ctx.addIssue({ code: "custom", message: issue.message, path: issue.path });
  }
});

export type Project = z.infer<typeof ProjectSchema>;
export type ProjectInput = z.input<typeof ProjectSchema>;

/** Identity helper giving catalog authors autocompletion and type checks. */
export function defineProject(p: ProjectInput): ProjectInput {
  return p;
}
