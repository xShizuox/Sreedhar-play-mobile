import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// Monkeypatch fetch for production/Render cloud routing
const originalFetch = window.fetch;
window.fetch = function (input: RequestInfo | URL, init?: RequestInit) {
  if (typeof input === 'string') {
    if (input.startsWith('/api/') || input.startsWith('/static/')) {
      input = 'https://sreedhar-play.onrender.com' + input;
    }
  }
  return originalFetch(input, init);
};

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

