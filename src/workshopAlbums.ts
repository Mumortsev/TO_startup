import sources from '../media/rybka-albums-photos.json';
import { sitePhoto } from './sitePhotos';
const definitions = [
  { id: 'outdoors', title: 'Мастер-класс на выезде', cover: 'outdoors-55270' },
  { id: 'workshop', title: 'Мастер-класс в мастерской', cover: 'workshop-img_3967' },
];
export const workshopAlbums = definitions.map(album => {
  const remaining = Object.keys(sources).filter(id => id.startsWith(album.id + '-') && id !== album.cover).sort();
  return { ...album, photos: [album.cover, ...remaining].map((id, index) => ({ ...sitePhoto('rybka-albums', id, `${album.title}. Фотография ${index + 1}`), title: album.title })) };
});
