/** Whether the Visitor asked the system to minimise animations. */
export function prefersReducedMotion(): boolean {
  // `matchMedia` is missing in some environments (e.g. jsdom).
  return typeof window.matchMedia === 'function'
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
    : false;
}
