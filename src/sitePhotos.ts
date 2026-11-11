import manifest from './sitePhotos.generated.json';
import type { PhotoAsset } from './ResponsivePhoto';
export function sitePhoto(group: 'music' | 'rybka' | 'rybka-albums' | 'music-album', id: string, alt: string): PhotoAsset & { thumbnail: string } {
  const item = (manifest as Record<string, Omit<PhotoAsset, 'alt'> & { thumbnail: string }>)[`${group}/${id}`];
  if (!item) throw new Error(`Missing prepared photograph: ${group}/${id}`);
  const url = (path: string) => import.meta.env.BASE_URL + path;
  return { ...item, src: url(item.src), thumbnail: url(item.thumbnail), alt, variants: item.variants?.map(variant => ({ ...variant, src: url(variant.src) })) };
}
