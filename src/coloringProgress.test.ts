import { describe, it, expect } from "vitest";
import { restoreColors } from "./coloringStorage";
describe("saved progress validation", () => {
  it("restores only a complete compatible palette", () => {
    const colors = ["#123456", "#FFFFFF"];
    expect(
      restoreColors({ revision: "current", colors }, "current", 2),
    ).toEqual(colors);
  });
  it("rejects stale geometry and malformed stored values", () => {
    for (const value of [
      null,
      {},
      { revision: "old", colors: ["#123456"] },
      { revision: "current", colors: null },
      { revision: "current", colors: "#123456" },
      { revision: "current", colors: ["red"] },
      { revision: "current", colors: ["#123456", "#ffffff"] },
      { revision: "current", colors: [123] },
    ])
      expect(restoreColors(value, "current", 1)).toBeNull();
  });
});
