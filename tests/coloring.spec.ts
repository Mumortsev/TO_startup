import { test, expect } from "@playwright/test";
test("colouring fills, undoes, restores after reload and exports PNG", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./art/draw");
  await page
    .getByRole("searchbox", { name: "Поиск раскраски" })
    .fill("Альпака");
  await expect(page.locator(".magic-card")).toHaveCount(1);
  await page.locator(".magic-card").click();
  await expect(page.locator(".magic-loading")).toHaveCount(0);
  const canvas = page.locator(".magic-canvas-stack canvas").first();
  const pixel = () =>
    canvas.evaluate((element: HTMLCanvasElement) =>
      Array.from(element.getContext("2d")!.getImageData(10, 10, 1, 1).data),
    );
  await canvas.click({ position: { x: 10, y: 10 } });
  await expect.poll(pixel).toEqual([255, 184, 107, 255]);
  await expect(page.getByRole("status")).toHaveText(
    "Сохранено на этом устройстве",
  );
  await page.getByRole("button", { name: /Отмена/ }).click();
  await expect.poll(pixel).toEqual([255, 255, 255, 255]);
  await canvas.click({ position: { x: 10, y: 10 } });
  await expect.poll(pixel).toEqual([255, 184, 107, 255]);
  await expect(page.getByRole("status")).toHaveText(
    "Сохранено на этом устройстве",
  );
  await page.reload();
  await page
    .getByRole("searchbox", { name: "Поиск раскраски" })
    .fill("Альпака");
  await expect(page.locator(".magic-card")).toContainText("Продолжить");
  await page.locator(".magic-card").click();
  await expect(page.locator(".magic-loading")).toHaveCount(0);
  await expect.poll(pixel).toEqual([255, 184, 107, 255]);
  const downloadEvent = page.waitForEvent("download");
  await page.getByRole("button", { name: /Скачать PNG/ }).click();
  const download = await downloadEvent;
  expect(download.suggestedFilename()).toBe("Рыбка-Альпака.png");
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const buffer = Buffer.concat(chunks);
  expect(buffer.subarray(1, 4).toString()).toBe("PNG");
  expect(buffer.readUInt32BE(16)).toBe(850);
  expect(buffer.readUInt32BE(20)).toBe(904);
  await page.getByRole("button", { name: /Очистить/ }).click();
  await page.getByRole("button", { name: "Очистить рисунок" }).click();
  await expect.poll(pixel).toEqual([255, 255, 255, 255]);
  await page.getByRole("button", { name: /Отмена/ }).click();
  await expect.poll(pixel).toEqual([255, 184, 107, 255]);
  expect(errors).toEqual([]);
});
test("gallery search empty state, filters, keyboard and mobile zoom", async ({
  page,
}) => {
  await page.goto("./art/draw");
  await page.getByRole("button", { name: "Море", exact: true }).click();
  await expect(page.locator(".magic-card")).not.toHaveCount(0);
  await page.getByRole("searchbox").fill("zzzzzz");
  await expect(page.locator(".magic-card")).toHaveCount(0);
  await page.getByRole("button", { name: "Показать все рисунки" }).click();
  await page.getByRole("searchbox").fill("Альпака");
  await page.locator(".magic-card").click();
  await expect(page.locator(".magic-loading")).toHaveCount(0);
  await page.getByRole("button", { name: "Увеличить рисунок" }).click();
  await expect(page.locator(".magic-zoom")).toContainText("150%");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth - innerWidth,
    ),
  ).toBeLessThanOrEqual(1);
  await page.getByRole("button", { name: "Уменьшить рисунок" }).click();
  const canvas = page.locator(".magic-canvas-stack canvas").first();
  await canvas.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Enter");
  await expect(page.getByRole("button", { name: /Отмена/ })).toBeEnabled();
  await page.getByRole("button", { name: "Как раскрашивать" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(
    page.getByRole("button", { name: "Как раскрашивать" }),
  ).toBeFocused();
});
