import { Euler, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { PROJECTS } from "@/content/projects";
import { rotate3 } from "./math";
import { applyOp, applySteps, applyStepsFrom, blendFrames, boundsOf, checkOp, extentOf, findObject, frameOf, fullProfile, initialState, type Frame, type SceneState } from "./ops";
import { PRIMITIVE_IDS, PRIMITIVES, profileOf, profileProblem, profileRange, sliceProfile, type PrimitiveId } from "./primitives";
import { PRIMITIVE_PARAMS } from "./primitives/params";
import { ProjectSchema, SceneObjectSchema, SceneOpSchema, type ProjectInput, type SceneObjectInput, type SceneOpInput } from "./schema";
import { planTransition, sampleTransition, stateAtStep } from "./transition";

function project(overrides: Partial<ProjectInput> = {}): ProjectInput {
  return {
    slug: "test-project",
    title: "Test",
    summary: "A test project",
    difficulty: "easy",
    timeMinutes: 5,
    materials: [{ id: "pet-bottle", qty: 1 }],
    tools: [{ id: "scissors" }],
    wasteDiverted: [{ materialId: "pet-bottle", grams: 40 }],
    sources: [{ title: "S", publisher: "P", url: "https://example.org/", license: "CC0" }],
    scene: { objects: [{ id: "bottle", primitive: "bottle", material: { preset: "pet" } }] },
    steps: [
      { title: "Cut", text: "Cut it.", ops: [{ type: "cut", target: "bottle", y: 18 }] },
      { title: "Paint", text: "Paint it.", ops: [{ type: "paint", target: "bottle.bottom", color: "#336699" }] },
      { title: "Remove", text: "Take the top away.", ops: [{ type: "remove", target: "bottle.top" }] },
    ],
    ...overrides,
  };
}

const parse = (p: ProjectInput) => ProjectSchema.parse(p);
const op = (o: SceneOpInput) => SceneOpSchema.parse(o);
const obj = (o: SceneObjectInput) => SceneObjectSchema.parse(o);
const params = (id: PrimitiveId, p: object = {}) => PRIMITIVE_PARAMS[id].parse(p);
const messages = (p: ProjectInput) => {
  const r = ProjectSchema.safeParse(p);
  return r.success ? [] : r.error.issues.map((i) => i.message);
};
const steps = (...ops: SceneOpInput[][]) => ops.map((o, i) => ({ title: `s${i + 1}`, text: "x", ops: o }));
const stateWith = (objects: SceneObjectInput[]): SceneState => initialState({ objects: objects.map(obj) });

function deepFreeze<T>(v: T): T {
  if (v && typeof v === "object" && !Object.isFrozen(v)) {
    Object.freeze(v);
    for (const k of Object.keys(v)) deepFreeze((v as Record<string, unknown>)[k]);
  }
  return v;
}

/** Small seeded PRNG so "random" pairs are reproducible. */
function rng(seed: number) {
  return () => {
    seed = (seed * 1664525 + 1013904223) % 4294967296;
    return seed / 4294967296;
  };
}

const ids = (f: Frame) => f.items.map((i) => i.key).sort();

describe("ProjectSchema", () => {
  it("accepts a valid project", () => {
    expect(messages(project())).toEqual([]);
  });

  it("rejects unknown taxonomy ids", () => {
    expect(messages(project({ materials: [{ id: "unobtainium" as never, qty: 1 }] })).length).toBeGreaterThan(0);
    expect(messages(project({ tools: [{ id: "lightsaber" as never }] })).length).toBeGreaterThan(0);
    expect(messages(project({ wasteDiverted: [{ materialId: "nope" as never, grams: 1 }] })).length).toBeGreaterThan(0);
  });

  it("rejects an op whose target does not exist yet", () => {
    const bad = project({ steps: steps([{ type: "paint", target: "bottle.bottom", color: "#336699" }]) });
    expect(messages(bad).join("\n")).toMatch(/unknown object `bottle\.bottom`/);
  });

  it("rejects an op on an object removed earlier", () => {
    const bad = project({ steps: steps([{ type: "remove", target: "bottle" }], [{ type: "paint", target: "bottle", color: "#336699" }]) });
    expect(messages(bad).join("\n")).toMatch(/step 2: .*unknown object `bottle`/);
  });

  it("rejects a cut outside the object and duplicate object ids", () => {
    expect(messages(project({ steps: steps([{ type: "cut", target: "bottle", y: 99 }]) })).join()).toMatch(/outside/);
    const dup = project({
      scene: {
        objects: [
          { id: "a", primitive: "jar", material: { preset: "glass" } },
          { id: "a", primitive: "can", material: { preset: "aluminium" } },
        ],
      },
      steps: steps([]),
    });
    expect(messages(dup).join()).toMatch(/duplicate object id/);
  });

  it("rejects reusing the id of a removed object", () => {
    const bad = project({
      scene: {
        objects: [
          { id: "bottle", primitive: "bottle", material: { preset: "pet" } },
          { id: "part", primitive: "cap", material: { preset: "plastic" } },
        ],
      },
      steps: steps([{ type: "remove", target: "part" }], [{ type: "cut", target: "bottle", y: 18, parts: { top: "part", bottom: "rest" } }]),
    });
    expect(messages(bad).join()).toMatch(/reuses the id `part`/);
  });

  it("rejects a parent that is not declared first", () => {
    const bad = project({
      scene: {
        objects: [
          { id: "cap", primitive: "cap", parent: "bottle", material: { preset: "plastic" } },
          { id: "bottle", primitive: "bottle", material: { preset: "pet" } },
        ],
      },
      steps: steps([]),
    });
    expect(messages(bad).join()).toMatch(/parent `bottle` must be declared before/);
  });

  it("has a scene object branch and a params schema for every registered primitive", () => {
    for (const id of PRIMITIVE_IDS) {
      expect(PRIMITIVE_PARAMS[id], id).toBeDefined();
      const pts = id === "solid" ? { params: { points: [[0, 0], [1, 2]] } } : id === "tube" ? { params: { points: [[0, 0, 0], [0, 1, 0]] } } : {};
      expect(SceneObjectSchema.safeParse({ id: "x", primitive: id, material: { preset: "plastic" }, ...pts }).success, id).toBe(true);
    }
  });
});

describe("shape validation", () => {
  const sceneWith = (o: SceneObjectInput) => project({ scene: { objects: [o] }, steps: steps([]) });

  it("rejects primitive sizes that would fold the profile", () => {
    // A 500 ml-style bottle that keeps the default 8 cm shoulder and 2.6 cm neck.
    expect(messages(sceneWith({ id: "b", primitive: "bottle", params: { height: 10 }, material: { preset: "pet" } })).join()).toMatch(/bottle: neckHeight \+ shoulderHeight/);
    // A body of zero height.
    expect(messages(sceneWith({ id: "b", primitive: "bottle", params: { height: 6, radius: 10, neckHeight: 1, shoulderHeight: 2, neckRadius: 1 }, material: { preset: "pet" } })).length).toBeGreaterThan(0);
    expect(messages(sceneWith({ id: "j", primitive: "jar", params: { height: 2 }, material: { preset: "glass" } })).join()).toMatch(/jar:/);
    expect(messages(sceneWith({ id: "c", primitive: "can", params: { height: 0.5 }, material: { preset: "aluminium" } })).join()).toMatch(/can:/);
    expect(messages(sceneWith({ id: "b", primitive: "bottle", params: { height: 20, shoulderHeight: 5 }, material: { preset: "pet" } }))).toEqual([]);
  });

  it("rejects a hand-written solid whose profile goes down", () => {
    const bad = sceneWith({ id: "s", primitive: "solid", params: { points: [[0, 0], [2, 5], [2, 3]] }, material: { preset: "soil" } });
    expect(messages(bad).join()).toMatch(/object `s` \(solid\): profile goes down at point/);
  });

  it.each(PRIMITIVE_IDS.filter((id) => PRIMITIVES[id].kind === "lathe" && id !== "solid"))("default %s has a valid profile", (id) => {
    expect(profileProblem(profileOf(id, params(id)))).toBeNull();
  });

  it("keeps grip ribs inside a thin bottle", () => {
    const prof = profileOf("bottle", params("bottle", { radius: 0.5, neckRadius: 0.2, shoulderHeight: 3 }));
    expect(prof.every(([r]) => r >= 0)).toBe(true);
  });

  it("computes bounds for an extruded shape with bevel and holes", () => {
    const s = stateWith([
      {
        id: "washer",
        primitive: "extrude",
        params: {
          points: [
            [-2, -2],
            [2, -2],
            [2, 2],
            [-2, 2],
          ],
          holes: [
            [
              [-0.5, -0.5],
              [0.5, -0.5],
              [0.5, 0.5],
              [-0.5, 0.5],
            ],
          ],
          depth: 0.4,
          bevel: 0.1,
        },
        material: { preset: "aluminium" },
      },
    ]);
    const bb = boundsOf(findObject(s, "washer")!);
    expect(bb.min[0]).toBeCloseTo(-2.1);
    expect(bb.min[1]).toBeCloseTo(-2.1);
    expect(bb.min[2]).toBeCloseTo(-0.3);
    expect(bb.max[0]).toBeCloseTo(2.1);
    expect(bb.max[1]).toBeCloseTo(2.1);
    expect(bb.max[2]).toBeCloseTo(0.3);
  });
});

describe("primitives", () => {
  it("follows its params", () => {
    expect(profileRange(profileOf("bottle", params("bottle", { height: 25 })))[1]).toBeCloseTo(25);
    expect(profileRange(profileOf("jar", params("jar", { height: 9 })))[1]).toBeCloseTo(9);
  });

  it("slices a profile exactly at the cut height", () => {
    const prof = profileOf("bottle", params("bottle"));
    const below = sliceProfile(prof, -Infinity, 18);
    const above = sliceProfile(prof, 18, Infinity);
    expect(profileRange(below)).toEqual([0, 18]);
    expect(profileRange(above)).toEqual([18, 30]);
    expect(below[below.length - 1][0]).toBeCloseTo(above[0][0]);
  });

  it("slices a descending segment in the order it crosses the bounds", () => {
    const out = sliceProfile([[0, 1], [1, 0]], 0.2, 0.8);
    expect(out.map(([, y]) => y)).toEqual([0.8, 0.2]);
  });

  it("a can has a flat base, so a low cut splits it from y = 0", () => {
    const s = applySteps({ objects: [obj({ id: "can", primitive: "can", material: { preset: "aluminium" } })] }, [{ ops: [op({ type: "cut", target: "can", y: 0.2, gap: 0 })] }]);
    expect(extentOf(findObject(s, "can.bottom")!)).toEqual([0, 0.2]);
  });

  it("caches profiles per primitive and does not hand out a mutable cache", () => {
    const shared = { height: 1.4, radius: 1.75 };
    const a = fullProfile({ primitive: "cap", params: shared });
    const b = fullProfile({ primitive: "sleeve", params: shared });
    expect(a).not.toEqual(b);
    expect(Object.isFrozen(a) && Object.isFrozen(a[0])).toBe(true);
  });
});

describe("ops", () => {
  const p = parse(project());

  it("cut replaces the object by two parts that tile its height", () => {
    const s = applySteps(p.scene, p.steps.slice(0, 1));
    expect(s.objects.map((o) => o.id)).toEqual(["bottle.bottom", "bottle.top"]);
    expect(extentOf(findObject(s, "bottle.bottom")!)).toEqual([0, 18]);
    expect(extentOf(findObject(s, "bottle.top")!)).toEqual([18, 30]);
    expect(findObject(s, "bottle.top")!.position).toEqual([0, 1.5, 0]);
  });

  it("cut lifts the top along a mirrored object's own +y", () => {
    const s0 = stateWith([{ id: "b", primitive: "bottle", transform: { position: [0, 30, 0], scale: [1, -1, 1] }, material: { preset: "pet" } }]);
    const s = applyOp(s0, op({ type: "cut", target: "b", y: 18, gap: 2 }));
    expect(findObject(s, "b.top")!.position[1]).toBeCloseTo(28);
  });

  it("a cut part can be cut again", () => {
    const s = applySteps(p.scene, [{ ops: [op({ type: "cut", target: "bottle", y: 18, gap: 0 })] }, { ops: [op({ type: "cut", target: "bottle.top", y: 25, gap: 0 })] }]);
    expect(s.objects.map((o) => [o.id, extentOf(o)])).toEqual([
      ["bottle.bottom", [0, 18]],
      ["bottle.top.bottom", [18, 25]],
      ["bottle.top.top", [25, 30]],
    ]);
  });

  it("paint changes colour and remove deletes the object", () => {
    expect(findObject(stateAtStep(p, 2), "bottle.bottom")!.color).toBe("#336699");
    expect(stateAtStep(p, 3).objects.map((o) => o.id)).toEqual(["bottle.bottom"]);
  });

  it("transform sets only the given fields", () => {
    const s = applySteps(p.scene, [{ ops: [op({ type: "transform", target: "bottle", rotation: [180, 0, 0] })] }]);
    expect(findObject(s, "bottle")).toMatchObject({ rotation: [180, 0, 0], position: [0, 0, 0], scale: [1, 1, 1] });
    expect(checkOp(initialState(p.scene), op({ type: "transform", target: "bottle" }))).toMatch(/needs/);
  });

  it("transform with arc lifts the part mid-move and lands exactly on target", () => {
    const flip = (arc?: number) => parse(project({ steps: steps([{ type: "transform", target: "bottle", position: [0, 30, 0], rotation: [180, 0, 0], ...(arc ? { arc } : {}) }]) }));
    const tr = planTransition(flip(10), 0, 1);
    const trNo = planTransition(flip(), 0, 1);
    const mid = sampleTransition(tr, tr.duration / 2).items[0];
    expect(mid.position[1] - sampleTransition(trNo, trNo.duration / 2).items[0].position[1]).toBeCloseTo(10);
    expect(sampleTransition(tr, tr.duration).items[0]).toMatchObject({ position: [0, 30, 0], rotation: [180, 0, 0] });
  });

  it("a flip of a scaled object turns about its scaled centre", () => {
    const pr = parse(
      project({
        scene: { objects: [{ id: "bottle", primitive: "bottle", transform: { scale: [1, 2, 1] }, material: { preset: "pet" } }] },
        steps: steps([{ type: "transform", target: "bottle", position: [0, 60, 0], rotation: [180, 0, 0] }]),
      }),
    );
    const tr = planTransition(pr, 0, 1);
    const mid = sampleTransition(tr, tr.duration / 2).items[0];
    const centre = rotate3([0, 15 * 2, 0], mid.rotation).map((v, i) => v + mid.position[i]);
    expect(centre[1]).toBeCloseTo(30);
    expect(centre[2]).toBeCloseTo(0);
  });

  it("does not mutate the state it is given", () => {
    const s0 = deepFreeze(initialState(p.scene));
    expect(() => applyStepsFrom(s0, p.steps)).not.toThrow();
  });

  it("rotate3 matches three.js Euler XYZ", () => {
    const e = [30, -50, 120];
    const [x, y, z] = e.map((d) => (d * Math.PI) / 180);
    const v = new Vector3(1, 2, 3).applyEuler(new Euler(x, y, z, "XYZ"));
    const r = rotate3([1, 2, 3], e);
    expect(r[0]).toBeCloseTo(v.x);
    expect(r[1]).toBeCloseTo(v.y);
    expect(r[2]).toBeCloseTo(v.z);
  });
});

describe("add, parent, fill and thread", () => {
  const base = () =>
    stateWith([
      { id: "pot", primitive: "bottle", transform: { position: [0, 30, 0], rotation: [180, 0, 0] }, material: { preset: "pet" } },
      { id: "tank", primitive: "jar", material: { preset: "glass" } },
    ]);

  it("add brings in a new object and rejects an existing id or a missing parent", () => {
    const s = applyOp(base(), op({ type: "add", object: { id: "cap", primitive: "cap", material: { preset: "plastic" } } }));
    expect(findObject(s, "cap")).toBeDefined();
    expect(checkOp(s, op({ type: "add", object: { id: "cap", primitive: "cap", material: { preset: "plastic" } } }))).toMatch(/already exists/);
    expect(checkOp(s, op({ type: "add", object: { id: "x", parent: "ghost", primitive: "cap", material: { preset: "plastic" } } }))).toMatch(/unknown object `ghost`/);
  });

  it("a child's world transform composes its parent's", () => {
    const s = applyOp(base(), op({ type: "add", object: { id: "bead", parent: "pot", primitive: "cap", transform: { position: [0, 10, 0] }, material: { preset: "plastic" } } }));
    const bead = frameOf(s).items.find((i) => i.id === "bead")!;
    expect(bead.position[1]).toBeCloseTo(20);
    expect(Math.abs(bead.rotation[0])).toBeCloseTo(180);
    expect(bead.parent).toBeUndefined();
  });

  it("a rotated child keeps a non-uniformly scaled parent's axes", () => {
    const s0 = stateWith([{ id: "tray", primitive: "jar", transform: { scale: [2, 1, 1] }, material: { preset: "glass" } }]);
    const s = applyOp(s0, op({ type: "add", object: { id: "pin", parent: "tray", primitive: "cap", transform: { rotation: [0, 0, 90] }, material: { preset: "plastic" } } }));
    const pin = frameOf(s).items.find((i) => i.id === "pin")!;
    // Child-local +y -> parent x (rotation) -> doubled by the parent's x scale.
    const y = [pin.basis![1], pin.basis![4], pin.basis![7]];
    expect(y[0]).toBeCloseTo(-2);
    expect(y[1]).toBeCloseTo(0);
  });

  it("cut lifts by the gap in world cm under a scaled parent, in the state and the animation", () => {
    const pr = parse(
      project({
        scene: {
          objects: [
            { id: "tray", primitive: "jar", transform: { scale: [1, 2, 1] }, material: { preset: "glass" } },
            { id: "b", parent: "tray", primitive: "bottle", transform: { position: [20, 0, 0] }, material: { preset: "pet" } },
          ],
        },
        steps: steps([{ type: "cut", target: "b", y: 18, gap: 2 }]),
      }),
    );
    const worldY = (f: Frame, key: string) => f.items.find((i) => i.key === key)!.position[1];
    const end = frameOf(stateAtStep(pr, 1));
    expect(worldY(end, "b.top") - worldY(end, "b.bottom")).toBeCloseTo(2);
    const tr = planTransition(pr, 0, 1);
    const late = sampleTransition(tr, tr.duration * 0.999);
    expect(worldY(late, "b#above") - worldY(late, "b#below")).toBeCloseTo(2, 1);
  });

  it("an interrupted blend keeps an attached object's exact transform from start to end", () => {
    const pr = parse(
      project({
        scene: {
          objects: [
            { id: "tray", primitive: "jar", transform: { scale: [2, 1, 1] }, material: { preset: "glass" } },
            { id: "pin", parent: "tray", primitive: "cap", transform: { rotation: [0, 0, 90] }, material: { preset: "plastic" } },
          ],
        },
        steps: steps([{ type: "transform", target: "pin", rotation: [0, 0, 0] }]),
      }),
    );
    const moving = planTransition(pr, 0, 1);
    const onScreen = sampleTransition(moving, moving.duration * 0.5);
    const back = planTransition(pr, 1, 0, onScreen);
    const pinAt = (t: number) => sampleTransition(back, t).items.find((i) => i.id === "pin")!;
    const start = onScreen.items.find((i) => i.id === "pin")!.basis!;
    const target = frameOf(stateAtStep(pr, 0)).items.find((i) => i.id === "pin")!.basis!;
    pinAt(back.duration * 0.001).basis!.forEach((v, i) => expect(v).toBeCloseTo(start[i], 2));
    pinAt(back.duration * 0.999).basis!.forEach((v, i) => expect(v).toBeCloseTo(target[i], 2));
    // Child +y stays on the parent's stretched x axis at the end: [-2, 0, 0].
    expect(target[1]).toBeCloseTo(-2);
  });

  it("a child turning 180° under a stretched parent stays rigid mid-blend", () => {
    const at = (deg: number) =>
      frameOf(
        stateWith([
          { id: "tray", primitive: "jar", transform: { scale: [2, 1, 1] }, material: { preset: "glass" } },
          { id: "pin", parent: "tray", primitive: "cap", transform: { rotation: [0, 0, deg] }, material: { preset: "plastic" } },
        ]),
      );
    const mid = blendFrames(at(0), at(180), 0.5).items.find((i) => i.id === "pin")!.basis!;
    // Exactly the 90° pose: parent [2,1,1] · Rz(90) = [[0,-2,0],[1,0,0],[0,0,1]], not a collapsed diag(0,0,1).
    [0, -2, 0, 1, 0, 0, 0, 0, 1].forEach((v, i) => expect(mid[i]).toBeCloseTo(v));
    const end = blendFrames(at(0), at(180), 1).items.find((i) => i.id === "pin")!.basis!;
    at(180).items.find((i) => i.id === "pin")!.basis!.forEach((v, i) => expect(end[i]).toBeCloseTo(v));
  });

  it("a child of a stretched parent turning 180° stays rigid mid-blend", () => {
    const at = (deg: number) =>
      frameOf(
        stateWith([
          { id: "tray", primitive: "jar", transform: { rotation: [0, 0, deg], scale: [2, 1, 1] }, material: { preset: "glass" } },
          { id: "pin", parent: "tray", primitive: "cap", material: { preset: "plastic" } },
        ]),
      );
    const mid = blendFrames(at(0), at(180), 0.5).items.find((i) => i.id === "pin")!.basis!;
    // Rz(90) · diag(2,1,1) = [[0,-1,0],[2,0,0],[0,0,1]], not diag(0,0,1).
    [0, -1, 0, 2, 0, 0, 0, 0, 1].forEach((v, i) => expect(mid[i]).toBeCloseTo(v));
  });

  it("an interrupted fill keeps the outgoing level under its own key", () => {
    const pr = parse(
      project({
        scene: { objects: [{ id: "tank", primitive: "jar", material: { preset: "glass" } }] },
        steps: steps([{ type: "fill", target: "tank", id: "water", level: 0.5 }]),
      }),
    );
    const filling = planTransition(pr, 0, 1);
    const onScreen = sampleTransition(filling, filling.duration * 0.5);
    const again = planTransition(pr, 0, 1, onScreen);
    const mid = sampleTransition(again, again.duration / 2);
    const keys = mid.items.map((i) => i.key);
    expect(new Set(keys).size).toBe(keys.length);
    const out = mid.items.find((i) => i.key === "water#out")!;
    expect(out.clip).toEqual(onScreen.items.find((i) => i.key === "water")!.clip);
  });

  it("fill uses a mirrored container's world-bottom end", () => {
    const s0 = stateWith([{ id: "jar", primitive: "jar", transform: { position: [0, 12, 0], scale: [1, -1, 1] }, material: { preset: "glass" } }]);
    const s = applyOp(s0, op({ type: "fill", target: "jar", id: "water", level: 0.5 }));
    expect(extentOf(findObject(s, "water")!)).toEqual([6, 12]);
  });

  it("children move with the parent and are removed with it; a parent with children cannot be cut", () => {
    let s = applyOp(base(), op({ type: "thread", target: "pot", id: "wick", path: [[0, 20, 0], [0, 35, 0]] }));
    s = applyOp(s, op({ type: "transform", target: "pot", position: [10, 30, 0] }));
    expect(frameOf(s).items.find((i) => i.id === "wick")!.position[0]).toBeCloseTo(10);
    expect(applyOp(s, op({ type: "remove", target: "pot" })).objects.map((o) => o.id)).toEqual(["tank"]);
    expect(checkOp(s, op({ type: "cut", target: "pot", y: 10 }))).toMatch(/has attached objects \(wick\)/);
  });

  it("fill fills an upright container from its base", () => {
    const s = applyOp(base(), op({ type: "fill", target: "tank", id: "water", level: 0.5, material: { preset: "water" } }));
    const water = findObject(s, "water")!;
    expect(water).toMatchObject({ primitive: "solid", parent: "tank", preset: "water" });
    expect(extentOf(water)).toEqual([0, 6]);
  });

  it("fill fills an upside-down container from its world-bottom end", () => {
    const s = applyOp(base(), op({ type: "fill", target: "pot", id: "soil", level: 0.25 }));
    expect(extentOf(findObject(s, "soil")!)).toEqual([22.5, 30]);
  });

  it("fill rises behind a clip plane; thread grows along its path", () => {
    const pr = parse(
      project({
        scene: { objects: [{ id: "tank", primitive: "jar", material: { preset: "glass" } }] },
        steps: steps([{ type: "fill", target: "tank", id: "water", level: 0.5 }], [{ type: "thread", target: "tank", id: "wick", path: [[0, 1, 0], [0, 11, 0]] }]),
      }),
    );
    const f1 = planTransition(pr, 0, 1);
    const water = sampleTransition(f1, f1.duration / 2).items.find((i) => i.id === "water")!;
    expect(water.clip?.keep).toBe("below");
    expect(water.clip!.y).toBeGreaterThan(0);
    expect(water.clip!.y).toBeLessThan(6);
    const f2 = planTransition(pr, 1, 2);
    const wick = sampleTransition(f2, f2.duration / 2).items.find((i) => i.id === "wick")!;
    expect(wick.reveal).toBeGreaterThan(0);
    expect(wick.reveal).toBeLessThan(1);
    expect(boundsOf(findObject(stateAtStep(pr, 2), "wick")!)).toEqual({ min: [-0.3, 0.7, -0.3], max: [0.3, 11.3, 0.3] });
  });

  it("cut and fill reject a non-lathe target", () => {
    const s = applyOp(base(), op({ type: "thread", target: "tank", id: "wick", path: [[0, 0, 0], [0, 5, 0]] }));
    expect(checkOp(s, op({ type: "cut", target: "wick", y: 1 }))).toMatch(/needs a lathe/);
    expect(checkOp(s, op({ type: "fill", target: "wick" }))).toMatch(/needs a lathe/);
  });
});

describe("transitions", () => {
  const p = parse(project());

  it("a forward step starts at the previous state and ends exactly at the next", () => {
    const tr = planTransition(p, 0, 1);
    expect(tr.duration).toBeGreaterThan(0);
    expect(sampleTransition(tr, 0)).toEqual(frameOf(stateAtStep(p, 0)));
    expect(sampleTransition(tr, tr.duration)).toEqual(frameOf(stateAtStep(p, 1)));
  });

  it("folds a box around its fixed local hinge", () => {
    const hinged = parse(project({
      scene: {
        objects: [{
          id: "panel", primitive: "box", params: { width: 8, height: 6, depth: 0.4 },
          transform: { position: [2, 0, 1], rotation: [90, 0, 0] }, material: { preset: "cardboard" },
        }],
      },
      steps: steps([{ type: "transform", target: "panel", rotation: [0, 0, 0], pivot: [0, 0, 0] }]),
    }));
    const fold = planTransition(hinged, 0, 1);
    const mid = sampleTransition(fold, fold.duration / 2).items[0];
    expect(mid.position).toEqual([2, 0, 1]);
    expect(mid.rotation[0]).toBeCloseTo(45);
    expect(boundsOf(mid)).toEqual({ min: [-4, 0, -0.2], max: [4, 6, 0.2] });
  });

  it("attaches an object without a jump in world space and carries it with its parent", () => {
    const attached = parse(project({
      scene: { objects: [
        { id: "body", primitive: "bottle", transform: { position: [20, 0, 0] }, material: { preset: "pet" } },
        { id: "lid", primitive: "cap", transform: { position: [0, 5, 0] }, material: { preset: "plastic" } },
      ] },
      steps: steps(
        [{ type: "attach", target: "lid", parent: "body", transform: { position: [0, 29, 0] } }],
        [{ type: "transform", target: "body", position: [30, 0, 0] }],
      ),
    }));
    const attach = planTransition(attached, 0, 1);
    expect(sampleTransition(attach, attach.duration / 2).items.find((item) => item.id === "lid")?.position).toEqual([10, 17, 0]);
    expect(findObject(stateAtStep(attached, 1), "lid")?.parent).toBe("body");

    const jump = planTransition(attached, 0, 2);
    const lid = (time: number) => sampleTransition(jump, time).items.find((item) => item.id === "lid")!;
    expect(lid(jump.duration * 0.001).position[0]).toBeCloseTo(0);
    expect(lid(jump.duration).position).toEqual([30, 29, 0]);
  });

  it("rejects attachments that would create a parent cycle", () => {
    const circular = project({
      scene: { objects: [
        { id: "body", primitive: "bottle", material: { preset: "pet" } },
        { id: "lid", primitive: "cap", parent: "body", material: { preset: "plastic" } },
      ] },
      steps: steps([{ type: "attach", target: "body", parent: "lid", transform: {} }]),
    });
    expect(messages(circular).join()).toMatch(/attach would create a parent cycle/);
  });

  it("the cut animation draws a cut line, then two clipped halves", () => {
    const tr = planTransition(p, 0, 1);
    expect(sampleTransition(tr, tr.duration * 0.2).effects[0]).toMatchObject({ kind: "cut-line", y: 18 });
    expect(sampleTransition(tr, tr.duration * 0.9).items.map((i) => i.clip?.keep)).toEqual(["below", "above"]);
  });

  it("an interrupted animation starts from the frame on screen and still ends on the target", () => {
    const cutting = planTransition(p, 0, 1);
    const onScreen = sampleTransition(cutting, cutting.duration * 0.8);
    const back = planTransition(p, 1, 0, onScreen);
    expect(sampleTransition(back, 0)).toEqual(onScreen);
    expect(sampleTransition(back, back.duration)).toEqual(frameOf(stateAtStep(p, 0)));
  });

  it("an interruption cross-fades a clipped half instead of morphing it into the whole object", () => {
    const cutting = planTransition(p, 0, 1);
    const onScreen = sampleTransition(cutting, cutting.duration * 0.9); // two clipped halves
    const back = planTransition(p, 1, 0, onScreen);
    const mid = sampleTransition(back, back.duration / 2);
    const whole = mid.items.find((i) => i.key === "bottle")!;
    expect(whole.clip).toBeUndefined();
    expect(whole.opacity).toBeLessThan(1); // fading in, not popped in
    expect(mid.items.filter((i) => i.clip).length).toBe(2); // both halves fading out
  });

  it("clamps step indices outside the project", () => {
    const n = p.steps.length;
    expect(() => planTransition(p, n, n + 1)).not.toThrow();
    expect(planTransition(p, n, n + 1).duration).toBe(0);
  });
});

describe("catalog", () => {
  it("includes at least ten guides", () => {
    expect(PROJECTS.length).toBeGreaterThanOrEqual(10);
  });

  describe.each(PROJECTS.map((pr) => [pr.slug, pr] as const))("%s", (_slug, pr) => {
    const n = pr.steps.length;

    it("applies steps 1..n with every op target present when applied", () => {
      let state = initialState(pr.scene);
      pr.steps.forEach((step, i) => {
        for (const o of step.ops) {
          expect(checkOp(state, o), `step ${i + 1} ${o.type}`).toBeNull();
          state = applyOp(state, o);
        }
        expect(state).toEqual(stateAtStep(pr, i + 1));
      });
    });

    it("each forward step's last phase is the canonical next state, with finite frames inside", () => {
      for (let k = 1; k <= n; k++) {
        const tr = planTransition(pr, k - 1, k);
        if (tr.phases) expect(tr.phases[tr.phases.length - 1].next).toEqual(stateAtStep(pr, k));
        for (const t of [0.1, 0.5, 0.9].map((f) => f * tr.duration)) {
          for (const it of sampleTransition(tr, t).items) expect([...it.position, ...it.rotation].every(Number.isFinite)).toBe(true);
        }
      }
    });

    it("for random step pairs, the end of a transition is exactly the target state", () => {
      const r = rng(42);
      for (let i = 0; i < 60; i++) {
        const a = Math.floor(r() * (n + 1));
        const b = Math.floor(r() * (n + 1));
        const tr = planTransition(pr, a, b);
        const end = sampleTransition(tr, tr.duration);
        // Independent of stateAtStep: replay the steps directly.
        const expected = frameOf(applySteps(pr.scene, pr.steps.slice(0, b)));
        expect(end, `${a} -> ${b}`).toEqual(expected);
        // The renderer mounts one mesh per item key: at rest those are exactly the state's ids.
        expect(ids(end)).toEqual(stateAtStep(pr, b).objects.map((o) => o.id).sort());
      }
    });

    it("cites sources with url and license", () => {
      for (const s of pr.sources) {
        expect(s.url).toMatch(/^https:\/\//);
        expect(s.license.length).toBeGreaterThan(0);
      }
    });
  });
});
