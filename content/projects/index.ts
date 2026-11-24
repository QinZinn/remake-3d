/**
 * Project catalog. Every entry is parsed with `ProjectSchema` when this module
 * loads, so an invalid project throws during `pnpm build` (the project pages
 * are statically generated from this list) and in `pnpm test`.
 */
import { ProjectSchema, type Project, type ProjectInput } from "@/lib/scene/schema";
import petSelfWateringPlanter from "./pet-self-watering-planter";

const RAW: ProjectInput[] = [petSelfWateringPlanter];

function load(raw: ProjectInput[]): Project[] {
  const slugs = new Set<string>();
  return raw.map((p) => {
    const result = ProjectSchema.safeParse(p);
    if (!result.success) {
      const details = result.error.issues.map((i) => `  - ${i.path.join(".")}: ${i.message}`).join("\n");
      throw new Error(`Invalid project "${p.slug}":\n${details}`);
    }
    if (slugs.has(result.data.slug)) throw new Error(`Duplicate project slug "${result.data.slug}"`);
    slugs.add(result.data.slug);
    return result.data;
  });
}

export const PROJECTS: readonly Project[] = load(RAW);

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}
