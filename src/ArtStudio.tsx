import Image from './ResponsivePhoto';
import PhotoGallery from './PhotoGallery';
import { useState, type ReactNode } from 'react';
import { ArrowLeft, BookOpen, Flame, Leaf, MapPin, Palette, Phone, Scissors, Shapes, Sparkles } from 'lucide-react';
import { annaAbout, artworks, masterclasses, rybkaContact, workshopAbout } from './artContent';
import { getArtPhoto, type ArtPhotoId } from './artPhotos';
import ArtworkCarousel from './ArtworkCarousel';
import './ArtStudio.css';
const base = import.meta.env.BASE_URL;
const icons = { paint: Palette, shape: Shapes, scissors: Scissors, spark: Sparkles, flame: Flame, leaf: Leaf, book: BookOpen };
function OptionalPhoto({ id, className = '' }: { id: ArtPhotoId; className?: string }) {
  const photo = getArtPhoto(id);
  return photo ? <Image photo={photo} className={className} /> : null;
}
const galleryIds: [ArtPhotoId, string][] = [['anna-board', 'Время творить'], ['painting-close', 'За работой'], ['wood-house', 'Детали мастерской'], ['flowers-tables', 'Место для новых идей'], ['studio-wide', 'Пространство мастерской']];
const gallery = galleryIds.flatMap(([id, title]) => { const photo = getArtPhoto(id); return photo ? [{ ...photo, title }] : []; });
export default function ArtStudio({ header, footer, emblem, onHome, onDraw, onMusic }: { header: ReactNode; footer: ReactNode; emblem: ReactNode; onHome: () => void; onDraw: () => void; onMusic: () => void }) {
  const hero = getArtPhoto('lesson');
  const [inquiry, setInquiry] = useState('');
  return <div className="studio art rybka">
    <a className="skip-link" href="#main">К содержимому</a>
    {header}
    <main id="main">
      <section className="rybka-hero rybka-container">
        <div className="rybka-hero-copy">
          <button className="back-link rybka-back" onClick={onHome}><ArrowLeft size={16} />Два мира творчества</button>
          <p className="place-label"><span />Художественная мастерская «Рыбка» · Лазаревское</p>
          <h1>Здесь можно пробовать<br /><em>и находить своё.</em></h1>
          <p className="rybka-lead">Рисование и творческие мастер-классы для детей и взрослых в Лазаревском. Без оценок, сравнений и страха испортить лист.</p>
          <div className="rybka-actions"><a className="button" href="#directions">Выбрать мастер-класс</a><a className="text-link" href={rybkaContact.max} target="_blank" rel="noreferrer">Расписание в MAX</a></div>
        </div>
        <figure className={'rybka-hero-image' + (!hero ? ' rybka-emblem-panel' : '')}>{hero ? <Image photo={hero} eager /> : <>{emblem}<span>Рисование — время для себя</span></>}</figure>
      </section>
      <section className="rybka-block rybka-container" id="about">
        <p className="section-label">О мастерской</p><h2>Лист — не экзамен.<br /><em>Поле для эксперимента.</em></h2>
        <div className="rybka-about-grid">{workshopAbout.map(({ title, text }) => <article key={title}><h3>{title}</h3><p>{text}</p></article>)}</div>
        <OptionalPhoto id="palette" className="rybka-process-photo" />
      </section>
      <section className="rybka-block rybka-container" id="directions">
        <p className="section-label">Мастер-классы</p><h2>Столько способов<br /><em>создать своё.</em></h2>
        <div className="rybka-class-grid">{masterclasses.map(item => { const Icon = icons[item.icon as keyof typeof icons]; return <article key={item.title}><Icon size={25} aria-hidden="true" /><h3>{item.title}</h3><p>{item.text}</p></article>; })}</div>
        <div className="rybka-schedule-note"><div><h3>И многое другое</h3><p>Актуальные темы и расписание на каждую неделю публикуются в группе MAX.</p></div><a className="button" href={rybkaContact.max} target="_blank" rel="noreferrer">Посмотреть расписание</a></div>
      </section>
      <section className="rybka-block rybka-formats" id="formats"><div className="rybka-container">
        <p className="section-label">Для вашей компании</p><h2>Встретимся<br /><em>за творчеством.</em></h2>
        <div className="rybka-format-grid"><article><p className="rybka-small-label">В мастерской</p><h3>Встреча для своих</h3><p>Проведём мастер-класс по вашему запросу: для своей компании, для девичника или в честь дня рождения. Тема, формат и материалы — под ваш запрос.</p><a href="#contact" className="text-link">Обсудить мастер-класс</a></article><article><p className="rybka-small-label">На выезд</p><h3>Там, где удобно вам</h3><p>Помогу организовать и провести мастер-класс для вашего мероприятия — с вашими или с моими материалами.</p><p>У вас дома, в кафе, на природе и в другом месте по вашему запросу.</p><a href="#contact" className="text-link">Обсудить выезд</a></article></div>
        <OptionalPhoto id="celebration" className="rybka-celebration-photo" />
      </div></section>
      <section className="rybka-block rybka-container rybka-pleinair"><Leaf size={38} aria-hidden="true" /><div><p className="section-label">Творческие выезды и пленэры</p><h2>За вдохновением —<br /><em>на природу.</em></h2><p>Творческие выезды на природу и рисование с натуры. О ближайших встречах и формате можно узнать у Анны.</p><a className="text-link" href="#contact">Узнать о ближайшем выезде</a></div></section>
      <section className={'rybka-block rybka-container rybka-anna' + (!getArtPhoto('anna-painting') ? ' no-photo' : '')} id="anna">
        <div className="rybka-anna-photo"><OptionalPhoto id="anna-painting" /></div>
        <div><p className="section-label">Об Анне</p><h2>Здравствуйте!<br /><em>Меня зовут Анна.</em></h2>{annaAbout.map(text => <p key={text}>{text}</p>)}<a className="text-link" href="#contact">Познакомиться и обсудить занятие</a></div>
      </section>
      {gallery.length > 0 && <section className="rybka-block rybka-container" id="gallery"><p className="section-label">В мастерской</p><h2>Здесь хочется<br /><em>создавать.</em></h2><PhotoGallery photos={gallery} label="Фотографии мастерской «Рыбка»" /></section>}
      <section className="rybka-block rybka-container rybka-artworks" id="works"><p className="section-label">Работы Анны</p><h2>Цвет, который<br /><em>можно забрать с собой.</em></h2><p className="rybka-lead">Я пишу яркие «дофаминовые» этюды с натуры — их можно приобрести.</p>
        {artworks.length > 0 ? <ArtworkCarousel works={artworks} onInquiry={setInquiry} /> : <a className="button" href="#contact">Узнать о доступных работах</a>}

      </section>
      <section className="rybka-block rybka-coloring"><div className="rybka-container"><div><p className="section-label">Попробуйте прямо сейчас</p><h2>Немного цвета.<br /><em>Много радости.</em></h2><p>Выберите иллюстрацию и раскрашивайте одним касанием. Рисунок можно продолжить позже и сохранить на устройстве.</p><button className="button" onClick={onDraw}>Открыть раскраски</button></div><button className="rybka-coloring-preview" onClick={onDraw} aria-label="Открыть раскраску бабочки"><img src={base + 'coloring/cute_butterfly.svg'} alt="Бабочка из галереи раскрасок" width="400" height="400" loading="lazy" decoding="async" /><span>Добавь свой цвет</span></button></div></section>
      <section className="rybka-block rybka-container rybka-contact" id="contact"><div><p className="section-label">Расписание и контакты</p><h2>Начнём<br /><em>с «привет»?</em></h2><p>Актуальное расписание на каждую неделю публикуется в группе MAX. Там можно узнать темы ближайших занятий.</p>{inquiry && <p className="rybka-inquiry" role="status">Хотите узнать о работе «{inquiry}»? Укажите её название при обращении к Анне.</p>}<div className="rybka-actions"><a className="button" href={rybkaContact.max} target="_blank" rel="noreferrer">Открыть группу в MAX</a><a className="text-link" href={'tel:' + rybkaContact.tel}><Phone size={18} />{rybkaContact.phone}</a></div></div><aside className="rybka-address"><MapPin size={30} aria-hidden="true" /><h3>Мастерская «Рыбка»</h3><p>{rybkaContact.address}</p><a className="text-link" href={'https://yandex.ru/maps/?text=' + encodeURIComponent(rybkaContact.address)} target="_blank" rel="noreferrer">Построить маршрут</a></aside></section>
      <section className="other-world"><button onClick={onMusic}><span>А ещё у нас есть музыка</span><strong>Студия stARTup</strong></button></section>
    </main>
    {footer}
  </div>;
}
