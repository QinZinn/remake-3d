import type { Inventory } from "./inventory";
import type { Project } from "./scene/schema";
import type { MaterialId, ToolId } from "./taxonomy";

export type MatchGroup = "ready" | "almost" | "inspiration";

export interface MaterialQuantity {
  id: MaterialId;
  qty: number;
}

export interface ProjectMatch {
  project: Project;
  group: MatchGroup;
  missingMaterials: MaterialQuantity[];
  missingTools: ToolId[];
  usedMaterials: MaterialQuantity[];
  score: number;
  matchedWasteGrams: number;
}

function materialRequirements(project: Project) {
  const requirements = new Map<MaterialId, { required: number; optional: number }>();
  for (const { id, qty, optional } of project.materials) {
    const amounts = requirements.get(id) ?? { required: 0, optional: 0 };
    amounts[optional ? "optional" : "required"] += qty;
    requirements.set(id, amounts);
  }
  return requirements;
}

function toolRequirements(project: Project) {
  const requirements = new Map<ToolId, boolean>();
  for (const { id, optional } of project.tools) {
    requirements.set(id, requirements.get(id) === true || !optional);
  }
  return requirements;
}

function shortfall(required: number, available: number): number {
  const difference = required - available;
  // Quantities can be fractional. Ignore subtraction noise when stock equals the recipe.
  return difference > Number.EPSILON * Math.max(required, available) ? difference : 0;
}

function matchProject(project: Project, inventory: Inventory, tools: ReadonlySet<ToolId>): ProjectMatch {
  const missingMaterials: MaterialQuantity[] = [];
  const missingTools: ToolId[] = [];
  const usedMaterials: MaterialQuantity[] = [];
  const coveredShare = new Map<MaterialId, number>();
  let score = 0;

  for (const [id, { required, optional }] of materialRequirements(project)) {
    const stock = inventory.materials[id] ?? 0;
    const available = Number.isFinite(stock) && stock > 0 ? stock : 0;
    const missing = shortfall(required, available);
    const used = Math.min(required + optional, available);
    if (missing > 0) missingMaterials.push({ id, qty: missing });
    if (used > 0) usedMaterials.push({ id, qty: used });

    if (required > 0) score += 8 * (1 - missing / required);
    if (optional > 0) score += 2 * Math.min(1, Math.max(0, available - required) / optional);
    coveredShare.set(id, used / (required + optional));
  }

  for (const [id, required] of toolRequirements(project)) {
    if (tools.has(id)) score += required ? 3 : 1;
    else if (required) missingTools.push(id);
  }

  const missingCount = missingMaterials.length + missingTools.length;
  const group = missingCount === 0 ? "ready" : missingCount <= 2 ? "almost" : "inspiration";
  const matchedWasteGrams = project.wasteDiverted.reduce(
    (total, { materialId, grams }) => total + grams * (coveredShare.get(materialId) ?? 0),
    0,
  );

  return { project, group, missingMaterials, missingTools, usedMaterials, score: score - 5 * missingCount, matchedWasteGrams };
}

/** Rank within each group so a project that can be made now always comes first. */
export function matchProjects(projects: readonly Project[], inventory: Inventory): Record<MatchGroup, ProjectMatch[]> {
  const tools = new Set(inventory.tools);
  const groups: Record<MatchGroup, ProjectMatch[]> = { ready: [], almost: [], inspiration: [] };
  for (const project of projects) {
    const match = matchProject(project, inventory, tools);
    groups[match.group].push(match);
  }
  for (const matches of Object.values(groups)) {
    matches.sort((a, b) => b.score - a.score || b.matchedWasteGrams - a.matchedWasteGrams || a.project.slug.localeCompare(b.project.slug, "en"));
  }
  return groups;
}
