import Link from "next/link";
import { PROJECTS } from "@/content/projects";
import { labelOf } from "@/lib/taxonomy";

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col gap-10 px-5 py-14">
      <header className="flex flex-col gap-3">
        <p className="text-sm font-semibold tracking-wide text-emerald-700 uppercase">ReMake 3D</p>
        <h1 className="text-4xl font-semibold tracking-tight text-balance">Give your waste a second life, one step at a time.</h1>
        <p className="max-w-xl text-lg text-stone-600">
          Upcycling projects built from the things you already have, each with a 3D preview of every step. Finding projects from your own materials is coming soon.
        </p>
      </header>
      <section aria-labelledby="projects" className="flex flex-col gap-4">
        <h2 id="projects" className="text-sm font-semibold text-stone-500 uppercase">Projects</h2>
        <ul className="grid gap-3">
          {PROJECTS.map((p) => (
            <li key={p.slug}>
              <Link href={`/project/${p.slug}`} className="group flex flex-col gap-2 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm transition hover:border-emerald-600 hover:shadow">
                <span className="text-lg font-semibold group-hover:text-emerald-800">{p.title}</span>
                <span className="text-stone-600">{p.summary}</span>
                <span className="flex flex-wrap gap-2 text-xs text-stone-500">
                  <span className="rounded-full bg-stone-100 px-2 py-0.5 capitalize">{p.difficulty}</span>
                  <span className="rounded-full bg-stone-100 px-2 py-0.5">{p.timeMinutes} min</span>
                  {p.materials.filter((m) => !m.optional).slice(0, 3).map((m) => (
                    <span key={m.id} className="rounded-full bg-emerald-50 px-2 py-0.5 text-emerald-800">{labelOf(m.id)}</span>
                  ))}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
