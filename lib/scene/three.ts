/**
 * three.js adapters: turn pure scene data into geometry and materials.
 * Only the renderer imports this file.
 */
import {
  BoxGeometry,
  CanvasTexture,
  CatmullRomCurve3,
  Color,
  DoubleSide,
  ExtrudeGeometry,
  LatheGeometry,
  MeshPhysicalMaterial,
  MeshStandardMaterial,
  Path,
  RepeatWrapping,
  Shape,
  SRGBColorSpace,
  TubeGeometry,
  Vector2,
  Vector3,
  type BufferGeometry,
} from "three";
import { currentProfile, isLatheObject, type ObjectState } from "./ops";
import type { LatheId, MeshId, ProfilePoint } from "./primitives";
import { sampleExtrudeContour } from "./primitives/extrude";
import type { BoxParams, ExtrudeParams, TubeParams } from "./primitives/params";
import type { RenderMaterial } from "./schema";

// ---------------------------------------------------------------- geometry

function traceContour(target: Shape | Path, pts: readonly (readonly [number, number])[], curve: boolean) {
  const sampled = sampleExtrudeContour(pts, curve);
  target.moveTo(sampled[0][0], sampled[0][1]);
  for (let i = 1; i < sampled.length; i++) target.lineTo(sampled[i][0], sampled[i][1]);
  target.closePath();
}

/**
 * Geometry for every non-lathe primitive. The mapped type makes a missing
 * entry a type error when a mesh primitive is added.
 */
export const MESH_GEOMETRY: { [K in MeshId]: (params: Readonly<Record<string, unknown>>) => BufferGeometry } = {
  box(params) {
    const { width, height, depth } = params as unknown as BoxParams;
    return new BoxGeometry(width, height, depth).translate(0, height / 2, 0);
  },
  tube(params) {
    const p = params as unknown as TubeParams;
    const curve = new CatmullRomCurve3(p.points.map(([x, y, z]) => new Vector3(x, y, z)));
    const segments = Math.max(16, p.points.length * 12);
    // Index order follows the path, so drawRange can reveal it from start to end.
    return new TubeGeometry(curve, segments, p.radius, 12, false);
  },
  extrude(params) {
    const p = params as unknown as ExtrudeParams;
    const shape = new Shape();
    traceContour(shape, p.points, p.curve);
    for (const holePts of p.holes) {
      const hole = new Path();
      traceContour(hole, holePts, p.curve);
      shape.holes.push(hole);
    }
    const g = new ExtrudeGeometry(shape, {
      depth: p.depth,
      bevelEnabled: p.bevel > 0,
      bevelThickness: p.bevel,
      bevelSize: p.bevel,
      bevelSegments: p.bevel > 0 ? 3 : 0,
      curveSegments: 20,
    });
    g.translate(0, 0, -p.depth / 2);
    // Normalise world-cm UVs so procedural micro-textures match Box/Lathe scale.
    const uv = g.attributes.uv;
    if (uv) {
      for (let i = 0; i < uv.count; i++) {
        uv.setXY(i, uv.getX(i) / 18, uv.getY(i) / 18);
      }
      uv.needsUpdate = true;
    }
    g.computeVertexNormals();
    return g;
  },
};

/** Nominal wall thickness (cm) for hollow lathe shells; `solid` stays a filled solid. */
const WALL_THICKNESS: Partial<Record<LatheId, number>> = {
  bottle: 0.14,
  jar: 0.2,
  can: 0.1,
  cap: 0.08,
  sleeve: 0.04,
};

/**
 * Turn a monotonically rising outer profile into a watertight double-walled
 * lathe shell so open mouths, cut rims, glass walls and caps read with real
 * thickness instead of paper-thin single faces.
 */
