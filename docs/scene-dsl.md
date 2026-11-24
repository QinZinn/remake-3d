# Scene DSL

How a project describes its 3D preview, and how to extend the engine.

Units are **centimetres** and **degrees**. Y is up; a primitive's origin is the centre of its base.

## The one rule

The scene shown at step `k` is a pure function of the steps before it. The two sides below are equal by value (deep equality, as the tests check with `toEqual`), not the same object:

```ts
expect(stateAtStep(project, k)).toEqual(applySteps(project.scene, project.steps.slice(0, k)))
```

`k = 0` is the overview (nothing applied); `k = n` is after the last step. The renderer never keeps its own scene state; it only animates the transition between two of these states. That is why scrubbing forward and back is exact, and why all of it is unit-tested without WebGL.

| File | Role |
| --- | --- |
| `lib/taxonomy.ts` | Material and tool ids (EN/VI labels, aliases, `findByText`) |
| `lib/scene/schema.ts` | Zod schemas: `Project`, scene objects, `SceneOp`; `defineProject` |
| `lib/scene/primitives/` | Parametric shapes: pure shape maths (no zod, no three.js); Zod param schemas in `params.ts` |
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
  primitive: "bottle",              // bottle | jar | can | cap | sleeve | solid | tube
  params: { height: 30, radius: 5 },// per primitive; most fields have defaults
  parent?: "tray",                  // transform is relative to this object (declared earlier)
  transform?: { position?, rotation?, scale? },
  material: { preset: "pet", color?: "#rrggbb", opacity? },
  label?: "PET bottle",
  source?: "pet-bottle",            // taxonomy material this object depicts
}
```

Material presets: `pet`, `glass`, `aluminium`, `plastic`, `cardboard`, `fabric`, `soil`, `water`, `wood`, `paint`. Defaults are in `lib/scene/materials.ts`; the look is in `lib/scene/three.ts`. Materials are opaque unless the object is fading, because three.js only shows opaque objects through PET and glass.

**Sizes are validated.** Each primitive's params schema rejects combinations that cannot make a shape (for example a 10 cm bottle that keeps the default 8 cm shoulder). On top of that, `pnpm build` checks every lathe object's profile: y never goes down, no negative radius, and it starts at y = 0. The error names the object and `scene.objects.<i>.params`.

**Parents.** A child's transform is relative to its parent, so it moves, flips and fades with it. The renderer composes world transforms (`resolveFrame` in `ops.ts`). `remove` removes the children too, and `cut` refuses an object that has children.

**Ids are never reused.** Once an object is removed or cut, its id cannot be created again, because transitions match objects by id.

### Cameras

A step's `camera` applies from that step on, until another step sets one. With none, the project's `camera` (or a default) is used. The player flies between them.

## Ops

Every op has `type`, an optional `duration` (seconds) and, except `add`, a `target` that must exist when the op runs. Ops that create objects (`cut`, `add`, `fill`, `thread`) name the new ids, which must not exist yet. The ops of one step play one after another.

| Op | Fields | Effect |
| --- | --- | --- |
| `cut` | `y`, `gap = 1.5`, `parts?: {top, bottom}` | Replaces the target with `<target>.top` and `<target>.bottom`, splitting its lathe profile at local height `y`. The animation draws a cut line around the object, then shows two clipping-plane halves while the top lifts by `gap`. Parts can be cut again (`bottle.top.top`). |
| `remove` | `away = [18, 6, 0]` | Removes the target; it slides by `away` and fades out. |
| `paint` | `color`, `opacity?`, `preset?` | Tweens the colour; can switch to an opaque preset such as `paint`. |
| `transform` | `position?`, `rotation?`, `scale?`, `arc = 0` | Sets an absolute pose. Rotation turns about the middle of the object, and `arc` lifts it mid-move so a flipped part clears what is below. Children come along. |
| `add` | `object` (a full scene object, optional `parent`) | Brings a new object into the scene; it fades in. |
| `fill` | `id?` (default `<target>.fill`), `level = 0.8`, `inset = 0.94`, `material = soil` | Fills a lathe container to `level` of its height, from whichever end is lowest in the world (so an upside-down pot fills from its neck). Creates a `solid` child of the container; it rises behind a moving clipping plane. |
| `thread` | `id`, `path` (≥ 2 points in the target's frame), `radius = 0.3`, `material = fabric` | Creates a `tube` child of the target along the path (a wick, string or wire); it grows from the first point to the last. |

Tip for flips: a part keeps its parent's local frame (origin at the original base). Rotating 180° about X maps local `y` to `-y`, so a part spanning `[a, b]` with `position.y = P` ends up spanning world `[P - b, P - a]`.

Example (the planter's step 8): lift the pot aside, fill the tank, put the pot back, fill the pot.

```ts
ops: [
  { type: "transform", target: "bottle.top", position: [13, 46, 0], arc: 10 },
  { type: "fill", target: "bottle.bottom", id: "water", level: 0.3, material: { preset: "water" } },
  { type: "transform", target: "bottle.top", position: [0, 38.6, 0], arc: 10 },
  { type: "fill", target: "bottle.top", id: "soil", level: 0.85 },
]
```

Planned: `attach` (set a parent while keeping the world pose), `fold`, `glue-highlight`. `rotate` is `transform`.

## Adding an op

1. **Schema**: in `schema.ts`, add a `z.object({ type: z.literal("fold"), ...opBase, ... })` and put it in `SceneOpSchema`.
2. **Handler**: in `ops.ts`, add it to `HANDLERS`. The mapped type makes a missing handler a type error.

```ts
const fold: OpHandler<"fold"> = {
  duration: 1.5,
  targets: (op) => [op.target],               // optional; default [op.target]. Must exist.
  creates: (op) => [],                        // optional; new ids. Must not exist (or have existed).
  check(state, op) { return null; },          // extra checks after targets/creates
  apply(state, op) { return /* new SceneState, never mutate */; },
  frame(prev, next, op, u) { return blendStates(prev, next, u); }, // optional; local frame, u eased 0..1
};
```

A frame item can carry `clip` (a clipping plane in local y, as `cut` and `fill` use) or `reveal` (0..1 of a tube drawn, as `thread` uses).

Rules: `apply` and `frame` must be pure and deterministic (no `Date`, no `Math.random`, no three.js). Return new objects. If the op needs new kinds of visuals (a liquid level, a string), add a variant to `Effect` in `ops.ts` and draw it in `EffectMesh` in `Player.tsx`.

3. **Tests**: add a case in `lib/scene/scene.test.ts`. Catalog projects are checked automatically (every step applies, every target exists, the end frame of every jump equals the state).

## Adding a primitive

There are two kinds:

- **Lathe** (`defineLathe`): a solid of revolution with `profile(params)` returning `[radius, y]` points from the base centre up, y non-decreasing, starting at y = 0. `cut` and `fill` work only on lathes, because a lathe splits exactly by slicing its profile. Current lathes: bottle, jar, can, cap, sleeve, solid.
- **Mesh** (`defineMesh`): any other shape, with `bounds(params)` for its local box. Its three.js geometry goes in `MESH_GEOMETRY` in `three.ts`; the mapped type makes a missing entry a type error. Current mesh: tube.

Steps:

1. Create `lib/scene/primitives/<name>.ts` with the pure shape function (import its params type with `import type`, so the client bundle has no zod).
2. Add its Zod params schema to `primitives/params.ts` (`PRIMITIVE_PARAMS`), with `.refine` checks for sizes that cannot make a shape.
3. Register it in `PRIMITIVES` (`primitives/index.ts`) and add a branch to `SceneObjectSchema` (`schema.ts`). A test fails if a registered primitive has no schema branch.

## Player

`<Player project step onStepChange speed? record? />` from `lib/scene/Player.tsx` is client-only; load it with `next/dynamic` and `ssr: false`. The project page reads `?speed=0.25` (slow motion, for recording the demo) and `?record=1` (keeps the canvas capturable), and keeps `#step-N` in the URL.

It renders on demand: frames are drawn only while a transition or camera flight runs or the user orbits, at a pixel ratio of at most 1.5 that drops to 1 on slow devices. If a step changes mid-animation, the new transition starts from what is on screen.
