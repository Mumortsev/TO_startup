import fs from "node:fs";
// Real static entry points avoid GitHub Pages' 404 bounce for supported routes.
const base = '/' + (process.env.SITE_BASE_PATH || '/TO_startup/').replace(/^\/+|\/+$/g, '');
const basePath = base.replace(/\/$/, '') + '/';
const previousSite = 'https://mumortsev.github.io/TO_startup/';
const site = (process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://mumortsev.github.io' + basePath).replace(/\/+$/, '') + '/';
const html = fs.readFileSync('dist/index.html', 'utf8').replaceAll(previousSite, site);
fs.writeFileSync('dist/index.html', html);
// Static license links must follow the build's base path too.
const licensesPath = 'dist/licenses/index.html';
if (fs.existsSync(licensesPath)) fs.writeFileSync(licensesPath, fs.readFileSync(licensesPath, 'utf8').replaceAll('/TO_startup/', basePath));
const recovery = `<!doctype html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Music & Art</title><script>var base=${JSON.stringify(basePath)},route=location.pathname;route=route.startsWith(base)?route.slice(base.length):route;location.replace(base+'?route='+encodeURIComponent('/'+route.replace(/^\\/+/,''))+location.hash)</script></head><body>Переход…</body></html>`;
fs.writeFileSync('dist/404.html', recovery);
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
    "Ритм-секвенсор stARTup: барабаны, гитара и бас, готовые мелодии и скачивание музыки.",
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

const pageUrls = ['', ...routes.map(([route]) => route)].map(route => site + (route ? route + '/' : ''));
fs.writeFileSync('dist/sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + pageUrls.map(url => `<url><loc>${url}</loc></url>`).join('\n') + '\n</urlset>\n');
fs.writeFileSync('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${site}sitemap.xml\n`);
