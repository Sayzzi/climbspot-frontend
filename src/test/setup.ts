import '@testing-library/jest-dom/vitest';
import '@/shared/i18n/i18n';

import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

import { server } from './server';

// jsdom does not implement scrolling, which the router's scroll restoration calls.
vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);

// Any request without a handler is a test bug: fail loudly instead of hitting the network.
beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});

afterEach(() => {
  cleanup();
  server.resetHandlers();
  localStorage.clear();
});

afterAll(() => {
  server.close();
});
