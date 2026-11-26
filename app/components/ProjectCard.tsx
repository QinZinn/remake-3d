import Link from "next/link";
import { formatGrams, projectWasteGrams } from "@/lib/impact";
import type { Project } from "@/lib/scene/schema";
import { labelOf, MATERIALS, type MaterialCategory, type MaterialId } from "@/lib/taxonomy";
import { ArrowUpRightIcon } from "./Icons";
import { MaterialSchematic, streamThemeForMaterial } from "./materialMeta";

export interface ProjectCardData {
  readonly slug: string;
  readonly title: string;
  readonly summary: string;
  readonly difficulty: Project["difficulty"];
  readonly timeMinutes: number;
  readonly primaryMaterialId: MaterialId;
  readonly category: MaterialCategory;
  readonly stepCount: number;
  readonly grams: number;
  readonly materialLabel: string;
}

export function toProjectCardData(project: Project): ProjectCardData {
  const primary = project.materials.find((m) => !m.optional) ?? project.materials[0];
  return {
    slug: project.slug,
    title: project.title,
    summary: project.summary,
    difficulty: project.difficulty,
    timeMinutes: project.timeMinutes,
    primaryMaterialId: primary.id,
    category: MATERIALS[primary.id].category,
    stepCount: project.steps.length,
    grams: projectWasteGrams(project.wasteDiverted),
    materialLabel: labelOf(primary.id),
  };
}

export default function ProjectCard({
  project,
  index,
  children,
}: {
  project: Project | ProjectCardData;
  index?: number;
  children?: React.ReactNode;
}) {
  const data: ProjectCardData =
    "primaryMaterialId" in project ? project : toProjectCardData(project);
  const theme = streamThemeForMaterial(data.primaryMaterialId);

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[4px] border border-[var(--rule)] bg-[var(--bg-plate)] transition-[border-color,transform,box-shadow] duration-150 hover:-translate-y-0.5 hover:border-[var(--ink)] hover:shadow-[0_6px_18px_-10px_rgba(24,26,23,0.22)]">
      {/* Specimen drafting header */}
      <div
        className="drafting-grid-light relative flex h-[7.25rem] items-center justify-between border-b px-4 py-3"
        style={{
          backgroundColor: theme.mat,
          borderBottomColor: theme.rule,
          color: theme.ink,
        }}
      >
        <div className="flex h-full flex-col justify-between">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold tracking-[0.01em]">
            <span
              aria-hidden="true"
              className="h-2 w-2 shrink-0 rounded-full"
              style={{ backgroundColor: theme.bar }}
            />
            {data.materialLabel}
          </span>
          <div className="font-mono-spec flex items-center gap-2 text-xs font-medium">
            {index !== undefined && (
              <span>#{String(index + 1).padStart(2, "0")}</span>
            )}
            {data.grams > 0 && (
              <span>≈ {formatGrams(data.grams)}</span>
            )}
          </div>
        </div>

        <MaterialSchematic
          materialId={data.primaryMaterialId}
          className="h-[4.25rem] w-[6.25rem] shrink-0 transition-transform duration-200 group-hover:scale-[1.04]"
        />
      </div>

      {/* Card body */}
      <div className="flex flex-1 flex-col p-5">
        <h3 className="font-display text-[1.125rem] leading-[1.24] font-bold tracking-[-0.015em] text-[var(--ink)]">
          <Link
            href={`/project/${data.slug}`}
            className="focus-ring rounded-[2px] hover:text-[var(--accent-vermilion)]"
          >
            {data.title}
          </Link>
        </h3>
        <p className="mt-2 text-sm leading-relaxed text-[var(--ink-secondary)]">
          {data.summary}
        </p>

        {children}

        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-3 gap-y-2 border-t border-[var(--rule-subtle)] pt-4 mt-5">
          <p className="font-mono-spec text-xs text-[var(--ink-muted)]">
            <span className="capitalize">{data.difficulty}</span>
            <span aria-hidden="true"> · </span>
            {data.timeMinutes}m
            <span aria-hidden="true"> · </span>
            {data.stepCount} steps
          </p>
          <Link
            href={`/project/${data.slug}`}
            aria-label={`View ${data.title}`}
            className="focus-ring inline-flex items-center gap-1 rounded-[2px] text-sm font-semibold text-[var(--accent-cobalt)] underline-offset-4 hover:text-[var(--accent-vermilion)] hover:underline"
          >
            <span>Open 3D guide</span>
            <ArrowUpRightIcon className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </article>
  );
}
