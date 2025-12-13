import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import Index from './pages';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Root element (#root) not found');
}

createRoot(rootElement).render(
  <React.StrictMode>
    <HashRouter>
      <Index />
    </HashRouter>
  </React.StrictMode>
);
