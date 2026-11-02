import { tNow } from '@/i18n/lang';
import { toast } from '@/ui/toast';

/**
 * Registra o service worker para o app abrir sem internet. Falha em silêncio. Quando uma versão
 * nova assume (o worker novo pula a espera), a página aberta ainda roda a antiga: avisa e
 * oferece recarregar, sem interromper quem está tocando.
 */
export function registerServiceWorker(): void {
  if (!__PWA__ || !import.meta.env.PROD || !('serviceWorker' in navigator)) return;
  const hadController = Boolean(navigator.serviceWorker.controller);
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!hadController) return; // primeira instalação: a página já é a versão nova
    toast.info(
      tNow('Nova versão do Uke Improv disponível.', 'A new version of Uke Improv is available.'),
      {
        label: tNow('Atualizar', 'Update'),
        run: () => location.reload(),
      },
    );
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => undefined);
  });
}
