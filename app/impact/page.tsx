import type { Metadata } from "next";
import { PROJECTS } from "@/content/projects";
import { toImpactProjectSummaries } from "@/lib/impact";
import CatalogHeader from "../components/CatalogHeader";
import ImpactDashboard from "./ImpactDashboard";

export const metadata: Metadata = {
  title: "Your impact",
  description:
    "Track completed ReMake 3D guides and estimated reused material weight on this device.",
};

export default function ImpactPage() {
  // Strip 3D scenes, steps, and sources on the server so the tracker stays lightweight in the client bundle.
  const projects = toImpactProjectSummaries(PROJECTS);

  return (
    <>
      <CatalogHeader active="impact" />
      <main className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-11">
        <header className="mb-7 border-b border-[var(--rule)] pb-6 sm:mb-8">
          <h1 className="font-display text-3xl leading-[1.08] font-bold tracking-[-0.025em] text-[var(--ink)] sm:text-4xl">
            Your impact
          </h1>
          <p className="mt-2.5 max-w-[58ch] text-base leading-relaxed text-[var(--ink-secondary)]">
            Completed guides and catalog-estimated reused material mass recorded locally in this browser.
          </p>
        </header>
        <ImpactDashboard projects={projects} />
      </main>
    </>
  );
}
