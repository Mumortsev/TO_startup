import { describe, it, expect } from "vitest";
import { art, music, contact } from "./data";
describe("Studio content integrity", () => {
  it("has verified contact data", () => {
    expect(contact.tel).toBe("+79881459419");
    expect(contact.vk).toMatch(/^https:\/\/vk\.ru\//);
  });
  it("contains art directions and music instruments", () => {
    expect(art.length).toBeGreaterThanOrEqual(4);
    expect(music.map((x) => x.title)).toEqual(
      expect.arrayContaining(["Гитара", "Бас-гитара", "Барабаны"]),
    );
  });
  it("all cards have meaningful content", () => {
    for (const item of [...art, ...music]) {
      expect(item.title.trim().length).toBeGreaterThan(2);
      expect(item.desc.trim().length).toBeGreaterThan(10);
      expect(item.img).toMatch(/^\/TO_startup\/images\//);
    }
  });
});
