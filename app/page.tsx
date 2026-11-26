import Link from "next/link";
import { PROJECTS } from "@/content/projects";
import CatalogHeader from "./components/CatalogHeader";
import ProjectCard from "./components/ProjectCard";

export default function Home() {
  return (
    <>
      <CatalogHeader active="catalog" />
      <main className="mx-auto max-w-6xl px-5 pb-14 sm:px-8">
        <section className="my-6 rounded-[2rem] bg-[#173e2c] px-6 py-11 text-white sm:my-9 sm:px-12 sm:py-14">
          <h1 className="max-w-2xl font-serif text-[clamp(2.7rem,6vw,4.5rem)] leading-[1.02] tracking-tight text-balance">
            Give what you have a second life.
          </h1>
          <p className="mt-4 max-w-md text-base leading-relaxed text-emerald-50/85 sm:text-lg">
            Match the materials and tools you have to upcycling projects with step-by-step 3D guides.
          </p>
          <div className="mt-6 flex flex-wrap items-center gap-3">
            <Link href="/find" className="focus-ring inline-flex items-center gap-3 rounded-full bg-[#e3f1ce] px-5 py-3 text-sm font-semibold text-emerald-950 hover:bg-white">
              Find projects <span aria-hidden>→</span>
            </Link>
            <Link href="/impact" className="focus-ring inline-flex items-center gap-2 rounded-full border border-emerald-200/35 bg-white/10 px-5 py-3 text-sm font-semibold text-white hover:bg-white/20">
              Your impact
            </Link>
          </div>
        </section>
        <section id="catalog" aria-labelledby="projects" className="scroll-mt-4">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id="projects" className="text-2xl font-semibold tracking-tight">Project catalog</h2>
            <p className="text-sm text-stone-600">{PROJECTS.length} guides</p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PROJECTS.map((project) => (
              <li key={project.slug}><ProjectCard project={project} /></li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
