import { applyOp, checkOp, createdIds, initialState, type SceneState } from "./ops";
import { getPrimitive, profileOf, profileProblem } from "./primitives";
import type { Scene, SceneObject, Step } from "./schema";

export interface StepIssue {
  message: string;
  path: (string | number)[];
}

/** Why an object's shape is broken (e.g. params give a profile that folds over), or null. */
export function shapeProblem(o: Pick<SceneObject, "id" | "primitive" | "params">): string | null {
  if (getPrimitive(o.primitive).kind !== "lathe") return null;
  const problem = profileProblem(profileOf(o.primitive, o.params));
  return problem ? `object \`${o.id}\` (${o.primitive}): ${problem}` : null;
}

/**
 * Simulate every step against the scene and report what would fail:
 * broken shapes, duplicate ids, parents that are not declared earlier, ops on
 * objects that do not exist at that point, and op-specific checks.
 */
export function validateSteps(scene: Scene, steps: readonly Pick<Step, "ops">[]): StepIssue[] {
  const issues: StepIssue[] = [];
  const seen = new Set<string>();
  scene.objects.forEach((o, i) => {
    if (seen.has(o.id)) issues.push({ message: `duplicate object id \`${o.id}\``, path: ["scene", "objects", i, "id"] });
    if (o.parent !== undefined && !seen.has(o.parent)) {
      issues.push({ message: `object \`${o.id}\`: parent \`${o.parent}\` must be declared before it`, path: ["scene", "objects", i, "parent"] });
    }
    seen.add(o.id);
    const shape = shapeProblem(o);
    if (shape) issues.push({ message: shape, path: ["scene", "objects", i, "params"] });
  });
  if (issues.length) return issues;

  // Ids are never reused, even after an object is removed: transitions match
  // objects by id, so a reused id would morph one object into another.
  const everSeen = new Set(seen);
  let state: SceneState = initialState(scene);
  steps.forEach((step, s) => {
    step.ops.forEach((op, k) => {
      const shape = op.type === "add" ? shapeProblem(op.object) : null;
      const reused = createdIds(op).find((id) => everSeen.has(id) && !state.objects.some((o) => o.id === id));
      const err = shape ?? (reused ? `op \`${op.type}\` reuses the id \`${reused}\` of an object removed earlier; pick a new id` : null) ?? checkOp(state, op);
      for (const id of createdIds(op)) everSeen.add(id);
      if (err) issues.push({ message: `step ${s + 1}: ${err}`, path: ["steps", s, "ops", k] });
      else state = applyOp(state, op);
    });
  });
  return issues;
}
