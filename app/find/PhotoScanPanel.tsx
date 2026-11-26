"use client";

import { useEffect, useRef, useState, type ChangeEvent } from "react";
import { sanitizeScanItems, type ScanItem, type ScanItemId } from "@/lib/scan";
import { isMaterialId, labelOf, type MaterialId, type ToolId } from "@/lib/taxonomy";
import {
  CameraIcon,
  CheckIcon,
  PlusIcon,
  UploadImageIcon,
  ViewfinderIcon,
} from "../components/Icons";
import { streamThemeForMaterial } from "../components/materialMeta";
import { formatFileSize, preparePhotoForScan, validateSelectedFile } from "./preparePhoto";

interface PhotoScanPanelProps {
  existingMaterials: ReadonlySet<MaterialId>;
  existingTools: ReadonlySet<ToolId>;
  onConfirmItems: (ids: readonly ScanItemId[]) => void;
}

type ScanState =
  | { kind: "idle" }
  | { kind: "ready" }
  | { kind: "scanning"; message: string }
  | { kind: "canceled" }
  | { kind: "review"; items: ScanItem[] }
  | { kind: "empty" }
  | { kind: "confirmed"; addedCount: number; alreadyPresentCount: number }
  | { kind: "error"; message: string };

export default function PhotoScanPanel({
  existingMaterials,
  existingTools,
  onConfirmItems,
}: PhotoScanPanelProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const workerRef = useRef<Worker | null>(null);
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

  useEffect(
    () => () => {
      requestIdRef.current += 1;
      workerRef.current?.terminate();
    },
    [],
  );

  function cancelInFlight() {
    requestIdRef.current += 1;
    workerRef.current?.terminate();
    workerRef.current = null;
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

    const requestId = ++requestIdRef.current;
    setChosenIds(new Set());
    setScanState({ kind: "scanning", message: "Preparing photo…" });

    const prepared = await preparePhotoForScan(selectedFile);
    if (requestId !== requestIdRef.current) return;
    if (!prepared.ok) {
      setScanState({ kind: "error", message: prepared.message });
      return;
    }

    function fail() {
      if (requestId !== requestIdRef.current) return;
      cancelInFlight();
      setScanState({
        kind: "error",
        message:
          "Could not run the local model. Check your connection for the initial download, or add items manually.",
      });
    }

    try {
      const worker =
        workerRef.current ??
        new Worker(new URL("./scanPhoto.worker.ts", import.meta.url));
      workerRef.current = worker;
      worker.onerror = fail;
      worker.onmessage = ({ data }) => {
        if (requestId !== requestIdRef.current) return;
        if (data.kind === "analyzing") {
          setScanState({ kind: "scanning", message: "Analyzing photo on this device…" });
        } else if (data.kind === "result") {
          const items = sanitizeScanItems(data) ?? [];
          setScanState(items.length ? { kind: "review", items } : { kind: "empty" });
        } else {
          fail();
        }
      };
      setScanState({
        kind: "scanning",
        message:
          "Loading the local model. The first scan downloads about 155 MB of weights.",
      });
      worker.postMessage(prepared.blob);
    } catch {
      fail();
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
      id="scan"
      aria-labelledby="photo-scan-heading"
      className="specimen-panel scroll-mt-6 p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ViewfinderIcon className="h-4 w-4 text-[var(--accent-vermilion)]" />
          <h2
            id="photo-scan-heading"
            className="font-display text-lg font-bold tracking-[-0.015em] text-[var(--ink)]"
          >
            Scan a photo
          </h2>
        </div>
        <span className="font-mono-spec rounded-[3px] border border-[var(--rule)] bg-[var(--bg-paper)] px-2 py-0.5 text-[11px] font-medium text-[var(--ink-secondary)]">
          ON-DEVICE · NO UPLOAD
        </span>
      </div>

      <p className="mt-1.5 text-sm leading-relaxed text-[var(--ink-secondary)]">
        Identify recyclables and tools from a photo using a local vision model. You confirm every item before it joins your workbench.
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
        <div className="mt-4 border-t border-[var(--rule-subtle)] pt-4">
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="action-secondary focus-ring"
            >
              <UploadImageIcon className="h-4 w-4 text-[var(--accent-cobalt)]" />
              <span>Choose photo</span>
            </button>
            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="action-secondary focus-ring"
            >
              <CameraIcon className="h-4 w-4 text-[var(--accent-vermilion)]" />
              <span>Take photo</span>
            </button>
          </div>
          <p className="mt-3 text-xs text-[var(--ink-muted)]">
            Photos stay inside this browser. The first scan downloads quantized CLIP weights (about 155 MB).
          </p>
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div className="overflow-hidden rounded-[4px] border border-[var(--rule)] bg-[var(--bg-paper)]">
            {previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="Selected photo preview"
                className="max-h-64 w-full bg-[var(--bg-kraft)]/65 object-contain"
              />
            )}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--rule)] px-3.5 py-2.5 text-xs text-[var(--ink-secondary)]">
              <span
                className="font-mono-spec truncate font-medium text-[var(--ink)]"
                title={selectedFile.name}
              >
                {selectedFile.name}
              </span>
              <div className="flex shrink-0 items-center gap-3">
                <span className="font-mono-spec">{formatFileSize(selectedFile.size)}</span>
                <button
                  type="button"
                  onClick={handleRemovePhoto}
                  className="focus-ring rounded-[2px] font-semibold text-[var(--accent-vermilion)] underline-offset-4 hover:underline"
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
              <ViewfinderIcon className="h-4 w-4" />
              <span>{isScanning ? "Scanning…" : "Scan photo"}</span>
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
          className="mt-4 flex items-center gap-3 rounded-[4px] border border-[var(--rule)] bg-[var(--bg-kraft)]/75 px-4 py-3 text-sm text-[var(--ink)]"
        >
          <span
            aria-hidden="true"
            className="h-3.5 w-3.5 shrink-0 animate-spin rounded-full border-2 border-[var(--accent-vermilion)] border-t-transparent motion-reduce:animate-none"
          />
          <span>{scanState.message}</span>
        </div>
      )}

      {scanState.kind === "canceled" && (
        <p
          role="status"
          className="mt-4 rounded-[4px] border border-[var(--rule)] bg-[var(--bg-paper)] px-4 py-3 text-sm text-[var(--ink-secondary)]"
        >
          Scan canceled. You can scan this photo again, choose another image, or add items manually below.
        </p>
      )}

      {scanState.kind === "empty" && (
        <div
          role="status"
          className="mt-4 rounded-[4px] border border-[var(--rule)] bg-[var(--bg-paper)] px-4 py-3 text-sm text-[var(--ink-secondary)]"
        >
          <p className="font-semibold text-[var(--ink)]">No matching items detected</p>
          <p className="mt-1">
            Try a brighter or closer photo, or search and add your materials and tools manually below.
          </p>
        </div>
      )}

      {scanState.kind === "error" && (
        <div
          role="alert"
          className="mt-4 rounded-[4px] border border-[var(--accent-crimson-rule)] bg-[var(--accent-crimson-tint)] px-4 py-3 text-sm text-[var(--accent-crimson)]"
        >
          <p className="font-semibold">Scan failed</p>
          <p className="mt-1">{scanState.message}</p>
        </div>
      )}

      {scanState.kind === "confirmed" && (
        <p
          role="status"
          className="mt-4 rounded-[4px] border border-[var(--accent-sage-rule)] bg-[var(--accent-sage-tint)] px-4 py-3 text-sm font-medium text-[var(--accent-sage)]"
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
        <div className="mt-4 border-t border-[var(--rule)] pt-4">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <p role="status" className="text-sm font-semibold text-[var(--ink)]">
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
                className="focus-ring rounded-[2px] text-xs font-semibold text-[var(--accent-cobalt)] underline-offset-4 hover:underline"
              >
                {selectedProposedCount === scanState.items.length ? "Deselect all" : "Select all"}
              </button>
            )}
          </div>
          <p className="mt-1 text-xs text-[var(--ink-muted)]">
            New materials start at quantity 1. Existing quantities stay unchanged.
          </p>

          <ul aria-label="Detected items" className="mt-3 flex flex-wrap gap-2">
            {scanState.items.map(({ id }) => {
              const selected = chosenIds.has(id);
              const isMaterial = isMaterialId(id);
              const alreadyInInventory = isMaterial
                ? existingMaterials.has(id)
                : existingTools.has(id);
              const label = labelOf(id);
              const dotColor = isMaterial ? streamThemeForMaterial(id).bar : "#494C44";

              return (
                <li key={id}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggleProposedItem(id)}
                    className={`focus-ring inline-flex min-h-10 items-center gap-2 rounded-[4px] border px-3 py-1.5 text-left text-sm font-medium transition-colors ${
                      selected
                        ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--bg-plate)]"
                        : "border-[var(--rule)] bg-[var(--bg-plate)] text-[var(--ink)] hover:border-[var(--ink)]"
                    }`}
                  >
                    {selected ? (
                      <CheckIcon className="h-3.5 w-3.5 text-[#E85A3C]" />
                    ) : (
                      <PlusIcon className="h-3.5 w-3.5 text-[var(--ink-muted)]" />
                    )}
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ backgroundColor: selected ? "#FAF7F1" : dotColor }}
                    />
                    <span>{label}</span>
                    <span
                      className={`font-mono-spec rounded-[2px] px-1.5 py-0.5 text-[11px] font-medium uppercase ${
                        selected
                          ? "bg-white/15 text-[#F2EDE3]"
                          : "bg-[var(--bg-kraft)] text-[var(--ink-secondary)]"
                      }`}
                    >
                      {isMaterial ? "Material" : "Tool"}
                    </span>
                    {alreadyInInventory && (
                      <span
                        className={`text-xs font-normal ${
                          selected ? "text-[#D7D0C1]" : "text-[var(--ink-muted)]"
                        }`}
                      >
                        (in inventory)
                      </span>
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
