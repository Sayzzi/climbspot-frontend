import { vi } from 'vitest';

/**
 * Watches `window.scrollTo` and tells whether something scrolled the page back to
 * its top (as the router does on navigation), ignoring scrolls further down.
 */
export function watchScrollToTop() {
  const scrollTo = vi.spyOn(window, 'scrollTo');
  scrollTo.mockClear();

  return {
    scrolledToTop: () =>
      scrollTo.mock.calls.some(([first, second]) =>
        typeof first === 'object' ? first.top === 0 : first === 0 && second === 0,
      ),
  };
}