function thickenLatheProfile(pts: readonly ProfilePoint[], primitive: LatheId): Vector2[] {
  const nominal = WALL_THICKNESS[primitive];
  if (!nominal || pts.length < 2) {
    return pts.map(([r, y]) => new Vector2(Math.max(r, 1e-4), y));
  }

  let minPosR = Infinity;
  for (const [r] of pts) if (r > 1e-3 && r < minPosR) minPosR = r;
  if (!Number.isFinite(minPosR)) return pts.map(([r, y]) => new Vector2(Math.max(r, 1e-4), y));

  const yMin = pts[0][1];
  const yMax = pts[pts.length - 1][1];
  const spanY = yMax - yMin;
  if (spanY < 0.05) return pts.map(([r, y]) => new Vector2(Math.max(r, 1e-4), y));

  const wall = Math.min(nominal, minPosR * 0.42, spanY * 0.25);
  const closedBottom = pts[0][0] <= 1e-4;
  const closedTop = pts[pts.length - 1][0] <= 1e-4;

  const out: Vector2[] = [];
  const push = (r: number, y: number) => {
    const cr = Math.max(r, 1e-4);
    const last = out[out.length - 1];
    if (!last || Math.hypot(last.x - cr, last.y - y) > 1e-5) out.push(new Vector2(cr, y));
  };

  // 1. Outer wall bottom -> top.
  for (const [r, y] of pts) push(r, y);

  // 2. Top rim or inner ceiling.
  if (closedTop) {
    const innerTopY = yMax - wall;
    push(1e-4, innerTopY);
    for (let i = pts.length - 1; i >= 0; i--) {
      const [r, y] = pts[i];
      if (y < innerTopY - 1e-4 && r > wall) push(r - wall, y);
    }
    // Close bottom skirt rim.
    const [r0, y0] = pts[0];
    if (!closedBottom) {
      push(Math.max(1e-4, r0 - wall), y0);
      push(r0 - wall * 0.5, y0 - wall * 0.08);
      push(r0, y0);
    }
    return out;
  }

  // Open top: subtle light-catching bevel across the rim into the inner wall.
  const [rTop] = pts[pts.length - 1];
  const innerTopR = Math.max(1e-4, rTop - wall);
  push(rTop - wall * 0.25, yMax + wall * 0.1);
  push(rTop - wall * 0.75, yMax + wall * 0.1);
  push(innerTopR, yMax);

  // 3. Inner wall top -> bottom.
  if (closedBottom) {
    const baseThick = primitive === "jar" || primitive === "bottle" ? Math.min(wall * 1.9, spanY * 0.25) : Math.min(wall * 1.15, spanY * 0.2);
    const floorY = yMin + baseThick;
    let lastInnerR = innerTopR;
    for (let i = pts.length - 2; i >= 0; i--) {
      const [r, y] = pts[i];
      if (y <= floorY + 1e-4) {
        const [rNext, yNext] = pts[i + 1];
        const t = yNext > y ? (floorY - y) / (yNext - y) : 0;
        const rFloor = Math.max(1e-4, r + (rNext - r) * t - wall);
        push(rFloor, floorY);
        lastInnerR = rFloor;
        break;
      }
      const ir = Math.max(1e-4, r - wall);
      push(ir, y);
      lastInnerR = ir;
    }
    if (lastInnerR > 1e-3) push(lastInnerR * 0.5, floorY);
    push(1e-4, floorY);
    return out;
  }

  // Open at both ends (e.g. cut bottle top or label sleeve).
  for (let i = pts.length - 2; i >= 0; i--) {
    const [r, y] = pts[i];
    push(Math.max(1e-4, r - wall), y);
  }
  const [r0, y0] = pts[0];
  push(r0 - wall * 0.75, y0 - wall * 0.06);
  push(r0 - wall * 0.25, y0 - wall * 0.06);
  push(r0, y0);
  return out;
}

export function buildGeometry(o: Pick<ObjectState, "primitive" | "params" | "slice">, segments = 64): BufferGeometry {
  if (!isLatheObject(o)) return MESH_GEOMETRY[o.primitive as MeshId](o.params);
  const pts = thickenLatheProfile(currentProfile(o), o.primitive as LatheId);
  const g = new LatheGeometry(pts, segments);
  g.computeVertexNormals();
  return g;
}

// ---------------------------------------------------------------- procedural textures

function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface TexturePack {
  bump?: CanvasTexture;
  map?: CanvasTexture;
  roughness?: CanvasTexture;
}

const textureCache = new Map<string, TexturePack>();

function makeCanvasTexture(
  size: number,
  repeat: [number, number],
  draw: (ctx: CanvasRenderingContext2D, size: number) => void,
  srgb = false,
): CanvasTexture | undefined {
  if (typeof document === "undefined") return undefined;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;
  draw(ctx, size);
  const tex = new CanvasTexture(canvas);
  tex.wrapS = RepeatWrapping;
  tex.wrapT = RepeatWrapping;
  tex.repeat.set(repeat[0], repeat[1]);
  if (srgb) tex.colorSpace = SRGBColorSpace;
  tex.needsUpdate = true;
  return tex;
}

