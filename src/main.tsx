// src/main.tsx
import React from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Index from './index';

const AppRouter: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        {/* Render Index for any hash path; Index reads location and shows the right page */}
        <Route path="/*" element={<Index />} />
      </Routes>
    </HashRouter>
  );
};

const rootEl = document.getElementById('root');
if (!rootEl) {
  throw new Error('Root element not found (expected <div id="root" />).');
}

const root = createRoot(rootEl);
root.render(<AppRouter />);
