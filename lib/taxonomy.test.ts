import { describe, expect, it } from "vitest";
import { findByText, getMaterial, isMaterialId, isToolId, labelOf, MATERIAL_IDS, MATERIALS, normalize, TOOL_IDS, TOOLS } from "./taxonomy";

describe("taxonomy", () => {
  it("resolves ids, EN/VI labels and aliases case-insensitively", () => {
    expect(findByText("pet-bottle")).toEqual({ kind: "material", id: "pet-bottle" });
    expect(findByText("  Soda Bottle ")).toEqual({ kind: "material", id: "pet-bottle" });
    expect(findByText("Lon nhôm")).toEqual({ kind: "material", id: "aluminium-can" });
    expect(findByText("tyre")).toEqual({ kind: "material", id: "tire" });
    expect(findByText("tin can")).toEqual({ kind: "material", id: "steel-can" });
    expect(findByText("soda can")).toEqual({ kind: "material", id: "aluminium-can" });
    expect(findByText("lid")).toBeNull(); // jar lids are metal, bottle caps plastic: too ambiguous to guess
    expect(findByText("súng keo")).toEqual({ kind: "tool", id: "hot-glue-gun" });
    expect(findByText("box cutter")).toEqual({ kind: "tool", id: "utility-knife" });
    expect(findByText("spaceship")).toBeNull();
    expect(findByText("")).toBeNull();
  });

  it("has no alias or label that points at two entries", () => {
    // Same normalisation as findByText; owners are kind + id so a material and a tool never share a name.
    const owner = new Map<string, string>();
    const all = [
      ...MATERIAL_IDS.map((id) => [`material:${id}`, id, MATERIALS[id]] as const),
      ...TOOL_IDS.map((id) => [`tool:${id}`, id, TOOLS[id]] as const),
    ];
    for (const [who, id, e] of all) {
      for (const name of [id, e.label.en, e.label.vi, ...e.aliases].map(normalize)) {
        const prev = owner.get(name);
        expect(prev === undefined || prev === who, `"${name}" used by ${prev} and ${who}`).toBe(true);
        owner.set(name, who);
      }
    }
  });

  it("guards and labels", () => {
    expect(isMaterialId("glass-jar")).toBe(true);
    expect(isMaterialId("drill")).toBe(false);
    expect(isToolId("drill")).toBe(true);
    expect(labelOf("glass-jar", "vi")).toBe("Hũ thủy tinh");
    expect(getMaterial("tire").label.en).toBe("Old tire");
  });
});
