import type { SleeveParams } from "./params";
import { defineLathe } from "./types";

/** Open thin cylinder: a wrap-around label, a band, a tube. */
export const sleeve = defineLathe<SleeveParams>({
  id: "sleeve",
  label: "Sleeve",
  profile(p) {
    return [
      [p.radius, 0],
      [p.radius, p.height],
    ];
  },
});
