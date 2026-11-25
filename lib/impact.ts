import { isMaterialId, labelOf, MATERIAL_IDS, type MaterialId } from "./taxonomy";

export const IMPACT_STORAGE_PREFIX = "remake3d:impact:v1:made:";
export const IMPACT_STORAGE_VALUE = '{"v":1}';

const SLUG_RE = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const MATERIAL_ORDER = new Map<MaterialId, number>(
  MATERIAL_IDS.map((id, index) => [id, index]),
);

const gramsFormat = new Intl.NumberFormat("en", { maximumFractionDigits: 1 });
const kilogramsFormat = new Intl.NumberFormat("en", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export interface WasteEntry {
  readonly materialId: MaterialId;
  readonly grams: number;
}

/**
 * Lightweight project summary for impact tracking.
 * Keeps 3D scenes, steps, ops, and sources out of client bundles.
 */
export interface ImpactProjectSummary {
  readonly slug: string;
  readonly title: string;
  readonly difficulty: "easy" | "medium" | "hard";
  readonly timeMinutes: number;
  readonly wasteDiverted: readonly WasteEntry[];
}

export interface MaterialImpact {
  readonly materialId: MaterialId;
  readonly label: string;
  readonly grams: number;
  readonly projectCount: number;
}

export interface ImpactSummary {
  readonly completedProjects: readonly ImpactProjectSummary[];
  readonly completedCount: number;
  readonly totalProjects: number;
  readonly totalGrams: number;
  readonly byMaterial: readonly MaterialImpact[];
}

export interface StorageLike {
  readonly length: number;
  key(index: number): string | null;
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

export interface StorageEventLike {
  readonly key: string | null;
  readonly storageArea?: unknown;
}

export interface StorageEventSource {
  addEventListener(type: "storage", listener: (event: StorageEventLike) => void): void;
  removeEventListener(type: "storage", listener: (event: StorageEventLike) => void): void;
}

export interface StorageReadResult {
  readonly slugs: readonly string[];
  readonly ok: boolean;
}

export interface ImpactSnapshot {
  readonly completedSlugs: readonly string[];
  readonly storageUnavailable: boolean;
}

export interface ImpactStoreOptions {
  getStorage: () => StorageLike | null | undefined;
  getEventSource?: () => StorageEventSource | null | undefined;
}

export interface ImpactStore {
  getSnapshot(): ImpactSnapshot;
  getServerSnapshot(): ImpactSnapshot;
  subscribe(listener: () => void): () => void;
  setCompleted(slug: string, completed: boolean): boolean;
}

const SERVER_SNAPSHOT: ImpactSnapshot = Object.freeze({
  completedSlugs: Object.freeze([]),
  storageUnavailable: false,
});

/** Strip 3D scene/step/source fields before passing catalog summaries to client components. */
export function toImpactProjectSummaries(
  projects: readonly ImpactProjectSummary[],
): ImpactProjectSummary[] {
  return projects.map((project) => ({
    slug: project.slug,
    title: project.title,
    difficulty: project.difficulty,
    timeMinutes: project.timeMinutes,
    wasteDiverted: project.wasteDiverted.map(({ materialId, grams }) => ({
      materialId,
      grams,
    })),
  }));
}

export function projectWasteGrams(wasteDiverted: readonly WasteEntry[]): number {
  let total = 0;
  for (const { grams } of wasteDiverted) {
    if (Number.isFinite(grams) && grams > 0) {
      total += grams;
    }
  }
  return total;
}

export function formatGrams(grams: number): string {
  const safe = Number.isFinite(grams) && grams > 0 ? grams : 0;
  return `${gramsFormat.format(safe)} g`;
}

export function formatKilograms(grams: number): string {
  const safe = Number.isFinite(grams) && grams > 0 ? grams : 0;
  return `${kilogramsFormat.format(safe / 1000)} kg`;
}

/**
 * Deduplicate and filter raw slugs against known catalog projects, returning slugs in catalog order.
 */
export function normalizeCompletedSlugs(
  slugs: readonly unknown[],
  projects: readonly Pick<ImpactProjectSummary, "slug">[],
): string[] {
  const seen = new Set<string>();
  for (const candidate of slugs) {
    if (typeof candidate === "string" && SLUG_RE.test(candidate)) {
      seen.add(candidate);
    }
  }
  return projects
    .filter((project) => seen.has(project.slug))
    .map((project) => project.slug);
}

/**
 * Aggregate completed guides and estimated reused grams overall and by material.
 * Counts each guide at most once and ignores unknown or malformed slugs.
 */
export function summarizeImpact(
  completedSlugs: readonly unknown[],
  projects: readonly ImpactProjectSummary[],
): ImpactSummary {
  const completedSet = new Set(normalizeCompletedSlugs(completedSlugs, projects));
  const completedProjects = projects.filter((project) => completedSet.has(project.slug));

  const materialTotals = new Map<MaterialId, { grams: number; projectCount: number }>();
  let totalGrams = 0;

  for (const project of completedProjects) {
    const seenMaterialsInProject = new Set<MaterialId>();
    for (const { materialId, grams } of project.wasteDiverted) {
      if (!isMaterialId(materialId) || !Number.isFinite(grams) || grams <= 0) {
        continue;
      }
      const existing = materialTotals.get(materialId) ?? { grams: 0, projectCount: 0 };
      existing.grams += grams;
      if (!seenMaterialsInProject.has(materialId)) {
        existing.projectCount += 1;
        seenMaterialsInProject.add(materialId);
      }
      materialTotals.set(materialId, existing);
      totalGrams += grams;
    }
  }

  const byMaterial: MaterialImpact[] = [...materialTotals.entries()]
    .map(([materialId, totals]) => ({
      materialId,
      label: labelOf(materialId),
      grams: totals.grams,
      projectCount: totals.projectCount,
    }))
    .sort((a, b) => {
      if (b.grams !== a.grams) return b.grams - a.grams;
      return (MATERIAL_ORDER.get(a.materialId) ?? 0) - (MATERIAL_ORDER.get(b.materialId) ?? 0);
    });

  return {
    completedProjects,
    completedCount: completedProjects.length,
    totalProjects: projects.length,
    totalGrams,
    byMaterial,
  };
}

export function completionStorageKey(slug: string): string {
  return `${IMPACT_STORAGE_PREFIX}${slug}`;
}

export function isValidCompletionValue(raw: string | null): boolean {
  if (typeof raw !== "string" || raw.length === 0) return false;
  try {
    const parsed: unknown = JSON.parse(raw);
    return (
      typeof parsed === "object" &&
      parsed !== null &&
      !Array.isArray(parsed) &&
      (parsed as { v?: unknown }).v === 1
    );
  } catch {
    return false;
  }
}

/**
 * Read completed guide slugs from per-guide storage entries.
 * Ignores unrelated keys, malformed values, and invalid slugs without throwing.
 */
export function readCompletedSlugs(storage: StorageLike | null | undefined): StorageReadResult {
  if (!storage) {
    return { slugs: [], ok: false };
  }

  try {
    const count = storage.length;
    if (typeof count !== "number" || !Number.isFinite(count) || count < 0) {
      return { slugs: [], ok: false };
    }

    const found = new Set<string>();
    for (let i = 0; i < count; i += 1) {
      const key = storage.key(i);
      if (typeof key !== "string" || !key.startsWith(IMPACT_STORAGE_PREFIX)) {
        continue;
      }
      const slug = key.slice(IMPACT_STORAGE_PREFIX.length);
      if (!SLUG_RE.test(slug)) {
        continue;
      }
      const raw = storage.getItem(key);
      if (isValidCompletionValue(raw)) {
        found.add(slug);
      }
    }

    return { slugs: [...found].sort(), ok: true };
  } catch {
    return { slugs: [], ok: false };
  }
}

/**
 * Persist or remove a single guide's completion key independently.
 * Per-guide keys prevent concurrent or stale edits to distinct guides from overwriting each other.
 */
export function writeProjectCompletion(
  storage: StorageLike | null | undefined,
  slug: string,
  completed: boolean,
): boolean {
  if (!storage || !SLUG_RE.test(slug)) {
    return false;
  }

  const key = completionStorageKey(slug);
  try {
    if (completed) {
      storage.setItem(key, IMPACT_STORAGE_VALUE);
    } else {
      storage.removeItem(key);
    }
    return true;
  } catch {
    return false;
  }
}

function sameStringArray(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i += 1) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * External store backed by per-guide localStorage keys with cross-tab `storage` sync
 * and an in-memory fallback when browser storage is unavailable or full.
 */
export function createImpactStore(options: ImpactStoreOptions): ImpactStore {
  const listeners = new Set<() => void>();
  const memoryOverrides = new Map<string, boolean>();
  let currentSnapshot: ImpactSnapshot | null = null;
  let attachedEventSource: StorageEventSource | null = null;

  function safeGetStorage(): StorageLike | null {
    try {
      return options.getStorage() ?? null;
    } catch {
      return null;
    }
  }

  function safeGetEventSource(): StorageEventSource | null {
    try {
      return options.getEventSource?.() ?? null;
    } catch {
      return null;
    }
  }

  function computeSnapshot(): ImpactSnapshot {
    const read = readCompletedSlugs(safeGetStorage());
    const merged = new Set<string>(read.slugs);
    for (const [slug, done] of memoryOverrides) {
      if (done) merged.add(slug);
      else merged.delete(slug);
    }

    const nextSlugs = [...merged].sort();
    const storageUnavailable = !read.ok || memoryOverrides.size > 0;

    if (
      currentSnapshot &&
      currentSnapshot.storageUnavailable === storageUnavailable &&
      sameStringArray(currentSnapshot.completedSlugs, nextSlugs)
    ) {
      return currentSnapshot;
    }

    currentSnapshot = Object.freeze({
      completedSlugs: Object.freeze(nextSlugs),
      storageUnavailable,
    });
    return currentSnapshot;
  }

  function emit(): void {
    for (const listener of listeners) {
      listener();
    }
  }

  function syncFromStorage(): void {
    const previous = currentSnapshot;
    const next = computeSnapshot();
    if (previous !== next) {
      emit();
    }
  }

  function handleStorageEvent(event: StorageEventLike): void {
    const storage = safeGetStorage();
    if (event.storageArea && storage && event.storageArea !== storage) {
      return;
    }
    if (event.key === null) {
      memoryOverrides.clear();
      syncFromStorage();
      return;
    }
    if (!event.key.startsWith(IMPACT_STORAGE_PREFIX)) {
      return;
    }
    const slug = event.key.slice(IMPACT_STORAGE_PREFIX.length);
    memoryOverrides.delete(slug);
    syncFromStorage();
  }

  function getSnapshot(): ImpactSnapshot {
    if (!currentSnapshot) {
      return computeSnapshot();
    }
    return currentSnapshot;
  }

  function getServerSnapshot(): ImpactSnapshot {
    return SERVER_SNAPSHOT;
  }

  function subscribe(listener: () => void): () => void {
    listeners.add(listener);
    if (listeners.size === 1) {
      computeSnapshot();
      const source = safeGetEventSource();
      if (source) {
        source.addEventListener("storage", handleStorageEvent);
        attachedEventSource = source;
      }
    }

    return () => {
      listeners.delete(listener);
      if (listeners.size === 0) {
        if (attachedEventSource) {
          attachedEventSource.removeEventListener("storage", handleStorageEvent);
          attachedEventSource = null;
        }
        currentSnapshot = null;
      }
    };
  }

  function setCompleted(slug: string, completed: boolean): boolean {
    if (!SLUG_RE.test(slug)) return false;

    const storage = safeGetStorage();
    const persisted = writeProjectCompletion(storage, slug, completed);
    if (persisted) {
      memoryOverrides.delete(slug);
    } else {
      memoryOverrides.set(slug, completed);
    }

    syncFromStorage();
    return persisted;
  }

  return {
    getSnapshot,
    getServerSnapshot,
    subscribe,
    setCompleted,
  };
}
