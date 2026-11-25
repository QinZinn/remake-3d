/**
 * Project catalog. Every entry is parsed with `ProjectSchema` when this module
 * loads, so an invalid project throws during `pnpm build` (the project pages
 * are statically generated from this list) and in `pnpm test`.
 */
import { ProjectSchema, type Project, type ProjectInput } from "@/lib/scene/schema";
import bottleCapMosaic from "./bottle-cap-mosaic";
import cardboardDeskTray from "./cardboard-desk-tray";
import cardboardMailSorter from "./cardboard-mail-sorter";
import denimGlassesSleeve from "./denim-glasses-sleeve";
import dryGoodsHardwareTray from "./dry-goods-hardware-tray";
import glassBottleBudVase from "./glass-bottle-bud-vase";
import glassJarHardwareSorter from "./glass-jar-hardware-sorter";
import hdpeJugPlantMarkers from "./hdpe-jug-plant-markers";
import hdpeJugPlantSaucer from "./hdpe-jug-plant-saucer";
import jarPropagationStation from "./jar-propagation-station";
import milkCartonDrawerDividers from "./milk-carton-drawer-dividers";
import milkCartonSeedlingPot from "./milk-carton-seedling-pot";
import newspaperSeedPot from "./newspaper-seed-pot";
import petBottleScoop from "./pet-bottle-scoop";
import petSeedlingCloche from "./pet-seedling-cloche";
import petSelfWateringPlanter from "./pet-self-watering-planter";
import steelCanPencilCup from "./steel-can-pencil-cup";
import tShirtGardenPlantTies from "./t-shirt-garden-plant-ties";
import tShirtNoSewTote from "./t-shirt-no-sew-tote";
import upcycledContainerCraftCaddy from "./upcycled-container-craft-caddy";

const RAW: ProjectInput[] = [
  petSelfWateringPlanter,
  cardboardDeskTray,
  tShirtNoSewTote,
  steelCanPencilCup,
  glassJarHardwareSorter,
  bottleCapMosaic,
  petBottleScoop,
  milkCartonSeedlingPot,
  glassBottleBudVase,
  newspaperSeedPot,
  hdpeJugPlantMarkers,
  hdpeJugPlantSaucer,
  petSeedlingCloche,
  cardboardMailSorter,
  milkCartonDrawerDividers,
  tShirtGardenPlantTies,
  denimGlassesSleeve,
  upcycledContainerCraftCaddy,
  jarPropagationStation,
  dryGoodsHardwareTray,
];

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
