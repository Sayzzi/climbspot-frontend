import '@testing-library/jest-dom/vitest';
import '@/shared/i18n/i18n';

import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

import './geolocation';
import { server } from './server';

// MapLibre needs WebGL, which jsdom lacks: features get the fake map adapter.
vi.mock('@/shared/map/map-view', () => import('./fake-map'));

// jsdom does not implement scrolling, which the router's scroll restoration calls.
vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);

// A request without a handler is a test bug: MSW fails it and reports it instead of hitting the network.
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
