import type { BoxParams } from "./params";
import { defineMesh } from "./types";

export const box = defineMesh<BoxParams>({
  id: "box",
  label: "Box",
  bounds: ({ width, height, depth }) => ({
    min: [-width / 2, 0, -depth / 2],
    max: [width / 2, height, depth / 2],
  }),
});
