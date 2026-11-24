import { z } from "zod";
import { definePrimitive } from "./types";

export const SleeveParams = z.object({
  height: z.number().positive().default(7),
  radius: z.number().positive().default(5.05),
});

/** Open thin cylinder: a wrap-around label, a band, a tube. */
export const sleeve = definePrimitive({
  id: "sleeve",
  label: "Sleeve",
  params: SleeveParams,
  profile(p) {
    return [
      [p.radius, 0],
      [p.radius, p.height],
    ];
  },
});
