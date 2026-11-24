/**
 * Scene ops: a pure reducer over scene state, plus how each op animates.
 *
 * Design rule: the state shown at step k is `applySteps(scene, steps.slice(0, k))`.
 * Nothing here touches three.js or the DOM, so it runs in unit tests and in
 * `pnpm build` validation. The renderer only draws `Frame`s.
 *
 * Adding an op: add its Zod schema to `SceneOpSchema` (schema.ts), then add a
 * handler to `HANDLERS` below. The mapped type makes a missing handler a type error.
 */
import { PRESET_DEFAULTS } from "./materials";
import { add3, clamp01, easeOut, lerp, lerp3, lerpColor, rotate3, type V3 } from "./math";
import { profileOf, profileRange, radiusAt, sliceProfile, type PrimitiveId, type ProfilePoint } from "./primitives";
import type { OpOf, OpType, RenderMaterial, Scene, SceneOp, Step } from "./schema";

// ---------------------------------------------------------------- state

export interface ObjectState {
  id: string;
  primitive: PrimitiveId;
  params: Readonly<Record<string, number>>;
  /** Kept y range of the lathe profile, or null for the whole shape. */
  slice: readonly [number, number] | null;
  position: V3;
  /** Euler XYZ, degrees. */
  rotation: V3;
  scale: V3;
  preset: RenderMaterial["preset"];
  color: string;
  opacity: number;
  label?: string;
  source?: string;
}

export interface SceneState {
  readonly objects: readonly ObjectState[];
}

export function initialState(scene: Scene): SceneState {
  return {
    objects: scene.objects.map((o) => {
      const d = PRESET_DEFAULTS[o.material.preset];
      return {
        id: o.id,
        primitive: o.primitive,
        params: o.params as Record<string, number>,
        slice: null,
        position: [...o.transform.position] as V3,
        rotation: [...o.transform.rotation] as V3,
        scale: [...o.transform.scale] as V3,
        preset: o.material.preset,
        color: o.material.color ?? d.color,
        opacity: o.material.opacity ?? d.opacity,
        label: o.label,
        source: o.source,
      };
    }),
  };
}

export function findObject(state: SceneState, id: string): ObjectState | undefined {
  return state.objects.find((o) => o.id === id);
}

/** The y range an object currently covers in its local frame. */
export function extentOf(o: ObjectState): [number, number] {
  return o.slice ? [o.slice[0], o.slice[1]] : profileRange(fullProfile(o));
}

const profileCache = new WeakMap<object, ProfilePoint[]>();

/** Full (unsliced) profile of an object, memoised on its params object. */
export function fullProfile(o: Pick<ObjectState, "primitive" | "params">): ProfilePoint[] {
  let p = profileCache.get(o.params);
  if (!p) {
    p = profileOf(o.primitive, o.params);
    profileCache.set(o.params, p);
  }
  return p;
}

/** The profile an object currently has (sliced after a cut). */
export function currentProfile(o: ObjectState): ProfilePoint[] {
  const full = fullProfile(o);
  return o.slice ? sliceProfile(full, o.slice[0], o.slice[1]) : full;
}

function replace(state: SceneState, id: string, next: ObjectState[]): SceneState {
  const i = state.objects.findIndex((o) => o.id === id);
  return { objects: [...state.objects.slice(0, i), ...next, ...state.objects.slice(i + 1)] };
}

function update(state: SceneState, id: string, patch: Partial<ObjectState>): SceneState {
  const o = findObject(state, id)!;
  return replace(state, id, [{ ...o, ...patch }]);
}

// ---------------------------------------------------------------- frames

/** One drawable at one instant. `clip` keeps only the local half-space above/below y. */
export interface RenderItem extends ObjectState {
  key: string;
  clip?: { y: number; keep: "above" | "below" };
}

/** Non-object visuals, positioned in the host object's local frame. */
export interface CutLineEffect {
  kind: "cut-line";
  key: string;
  host: Pick<ObjectState, "position" | "rotation" | "scale">;
  y: number;
  radius: number;
  /** 0..1 of the way around. */
  progress: number;
}
export type Effect = CutLineEffect;

