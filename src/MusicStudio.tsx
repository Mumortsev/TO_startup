import { useState, type ReactNode } from 'react';
import { ArrowLeft, Music2, Users, Mic2, MapPin, Phone } from 'lucide-react';
import Image from './ResponsivePhoto';
import PhotoGallery from './PhotoGallery';
import { musicContact, musicDirections, musicGallery, musicIntro, musicPhoto } from './musicContent';
import './MusicStudio.css';

function EnrollmentForm() {
  const [attempted, setAttempted] = useState(false);
  return <form className="enrollment-form" onSubmit={event => { event.preventDefault(); setAttempted(true); }}>
    <label>Ваше имя или имя родителя<input name="name" autoComplete="name" required maxLength={100} /></label>
    <label>Телефон<input name="phone" type="tel" autoComplete="tel" inputMode="tel" required minLength={7} maxLength={25} /></label>
    <label>Возраст ученика (необязательно)<input name="age" type="number" inputMode="numeric" min={7} max={120} /></label>
    <p id="enrollment-note">Отправка на почту пока не подключена. Данные из формы не отправляются. Для записи позвоните нам.</p>
    <button type="submit" className="button" aria-describedby="enrollment-note">Оставить заявку</button>
    {attempted && <p role="status">Заявка не отправлена: отправка на почту ещё не подключена. Записаться можно по телефону {musicContact.phone}.</p>}
  </form>;
}
export default function MusicStudio({ header, footer, onHome, onPlay, onArt, rhythm }: { header: ReactNode; footer: ReactNode; onHome: () => void; onPlay: () => void; onArt: () => void; rhythm: ReactNode }) {
  return <div className="studio music music-client">
    <a className="skip-link" href="#main">К содержимому</a>{header}
    <main id="main">
      <section className="studio-hero">
        <div className="hero-copy"><button className="back-link music-back" onClick={onHome}><ArrowLeft size={16} />Два мира творчества</button><p className="place-label"><span />stARTup · Лазаревское</p><h1>Музыкальная<br /><em>студия.</em></h1><p className="music-subtitle">Уроки игры на гитаре, бас-гитаре и барабанной установке</p><p>{musicIntro}</p><div className="hero-actions"><a className="button" href="#directions">Выбрать инструмент</a><a className="button music-outline" href="#contact">Записаться на занятие</a></div></div>
        <figure className="hero-visual"><Image photo={musicPhoto('portrait')} eager sizes="(max-width: 760px) 90vw, 45vw" /><figcaption>Для взрослых и детей с 7 лет</figcaption></figure>
      </section>
      <section className="section directions" id="directions"><div className="section-heading"><p className="section-label">Три инструмента</p><h2>Найди<br /><em>своё звучание.</em></h2><p>Начать можно с нуля — главное желание.</p></div><div className="directions-grid">{musicDirections.map(item => <article className="direction-card" key={item.title}><div className="direction-photo"><Image photo={musicPhoto(item.photo)} sizes="(max-width: 760px) 88vw, 30vw" /></div><div className="direction-copy"><h3>{item.title}</h3><p>{item.description}</p><a href="#contact" aria-label={`Узнать о занятиях: ${item.title}`}>Подробнее</a></div></article>)}</div></section>
      <section className="section music-formats" id="formats"><div className="section-heading"><p className="section-label">Форматы занятий</p><h2>В своём темпе.<br /><em>И вместе с другими.</em></h2></div><div className="music-format-grid"><article><Music2 size={28} aria-hidden="true" /><h3>Индивидуальные</h3><p>Под ваш уровень, темп и цели.</p></article><article><Users size={28} aria-hidden="true" /><h3>Групповые</h3><p>Играть вместе интереснее и полезнее: учишься слышать других и держать свою партию.</p></article></div><div className="music-audience"><strong>Для взрослых и детей с 7 лет.</strong><p>Начать можно с нуля — главное желание.</p><a className="button music-outline" href="#contact">Обсудить занятия</a></div></section>
      <section className="section music-stage"><div><p className="section-label">Что ещё вас ждёт</p><h2>Своя группа.<br /><em>Настоящая сцена.</em></h2><article><Users size={24} aria-hidden="true" /><div><h3>Создайте музыкальную группу</h3><p>Из учеников студии или с друзьями.</p></div></article><article><Mic2 size={24} aria-hidden="true" /><div><h3>Концерты и выступления</h3><p>Отчётные концерты и выступления — реальная сцена, а не только занятия в классе.</p></div></article></div><Image photo={musicPhoto('performance')} /></section>
      <section className="experience section"><div className="experience-copy"><p className="section-label">Попробуйте прямо сейчас</p><h2>Твой первый трек?<br /><em>Почему бы и да.</em></h2><p>Выбери жанр и нажимай на квадратики. Придумай свой ритм с барабанами, гитарой и басом и скачай готовую музыку.</p><button onClick={onPlay} className="button">Открыть секвенсор</button><span className="experience-hint">Без регистрации. Просто попробуй.</span></div><div className="rhythm-demo"><span className="rhythm-brand">stARTup / playground</span>{rhythm}<span className="rhythm-caption">Сначала ритм. Потом всё остальное.</span></div></section>
      <section className="section atmosphere" id="gallery"><div className="section-heading"><p className="section-label">В студии и за инструментами</p><h2>Место,<br /><em>где звучит музыка.</em></h2></div><PhotoGallery photos={musicGallery} label="Фотографии музыкальной студии" /></section>
      <section className="contact-section section" id="contact"><div><p className="section-label">Запись и контакты</p><h2>Начнём<br /><em>с первого звука.</em></h2><p>Позвоните — расскажем о занятиях и поможем выбрать инструмент и формат.</p><div className="contact-actions"><a href={'tel:' + musicContact.tel} className="button"><Phone size={17} />{musicContact.phone}</a></div><EnrollmentForm /></div><aside className="visit-card"><span className="visit-icon"><MapPin size={30} /></span><h3>stARTup</h3><p>{musicContact.address}</p><a href={'https://yandex.ru/maps/?text=' + encodeURIComponent(musicContact.address)} target="_blank" rel="noreferrer">Построить маршрут</a></aside></section>
      <section className="other-world"><button onClick={onArt}><span>А ещё у нас есть искусство</span><strong>Мастерская «Рыбка»</strong></button></section>
    </main>{footer}
  </div>;
}
