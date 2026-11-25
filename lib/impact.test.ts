import { describe, expect, it, vi } from "vitest";
import { PROJECTS } from "@/content/projects";
import {
  completionStorageKey,
  createImpactStore,
  formatGrams,
  formatKilograms,
  IMPACT_STORAGE_PREFIX,
  IMPACT_STORAGE_VALUE,
  isValidCompletionValue,
  normalizeCompletedSlugs,
  readCompletedSlugs,
  summarizeImpact,
  toImpactProjectSummaries,
  writeProjectCompletion,
  type ImpactProjectSummary,
  type StorageEventLike,
  type StorageEventSource,
  type StorageLike,
} from "./impact";
import { labelOf } from "./taxonomy";

const CATALOG_SUMMARIES = toImpactProjectSummaries(PROJECTS);

function createMemoryStorage(initial: Record<string, string> = {}): StorageLike & {
  data: Map<string, string>;
} {
  const data = new Map<string, string>(Object.entries(initial));
  return {
    data,
    get length() {
      return data.size;
    },
    key(index: number) {
      return [...data.keys()][index] ?? null;
    },
    getItem(key: string) {
      return data.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      data.set(key, value);
    },
    removeItem(key: string) {
      data.delete(key);
    },
  };
}

function createEventBus(): StorageEventSource & {
  dispatch(event: StorageEventLike): void;
  listenerCount(): number;
} {
  const listeners = new Set<(event: StorageEventLike) => void>();
  return {
    addEventListener(_type, listener) {
      listeners.add(listener);
    },
    removeEventListener(_type, listener) {
      listeners.delete(listener);
    },
    dispatch(event) {
      for (const listener of listeners) {
        listener(event);
      }
    },
    listenerCount() {
      return listeners.size;
    },
  };
}

describe("impact aggregation", () => {
  it("strips 3D scene, step, and source data from catalog summaries", () => {
    expect(CATALOG_SUMMARIES).toHaveLength(PROJECTS.length);
    expect(Object.keys(CATALOG_SUMMARIES[0]).sort()).toEqual([
      "difficulty",
      "slug",
      "timeMinutes",
      "title",
      "wasteDiverted",
    ]);
  });

  it("returns zero state when no valid guides are completed", () => {
    const summary = summarizeImpact([], CATALOG_SUMMARIES);
    expect(summary).toEqual({
      completedProjects: [],
      completedCount: 0,
      totalProjects: CATALOG_SUMMARIES.length,
      totalGrams: 0,
      byMaterial: [],
    });
  });

  it("counts duplicate slugs once and ignores unknown or invalid slugs", () => {
    const summary = summarizeImpact(
      [
        "pet-self-watering-planter",
        "pet-self-watering-planter",
        "unknown-guide",
        "constructor",
        "__proto__",
        "",
        42,
        null,
      ],
      CATALOG_SUMMARIES,
    );

    expect(summary.completedCount).toBe(1);
    expect(summary.completedProjects.map((project) => project.slug)).toEqual([
      "pet-self-watering-planter",
    ]);
    expect(summary.totalGrams).toBe(50);
    expect(summary.byMaterial).toEqual([
      {
        materialId: "pet-bottle",
        label: labelOf("pet-bottle"),
        grams: 40,
        projectCount: 1,
      },
      {
        materialId: "t-shirt",
        label: labelOf("t-shirt"),
        grams: 10,
        projectCount: 1,
      },
    ]);
  });

  it("aggregates overall and per-material grams across multiple projects with taxonomy labels", () => {
    // bottle-cap-mosaic: bottle-cap 38g, cardboard 22g
    // dry-goods-hardware-tray: bottle-cap 24g, cardboard 34g
    // upcycled-container-craft-caddy: steel-can 90g, glass-jar 170g, cardboard 55g
    const summary = summarizeImpact(
      [
        "dry-goods-hardware-tray",
        "bottle-cap-mosaic",
        "upcycled-container-craft-caddy",
        "bottle-cap-mosaic",
      ],
      CATALOG_SUMMARIES,
    );

    expect(summary.completedCount).toBe(3);
    expect(summary.totalGrams).toBe(38 + 22 + 24 + 34 + 90 + 170 + 55);
    expect(summary.byMaterial).toEqual([
      {
        materialId: "glass-jar",
        label: labelOf("glass-jar"),
        grams: 170,
        projectCount: 1,
      },
      {
        materialId: "cardboard",
        label: labelOf("cardboard"),
        grams: 111,
        projectCount: 3,
      },
      {
        materialId: "steel-can",
        label: labelOf("steel-can"),
        grams: 90,
        projectCount: 1,
      },
      {
        materialId: "bottle-cap",
        label: labelOf("bottle-cap"),
        grams: 62,
        projectCount: 2,
      },
    ]);
  });

  it("breaks equal material gram ties using canonical taxonomy order and counts duplicate material rows once per project", () => {
    const customProjects: ImpactProjectSummary[] = [
      {
        slug: "alpha",
        title: "Alpha",
        difficulty: "easy",
        timeMinutes: 10,
        wasteDiverted: [
          { materialId: "cardboard", grams: 20 },
          { materialId: "cardboard", grams: 20 },
          { materialId: "pet-bottle", grams: 40 },
        ],
      },
    ];

    const summary = summarizeImpact(["alpha"], customProjects);
    expect(summary.totalGrams).toBe(80);
    expect(summary.byMaterial.map((entry) => [entry.materialId, entry.grams, entry.projectCount])).toEqual([
      ["pet-bottle", 40, 1],
      ["cardboard", 40, 1],
    ]);
  });

  it("normalizes slugs in stable catalog order", () => {
    expect(
      normalizeCompletedSlugs(
        ["cardboard-desk-tray", "pet-self-watering-planter", "cardboard-desk-tray", "nope"],
        CATALOG_SUMMARIES,
      ),
    ).toEqual(["pet-self-watering-planter", "cardboard-desk-tray"]);
  });

  it("formats gram and kilogram values safely", () => {
    expect(formatGrams(0)).toBe("0 g");
    expect(formatGrams(-5)).toBe("0 g");
    expect(formatGrams(40)).toBe("40 g");
    expect(formatGrams(1250)).toBe("1,250 g");
    expect(formatKilograms(1250)).toBe("1.25 kg");
  });
});

