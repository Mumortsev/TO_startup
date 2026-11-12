import { renderToString } from 'react-dom/server';
import { Home, Header, Footer, Fish, Wave } from './App';
import ArtStudio from './ArtStudio';
import MusicStudio from './MusicStudio';
import { rybkaContact } from './artContent';
import { musicContact, musicHeroPhoto, musicPhoto } from './musicContent';
import { getArtPhoto } from './artPhotos';
import pages from './seoPages.json';

const noop = () => {};
export function render(path: string) {
  if (path === '/') return renderToString(<Home />);
  if (path === '/art') return renderToString(<ArtStudio header={<Header kind="art" />} footer={<Footer kind="art" />} emblem={<Fish className="rybka-emblem" />} onHome={noop} onDraw={noop} onMusic={noop} />);
  if (path === '/music') return renderToString(<MusicStudio header={<Header kind="music" />} footer={<Footer kind="music" />} rhythm={<Wave interactive />} onHome={noop} onPlay={noop} onArt={noop} />);
  const page = pages[path as keyof typeof pages];
  if (page) return renderToString(<main><h1>{page.title}</h1><p>{page.description}</p><p>Для работы приложения включите JavaScript.</p><a href={import.meta.env.BASE_URL + (path.startsWith('/art') ? 'art/' : 'music/')}>Вернуться в студию</a></main>);
  return '';
}

export function businesses(site: string) {
  return [
    { id: 'rybka', path: 'art/', name: 'Художественная мастерская «Рыбка»', contact: rybkaContact, street: 'переулок Павлова, 2', photo: getArtPhoto('lesson'), description: 'Рисование и творческие мастер-классы для детей и взрослых в мастерской и на выезд.' },
    { id: 'startup', path: 'music/', name: 'Музыкальная студия stARTup', contact: musicContact, street: 'улица Социалистическая, 1', photo: musicPhoto(musicHeroPhoto), description: 'Уроки гитары, бас-гитары и барабанной установки для взрослых и детей с 7 лет. Индивидуальные и групповые занятия.' },
  ].map(item => ({
    '@type': ['LocalBusiness', 'EducationalOrganization'],
    '@id': site + '#' + item.id,
    name: item.name, url: site + item.path,
    telephone: item.contact.tel, description: item.description,
    image: item.photo ? new URL(item.photo.src, site).href : undefined,
    address: { '@type': 'PostalAddress', streetAddress: item.street, addressLocality: 'Лазаревское, Сочи', addressRegion: 'Краснодарский край', addressCountry: 'RU' },
    areaServed: { '@type': 'Place', name: 'Лазаревское, Сочи' },
    hasMap: 'https://yandex.ru/maps/?text=' + encodeURIComponent(item.contact.address),
    sameAs: [item.contact.max],
  }));
}
