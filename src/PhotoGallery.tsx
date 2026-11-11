import { useEffect, useRef, useState } from 'react';
import { X } from 'lucide-react';
import PhotoCarousel, { type PhotoCarouselHandle } from './PhotoCarousel';
import Image, { type PhotoAsset } from './ResponsivePhoto';
import './PhotoGallery.css';
export type GalleryPhoto = PhotoAsset & { title: string };
export default function PhotoGallery({ photos, label, album = false, coverSizes = '(max-width: 600px) 88vw, (max-width: 1155px) calc(45vw - 12px), 508px' }: { photos: GalleryPhoto[]; label: string; album?: boolean; coverSizes?: string }) {
  const [index, setIndex] = useState<number | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const opener = useRef<HTMLButtonElement | null>(null);
  const carousel = useRef<PhotoCarouselHandle>(null);
  const isOpen = index !== null;
  useEffect(() => {
    if (!isOpen) return;
    const previousOverflow = document.body.style.overflow;
    dialog.current?.showModal();
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previousOverflow; };
  }, [isOpen]);
  function close() { dialog.current?.close(); setIndex(null); opener.current?.focus({ preventScroll: true }); }
  if (!photos.length) return null;
  return <>
    {album ? <button type="button" className="studio-album-cover" onClick={event => { opener.current = event.currentTarget; setIndex(0); }} aria-label={`Открыть альбом «${label}», ${photos.length} фото`}><Image photo={photos[0]} sizes={coverSizes} /><span className="studio-album-caption"><strong>{label}</strong><span className="studio-album-count">{photos.length} фото</span><span className="studio-album-action">Смотреть альбом</span></span></button> : <div className="studio-photo-grid">{photos.map((photo, i) => <article className="studio-photo-entry" key={photo.src}><button onClick={event => { opener.current = event.currentTarget; setIndex(i); }} aria-label={'Открыть фото: ' + photo.title}><Image photo={photo} sizes={i === photos.length - 1 && photos.length % 2 === 1 ? '88vw' : '(max-width: 600px) 88vw, 44vw'} /><span>{photo.title}</span></button></article>)}</div>}
    <dialog className="lightbox studio-photo-lightbox" ref={dialog} aria-label={label} onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) close(); }} onKeyDown={event => { if (event.key === 'ArrowLeft') { event.preventDefault(); carousel.current?.move(-1); } if (event.key === 'ArrowRight') { event.preventDefault(); carousel.current?.move(1); } }}>
      <button className="lightbox-close" onClick={close} aria-label="Закрыть фото"><X /></button>
      {index !== null && <PhotoCarousel ref={carousel} photos={photos} initialIndex={index} label={label} />}
    </dialog>
  </>;
}
