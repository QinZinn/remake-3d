import type { RenderMaterial } from "./schema";

type Preset = RenderMaterial["preset"];

/** Default colour and opacity per render preset. The look itself lives in the renderer. */
export const PRESET_DEFAULTS: Record<Preset, { color: string; opacity: number }> = {
  pet: { color: "#cfe9f2", opacity: 1 },
  glass: { color: "#e6f2ee", opacity: 1 },
  aluminium: { color: "#c9ccd1", opacity: 1 },
  plastic: { color: "#2f7de1", opacity: 1 },
  cardboard: { color: "#b98a57", opacity: 1 },
  fabric: { color: "#e8e1d4", opacity: 1 },
  soil: { color: "#4a3426", opacity: 1 },
  wood: { color: "#a8794c", opacity: 1 },
  paint: { color: "#c0563b", opacity: 1 },
};
