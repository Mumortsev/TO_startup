import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
function run(args) {
  const result = spawnSync('magick', args, { encoding: 'utf8' });
  if (result.error || result.status !== 0) throw result.error || new Error(result.stderr);
  return result.stdout.trim();
}
const metadataPath = join(root, 'src/sitePhotos.generated.json');
const output = existsSync(metadataPath) ? JSON.parse(readFileSync(metadataPath, 'utf8')) : {};
const availableGroups = ['rybka', 'music', 'rybka-albums'];
const groups = process.argv.slice(2);
if (groups.some(group => !availableGroups.includes(group))) throw new Error('Unknown photo group');
for (const group of groups.length ? groups : availableGroups) {
  for (const key of Object.keys(output)) if (key.startsWith(group + '/')) delete output[key];
  const manifest = join(root, 'media', `${group}-photos.json`);
  const mapping = JSON.parse(readFileSync(manifest, 'utf8'));
  for (const [id, file] of Object.entries(mapping)) {
    const input = resolve(dirname(manifest), file);
    if (!input.startsWith(join(root, 'private-media') + '/')) throw new Error('Originals must stay in private-media/');
    const [width, height] = run([input, '-auto-orient', '-format', '%w %h', 'info:']).split(' ').map(Number);
    const variants = [];
    const directory = join(root, 'public/images', group);
    mkdirSync(directory, { recursive: true });
    let previousWidth = 0;
    for (const size of [320, 640, 960, 1280]) {
      const scale = Math.min(1, size / width, 1600 / height);
      const w = Math.round(width * scale), h = Math.round(height * scale);
      if (w === previousWidth) continue;
      previousWidth = w;
      const src = `images/${group}/${id}-${size}.webp`;
      // Keep the camera's ICC profile. Remove location and other private metadata.
      run([input, '-auto-orient', '-resize', `${w}x${h}!`, '+profile', 'exif', '+profile', 'xmp', '+profile', 'iptc', '-set', 'comment', '', '-quality', '85', join(root, 'public', src)]);
      variants.push({ src, width: w });
    }
    const largest = variants.at(-1);
    output[`${group}/${id}`] = { src: largest.src, thumbnail: variants[Math.min(1, variants.length - 1)].src, width: largest.width, height: Math.round(height * largest.width / width), variants };
    console.log(`${group}/${id}: ${variants.length} responsive WebP sizes`);
  }
}
writeFileSync(metadataPath, JSON.stringify(output, null, 2) + '\n');
