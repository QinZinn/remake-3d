"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent, type KeyboardEvent } from "react";
import { inventoryQuery, type Inventory } from "@/lib/inventory";
import { mergeScannedMaterials, mergeScannedTools, type ScanItemId } from "@/lib/scan";
import {
  isMaterialId,
  labelOf,
  MATERIAL_IDS,
  MATERIALS,
  normalize,
  TOOL_IDS,
  TOOLS,
  type MaterialId,
  type ToolId,
} from "@/lib/taxonomy";
import { ArrowRightIcon, CloseIcon, PlusIcon, SearchIcon } from "../components/Icons";
import { streamThemeForMaterial } from "../components/materialMeta";
import PhotoScanPanel from "./PhotoScanPanel";

function searchable(value: string): string {
  return normalize(value).normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/g, "d");
}

function pickerOption(
  id: MaterialId | ToolId,
  entry: (typeof MATERIALS)[MaterialId] | (typeof TOOLS)[ToolId],
) {
  return {
    id,
    label: entry.label.en,
    terms: [id, entry.label.en, entry.label.vi, ...entry.aliases].map(searchable),
  };
}

const MATERIAL_OPTIONS = MATERIAL_IDS.map((id) => ({
  ...pickerOption(id, MATERIALS[id]),
  id,
}));
const TOOL_OPTIONS = TOOL_IDS.map((id) => ({
  ...pickerOption(id, TOOLS[id]),
  id,
}));

