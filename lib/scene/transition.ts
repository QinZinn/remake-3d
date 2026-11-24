/**
 * Transitions between two step states, sampled as pure `Frame`s.
 *
 * Moving forward by exactly one step plays that step's ops one after another
 * (each with its own animation). Any other jump (back, or several steps)
 * blends the two states directly. Either way the end frame is exactly the
 * target state, so scrubbing is exact.
 */
import { applyOp, applySteps, blendStates, frameOf, opDuration, opFrame, type Frame, type SceneState } from "./ops";
import { clamp01, easeInOut } from "./math";
import type { CameraView, Project, SceneOp } from "./schema";

interface Phase {
  prev: SceneState;
  next: SceneState;
  op: SceneOp;
  start: number;
  end: number;
}

export interface Transition {
  from: SceneState;
  to: SceneState;
  /** Seconds. 0 means "show `to` immediately". */
  duration: number;
  phases: Phase[] | null;
}

export const JUMP_DURATION = 0.9;
export const CAMERA_ONLY_DURATION = 1.0;

type Steps = Project["steps"];
type HasScene = Pick<Project, "scene" | "steps">;

/** State shown at step index k: 0 = before any step, k = after step k. */
export function stateAtStep(project: HasScene, k: number): SceneState {
  return applySteps(project.scene, project.steps.slice(0, clampStep(project.steps, k)));
}

export function clampStep(steps: Steps, k: number): number {
  return Math.max(0, Math.min(steps.length, Math.trunc(k)));
}

export function planTransition(project: HasScene, fromStep: number, toStep: number, from = stateAtStep(project, fromStep)): Transition {
  const to = stateAtStep(project, toStep);
  if (fromStep === toStep) return { from, to, duration: 0, phases: null };
  if (toStep === fromStep + 1) {
    const ops = project.steps[toStep - 1].ops;
    if (ops.length === 0) return { from, to, duration: CAMERA_ONLY_DURATION, phases: null };
    const phases: Phase[] = [];
    let state = from;
    let t = 0;
    for (const op of ops) {
      const next = applyOp(state, op);
      const d = opDuration(op);
      phases.push({ prev: state, next, op, start: t, end: t + d });
      state = next;
      t += d;
    }
    return { from, to, duration: t, phases };
  }
  return { from, to, duration: JUMP_DURATION, phases: null };
}

/** Frame at `time` seconds into the transition. */
export function sampleTransition(tr: Transition, time: number): Frame {
  if (tr.duration <= 0 || time >= tr.duration) return frameOf(tr.to);
  if (time <= 0) return frameOf(tr.from);
  if (!tr.phases) return blendStates(tr.from, tr.to, easeInOut(time / tr.duration));
  const ph = tr.phases.find((p) => time < p.end) ?? tr.phases[tr.phases.length - 1];
  const u = easeInOut(clamp01((time - ph.start) / (ph.end - ph.start)));
  return opFrame(ph.prev, ph.next, ph.op, u);
}

export const DEFAULT_CAMERA: CameraView = { position: [38, 30, 52], target: [0, 14, 0] };

/** Camera for step k: the latest camera given at or before k, else the project's, else a default. */
export function cameraAtStep(project: Pick<Project, "steps" | "camera">, k: number): CameraView {
  for (let i = Math.min(k, project.steps.length); i >= 1; i--) {
    const c = project.steps[i - 1].camera;
    if (c) return c;
  }
  return project.camera ?? DEFAULT_CAMERA;
}
