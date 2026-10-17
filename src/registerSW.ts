/** Registra o service worker para o app abrir sem internet. Falha em silêncio. */
export function registerServiceWorker(): void {
  if (!__PWA__ || !import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => undefined);
  });
}
