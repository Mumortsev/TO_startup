import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Artwork } from './artContent';
import Image from './ResponsivePhoto';
import './ArtworkCarousel.css';

export function artworkLabel(work: Artwork) {
  return work.title || `Работа №${String(work.number).padStart(2, '0')}`;
}
export default function ArtworkCarousel({ works, onInquiry }: { works: Artwork[]; onInquiry: (label: string) => void }) {
  const viewport = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const [active, setActive] = useState(0);
  const [opened, setOpened] = useState<number | null>(null);
  const isOpen = opened !== null;
  const looped = works.length > 1;
  const slides = looped ? [works[works.length - 1], ...works, works[0]] : works;
  useLayoutEffect(() => {
    const node = viewport.current;
    if (!node || !works.length) return;
    const items = Array.from(node.children) as HTMLElement[];
    let timer: ReturnType<typeof setTimeout>;
    let touching = false;
    // Boundary copies make the last-to-first swipe one ordinary slide long.
    node.scrollTo({ left: items[looped ? 1 : 0].offsetLeft, behavior: 'instant' });
    function normalise() {
      if (!looped || touching) return;
      const last = items.length - 1;
      const target = Math.abs(node!.scrollLeft - items[0].offsetLeft) < 2 ? works.length
        : Math.abs(node!.scrollLeft - items[last].offsetLeft) < 2 ? 1 : null;
      if (target !== null) node!.scrollTo({ left: items[target].offsetLeft, behavior: 'instant' });
    }
    function schedule() { clearTimeout(timer); timer = setTimeout(normalise, 180); }
    function startTouch() { touching = true; }
    function endTouch() { touching = false; schedule(); }
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
    }, { root: node, threshold: .65 });
    items.forEach(child => observer.observe(child));
    node.addEventListener('scroll', schedule, { passive: true });
    node.addEventListener('scrollend', normalise);
    node.addEventListener('touchstart', startTouch, { passive: true });
    node.addEventListener('touchend', endTouch, { passive: true });
    node.addEventListener('touchcancel', endTouch, { passive: true });
    return () => {
      clearTimeout(timer);
      observer.disconnect();
      node.removeEventListener('scroll', schedule);
      node.removeEventListener('scrollend', normalise);
      node.removeEventListener('touchstart', startTouch);
      node.removeEventListener('touchend', endTouch);
      node.removeEventListener('touchcancel', endTouch);
    };
  }, [works.length, looped]);
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
  function move(delta: number) {
    const node = viewport.current;
    if (!node || !looped) return;
    const items = Array.from(node.children) as HTMLElement[];
    let current = items.reduce((closest, item, index) => Math.abs(item.offsetLeft - node.scrollLeft) < Math.abs(items[closest].offsetLeft - node.scrollLeft) ? index : closest, 0);
    if (current === 0 || current === items.length - 1) {
      current = current === 0 ? works.length : 1;
      node.scrollTo({ left: items[current].offsetLeft, behavior: 'instant' });
    }
    const slide = items[current + delta];
    node.scrollTo({ left: slide.offsetLeft, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
  function moveOpened(delta: number) {
    setOpened(index => index === null ? null : (index + delta + works.length) % works.length);
  }
  function picture(work: Artwork, large = false) {
    return <div className="artwork-frame"><Image photo={{ ...work, src: large ? work.image : work.thumbnail, variants: large ? undefined : work.variants?.filter(item => item.width <= Math.round(work.width * Math.min(1, 960 / Math.max(work.width, work.height)))) }} eager={large} sizes="(min-width: 900px) 50vw, 75vw" /></div>;
  }
  if (!works.length) return null;
  return <div className="artwork-carousel" role="region" aria-roledescription="карусель" aria-label="Картины и этюды Анны">
    <div className="artwork-toolbar"><span aria-live="polite" aria-atomic="true">{active + 1} / {works.length}</span><div><button type="button" onClick={() => move(-1)} disabled={!looped} aria-label="Предыдущая картина"><ChevronLeft /></button><button type="button" onClick={() => move(1)} disabled={!looped} aria-label="Следующая картина"><ChevronRight /></button></div></div>
    <div className="artwork-track" ref={viewport} tabIndex={0} aria-label="Листайте картины влево и вправо" onKeyDown={event => {
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
    <dialog className="artwork-dialog" ref={dialog} aria-label="Просмотр картины" onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) close(); }} onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); moveOpened(event.key === 'ArrowLeft' ? -1 : 1); } }}>
      {opened !== null && <><button className="artwork-close" type="button" aria-label="Закрыть картину" onClick={close}><X /></button><div className="artwork-enlarged" onTouchStart={event => {
        const point = event.touches[0];
        touch.current = event.touches.length === 1 ? { x: point.clientX, y: point.clientY } : null;
      }} onTouchCancel={() => { touch.current = null; }} onTouchEnd={event => {
        const start = touch.current;
        touch.current = null;
        if (!start) return;
        const point = event.changedTouches[0];
        const x = point.clientX - start.x, y = point.clientY - start.y;
        if (Math.abs(x) > 60 && Math.abs(x) > Math.abs(y) * 1.5) moveOpened(x < 0 ? 1 : -1);
      }}><button type="button" aria-label="Предыдущая картина" onClick={() => moveOpened(-1)} disabled={works.length < 2}><ChevronLeft /></button><figure>{picture(works[opened], true)}<figcaption>{artworkLabel(works[opened])}{works[opened].size && ` · ${works[opened].size}`}<span>{opened + 1} / {works.length}</span></figcaption></figure><button type="button" aria-label="Следующая картина" onClick={() => moveOpened(1)} disabled={works.length < 2}><ChevronRight /></button></div></>}
    </dialog>
  </div>;
}
