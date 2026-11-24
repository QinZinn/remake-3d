import { applyOp, checkOp, initialState, type SceneState } from "./ops";
import type { Scene, Step } from "./schema";

export interface StepIssue {
  message: string;
  path: (string | number)[];
}

/**
 * Simulate every step against the scene and report what would fail:
 * duplicate object ids, ops on objects that do not exist at that point,
 * and op-specific checks (e.g. a cut outside the object).
 */
export function validateSteps(scene: Scene, steps: readonly Pick<Step, "ops">[]): StepIssue[] {
  const issues: StepIssue[] = [];
  const seen = new Set<string>();
  scene.objects.forEach((o, i) => {
    if (seen.has(o.id)) issues.push({ message: `duplicate object id \`${o.id}\``, path: ["scene", "objects", i, "id"] });
    seen.add(o.id);
  });
  if (issues.length) return issues;

  let state: SceneState = initialState(scene);
  steps.forEach((step, s) => {
    step.ops.forEach((op, k) => {
      const err = checkOp(state, op);
      if (err) issues.push({ message: `step ${s + 1}: ${err}`, path: ["steps", s, "ops", k] });
      else state = applyOp(state, op);
    });
  });
  return issues;
}
