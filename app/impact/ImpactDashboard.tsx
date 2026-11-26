"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  formatGrams,
  formatKilograms,
  projectWasteGrams,
  summarizeImpact,
  type ImpactProjectSummary,
} from "@/lib/impact";
import { labelOf } from "@/lib/taxonomy";
import { ArrowRightIcon, ArrowUpRightIcon, WarningIcon } from "../components/Icons";
import { streamThemeForMaterial } from "../components/materialMeta";
import { setProjectCompleted, useImpactSnapshot } from "../components/useImpactStore";

export default function ImpactDashboard({
  projects,
}: {
  projects: readonly ImpactProjectSummary[];
}) {
  const { completedSlugs, storageUnavailable } = useImpactSnapshot();
  const [announcement, setAnnouncement] = useState("");

  const summary = useMemo(
    () => summarizeImpact(completedSlugs, projects),
    [completedSlugs, projects],
  );

  const completionPercent =
    summary.totalProjects > 0
      ? Math.round((summary.completedCount / summary.totalProjects) * 100)
      : 0;

  function handleUndo(slug: string, title: string) {
    setProjectCompleted(slug, false);
    setAnnouncement(`Removed ${title} from your completed guides.`);
  }

  return (
    <div className="grid gap-8">
      {storageUnavailable && (
        <div
          role="status"
          className="flex items-start gap-3 rounded-[4px] border border-[var(--accent-ochre-rule)] bg-[var(--accent-ochre-tint)] px-4 py-3.5 text-sm text-[var(--accent-ochre)]"
        >
          <WarningIcon className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Browser storage is unavailable</p>
            <p className="mt-0.5">
              Changes you make in this tab stay visible while you browse, but cannot be saved across reloads.
            </p>
          </div>
        </div>
      )}

      {/* Unified architectural impact ledger bar */}
      <section
        aria-label="Impact overview"
        className="specimen-panel grid divide-y divide-[var(--rule)] sm:grid-cols-3 sm:divide-x sm:divide-y-0"
      >
        <div className="p-5 sm:p-6">
          <p className="font-mono-spec text-xs font-medium text-[var(--ink-muted)] uppercase">
            Completed guides
          </p>
          <p className="font-display mt-2 text-4xl font-bold tracking-[-0.03em] text-[var(--ink)]">
            <span className="font-mono-spec">{summary.completedCount}</span>
            <span className="font-mono-spec ml-1.5 text-lg font-medium text-[var(--ink-muted)]">
              / {summary.totalProjects}
            </span>
          </p>
          <div
            aria-hidden="true"
            className="mt-3 h-1.5 w-full overflow-hidden rounded-[2px] bg-[var(--bg-kraft)]"
          >
            <div
              className="h-full bg-[var(--accent-sage)] transition-[width] duration-200"
              style={{ width: `${completionPercent}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-[var(--ink-muted)]">
            Each guide is counted once.
          </p>
        </div>

        <div className="p-5 sm:p-6">
          <p className="font-mono-spec text-xs font-medium text-[var(--ink-muted)] uppercase">
            Estimated material reused
          </p>
          <p className="font-mono-spec mt-2 text-4xl font-semibold tracking-[-0.03em] text-[var(--accent-vermilion)]">
            {formatGrams(summary.totalGrams)}
          </p>
          <p className="mt-3 text-xs leading-relaxed text-[var(--ink-secondary)]">
            {summary.totalGrams >= 1000
              ? `About ${formatKilograms(summary.totalGrams)} from catalog waste estimates.`
              : "Catalog-estimated mass kept in active use."}
          </p>
        </div>

        <div className="p-5 sm:p-6">
          <p className="font-mono-spec text-xs font-medium text-[var(--ink-muted)] uppercase">
            Materials reused
          </p>
          <p className="font-mono-spec mt-2 text-4xl font-semibold tracking-[-0.03em] text-[var(--ink)]">
            {summary.byMaterial.length}
          </p>
          {summary.byMaterial.length > 0 ? (
            <div className="mt-3 flex flex-wrap items-center gap-1.5" aria-hidden="true">
              {summary.byMaterial.map((m) => (
                <span
                  key={m.materialId}
                  className="h-2.5 w-2.5 rounded-full"
                  style={{ backgroundColor: streamThemeForMaterial(m.materialId).bar }}
                />
              ))}
            </div>
          ) : (
            <p className="mt-3 text-xs text-[var(--ink-muted)]">
              Distinct material types across your completed guides.
            </p>
          )}
        </div>
      </section>

      {summary.completedCount === 0 ? (
        <section
          aria-labelledby="empty-impact-heading"
          className="specimen-panel p-6 sm:p-8"
        >
          <h2
            id="empty-impact-heading"
            className="font-display text-xl font-bold tracking-[-0.015em] text-[var(--ink)]"
          >
            No completed guides yet
          </h2>
          <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-[var(--ink-secondary)]">
            Open any 3D build guide and select “I made this” when you finish to log your reused materials here. Each guide counts once and stays stored locally in this browser.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link href="/find" className="action-primary focus-ring">
              <span>Find projects</span>
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link href="/#catalog" className="action-secondary focus-ring">
              Browse catalog
            </Link>
          </div>
        </section>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:items-start">
          <section
            aria-labelledby="by-material-heading"
            className="specimen-panel p-5 sm:p-6"
          >
            <h2
              id="by-material-heading"
              className="font-display text-xl font-bold tracking-[-0.015em] text-[var(--ink)]"
            >
              Estimated reused grams by material
            </h2>
            <p className="mt-1 text-sm text-[var(--ink-secondary)]">
              Grouped by material taxonomy from each completed guide’s catalog estimate.
            </p>

            {summary.byMaterial.length > 0 ? (
              <ul className="mt-5 divide-y divide-[var(--rule-subtle)]">
                {summary.byMaterial.map((material) => {
                  const share =
                    summary.totalGrams > 0
                      ? (material.grams / summary.totalGrams) * 100
                      : 0;
                  const theme = streamThemeForMaterial(material.materialId);
                  return (
                    <li
                      key={material.materialId}
                      className="py-3.5 first:pt-0 last:pb-0"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <span className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ink)]">
                          <span
                            aria-hidden="true"
                            className="h-2.5 w-2.5 shrink-0 rounded-full"
                            style={{ backgroundColor: theme.bar }}
                          />
                          {material.label}
                        </span>
                        <span className="font-mono-spec text-sm font-semibold text-[var(--ink)]">
                          ≈ {formatGrams(material.grams)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
                        {material.projectCount}{" "}
                        {material.projectCount === 1
                          ? "completed guide"
                          : "completed guides"}
                      </p>
                      <div
                        aria-hidden="true"
                        className="mt-2 h-2 w-full overflow-hidden rounded-[2px] bg-[var(--bg-kraft)]"
                      >
                        <div
                          className="h-full"
                          style={{
                            width: `${share}%`,
                            backgroundColor: theme.bar,
                          }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-[var(--ink-secondary)]">
                Your completed guides do not list material weight estimates yet.
              </p>
            )}
          </section>

          <section
            aria-labelledby="completed-guides-heading"
            className="specimen-panel p-5 sm:p-6"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[var(--rule)] pb-3">
              <h2
                id="completed-guides-heading"
                className="font-display text-xl font-bold tracking-[-0.015em] text-[var(--ink)]"
              >
                Completed guides
              </h2>
              <span className="font-mono-spec rounded-[3px] border border-[var(--rule)] bg-[var(--bg-kraft)] px-2 py-0.5 text-xs font-semibold text-[var(--ink)]">
                {summary.completedCount}
              </span>
            </div>

            <ul className="mt-4 divide-y divide-[var(--rule-subtle)]">
              {summary.completedProjects.map((project) => {
                const grams = projectWasteGrams(project.wasteDiverted);
                return (
                  <li key={project.slug} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-display text-base font-bold tracking-[-0.01em] text-[var(--ink)]">
                          <Link
                            href={`/project/${project.slug}`}
                            className="focus-ring rounded-[2px] underline-offset-4 hover:text-[var(--accent-vermilion)] hover:underline"
                          >
                            {project.title}
                          </Link>
                        </h3>
                        <p className="font-mono-spec mt-1 text-xs text-[var(--ink-muted)]">
                          <span className="capitalize">{project.difficulty}</span>
                          <span aria-hidden="true"> · </span>
                          {project.timeMinutes}m
                          {grams > 0 && (
                            <>
                              <span aria-hidden="true"> · </span>
                              <span className="font-semibold text-[var(--accent-sage)]">
                                ≈ {formatGrams(grams)} reused
                              </span>
                            </>
                          )}
                        </p>
                      </div>

                      <div className="flex shrink-0 items-center gap-3">
                        <Link
                          href={`/project/${project.slug}`}
                          aria-label={`View guide for ${project.title}`}
                          className="focus-ring inline-flex items-center gap-1 rounded-[2px] text-sm font-semibold text-[var(--accent-cobalt)] underline-offset-4 hover:text-[var(--accent-vermilion)] hover:underline"
                        >
                          <span>View guide</span>
                          <ArrowUpRightIcon className="h-3.5 w-3.5" />
                        </Link>
                        <button
                          type="button"
                          aria-label={`Undo completion for ${project.title}`}
                          onClick={() => handleUndo(project.slug, project.title)}
                          className="focus-ring min-h-9 rounded-[4px] border border-[var(--rule)] bg-[var(--bg-plate)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-secondary)] transition-colors hover:border-[var(--ink)] hover:text-[var(--ink)]"
                        >
                          Undo
                        </button>
                      </div>
                    </div>

                    {project.wasteDiverted.length > 0 && (
                      <ul
                        aria-label={`Estimated reused materials for ${project.title}`}
                        className="mt-2.5 flex flex-wrap gap-1.5"
                      >
                        {project.wasteDiverted.map((entry, index) => {
                          const theme = streamThemeForMaterial(entry.materialId);
                          return (
                            <li
                              key={`${entry.materialId}-${index}`}
                              className="font-mono-spec rounded-[3px] border px-2 py-0.5 text-xs font-medium"
                              style={{
                                backgroundColor: theme.mat,
                                borderColor: theme.rule,
                                color: theme.ink,
                              }}
                            >
                              {labelOf(entry.materialId)} · {formatGrams(entry.grams)}
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        </div>
      )}

      <section
        aria-labelledby="methodology-heading"
        className="rounded-[4px] border border-[var(--rule)] bg-[var(--bg-kraft)]/60 p-5 sm:p-6"
      >
        <h2
          id="methodology-heading"
          className="font-display text-lg font-bold tracking-[-0.015em] text-[var(--ink)]"
        >
          How these estimates work
        </h2>
        <dl className="mt-4 grid gap-6 text-sm leading-relaxed text-[var(--ink-secondary)] sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-[var(--ink)]">Estimated material weights</dt>
            <dd className="mt-1 max-w-[54ch]">
              Totals sum each completed guide’s catalog waste-diversion estimate in grams, recorded once per guide. Real-world mass varies by container size, thickness, and{"\u00A0"}fabric.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-[var(--ink)]">One completion per guide</dt>
            <dd className="mt-1 max-w-[54ch]">
              Each guide counts once toward your totals. Undoing a completion immediately removes its estimated weight from every figure on this{"\u00A0"}page.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-[var(--ink)]">Local-only storage</dt>
            <dd className="mt-1 max-w-[54ch]">
              Completed guides are stored only in this browser’s local storage on this device and stay in sync across open tabs. Nothing is sent to a server, and clearing browser site data resets your{"\u00A0"}totals.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-[var(--ink)]">Why there are no CO₂e figures</dt>
            <dd className="mt-1 max-w-[54ch]">
              ReMake 3D reports estimated reused grams instead of greenhouse-gas savings (CO₂e). Defensible emissions models such as U.S. EPA WARM depend on your local disposal baseline and whether a project displaced a new purchase, which this catalog does not{"\u00A0"}track.
            </dd>
          </div>
        </dl>
      </section>

      <p role="status" aria-live="polite" className="sr-only">
        {announcement}
      </p>
    </div>
  );
}
