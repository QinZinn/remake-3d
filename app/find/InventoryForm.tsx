"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition, type FormEvent, type KeyboardEvent } from "react";
import { inventoryQuery, type Inventory } from "@/lib/inventory";
import { mergeScannedMaterials, mergeScannedTools, type ScanItemId } from "@/lib/scan";
import { labelOf, MATERIAL_IDS, MATERIALS, normalize, TOOL_IDS, TOOLS, type MaterialId, type ToolId } from "@/lib/taxonomy";
import PhotoScanPanel from "./PhotoScanPanel";

function searchable(value: string): string {
  return normalize(value).normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/đ/g, "d");
}

function pickerOption(id: MaterialId | ToolId, entry: (typeof MATERIALS)[MaterialId] | (typeof TOOLS)[ToolId]) {
  return { id, label: entry.label.en, terms: [id, entry.label.en, entry.label.vi, ...entry.aliases].map(searchable) };
}

const MATERIAL_OPTIONS = MATERIAL_IDS.map((id) => ({ ...pickerOption(id, MATERIALS[id]), id }));
const TOOL_OPTIONS = TOOL_IDS.map((id) => ({ ...pickerOption(id, TOOLS[id]), id }));

function Picker<Id extends string>({
  name, placeholder, options, selected, onAdd,
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
  const matching = term ? available.filter((option) => option.terms.some((text) => text.includes(term))) : available;
  const firstExact = matching.find((option) => option.terms.includes(term));
  const visible = term || showAll ? matching : matching.slice(0, 6);

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
    <section aria-labelledby={`${searchId}-heading`} className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs sm:p-6">
      <h2 id={`${searchId}-heading`} className="text-lg font-semibold tracking-tight">{name}</h2>
      <label htmlFor={searchId} className="sr-only">Search {name.toLowerCase()}</label>
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
        className="focus-ring mt-3 block min-h-11 w-full rounded-xl border border-stone-300 bg-[#fbfcf9] px-3.5 py-2.5 text-base placeholder:text-stone-500"
      />
      {visible.length ? (
        <ul aria-label={`Available ${name.toLowerCase()}`} className="mt-3 flex flex-wrap gap-2">
          {visible.map(({ id, label }) => (
            <li key={id}>
              <button
                type="button"
                aria-label={`Add ${label}`}
                onClick={() => add(id)}
                className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-full border border-stone-200 bg-white px-3 text-left text-sm font-medium text-stone-700 hover:border-emerald-700 hover:bg-emerald-50 hover:text-emerald-900"
              >
                <span aria-hidden className="text-emerald-700">+</span>{label}
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p role="status" className="mt-3 text-sm text-stone-600">
          {term ? `No available ${name.toLowerCase()} match your search.` : `All ${name.toLowerCase()} are selected.`}
        </p>
      )}
      {!term && available.length > 6 && (
        <button
          type="button"
          aria-expanded={showAll}
          onClick={() => setShowAll(!showAll)}
          className="focus-ring mt-3 rounded-sm text-sm font-semibold text-emerald-800 underline-offset-4 hover:underline"
        >
          {showAll ? "Show fewer" : `Show all ${name.toLowerCase()}`}
        </button>
      )}
    </section>
  );
}

export default function InventoryForm({ initialInventory }: { initialInventory: Inventory }) {
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
    <form onSubmit={submit} className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="grid gap-4">
        <PhotoScanPanel
          existingMaterials={selectedMaterialSet}
          existingTools={selectedToolSet}
          onConfirmItems={confirmScannedItems}
        />
        <Picker
          name="Materials"
          placeholder="Search materials"
          options={MATERIAL_OPTIONS}
          selected={selectedMaterialSet}
          onAdd={(id) => setMaterials((current) => ({ ...current, [id]: current[id] ?? 1 }))}
        />
        <Picker
          name="Tools"
          placeholder="Search tools"
          options={TOOL_OPTIONS}
          selected={selectedToolSet}
          onAdd={(id) => setTools((current) => current.includes(id) ? current : [...current, id])}
        />
      </div>
      <aside aria-labelledby="inventory-heading" className="rounded-2xl border border-emerald-900/10 bg-[#edf3e6] p-5 sm:p-6 lg:sticky lg:top-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-2">
          <h2 id="inventory-heading" className="text-lg font-semibold tracking-tight text-emerald-950">Your inventory</h2>
          {selectedCount > 0 && (
            <button
              type="button"
              onClick={() => { setMaterials({}); setTools([]); }}
              className="focus-ring rounded-sm text-sm font-medium text-emerald-800 underline-offset-4 hover:underline"
            >
              Clear all
            </button>
          )}
        </div>
        <p role="status" className="mt-1 text-sm text-stone-600">
          {selectedCount ? `${selectedCount} ${selectedCount === 1 ? "item" : "items"} selected` : "Your selections will appear here."}
        </p>
        {materialIds.length > 0 && (
          <ul aria-label="Selected materials" className="mt-4 divide-y divide-emerald-900/10">
            {materialIds.map((id) => {
              const label = labelOf(id);
              return (
                <li key={id} className="flex items-center justify-between gap-2 py-2">
                  <span className="text-sm font-medium text-emerald-950">{label}</span>
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
                        field.setCustomValidity(valid ? "" : "Enter a quantity greater than zero.");
                        if (valid) setMaterials((current) => ({ ...current, [id]: qty }));
                      }}
                      className="focus-ring min-h-10 w-[4.1rem] rounded-lg border border-emerald-900/20 bg-white px-2 py-1 text-right text-base text-emerald-950"
                    />
                    <button
                      type="button"
                      aria-label={`Remove ${label}`}
                      onClick={() => removeMaterial(id)}
                      className="focus-ring grid h-10 w-10 place-items-center rounded-full text-xl text-emerald-900 hover:bg-white"
                    >
                      <span aria-hidden>×</span>
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {tools.length > 0 && (
          <ul aria-label="Selected tools" className="mt-3 flex flex-wrap gap-2">
            {tools.map((id) => (
              <li key={id}>
                <button
                  type="button"
                  aria-label={`Remove ${labelOf(id)}`}
                  onClick={() => setTools((current) => current.filter((tool) => tool !== id))}
                  className="focus-ring flex min-h-10 items-center gap-2 rounded-full border border-emerald-900/15 bg-white px-3 text-sm font-medium text-emerald-900 hover:bg-emerald-100"
                >
                  {labelOf(id)} <span aria-hidden>×</span>
                </button>
              </li>
            ))}
          </ul>
        )}
        <button type="submit" disabled={!selectedCount || pending} className="action-primary focus-ring mt-5 w-full">
          {pending ? "Finding projects…" : "See matches"} <span aria-hidden>→</span>
        </button>
      </aside>
    </form>
  );
}
