import { describe, expect, it } from "vitest";
import { inventoryQuery, readInventory } from "./inventory";
import { mergeScannedMaterials, mergeScannedTools, sanitizeScanItems, type ScanItemId } from "./scan";

it("limits model suggestions to canonical inventory IDs and keeps each best score", () => {
  expect(sanitizeScanItems({ items: [
    { id: "pet-bottle", confidence: 0.4 },
    { id: "pet-bottle", confidence: 0.8 },
    { id: "scissors", confidence: 0.6 },
    { id: "unknown", confidence: 1 },
    { id: "glass-jar", confidence: NaN },
  ] })).toEqual([{ id: "pet-bottle", confidence: 0.8 }, { id: "scissors", confidence: 0.6 }]);
});

describe("merging confirmed scanned items with manual inventory", () => {
  it("adds new materials at quantity 1, preserves existing quantities, and avoids duplicate tools", () => {
    const manual = {
      materials: { "pet-bottle": 3, "cotton-string": 0.5 },
      tools: ["scissors"] as const,
    };

    const selected: ScanItemId[] = ["pet-bottle", "glass-jar", "scissors", "marker", "marker"];
    const merged = {
      materials: mergeScannedMaterials(manual.materials, selected),
      tools: mergeScannedTools(manual.tools, selected),
    };

    expect(merged).toEqual({
      materials: {
        "pet-bottle": 3,
        "cotton-string": 0.5,
        "glass-jar": 1,
      },
      tools: ["scissors", "marker"],
    });

    const query = inventoryQuery(merged);
    const params = Object.fromEntries(
      [...new Set(new URLSearchParams(query).keys())].map((key) => [
        key,
        new URLSearchParams(query).getAll(key),
      ]),
    );
    expect(readInventory(params)).toEqual(merged);
  });
});
