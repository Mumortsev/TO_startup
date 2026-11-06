import type { RegionMap } from "./coloringEngine";
export const LEGACY_STORAGE_KEY = "rybka-coloring-v2";
export const ROTATED_LEGACY_PAGES = new Set([
  "camel",
  "dove",
  "s_s_edmund_fitzgerald",
  "trees",
  "juice_and_cake",
]);
export type LegacyArtwork = { id: string; image: Blob; updated: number };
const MAX_PNG_BYTES = 6 * 1024 * 1024;
/** Accept only the old app's bounded 850px PNG canvases, never URLs or arbitrary files. */
export function decodeLegacyPng(value: unknown): Blob | null {
  if (
    typeof value !== "string" ||
    !value.startsWith("data:image/png;base64,") ||
    value.length > (MAX_PNG_BYTES * 4) / 3 + 32
  )
    return null;
  try {
    const raw = atob(value.slice(22));
    if (raw.length < 24 || raw.length > MAX_PNG_BYTES) return null;
    const bytes = Uint8Array.from(raw, (c) => c.charCodeAt(0));
    if ([137, 80, 78, 71, 13, 10, 26, 10].some((byte, i) => bytes[i] !== byte))
      return null;
    const view = new DataView(bytes.buffer);
    if (view.getUint32(16) !== 850 || view.getUint32(20) !== 850) return null;
    return new Blob([bytes], { type: "image/png" });
  } catch {
    return null;
  }
}
export function parseLegacyArtwork(
  raw: string | null,
  updated = Date.now(),
): LegacyArtwork[] {
  if (!raw || raw.length > 8 * 1024 * 1024) return [];
  try {
    const data: unknown = JSON.parse(raw);
    if (!data || typeof data !== "object" || Array.isArray(data)) return [];
    const results: LegacyArtwork[] = [];
    for (const [id, value] of Object.entries(data).slice(0, 128)) {
      if (!/^[a-z0-9_]{1,80}$/.test(id)) continue;
      const image = decodeLegacyPng(value);
      if (image) results.push({ id, image, updated });
    }
    return results;
  } catch {
    return [];
  }
}
/** Map the old 42px inset and original orientation into the new 36px inset.
 * Each new region takes the dominant original colour; its contours stay independent.
 */
export function migrateLegacyColors(
  pixels: Uint8ClampedArray,
  map: RegionMap,
  rotated = false,
): string[] {
  if (pixels.length !== 850 * 850 * 4)
    throw new Error("Unexpected legacy canvas size");
  const histograms = map.sizes.map(() => new Map<number, number>()),
    ratio = 808 / 814;
  for (let p = 0; p < map.labels.length; p++) {
    const region = map.labels[p];
    if (region < 0) continue;
    const dx = (((p % map.width) + 0.5) * 850) / map.width - 425,
      dy = ((Math.floor(p / map.width) + 0.5) * 850) / map.height - 425;
    const x = Math.max(
      0,
      Math.min(849, Math.floor(425 + (rotated ? -dy : dx) * ratio)),
    );
    const y = Math.max(
      0,
      Math.min(849, Math.floor(425 + (rotated ? dx : dy) * ratio)),
    );
    const i = (y * 850 + x) * 4,
      alpha = pixels[i + 3] / 255;
    const rgb = [0, 1, 2].map((c) =>
      Math.round(pixels[i + c] * alpha + 255 * (1 - alpha)),
    );
    const key = (rgb[0] << 16) | (rgb[1] << 8) | rgb[2],
      histogram = histograms[region];
    histogram.set(key, (histogram.get(key) || 0) + 1);
  }
  return histograms.map((histogram) => {
    let best = 0xffffff,
      count = 0;
    for (const [rgb, n] of histogram)
      if (n > count) {
        best = rgb;
        count = n;
      }
    return "#" + best.toString(16).padStart(6, "0");
  });
}
export async function loadLegacyImage(blob: Blob): Promise<HTMLImageElement> {
  const url = URL.createObjectURL(blob),
    image = new Image();
  try {
    image.src = url;
    await image.decode();
    if (image.naturalWidth !== 850 || image.naturalHeight !== 850)
      throw new Error("Unexpected legacy canvas");
    return image;
  } finally {
    URL.revokeObjectURL(url);
  }
}
