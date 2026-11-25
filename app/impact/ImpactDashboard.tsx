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

  function handleUndo(slug: string, title: string) {
    setProjectCompleted(slug, false);
    setAnnouncement(`Removed ${title} from your completed guides.`);
  }

  return (
    <div className="grid gap-8">
      {storageUnavailable && (
        <div
          role="status"
          className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-950"
        >
          <p className="font-semibold">Browser storage is unavailable</p>
          <p className="mt-1 text-amber-900">
            Changes you make in this tab stay visible while you browse, but cannot be saved across reloads.
          </p>
        </div>
      )}

      <section aria-label="Impact overview" className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl bg-[#173e2c] p-5 text-white sm:p-6">
          <p className="text-xs font-medium tracking-wide text-emerald-100/80 uppercase">
            Completed guides
          </p>
          <p className="mt-2 font-serif text-4xl tracking-tight">
            {summary.completedCount}
            <span className="ml-1.5 font-sans text-base font-normal text-emerald-100/80">
              of {summary.totalProjects}
            </span>
          </p>
          <p className="mt-2 text-xs text-emerald-100/80">
            Each guide is counted once.
          </p>
        </div>

        <div className="rounded-2xl border border-emerald-900/10 bg-[#edf3e6] p-5 text-emerald-950 sm:p-6">
          <p className="text-xs font-medium tracking-wide text-emerald-900/80 uppercase">
            Estimated material reused
          </p>
          <p className="mt-2 font-serif text-4xl tracking-tight">
            {formatGrams(summary.totalGrams)}
          </p>
          <p className="mt-2 text-xs text-stone-600">
            {summary.totalGrams >= 1000
              ? `About ${formatKilograms(summary.totalGrams)} from catalog estimates.`
              : "Estimated mass from catalog waste figures."}
          </p>
        </div>

        <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs sm:p-6">
          <p className="text-xs font-medium tracking-wide text-stone-500 uppercase">
            Materials reused
          </p>
          <p className="mt-2 font-serif text-4xl tracking-tight text-emerald-950">
            {summary.byMaterial.length}
          </p>
          <p className="mt-2 text-xs text-stone-600">
            {summary.byMaterial.length === 1
              ? "Distinct material type across your completed guides."
              : "Distinct material types across your completed guides."}
          </p>
        </div>
      </section>

      {summary.completedCount === 0 ? (
        <section
          aria-labelledby="empty-impact-heading"
          className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xs sm:p-8"
        >
          <h2
            id="empty-impact-heading"
            className="text-xl font-semibold tracking-tight text-emerald-950"
          >
            No completed guides yet
          </h2>
          <p className="mt-2 max-w-xl text-sm leading-relaxed text-stone-600">
            Open any 3D guide and select “I made this” when you finish to track your reused materials here. Each guide counts once and stays stored locally in this browser.
          </p>
          <div className="mt-5 flex flex-wrap items-center gap-3">
            <Link href="/find" className="action-primary focus-ring">
              Find projects <span aria-hidden>→</span>
            </Link>
            <Link href="/#catalog" className="action-secondary focus-ring">
              Browse catalog
            </Link>
          </div>
        </section>
      ) : (
        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.25fr)] lg:items-start">
          <section
            aria-labelledby="by-material-heading"
            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs sm:p-6"
          >
            <h2
              id="by-material-heading"
              className="text-xl font-semibold tracking-tight text-emerald-950"
            >
              Estimated reused grams by material
            </h2>
            <p className="mt-1 text-sm text-stone-600">
              Grouped by material taxonomy from each completed guide’s catalog estimate.
            </p>
            {summary.byMaterial.length > 0 ? (
              <ul className="mt-5 divide-y divide-stone-100">
                {summary.byMaterial.map((material) => {
                  const share =
                    summary.totalGrams > 0
                      ? (material.grams / summary.totalGrams) * 100
                      : 0;
                  return (
                    <li key={material.materialId} className="py-3.5 first:pt-0 last:pb-0">
                      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                        <span className="text-sm font-semibold text-stone-900">
                          {material.label}
                        </span>
                        <span className="text-sm font-semibold text-emerald-900">
                          ≈ {formatGrams(material.grams)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-stone-500">
                        {material.projectCount}{" "}
                        {material.projectCount === 1 ? "completed guide" : "completed guides"}
                      </p>
                      <div
                        aria-hidden="true"
                        className="mt-2 h-2 w-full overflow-hidden rounded-full bg-stone-100"
                      >
                        <div
                          className="h-full rounded-full bg-emerald-700"
                          style={{ width: `${share}%` }}
                        />
                      </div>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-stone-600">
                Your completed guides do not list material weight estimates yet.
              </p>
            )}
          </section>

          <section
            aria-labelledby="completed-guides-heading"
            className="rounded-2xl border border-stone-200 bg-white p-5 shadow-xs sm:p-6"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2
                id="completed-guides-heading"
                className="text-xl font-semibold tracking-tight text-emerald-950"
              >
                Completed guides
              </h2>
              <span className="rounded-full bg-stone-200/65 px-2.5 py-0.5 text-xs font-semibold text-stone-700">
                {summary.completedCount}
              </span>
            </div>
            <ul className="mt-4 divide-y divide-stone-200/80">
              {summary.completedProjects.map((project) => {
                const grams = projectWasteGrams(project.wasteDiverted);
                return (
                  <li key={project.slug} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <h3 className="text-base font-semibold tracking-tight text-stone-950">
                          <Link
                            href={`/project/${project.slug}`}
                            className="focus-ring rounded-sm underline-offset-4 hover:text-emerald-800 hover:underline"
                          >
                            {project.title}
                          </Link>
                        </h3>
                        <p className="mt-1 text-xs text-stone-600">
                          <span className="capitalize">{project.difficulty}</span>
                          <span aria-hidden> · </span>
                          {project.timeMinutes} min
                          {grams > 0 && (
                            <>
                              <span aria-hidden> · </span>
                              <span className="font-medium text-emerald-800">
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
                          className="focus-ring rounded-sm text-sm font-semibold text-emerald-800 underline-offset-4 hover:underline"
                        >
                          View guide <span aria-hidden>↗</span>
                        </Link>
                        <button
                          type="button"
                          aria-label={`Undo completion for ${project.title}`}
                          onClick={() => handleUndo(project.slug, project.title)}
                          className="focus-ring rounded-full border border-stone-300 bg-white px-3 py-1.5 text-xs font-semibold text-stone-700 transition-colors hover:border-emerald-700 hover:bg-emerald-50 hover:text-emerald-950"
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
                        {project.wasteDiverted.map((entry, index) => (
                          <li
                            key={`${entry.materialId}-${index}`}
                            className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs text-emerald-900"
                          >
                            {labelOf(entry.materialId)} · {formatGrams(entry.grams)}
                          </li>
                        ))}
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
        className="rounded-2xl border border-stone-200 bg-[#fbfcf9] p-5 sm:p-6"
      >
        <h2
          id="methodology-heading"
          className="text-lg font-semibold tracking-tight text-emerald-950"
        >
          How these estimates work
        </h2>
        <dl className="mt-4 grid gap-4 text-sm leading-relaxed text-stone-600 sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-stone-900">Estimated material weights</dt>
            <dd className="mt-1">
              Totals sum each completed guide’s catalog waste-diversion estimate in grams, recorded once per guide. Real-world mass varies by container size, thickness, and fabric.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-stone-900">One completion per guide</dt>
            <dd className="mt-1">
              Each guide counts once toward your totals. Undoing a completion immediately removes its estimated weight from every figure on this page.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-stone-900">Local-only storage</dt>
            <dd className="mt-1">
              Completed guides are stored only in this browser’s local storage on this device and stay in sync across open tabs. Nothing is sent to a server, and clearing browser site data resets your totals.
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-stone-900">Why there are no CO₂e figures</dt>
            <dd className="mt-1">
              ReMake 3D reports estimated reused grams instead of greenhouse-gas savings (CO₂e). Defensible emissions models such as U.S. EPA WARM depend on your local disposal baseline and whether a project displaced a new purchase, which this catalog does not track.
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
