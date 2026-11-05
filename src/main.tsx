import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// Hash-based URLs (/#/book) so every page works on static hosting such as GitHub Pages.
import { HashRouter } from 'react-router';
import App from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </StrictMode>,
);
