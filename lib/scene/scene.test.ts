import { Euler, Vector3 } from "three";
import { describe, expect, it } from "vitest";
import { PROJECTS } from "@/content/projects";
import { rotate3 } from "./math";
import { applyOp, applySteps, checkOp, extentOf, findObject, frameOf, initialState } from "./ops";
import { PRIMITIVE_IDS, profileOf, profileRange, sliceProfile } from "./primitives";
import { ProjectSchema, SceneObjectSchema, type ProjectInput } from "./schema";
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
const messages = (p: ProjectInput) => {
  const r = ProjectSchema.safeParse(p);
  return r.success ? [] : r.error.issues.map((i) => i.message);
};

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
    const bad = project({ steps: [{ title: "Paint", text: "x", ops: [{ type: "paint", target: "bottle.bottom", color: "#336699" }] }] });
    expect(messages(bad).join("\n")).toMatch(/unknown object `bottle\.bottom`/);
  });

  it("rejects an op on an object removed earlier", () => {
    const bad = project({
      steps: [
        { title: "Remove", text: "x", ops: [{ type: "remove", target: "bottle" }] },
        { title: "Paint", text: "x", ops: [{ type: "paint", target: "bottle", color: "#336699" }] },
      ],
    });
    expect(messages(bad).join("\n")).toMatch(/step 2: .*unknown object `bottle`/);
  });

  it("rejects a cut outside the object and duplicate object ids", () => {
    expect(messages(project({ steps: [{ title: "c", text: "x", ops: [{ type: "cut", target: "bottle", y: 99 }] }] })).join()).toMatch(/outside/);
    const dup = project({
      scene: {
        objects: [
          { id: "a", primitive: "jar", material: { preset: "glass" } },
          { id: "a", primitive: "can", material: { preset: "aluminium" } },
        ],
      },
      steps: [{ title: "s", text: "x" }],
    });
    expect(messages(dup).join()).toMatch(/duplicate object id/);
  });

  it("has a scene object branch for every registered primitive", () => {
    for (const id of PRIMITIVE_IDS) {
      expect(SceneObjectSchema.safeParse({ id: "x", primitive: id, material: { preset: "plastic" } }).success, id).toBe(true);
    }
  });
});

describe("primitives", () => {
  it.each(PRIMITIVE_IDS)("%s builds a profile from default params", (id) => {
    const prof = profileOf(id, {});
    expect(prof.length).toBeGreaterThan(1);
    for (const [r, y] of prof) {
      expect(Number.isFinite(r) && r >= 0).toBe(true);
      expect(Number.isFinite(y)).toBe(true);
    }
  });

  it("follows its params", () => {
    expect(profileRange(profileOf("bottle", { height: 25 }))[1]).toBeCloseTo(25);
    expect(profileRange(profileOf("jar", { height: 9 }))[1]).toBeCloseTo(9);
  });

  it("slices a profile exactly at the cut height", () => {
    const prof = profileOf("bottle", {});
    const below = sliceProfile(prof, -Infinity, 18);
    const above = sliceProfile(prof, 18, Infinity);
    expect(profileRange(below)).toEqual([0, 18]);
    expect(profileRange(above)).toEqual([18, 30]);
    // Both halves meet at the same radius.
    expect(below[below.length - 1][0]).toBeCloseTo(above[0][0]);
  });
});

