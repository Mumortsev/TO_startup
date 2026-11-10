import { sitePhoto } from './sitePhotos';
export const musicContact = { phone: '+7 (961) 506-27-73', tel: '+79615062773', address: 'г. Сочи, пос. Лазаревское, ул. Социалистическая, 1' };
export const musicHeroPhoto = 'portrait';
export const musicStagePhoto = 'performance';
export const musicIntro = 'Занятия, после которых действительно есть результат: разбираем песни, которые нравятся, ставим руку и слух, учимся играть в группе и не бояться сцены. Результативно, продуктивно и нескучно — без зубрёжки ради галочки.';
export const musicDirections = [
  { title: 'Гитара', description: 'С нуля или для тех, кто хочет вернуться к инструменту: аккорды, бой, перебор, ритм, разбор любимых песен.', photo: 'guitar' },
  { title: 'Бас-гитара', description: 'Основа ритм-секции: грув, посадка руки, взаимодействие с барабанами, игра в связке с гитарой.', photo: 'instruments' },
  { title: 'Барабанная установка', description: 'Координация, чувство ритма, работа с метрономом и в группе. От первых ритмов до уверенной игры.', photo: 'drums' },
];
const descriptions: Record<string, string> = {
  lesson: 'Дети играют на барабанной установке', instruments: 'Гитары и бас-гитара в студии', drums: 'Барабанная установка в студии', guitar: 'Акустическая гитара у микрофона', 'drums-close': 'Барабанная установка крупным планом', portrait: 'В музыкальной студии', performance: 'Игра на барабанной установке',
};
export function musicPhoto(id: string) { return sitePhoto('music', id, descriptions[id]); }
const placedPhotos = new Set([musicHeroPhoto, musicStagePhoto, ...musicDirections.map(item => item.photo)]);
// Only photographs not already used elsewhere on the page belong in the gallery.
export const musicGallery = Object.entries(descriptions).filter(([id]) => !placedPhotos.has(id)).map(([id, title]) => ({ ...musicPhoto(id), title }));
