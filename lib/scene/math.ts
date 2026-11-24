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
