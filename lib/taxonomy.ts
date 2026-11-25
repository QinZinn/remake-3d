/**
 * Normalized taxonomy of materials and tools.
 *
 * Every project, the matcher and (later) the vision scan speak in these ids,
 * so ids are stable: rename a label freely, never an id.
 */

export interface Label {
  en: string;
  vi: string;
}

export type MaterialCategory = "plastic" | "metal" | "glass" | "paper" | "textile" | "rubber" | "wood" | "supply";
export type ToolCategory = "cutting" | "joining" | "drilling" | "marking" | "finishing";

interface Entry<C extends string> {
  label: Label;
  category: C;
  /** Lower-case alternative names (EN and VI) used for lookup. */
  aliases: readonly string[];
}

export const MATERIALS = {
  "pet-bottle": {
    label: { en: "PET plastic bottle", vi: "Chai nhựa PET" },
    category: "plastic",
    aliases: ["plastic bottle", "water bottle", "soda bottle", "soft drink bottle", "2l bottle", "chai nhựa", "chai nước", "chai pet", "vỏ chai"],
  },
  "bottle-cap": {
    label: { en: "Bottle cap", vi: "Nắp chai" },
    category: "plastic",
    aliases: ["cap", "plastic cap", "screw cap", "nắp chai", "nắp nhựa"],
  },
  "hdpe-jug": {
    label: { en: "HDPE milk jug", vi: "Bình nhựa HDPE (bình sữa)" },
    category: "plastic",
    aliases: ["milk jug", "plastic jug", "detergent bottle", "can nhựa", "bình sữa nhựa"],
  },
  "aluminium-can": {
    label: { en: "Aluminium can", vi: "Lon nhôm" },
    category: "metal",
    aliases: ["aluminum can", "soda can", "beer can", "drink can", "lon nhôm", "lon nước", "lon bia", "vỏ lon"],
  },
  "steel-can": {
    label: { en: "Steel food can (tin can)", vi: "Lon sắt / hộp thiếc" },
    category: "metal",
    aliases: ["tin can", "food can", "soup can", "steel can", "tin", "lon sắt", "hộp thiếc", "lon đồ hộp"],
  },
  "glass-jar": {
    label: { en: "Glass jar", vi: "Hũ thủy tinh" },
    category: "glass",
    aliases: ["jar", "mason jar", "jam jar", "pickle jar", "lọ thủy tinh", "hũ", "lọ"],
  },
  "glass-bottle": {
    label: { en: "Glass bottle", vi: "Chai thủy tinh" },
    category: "glass",
    aliases: ["wine bottle", "beer bottle", "chai rượu", "chai bia", "chai thủy tinh"],
  },
  cardboard: {
    label: { en: "Cardboard box", vi: "Thùng các-tông" },
    category: "paper",
    aliases: ["carton box", "box", "corrugated cardboard", "shipping box", "bìa các tông", "thùng giấy", "hộp giấy"],
  },
  "milk-carton": {
    label: { en: "Milk carton (Tetra Pak)", vi: "Hộp sữa giấy (Tetra Pak)" },
    category: "paper",
    aliases: ["tetra pak", "juice carton", "drink carton", "hộp sữa", "hộp giấy sữa"],
  },
  newspaper: {
    label: { en: "Newspaper", vi: "Giấy báo" },
    category: "paper",
    aliases: ["old newspaper", "magazine", "báo cũ", "giấy báo"],
  },
  "t-shirt": {
    label: { en: "Old cotton T-shirt", vi: "Áo thun cotton cũ" },
    category: "textile",
    aliases: ["tshirt", "tee", "shirt", "cotton shirt", "áo thun", "áo phông", "áo cũ"],
  },
  jeans: {
    label: { en: "Old jeans", vi: "Quần jean cũ" },
    category: "textile",
    aliases: ["denim", "jean", "quần bò", "quần jean"],
  },
  tire: {
    label: { en: "Old tire", vi: "Lốp xe cũ" },
    category: "rubber",
    aliases: ["tyre", "car tire", "rubber tire", "lốp xe", "vỏ xe"],
  },
  "wood-pallet": {
    label: { en: "Wood pallet", vi: "Pallet gỗ" },
    category: "wood",
    aliases: ["pallet", "shipping pallet", "pallet gỗ", "kệ gỗ"],
  },
  "cotton-string": {
    label: { en: "Cotton string or yarn", vi: "Dây cotton / sợi len" },
    category: "textile",
    aliases: ["string", "yarn", "twine", "cord", "dây", "sợi len", "dây cotton"],
  },
  "potting-soil": {
    label: { en: "Potting soil", vi: "Đất trồng cây" },
    category: "supply",
    aliases: ["soil", "compost", "potting mix", "đất", "đất trồng"],
  },
  "plant-seedling": {
    label: { en: "Seedling or seeds", vi: "Cây con hoặc hạt giống" },
    category: "supply",
    aliases: ["seeds", "seedling", "herb", "plant", "hạt giống", "cây con"],
  },
  "acrylic-paint": {
    label: { en: "Acrylic paint", vi: "Sơn acrylic" },
    category: "supply",
    aliases: ["paint", "spray paint", "sơn", "màu acrylic"],
  },
} as const satisfies Record<string, Entry<MaterialCategory>>;

