import { test, expect } from "@playwright/test";
test("full creative applications load and close", async ({ page }) => {
  await page.goto("./art/draw");
  await expect(
    page.getByRole("heading", { name: /Выбери свою/ }),
  ).toBeVisible();
  await expect(page.locator(".magic-card").first()).toBeVisible();
  await page.locator(".magic-card").first().click();
  await expect(page.locator(".magic-canvas-stack canvas")).toHaveCount(2);
  await page.getByRole("button", { name: /Назад/ }).click();
  await expect(page.locator(".magic-card").first()).toBeVisible();
  await page.goto("./music");
  await page.getByRole("link", { name: /Создать свой бит/ }).click();
  await expect(page.locator('iframe[title*="NeonDAW"]')).toBeVisible();
  await expect(
    page.frameLocator('iframe[title*="NeonDAW"]').getByRole("button",{name:"Открыть: Файлы",exact:true}),
  ).toBeVisible();
});
test("gallery opens, advances and closes", async ({ page }) => {
  await page.goto("./art");
  await page.locator(".gallery button").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.getByRole("button", { name: "Следующее фото" }).click();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
});
test("no horizontal page overflow", async ({ page }) => {
  for (const route of [
    "./",
    "./art",
    "./music",
    "./art/draw",
    "./music/studio",
  ]) {
    await page.goto(route);
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - window.innerWidth,
    );
    expect(overflow, route).toBeLessThanOrEqual(1);
  }
});
