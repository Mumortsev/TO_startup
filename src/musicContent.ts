import { sitePhoto } from './sitePhotos';
export const musicContact = { max: 'https://max.ru/u/f9LHodD0cOKMWiIDn7WkM0ihUgrXi58aHjTMokEwsn5VtmEnTNKaeZoM0jI', phone: '+7 (961) 506-27-73', tel: '+79615062773', address: 'г. Сочи, пос. Лазаревское, ул. Социалистическая, 1' };
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
const studentPhotos = [
  ['student-111552', 'Девушка играет на бас-гитаре'],
  ['student-111544', 'Девочка в наушниках играет на барабанах'],
  ['student-111559', 'Мальчик в красной кофте за барабанной установкой'],
  ['student-132609', 'Ученик играет на гитаре у микрофона'],
  ['student-132616', 'Девочка за барабанной установкой'],
  ['student-132620', 'Мальчик играет на барабанах'],
  ['student-132634', 'Совместная игра на гитаре и барабанах'],
];
export const musicGallery = studentPhotos.map(([id, alt]) => ({ ...sitePhoto('music-album', id, alt), title: 'Ученики студии' }));