export interface Frame {
  items: RenderItem[];
  effects: Effect[];
}

export function frameOf(state: SceneState): Frame {
  return { items: state.objects.map((o) => ({ ...o, key: o.id })), effects: [] };
}

/**
 * Interpolate two poses of one object. Rotation turns about the middle of the
 * object's extent (not its origin at the base), so a flipped part turns in place
 * instead of swinging around the floor.
 */
function blendObject(a: ObjectState, b: ObjectState, u: number): ObjectState {
  const [lo, hi] = extentOf(b);
  const pivot: V3 = [0, (lo + hi) / 2, 0];
  const rotation = lerp3(a.rotation, b.rotation, u);
  const pa = add3(a.position, rotate3(pivot, a.rotation));
  const pb = add3(b.position, rotate3(pivot, b.rotation));
  const pivotWorld = lerp3(pa, pb, u);
  const r = rotate3(pivot, rotation);
  return {
    ...b,
    position: [pivotWorld[0] - r[0], pivotWorld[1] - r[1], pivotWorld[2] - r[2]],
    rotation,
    scale: lerp3(a.scale, b.scale, u),
    color: lerpColor(a.color, b.color, u),
    opacity: lerp(a.opacity, b.opacity, u),
    preset: u < 0.5 ? a.preset : b.preset,
    slice: u < 0.5 ? a.slice : b.slice,
  };
}

/**
 * Generic transition between any two states: shared objects interpolate,
 * objects only in `a` fade out, objects only in `b` fade in.
 */
export function blendStates(a: SceneState, b: SceneState, u: number): Frame {
  const items: RenderItem[] = [];
  for (const nb of b.objects) {
    const na = findObject(a, nb.id);
    const o = na ? blendObject(na, nb, u) : { ...nb, opacity: nb.opacity * u };
    items.push({ ...o, key: o.id });
  }
  for (const na of a.objects) {
    if (!findObject(b, na.id)) items.push({ ...na, key: na.id, opacity: na.opacity * (1 - u) });
  }
  return { items, effects: [] };
}

// ---------------------------------------------------------------- handlers

export interface OpHandler<T extends OpType> {
  /** Default forward animation length, seconds. */
  duration: number;
  /** Extra validity checks; the target's existence is checked for every op. */
  check?(state: SceneState, op: OpOf<T>): string | null;
  apply(state: SceneState, op: OpOf<T>): SceneState;
  /** Frame at eased progress u (0..1) from `prev` to `next`. Defaults to `blendStates`. */
  frame?(prev: SceneState, next: SceneState, op: OpOf<T>, u: number): Frame;
}

export function cutPartIds(op: OpOf<"cut">) {
  return op.parts ?? { top: `${op.target}.top`, bottom: `${op.target}.bottom` };
}

const CUT_SWEEP = 0.55; // share of the cut animation spent drawing the cut line

const cut: OpHandler<"cut"> = {
  duration: 2.2,
  check(state, op) {
    const o = findObject(state, op.target)!;
    const [lo, hi] = extentOf(o);
    if (!(op.y > lo + 0.05 && op.y < hi - 0.05)) return `cut y=${op.y} is outside ${op.target} (y ${lo.toFixed(2)}..${hi.toFixed(2)})`;
    const { top, bottom } = cutPartIds(op);
    if (top === bottom) return "cut parts need two different ids";
    for (const id of [top, bottom]) if (findObject(state, id)) return `cut part id \`${id}\` already exists`;
    return null;
  },
  apply(state, op) {
    const o = findObject(state, op.target)!;
    const [lo, hi] = extentOf(o);
    const { top, bottom } = cutPartIds(op);
    const lift = rotate3([0, op.gap, 0], o.rotation);
    return replace(state, op.target, [
      { ...o, id: bottom, slice: [lo, op.y] },
      { ...o, id: top, slice: [op.y, hi], position: add3(o.position, lift) },
    ]);
  },
  frame(prev, _next, op, u) {
    const o = findObject(prev, op.target)!;
    const others = prev.objects.filter((x) => x.id !== op.target).map((x) => ({ ...x, key: x.id }));
    const profile = currentProfile(o);
    const line: CutLineEffect = {
      kind: "cut-line",
      key: `${op.target}#cut`,
      host: o,
      y: op.y,
      radius: radiusAt(profile, op.y),
      progress: 1,
    };
    if (u <= CUT_SWEEP) {
      return { items: [...others, { ...o, key: o.id }], effects: [{ ...line, progress: u / CUT_SWEEP }] };
    }
    const v = easeOut(clamp01((u - CUT_SWEEP) / (1 - CUT_SWEEP)));
    const lift = rotate3([0, op.gap * v, 0], o.rotation);
    return {
      items: [
        ...others,
        { ...o, key: `${o.id}#below`, clip: { y: op.y, keep: "below" } },
        { ...o, key: `${o.id}#above`, clip: { y: op.y, keep: "above" }, position: add3(o.position, lift) },
      ],
      effects: v < 0.6 ? [{ ...line, progress: 1 }] : [],
    };
  },
};

