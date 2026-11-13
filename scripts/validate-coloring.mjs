import fs from "node:fs";
import { chromium } from "@playwright/test";
import ts from "typescript";
const source = fs.readFileSync("src/coloringPages.ts", "utf8");
const pageCode = ts.transpileModule(source, {
  compilerOptions: {
    target: ts.ScriptTarget.ES2020,
    module: ts.ModuleKind.ESNext,
  },
}).outputText;
const { coloringPages: pages } = await import(
  "data:text/javascript;base64," + Buffer.from(pageCode).toString("base64")
);
const base = process.env.COLORING_URL || "http://127.0.0.1:4181/creative_music_art_startup/";
const code = ts.transpileModule(
  fs.readFileSync("src/coloringEngine.ts", "utf8"),
  {
    compilerOptions: {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.ESNext,
    },
  },
).outputText;
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_EXECUTABLE_PATH
    ? { executablePath: process.env.PLAYWRIGHT_EXECUTABLE_PATH }
    : {}),
});
try {
  const page = await browser.newPage({
    viewport: { width: 1600, height: 1000 },
  });
  await page.goto(base);
  const results = await page.evaluate(
    async ({ pages, base, code }) => {
      const url = URL.createObjectURL(
          new Blob([code], { type: "text/javascript" }),
        ),
        engine = await import(url);
      URL.revokeObjectURL(url);
      const results = [];
      for (const entry of pages) {
        const image = new Image();
        image.src = base + "coloring/" + entry.id + ".svg";
        await image.decode();
        const canvas = document.createElement("canvas");
        canvas.width = canvas.height = 850;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        const scale = Math.min(
            814 / image.naturalWidth,
            814 / image.naturalHeight,
          ),
          w = image.naturalWidth * scale,
          h = image.naturalHeight * scale;
        ctx.drawImage(image, (850 - w) / 2, (850 - h) / 2, w, h);
        const raster = ctx.getImageData(0, 0, 850, 850),
          start = performance.now(),
          map = engine.makeRegions(raster.data, 850, 850);
        const paintable = map.sizes.filter((size) => size >= 20).length,
          ink = [...map.labels].filter((n) => n === -2).length;
        const colors = map.sizes.map(() => "#ffffff");
        const region = map.sizes.findIndex(
          (size, id) => size >= 100 && id !== map.labels[0],
        );
        colors[region] = "#ff806f";
        const pixels = ctx.createImageData(850, 850);
        engine.paintRegions(pixels.data, map, colors);
        const seed = map.seeds[region] * 4;
        const fills =
          pixels.data[seed] === 255 && pixels.data[seed + 1] === 128;
        engine.transparentInk(raster.data);
        ctx.putImageData(pixels, 0, 0);
        const layer = document.createElement("canvas");
        layer.width = layer.height = 850;
        layer.getContext("2d").putImageData(raster, 0, 0);
        ctx.drawImage(layer, 0, 0);
        const final = ctx.getImageData(0, 0, 850, 850).data;
        let visible = 0;
        for (let i = 0; i < final.length; i += 4)
          if (
            final[i] > 200 &&
            final[i + 1] > 70 &&
            final[i + 1] < 180 &&
            final[i + 2] < 180
          )
            visible++;
        results.push({
          id: entry.id,
          name: entry.name,
          regions: map.sizes.length,
          paintable,
          ink,
          fillPixels: visible,
          fills,
          ms: Math.round(performance.now() - start),
          ok: paintable >= 2 && ink > 100 && fills && visible > 20,
        });
      }
      document.body.innerHTML =
        "<style>body{margin:0;padding:20px;background:#fff;font:12px sans-serif}main{display:grid;grid-template-columns:repeat(8,1fr);gap:12px}article{border:1px solid #ddd;padding:8px}img{width:100%;height:190px;object-fit:contain}p{margin:8px 0 0}</style><main>" +
        pages
          .map(
            (p) =>
              '<article><img src="' +
              base +
              "coloring/" +
              p.id +
              '.svg"><p>' +
              p.name +
              "</p></article>",
          )
          .join("") +
        "</main>";
      await Promise.all([...document.images].map((img) => img.decode()));
      return results;
    },
    { pages, base, code },
  );
  fs.mkdirSync("artifacts", { recursive: true });
  await page.screenshot({
    path: "artifacts/coloring-contact-sheet.png",
    fullPage: true,
  });
  fs.writeFileSync(
    "artifacts/coloring-validation.json",
    JSON.stringify(results, null, 2),
  );
  console.log(
    JSON.stringify(
      {
        total: results.length,
        passed: results.filter((r) => r.ok).length,
        failed: results.filter((r) => !r.ok),
        slowest: Math.max(...results.map((r) => r.ms)),
      },
      null,
      2,
    ),
  );
  if (results.some((r) => !r.ok)) process.exitCode = 1;
} finally {
  await browser.close();
}
