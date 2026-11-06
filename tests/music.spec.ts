import { test, expect } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("NeonDAW edits a step, persists it, plays, and exports JSON and real WAV", async ({
  page,
}) => {
  test.setTimeout(90000);
  const browserErrors: string[] = [];
  const failedAssets: string[] = [];
  page.on("pageerror", (error) => browserErrors.push(error.message));
  page.on("response", (response) => {
    if (response.url().includes("/engines/music/") && response.status() >= 400)
      failedAssets.push(response.url());
  });
  await page.goto("./music/studio");
  const engine = page.frameLocator('iframe[title*="NeonDAW"]');
  await expect(
    engine.getByRole("button", {
      name: "Открыть: Ритм-секвенсор",
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.locator(".engine-state")).toHaveCount(0);
  await engine
    .getByRole("button", { name: "Открыть: Ритм-секвенсор", exact: true })
    .click();
  const firstStep = engine.locator("[data-cell]").first();
  await expect(firstStep).toBeVisible();
  const before = await firstStep.getAttribute("style");
  await firstStep.click();
  await expect(firstStep).not.toHaveAttribute("style", before!);
  const after = await firstStep.getAttribute("style");
  const pressed = await firstStep.getAttribute("aria-pressed");
  await firstStep.press("Enter");
  await expect(firstStep).not.toHaveAttribute("aria-pressed", pressed!);
  await firstStep.press("Space");
  await expect(firstStep).toHaveAttribute("aria-pressed", pressed!);
  await expect
    .poll(() =>
      page.evaluate(() => localStorage.getItem("web-music-studio:project")),
    )
    .not.toBeNull();
  await page.reload();
  await engine
    .getByRole("button", { name: "Открыть: Ритм-секвенсор", exact: true })
    .click();
  await expect(engine.locator("[data-cell]").first()).toHaveAttribute(
    "style",
    after!,
  );
  await engine
    .getByRole("button", { name: "Воспроизвести (Пробел)", exact: true })
    .click();
  await expect(
    engine.getByRole("button", { name: "Остановить (Пробел)", exact: true }),
  ).toBeVisible();
  // The transport pulses while playing; activate its accessible keyboard action.
  await engine
    .getByRole("button", { name: "Остановить (Пробел)", exact: true })
    .press("Enter");
  await expect(
    engine.getByRole("button", { name: "Воспроизвести (Пробел)", exact: true }),
  ).toBeVisible();

  // Escape returns to the overview on both desktop and touch layouts.
  await engine.locator("body").press("Escape");
  await engine
    .getByRole("button", { name: "Открыть: Файлы", exact: true })
    .click();
  const jsonDownload = page.waitForEvent("download");
  await engine
    .getByRole("button", { name: "Скачать проект (.json)", exact: true })
    .click();
  const json = await jsonDownload;
  expect(json.suggestedFilename()).toMatch(/\.json$/);
  const project = JSON.parse(await readFile((await json.path())!, "utf8"));
  expect(project).toHaveProperty("patterns");
  expect(project.patterns.length).toBeGreaterThan(0);

  const wavDownload = page.waitForEvent("download");
  await engine
    .getByRole("button", { name: "Скачать аудио WAV", exact: true })
    .click();
  const wav = await wavDownload;
  expect(wav.suggestedFilename()).toMatch(/\.wav$/);
  const bytes = await readFile((await wav.path())!);
  expect(bytes.toString("ascii", 0, 4)).toBe("RIFF");
  expect(bytes.toString("ascii", 8, 12)).toBe("WAVE");
  expect(bytes.length).toBeGreaterThan(10000);
  expect(bytes.subarray(44).some((byte) => byte !== 0)).toBe(true);
  expect(browserErrors).toEqual([]);
  expect(failedAssets).toEqual([]);
  await page
    .getByRole("button", { name: "Закрыть музыкальную студию", exact: true })
    .click();
  await expect(page.locator(".studio.music")).toBeVisible();
});

test("music loader reports a missing engine and supports retry", async ({
  page,
}) => {
  await page.route("**/engines/music/", (route) =>
    route.fulfill({
      status: 503,
      contentType: "text/plain",
      body: "Unavailable",
    }),
  );
  await page.goto("./music/studio");
  await expect(page.getByRole("alert")).toContainText("Студия не загрузилась");
  await page.unroute("**/engines/music/");
  await page.getByRole("button", { name: "Повторить загрузку" }).click();
  await expect(
    page
      .frameLocator('iframe[title*="NeonDAW"]')
      .getByRole("button", { name: "Открыть: Файлы", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".engine-state")).toHaveCount(0);
});

test("Russian default covers eight modules, language switching persists without changing projects", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./music/studio");
  const engine = page.frameLocator('iframe[title*="NeonDAW"]');
  await expect(engine.locator("html")).toHaveAttribute("lang", "ru");
  const modules = [
    "Ритм-секвенсор",
    "Редактор нот",
    "Микшер",
    "Синтезатор",
    "Аранжировка",
    "Клавиши",
    "Генератор музыки",
    "Файлы",
  ];
  for (const title of modules) {
    await engine
      .getByRole("button", { name: "Открыть: " + title, exact: true })
      .click();
    await expect(
      engine.getByRole("heading", { name: title, exact: true, level: 1 }),
    ).toBeVisible();
    if (title === "Синтезатор")
      await expect(
        engine.getByRole("heading", { name: "Осциллятор 1", exact: true }),
      ).toBeVisible();
    if (title === "Файлы")
      await expect(
        engine.getByRole("button", { name: "Скачать аудио WAV", exact: true }),
      ).toBeVisible();
    await engine.locator("body").press("Escape");
  }
  const project = await page.evaluate(() =>
    localStorage.getItem("web-music-studio:project"),
  );
  const english = engine.getByRole("button", {
    name: "Выбрать язык: EN",
    exact: true,
  });
  if (!(await english.isVisible()))
    await engine
      .getByRole("button", { name: "Дополнительные настройки", exact: true })
      .click();
  await english.click();
  await expect(engine.locator("html")).toHaveAttribute("lang", "en");
  await engine
    .getByRole("button", { name: "Switch language: 中文", exact: true })
    .click();
  await expect(engine.locator("html")).toHaveAttribute("lang", "zh-CN");
  await engine
    .getByRole("button", { name: "切换语言: РУС", exact: true })
    .click();
  await expect(engine.locator("html")).toHaveAttribute("lang", "ru");
  expect(
    await page.evaluate(() => localStorage.getItem("web-music-studio:project")),
  ).toBe(project);
  await page.reload();
  await expect(
    engine.getByRole("button", { name: "Открыть: Файлы", exact: true }),
  ).toBeVisible();
  await expect(engine.locator("html")).toHaveAttribute("lang", "ru");
  expect(errors).toEqual([]);
});
