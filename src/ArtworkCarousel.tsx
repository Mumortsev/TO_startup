import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Artwork } from './artContent';
import Image from './ResponsivePhoto';
import PhotoCarousel, { type PhotoCarouselHandle } from './PhotoCarousel';
import useLoopingCarousel from './useLoopingCarousel';
import './ArtworkCarousel.css';

export function artworkLabel(work: Artwork) {
  return work.title || `Работа №${String(work.number).padStart(2, '0')}`;
}
export default function ArtworkCarousel({ works, onInquiry }: { works: Artwork[]; onInquiry: (label: string) => void }) {
  const { viewport, active, ready, looped, move } = useLoopingCarousel(works.length);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const carousel = useRef<PhotoCarouselHandle>(null);
  const [opened, setOpened] = useState<number | null>(null);
  const isOpen = opened !== null;
  const slides = looped ? [works[works.length - 1], ...works, works[0]] : works;
  useEffect(() => {
    if (!isOpen) return;
    const overflow = document.body.style.overflow;
    dialog.current?.showModal();
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = overflow; };
  }, [isOpen]);
  function close() {
    dialog.current?.close();
    setOpened(null);
    opener.current?.focus({ preventScroll: true });
  }
  function picture(work: Artwork, large = false, priority = large) {
    return <div className="artwork-frame" style={{ '--artwork-ratio': work.width / work.height } as CSSProperties}><Image photo={{ ...work, src: large ? work.image : work.thumbnail, variants: large ? undefined : work.variants?.filter(item => item.width <= Math.round(work.width * Math.min(1, 960 / Math.max(work.width, work.height)))) }} eager={priority} sizes="(min-width: 900px) 50vw, 75vw" /></div>;
  }
  if (!works.length) return null;
  return <div className="artwork-carousel" role="region" aria-roledescription="карусель" aria-label="Картины и этюды Анны">
    <div className="artwork-toolbar"><span aria-live="polite" aria-atomic="true">{active + 1} / {works.length}</span><div><button type="button" onClick={() => move(-1)} disabled={!looped} aria-label="Предыдущая картина"><ChevronLeft /></button><button type="button" onClick={() => move(1)} disabled={!looped} aria-label="Следующая картина"><ChevronRight /></button></div></div>
    <div className="artwork-track" ref={viewport} style={{ visibility: ready ? 'visible' : 'hidden' }} tabIndex={0} aria-label="Листайте картины влево и вправо" onKeyDown={event => {
      if (event.target !== event.currentTarget) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1); }
    }}>
      {slides.map((work, position) => {
        const index = looped ? (position - 1 + works.length) % works.length : position;
        const copy = looped && (position === 0 || position === slides.length - 1);
        return <article className="artwork-slide" key={`${work.id}-${position}`} data-index={index} aria-hidden={copy || undefined} aria-label={copy ? undefined : `${index + 1} из ${works.length}`} aria-roledescription={copy ? undefined : 'слайд'}>
          {copy ? <div className="artwork-open">{picture(work)}</div> : <button className="artwork-open" type="button" aria-label={`Рассмотреть: ${artworkLabel(work)}`} onClick={event => { opener.current = event.currentTarget; setOpened(index); }}>{picture(work)}</button>}
          <div className="artwork-caption"><h3>{artworkLabel(work)}</h3>{work.size && <p className="artwork-size">Размер: {work.size}</p>}{work.description && <p>{work.description}</p>}{copy ? <span className="text-link">Узнать о работе</span> : <a className="text-link" href="#contact" onClick={() => onInquiry(artworkLabel(work))}>Узнать о работе</a>}</div>
        </article>;
      })}
    </div>
    <p className="artwork-note">Рамка — пример оформления. Нажмите на картину, чтобы рассмотреть ближе.</p>
    <dialog className="artwork-dialog" ref={dialog} aria-label="Просмотр картины" onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) close(); }} onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); carousel.current?.move(event.key === 'ArrowLeft' ? -1 : 1); } }}>
      {opened !== null && <><button className="artwork-close" type="button" aria-label="Закрыть картину" onClick={close}><X /></button><PhotoCarousel ref={carousel} initialIndex={opened} label="Картины и этюды Анны" framed photos={works.map(work => ({ ...work, src: work.image, title: artworkLabel(work) + (work.size ? ` · ${work.size}` : '') }))} renderPhoto={(_, index, priority) => picture(works[index], true, priority)} /></>}
    </dialog>
  </div>;
}
