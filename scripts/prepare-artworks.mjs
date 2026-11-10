// Deterministic geometry only: never retouch, recolour or generate painting content.
import { existsSync, mkdirSync, readFileSync, writeFileSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = resolve(process.argv[2] || '');
if (!process.argv[2]) throw new Error('Usage: node scripts/prepare-artworks.mjs /private/manifest.json');
const entries = JSON.parse(readFileSync(manifest, 'utf8'));
const metadataPath = join(root, 'src/artworks.generated.json');
const metadata = JSON.parse(readFileSync(metadataPath, 'utf8'));
const output = join(root, 'public/images/rybka/artworks');
function run(args) {
  const result = spawnSync('magick', args, { encoding: 'utf8' });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr);
  return result.stdout.trim();
}
for (const entry of entries) {
  if (!/^work-\d{2}$/.test(entry.id)) throw new Error('Invalid work ID');
  const input = resolve(dirname(manifest), entry.file);
  const path = relative(join(root, 'public'), input);
  if (!path.startsWith('..') || !existsSync(input)) throw new Error('Source must exist outside public/');
  if (entry.corners?.length !== 4 || entry.corners.some(point => point.length !== 2 || point.some(value => !Number.isFinite(value) || value < 0 || value > 1))) throw new Error('Four normalised canvas corners required: top-left, top-right, bottom-right, bottom-left');
}
mkdirSync(output, { recursive: true });
const temporary = mkdtempSync(join(tmpdir(), 'rybka-artwork-'));
try {
  for (const entry of entries) {
    const input = resolve(dirname(manifest), entry.file) + '[0]';
    const [sourceWidth, sourceHeight] = run([input, '-auto-orient', '-format', '%w %h', 'info:']).split(' ').map(Number);
    const corners = entry.corners.map(([x, y]) => [x * (sourceWidth - 1), y * (sourceHeight - 1)]);
    const distance = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
    const width = Math.round((distance(corners[0], corners[1]) + distance(corners[3], corners[2])) / 2);
    const height = Math.round((distance(corners[0], corners[3]) + distance(corners[1], corners[2])) / 2);
    const targets = [[0, 0], [width - 1, 0], [width - 1, height - 1], [0, height - 1]];
    const mapping = corners.map((point, index) => `${point.join(',')} ${targets[index].join(',')}`).join(' ');
    const rectified = join(temporary, entry.id + '.png');
    run([input, '-auto-orient', '-virtual-pixel', 'edge', '-define', `distort:viewport=${width}x${height}+0+0`, '-distort', 'Perspective', mapping, '+repage', rectified]);
    for (const size of [960, 2000]) {
      const scale = Math.min(1, size / Math.max(width, height));
      const outWidth = Math.round(width * scale);
      const outHeight = Math.round(height * scale);
      const args = [rectified, '-resize', `${size}x${size}>`, '-strip', '-font', 'DejaVu-Sans', '-pointsize', String(Math.max(18, Math.round(outWidth / 28))), '-gravity', 'center', '-fill', 'rgba(255,255,255,0.30)', '-stroke', 'rgba(25,30,25,0.20)', '-strokewidth', '0.6'];
      for (const fraction of [-.22, .22]) args.push('-annotate', `+0${fraction < 0 ? '' : '+'}${Math.round(outHeight * fraction)}`, 'Мастерская «Рыбка»');
      run([...args, '-quality', '90', join(output, `${entry.id}-marked-${size}.webp`)]);
      if (size === 2000) metadata[entry.id] = { width: outWidth, height: outHeight };
    }
    console.log(`Prepared ${entry.id}: canvas rectified, public copies watermarked.`);
  }
  writeFileSync(metadataPath, JSON.stringify(metadata, null, 2) + '\n');
} finally { rmSync(temporary, { recursive: true, force: true }); }
