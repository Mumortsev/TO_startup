import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import type { Artwork } from './artContent';
import './ArtworkCarousel.css';

export function artworkLabel(work: Artwork) {
  return work.title || `Работа №${String(work.number).padStart(2, '0')}`;
}
export default function ArtworkCarousel({ works, onInquiry }: { works: Artwork[]; onInquiry: (label: string) => void }) {
  const viewport = useRef<HTMLDivElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const [active, setActive] = useState(0);
  const [opened, setOpened] = useState<number | null>(null);
  const isOpen = opened !== null;
  useEffect(() => {
    const node = viewport.current;
    if (!node) return;
    const observer = new IntersectionObserver(entries => {
      for (const entry of entries) if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
    }, { root: node, threshold: .65 });
    Array.from(node.children).forEach(child => observer.observe(child));
    return () => observer.disconnect();
  }, [works.length]);
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
    const index = Math.max(0, Math.min(works.length - 1, active + delta));
    const node = viewport.current;
    const slide = node?.children[index] as HTMLElement | undefined;
    if (node && slide) node.scrollTo({ left: slide.offsetLeft, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }
  function moveOpened(delta: number) {
    setOpened(index => index === null ? null : (index + delta + works.length) % works.length);
  }
  function picture(work: Artwork, large = false) {
    return <div className="artwork-frame"><img src={large ? work.image : work.thumbnail} alt={work.alt} width={work.width} height={work.height} loading={large ? 'eager' : 'lazy'} decoding="async" /></div>;
  }
  if (!works.length) return null;
  return <div className="artwork-carousel" role="region" aria-roledescription="карусель" aria-label="Картины и этюды Анны">
    <div className="artwork-toolbar"><span aria-live="polite" aria-atomic="true">{active + 1} / {works.length}</span><div><button type="button" onClick={() => move(-1)} disabled={active === 0} aria-label="Предыдущая картина"><ChevronLeft /></button><button type="button" onClick={() => move(1)} disabled={active === works.length - 1} aria-label="Следующая картина"><ChevronRight /></button></div></div>
    <div className="artwork-track" ref={viewport} tabIndex={0} aria-label="Листайте картины влево и вправо" onKeyDown={event => {
      if (event.target !== event.currentTarget) return;
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); move(event.key === 'ArrowLeft' ? -1 : 1); }
    }}>
      {works.map((work, index) => <article className="artwork-slide" key={work.id} data-index={index} aria-label={`${index + 1} из ${works.length}`} aria-roledescription="слайд">
        <button className="artwork-open" type="button" aria-label={`Рассмотреть: ${artworkLabel(work)}`} onClick={event => { opener.current = event.currentTarget; setOpened(index); }}>{picture(work)}</button>
        <div className="artwork-caption"><h3>{artworkLabel(work)}</h3>{work.size && <p className="artwork-size">Размер: {work.size}</p>}{work.description && <p>{work.description}</p>}<a className="text-link" href="#contact" onClick={() => onInquiry(artworkLabel(work))}>Узнать о работе</a></div>
      </article>)}
    </div>
    <p className="artwork-note">Рамка — пример оформления. Нажмите на картину, чтобы рассмотреть ближе.</p>
    <dialog className="artwork-dialog" ref={dialog} aria-label="Просмотр картины" onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) close(); }} onKeyDown={event => { if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') { event.preventDefault(); moveOpened(event.key === 'ArrowLeft' ? -1 : 1); } }}>
      {opened !== null && <><button className="artwork-close" type="button" aria-label="Закрыть картину" onClick={close}><X /></button><div className="artwork-enlarged"><button type="button" aria-label="Предыдущая картина" onClick={() => moveOpened(-1)} disabled={works.length < 2}><ChevronLeft /></button><figure>{picture(works[opened], true)}<figcaption>{artworkLabel(works[opened])}{works[opened].size && ` · ${works[opened].size}`}<span>{opened + 1} / {works.length}</span></figcaption></figure><button type="button" aria-label="Следующая картина" onClick={() => moveOpened(1)} disabled={works.length < 2}><ChevronRight /></button></div></>}
    </dialog>
  </div>;
}
