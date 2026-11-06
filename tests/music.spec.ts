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
    engine.getByRole("button", { name: "Enter Channel Rack", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".engine-state")).toHaveCount(0);
  await engine
    .getByRole("button", { name: "Enter Channel Rack", exact: true })
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
    .getByRole("button", { name: "Enter Channel Rack", exact: true })
    .click();
  await expect(engine.locator("[data-cell]").first()).toHaveAttribute(
    "style",
    after!,
  );
  await engine
    .getByRole("button", { name: "Play (Space)", exact: true })
    .click();
  await expect(
    engine.getByRole("button", { name: "Stop (Space)", exact: true }),
  ).toBeVisible();
  // The transport pulses while playing; activate its accessible keyboard action.
  await engine
    .getByRole("button", { name: "Stop (Space)", exact: true })
    .press("Enter");
  await expect(
    engine.getByRole("button", { name: "Play (Space)", exact: true }),
  ).toBeVisible();

  // Escape returns to the overview on both desktop and touch layouts.
  await engine.locator("body").press("Escape");
  await engine
    .getByRole("button", { name: "Enter Files", exact: true })
    .click();
  const jsonDownload = page.waitForEvent("download");
  await engine
    .getByRole("button", { name: "Export project (.json)", exact: true })
    .click();
  const json = await jsonDownload;
  expect(json.suggestedFilename()).toMatch(/\.json$/);
  const project = JSON.parse(await readFile((await json.path())!, "utf8"));
  expect(project).toHaveProperty("patterns");
  expect(project.patterns.length).toBeGreaterThan(0);

  const wavDownload = page.waitForEvent("download");
  await engine
    .getByRole("button", { name: "Export WAV audio", exact: true })
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
      .getByRole("button", { name: "Enter Files", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".engine-state")).toHaveCount(0);
});