function getTexturePack(preset: RenderMaterial["preset"]): TexturePack {
  const cached = textureCache.get(preset);
  if (cached) return cached;

  const pack: TexturePack = {};
  if (preset === "fabric") {
    // Soft woven cotton jersey knit crosshatch.
    pack.bump = makeCanvasTexture(128, [6, 6], (ctx, s) => {
      const rand = mulberry32(101);
      ctx.fillStyle = "#808080";
      ctx.fillRect(0, 0, s, s);
      for (let y = 0; y < s; y += 4) {
        for (let x = 0; x < s; x += 4) {
          const rib = ((x + y) / 4) % 2 === 0 ? 155 : 108;
          const jitter = Math.round((rand() - 0.5) * 20);
          const v = Math.max(40, Math.min(220, rib + jitter));
          ctx.fillStyle = `rgb(${v},${v},${v})`;
          ctx.fillRect(x, y, 3, 2);
          ctx.fillRect((x + 2) % s, (y + 2) % s, 2, 2);
        }
      }
    });
  } else if (preset === "cardboard") {
    // Kraft paperboard fibers with subtle flute lines.
    pack.bump = makeCanvasTexture(128, [4, 4], (ctx, s) => {
      const rand = mulberry32(202);
      ctx.fillStyle = "#808080";
      ctx.fillRect(0, 0, s, s);
      // Faint parallel flute shading.
      for (let x = 0; x < s; x++) {
        const wave = Math.round(128 + Math.sin((x / s) * Math.PI * 16) * 14);
        ctx.fillStyle = `rgb(${wave},${wave},${wave})`;
        ctx.fillRect(x, 0, 1, s);
      }
      // Paper fibers.
      for (let i = 0; i < 650; i++) {
        const v = Math.round(100 + rand() * 55);
        ctx.fillStyle = `rgba(${v},${v},${v},0.45)`;
        ctx.fillRect(rand() * s, rand() * s, 2 + rand() * 8, 1);
      }
    });
  } else if (preset === "soil") {
    // Organic granular potting mix (clumps + perlite flecks).
    pack.bump = makeCanvasTexture(128, [3, 3], (ctx, s) => {
      const rand = mulberry32(303);
      ctx.fillStyle = "#707070";
      ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 900; i++) {
        const x = rand() * s;
        const y = rand() * s;
        const r = 1 + rand() * 3.5;
        const v = Math.round(45 + rand() * 175);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.beginPath();
        ctx.arc(x, y, r, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    pack.map = makeCanvasTexture(
      128,
      [3, 3],
      (ctx, s) => {
        const rand = mulberry32(304);
        ctx.fillStyle = "#e6e0d8";
        ctx.fillRect(0, 0, s, s);
        for (let i = 0; i < 700; i++) {
          const x = rand() * s;
          const y = rand() * s;
          const r = 1 + rand() * 3;
          const dark = rand() > 0.14;
          ctx.fillStyle = dark ? `rgba(110,95,82,${0.25 + rand() * 0.35})` : "rgba(248,244,234,0.65)";
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      },
      true,
    );
  } else if (preset === "wood") {
    pack.bump = makeCanvasTexture(128, [3, 3], (ctx, s) => {
      const rand = mulberry32(404);
      ctx.fillStyle = "#808080";
      ctx.fillRect(0, 0, s, s);
      for (let y = 0; y < s; y++) {
        const v = Math.round(128 + Math.sin(y * 0.45) * 16 + (rand() - 0.5) * 14);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(0, y, s, 1);
      }
    });
  } else if (preset === "aluminium") {
    // Fine horizontal brushed metal grain so metallic surfaces read bright and crisp.
    pack.roughness = makeCanvasTexture(128, [3, 3], (ctx, s) => {
      const rand = mulberry32(505);
      ctx.fillStyle = "#4c4c4c";
      ctx.fillRect(0, 0, s, s);
      for (let y = 0; y < s; y++) {
        const v = Math.round(62 + rand() * 32);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(0, y, s, 1);
      }
    });
  } else if (preset === "paint") {
    // Subtle eggshell brush micro-texture.
    pack.bump = makeCanvasTexture(128, [4, 4], (ctx, s) => {
      const rand = mulberry32(606);
      ctx.fillStyle = "#808080";
      ctx.fillRect(0, 0, s, s);
      for (let i = 0; i < 600; i++) {
        const v = Math.round(115 + rand() * 26);
        ctx.fillStyle = `rgba(${v},${v},${v},0.45)`;
        ctx.fillRect(rand() * s, rand() * s, 2, 2);
      }
    });
  } else if (preset === "water") {
    // Gentle concentric water ripple bump.
    pack.bump = makeCanvasTexture(128, [2, 2], (ctx, s) => {
      ctx.fillStyle = "#808080";
      ctx.fillRect(0, 0, s, s);
      for (let y = 0; y < s; y += 2) {
        for (let x = 0; x < s; x += 2) {
          const w = Math.sin((x / s) * Math.PI * 6) * Math.cos((y / s) * Math.PI * 6);
          const v = Math.round(128 + w * 24);
          ctx.fillStyle = `rgb(${v},${v},${v})`;
          ctx.fillRect(x, y, 2, 2);
        }
      }
    });
  }

  textureCache.set(preset, pack);
  return pack;
}

// ---------------------------------------------------------------- materials

export type SceneMaterial = MeshStandardMaterial | MeshPhysicalMaterial;

/**
 * Materials start opaque: three's transmission pass (PET, glass) only shows
 * opaque objects behind it, so soil, hardware or a wick stays visible through
 * a bottle or jar. The renderer switches `transparent` on only while fading.
 */
export function buildMaterial(preset: RenderMaterial["preset"]): SceneMaterial {
  const common = { side: DoubleSide, transparent: false } as const;
  const tex = getTexturePack(preset);
  switch (preset) {
    case "pet":
      return new MeshPhysicalMaterial({
        ...common,
        roughness: 0.05,
        metalness: 0,
        transmission: 0.92,
        thickness: 0.34,
        ior: 1.54,
        clearcoat: 1,
        clearcoatRoughness: 0.04,
        envMapIntensity: 1.25,
        attenuationColor: new Color("#ccecf7"),
        attenuationDistance: 14,
      });
    case "glass":
      return new MeshPhysicalMaterial({
        ...common,
        roughness: 0.02,
        metalness: 0,
        transmission: 0.95,
        thickness: 0.75,
        ior: 1.52,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
        envMapIntensity: 1.35,
        attenuationColor: new Color("#d8f0e6"),
        attenuationDistance: 9.5,
      });
    case "aluminium":
      return new MeshStandardMaterial({
        ...common,
        metalness: 0.84,
        roughness: 0.28,
        roughnessMap: tex.roughness,
        envMapIntensity: 1.35,
      });
    case "plastic":
      return new MeshPhysicalMaterial({
        ...common,
        roughness: 0.3,
        clearcoat: 0.58,
        clearcoatRoughness: 0.24,
        envMapIntensity: 1.1,
      });
    case "water":
      return new MeshPhysicalMaterial({
        ...common,
        roughness: 0.04,
        metalness: 0.06,
        clearcoat: 1,
        clearcoatRoughness: 0.02,
        envMapIntensity: 1.3,
        bumpMap: tex.bump,
        bumpScale: 0.025,
      });
    case "paint":
      return new MeshPhysicalMaterial({
        ...common,
        roughness: 0.5,
        clearcoat: 0.14,
        clearcoatRoughness: 0.45,
        bumpMap: tex.bump,
        bumpScale: 0.02,
      });
    case "cardboard":
      return new MeshStandardMaterial({
        ...common,
        roughness: 0.92,
        metalness: 0,
        bumpMap: tex.bump,
        bumpScale: 0.055,
      });
    case "fabric":
      return new MeshPhysicalMaterial({
        ...common,
        roughness: 0.92,
        metalness: 0,
        sheen: 0.16,
        sheenRoughness: 0.88,
        sheenColor: new Color("#e6f0ee"),
        bumpMap: tex.bump,
        bumpScale: 0.08,
      });
    case "soil":
      return new MeshStandardMaterial({
        ...common,
        roughness: 0.98,
        metalness: 0,
        bumpMap: tex.bump,
        bumpScale: 0.2,
      });
    case "wood":
      return new MeshStandardMaterial({
        ...common,
        roughness: 0.72,
        metalness: 0,
        bumpMap: tex.bump,
        bumpScale: 0.045,
      });
  }
}
