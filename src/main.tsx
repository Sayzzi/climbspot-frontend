import '@/app/styles.css';
import '@/shared/i18n/i18n';

import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { App } from '@/app/app';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element #root is missing from index.html');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
