import type { Metadata } from "next";
import Link from "next/link";
import { PROJECTS } from "@/content/projects";
import { inventoryQuery, readInventory } from "@/lib/inventory";
import { matchProjects, type MatchGroup, type MaterialQuantity } from "@/lib/match";
import { labelOf } from "@/lib/taxonomy";
import CatalogHeader from "../components/CatalogHeader";
import ProjectCard from "../components/ProjectCard";

export const metadata: Metadata = { title: "Project matches", robots: { index: false } };

const GROUPS = [
  { id: "ready", label: "Ready to make", detail: "You have every required material and tool." },
  { id: "almost", label: "Missing 1–2 items", detail: "A couple of additions will get you started." },
  { id: "inspiration", label: "Inspiration", detail: "Browse ideas that need more materials or tools." },
] as const satisfies readonly { id: MatchGroup; label: string; detail: string }[];

const quantityFormat = new Intl.NumberFormat("en", { maximumSignificantDigits: 10 });

function materialText({ id, qty }: MaterialQuantity): string {
  return `${labelOf(id)} × ${quantityFormat.format(qty)}`;
}

export default async function ResultsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const inventory = readInventory(await searchParams);
  const query = inventoryQuery(inventory);
  const groups = query ? matchProjects(PROJECTS, inventory) : null;

  return (
    <>
      <CatalogHeader />
      <main className="mx-auto max-w-6xl px-5 py-9 sm:px-8 sm:py-12">
        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-[clamp(2.6rem,5.6vw,4.2rem)] leading-[1.05] tracking-tight text-emerald-950">Your project matches</h1>
            <p className="mt-3 text-stone-600">
              {groups ? `${groups.ready.length} of ${PROJECTS.length} projects ready to make with your inventory.` : "Add materials or tools to find projects you can make."}
            </p>
          </div>
          <Link href={query ? `/find?${query}` : "/find"} className="action-secondary focus-ring">
            {groups ? "Edit inventory" : "Add what you have"}
          </Link>
        </header>
        {groups && (
          <div className="grid gap-9">
            {GROUPS.map(({ id, label, detail }) => (
              <section key={id} aria-labelledby={`match-${id}`}>
                <header className="mb-4 flex flex-wrap items-baseline gap-x-3 gap-y-1 border-b border-stone-200 pb-3">
                  <h2 id={`match-${id}`} className="text-xl font-semibold tracking-tight text-emerald-950">{label}</h2>
                  <span className="rounded-full bg-stone-200/65 px-2.5 py-0.5 text-xs font-semibold text-stone-700">{groups[id].length}</span>
                  {groups[id].length > 0 && <p className="basis-full text-sm text-stone-600">{detail}</p>}
                </header>
                {groups[id].length ? (
                  <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {groups[id].map((match) => {
                      const needed = [...match.missingMaterials.map(materialText), ...match.missingTools.map((tool) => labelOf(tool))];
                      return (
                        <li key={match.project.slug}>
                          <ProjectCard project={match.project}>
                            {needed.length > 0 && (
                              <div className="mt-4 rounded-xl bg-[#f8f4eb] px-3 py-2.5 text-sm text-[#69481e]">
                                <p className="font-semibold">Still needed</p>
                                <ul className="mt-1 list-disc space-y-0.5 pl-4">{needed.map((item) => <li key={item}>{item}</li>)}</ul>
                              </div>
                            )}
                          </ProjectCard>
                        </li>
                      );
                    })}
                  </ul>
                ) : (
                  <p className="text-sm text-stone-600">
                    {id === "ready" ? "No complete matches yet. See what you’re missing below." : "No projects in this group."}
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
