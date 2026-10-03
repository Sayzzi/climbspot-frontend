import '@testing-library/jest-dom/vitest';
import '@/shared/i18n/i18n';

import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';

import './downloads';
import './geolocation';
import './languages';
import { fakeAuth } from './fake-auth';
import { server } from './server';

// MapLibre needs WebGL, which jsdom lacks: features get the fake map adapter.
vi.mock('@/shared/map/map-view', () => import('./fake-map'));

// Signing in goes through Supabase: tests drive a fake instead.
vi.mock('@/shared/auth/auth-client', () => import('./fake-auth'));

// jsdom does not implement scrolling, which the router's scroll restoration calls.
vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);

// A request without a handler is a test bug: MSW fails it and reports it instead of hitting the network.
beforeAll(() => {
  server.listen({ onUnhandledFrame: 'error' });
});

afterEach(() => {
  fakeAuth.reset();
  cleanup();
  server.resetHandlers();
  localStorage.clear();
});

afterAll(() => {
  server.close();
});
