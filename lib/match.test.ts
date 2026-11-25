import { describe, expect, it } from "vitest";
import { PROJECTS } from "@/content/projects";
import { inventoryQuery, readInventory } from "./inventory";
import { matchProjects } from "./match";
import type { Project } from "./scene/schema";

const planter = PROJECTS.find(({ slug }) => slug === "pet-self-watering-planter")!;

function project(slug: string, materials: Project["materials"], tools: Project["tools"] = []): Project {
  return { ...planter, slug, materials, tools, wasteDiverted: [] };
}

describe("project matching", () => {
  it("groups by missing required items and explains material quantities and tools", () => {
    const one = project("one", [{ id: "pet-bottle", qty: 1 }]);
    const two = project("two", [{ id: "pet-bottle", qty: 3 }], [{ id: "scissors" }]);
    const three = project("three", [{ id: "cardboard", qty: 1 }, { id: "bottle-cap", qty: 5 }], [{ id: "marker" }]);

    const result = matchProjects([three, two, one], { materials: { "pet-bottle": 1 }, tools: [] });
    expect(result.ready.map(({ project }) => project.slug)).toEqual(["one"]);
    expect(result.almost).toMatchObject([{ project: { slug: "two" }, missingMaterials: [{ id: "pet-bottle", qty: 2 }], missingTools: ["scissors"] }]);
    expect(result.inspiration.map(({ project }) => project.slug)).toEqual(["three"]);
  });

  it("allocates stock to required quantities before optional quantities", () => {
    const sample = project("sample", [
      { id: "cardboard", qty: 1 },
      { id: "cardboard", qty: 2 },
      { id: "cardboard", qty: 1, optional: true },
    ], [{ id: "marker", optional: true }, { id: "scissors" }]);

    const result = matchProjects([sample], { materials: { cardboard: 3 }, tools: ["scissors"] });
    expect(result.ready).toMatchObject([{ usedMaterials: [{ id: "cardboard", qty: 3 }], missingMaterials: [], missingTools: [], score: 11 }]);
    expect(matchProjects([sample], { materials: { cardboard: 4 }, tools: ["scissors", "marker"] }).ready[0].score).toBe(14);
  });

  it("rewards covered stock and prefers higher matched waste on equal scores", () => {
    const bottle = project("bottle", [{ id: "pet-bottle", qty: 1 }]);
    const jar = project("jar", [{ id: "glass-jar", qty: 1 }]);
    bottle.wasteDiverted = [{ materialId: "pet-bottle", grams: 40 }];
    jar.wasteDiverted = [{ materialId: "glass-jar", grams: 150 }];

    const result = matchProjects([bottle, jar], { materials: { "pet-bottle": 2, "glass-jar": 1 }, tools: [] });
    expect(result.ready.map(({ project }) => project.slug)).toEqual(["jar", "bottle"]);
    expect(matchProjects([bottle], { materials: { "pet-bottle": 0.5 }, tools: [] }).almost[0].matchedWasteGrams).toBe(20);
  });

  it("treats equivalent fractional quantities as covered", () => {
    const sample = project("fraction", [{ id: "cotton-string", qty: 0.1 }, { id: "cotton-string", qty: 0.2 }]);
    expect(matchProjects([sample], { materials: { "cotton-string": 0.3 }, tools: [] }).ready).toHaveLength(1);
  });
});

describe("inventory query", () => {
  it("round-trips valid materials and tools in stable order", () => {
    const inventory = readInventory({
      material: ["cardboard:1", "bottle-cap:7", "pet-bottle:0.5"],
      tool: ["scissors", "scissors"],
    });
    expect(inventoryQuery(inventory)).toBe("material=pet-bottle%3A0.5&material=bottle-cap%3A7&material=cardboard%3A1&tool=scissors");
    expect(inventory).toEqual({ materials: { cardboard: 1, "bottle-cap": 7, "pet-bottle": 0.5 }, tools: ["scissors"] });
  });

  it("ignores unknown ids and invalid quantities", () => {
    expect(readInventory({
      material: ["bogus:2", "constructor:3", "pet-bottle:0", "glass-jar:Infinity", "newspaper:0x3", "cardboard:2:3", "t-shirt:1", "t-shirt:3"],
      tool: ["unknown", "constructor", "drill"],
    })).toEqual({ materials: { "t-shirt": 3 }, tools: ["drill"] });
  });
});
