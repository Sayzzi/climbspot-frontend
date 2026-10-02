import { useEffect, useState } from 'react';

const read = () => Math.min(1, Math.max(0, window.scrollY / Math.max(window.innerHeight, 1)));

/** 0 at the top of the page, 1 once the Visitor has scrolled one screen down. */
export function useScrollProgress(): number {
  const [progress, setProgress] = useState(read);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setProgress(read());
      });
    };
    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
    };
  }, []);

  return progress;
}

/** Whether the Visitor asked the system to minimise animations. */
export function prefersReducedMotion(): boolean {
  // `matchMedia` is missing in some environments (e.g. jsdom).
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}
