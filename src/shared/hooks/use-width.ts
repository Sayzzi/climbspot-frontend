import { useEffect, useRef, useState } from 'react';

/**
 * The width of an element in CSS pixels, followed as it changes, so that a drawing can
 * be laid out at the size it is shown (its text then keeps its size on a phone).
 * `fallback` until measured, and where the browser cannot measure (jsdom).
 */
export function useWidth<T extends Element>(fallback: number) {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(fallback);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(([entry]) => {
      if (entry && entry.contentRect.width > 0) {
        setWidth(entry.contentRect.width);
      }
    });
    observer.observe(element);
    return () => {
      observer.disconnect();
    };
  }, []);

  return { ref, width };
}
