import type { Metadata } from "next";
import Link from "next/link";
import { PROJECTS } from "@/content/projects";
import { inventoryQuery, readInventory } from "@/lib/inventory";
import { matchProjects, type MatchGroup, type MaterialQuantity } from "@/lib/match";
import { labelOf, MATERIAL_IDS } from "@/lib/taxonomy";
import CatalogHeader from "../components/CatalogHeader";
import { ArrowLeftIcon } from "../components/Icons";
import { streamThemeForMaterial } from "../components/materialMeta";
import ProjectCard, { toProjectCardData } from "../components/ProjectCard";

export const metadata: Metadata = {
  title: "Project matches",
  robots: { index: false },
};

const GROUPS = [
  {
    id: "ready",
    label: "Ready to make",
    detail: "You have every required material and tool.",
    dotColor: "#1D5A3F",
  },
  {
    id: "almost",
    label: "Missing 1–2 items",
    detail: "A couple of additions will get you started.",
    dotColor: "#B36A16",
  },
  {
    id: "inspiration",
    label: "Inspiration",
    detail: "Browse builds that need more materials or tools.",
    dotColor: "#5D6057",
  },
] as const satisfies readonly {
  id: MatchGroup;
  label: string;
  detail: string;
  dotColor: string;
}[];

const quantityFormat = new Intl.NumberFormat("en", { maximumSignificantDigits: 10 });

function materialText({ id, qty }: MaterialQuantity): string {
  return `${labelOf(id)} × ${quantityFormat.format(qty)}`;
}

export default async function ResultsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const inventory = readInventory(await searchParams);
  const query = inventoryQuery(inventory);
  const groups = query ? matchProjects(PROJECTS, inventory) : null;
  const activeMaterialIds = MATERIAL_IDS.filter(
    (id) => inventory.materials[id] !== undefined,
  );

  return (
    <>
      <CatalogHeader />
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-11">
        <header className="mb-8 border-b border-[var(--rule)] pb-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h1 className="font-display text-3xl leading-[1.08] font-bold tracking-[-0.025em] text-[var(--ink)] sm:text-4xl">
                Your project matches
              </h1>
              <p className="mt-2.5 text-base text-[var(--ink-secondary)]">
                {groups
                  ? `${groups.ready.length} of ${PROJECTS.length} projects ready to make with your current workbench.`
                  : "Add materials or tools to match projects you can build right now."}
              </p>
            </div>
            <Link
              href={query ? `/find?${query}` : "/find"}
              className="action-secondary focus-ring"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              <span>{groups ? "Edit inventory" : "Add what you have"}</span>
            </Link>
          </div>

          {groups && (activeMaterialIds.length > 0 || inventory.tools.length > 0) && (
            <div className="mt-5 flex flex-wrap items-center gap-2 rounded-[4px] border border-[var(--rule)] bg-[var(--bg-kraft)]/65 px-3.5 py-2.5 text-xs">
              <span className="font-mono-spec font-semibold text-[var(--ink-muted)] uppercase">
                On bench:
              </span>
              {activeMaterialIds.map((id) => {
                const theme = streamThemeForMaterial(id);
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 rounded-[3px] border border-[var(--rule)] bg-[var(--bg-plate)] px-2.5 py-1 font-medium text-[var(--ink)]"
                  >
                    <span
                      aria-hidden="true"
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: theme.bar }}
                    />
                    {labelOf(id)}
                    <span className="font-mono-spec text-[var(--ink-muted)]">
                      ×{quantityFormat.format(inventory.materials[id] ?? 1)}
                    </span>
                  </span>
                );
              })}
              {inventory.tools.map((toolId) => (
                <span
                  key={toolId}
                  className="inline-flex items-center rounded-[3px] border border-[var(--rule)] bg-[var(--bg-plate)] px-2.5 py-1 font-medium text-[var(--ink-secondary)]"
                >
                  {labelOf(toolId)}
                </span>
              ))}
            </div>
          )}
        </header>

        {groups && (
          <div className="grid gap-10">
            {GROUPS.map(({ id, label, detail, dotColor }) => (
              <section key={id} aria-labelledby={`match-${id}`}>
                <header className="mb-5 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 border-b border-[var(--rule)] pb-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: dotColor }}
                    />
                    <h2
                      id={`match-${id}`}
                      className="font-display text-xl font-bold tracking-[-0.015em] text-[var(--ink)]"
                    >
                      {label}
                    </h2>
                    <span className="font-mono-spec rounded-[3px] border border-[var(--rule)] bg-[var(--bg-kraft)]/75 px-2 py-0.5 text-xs font-semibold text-[var(--ink)]">
                      {groups[id].length}
                    </span>
                  </div>
                  {groups[id].length > 0 && (
                    <p className="text-sm text-[var(--ink-secondary)]">{detail}</p>
                  )}
                </header>

                {groups[id].length ? (
                  <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                    {groups[id].map((match) => {
                      const needed = [
                        ...match.missingMaterials.map(materialText),
                        ...match.missingTools.map((tool) => labelOf(tool)),
                      ];
                      return (
                        <li key={match.project.slug}>
                          <ProjectCard project={toProjectCardData(match.project)}>
                            {needed.length > 0 && (
                              <div className="mt-4 border-t border-[var(--accent-ochre-rule)] pt-3 text-xs text-[var(--accent-ochre)]">
                                <p className="font-mono-spec font-semibold uppercase">
                                  Still needed
                                </p>
                                <ul className="mt-1 list-disc space-y-0.5 pl-4 text-[13px] font-medium">
                                  {needed.map((item) => (
                                    <li key={item}>{item}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </ProjectCard>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="rounded-[4px] border border-[var(--rule)] bg-[var(--bg-plate)] px-4 py-3 text-sm text-[var(--ink-secondary)]">
                    {id === "ready"
                      ? "No complete matches yet. Check the near-miss builds below to see what single material or tool unlocks them."
                      : "No projects in this group."}
                  </p>
                )}
              </section>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