export const TOOLS = {
  scissors: {
    label: { en: "Scissors", vi: "Kéo" },
    category: "cutting",
    aliases: ["scissor", "shears", "kéo"],
  },
  "utility-knife": {
    label: { en: "Utility knife", vi: "Dao rọc giấy" },
    category: "cutting",
    aliases: ["box cutter", "craft knife", "stanley knife", "x-acto", "cutter", "dao rọc giấy", "dao trổ"],
  },
  "hot-glue-gun": {
    label: { en: "Hot glue gun", vi: "Súng bắn keo nến" },
    category: "joining",
    aliases: ["glue gun", "hot glue", "súng keo", "keo nến"],
  },
  drill: {
    label: { en: "Drill", vi: "Máy khoan" },
    category: "drilling",
    aliases: ["power drill", "cordless drill", "khoan", "máy khoan"],
  },
  "nail-awl": {
    label: { en: "Nail or awl", vi: "Đinh hoặc dùi" },
    category: "drilling",
    aliases: ["awl", "nail", "skewer", "đinh", "dùi"],
  },
  marker: {
    label: { en: "Permanent marker", vi: "Bút lông dầu" },
    category: "marking",
    aliases: ["sharpie", "pen", "bút lông", "bút dạ"],
  },
  "ruler-tape": {
    label: { en: "Ruler or tape measure", vi: "Thước kẻ / thước dây" },
    category: "marking",
    aliases: ["ruler", "tape measure", "measuring tape", "thước", "thước dây"],
  },
  sandpaper: {
    label: { en: "Sandpaper", vi: "Giấy nhám" },
    category: "finishing",
    aliases: ["sanding paper", "emery paper", "giấy nhám", "giấy ráp"],
  },
  paintbrush: {
    label: { en: "Paintbrush", vi: "Cọ vẽ" },
    category: "finishing",
    aliases: ["brush", "cọ", "cọ sơn"],
  },
} as const satisfies Record<string, Entry<ToolCategory>>;

export type MaterialId = keyof typeof MATERIALS;
export type ToolId = keyof typeof TOOLS;

export const MATERIAL_IDS = Object.keys(MATERIALS) as [MaterialId, ...MaterialId[]];
export const TOOL_IDS = Object.keys(TOOLS) as [ToolId, ...ToolId[]];

export function isMaterialId(id: string): id is MaterialId {
  return Object.hasOwn(MATERIALS, id);
}

export function isToolId(id: string): id is ToolId {
  return Object.hasOwn(TOOLS, id);
}

export function getMaterial(id: MaterialId) {
  return { id, ...MATERIALS[id] };
}

export function getTool(id: ToolId) {
  return { id, ...TOOLS[id] };
}

export type Locale = keyof Label;

export function labelOf(id: MaterialId | ToolId, locale: Locale = "en"): string {
  const entry = isMaterialId(id) ? MATERIALS[id] : TOOLS[id as ToolId];
  return entry.label[locale];
}

/** The normalisation `findByText` applies (trim, lower case, NFC, single spaces). */
export function normalize(text: string): string {
  return text.trim().toLowerCase().normalize("NFC").replace(/\s+/g, " ");
}

type Match = { kind: "material"; id: MaterialId } | { kind: "tool"; id: ToolId };

/**
 * Resolve free text (EN or VI, id, label or alias) to a taxonomy entry.
 * Exact matches only, case and whitespace insensitive; returns null when unknown.
 */
export function findByText(text: string): Match | null {
  const q = normalize(text);
  if (!q) return null;
  for (const id of MATERIAL_IDS) {
    const e = MATERIALS[id];
    if (id === q || normalize(e.label.en) === q || normalize(e.label.vi) === q || e.aliases.some((a) => normalize(a) === q)) {
      return { kind: "material", id };
    }
  }
  for (const id of TOOL_IDS) {
    const e = TOOLS[id];
    if (id === q || normalize(e.label.en) === q || normalize(e.label.vi) === q || e.aliases.some((a) => normalize(a) === q)) {
      return { kind: "tool", id };
    }
  }
  return null;
}
