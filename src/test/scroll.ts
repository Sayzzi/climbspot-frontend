import { vi } from 'vitest';

/** `scrollTo(options)` or `scrollTo(x, y)`: true when it targets the top of the page. */
function targetsTop(args: readonly unknown[]): boolean {
  const [first, second] = args;
  if (typeof first === 'object' && first !== null) {
    return (first as ScrollToOptions).top === 0;
  }
  return first === 0 && second === 0;
}

/**
 * Watches `window.scrollTo` and tells whether something scrolled the page back to
 * its top (as the router does on navigation), ignoring scrolls further down.
 */
export function watchScrollToTop() {
  const scrollTo = vi.spyOn(window, 'scrollTo');
  scrollTo.mockClear();

  return {
    scrolledToTop: () => scrollTo.mock.calls.some((args: readonly unknown[]) => targetsTop(args)),
  };
}
