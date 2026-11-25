"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import {
  sanitizeScanItems,
  type ScanErrorResponse,
  type ScanItem,
  type ScanItemId,
} from "@/lib/scan";
import { isMaterialId, labelOf, type MaterialId, type ToolId } from "@/lib/taxonomy";
import {
  formatFileSize,
  preparePhotoForUpload,
  validateSelectedFile,
} from "./preparePhoto";

interface PhotoScanPanelProps {
  existingMaterials: ReadonlySet<MaterialId>;
  existingTools: ReadonlySet<ToolId>;
  onConfirmItems: (ids: readonly ScanItemId[]) => void;
}

type ScanState =
  | { kind: "idle" }
  | { kind: "ready" }
  | { kind: "scanning" }
  | { kind: "canceled" }
  | { kind: "review"; items: ScanItem[] }
  | { kind: "empty" }
  | { kind: "confirmed"; addedCount: number; alreadyPresentCount: number }
  | { kind: "unavailable"; message: string }
  | { kind: "error"; message: string };

function isScanErrorResponse(value: unknown): value is ScanErrorResponse {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { error?: unknown }).error === "string" &&
    typeof (value as { message?: unknown }).message === "string"
  );
}

export default function PhotoScanPanel({
  existingMaterials,
  existingTools,
  onConfirmItems,
}: PhotoScanPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const activeControllersRef = useRef<Set<AbortController>>(new Set());
  const requestIdRef = useRef(0);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [scanState, setScanState] = useState<ScanState>({ kind: "idle" });
  const [chosenIds, setChosenIds] = useState<ReadonlySet<ScanItemId>>(new Set());

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  useEffect(() => {
    const controllers = activeControllersRef.current;
    return () => {
      for (const controller of controllers) {
        controller.abort();
      }
      controllers.clear();
    };
  }, []);

  function cancelInFlight() {
    requestIdRef.current += 1;
    for (const controller of activeControllersRef.current) {
      controller.abort();
    }
    activeControllersRef.current.clear();
  }

  function handleFileSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    if (!file) return;

    cancelInFlight();
    setChosenIds(new Set());

    const validationError = validateSelectedFile(file);
    if (validationError) {
      setSelectedFile(null);
      setScanState({ kind: "error", message: validationError });
      return;
    }

    setSelectedFile(file);
    setScanState({ kind: "ready" });
  }

  function handleCancelScan() {
    cancelInFlight();
    setScanState(selectedFile ? { kind: "canceled" } : { kind: "idle" });
  }

  function handleRemovePhoto() {
    cancelInFlight();
    setSelectedFile(null);
    setChosenIds(new Set());
    setScanState({ kind: "idle" });
  }

  async function handleScanPhoto() {
    if (!selectedFile || scanState.kind === "scanning") return;

    cancelInFlight();
    const requestId = requestIdRef.current;
    const controller = new AbortController();
    activeControllersRef.current.add(controller);

    setChosenIds(new Set());
    setScanState({ kind: "scanning" });

    try {
      const prepared = await preparePhotoForUpload(selectedFile);
      if (requestId !== requestIdRef.current || controller.signal.aborted) return;

      if (!prepared.ok) {
        setScanState({ kind: "error", message: prepared.message });
        return;
      }

      const response = await fetch("/api/scan", {
        method: "POST",
        headers: {
          "content-type": prepared.mediaType,
        },
        body: prepared.blob,
        signal: controller.signal,
      });

      if (requestId !== requestIdRef.current || controller.signal.aborted) return;

      let payload: unknown = null;
      try {
        payload = await response.json();
      } catch {
        payload = null;
      }

      if (requestId !== requestIdRef.current || controller.signal.aborted) return;

      if (!response.ok) {
        const errorBody = isScanErrorResponse(payload) ? payload : null;
        if (response.status === 503 || errorBody?.error === "provider_unavailable") {
          setScanState({
            kind: "unavailable",
            message:
              errorBody?.message ??
              "Photo scanning is currently unavailable. You can still add materials and tools manually.",
          });
          return;
        }

        setScanState({
          kind: "error",
          message:
            errorBody?.message ??
            "We could not scan this photo right now. You can try again, choose another photo, or add items manually.",
        });
        return;
      }

      const items = sanitizeScanItems(payload);
      if (items === null) {
        setScanState({
          kind: "error",
          message:
            "We received an unexpected scan response. Please try again or add items manually.",
        });
        return;
      }

      if (items.length === 0) {
        setScanState({ kind: "empty" });
        return;
      }

      setChosenIds(new Set(items.filter(({ confidence }) => confidence >= 0.7).map(({ id }) => id)));
      setScanState({ kind: "review", items });
    } catch {
      if (requestId !== requestIdRef.current || controller.signal.aborted) return;
      setScanState({
        kind: "error",
        message:
          "Could not reach the scan service. Check your connection or add items manually below.",
      });
    } finally {
      activeControllersRef.current.delete(controller);
    }
  }

  function toggleProposedItem(id: ScanItemId) {
    setChosenIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function handleConfirmProposed() {
    if (scanState.kind !== "review") return;
    const selectedIds = scanState.items
      .map((item) => item.id)
      .filter((id) => chosenIds.has(id));
    if (selectedIds.length === 0) return;

    let addedCount = 0;
    let alreadyPresentCount = 0;
    for (const id of selectedIds) {
      const exists = isMaterialId(id)
        ? existingMaterials.has(id)
        : existingTools.has(id);
      if (exists) {
        alreadyPresentCount += 1;
      } else {
        addedCount += 1;
      }
    }

    onConfirmItems(selectedIds);
    setChosenIds(new Set());
    setScanState({ kind: "confirmed", addedCount, alreadyPresentCount });
  }

  function handleDismissProposed() {
    setChosenIds(new Set());
    setScanState(selectedFile ? { kind: "ready" } : { kind: "idle" });
  }

  const isScanning = scanState.kind === "scanning";
  const selectedProposedCount =
    scanState.kind === "review"
      ? scanState.items.filter((item) => chosenIds.has(item.id)).length
      : 0;

  return (
    <section
      aria-labelledby="photo-scan-heading"
      className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs sm:p-6"
    >
      <h2 id="photo-scan-heading" className="text-lg font-semibold tracking-tight text-emerald-950">
        Scan a photo
      </h2>
      <p className="mt-1.5 text-sm leading-relaxed text-stone-600">
        Identify materials and tools from a photo. You choose which suggestions to add.
      </p>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-label="Choose a photo from device"
        tabIndex={-1}
        onChange={handleFileSelected}
        className="sr-only"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        capture="environment"
        aria-label="Take a photo with camera"
        tabIndex={-1}
        onChange={handleFileSelected}
        className="sr-only"
      />

      {!selectedFile ? (
        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="action-secondary focus-ring"
          >
            Choose photo
          </button>
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            className="action-secondary focus-ring"
          >
            Take photo
          </button>
          <p className="basis-full text-xs text-stone-500">
            Photos are resized on your device and uploaded for recognition when you press Scan photo.
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="overflow-hidden rounded-xl border border-stone-200 bg-[#fbfcf9]">
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Selected photo preview"
                className="max-h-64 w-full object-contain bg-stone-100/70"
              />
            )}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-200/80 px-3.5 py-2.5 text-xs text-stone-600">
              <span className="truncate font-medium text-stone-700" title={selectedFile.name}>
                {selectedFile.name}
              </span>
              <div className="flex shrink-0 items-center gap-3">
                <span>{formatFileSize(selectedFile.size)}</span>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="focus-ring rounded-sm font-semibold text-stone-600 underline-offset-4 hover:text-emerald-900 hover:underline"
                >
                  Remove photo
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={handleScanPhoto}
              disabled={isScanning}
              className="action-primary focus-ring"
            >
              {isScanning ? "Scanning…" : "Scan photo"}
            </button>
            {isScanning && (
              <button
                type="button"
                onClick={handleCancelScan}
                className="action-secondary focus-ring"
              >
                Cancel scan
              </button>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="action-secondary focus-ring"
            >
              Choose another
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="action-secondary focus-ring"
            >
              Take new photo
            </button>
          </div>
        </div>
      )}

      {scanState.kind === "scanning" && (
        <div
          role="status"
          aria-live="polite"
          className="mt-4 flex items-center gap-3 rounded-xl border border-emerald-900/15 bg-[#edf3e6] px-4 py-3 text-sm text-emerald-950"
        >
          <span
            aria-hidden
            className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-emerald-800 border-t-transparent motion-reduce:animate-none"
          />
          <span>Scanning photo for ReMake materials and tools… Manual entry below stays available.</span>
        </div>
      )}

      {scanState.kind === "canceled" && (
        <p role="status" className="mt-4 rounded-xl bg-stone-100 px-4 py-3 text-sm text-stone-700">
          Scan canceled. You can scan this photo again, choose another image, or add items manually below.
        </p>
      )}

      {scanState.kind === "empty" && (
        <div
          role="status"
          className="mt-4 rounded-xl border border-stone-200 bg-[#fbfcf9] px-4 py-3 text-sm text-stone-700"
        >
          <p className="font-semibold text-emerald-950">No matching items detected</p>
          <p className="mt-1 text-stone-600">
            Try a brighter or closer photo, or search and add your materials and tools manually below.
          </p>
        </div>
      )}

      {scanState.kind === "unavailable" && (
        <div
          role="status"
          className="mt-4 rounded-xl border border-[#e7dac1] bg-[#f8f4eb] px-4 py-3 text-sm text-[#69481e]"
        >
          <p className="font-semibold">Photo scanning unavailable</p>
          <p className="mt-1">{scanState.message}</p>
        </div>
      )}

      {scanState.kind === "error" && (
        <div
          role="alert"
          className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900"
        >
          <p className="font-semibold">Scan failed</p>
          <p className="mt-1">{scanState.message}</p>
        </div>
      )}

      {scanState.kind === "confirmed" && (
        <p
          role="status"
          className="mt-4 rounded-xl border border-emerald-900/15 bg-[#edf3e6] px-4 py-3 text-sm text-emerald-950"
        >
          {scanState.addedCount > 0
            ? `Added ${scanState.addedCount} ${scanState.addedCount === 1 ? "item" : "items"} to your inventory.${
                scanState.alreadyPresentCount > 0
                  ? ` Kept ${scanState.alreadyPresentCount} already selected.`
                  : ""
              }`
            : "Selected items are already in your inventory with their existing quantities."}
        </p>
      )}

      {scanState.kind === "review" && (
        <div className="mt-4 rounded-xl border border-emerald-900/15 bg-[#f7faf3] p-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p role="status" className="text-sm font-semibold text-emerald-950">
              {`Found ${scanState.items.length} ${scanState.items.length === 1 ? "item" : "items"} — choose which to add`}
            </p>
            {scanState.items.length > 1 && (
              <button
                type="button"
                onClick={() => {
                  if (selectedProposedCount === scanState.items.length) {
                    setChosenIds(new Set());
                  } else {
                    setChosenIds(new Set(scanState.items.map((item) => item.id)));
                  }
                }}
                className="focus-ring rounded-sm text-xs font-semibold text-emerald-800 underline-offset-4 hover:underline"
              >
                {selectedProposedCount === scanState.items.length ? "Deselect all" : "Select all"}
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-stone-600">
            New materials start at 1. Existing quantities stay the same.
          </p>

          <ul aria-label="Detected items" className="mt-3 flex flex-wrap gap-2">
            {scanState.items.map(({ id, confidence }) => {
              const selected = chosenIds.has(id);
              const isMaterial = isMaterialId(id);
              const alreadyInInventory = isMaterial ? existingMaterials.has(id) : existingTools.has(id);
              const label = labelOf(id);

              return (
                <li key={id}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleProposedItem(id)}
                    className={`focus-ring inline-flex min-h-10 items-center gap-2 rounded-full border px-3.5 py-2 text-left text-sm font-medium transition-colors ${
                      selected
                        ? "border-emerald-700 bg-emerald-50 text-emerald-950 hover:bg-emerald-100/80"
                        : "border-stone-300 bg-white text-stone-600 hover:border-emerald-700 hover:text-emerald-950"
                    }`}
                  >
                    <span
                      aria-hidden
                      className={`text-xs font-bold ${selected ? "text-emerald-800" : "text-stone-400"}`}
                    >
                      {selected ? "✓" : "+"}
                    </span>
                    <span>{label}</span>
                    <span className="rounded-full bg-stone-900/5 px-2 py-0.5 text-[11px] font-medium text-stone-600">
                      {confidence < 0.7 ? "Check match" : isMaterial ? "Material" : "Tool"}
                    </span>
                    {alreadyInInventory && (
                      <span className="text-xs font-normal text-stone-500">(in inventory)</span>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="mt-4 flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              disabled={selectedProposedCount === 0}
              onClick={handleConfirmProposed}
              className="action-primary focus-ring"
            >
              {selectedProposedCount > 0
                ? `Add ${selectedProposedCount} selected to inventory`
                : "Select items to add"}
            </button>
            <button
              type="button"
              onClick={handleDismissProposed}
              className="action-secondary focus-ring"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
