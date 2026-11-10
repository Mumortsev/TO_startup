import { sitePhoto } from './sitePhotos';
import type { PhotoAsset } from './ResponsivePhoto';
export type ArtPhotoId = 'anna-painting' | 'lesson' | 'anna-board' | 'painting-close' | 'palette' | 'celebration' | 'wood-house' | 'flowers-tables' | 'studio-wide';
export type ArtPhoto = PhotoAsset & { thumbnail: string };
export const artPhotoDescriptions: Record<ArtPhotoId, string> = {
  'anna-painting': 'Анна рисует зайца на сиреневом фоне',
  lesson: 'Анна помогает детям рисовать за столом в мастерской',
  'anna-board': 'Анна у доски с рисунками в мастерской «Рыбка»',
  'painting-close': 'Работа над рисунком зайца крупным планом',
  palette: 'Кисть, краски и палитра во время занятия',
  celebration: 'Стол с угощениями и цветами в мастерской',
  'wood-house': 'Деревянный домик — деталь мастерской',
  'flowers-tables': 'Рабочие столы с цветами и листами для рисования',
  'studio-wide': 'Пространство мастерской со столами и стеной рисунков',
};
export function getArtPhoto(id: ArtPhotoId): ArtPhoto | undefined {
  return sitePhoto('rybka', id, artPhotoDescriptions[id]);
}
