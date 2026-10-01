import '@testing-library/jest-dom/vitest';
import '@/shared/i18n/i18n';

import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';

// jsdom does not implement scrolling, which the router's scroll restoration calls.
vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);

afterEach(() => {
  cleanup();
});
