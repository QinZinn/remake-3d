import type { Inventory } from "./inventory";
import {
  isMaterialId,
  isToolId,
  MATERIAL_IDS,
  TOOL_IDS,
  type MaterialId,
  type ToolId,
} from "./taxonomy";

export const MAX_SCAN_IMAGE_BYTES = 4 * 1024 * 1024;

export type ScanItemId = MaterialId | ToolId;

export interface ScanItem {
  id: ScanItemId;
  confidence: number;
}

export type ScanRegion = "full" | "top-left" | "bottom-left" | "top-right" | "bottom-right";

export interface RegionScanItem extends ScanItem {
  region: ScanRegion;
}

export interface ScanResponse {
  items: ScanItem[];
}

const CONTAINER_IDS: ReadonlySet<ScanItemId> = new Set(["pet-bottle", "glass-bottle", "glass-jar"]);
const OPPOSITE_CORNERS: readonly (readonly [ScanRegion, ScanRegion])[] = [
  ["top-left", "bottom-right"],
  ["top-right", "bottom-left"],
];
const FULL_CONTAINER_MIN_CONFIDENCE = 0.4;
const SEPARATE_CONTAINER_MIN_CONFIDENCE = 0.65;
const CLEAR_SUPPORT_RATIO = 2;

const CANONICAL_ORDER = new Map<ScanItemId, number>(
  ([...MATERIAL_IDS, ...TOOL_IDS] as readonly ScanItemId[]).map((id, index) => [id, index]),
);

export function isScanItemId(id: string): id is ScanItemId {
  return isMaterialId(id) || isToolId(id);
}

/**
 * Validate and normalize a raw `{ items: [...] }` payload against the canonical taxonomy.
 *
 * Returns `null` if the top-level structure is malformed (not an object with an `items` array).
 * Drops unknown IDs and malformed rows, and collapses duplicates to their highest confidence score.
 */
export function sanitizeScanItems(raw: unknown): ScanItem[] | null {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) {
    return null;
  }

  const candidate = (raw as { items?: unknown }).items;
  if (!Array.isArray(candidate)) {
    return null;
  }

  const bestById = new Map<ScanItemId, number>();

  for (const row of candidate) {
    if (typeof row !== "object" || row === null || Array.isArray(row)) {
      continue;
    }

    const { id, confidence } = row as { id?: unknown; confidence?: unknown };
    if (typeof id !== "string" || !isScanItemId(id)) {
      continue;
    }
    if (
      typeof confidence !== "number" ||
      !Number.isFinite(confidence) ||
      confidence < 0 ||
      confidence > 1
    ) {
      continue;
    }

    const previous = bestById.get(id);
    if (previous === undefined || confidence > previous) {
      bestById.set(id, confidence);
    }
  }

  return [...bestById.entries()]
    .map(([id, confidence]) => ({ id, confidence }))
    .sort((a, b) => {
      if (b.confidence !== a.confidence) {
        return b.confidence - a.confidence;
      }
      return (CANONICAL_ORDER.get(a.id) ?? 0) - (CANONICAL_ORDER.get(b.id) ?? 0);
    });
}

/**
 * Merge confirmed scanned material IDs into an existing materials map.
 * New material IDs default to quantity `1`; existing quantities are preserved.
 */
export function mergeScannedMaterials(
  current: Inventory["materials"],
  ids: readonly ScanItemId[],
): Inventory["materials"] {
  let changed = false;
  const next: Inventory["materials"] = { ...current };

  for (const id of ids) {
    if (isMaterialId(id) && next[id] === undefined) {
      next[id] = 1;
      changed = true;
    }
  }

  return changed ? next : current;
}

/**
 * Merge confirmed scanned tool IDs into an existing tool list without duplicates.
 */
export function mergeScannedTools(
  current: readonly ToolId[],
  ids: readonly ScanItemId[],
): readonly ToolId[] {
  let next: ToolId[] | null = null;

  for (const id of ids) {
    if (isToolId(id) && !(next ?? current).includes(id)) {
      if (!next) {
        next = [...current];
      }
      next.push(id);
    }
  }

  return next ?? current;
}

function strongRegionContainer(containers: readonly RegionScanItem[], region: ScanRegion): ScanItemId | undefined {
  const ids = new Set(
    containers
      .filter((item) => item.region === region && item.confidence >= SEPARATE_CONTAINER_MIN_CONFIDENCE)
      .map((item) => item.id),
  );
  return ids.size === 1 ? [...ids][0] : undefined;
}

function resolveContainerConflict(containers: readonly RegionScanItem[]): readonly RegionScanItem[] {
  const separated = new Set<ScanItemId>();
  for (const [first, second] of OPPOSITE_CORNERS) {
    const firstId = strongRegionContainer(containers, first);
    const secondId = strongRegionContainer(containers, second);
    if (firstId && secondId && firstId !== secondId) {
      separated.add(firstId);
      separated.add(secondId);
    }
  }
  if (separated.size > 0) return containers.filter((item) => separated.has(item.id));

  const full = containers.filter((item) => item.region === "full");
  if (full.length === 1 && full[0].confidence >= FULL_CONTAINER_MIN_CONFIDENCE) {
    return containers.filter((item) => item.id === full[0].id);
  }

  const totals = new Map<ScanItemId, number>();
  let total = 0;
  for (const { id, confidence } of containers) {
    totals.set(id, (totals.get(id) ?? 0) + confidence);
    total += confidence;
  }
  const top = [...totals.entries()].sort((a, b) => b[1] - a[1])[0];
  return top && top[1] > 0 && top[1] >= (total - top[1]) * CLEAR_SUPPORT_RATIO
    ? containers.filter((item) => item.id === top[0])
    : [];
}

/** Resolve per-region detections into sanitized items, conservatively resolving transparent container conflicts. */
export function resolveScanRegionItems(detections: readonly RegionScanItem[]): ScanItem[] {
  const valid = detections.filter((item) => sanitizeScanItems({ items: [item] })?.length === 1);
  const containers = valid.filter((item) => CONTAINER_IDS.has(item.id));
  const resolved =
    new Set(containers.map((item) => item.id)).size > 1
      ? [...valid.filter((item) => !CONTAINER_IDS.has(item.id)), ...resolveContainerConflict(containers)]
      : valid;
  return sanitizeScanItems({ items: resolved }) ?? [];
}
