import { describe, it, expect } from "vitest";
import {
  makeRegions,
  findRegion,
  paintRegions,
  transparentInk,
} from "./coloringEngine";
function fixture(lines: string[]) {
  const pixels = new Uint8ClampedArray(lines.length * lines[0].length * 4);
  lines
    .join("")
    .split("")
    .forEach((c, p) => {
      pixels.set(c === "#" ? [0, 0, 0, 255] : [255, 255, 255, 255], p * 4);
    });
  return { pixels, map: makeRegions(pixels, lines[0].length, lines.length) };
}
describe("colouring geometry", () => {
  it("keeps neighbouring enclosed areas separate when recolouring", () => {
    const { pixels, map } = fixture([
      "#######",
      "#..#..#",
      "#..#..#",
      "#######",
    ]);
    expect(map.sizes).toEqual([4, 4]);
    paintRegions(pixels, map, ["#ff0000", "#00ff00"]);
    expect([...pixels.slice((1 * 7 + 1) * 4, (1 * 7 + 1) * 4 + 3)]).toEqual([
      255, 0, 0,
    ]);
    expect([...pixels.slice((1 * 7 + 4) * 4, (1 * 7 + 4) * 4 + 3)]).toEqual([
      0, 255, 0,
    ]);
    paintRegions(pixels, map, ["#0000ff", "#00ff00"]);
    expect(pixels[(1 * 7 + 4) * 4 + 1]).toBe(255);
  });
  it("does not wrap between scanlines or connect diagonally", () => {
    const { map } = fixture(["#.#", ".#."]);
    expect(map.sizes).toEqual([1, 1, 1]);
    expect(findRegion(map, 0, 0)).toBe(-1);
    expect(findRegion(map, 100, 100)).toBe(2);
  });
  it("treats transparency as paintable and dark antialiasing as a boundary", () => {
    const pixels = new Uint8ClampedArray([
      0, 0, 0, 0, 100, 100, 100, 255, 255, 255, 255, 255,
    ]);
    const map = makeRegions(pixels, 3, 1);
    expect([...map.labels]).toEqual([0, -2, 1]);
  });
  it("removes white SVG fill while retaining antialiased lines", () => {
    const pixels = new Uint8ClampedArray([
      255, 255, 255, 255, 0, 0, 0, 255, 128, 128, 128, 255,
    ]);
    transparentInk(pixels);
    expect([...pixels]).toEqual([0, 0, 0, 0, 0, 0, 0, 255, 0, 0, 0, 127]);
  });
  it("segments a maximum size empty page with bounded buffers", () => {
    const map = makeRegions(new Uint8ClampedArray(850 * 850 * 4), 850, 850);
    expect(map.sizes).toEqual([850 * 850]);
    expect(map.labels.byteLength).toBe(850 * 850 * 4);
  });
});
