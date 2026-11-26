import type { Metadata } from "next";
import { PROJECTS } from "@/content/projects";
import { toImpactProjectSummaries } from "@/lib/impact";
import CatalogHeader from "../components/CatalogHeader";
import ImpactDashboard from "./ImpactDashboard";

export const metadata: Metadata = {
  title: "Your impact",
  description: "Track completed ReMake 3D guides and estimated reused material weight on this device.",
};

export default function ImpactPage() {
  // Strip 3D scenes, steps, and sources on the server so the tracker stays lightweight in the client bundle.
  const projects = toImpactProjectSummaries(PROJECTS);

  return (
    <>
      <CatalogHeader active="impact" />
      <main className="mx-auto max-w-6xl px-5 py-9 sm:px-8 sm:py-12">
        <header className="mb-7 sm:mb-9">
          <h1 className="max-w-2xl font-serif text-[clamp(2.6rem,5.6vw,4.2rem)] leading-[1.05] tracking-tight text-balance text-emerald-950">
            Your impact
          </h1>
          <p className="mt-3 max-w-xl text-base leading-relaxed text-stone-600">
            Completed guides and estimated reused material weight saved locally in this browser.
          </p>
        </header>
        <ImpactDashboard projects={projects} />
      </main>
    </>
  );
}
