/**
 * Scene ops: a pure reducer over scene state, plus how each op animates.
 *
 * Design rule: the state shown at step k is `applySteps(scene, steps.slice(0, k))`.
 * Nothing here touches three.js, zod or the DOM, so it runs in unit tests, in
 * `pnpm build` validation and in a small client bundle. The renderer only draws `Frame`s.
 *
 * Adding an op: add its Zod schema to `SceneOpSchema` (schema.ts), then add a
 * handler to `HANDLERS` below. The mapped type makes a missing handler a type error.
 */
import { PRESET_DEFAULTS } from "./materials";
import { add3, clamp01, easeOut, eulerToMat, invMat, lerp, lerp3, lerpColor, matToEuler, mulMat, mulMatVec, rotate3, type M3, type V3 } from "./math";
import {
  getPrimitive,
  meshBounds,
  profileMaxRadius,
  profileOf,
  profileRange,
  radiusAt,
  sliceProfile,
  type Bounds,
  type PrimitiveId,
  type ProfilePoint,
} from "./primitives";
import type { OpOf, OpType, RenderMaterial, Scene, SceneObject, SceneOp, Step } from "./schema";

// ---------------------------------------------------------------- state

export interface ObjectState {
  id: string;
  primitive: PrimitiveId;
  /** Parsed params (defaults filled). Numbers for most shapes, point lists for solid/tube. */
  params: Readonly<Record<string, unknown>>;
  /** Kept y range of a lathe profile, or null for the whole shape. */
  slice: readonly [number, number] | null;
  /** Transform is relative to this object when set. */
  parent?: string;
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

function materialState(m: RenderMaterial) {
  const d = PRESET_DEFAULTS[m.preset];
  return { preset: m.preset, color: m.color ?? d.color, opacity: m.opacity ?? d.opacity };
}

export function objectStateFrom(o: SceneObject): ObjectState {
  const s: ObjectState = {
    id: o.id,
    primitive: o.primitive,
    params: o.params as Record<string, unknown>,
    slice: null,
    position: [...o.transform.position] as V3,
    rotation: [...o.transform.rotation] as V3,
    scale: [...o.transform.scale] as V3,
    ...materialState(o.material),
  };
  if (o.parent !== undefined) s.parent = o.parent;
  if (o.label !== undefined) s.label = o.label;
  if (o.source !== undefined) s.source = o.source;
  return s;
}

export function initialState(scene: Scene): SceneState {
  return { objects: scene.objects.map(objectStateFrom) };
}

export function findObject(state: SceneState, id: string): ObjectState | undefined {
  return state.objects.find((o) => o.id === id);
}

export function childrenOf(state: SceneState, id: string): ObjectState[] {
  return state.objects.filter((o) => o.parent === id);
}

/** The object and everything attached to it, depth first. */
export function descendantIds(state: SceneState, id: string): string[] {
  return [id, ...childrenOf(state, id).flatMap((c) => descendantIds(state, c.id))];
}

/** Profiles memoised per params object and primitive; frozen so callers cannot corrupt the cache. */
const profileCache = new WeakMap<object, Map<PrimitiveId, readonly ProfilePoint[]>>();

export function isLatheObject(o: Pick<ObjectState, "primitive">): boolean {
  return getPrimitive(o.primitive).kind === "lathe";
}

/** Full (unsliced) profile of a lathe object, memoised and frozen. */
export function fullProfile(o: Pick<ObjectState, "primitive" | "params">): readonly ProfilePoint[] {
  let byPrimitive = profileCache.get(o.params);
  if (!byPrimitive) {
    byPrimitive = new Map();
    profileCache.set(o.params, byPrimitive);
  }
  let p = byPrimitive.get(o.primitive);
  if (!p) {
    p = Object.freeze(profileOf(o.primitive, o.params).map((pt) => Object.freeze([pt[0], pt[1]] as const)));
    byPrimitive.set(o.primitive, p);
  }
  return p;
}

/** The profile a lathe object currently has (sliced after a cut). */
export function currentProfile(o: Pick<ObjectState, "primitive" | "params" | "slice">): readonly ProfilePoint[] {
  const full = fullProfile(o);
  return o.slice ? sliceProfile(full, o.slice[0], o.slice[1]) : full;
}

/** The y range an object currently covers in its local frame. */
export function extentOf(o: ObjectState): [number, number] {
  if (!isLatheObject(o)) {
    const b = meshBounds(o.primitive, o.params);
    return [b.min[1], b.max[1]];
  }
  return o.slice ? [o.slice[0], o.slice[1]] : profileRange(fullProfile(o));
}

/** Local axis-aligned bounds of an object. */
export function boundsOf(o: ObjectState): Bounds {
  if (!isLatheObject(o)) return meshBounds(o.primitive, o.params);
  const [lo, hi] = extentOf(o);
  const r = profileMaxRadius(currentProfile(o));
  return { min: [-r, lo, -r], max: [r, hi, r] };
}

function replace(state: SceneState, id: string, next: ObjectState[]): SceneState {
  const i = state.objects.findIndex((o) => o.id === id);
  return { objects: [...state.objects.slice(0, i), ...next, ...state.objects.slice(i + 1)] };
}

function update(state: SceneState, id: string, patch: Partial<ObjectState>): SceneState {
  const o = findObject(state, id)!;
  return replace(state, id, [{ ...o, ...patch }]);
}

/** Rotation × scale of one object (its local linear transform). */
export function linearOf(o: Pick<ObjectState, "rotation" | "scale">): M3 {
  const r = eulerToMat(o.rotation);
  const [sx, sy, sz] = o.scale;
  return [r[0] * sx, r[1] * sy, r[2] * sz, r[3] * sx, r[4] * sy, r[5] * sz, r[6] * sx, r[7] * sy, r[8] * sz];
}

/** World linear transform (rotation and scale, parents included) of an object. */
export function worldLinear(state: SceneState, id: string, depth = 0): M3 {
  const o = findObject(state, id)!;
  const own = linearOf(o);
  return o.parent && depth < 32 && findObject(state, o.parent) ? mulMat(worldLinear(state, o.parent, depth + 1), own) : own;
}

// ---------------------------------------------------------------- frames

type Pose = { rotation: V3; scale: V3 };

function composeChain(chain: readonly Pose[]): M3 {
  return chain.reduce<M3>((m, link) => mulMat(m, linearOf(link)), [1, 0, 0, 0, 1, 0, 0, 0, 1]);
}

/** One drawable at one instant, in world space once resolved. */
export interface RenderItem extends ObjectState {
  key: string;
  /** Keep only the local half-space above/below y (clipping plane). */
  clip?: { y: number; keep: "above" | "below" };
  /** 0..1 of the shape drawn along its length (tubes). */
  reveal?: number;
  /**
   * Exact world rotation × scale for an attached object (row-major 3×3). Under a
   * non-uniformly scaled parent this can't be written as Euler + scale, so the
   * renderer uses it with `position` instead of `rotation`/`scale`.
   */
  basis?: M3;
  /**
   * How `basis` was built: the local rotation and scale of each ancestor, root
   * first, then the object's own. Blending interpolates each link and
   * recomposes, so a turning parent or child stays rigid (a matrix lerp
   * would collapse it).
   */
  basisParts?: { chain: Pose[] };
}

/** Non-object visuals, positioned in the host object's frame. */
export interface CutLineEffect {
  kind: "cut-line";
  key: string;
  hostId: string;
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

/**
 * Turn parent-relative transforms into world transforms. Children also take
 * their parent's opacity (so they fade with it). Resolved items have no
 * `parent`, which makes this idempotent.
 */
export function resolveFrame(f: Frame): Frame {
  const byId = new Map<string, RenderItem>();
  for (const it of f.items) if (!byId.has(it.id) || !it.clip) byId.set(it.id, it);
  const done = new Map<RenderItem, RenderItem>();
  const resolve = (it: RenderItem, depth = 0): RenderItem => {
    const hit = done.get(it);
    if (hit) return hit;
    let out: RenderItem = it;
    const parentItem = it.parent ? byId.get(it.parent) : undefined;
    if (parentItem && parentItem !== it && depth < 32) {
      const p = resolve(parentItem, depth + 1);
      const parentLinear = p.basis ?? linearOf(p);
      const pr = eulerToMat(p.rotation);
      out = {
        ...it,
        position: add3(p.position, mulMatVec(parentLinear, it.position)),
        // Approximate pose for blending; `basis` is what gets drawn.
        rotation: matToEuler(mulMat(pr, eulerToMat(it.rotation))),
        scale: [it.scale[0] * p.scale[0], it.scale[1] * p.scale[1], it.scale[2] * p.scale[2]],
        opacity: it.opacity * p.opacity,
        basis: mulMat(parentLinear, linearOf(it)),
        basisParts: { chain: [...(p.basisParts?.chain ?? [{ rotation: p.rotation, scale: p.scale }]), { rotation: it.rotation, scale: it.scale }] },
      };
    }
    if (out.parent !== undefined) {
      const { parent: _drop, ...rest } = out; // eslint-disable-line @typescript-eslint/no-unused-vars
      out = rest;
    }
    done.set(it, out);
    return out;
  };
  const items = f.items.map((it) => resolve(it));
  const effects = f.effects.map((e) => {
    const host = items.find((i) => i.id === e.hostId && !i.clip) ?? items.find((i) => i.id === e.hostId);
    return host ? { ...e, host: { position: host.position, rotation: host.rotation, scale: host.scale } } : e;
  });
  return { items, effects };
}

/** Local (unresolved) frame of a state. */
export function localFrameOf(state: SceneState): Frame {
  return { items: state.objects.map((o) => ({ ...o, key: o.id })), effects: [] };
}

/** World-space frame of a state: what the renderer draws when nothing moves. */
export function frameOf(state: SceneState): Frame {
  return resolveFrame(localFrameOf(state));
}

/**
 * Interpolate two poses about a local pivot. By default a flipped part turns
 * about the centre of its bounds.
 */
export function blendObject<T extends ObjectState>(a: ObjectState, b: T, u: number, localPivot?: V3): T {
  const bb = boundsOf(b);
  const pivot = localPivot ?? lerp3(bb.min, bb.max, 0.5);
  const scaled = (s: readonly number[]): V3 => [pivot[0] * s[0], pivot[1] * s[1], pivot[2] * s[2]];
  const rotation = lerp3(a.rotation, b.rotation, u);
  const scale = lerp3(a.scale, b.scale, u);
  const pa = add3(a.position, rotate3(scaled(a.scale), a.rotation));
  const pb = add3(b.position, rotate3(scaled(b.scale), b.rotation));
  const pivotWorld = lerp3(pa, pb, u);
  const r = rotate3(scaled(scale), rotation);
  return {
    ...b,
    position: [pivotWorld[0] - r[0], pivotWorld[1] - r[1], pivotWorld[2] - r[2]],
    rotation,
    scale,
    color: lerpColor(a.color, b.color, u),
    opacity: lerp(a.opacity, b.opacity, u),
    preset: u < 0.5 ? a.preset : b.preset,
    slice: u < 0.5 ? a.slice : b.slice,
  };
}

/**
 * Generic transition between any two states (local frames): shared objects
 * interpolate, objects only in `a` fade out, objects only in `b` fade in.
 */
export function blendStates(a: SceneState, b: SceneState, u: number, pivot?: { id: string; point: V3 }): Frame {
  const items: RenderItem[] = [];
  for (const nb of b.objects) {
    const na = findObject(a, nb.id);
    const localPivot = pivot?.id === nb.id ? pivot.point : undefined;
    const o = na ? blendObject(na, nb, u, localPivot) : { ...nb, opacity: nb.opacity * u };
    items.push({ ...o, key: o.id });
  }
  for (const na of a.objects) {
    if (!findObject(b, na.id)) items.push({ ...na, key: na.id, opacity: na.opacity * (1 - u) });
  }
  return { items, effects: [] };
}

/**
 * Blend two resolved (world-space) frames, matching items by key, then by id.
 * Used when an animation is interrupted: the new transition starts from what
 * is on screen instead of popping to the end of the old one.
 */
export function blendFrames(a: Frame, b: Frame, u: number): Frame {
  const used = new Set<RenderItem>();
  const items: RenderItem[] = [];
  for (const ib of b.items) {
    // Only pose-match compatible items: a clipped half and a whole object cross-fade instead.
    const compatible = (x: RenderItem) => !used.has(x) && (x.clip?.keep ?? null) === (ib.clip?.keep ?? null);
    const ia = a.items.find((x) => compatible(x) && x.key === ib.key) ?? a.items.find((x) => compatible(x) && x.id === ib.id);
    if (ia) {
      used.add(ia);
      const o: RenderItem = { ...blendObject(ia, ib, u), key: ib.key };
      if (ib.clip) o.clip = ib.clip;
      else delete o.clip;
      // Attached objects keep an exact transform the whole way (no snap to the approximate pose).
      if (ia.basis || ib.basis) {
        const pa = ia.basisParts, pb = ib.basisParts;
        if (u >= 1) {
          o.basis = ib.basis ?? linearOf(ib);
          if (pb) o.basisParts = pb;
          else delete o.basisParts;
        } else if (pa && pb && pa.chain.length === pb.chain.length) {
          // Interpolate every link's rotation and scale, then recompose.
          const chain = pa.chain.map((la, i) => ({ rotation: lerp3(la.rotation, pb.chain[i].rotation, u), scale: lerp3(la.scale, pb.chain[i].scale, u) }));
          o.basis = composeChain(chain);
          o.basisParts = { chain };
        } else {
          // One side is not attached: blend the approximate pose and fade out each side's residual.
          const approx = linearOf(o);
          const resA = (ia.basis ?? linearOf(ia)).map((v, i) => v - linearOf(ia)[i]);
          const resB = (ib.basis ?? linearOf(ib)).map((v, i) => v - linearOf(ib)[i]);
          o.basis = approx.map((v, i) => v + (1 - u) * resA[i] + u * resB[i]) as M3;
          delete o.basisParts;
        }
      } else {
        delete o.basis;
        delete o.basisParts;
      }
      if (ia.reveal !== undefined || ib.reveal !== undefined) o.reveal = lerp(ia.reveal ?? 1, ib.reveal ?? 1, u);
      items.push(o);
    } else items.push({ ...ib, opacity: ib.opacity * u });
  }
  // Outgoing items keep their own pose; rename a key the incoming side also uses (an interrupted fill).
  const taken = new Set(items.map((i) => i.key));
  for (const ia of a.items) {
    if (used.has(ia)) continue;
    let key = ia.key;
    while (taken.has(key)) key = `${key}#out`;
    taken.add(key);
    items.push({ ...ia, key, opacity: ia.opacity * (1 - u) });
  }
  return { items, effects: u < 0.5 ? a.effects : b.effects };
}

// ---------------------------------------------------------------- handlers

export interface OpHandler<T extends OpType> {
  /** Default forward animation length, seconds. */
  duration: number;
  /** Ids that must exist when the op runs. Default: `[op.target]`. */
  targets?(op: OpOf<T>): string[];
  /** Ids the op brings into the scene; they must not exist yet. */
  creates?(op: OpOf<T>): string[];
  /** Extra validity checks, after targets/creates were checked. */
  check?(state: SceneState, op: OpOf<T>): string | null;
  apply(state: SceneState, op: OpOf<T>): SceneState;
  /** Local frame at eased progress u (0..1) from `prev` to `next`. Defaults to `blendStates`. */
  frame?(prev: SceneState, next: SceneState, op: OpOf<T>, u: number): Frame;
}

export function cutPartIds(op: OpOf<"cut">) {
  return op.parts ?? { top: `${op.target}.top`, bottom: `${op.target}.bottom` };
}

const CUT_SWEEP = 0.55; // share of the cut animation spent drawing the cut line

/** Offset that moves a part `gap` cm along its own (rotated, possibly mirrored) local +y. */
/**
 * Position offset (in the object's parent frame) that moves it `gap` world cm
 * along its own +y, accounting for its rotation, mirroring and every parent's
 * rotation and scale.
 */
function liftAlongLocalY(state: SceneState, o: ObjectState, gap: number): V3 {
  const parentLinear: M3 = o.parent && findObject(state, o.parent) ? worldLinear(state, o.parent) : [1, 0, 0, 0, 1, 0, 0, 0, 1];
  const dir = mulMatVec(mulMat(parentLinear, linearOf(o)), [0, 1, 0]);
  const len = Math.hypot(dir[0], dir[1], dir[2]);
  if (len < 1e-12) return [0, 0, 0];
  const worldOffset: V3 = [(dir[0] / len) * gap, (dir[1] / len) * gap, (dir[2] / len) * gap];
  const inv = invMat(parentLinear);
  return inv ? mulMatVec(inv, worldOffset) : worldOffset;
}

const cut: OpHandler<"cut"> = {
  duration: 2.2,
  creates: (op) => [cutPartIds(op).top, cutPartIds(op).bottom],
  check(state, op) {
    const o = findObject(state, op.target)!;
    if (!isLatheObject(o)) return `cut needs a lathe object; \`${op.target}\` is a ${o.primitive}`;
    const kids = childrenOf(state, op.target);
    if (kids.length) return `cut: \`${op.target}\` has attached objects (${kids.map((c) => c.id).join(", ")}); cut it before attaching`;
    const [lo, hi] = extentOf(o);
    if (!(op.y > lo + 0.05 && op.y < hi - 0.05)) return `cut y=${op.y} is outside ${op.target} (y ${lo.toFixed(2)}..${hi.toFixed(2)})`;
    return null;
  },
  apply(state, op) {
    const o = findObject(state, op.target)!;
    const [lo, hi] = extentOf(o);
    const { top, bottom } = cutPartIds(op);
    const lift = liftAlongLocalY(state, o, op.gap);
    return replace(state, op.target, [
      { ...o, id: bottom, slice: [lo, op.y] },
      { ...o, id: top, slice: [op.y, hi], position: add3(o.position, lift) },
    ]);
  },
  frame(prev, _next, op, u) {
    const o = findObject(prev, op.target)!;
    const others = prev.objects.filter((x) => x.id !== op.target).map((x) => ({ ...x, key: x.id }));
    const line: CutLineEffect = {
      kind: "cut-line",
      key: `${op.target}#cut`,
      hostId: o.id,
      host: o,
      y: op.y,
      radius: radiusAt(currentProfile(o), op.y),
      progress: 1,
    };
    if (u <= CUT_SWEEP) {
      return { items: [...others, { ...o, key: o.id }], effects: [{ ...line, progress: u / CUT_SWEEP }] };
    }
    const v = easeOut(clamp01((u - CUT_SWEEP) / (1 - CUT_SWEEP)));
    const lift = liftAlongLocalY(prev, o, op.gap * v);
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
    const gone = new Set(descendantIds(state, op.target));
    return { objects: state.objects.filter((o) => !gone.has(o.id)) };
  },
  frame(prev, _next, op, u) {
    // Attached objects follow the parent away: they are resolved relative to it.
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
    const pivot = op.pivot ? { id: op.target, point: op.pivot } : undefined;
    const f = blendStates(prev, next, u, pivot);
    if (op.arc > 0) {
      const lift = op.arc * Math.sin(Math.PI * u);
      f.items = f.items.map((it) => (it.id === op.target ? { ...it, position: [it.position[0], it.position[1] + lift, it.position[2]] } : it));
    }
    return f;
  },
};

const attach: OpHandler<"attach"> = {
  duration: 1.1,
  targets: (op) => [op.target, op.parent],
  check(state, op) {
    if (descendantIds(state, op.target).includes(op.parent)) return "attach would create a parent cycle";
    return null;
  },
  apply(state, op) {
    const { position, rotation, scale } = op.transform;
    return update(state, op.target, { parent: op.parent, position: [...position], rotation: [...rotation], scale: [...scale] });
  },
  frame(prev, next, _op, u) {
    return blendFrames(frameOf(prev), frameOf(next), u);
  },
};

const add: OpHandler<"add"> = {
  duration: 0.8,
  targets: (op) => (op.object.parent ? [op.object.parent] : []),
  creates: (op) => [op.object.id],
  apply(state, op) {
    return { objects: [...state.objects, objectStateFrom(op.object)] };
  },
};

export function fillId(op: OpOf<"fill">): string {
  return op.id ?? `${op.target}.fill`;
}

/** The local y range a fill occupies, measured from the container's lowest end in the world. */
function fillRange(state: SceneState, op: OpOf<"fill">): { range: [number, number]; upsideDown: boolean } {
  const o = findObject(state, op.target)!;
  const [lo, hi] = extentOf(o);
  // The container's local +y in the world, including mirrored scales of it and its parents.
  const up = mulMatVec(worldLinear(state, op.target), [0, 1, 0]);
  const upsideDown = up[1] < 0;
  const depth = (hi - lo) * op.level;
  return { range: upsideDown ? [hi - depth, hi] : [lo, lo + depth], upsideDown };
}

const fill: OpHandler<"fill"> = {
  duration: 1.6,
  creates: (op) => [fillId(op)],
  check(state, op) {
    const o = findObject(state, op.target)!;
    return isLatheObject(o) ? null : `fill needs a lathe container; \`${op.target}\` is a ${o.primitive}`;
  },
  apply(state, op) {
    const o = findObject(state, op.target)!;
    const { range } = fillRange(state, op);
    const points = sliceProfile(currentProfile(o), range[0], range[1]).map(([r, y]) => [r * op.inset, y] as [number, number]);
    const filled: ObjectState = {
      id: fillId(op),
      primitive: "solid",
      params: { points },
      slice: null,
      parent: op.target,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      ...materialState(op.material),
    };
    return { objects: [...state.objects, filled] };
  },
  frame(prev, next, op, u) {
    // The fill rises from the bottom: a clipping plane moves up through it.
    const { range, upsideDown } = fillRange(prev, op);
    const level = upsideDown ? range[1] - (range[1] - range[0]) * u : range[0] + (range[1] - range[0]) * u;
    const f = localFrameOf(next);
    f.items = f.items.map((it): RenderItem => (it.id === fillId(op) ? { ...it, clip: { y: level, keep: upsideDown ? "above" : "below" } } : it));
    return f;
  },
};

const thread: OpHandler<"thread"> = {
  duration: 1.8,
  creates: (op) => [op.id],
  apply(state, op) {
    const tubeObj: ObjectState = {
      id: op.id,
      primitive: "tube",
      params: { points: op.path.map((p) => [...p]), radius: op.radius },
      slice: null,
      parent: op.target,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
      ...materialState(op.material),
    };
    return { objects: [...state.objects, tubeObj] };
  },
  frame(_prev, next, op, u) {
    // The tube grows along its path.
    const f = localFrameOf(next);
    f.items = f.items.map((it): RenderItem => (it.id === op.id ? { ...it, reveal: u } : it));
    return f;
  },
};

export const HANDLERS: { [K in OpType]: OpHandler<K> } = { cut, remove, paint, transform, attach, add, fill, thread };

function handlerOf<T extends OpType>(op: OpOf<T>): OpHandler<T> {
  return HANDLERS[op.type as T];
}

/** Ids an op brings into the scene. */
export function createdIds(op: SceneOp): string[] {
  return handlerOf(op).creates?.(op as never) ?? [];
}

function targetsOf(op: SceneOp): string[] {
  const h = handlerOf(op);
  return h.targets ? h.targets(op as never) : [(op as { target: string }).target];
}

/** Why `op` cannot be applied to `state`, or null if it can. */
export function checkOp(state: SceneState, op: SceneOp): string | null {
  for (const id of targetsOf(op)) {
    if (!findObject(state, id)) return `op \`${op.type}\` targets unknown object \`${id}\` (present: ${state.objects.map((o) => o.id).join(", ") || "none"})`;
  }
  const created = createdIds(op);
  if (new Set(created).size !== created.length) return `op \`${op.type}\` creates the same id twice (${created.join(", ")})`;
  for (const id of created) if (findObject(state, id)) return `op \`${op.type}\` would create \`${id}\`, which already exists`;
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

/** World-space frame of `op` at eased progress u. */
export function opFrame(prev: SceneState, next: SceneState, op: SceneOp, u: number): Frame {
  const h = handlerOf(op);
  return resolveFrame(h.frame ? h.frame(prev, next, op as never, u) : blendStates(prev, next, u));
}

/** Scene state after applying every op of `steps`, in order. */
export function applySteps(scene: Scene, steps: readonly Pick<Step, "ops">[]): SceneState {
  return applyStepsFrom(initialState(scene), steps);
}

export function applyStepsFrom(state: SceneState, steps: readonly Pick<Step, "ops">[]): SceneState {
  for (const step of steps) for (const op of step.ops) state = applyOp(state, op);
  return state;
}
