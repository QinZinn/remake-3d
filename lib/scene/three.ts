/**
 * three.js adapters: turn pure scene data into geometry and materials.
 * Only the renderer imports this file.
 */
import {
  CatmullRomCurve3,
  Color,
  DoubleSide,
  LatheGeometry,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  TubeGeometry,
  Vector2,
  Vector3,
  type BufferGeometry,
} from "three";
import { currentProfile, isLatheObject, type ObjectState } from "./ops";
import type { MeshId } from "./primitives";
import type { TubeParams } from "./primitives/params";
import type { RenderMaterial } from "./schema";

/**
 * Geometry for every non-lathe primitive. The mapped type makes a missing
 * entry a type error when a mesh primitive is added.
 */
export const MESH_GEOMETRY: { [K in MeshId]: (params: Readonly<Record<string, unknown>>) => BufferGeometry } = {
  tube(params) {
    const p = params as unknown as TubeParams;
    const curve = new CatmullRomCurve3(p.points.map(([x, y, z]) => new Vector3(x, y, z)));
    const segments = Math.max(16, p.points.length * 12);
    // Index order follows the path, so drawRange can reveal it from start to end.
    return new TubeGeometry(curve, segments, p.radius, 10, false);
  },
};

export function buildGeometry(o: Pick<ObjectState, "primitive" | "params" | "slice">, segments = 64): BufferGeometry {
  if (!isLatheObject(o)) return MESH_GEOMETRY[o.primitive as MeshId](o.params);
  const pts = currentProfile(o).map(([r, y]) => new Vector2(Math.max(r, 1e-4), y));
  const g = new LatheGeometry(pts, segments);
  g.computeVertexNormals();
  return g;
}

export type SceneMaterial = MeshStandardMaterial | MeshPhysicalMaterial;

/**
 * Materials start opaque: three's transmission pass (PET, glass) only shows
 * opaque objects behind it, so soil or a cap stays visible through a bottle.
 * The renderer switches `transparent` on only while an object fades.
 */
export function buildMaterial(preset: RenderMaterial["preset"]): SceneMaterial {
  const common = { side: DoubleSide, transparent: false } as const;
  switch (preset) {
    case "pet":
      return new MeshPhysicalMaterial({ ...common, roughness: 0.06, metalness: 0, transmission: 0.9, thickness: 0.35, ior: 1.57, clearcoat: 1, clearcoatRoughness: 0.05, attenuationColor: new Color("#bfe3ee"), attenuationDistance: 12 });
    case "glass":
      return new MeshPhysicalMaterial({ ...common, roughness: 0.02, metalness: 0, transmission: 0.96, thickness: 0.8, ior: 1.5, clearcoat: 1, attenuationColor: new Color("#d6eee4"), attenuationDistance: 8 });
    case "aluminium":
      return new MeshStandardMaterial({ ...common, metalness: 1, roughness: 0.28 });
    case "plastic":
      return new MeshPhysicalMaterial({ ...common, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.3 });
    case "water":
      return new MeshPhysicalMaterial({ ...common, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05 });
    case "paint":
      return new MeshStandardMaterial({ ...common, roughness: 0.55 });
    case "cardboard":
      return new MeshStandardMaterial({ ...common, roughness: 0.95 });
    case "fabric":
    case "soil":
      return new MeshStandardMaterial({ ...common, roughness: 1 });
    case "wood":
      return new MeshStandardMaterial({ ...common, roughness: 0.75 });
  }
}
