import { describe, expect, it } from "vitest";
import { inventoryQuery, readInventory } from "./inventory";
import {
  mergeScannedMaterials,
  mergeScannedTools,
  resolveScanRegionItems,
  sanitizeScanItems,
  type ScanItemId,
} from "./scan";

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

describe("resolving transparent container scan conflicts", () => {
  it("suppresses crop-only glass jar and glass bottle on a single PET bottle while keeping unrelated items", () => {
    expect(
      resolveScanRegionItems([
        { region: "full", id: "pet-bottle", confidence: 0.54 },
        { region: "top-left", id: "scissors", confidence: 0.62 },
        { region: "top-right", id: "pet-bottle", confidence: 0.5 },
        { region: "bottom-left", id: "glass-jar", confidence: 0.44 },
        { region: "bottom-right", id: "glass-bottle", confidence: 0.38 },
      ]),
    ).toEqual([
      { id: "scissors", confidence: 0.62 },
      { id: "pet-bottle", confidence: 0.54 },
    ]);
  });

  it("prefers full-frame glass jar or glass bottle over conflicting crop guesses", () => {
    expect(
      resolveScanRegionItems([
        { region: "full", id: "glass-jar", confidence: 0.5 },
        { region: "top-left", id: "pet-bottle", confidence: 0.54 },
        { region: "bottom-right", id: "glass-bottle", confidence: 0.39 },
      ]),
    ).toEqual([{ id: "glass-jar", confidence: 0.5 }]);

    expect(
      resolveScanRegionItems([
        { region: "full", id: "glass-bottle", confidence: 0.5 },
        { region: "top-left", id: "glass-bottle", confidence: 0.48 },
        { region: "bottom-left", id: "pet-bottle", confidence: 0.54 },
        { region: "bottom-right", id: "glass-jar", confidence: 0.36 },
      ]),
    ).toEqual([{ id: "glass-bottle", confidence: 0.5 }]);
  });

  it("keeps two distinct containers only with strong opposite-corner evidence", () => {
    expect(
      resolveScanRegionItems([
        { region: "full", id: "pet-bottle", confidence: 0.58 },
        { region: "top-left", id: "pet-bottle", confidence: 0.72 },
        { region: "bottom-right", id: "glass-jar", confidence: 0.7 },
        { region: "bottom-left", id: "glass-bottle", confidence: 0.36 },
      ]),
    ).toEqual([
      { id: "pet-bottle", confidence: 0.72 },
      { id: "glass-jar", confidence: 0.7 },
    ]);

    // Adjacent crops overlap heavily and do not override the full-frame container.
    expect(
      resolveScanRegionItems([
        { region: "full", id: "pet-bottle", confidence: 0.62 },
        { region: "top-left", id: "pet-bottle", confidence: 0.68 },
        { region: "bottom-left", id: "glass-bottle", confidence: 0.68 },
      ]),
    ).toEqual([{ id: "pet-bottle", confidence: 0.68 }]);
  });

  it("abstains on ambiguous or tied conflicts while preserving unrelated items and clear crop winners", () => {
    expect(
      resolveScanRegionItems([
        { region: "top-left", id: "pet-bottle", confidence: 0.42 },
        { region: "bottom-left", id: "glass-bottle", confidence: 0.42 },
      ]),
    ).toEqual([]);

    expect(
      resolveScanRegionItems([
        { region: "full", id: "pet-bottle", confidence: 0.34 },
        { region: "top-left", id: "glass-jar", confidence: 0.37 },
        { region: "bottom-right", id: "glass-bottle", confidence: 0.36 },
        { region: "top-right", id: "scissors", confidence: 0.52 },
      ]),
    ).toEqual([{ id: "scissors", confidence: 0.52 }]);

    expect(
      resolveScanRegionItems([
        { region: "full", id: "cardboard", confidence: 0.48 },
        { region: "top-left", id: "glass-jar", confidence: 0.55 },
        { region: "bottom-left", id: "glass-jar", confidence: 0.5 },
        { region: "top-right", id: "pet-bottle", confidence: 0.3 },
      ]),
    ).toEqual([
      { id: "glass-jar", confidence: 0.55 },
      { id: "cardboard", confidence: 0.48 },
    ]);
  });

  it("preserves glass jar alone and non-conflicting multi-object scans", () => {
    expect(
      resolveScanRegionItems([{ region: "full", id: "glass-jar", confidence: 0.35 }]),
    ).toEqual([{ id: "glass-jar", confidence: 0.35 }]);

    expect(
      resolveScanRegionItems([
        { region: "full", id: "cardboard", confidence: 0.55 },
        { region: "top-left", id: "scissors", confidence: 0.6 },
        { region: "bottom-left", id: "glass-jar", confidence: 0.42 },
        { region: "bottom-right", id: "aluminium-can", confidence: 0.48 },
      ]),
    ).toEqual([
      { id: "scissors", confidence: 0.6 },
      { id: "cardboard", confidence: 0.55 },
      { id: "aluminium-can", confidence: 0.48 },
      { id: "glass-jar", confidence: 0.42 },
    ]);
  });
});
