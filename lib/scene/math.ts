/** Small pure helpers shared by ops and transitions (no three.js, no DOM). */
export type V3 = [number, number, number];

export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
export const lerp3 = (a: readonly number[], b: readonly number[], t: number): V3 => [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
export const add3 = (a: readonly number[], b: readonly number[]): V3 => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
export const clamp01 = (t: number) => Math.min(1, Math.max(0, t));
export const easeInOut = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);

const DEG = Math.PI / 180;

/** Rotate v by an XYZ Euler in degrees (same convention as three.js `Euler('XYZ')`). */
export function rotate3(v: readonly number[], eulerDeg: readonly number[]): V3 {
  const [x, y, z] = eulerDeg.map((d) => d * DEG);
  let [a, b, c] = v;
  // R = Rx * Ry * Rz, so apply Rz first.
  [a, b] = [a * Math.cos(z) - b * Math.sin(z), a * Math.sin(z) + b * Math.cos(z)];
  [a, c] = [a * Math.cos(y) + c * Math.sin(y), -a * Math.sin(y) + c * Math.cos(y)];
  [b, c] = [b * Math.cos(x) - c * Math.sin(x), b * Math.sin(x) + c * Math.cos(x)];
  return [a, b, c];
}

function hexToRgb(hex: string): V3 {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHex([r, g, b]: readonly number[]): string {
  const h = (v: number) => Math.round(Math.min(255, Math.max(0, v))).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

export function lerpColor(a: string, b: string, t: number): string {
  if (a.toLowerCase() === b.toLowerCase()) return a;
  return rgbToHex(lerp3(hexToRgb(a), hexToRgb(b), t));
}

/** Row-major 3×3 matrix. */
export type M3 = [number, number, number, number, number, number, number, number, number];

/** Rotation matrix of an XYZ Euler in degrees (three.js convention, R = Rx·Ry·Rz). */
export function eulerToMat(e: readonly number[]): M3 {
  const [x, y, z] = e.map((d) => d * DEG);
  const a = Math.cos(x), b = Math.sin(x);
  const c = Math.cos(y), d = Math.sin(y);
  const ee = Math.cos(z), f = Math.sin(z);
  return [
    c * ee, -c * f, d,
    a * f + b * ee * d, a * ee - b * f * d, -b * c,
    b * f - a * ee * d, b * ee + a * f * d, a * c,
  ];
}

/** XYZ Euler in degrees from a rotation matrix (three.js `setFromRotationMatrix`). */
export function matToEuler(m: M3): V3 {
  const y = Math.asin(Math.min(1, Math.max(-1, m[2])));
  let x: number, z: number;
  if (Math.abs(m[2]) < 0.9999999) {
    x = Math.atan2(-m[5], m[8]);
    z = Math.atan2(-m[1], m[0]);
  } else {
    x = Math.atan2(m[7], m[4]);
    z = 0;
  }
  const r = (v: number) => {
    const deg = v / DEG;
    return Math.abs(deg) < 1e-9 ? 0 : deg;
  };
  return [r(x), r(y), r(z)];
}

export function mulMat(a: M3, b: M3): M3 {
  const o = new Array(9).fill(0) as M3;
  for (let i = 0; i < 3; i++) for (let j = 0; j < 3; j++) for (let k = 0; k < 3; k++) o[i * 3 + j] += a[i * 3 + k] * b[k * 3 + j];
  return o;
}

export function mulMatVec(m: M3, v: readonly number[]): V3 {
  return [m[0] * v[0] + m[1] * v[1] + m[2] * v[2], m[3] * v[0] + m[4] * v[1] + m[5] * v[2], m[6] * v[0] + m[7] * v[1] + m[8] * v[2]];
}
