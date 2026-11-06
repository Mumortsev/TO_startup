import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
test("one-tap world selection and keyboard-accessible gallery", async ({
  page,
  isMobile,
}) => {
  await page.goto("./");
  await page.locator(".art-world").click();
  await expect(page).toHaveURL(/\/art$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "Больше красок",
  );
  if (isMobile) {
    await page.getByRole("button", { name: "Открыть меню" }).click();
    await expect(page.getByRole("navigation")).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(page.getByRole("navigation")).not.toBeVisible();
  }
  await page.locator(".gallery button").first().click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("figcaption")).toContainText("2 / 4");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await expect(page.locator(".gallery button").first()).toBeFocused();
});
test("WCAG AA automated accessibility on main routes", async ({ page }) => {
  for (const path of ["./", "./art", "./music", "./art/draw"]) {
    await page.goto(path);
    await page.evaluate(() => document.fonts.ready);
    if (await page.locator("[data-enter]").count())
      await expect(page.locator("[data-enter]").last()).toHaveCSS(
        "opacity",
        "1",
      );
    const audit = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa"])
      .analyze();
    expect(
      audit.violations.map((v) => ({
        id: v.id,
        nodes: v.nodes.map((n) => n.target),
      })),
      path,
    ).toEqual([]);
  }
});
test("responsive resource and console checks", async ({ page }, info) => {
  test.setTimeout(120000);
  test.skip(
    info.project.name !== "desktop-chromium",
    "viewport matrix is shared",
  );
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("response", (r) => {
    if (r.status() >= 400) errors.push(r.status() + " " + r.url());
  });
  for (const width of [320, 390, 768, 1024, 1440, 1920, 2560]) {
    await page.setViewportSize({ width, height: width < 500 ? 844 : 1000 });
    for (const route of ["./", "./art", "./music", "./art/draw"]) {
      await page.goto(route);
      await page.evaluate(() => document.fonts.ready);
      await expect(page.locator("h1")).toBeVisible();
      if (await page.locator("[data-enter]").count())
        await expect(page.locator("[data-enter]").last()).toHaveCSS(
          "opacity",
          "1",
        );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth - innerWidth,
        ),
        `${width} ${route}`,
      ).toBeLessThanOrEqual(1);
      await page.evaluate(async () => {
        await Promise.all(
          Array.from(document.images).map((i) => {
            i.loading = "eager";
            return i.decode().catch(() => {});
          }),
        );
      });
      expect(
        await page
          .locator("img")
          .evaluateAll((images) =>
            images
              .filter((i) => !i.complete || i.naturalWidth === 0)
              .map((i) => i.src),
          ),
        route,
      ).toEqual([]);
      if ([320, 390, 768, 1440].includes(width) && route !== "./art/draw")
        await page.screenshot({
          path: `artifacts/${route.replaceAll("/", "").replaceAll(".", "") || "home"}-${width}.png`,
          fullPage: true,
        });
    }
  }
  expect(errors).toEqual([]);
});
test("reduced motion leaves content visible and stops rhythm animation", async ({
  page,
}) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./music");
  await expect(page.locator("h1")).toBeVisible();
  await page.getByRole("button", { name: "Включить анимацию ритма" }).click();
  expect(
    await page
      .locator(".sound-wave>span")
      .first()
      .evaluate((el) => getComputedStyle(el).animationName),
  ).toBe("none");
});
