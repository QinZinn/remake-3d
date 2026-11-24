/**
 * three.js adapters: turn pure scene data into geometry and materials.
 * Only the renderer imports this file.
 */
import {
  Color,
  DoubleSide,
  LatheGeometry,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Vector2,
  type Material,
} from "three";
import { currentProfile, type ObjectState } from "./ops";
import type { RenderMaterial } from "./schema";

export function buildGeometry(o: Pick<ObjectState, "primitive" | "params" | "slice">, segments = 72): LatheGeometry {
  const pts = currentProfile(o as ObjectState).map(([r, y]) => new Vector2(Math.max(r, 1e-4), y));
  const g = new LatheGeometry(pts, segments);
  g.computeVertexNormals();
  return g;
}

export type SceneMaterial = MeshStandardMaterial | MeshPhysicalMaterial;

export function buildMaterial(preset: RenderMaterial["preset"]): SceneMaterial {
  const common = { side: DoubleSide, transparent: true } as const;
  switch (preset) {
    case "pet":
      return new MeshPhysicalMaterial({ ...common, roughness: 0.06, metalness: 0, transmission: 0.9, thickness: 0.35, ior: 1.57, clearcoat: 1, clearcoatRoughness: 0.05, attenuationColor: new Color("#bfe3ee"), attenuationDistance: 12 });
    case "glass":
      return new MeshPhysicalMaterial({ ...common, roughness: 0.02, metalness: 0, transmission: 0.96, thickness: 0.8, ior: 1.5, clearcoat: 1, attenuationColor: new Color("#d6eee4"), attenuationDistance: 8 });
    case "aluminium":
      return new MeshStandardMaterial({ ...common, metalness: 1, roughness: 0.28 });
    case "plastic":
      return new MeshPhysicalMaterial({ ...common, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.3 });
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

export function disposeMaterial(m: Material) {
  m.dispose();
}
