import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import { preloadTab } from './ui/pageLoaders';
import { tabFromLocation } from './ui/routes';
import { ErrorBoundary } from './ui/components/ErrorBoundary';
import { startMonitoring } from './monitoring';
import '@fontsource/bricolage-grotesque/latin-600.css';
import '@fontsource/bricolage-grotesque/latin-800.css';
import '@fontsource/instrument-sans/latin-400.css';
import '@fontsource/instrument-sans/latin-500.css';
import '@fontsource/instrument-sans/latin-600.css';
import '@fontsource/ibm-plex-mono/latin-500.css';
import './ui/styles.css';
import { inject } from '@vercel/analytics';
import { registerServiceWorker } from './registerSW';

const root = document.getElementById('root');
if (!root) throw new Error('Elemento #root não encontrado');

// O HTML já chega pré-renderizado; o app só monta por cima depois que o pacote da aba aberta
// chegou, para a troca não piscar.
const firstTab = tabFromLocation(window.location.pathname, window.location.hash);
void preloadTab(firstTab)
  .catch(() => undefined)
  .then(() =>
    createRoot(root).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    ),
  );

registerServiceWorker();
startMonitoring();

// Visitas (Vercel Web Analytics: sem cookies, sem dado pessoal). Fora da Vercel, na página
// única, o script não existe e nada é carregado.
if (__PWA__)
  inject({ mode: import.meta.env.PROD ? 'production' : 'development', framework: 'react' });
