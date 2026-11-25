import { isMaterialId, isToolId, MATERIAL_IDS, TOOL_IDS, type MaterialId, type ToolId } from "./taxonomy";

export interface Inventory {
  materials: Partial<Record<MaterialId, number>>;
  tools: readonly ToolId[];
}

type SearchParams = Record<string, string | string[] | undefined>;

function values(value: SearchParams[string]): string[] {
  return typeof value === "string" ? [value] : value ?? [];
}

export function readInventory(params: SearchParams): Inventory {
  const materials: Inventory["materials"] = {};
  for (const value of values(params.material)) {
    const [id, quantity, extra] = value.split(":");
    if (extra !== undefined || !isMaterialId(id) || !/^\d+(?:\.\d+)?(?:e[+-]?\d+)?$/.test(quantity ?? "")) continue;
    const qty = Number(quantity);
    if (Number.isFinite(qty) && qty > 0) materials[id] = qty;
  }
  const tools = [...new Set(values(params.tool).filter(isToolId))];
  return { materials, tools };
}

export function inventoryQuery(inventory: Inventory): string {
  const params = new URLSearchParams();
  for (const id of MATERIAL_IDS) {
    const qty = inventory.materials[id];
    if (qty !== undefined && Number.isFinite(qty) && qty > 0) params.append("material", `${id}:${qty}`);
  }
  for (const id of TOOL_IDS) {
    if (inventory.tools.includes(id)) params.append("tool", id);
  }
  return params.toString();
}
