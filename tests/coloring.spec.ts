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

test("old PNG progress migrates, preserves v3 storage and keeps a downloadable original", async ({
  page,
}) => {
  await page.goto("./");
  await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 850;
    const context = canvas.getContext("2d")!;
    context.fillStyle = "#336699";
    context.fillRect(0, 0, 850, 850);
    localStorage.setItem(
      "rybka-coloring-v2",
      JSON.stringify({ alpaca: canvas.toDataURL("image/png") }),
    );
    await new Promise<void>((resolve, reject) => {
      const request = indexedDB.open("rybka-coloring-v3", 1);
      request.onupgradeneeded = () =>
        request.result.createObjectStore("pages", { keyPath: "id" });
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        const db = request.result,
          transaction = db.transaction("pages", "readwrite");
        transaction.objectStore("pages").put({
          id: "existing-v3",
          colors: ["#123456"],
          revision: "unchanged",
          updated: 123,
        });
        transaction.oncomplete = () => {
          db.close();
          resolve();
        };
        transaction.onerror = () => reject(transaction.error);
      };
    });
  });
  await page.goto("./art/draw");
  await expect(page.locator(".magic-archive summary")).toContainText("1");
  await page.getByRole("searchbox").fill("Альпака");
  await expect(page.locator(".magic-card")).toContainText("Продолжить");
  await page.locator(".magic-card").click();
  await expect(page.locator(".magic-loading")).toHaveCount(0);
  const canvas = page.locator(".magic-canvas-stack canvas").first();
  const pixel = () =>
    canvas.evaluate((element: HTMLCanvasElement) =>
      Array.from(element.getContext("2d")!.getImageData(10, 10, 1, 1).data),
    );
  await expect.poll(pixel).toEqual([51, 102, 153, 255]);
  await expect(page.getByRole("status")).toContainText(
    "Прежний рисунок восстановлен",
  );
  await canvas.click({ position: { x: 10, y: 10 } });
  await expect.poll(pixel).toEqual([255, 184, 107, 255]);
  await expect(page.getByRole("status")).toHaveText(
    "Сохранено на этом устройстве",
  );
  await page.reload();
  await page.getByRole("searchbox").fill("Альпака");
  await page.locator(".magic-card").click();
  await expect(page.locator(".magic-loading")).toHaveCount(0);
  await expect.poll(pixel).toEqual([255, 184, 107, 255]);
  await page
    .getByRole("button", { name: "Назад в галерею", exact: true })
    .click();
  await page.locator(".magic-archive summary").click();
  const event = page.waitForEvent("download");
  await page
    .getByRole("button", {
      name: "Скачать прежний рисунок: Альпака",
      exact: true,
    })
    .click();
  const download = await event;
  expect(download.suggestedFilename()).toBe("Рыбка-прежний-Альпака.png");
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream!) chunks.push(Buffer.from(chunk));
  const buffer = Buffer.concat(chunks);
  expect(buffer.readUInt32BE(16)).toBe(850);
  expect(buffer.readUInt32BE(20)).toBe(904);
  const originalPixel = await page.evaluate(async (data) => {
    const img = new Image();
    img.src = "data:image/png;base64," + data;
    await img.decode();
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 850;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0);
    return Array.from(ctx.getImageData(10, 10, 1, 1).data);
  }, buffer.toString("base64"));
  expect(originalPixel).toEqual([51, 102, 153, 255]);
  const existing = await page.evaluate(
    () =>
      new Promise<unknown>((resolve, reject) => {
        const request = indexedDB.open("rybka-coloring-v3", 2);
        request.onsuccess = () => {
          const db = request.result,
            tx = db.transaction("pages"),
            get = tx.objectStore("pages").get("existing-v3");
          get.onsuccess = () => resolve(get.result);
          tx.oncomplete = () => db.close();
        };
        request.onerror = () => reject(request.error);
      }),
  );
  expect(existing).toEqual({
    id: "existing-v3",
    colors: ["#123456"],
    revision: "unchanged",
    updated: 123,
  });
  await page.evaluate(() => localStorage.removeItem("rybka-coloring-v2"));
  await page.reload();
  await expect(page.locator(".magic-archive summary")).toContainText("1");
});

test("storage errors preserve newer progress and do not hide successfully archived drawings", async ({
  page,
}) => {
  await page.goto("./");
  await page.evaluate(async () => {
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 850;
    canvas.getContext("2d")!.fillRect(0, 0, 850, 850);
    const png = canvas.toDataURL();
    localStorage.setItem(
      "rybka-coloring-v2",
      JSON.stringify({ alpaca: png, camel: png }),
    );
    await new Promise<void>((resolve, reject) => {
      const r = indexedDB.open("rybka-coloring-v3", 2);
      r.onupgradeneeded = () => {
        r.result.createObjectStore("pages", { keyPath: "id" });
        r.result.createObjectStore("legacy", { keyPath: "id" });
      };
      r.onsuccess = () => {
        const db = r.result,
          tx = db.transaction("pages", "readwrite");
        tx.objectStore("pages").put({
          id: "alpaca",
          revision: "newer-progress",
          colors: ["#123456"],
          updated: 999,
        });
        tx.oncomplete = () => {
          db.close();
          resolve();
        };
        tx.onerror = () => reject(tx.error);
      };
      r.onerror = () => reject(r.error);
    });
  });
  await page.addInitScript(() => {
    const put = IDBObjectStore.prototype.put,
      get = IDBObjectStore.prototype.get;
    let readFailed = false;
    IDBObjectStore.prototype.put = function (value, ...args) {
      if (this.name === "legacy" && value.id === "camel")
        throw new DOMException("Storage full", "QuotaExceededError");
      return put.call(this, value, ...args);
    };
    IDBObjectStore.prototype.get = function (key) {
      if (this.name === "pages" && key === "alpaca" && !readFailed) {
        readFailed = true;
        throw new DOMException("Temporary read failure", "UnknownError");
      }
      return get.call(this, key);
    };
  });
  await page.goto("./art/draw");
  await expect(page.locator(".magic-archive summary")).toContainText("1");
  await expect(page.locator(".magic-status")).toContainText(
    "Не все прежние рисунки",
  );
  await page.getByRole("searchbox").fill("Альпака");
  await page.locator(".magic-card").click();
  await expect(page.getByRole("alert")).toContainText(
    "Не удалось открыть сохранённый рисунок",
  );
  await expect(
    page.getByRole("button", { name: /Скачать PNG/ }),
  ).toBeDisabled();
  const original = await page.evaluate(
    () =>
      new Promise<unknown>((resolve, reject) => {
        const r = indexedDB.open("rybka-coloring-v3", 2);
        r.onsuccess = () => {
          const db = r.result,
            tx = db.transaction("pages"),
            get = tx.objectStore("pages").get("alpaca");
          get.onsuccess = () => resolve(get.result);
          tx.oncomplete = () => db.close();
        };
        r.onerror = () => reject(r.error);
      }),
  );
  expect(original).toEqual({
    id: "alpaca",
    revision: "newer-progress",
    colors: ["#123456"],
    updated: 999,
  });
});
