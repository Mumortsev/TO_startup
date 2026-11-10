import fs from "node:fs";
// Real static entry points avoid GitHub Pages' 404 bounce for supported routes.
const html = fs.readFileSync("dist/index.html", "utf8");
const site = "https://mumortsev.github.io/TO_startup/";
const routes = [
  [
    "art",
    "Рыбка — художественная мастерская",
    "Мастерская «Рыбка»: рисование и мастер-классы для детей и взрослых в Лазаревском. Расписание в MAX, занятия в мастерской и на выезд.",
  ],
  [
    "music",
    "stARTup — музыкальная студия",
    "Уроки гитары, бас-гитары и барабанной установки в Лазаревском. Индивидуально и в группе для взрослых и детей с 7 лет. Социалистическая, 1.",
  ],
  [
    "art/draw",
    "Волшебная Рыбка — раскраски",
    "69 настоящих иллюстраций: раскрашивание касанием, сохранение прогресса и экспорт PNG.",
  ],
  [
    "music/studio",
    "Музыкальная студия онлайн",
    "Создавайте музыку в NeonDAW: инструменты, ритм, сохранение проекта и экспорт аудио.",
  ],
];
for (const [route, title, description] of routes) {
  const url = site + route + "/";
  const page = html
    .replace(
      /<title>[\s\S]*?<\/title>/,
      `<title>${title} | Music &amp; Art</title>`,
    )
    .replace(
      /(<meta\s+name="description"\s+content=")[^"]*("\s*\/?>)/,
      `$1${description}$2`,
    )
    .replace(
      /(<meta\s+property="og:title"\s+content=")[^"]*("\s*\/?>)/,
      `$1${title} | Music &amp; Art$2`,
    )
    .replace(
      /(<meta\s+property="og:description"\s+content=")[^"]*("\s*\/?>)/,
      `$1${description}$2`,
    )
    .replaceAll(site + '"', url + '"');
  fs.mkdirSync("dist/" + route, { recursive: true });
  fs.writeFileSync("dist/" + route + "/index.html", page);
}
