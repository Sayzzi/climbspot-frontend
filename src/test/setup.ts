import '@testing-library/jest-dom/vitest';
import './node-files';
import '@/shared/i18n/i18n';

import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach, vi } from 'vitest';

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

// Most tests are of a returning Visitor, the search open on the map; the welcome
// screen's own tests clear this to see it as a first visit does.
beforeEach(() => {
  localStorage.setItem('climbspot.welcomed', 'yes');
});

afterEach(() => {
  fakeAuth.reset();
  cleanup();
  server.resetHandlers();
  localStorage.clear();
  sessionStorage.clear();
});

afterAll(() => {
  server.close();
});