describe("impact storage", () => {
  it("validates stored values and ignores malformed or unrelated storage entries", () => {
    expect(isValidCompletionValue(IMPACT_STORAGE_VALUE)).toBe(true);
    expect(isValidCompletionValue("{bad json")).toBe(false);
    expect(isValidCompletionValue('{"v":2}')).toBe(false);
    expect(isValidCompletionValue("true")).toBe(false);
    expect(isValidCompletionValue("null")).toBe(false);
    expect(isValidCompletionValue("")).toBe(false);
    expect(isValidCompletionValue(null)).toBe(false);

    const storage = createMemoryStorage({
      theme: "dark",
      [completionStorageKey("pet-self-watering-planter")]: IMPACT_STORAGE_VALUE,
      [completionStorageKey("cardboard-desk-tray")]: "{not-json",
      [completionStorageKey("t-shirt-no-sew-tote")]: '{"v":2}',
      [completionStorageKey("steel-can-pencil-cup")]: "1",
      [`${IMPACT_STORAGE_PREFIX}`]: IMPACT_STORAGE_VALUE,
      [`${IMPACT_STORAGE_PREFIX}BAD_SLUG`]: IMPACT_STORAGE_VALUE,
      [completionStorageKey("unknown-old-slug")]: IMPACT_STORAGE_VALUE,
    });

    const read = readCompletedSlugs(storage);
    expect(read.ok).toBe(true);
    expect(read.slugs).toEqual(["pet-self-watering-planter", "unknown-old-slug"]);

    // Unknown stored slugs are excluded when summarizing against the catalog.
    const summary = summarizeImpact(read.slugs, CATALOG_SUMMARIES);
    expect(summary.completedCount).toBe(1);
    expect(summary.completedProjects[0].slug).toBe("pet-self-watering-planter");
  });

  it("persists mark and undo across reloads and keeps marking idempotent", () => {
    const storage = createMemoryStorage();
    const storeBeforeReload = createImpactStore({ getStorage: () => storage });

    expect(storeBeforeReload.setCompleted("pet-self-watering-planter", true)).toBe(true);
    expect(storeBeforeReload.setCompleted("pet-self-watering-planter", true)).toBe(true);
    expect(storeBeforeReload.getSnapshot().completedSlugs).toEqual([
      "pet-self-watering-planter",
    ]);

    // Fresh store instance simulates page reload / navigation.
    const storeAfterReload = createImpactStore({ getStorage: () => storage });
    expect(storeAfterReload.getSnapshot().completedSlugs).toEqual([
      "pet-self-watering-planter",
    ]);

    // Undo removes the completion from storage and zeroes the summary.
    expect(storeAfterReload.setCompleted("pet-self-watering-planter", false)).toBe(true);
    expect(storeAfterReload.getSnapshot().completedSlugs).toEqual([]);
    expect(storage.data.size).toBe(0);
    expect(
      summarizeImpact(storeAfterReload.getSnapshot().completedSlugs, CATALOG_SUMMARIES)
        .completedCount,
    ).toBe(0);
  });

  it("handles unavailable or throwing storage without crashing", () => {
    expect(readCompletedSlugs(null)).toEqual({ slugs: [], ok: false });
    expect(writeProjectCompletion(null, "pet-self-watering-planter", true)).toBe(false);

    const blockedStore = createImpactStore({
      getStorage: () => {
        throw new Error("SecurityError: storage blocked");
      },
    });
    expect(blockedStore.getSnapshot()).toEqual({
      completedSlugs: [],
      storageUnavailable: true,
    });

    // Falls back to in-memory session state when writes fail.
    expect(blockedStore.setCompleted("pet-self-watering-planter", true)).toBe(false);
    expect(blockedStore.getSnapshot()).toEqual({
      completedSlugs: ["pet-self-watering-planter"],
      storageUnavailable: true,
    });
    expect(blockedStore.setCompleted("pet-self-watering-planter", false)).toBe(false);
    expect(blockedStore.getSnapshot()).toEqual({
      completedSlugs: [],
      storageUnavailable: true,
    });

    const baseQuotaStorage = createMemoryStorage({
      [completionStorageKey("cardboard-desk-tray")]: IMPACT_STORAGE_VALUE,
    });
    const quotaStorage: StorageLike = {
      get length() {
        return baseQuotaStorage.length;
      },
      key: (index) => baseQuotaStorage.key(index),
      getItem: (key) => baseQuotaStorage.getItem(key),
      setItem() {
        throw new Error("QuotaExceededError");
      },
      removeItem() {
        throw new Error("QuotaExceededError");
      },
    };
    const quotaStore = createImpactStore({ getStorage: () => quotaStorage });
    expect(quotaStore.getSnapshot()).toEqual({
      completedSlugs: ["cardboard-desk-tray"],
      storageUnavailable: false,
    });
    expect(quotaStore.setCompleted("pet-self-watering-planter", true)).toBe(false);
    expect(quotaStore.getSnapshot()).toEqual({
      completedSlugs: ["cardboard-desk-tray", "pet-self-watering-planter"],
      storageUnavailable: true,
    });
  });

  it("keeps storageUnavailable true after partial write recovery until all unsaved changes persist", () => {
    const backing = createMemoryStorage();
    let failWrites = true;
    const flakyStorage: StorageLike = {
      get length() {
        return backing.length;
      },
      key: (index) => backing.key(index),
      getItem: (key) => backing.getItem(key),
      setItem(key, value) {
        if (failWrites) throw new Error("QuotaExceededError");
        backing.setItem(key, value);
      },
      removeItem(key) {
        if (failWrites) throw new Error("QuotaExceededError");
        backing.removeItem(key);
      },
    };

    const store = createImpactStore({ getStorage: () => flakyStorage });

    // Multiple writes fail and stay in memory.
    expect(store.setCompleted("pet-self-watering-planter", true)).toBe(false);
    expect(store.setCompleted("cardboard-desk-tray", true)).toBe(false);
    expect(store.getSnapshot()).toEqual({
      completedSlugs: ["cardboard-desk-tray", "pet-self-watering-planter"],
      storageUnavailable: true,
    });

    // A later distinct write succeeds, but earlier failed writes remain unsaved.
    failWrites = false;
    expect(store.setCompleted("t-shirt-no-sew-tote", true)).toBe(true);
    expect(store.getSnapshot()).toEqual({
      completedSlugs: [
        "cardboard-desk-tray",
        "pet-self-watering-planter",
        "t-shirt-no-sew-tote",
      ],
      storageUnavailable: true,
    });

    // Clearing one failed override still leaves the other unsaved.
    expect(store.setCompleted("cardboard-desk-tray", false)).toBe(true);
    expect(store.getSnapshot()).toEqual({
      completedSlugs: ["pet-self-watering-planter", "t-shirt-no-sew-tote"],
      storageUnavailable: true,
    });

    // Persisting the remaining unsaved override clears storageUnavailable.
    expect(store.setCompleted("pet-self-watering-planter", true)).toBe(true);
    expect(store.getSnapshot()).toEqual({
      completedSlugs: ["pet-self-watering-planter", "t-shirt-no-sew-tote"],
      storageUnavailable: false,
    });
  });

  it("keeps open tabs consistent via storage events and cleans up listeners", () => {
    const storage = createMemoryStorage();
    const otherArea = createMemoryStorage();
    const busA = createEventBus();
    const busB = createEventBus();

    const tabA = createImpactStore({
      getStorage: () => storage,
      getEventSource: () => busA,
    });
    const tabB = createImpactStore({
      getStorage: () => storage,
      getEventSource: () => busB,
    });

    const onChangeA = vi.fn();
    const onChangeB = vi.fn();
    const unsubscribeA = tabA.subscribe(onChangeA);
    const unsubscribeB = tabB.subscribe(onChangeB);

    // Tab A marks a guide; browser delivers storage event to Tab B.
    tabA.setCompleted("pet-self-watering-planter", true);
    busB.dispatch({
      key: completionStorageKey("pet-self-watering-planter"),
      storageArea: storage,
    });
    expect(onChangeB).toHaveBeenCalledTimes(1);
    expect(tabB.getSnapshot().completedSlugs).toEqual(["pet-self-watering-planter"]);

    // Unrelated key and unrelated storageArea are ignored.
    busB.dispatch({ key: "other-app-key", storageArea: storage });
    busB.dispatch({
      key: completionStorageKey("cardboard-desk-tray"),
      storageArea: otherArea,
    });
    expect(onChangeB).toHaveBeenCalledTimes(1);

    // Tab B undoes the guide; browser delivers storage event to Tab A.
    tabB.setCompleted("pet-self-watering-planter", false);
    busA.dispatch({
      key: completionStorageKey("pet-self-watering-planter"),
      storageArea: storage,
    });
    expect(tabA.getSnapshot().completedSlugs).toEqual([]);

    // Full storage clear (key === null) resets open tabs.
    tabA.setCompleted("cardboard-desk-tray", true);
    busB.dispatch({
      key: completionStorageKey("cardboard-desk-tray"),
      storageArea: storage,
    });
    expect(tabB.getSnapshot().completedSlugs).toEqual(["cardboard-desk-tray"]);
    storage.data.clear();
    busA.dispatch({ key: null, storageArea: storage });
    busB.dispatch({ key: null, storageArea: storage });
    expect(tabA.getSnapshot().completedSlugs).toEqual([]);
    expect(tabB.getSnapshot().completedSlugs).toEqual([]);

    unsubscribeA();
    unsubscribeB();
    expect(busA.listenerCount()).toBe(0);
    expect(busB.listenerCount()).toBe(0);
  });

  it("avoids lost edits when two tabs edit distinct guides without intermediate sync", () => {
    const storage = createMemoryStorage();
    const tabA = createImpactStore({ getStorage: () => storage });
    const tabB = createImpactStore({ getStorage: () => storage });

    // Both tabs initially observe empty state.
    expect(tabA.getSnapshot().completedSlugs).toEqual([]);
    expect(tabB.getSnapshot().completedSlugs).toEqual([]);

    // Tab A marks guide 1; Tab B marks guide 2 before receiving any storage event.
    tabA.setCompleted("pet-self-watering-planter", true);
    tabB.setCompleted("cardboard-desk-tray", true);

    expect(readCompletedSlugs(storage).slugs).toEqual([
      "cardboard-desk-tray",
      "pet-self-watering-planter",
    ]);

    // Tab A undoes guide 1 while Tab B marks guide 3 without intermediate sync.
    tabA.setCompleted("pet-self-watering-planter", false);
    tabB.setCompleted("t-shirt-no-sew-tote", true);

    expect(readCompletedSlugs(storage).slugs).toEqual([
      "cardboard-desk-tray",
      "t-shirt-no-sew-tote",
    ]);
  });
});
