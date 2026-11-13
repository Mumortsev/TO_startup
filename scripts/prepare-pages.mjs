import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { build } from 'vite';

const pages = JSON.parse(fs.readFileSync('src/seoPages.json', 'utf8'));
const basePath = '/' + (process.env.SITE_BASE_PATH || '/creative_music_art_startup/').replace(/^\/+|\/+$/g, '') + '/';
const normalizedBase = basePath.replace(/\/+/g, '/');
// The old GitHub copy also points search engines to the primary domain.
const site = (process.env.SITE_URL || process.env.VITE_SITE_URL || 'https://artmusiclazarevskoe.ru').replace(/\/+$/, '') + '/';
const escape = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const json = value => JSON.stringify(value).replaceAll('<', '\\u003c');
const template = fs.readFileSync('dist/index.html', 'utf8');
const temporary = fs.mkdtempSync(path.resolve('node_modules/.art-music-seo-'));
try {
  // Render the real components at build time; no additional server or browser.
  await build({
    configFile: false, base: normalizedBase, publicDir: false, logLevel: 'warn',
    define: { __SITE_REVISION__: JSON.stringify('prerender') },
    ssr: { noExternal: ['gsap'] },
    build: { ssr: 'src/seo-render.tsx', outDir: temporary, emptyOutDir: true, rollupOptions: { output: { entryFileNames: 'render.mjs' } } },
  });
  const renderer = await import(pathToFileURL(path.join(temporary, 'render.mjs')).href);
  const businesses = renderer.businesses(site);
  for (const [route, page] of Object.entries(pages)) {
    const url = site + (route === '/' ? '' : route.slice(1) + '/');
    const graph = [
      { '@type': 'WebSite', '@id': site + '#website', url: site, name: 'Music & Art — Лазаревское', inLanguage: 'ru-RU' },
      ...(route === '/art' ? [businesses[0]] : route === '/music' ? [businesses[1]] : route === '/' ? businesses : []),
      { '@type': 'WebPage', '@id': url + '#webpage', url, name: page.title, description: page.description, inLanguage: 'ru-RU', isPartOf: { '@id': site + '#website' }, ...(route === '/art' || route === '/music' ? { about: { '@id': site + (route === '/art' ? '#rybka' : '#startup') } } : {}) },
    ];
    if (route !== '/') graph.push({ '@type': 'BreadcrumbList', itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Главная', item: site },
      ...(route.includes('/draw') || route.includes('/studio') ? [{ '@type': 'ListItem', position: 2, name: route.startsWith('/art') ? 'Мастерская «Рыбка»' : 'Студия stARTup', item: site + route.split('/')[1] + '/' }] : []),
      { '@type': 'ListItem', position: route.includes('/draw') || route.includes('/studio') ? 3 : 2, name: page.title, item: url },
    ] });
    const image = route.startsWith('/music') ? businesses[1].image : businesses[0].image;
    let html = template
      .replace(/<title>[\s\S]*?<\/title>/, `<title>${escape(page.title)}</title>`)
      .replace(/(<meta\s+name="description"\s+content=")[^"]*("\s*\/?>)/, (_, before, after) => before + escape(page.description) + after)
      .replace(/(<meta\s+property="og:title"\s+content=")[^"]*("\s*\/?>)/, (_, before, after) => before + escape(page.title) + after)
      .replace(/(<meta\s+property="og:description"\s+content=")[^"]*("\s*\/?>)/, (_, before, after) => before + escape(page.description) + after)
      .replace(/(<link\s+rel="canonical"\s+href=")[^"]*("\s*\/?>)/, (_, before, after) => before + url + after)
      .replace(/(<meta\s+property="og:url"\s+content=")[^"]*("\s*\/?>)/, (_, before, after) => before + url + after)
      .replace('</head>', `<meta name="robots" content="index, follow, max-image-preview:large" />\n<meta property="og:site_name" content="Music &amp; Art" />\n<meta property="og:image" content="${escape(image)}" />\n<meta name="twitter:card" content="summary_large_image" />\n<script id="seo-structured-data" data-path="${route}" type="application/ld+json">${json({ '@context': 'https://schema.org', '@graph': graph })}</script>\n</head>`);
    const content = renderer.render(route);
    if (content) html = html.replace('<div id="root"></div>', () => `<div id="root">${content}</div>`);
    const destination = route === '/' ? 'dist' : 'dist' + route;
    fs.mkdirSync(destination, { recursive: true });
    fs.writeFileSync(destination + '/index.html', html);
  }
} finally {
  fs.rmSync(temporary, { recursive: true, force: true });
}
const licensesPath = 'dist/licenses/index.html';
if (fs.existsSync(licensesPath)) fs.writeFileSync(licensesPath, fs.readFileSync(licensesPath, 'utf8').replaceAll('/creative_music_art_startup/', normalizedBase));
const recovery = `<!doctype html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>Music & Art</title><script>var base=${JSON.stringify(normalizedBase)},route=location.pathname;route=route.startsWith(base)?route.slice(base.length):route;location.replace(base+'?route='+encodeURIComponent('/'+route.replace(/^\\/+/,''))+location.hash)</script></head><body>Переход…</body></html>`;
fs.writeFileSync('dist/404.html', recovery);
fs.writeFileSync('dist/not-found.html', '<!doctype html><html lang="ru"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,follow"><title>Страница не найдена | Music &amp; Art</title></head><body><h1>Страница не найдена</h1><p><a href="' + normalizedBase + '">На главную Music &amp; Art</a></p></body></html>');
const pageUrls = Object.keys(pages).map(route => site + (route === '/' ? '' : route.slice(1) + '/'));
fs.writeFileSync('dist/sitemap.xml', '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + pageUrls.map(url => `<url><loc>${escape(url)}</loc></url>`).join('\n') + '\n</urlset>\n');
fs.writeFileSync('dist/robots.txt', `User-agent: *\nAllow: /\nDisallow: /engines/\nDisallow: /rock-audio/\nDisallow: /healthz\nSitemap: ${site}sitemap.xml\n`);
console.log('Generated SEO metadata, structured data and static studio pages.');
