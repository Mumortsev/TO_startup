import { forwardRef, useImperativeHandle, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Image, { type PhotoAsset } from './ResponsivePhoto';
import useLoopingCarousel from './useLoopingCarousel';
import './PhotoCarousel.css';
export type CarouselPhoto = PhotoAsset & { title: string };
export type PhotoCarouselHandle = { move: (delta: number) => void };
type Props = {
  photos: CarouselPhoto[];
  initialIndex: number;
  label: string;
  framed?: boolean;
  renderPhoto?: (photo: CarouselPhoto, index: number, priority: boolean) => ReactNode;
};
const PhotoCarousel = forwardRef<PhotoCarouselHandle, Props>(function PhotoCarousel({ photos, initialIndex, label, framed = false, renderPhoto }, ref) {
  const { viewport, active, ready, looped, move } = useLoopingCarousel(photos.length, initialIndex);
  useImperativeHandle(ref, () => ({ move }), [move]);
  if (!photos.length) return null;
  const slides = looped ? [photos[photos.length - 1], ...photos, photos[0]] : photos;
  return <div className={'photo-carousel' + (framed ? ' photo-carousel-framed' : '')} role="region" aria-roledescription="карусель" aria-label={label}>
    <button className="photo-carousel-arrow photo-carousel-prev" type="button" aria-label="Предыдущее фото" onClick={() => move(-1)} disabled={!looped}><ChevronLeft /></button>
    <div className="photo-carousel-track" ref={viewport} style={{ visibility: ready ? 'visible' : 'hidden' }}>
      {slides.map((photo, position) => {
        const index = looped ? (position - 1 + photos.length) % photos.length : position;
        const copy = looped && (position === 0 || position === slides.length - 1);
        const distance = Math.abs(index - active);
        // Load only the visible photograph and its neighbours, including wraparound.
        const nearby = Math.min(distance, photos.length - distance) <= 1;
        return <div className="photo-carousel-slide" key={`${photo.src}-${position}`} data-index={index} aria-hidden={copy || index !== active || undefined} aria-roledescription="слайд" aria-label={`${index + 1} из ${photos.length}`}><figure>{nearby && (renderPhoto ? renderPhoto(photo, index, index === active) : <Image photo={photo} eager={index === active} sizes="(max-width: 600px) 96vw, 90vw" />)}</figure></div>;
      })}
    </div>
    <button className="photo-carousel-arrow photo-carousel-next" type="button" aria-label="Следующее фото" onClick={() => move(1)} disabled={!looped}><ChevronRight /></button>
    <div className="photo-carousel-caption" aria-live="polite" aria-atomic="true"><span>{photos[active].title}</span><span>{active + 1} / {photos.length}</span></div>
  </div>;
});
export default PhotoCarousel;
