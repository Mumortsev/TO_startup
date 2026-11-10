import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = join(root, 'public');
const ids = ['anna-painting', 'lesson', 'anna-board', 'painting-close', 'palette', 'celebration', 'wood-house', 'flowers-tables', 'studio-wide'];
function run(args) {
  const result = spawnSync('magick', args, { encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr || 'Image preparation failed');
  return result.stdout.trim();
}
function ensurePrivate(input) {
  const path = relative(publicDir, resolve(input));
  if (!path.startsWith('..') && !path.startsWith('/')) throw new Error('Source images must be outside public/. Publish processed derivatives only.');
  if (!existsSync(input)) throw new Error('Source image missing: ' + input);
}
function prepare(input, output, watermark) {
  ensurePrivate(input);
  mkdirSync(dirname(output), { recursive: true });
  const [width, height] = run([input, '-auto-orient', '-format', '%w %h', 'info:']).split(' ').map(Number);
  for (const size of [640, 1200]) {
    const outWidth = Math.min(width, size), outHeight = Math.round(height * outWidth / width);
    const args = [input, '-auto-orient', '-colorspace', 'sRGB', '-resize', `${size}x>`, '-strip'];
    if (watermark) {
      const point = Math.max(20, Math.round(outWidth / 24));
      args.push('-font', 'DejaVu-Sans', '-pointsize', String(point), '-fill', 'rgba(255,255,255,0.38)', '-stroke', 'rgba(20,35,25,0.23)', '-strokewidth', '1', '-gravity', 'center');
      for (const y of [-Math.round(outHeight * .23), 0, Math.round(outHeight * .23)]) args.push('-annotate', `+0${y < 0 ? '' : '+'}${y}`, 'Мастерская «Рыбка»');
      args.push('-gravity', 'southeast', '-pointsize', String(Math.max(16, Math.round(outWidth / 42))), '-fill', 'rgba(255,255,255,0.72)', '-annotate', '+24+24', '© Мастерская «Рыбка»');
    }
    args.push('-quality', '84', `${output}${watermark ? '-marked' : ''}-${size}.webp`);
    run(args);
  }
  return { width: Math.min(width, 1200), height: Math.round(height * Math.min(width, 1200) / width) };
}
const [mode, input, slug] = process.argv.slice(2);
if (mode === 'photos' && input) {
  const manifestPath = resolve(input), sources = JSON.parse(readFileSync(manifestPath, 'utf8'));
  for (const id of ids) if (typeof sources[id] !== 'string') throw new Error('Photo mapping missing: ' + id);
  // Resolve all inputs before publishing any new source manifest.
  for (const id of ids) ensurePrivate(resolve(dirname(manifestPath), sources[id]));
  const metadata = {};
  for (const id of ids) metadata[id] = prepare(resolve(dirname(manifestPath), sources[id]), join(publicDir, 'images/rybka', id), false);
  writeFileSync(join(root, 'src/artPhotos.generated.json'), JSON.stringify(metadata, null, 2) + '\n');
  console.log('Prepared 9 workshop photographs in 640px and 1200px WebP.');
} else if (mode === 'artwork' && input && /^[a-z0-9][a-z0-9-]*$/.test(slug || '')) {
  const metadata = prepare(resolve(input), join(publicDir, 'images/rybka/artworks', slug), true);
  console.log(JSON.stringify({ id: slug, image: `/TO_startup/images/rybka/artworks/${slug}-marked-1200.webp`, thumbnail: `/TO_startup/images/rybka/artworks/${slug}-marked-640.webp`, ...metadata }, null, 2));
} else {
  throw new Error('Usage: node scripts/prepare-art-media.mjs photos /private/photo-mapping.json | artwork /private/painting.jpg painting-slug');
}
