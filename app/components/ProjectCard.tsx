import Link from "next/link";
import type { Project } from "@/lib/scene/schema";
import { labelOf } from "@/lib/taxonomy";

export default function ProjectCard({ project, children }: { project: Project; children?: React.ReactNode }) {
  const primaryMaterial = project.materials.find((m) => !m.optional) ?? project.materials[0];
  return (
    <article className="flex h-full flex-col rounded-2xl border border-stone-200 bg-white p-5 shadow-xs sm:p-6">
      <p className="mb-2 text-xs font-medium text-emerald-800">{labelOf(primaryMaterial.id)}</p>
      <h3 className="text-lg leading-snug font-semibold tracking-tight text-stone-950">{project.title}</h3>
      <p className="mt-2 text-sm leading-relaxed text-stone-600">{project.summary}</p>
      {children}
      <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 pt-5">
        <p className="text-sm text-stone-600">
          <span className="capitalize">{project.difficulty}</span><span aria-hidden> · </span>{project.timeMinutes} min
        </p>
        <Link
          href={`/project/${project.slug}`}
          aria-label={`View ${project.title}`}
          className="focus-ring rounded-sm text-sm font-semibold text-emerald-800 underline-offset-4 hover:underline"
        >
          View guide <span aria-hidden>↗</span>
        </Link>
      </div>
    </article>
  );
}
