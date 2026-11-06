/** Raster geometry stays independent of paint, so recolouring cannot leak across contours. */
export type RegionMap = {
  labels: Int32Array;
  sizes: number[];
  seeds: number[];
  width: number;
  height: number;
};
export function makeRegions(
  ink: Uint8ClampedArray,
  width: number,
  height: number,
): RegionMap {
  const count = width * height,
    labels = new Int32Array(count),
    queue = new Int32Array(count);
  labels.fill(-1);
  for (let p = 0; p < count; p++)
    if (
      ink[p * 4 + 3] > 40 &&
      (ink[p * 4] + ink[p * 4 + 1] + ink[p * 4 + 2]) / 3 < 210
    )
      labels[p] = -2;
  const sizes: number[] = [],
    seeds: number[] = [];
  for (let p = 0; p < count; p++) {
    if (labels[p] !== -1) continue;
    const id = sizes.length;
    let head = 0,
      tail = 1;
    queue[0] = p;
    labels[p] = id;
    seeds.push(p);
    while (head < tail) {
      const n = queue[head++],
        x = n % width;
      if (x > 0 && labels[n - 1] === -1) {
        labels[n - 1] = id;
        queue[tail++] = n - 1;
      }
      if (x < width - 1 && labels[n + 1] === -1) {
        labels[n + 1] = id;
        queue[tail++] = n + 1;
      }
      if (n >= width && labels[n - width] === -1) {
        labels[n - width] = id;
        queue[tail++] = n - width;
      }
      if (n + width < count && labels[n + width] === -1) {
        labels[n + width] = id;
        queue[tail++] = n + width;
      }
    }
    sizes.push(tail);
  }
  return { labels, sizes, seeds, width, height };
}
export function findRegion(
  map: RegionMap,
  x: number,
  y: number,
  radius = 0,
): number {
  x = Math.max(0, Math.min(map.width - 1, Math.floor(x)));
  y = Math.max(0, Math.min(map.height - 1, Math.floor(y)));
  const direct = map.labels[y * map.width + x];
  if (direct >= 0) return direct;
  for (let r = 1; r <= radius; r++)
    for (
      let yy = Math.max(0, y - r);
      yy <= Math.min(map.height - 1, y + r);
      yy++
    )
      for (
        let xx = Math.max(0, x - r);
        xx <= Math.min(map.width - 1, x + r);
        xx++
      ) {
        const id = map.labels[yy * map.width + xx];
        if (id >= 0 && map.sizes[id] >= 12) return id;
      }
  return -1;
}
export function paintRegions(
  pixels: Uint8ClampedArray,
  map: RegionMap,
  colors: readonly string[],
): void {
  const rgb = colors.map((hex) =>
    [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)),
  );
  for (let p = 0; p < map.labels.length; p++) {
    const color = rgb[map.labels[p]];
    const i = p * 4;
    pixels[i] = color?.[0] ?? 255;
    pixels[i + 1] = color?.[1] ?? 255;
    pixels[i + 2] = color?.[2] ?? 255;
    pixels[i + 3] = 255;
  }
}
/** Preserve original anti-aliased ink and make white/transparent SVG backgrounds transparent. */
export function transparentInk(pixels: Uint8ClampedArray): void {
  for (let i = 0; i < pixels.length; i += 4) {
    const darkness = 255 - Math.min(pixels[i], pixels[i + 1], pixels[i + 2]);
    pixels[i + 3] = Math.round((pixels[i + 3] * darkness) / 255);
    pixels[i] = pixels[i + 1] = pixels[i + 2] = 0;
  }
}
