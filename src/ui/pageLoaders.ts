/** Abas fora da inicial vêm em pacotes separados; `preloadTab` baixa a aba aberta antes de montar. */
import { lazyPage } from './lazyPage';
import type { TabId } from './routes';

export const JamPage = lazyPage(() => import('./pages/JamPage').then((m) => m.JamPage));
export const EarPage = lazyPage(() => import('./pages/EarPage').then((m) => m.EarPage));
export const SettingsPage = lazyPage(() =>
  import('./pages/SettingsPage').then((m) => m.SettingsPage),
);

/** Baixa o pacote da aba antes de montar o app, para ela aparecer já completa. */
export function preloadTab(tab: TabId): Promise<unknown> {
  if (tab === 'jam') return JamPage.preload();
  if (tab === 'ouvido') return EarPage.preload();
  if (tab === 'ajustes') return SettingsPage.preload();
  return Promise.resolve();
}
