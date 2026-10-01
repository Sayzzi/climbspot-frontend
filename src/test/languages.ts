import { beforeEach } from 'vitest';

/** Sets the browser's preferred languages (`navigator.languages`). */
export function stubLanguages(...languages: string[]): void {
  Object.defineProperty(navigator, 'languages', { configurable: true, value: languages });
  Object.defineProperty(navigator, 'language', { configurable: true, value: languages[0] });
}

// jsdom reports US English; default tests to a metric locale, as most Visitors use.
beforeEach(() => {
  stubLanguages('en-GB');
});