const remove: OpHandler<"remove"> = {
  duration: 1.2,
  apply(state, op) {
    return replace(state, op.target, []);
  },
  frame(prev, _next, op, u) {
    return {
      items: prev.objects.map((x) =>
        x.id === op.target
          ? { ...x, key: x.id, position: add3(x.position, lerp3([0, 0, 0], op.away, u)), opacity: x.opacity * (1 - u) }
          : { ...x, key: x.id },
      ),
      effects: [],
    };
  },
};

const paint: OpHandler<"paint"> = {
  duration: 1.0,
  apply(state, op) {
    const o = findObject(state, op.target)!;
    return update(state, op.target, { color: op.color, opacity: op.opacity ?? o.opacity, preset: op.preset ?? o.preset });
  },
};

const transform: OpHandler<"transform"> = {
  duration: 1.4,
  check(_state, op) {
    return op.position || op.rotation || op.scale ? null : "transform needs position, rotation or scale";
  },
  apply(state, op) {
    const o = findObject(state, op.target)!;
    return update(state, op.target, {
      position: op.position ? ([...op.position] as V3) : o.position,
      rotation: op.rotation ? ([...op.rotation] as V3) : o.rotation,
      scale: op.scale ? ([...op.scale] as V3) : o.scale,
    });
  },
  frame(prev, next, op, u) {
    const f = blendStates(prev, next, u);
    if (op.arc > 0) {
      const lift = op.arc * Math.sin(Math.PI * u);
      f.items = f.items.map((it) => (it.id === op.target ? { ...it, position: [it.position[0], it.position[1] + lift, it.position[2]] } : it));
    }
    return f;
  },
};

export const HANDLERS: { [K in OpType]: OpHandler<K> } = { cut, remove, paint, transform };

function handlerOf<T extends OpType>(op: OpOf<T>): OpHandler<T> {
  return HANDLERS[op.type as T];
}

/** Why `op` cannot be applied to `state`, or null if it can. */
export function checkOp(state: SceneState, op: SceneOp): string | null {
  if (!findObject(state, op.target)) return `op \`${op.type}\` targets unknown object \`${op.target}\` (present: ${state.objects.map((o) => o.id).join(", ") || "none"})`;
  return handlerOf(op).check?.(state, op as never) ?? null;
}

export function applyOp(state: SceneState, op: SceneOp): SceneState {
  const err = checkOp(state, op);
  if (err) throw new Error(err);
  return handlerOf(op).apply(state, op as never);
}

export function opDuration(op: SceneOp): number {
  return op.duration ?? handlerOf(op).duration;
}

export function opFrame(prev: SceneState, next: SceneState, op: SceneOp, u: number): Frame {
  const h = handlerOf(op);
  return h.frame ? h.frame(prev, next, op as never, u) : blendStates(prev, next, u);
}

/** Scene state after applying every op of `steps`, in order. */
export function applySteps(scene: Scene, steps: readonly Pick<Step, "ops">[]): SceneState {
  return applyStepsFrom(initialState(scene), steps);
}

export function applyStepsFrom(state: SceneState, steps: readonly Pick<Step, "ops">[]): SceneState {
  for (const step of steps) for (const op of step.ops) state = applyOp(state, op);
  return state;
}
