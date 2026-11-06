import { describe, it, expect } from "vitest";
import { ru } from "../scripts/music-ru";
import { translateMusicLabel } from "../scripts/music-labels";

describe("Russian musical interface", () => {
  it("keeps file names and counts in useful translated feedback", () => {
    expect(ru.files.imported("Мой проект.json")).toBe(
      "Проект «Мой проект.json» открыт",
    );
    expect(ru.files.projSummary(3, 8, 120)).toBe(
      "Паттернов: 3, каналов: 8, темп: 120 уд/мин",
    );
    expect(ru.files.exportOk("12.5", "2.1", "0.8")).toContain("12.5 с, 2.1 МБ");
    expect(
      ru.patternManager.deleteConfirm("Ритм", " и связанные фрагменты"),
    ).toContain("«Ритм» и связанные фрагменты");
  });
  it("uses count labels that remain grammatical for one, two and five items", () => {
    for (const n of [1, 2, 5, 21])
      expect(ru.modules.statNotes(n)).toBe(`Нот: ${n}`);
    expect(ru.song.barsUnit(1)).toBe("(тактов: 1)");
  });
  it("preserves custom project text and original language display", () => {
    for (const name of [
      "My bass arrangement",
      "Pattern for a rainy day",
      "Летняя мелодия",
      "Track 1 live",
    ])
      expect(translateMusicLabel(name)).toBe(name);
    expect(translateMusicLabel("Kick", "en")).toBe("Kick");
    expect(translateMusicLabel("Kick", "zh")).toBe("Kick");
    expect(translateMusicLabel("Pattern 12")).toBe("Паттерн 12");
  });
  it("translates built-in timbres, compound instrumentation and generated theory", () => {
    expect(ru.label("Lead · Saw Lead")).toBe(
      "Мелодия · Пилообразный соло-тембр",
    );
    expect(ru.label("C 大调")).toBe("C Мажор");
    expect(ru.label("正格终止 V → I")).toBe("Автентическая каденция V → I");
    expect(ru.label("FX unknown")).toBe("FX unknown");
  });
  it("provides eight distinct musical destinations and fourteen effect names", () => {
    expect(Object.values(ru.modules.name)).toHaveLength(8);
    expect(new Set(Object.values(ru.modules.name)).size).toBe(8);
    expect(Object.keys(ru.fx.name)).toHaveLength(14);
  });
});