describe("ops", () => {
  const p = parse(project());

  it("cut replaces the object by two parts that tile its height", () => {
    const s = applySteps(p.scene, p.steps.slice(0, 1));
    expect(s.objects.map((o) => o.id)).toEqual(["bottle.bottom", "bottle.top"]);
    expect(extentOf(findObject(s, "bottle.bottom")!)).toEqual([0, 18]);
    expect(extentOf(findObject(s, "bottle.top")!)).toEqual([18, 30]);
    // Default gap lifts the top 1.5 cm.
    expect(findObject(s, "bottle.top")!.position).toEqual([0, 1.5, 0]);
  });

  it("a cut part can be cut again", () => {
    const s = applySteps(p.scene, [
      { ops: [{ type: "cut", target: "bottle", y: 18, gap: 0 }] },
      { ops: [{ type: "cut", target: "bottle.top", y: 25, gap: 0 }] },
    ]);
    expect(s.objects.map((o) => [o.id, extentOf(o)])).toEqual([
      ["bottle.bottom", [0, 18]],
      ["bottle.top.bottom", [18, 25]],
      ["bottle.top.top", [25, 30]],
    ]);
  });

  it("paint changes colour and remove deletes the object", () => {
    const s2 = stateAtStep(p, 2);
    expect(findObject(s2, "bottle.bottom")!.color).toBe("#336699");
    const s3 = stateAtStep(p, 3);
    expect(s3.objects.map((o) => o.id)).toEqual(["bottle.bottom"]);
  });

  it("transform sets only the given fields", () => {
    const s = applySteps(p.scene, [{ ops: [{ type: "transform", target: "bottle", rotation: [180, 0, 0] }] }]);
    expect(findObject(s, "bottle")).toMatchObject({ rotation: [180, 0, 0], position: [0, 0, 0], scale: [1, 1, 1] });
    expect(checkOp(initialState(p.scene), { type: "transform", target: "bottle" })).toMatch(/needs/);
  });

  it("does not mutate the states it is given", () => {
    const s0 = initialState(p.scene);
    const snapshot = JSON.stringify(s0);
    applySteps(p.scene, p.steps);
    expect(JSON.stringify(s0)).toBe(snapshot);
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

describe("transitions", () => {
  const p = parse(project());

  it("a forward step ends exactly at the next state and starts at the previous one", () => {
    const tr = planTransition(p, 0, 1);
    expect(tr.duration).toBeGreaterThan(0);
    expect(sampleTransition(tr, 0)).toEqual(frameOf(stateAtStep(p, 0)));
    expect(sampleTransition(tr, tr.duration)).toEqual(frameOf(stateAtStep(p, 1)));
  });

  it("the cut animation draws a cut line, then two clipped halves", () => {
    const tr = planTransition(p, 0, 1);
    const early = sampleTransition(tr, tr.duration * 0.2);
    expect(early.effects[0]).toMatchObject({ kind: "cut-line", y: 18 });
    const late = sampleTransition(tr, tr.duration * 0.9);
    expect(late.items.map((i) => i.clip?.keep)).toEqual(["below", "above"]);
  });

  it("scrubbing back to step k gives the same state as going forward to k", () => {
    const forward = stateAtStep(p, 1);
    const back = planTransition(p, 3, 1);
    expect(sampleTransition(back, back.duration)).toEqual(frameOf(forward));
  });
});

describe("catalog", () => {
  it("has at least one project", () => {
    expect(PROJECTS.length).toBeGreaterThan(0);
  });

  describe.each(PROJECTS.map((pr) => [pr.slug, pr] as const))("%s", (_slug, pr) => {
    it("applies steps 1..n with every op target present when applied", () => {
      let state = initialState(pr.scene);
      pr.steps.forEach((step, i) => {
        for (const op of step.ops) {
          expect(checkOp(state, op), `step ${i + 1} ${op.type} ${op.target}`).toBeNull();
          state = applyOp(state, op);
        }
        expect(state).toEqual(stateAtStep(pr, i + 1));
      });
    });

    it("every step state is the same whether reached forward or by jumping back", () => {
      for (let k = 0; k <= pr.steps.length; k++) {
        const viaJump = planTransition(pr, pr.steps.length, k);
        expect(sampleTransition(viaJump, viaJump.duration + 1)).toEqual(frameOf(stateAtStep(pr, k)));
        if (k > 0) {
          const step = planTransition(pr, k - 1, k);
          // Sampling mid-way never throws and yields finite transforms.
          for (const t of [0.1, 0.5, 0.9].map((f) => f * step.duration)) {
            for (const it of sampleTransition(step, t).items) expect(it.position.every(Number.isFinite)).toBe(true);
          }
        }
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
