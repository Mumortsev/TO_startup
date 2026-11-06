import { describe, it, expect } from "vitest";
import {
  decodeLegacyPng,
  parseLegacyArtwork,
  migrateLegacyColors,
} from "./legacyColoring";
import type { RegionMap } from "./coloringEngine";
function png(width = 850, height = 850) {
  const b = new Uint8Array(24);
  b.set([137, 80, 78, 71, 13, 10, 26, 10]);
  const view = new DataView(b.buffer);
  view.setUint32(16, width);
  view.setUint32(20, height);
  return "data:image/png;base64," + btoa(String.fromCharCode(...b));
}
function regions(width: number, height: number): RegionMap {
  return {
    width,
    height,
    labels: new Int32Array([0, 1]),
    sizes: [1, 1],
    seeds: [0, 1],
  };
}
function split() {
  const pixels = new Uint8ClampedArray(850 * 850 * 4);
  for (let y = 0; y < 850; y++)
    for (let x = 0; x < 850; x++)
      pixels.set(
        x < 425 ? [255, 0, 0, 255] : [0, 0, 255, 255],
        (y * 850 + x) * 4,
      );
  return pixels;
}
describe("legacy artwork migration", () => {
  it("accepts bounded old canvases and rejects external URLs, wrong dimensions and corrupt data", () => {
    expect(decodeLegacyPng(png())).toBeInstanceOf(Blob);
    for (const value of [
      null,
      {},
      "https://example.com/a.png",
      "data:image/svg+xml;base64,AA==",
      png(100000, 850),
      "data:image/png;base64,broken",
    ])
      expect(decodeLegacyPng(value)).toBeNull();
  });
  it("skips malformed records independently and validates identifiers", () => {
    expect(
      parseLegacyArtwork(
        JSON.stringify({ alpaca: png(), "../outside": png(), broken: "bad" }),
        123,
      ).map((p) => ({ id: p.id, updated: p.updated })),
    ).toEqual([{ id: "alpaca", updated: 123 }]);
    for (const value of [null, "invalid", "[]", "null", "42"])
      expect(parseLegacyArtwork(value)).toEqual([]);
  });
  it("maps old colours to the new canvas inset without mixing adjacent areas", () => {
    expect(migrateLegacyColors(split(), regions(2, 1))).toEqual([
      "#ff0000",
      "#0000ff",
    ]);
  });
  it("restores rotated original artwork with the inverse coordinate transform", () => {
    expect(migrateLegacyColors(split(), regions(1, 2), true)).toEqual([
      "#0000ff",
      "#ff0000",
    ]);
  });
  it("composites transparent pixels on paper and ignores outline pixels", () => {
    const map = {
      width: 2,
      height: 1,
      labels: new Int32Array([-2, 0]),
      sizes: [1],
      seeds: [1],
    };
    expect(
      migrateLegacyColors(new Uint8ClampedArray(850 * 850 * 4), map),
    ).toEqual(["#ffffff"]);
  });
  it("refuses unbounded or unexpected image buffers", () => {
    expect(() =>
      migrateLegacyColors(new Uint8ClampedArray(12), regions(2, 1)),
    ).toThrow("Unexpected legacy canvas size");
  });
});
