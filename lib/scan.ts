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

export const ALLOWED_IMAGE_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type ScanImageMimeType = (typeof ALLOWED_IMAGE_MIME_TYPES)[number];

export type ScanItemId = MaterialId | ToolId;

export interface ScanItem {
  id: ScanItemId;
  confidence: number;
}

export interface ScanResponse {
  items: ScanItem[];
}

export type ScanErrorCode =
  | "empty_image"
  | "unsupported_media_type"
  | "payload_too_large"
  | "invalid_image"
  | "provider_unavailable"
  | "provider_failed";

export interface ScanErrorResponse {
  error: ScanErrorCode;
  message: string;
}

const CANONICAL_ORDER = new Map<ScanItemId, number>(
  ([...MATERIAL_IDS, ...TOOL_IDS] as readonly ScanItemId[]).map((id, index) => [id, index]),
);

export function isAllowedScanMimeType(value: string): value is ScanImageMimeType {
  return (ALLOWED_IMAGE_MIME_TYPES as readonly string[]).includes(value);
}

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
