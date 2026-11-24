# Scene DSL

How a project describes its 3D preview, and how to extend the engine.

Units are **centimetres** and **degrees**. Y is up; a primitive's origin is the centre of its base.

## The one rule

The scene shown at step `k` is a pure function:

```ts
stateAtStep(project, k) === applySteps(project.scene, project.steps.slice(0, k))
```

`k = 0` is the overview (nothing applied); `k = n` is after the last step. The renderer never keeps its own scene state; it only animates the transition between two of these states. That is why scrubbing forward and back is exact, and why all of it is unit-tested without WebGL.

| File | Role |
| --- | --- |
| `lib/taxonomy.ts` | Material and tool ids (EN/VI labels, aliases, `findByText`) |
| `lib/scene/schema.ts` | Zod schemas: `Project`, scene objects, `SceneOp`; `defineProject` |
| `lib/scene/primitives/` | Parametric shapes (lathe profiles) |
| `lib/scene/ops.ts` | Op handlers: validate, apply (reducer), animate (frames) |
| `lib/scene/validate.ts` | Simulates all steps; used by `ProjectSchema` |
| `lib/scene/transition.ts` | `stateAtStep`, `planTransition`, `sampleTransition`, `cameraAtStep` |
| `lib/scene/three.ts`, `Player.tsx` | The only three.js / React code |
| `content/projects/*.ts` | Catalog; `index.ts` parses every project at load time |

## A project

```ts
import { defineProject } from "@/lib/scene/schema";

export default defineProject({
  slug: "my-project",                       // kebab-case, used in the URL
  title, summary, difficulty: "easy", timeMinutes: 20,
  materials: [{ id: "pet-bottle", qty: 1, unit: "2 L bottle", optional?: true }],
  tools: [{ id: "utility-knife" }],          // ids must exist in lib/taxonomy.ts
  wasteDiverted: [{ materialId: "pet-bottle", grams: 40 }],
  sources: [{ title, publisher, url, license, note? }],   // url + license required
  camera?: { position: [x, y, z], target: [x, y, z] },    // overview camera
  scene: { objects: [ /* see below */ ] },
  steps: [{ title, text, tip?, warning?, ops: [ /* SceneOp */ ], camera? }],
});
```

Then add it to `RAW` in `content/projects/index.ts`. An invalid project (unknown taxonomy id, unknown op target, a cut outside the object, duplicate ids) throws when the module loads, so `pnpm test` and `pnpm build` fail with a message such as:

```
Invalid project "pet-self-watering-planter":
  - steps.5.ops.0: step 6: op `transform` targets unknown object `bottle.lid` (present: bottle.bottom, bottle.top)
```

Write step text in your own words. Cite only URLs you have opened, with their license.

### Scene objects

```ts
{
  id: "bottle",                     // lower-case, dot-separated segments
  primitive: "bottle",              // bottle | jar | can | cap | sleeve
  params: { height: 30, radius: 5 },// per primitive, every field has a default
  transform?: { position?, rotation?, scale? },
  material: { preset: "pet", color?: "#rrggbb", opacity? },
  label?: "PET bottle",
  source?: "pet-bottle",            // taxonomy material this object depicts
}
```

Material presets: `pet`, `glass`, `aluminium`, `plastic`, `cardboard`, `fabric`, `soil`, `wood`, `paint`. Defaults are in `lib/scene/materials.ts`; the look is in `lib/scene/three.ts`.

### Cameras

A step's `camera` applies from that step on, until another step sets one. With none, the project's `camera` (or a default) is used. The player flies between them.

## Ops

Every op has `type`, `target` (an object id that must exist when the op runs) and an optional `duration` (seconds). The ops of one step play one after another.

| Op | Fields | Effect |
| --- | --- | --- |
| `cut` | `y`, `gap = 1.5`, `parts?: {top, bottom}` | Replaces the target with `<target>.top` and `<target>.bottom`, splitting its lathe profile at local height `y`. The animation draws a cut line around the object, then shows two clipping-plane halves while the top lifts by `gap`. Parts can be cut again (`bottle.top.top`). |
| `remove` | `away = [18, 6, 0]` | Removes the target; it slides by `away` and fades out. |
| `paint` | `color`, `opacity?`, `preset?` | Tweens the colour; can switch to an opaque preset such as `paint`. |
| `transform` | `position?`, `rotation?`, `scale?`, `arc = 0` | Sets an absolute pose. Rotation turns about the middle of the object, and `arc` lifts it mid-move so a flipped part clears what is below. |

Tip for flips: a part keeps its parent's local frame (origin at the original base). Rotating 180° about X maps local `y` to `-y`, so a part spanning `[a, b]` with `position.y = P` ends up spanning world `[P - b, P - a]`.

Planned (later features): `attach`, `fill`, `rotate`, `fold`, `thread`, `glue-highlight`. A step that needs one of these can be text-only until then.

## Adding an op

1. **Schema**: in `schema.ts`, add a `z.object({ type: z.literal("fill"), ...opBase, ... })` and put it in `SceneOpSchema`.
2. **Handler**: in `ops.ts`, add it to `HANDLERS`. The mapped type makes a missing handler a type error.

```ts
const fill: OpHandler<"fill"> = {
  duration: 1.5,
  check(state, op) { return null; },          // extra checks; the target's existence is already checked
  apply(state, op) { return /* new SceneState, never mutate */; },
  frame(prev, next, op, u) { return blendStates(prev, next, u); }, // optional; u is eased 0..1
};
```

Rules: `apply` and `frame` must be pure and deterministic (no `Date`, no `Math.random`, no three.js). Return new objects. If the op needs new kinds of visuals (a liquid level, a string), add a variant to `Effect` in `ops.ts` and draw it in `EffectMesh` in `Player.tsx`.

3. **Tests**: add a case in `lib/scene/scene.test.ts`. Catalog projects are checked automatically (every step applies, every target exists, the end frame of every jump equals the state).

## Adding a primitive

1. Create `lib/scene/primitives/<name>.ts` with `definePrimitive({ id, label, params, profile })`. `params` is a Zod object where every field has a default; `profile(params)` returns `[radius, y]` points from the base centre to the top, with y non-decreasing.
2. Register it in `PRIMITIVES` (`primitives/index.ts`) and add a branch to `SceneObjectSchema` (`schema.ts`). A test fails if a registered primitive has no schema branch.

All current primitives are lathes, which is what lets `cut` split them. A non-lathe primitive (a box, a sheet of cardboard) needs its own geometry builder in `three.ts` and a decision about which ops it supports (its handler's `check` should reject the rest).

## Player

`<Player project step onStepChange speed? />` from `lib/scene/Player.tsx` is client-only; load it with `next/dynamic` and `ssr: false`. The project page passes `?speed=0.25` through for slow motion (useful for recording the demo) and keeps `#step-N` in the URL.
