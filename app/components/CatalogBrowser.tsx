"use client";

import { useMemo, useState } from "react";
import type { MaterialCategory } from "@/lib/taxonomy";
import { CloseIcon, SearchIcon } from "./Icons";
import { STREAM_THEMES } from "./materialMeta";
import ProjectCard, { type ProjectCardData } from "./ProjectCard";

const STREAM_ORDER: readonly MaterialCategory[] = [
  "plastic",
  "paper",
  "glass",
  "metal",
  "textile",
  "rubber",
  "wood",
  "supply",
];

export default function CatalogBrowser({
  items,
}: {
  items: readonly ProjectCardData[];
}) {
  const [selectedStream, setSelectedStream] = useState<MaterialCategory | "all">("all");
  const [query, setQuery] = useState("");

  const counts = useMemo(() => {
    const map = new Map<MaterialCategory, number>();
    for (const item of items) {
      map.set(item.category, (map.get(item.category) ?? 0) + 1);
    }
    return map;
  }, [items]);

  const activeStreams = useMemo(
    () => STREAM_ORDER.filter((cat) => (counts.get(cat) ?? 0) > 0),
    [counts],
  );

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return items.filter((item) => {
      if (selectedStream !== "all" && item.category !== selectedStream) return false;
      if (!term) return true;
      return (
        item.title.toLowerCase().includes(term) ||
        item.summary.toLowerCase().includes(term) ||
        item.materialLabel.toLowerCase().includes(term)
      );
    });
  }, [items, selectedStream, query]);

  const hasFilter = selectedStream !== "all" || query.trim().length > 0;

  return (
    <div>
      {/* Filter + Search workbench strip */}
      <div className="mb-6 flex flex-col gap-3 border-y border-[var(--rule)] py-3.5 lg:flex-row lg:items-center lg:justify-between">
        <div
          role="group"
          aria-label="Filter guides by material stream"
          className="flex flex-wrap items-center gap-1.5"
        >
          <button
            type="button"
            aria-pressed={selectedStream === "all"}
            onClick={() => setSelectedStream("all")}
            className={`focus-ring inline-flex min-h-9 items-center gap-1.5 rounded-[4px] border px-3 py-1.5 text-xs font-semibold transition-colors ${
              selectedStream === "all"
                ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--bg-plate)]"
                : "border-[var(--rule)] bg-[var(--bg-plate)] text-[var(--ink-secondary)] hover:border-[var(--ink)] hover:text-[var(--ink)]"
            }`}
          >
            <span>All</span>
            <span className="font-mono-spec text-[11px] opacity-80">{items.length}</span>
          </button>

          {activeStreams.map((category) => {
            const theme = STREAM_THEMES[category];
            const isSelected = selectedStream === category;
            const count = counts.get(category) ?? 0;
            return (
              <button
                key={category}
                type="button"
                aria-pressed={isSelected}
                onClick={() => setSelectedStream(isSelected ? "all" : category)}
                className={`focus-ring inline-flex min-h-9 items-center gap-1.5 rounded-[4px] border px-3 py-1.5 text-xs font-semibold transition-colors ${
                  isSelected
                    ? "border-[var(--ink)] bg-[var(--ink)] text-[var(--bg-plate)]"
                    : "border-[var(--rule)] bg-[var(--bg-plate)] text-[var(--ink-secondary)] hover:border-[var(--ink)] hover:text-[var(--ink)]"
                }`}
              >
                <span
                  aria-hidden="true"
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{
                    backgroundColor: isSelected ? "#FAF7F1" : theme.bar,
                  }}
                />
                <span>{theme.label}</span>
                <span className="font-mono-spec text-[11px] opacity-80">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="relative w-full lg:w-64">
          <label htmlFor="catalog-search" className="sr-only">
            Filter catalog guides
          </label>
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--ink-muted)]" />
          <input
            id="catalog-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter guides or materials…"
            className="focus-ring min-h-10 w-full rounded-[4px] border border-[var(--rule)] bg-[var(--bg-plate)] py-2 pr-8 pl-9 text-sm text-[var(--ink)] placeholder:text-[var(--ink-muted)]"
          />
          {query && (
            <button
              type="button"
              aria-label="Clear filter text"
              onClick={() => setQuery("")}
              className="focus-ring absolute top-1/2 right-1.5 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-[3px] text-[var(--ink-muted)] hover:bg-[var(--bg-kraft)] hover:text-[var(--ink)]"
            >
              <CloseIcon className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Live status announcement */}
      <p role="status" aria-live="polite" className="sr-only">
        Showing {filtered.length} of {items.length} project guides.
      </p>

      {filtered.length > 0 ? (
        <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => {
            const originalIndex = items.findIndex((entry) => entry.slug === item.slug);
            return (
              <li key={item.slug}>
                <ProjectCard project={item} index={originalIndex} />
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="specimen-panel flex flex-col items-start gap-3 p-6">
          <p className="font-display text-lg font-bold text-[var(--ink)]">
            No guides match that filter
          </p>
          <p className="text-sm text-[var(--ink-secondary)]">
            Try another material stream or clear the search text to browse all {items.length} guides.
          </p>
          {hasFilter && (
            <button
              type="button"
              onClick={() => {
                setSelectedStream("all");
                setQuery("");
              }}
              className="action-secondary focus-ring"
            >
              Reset filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
