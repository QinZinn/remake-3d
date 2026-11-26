import Link from "next/link";
import { PROJECTS } from "@/content/projects";
import { formatGrams, projectWasteGrams } from "@/lib/impact";
import CatalogBrowser from "./components/CatalogBrowser";
import CatalogHeader from "./components/CatalogHeader";
import HeroDraftingPlate from "./components/HeroDraftingPlate";
import { ArrowRightIcon, ViewfinderIcon } from "./components/Icons";
import { toProjectCardData } from "./components/ProjectCard";

export default function Home() {
  const cardItems = PROJECTS.map(toProjectCardData);
  const totalSteps = PROJECTS.reduce((sum, p) => sum + p.steps.length, 0);
  const totalGrams = PROJECTS.reduce(
    (sum, p) => sum + projectWasteGrams(p.wasteDiverted),
    0,
  );
  const wasteStreamCount = new Set(
    cardItems.map((item) => item.primaryMaterialId),
  ).size;

  return (
    <>
      <CatalogHeader active="catalog" />
      <main className="mx-auto max-w-6xl px-5 pb-16 sm:px-8">
        {/* Hero workshop spread */}
        <section
          aria-labelledby="hero-heading"
          className="grid items-center gap-8 border-b border-[var(--rule)] py-9 sm:py-12 lg:grid-cols-12 lg:gap-10 lg:py-14"
        >
          <div className="lg:col-span-7">
            <h1
              id="hero-heading"
              className="font-display text-[clamp(2.6rem,5.4vw,4.35rem)] leading-[0.98] font-bold tracking-[-0.03em] text-[var(--ink)]"
            >
              Give what you have a second life.
            </h1>
            <p className="mt-5 max-w-[48ch] text-base leading-relaxed text-[var(--ink-secondary)] sm:text-lg">
              Match clean household recyclables and everyday tools to practical upcycling builds—each guided by an interactive, step-by-step 3D preview.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link href="/find" className="action-primary focus-ring">
                <span>Find by what you have</span>
                <ArrowRightIcon className="h-4 w-4" />
              </Link>
              <Link href="/find#scan" className="action-secondary focus-ring">
                <ViewfinderIcon className="h-4 w-4 text-[var(--accent-vermilion)]" />
                <span>Scan a photo on-device</span>
              </Link>
              <Link
                href="/impact"
                className="focus-ring rounded-[3px] px-2 py-2 text-sm font-semibold text-[var(--accent-cobalt)] underline-offset-4 hover:text-[var(--accent-vermilion)] hover:underline"
              >
                Your impact
              </Link>
            </div>

            {/* Workshop ledger spec strip */}
            <dl className="mt-9 grid grid-cols-2 gap-x-6 gap-y-4 border-t border-[var(--rule)] pt-5 sm:grid-cols-4">
              <div>
                <dt className="text-xs font-medium text-[var(--ink-muted)]">
                  Curated guides
                </dt>
                <dd className="font-mono-spec mt-0.5 text-xl font-semibold text-[var(--ink)]">
                  {PROJECTS.length}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-[var(--ink-muted)]">
                  Waste streams
                </dt>
                <dd className="font-mono-spec mt-0.5 text-xl font-semibold text-[var(--ink)]">
                  {wasteStreamCount}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-[var(--ink-muted)]">
                  3D build steps
                </dt>
                <dd className="font-mono-spec mt-0.5 text-xl font-semibold text-[var(--ink)]">
                  {totalSteps}
                </dd>
              </div>
              <div>
                <dt className="text-xs font-medium text-[var(--ink-muted)]">
                  Catalog mass
                </dt>
                <dd className="font-mono-spec mt-0.5 text-xl font-semibold text-[var(--ink)]">
                  {formatGrams(totalGrams)}
                </dd>
              </div>
            </dl>
          </div>

          <div className="lg:col-span-5">
            <HeroDraftingPlate />
          </div>
        </section>

        {/* Catalog specimen index */}
        <section
          id="catalog"
          aria-labelledby="projects"
          className="scroll-mt-6 pt-10 sm:pt-12"
        >
          <div className="mb-5 flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
            <div>
              <h2
                id="projects"
                className="font-display text-2xl font-bold tracking-[-0.02em] text-[var(--ink)] sm:text-[1.75rem]"
              >
                Project catalog
              </h2>
              <p className="mt-1 text-sm text-[var(--ink-secondary)]">
                Filter by household waste stream or open any specimen to inspect its interactive 3D assembly.
              </p>
            </div>
            <p className="font-mono-spec text-xs font-medium text-[var(--ink-muted)]">
              {PROJECTS.length} SOURCE-ATTRIBUTED GUIDES
            </p>
          </div>

          <CatalogBrowser items={cardItems} />
        </section>
      </main>

      <footer className="border-t border-[var(--rule)] bg-[var(--bg-kraft)]/55">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-5 py-8 text-sm text-[var(--ink-secondary)] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <div>
            <p className="font-display font-bold text-[var(--ink)]">
              ReMake <span className="text-[var(--accent-vermilion)]">3D</span>
            </p>
            <p className="mt-0.5 text-xs text-[var(--ink-muted)]">
              On-device photo scanning, deterministic matching, and honest gram-based reuse estimates.
            </p>
          </div>
          <nav aria-label="Footer" className="flex flex-wrap items-center gap-5 text-xs font-semibold">
            <Link href="/#catalog" className="focus-ring rounded-[2px] text-[var(--ink-secondary)] hover:text-[var(--ink)]">
              Catalog
            </Link>
            <Link href="/find" className="focus-ring rounded-[2px] text-[var(--ink-secondary)] hover:text-[var(--ink)]">
              Find &amp; Scan
            </Link>
            <Link href="/impact" className="focus-ring rounded-[2px] text-[var(--ink-secondary)] hover:text-[var(--ink)]">
              Local Impact
            </Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