function Picker<Id extends MaterialId | ToolId>({
  name,
  placeholder,
  options,
  selected,
  onAdd,
}: {
  name: "Materials" | "Tools";
  placeholder: string;
  options: readonly { id: Id; label: string; terms: string[] }[];
  selected: ReadonlySet<Id>;
  onAdd: (id: Id) => void;
}) {
  const searchInput = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [showAll, setShowAll] = useState(false);
  const searchId = `search-${name.toLowerCase()}`;
  const term = searchable(query);
  const available = options.filter((option) => !selected.has(option.id));
  const matching = term
    ? available.filter((option) => option.terms.some((text) => text.includes(term)))
    : available;
  const firstExact = matching.find((option) => option.terms.includes(term));
  const visible = term || showAll ? matching : matching.slice(0, 8);

  function add(id: Id) {
    onAdd(id);
    setQuery("");
    searchInput.current?.focus();
  }

  function onSearchKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.nativeEvent.isComposing) return;
    if (event.key === "Enter") {
      event.preventDefault();
      const item = firstExact ?? (matching.length === 1 ? matching[0] : undefined);
      if (term && item) add(item.id);
    }
  }

  return (
    <section
      aria-labelledby={`${searchId}-heading`}
      className="specimen-panel p-5 sm:p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2
          id={`${searchId}-heading`}
          className="font-display text-lg font-bold tracking-[-0.015em] text-[var(--ink)]"
        >
          {name}
        </h2>
        <span className="font-mono-spec text-xs text-[var(--ink-muted)]">
          {available.length} available
        </span>
      </div>

      <label htmlFor={searchId} className="sr-only">
        Search {name.toLowerCase()}
      </label>
      <div className="relative mt-3">
        <SearchIcon className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
        <input
          ref={searchInput}
          id={searchId}
          type="search"
          value={query}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={onSearchKeyDown}
          className="focus-ring block min-h-11 w-full rounded-[4px] border border-[var(--rule)] bg-[var(--bg-paper)]/70 py-2.5 pr-3.5 pl-10 text-base text-[var(--ink)] placeholder:text-[var(--ink-muted)]"
        />
      </div>

      {visible.length ? (
        <ul aria-label={`Available ${name.toLowerCase()}`} className="mt-3.5 flex flex-wrap gap-2">
          {visible.map(({ id, label }) => {
            const dotColor = isMaterialId(id) ? streamThemeForMaterial(id).bar : "#494C44";
            return (
              <li key={id}>
                <button
                  type="button"
                  aria-label={`Add ${label}`}
                  onClick={() => add(id)}
                  className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-[4px] border border-[var(--rule)] bg-[var(--bg-plate)] px-3 py-1.5 text-left text-sm font-medium text-[var(--ink)] transition-colors hover:border-[var(--ink)] hover:bg-[var(--bg-kraft)]/45"
                >
                  <span
                    aria-hidden="true"
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ backgroundColor: dotColor }}
                  />
                  <span>{label}</span>
                  <PlusIcon className="h-3.5 w-3.5 text-[var(--ink-muted)]" />
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p role="status" className="mt-3 text-sm text-[var(--ink-secondary)]">
          {term
            ? `No available ${name.toLowerCase()} match your search.`
            : `All ${name.toLowerCase()} are selected.`}
        </p>
      )}

      {!term && available.length > 8 && (
        <button
          type="button"
          aria-expanded={showAll}
          onClick={() => setShowAll(!showAll)}
          className="focus-ring mt-3.5 rounded-[2px] text-sm font-semibold text-[var(--accent-cobalt)] underline-offset-4 hover:text-[var(--accent-vermilion)] hover:underline"
        >
          {showAll ? "Show fewer" : `Show all ${available.length} ${name.toLowerCase()}`}
        </button>
      )}
    </section>
  );
}

export default function InventoryForm({
  initialInventory,
}: {
  initialInventory: Inventory;
}) {
  const [materials, setMaterials] = useState(initialInventory.materials);
  const [tools, setTools] = useState(initialInventory.tools);
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const materialIds = MATERIAL_IDS.filter((id) => materials[id] !== undefined);
  const selectedMaterialSet = new Set(materialIds);
  const selectedToolSet = new Set(tools);
  const selectedCount = materialIds.length + tools.length;

  function confirmScannedItems(ids: readonly ScanItemId[]) {
    setMaterials((current) => mergeScannedMaterials(current, ids));
    setTools((current) => mergeScannedTools(current, ids));
  }

  function removeMaterial(id: MaterialId) {
    setMaterials((current) => {
      const remaining = { ...current };
      delete remaining[id];
      return remaining;
    });
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selectedCount || pending) return;
    const query = inventoryQuery({ materials, tools });
    startTransition(() => router.push(`/results?${query}`));
  }

  return (
    <form
      onSubmit={submit}
      className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_23rem]"
    >
      <div className="grid gap-5">
        <PhotoScanPanel
          existingMaterials={selectedMaterialSet}
          existingTools={selectedToolSet}
          onConfirmItems={confirmScannedItems}
        />
        <Picker
          name="Materials"
          placeholder="Search materials (English or Vietnamese)…"
          options={MATERIAL_OPTIONS}
          selected={selectedMaterialSet}
          onAdd={(id) =>
            setMaterials((current) => ({ ...current, [id]: current[id] ?? 1 }))
          }
        />
        <Picker
          name="Tools"
          placeholder="Search tools (scissors, glue gun, marker…)"
          options={TOOL_OPTIONS}
          selected={selectedToolSet}
          onAdd={(id) =>
            setTools((current) => (current.includes(id) ? current : [...current, id]))
          }
        />
      </div>

      <aside
        aria-labelledby="inventory-heading"
        className="rounded-[4px] border border-[var(--rule)] bg-[var(--bg-kraft)] p-5 sm:p-6 lg:sticky lg:top-6"
      >
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2 border-b border-[var(--rule)] pb-3">
          <h2
            id="inventory-heading"
            className="font-display text-lg font-bold tracking-[-0.015em] text-[var(--ink)]"
          >
            Your workbench
          </h2>
          {selectedCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setMaterials({});
                setTools([]);
              }}
              className="focus-ring rounded-[2px] text-xs font-semibold text-[var(--accent-vermilion)] underline-offset-4 hover:underline"
            >
              Clear all
            </button>
          )}
        </div>

        <p role="status" className="mt-3 text-sm text-[var(--ink-secondary)]">
          {selectedCount
            ? `${selectedCount} ${selectedCount === 1 ? "item" : "items"} ready to match`
            : "Add materials or tools from a photo or the pickers to see what you can build."}
        </p>

        {materialIds.length > 0 && (
          <div className="mt-4">
            <p className="font-mono-spec text-[11px] font-medium text-[var(--ink-muted)] uppercase">
              Materials &amp; qty
            </p>
            <ul
              aria-label="Selected materials"
              className="mt-2 divide-y divide-[var(--rule)] border-y border-[var(--rule)]"
            >
              {materialIds.map((id) => {
                const label = labelOf(id);
                const theme = streamThemeForMaterial(id);
                return (
                  <li key={id} className="flex items-center justify-between gap-2 py-2.5">
                    <span className="flex min-w-0 items-center gap-2 text-sm font-medium text-[var(--ink)]">
                      <span
                        aria-hidden="true"
                        className="h-2 w-2 shrink-0 rounded-full"
                        style={{ backgroundColor: theme.bar }}
                      />
                      <span className="truncate">{label}</span>
                    </span>
                    <div className="flex shrink-0 items-center gap-1.5">
                      <input
                        aria-label={`Quantity of ${label}`}
                        type="number"
                        inputMode="decimal"
                        step="any"
                        required
                        defaultValue={materials[id]}
                        onChange={(event) => {
                          const field = event.currentTarget;
                          const qty = field.valueAsNumber;
                          const valid = Number.isFinite(qty) && qty > 0;
                          field.setCustomValidity(
                            valid ? "" : "Enter a quantity greater than zero.",
                          );
                          if (valid) {
                            setMaterials((current) => ({ ...current, [id]: qty }));
                          }
                        }}
                        className="focus-ring font-mono-spec min-h-9 w-[4rem] rounded-[4px] border border-[var(--rule)] bg-[var(--bg-plate)] px-2 py-1 text-right text-sm text-[var(--ink)]"
                      />
                      <button
                        type="button"
                        aria-label={`Remove ${label}`}
                        onClick={() => removeMaterial(id)}
                        className="focus-ring grid h-9 w-9 place-items-center rounded-[4px] text-[var(--ink-secondary)] hover:bg-[var(--bg-plate)] hover:text-[var(--ink)]"
                      >
                        <CloseIcon className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {tools.length > 0 && (
          <div className="mt-4">
            <p className="font-mono-spec text-[11px] font-medium text-[var(--ink-muted)] uppercase">
              Tools
            </p>
            <ul aria-label="Selected tools" className="mt-2 flex flex-wrap gap-1.5">
              {tools.map((id) => (
                <li key={id}>
                  <button
                    type="button"
                    aria-label={`Remove ${labelOf(id)}`}
                    onClick={() =>
                      setTools((current) => current.filter((tool) => tool !== id))
                    }
                    className="focus-ring inline-flex min-h-9 items-center gap-1.5 rounded-[4px] border border-[var(--rule)] bg-[var(--bg-plate)] px-2.5 text-xs font-semibold text-[var(--ink)] hover:border-[var(--ink)]"
                  >
                    <span>{labelOf(id)}</span>
                    <CloseIcon className="h-3 w-3 text-[var(--ink-muted)]" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          type="submit"
          disabled={!selectedCount || pending}
          className="action-primary focus-ring mt-5 w-full"
        >
          <span>{pending ? "Finding projects…" : "See matches"}</span>
          <ArrowRightIcon className="h-4 w-4" />
        </button>
      </aside>
    </form>
  );
}
