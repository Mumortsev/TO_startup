import { useCallback, useLayoutEffect, useRef, useState } from 'react';

export default function useLoopingCarousel(count: number, initialIndex = 0) {
  const viewport = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(initialIndex);
  const [ready, setReady] = useState(false);
  const looped = count > 1;
  useLayoutEffect(() => {
    const node = viewport.current;
    if (!node || !count) return;
    const items = Array.from(node.children) as HTMLElement[];
    let timer: ReturnType<typeof setTimeout>;
    let frame = 0;
    let touching = false;
    let initialised = false;
    setReady(false);
    function initialise() {
      // Dialog contents are mounted before showModal; wait until they have width.
      if (!node!.clientWidth) { frame = requestAnimationFrame(initialise); return; }
      const index = Math.max(0, Math.min(count - 1, initialIndex));
      node!.scrollTo({ left: items[index + (looped ? 1 : 0)].offsetLeft, behavior: 'instant' });
      initialised = true;
      setActive(index);
      setReady(true);
    }
    function normalise() {
      if (!looped || touching || !initialised) return;
      const last = items.length - 1;
      const target = Math.abs(node!.scrollLeft - items[0].offsetLeft) < 2 ? count
        : Math.abs(node!.scrollLeft - items[last].offsetLeft) < 2 ? 1 : null;
      if (target !== null) node!.scrollTo({ left: items[target].offsetLeft, behavior: 'instant' });
    }
    function schedule() { clearTimeout(timer); timer = setTimeout(normalise, 180); }
    function startTouch() { touching = true; }
    function endTouch() { touching = false; schedule(); }
    const observer = new IntersectionObserver(entries => {
      if (!initialised) return;
      for (const entry of entries) if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index));
    }, { root: node, threshold: .65 });
    items.forEach(item => observer.observe(item));
    node.addEventListener('scroll', schedule, { passive: true });
    node.addEventListener('scrollend', normalise);
    node.addEventListener('touchstart', startTouch, { passive: true });
    node.addEventListener('touchend', endTouch, { passive: true });
    node.addEventListener('touchcancel', endTouch, { passive: true });
    initialise();
    return () => {
      cancelAnimationFrame(frame);
      clearTimeout(timer);
      observer.disconnect();
      node.removeEventListener('scroll', schedule);
      node.removeEventListener('scrollend', normalise);
      node.removeEventListener('touchstart', startTouch);
      node.removeEventListener('touchend', endTouch);
      node.removeEventListener('touchcancel', endTouch);
    };
  }, [count, initialIndex, looped]);
  const move = useCallback((delta: number) => {
    const node = viewport.current;
    if (!node || count < 2 || !node.clientWidth) return;
    const items = Array.from(node.children) as HTMLElement[];
    let current = items.reduce((closest, item, index) => Math.abs(item.offsetLeft - node.scrollLeft) < Math.abs(items[closest].offsetLeft - node.scrollLeft) ? index : closest, 0);
    if (current === 0 || current === items.length - 1) {
      current = current === 0 ? count : 1;
      node.scrollTo({ left: items[current].offsetLeft, behavior: 'instant' });
    }
    node.scrollTo({ left: items[current + delta].offsetLeft, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }, [count]);
  return { viewport, active, ready, looped, move };
}
