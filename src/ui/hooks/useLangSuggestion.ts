import { useSyncExternalStore } from 'react';
import type { Lang } from '@/i18n';
import { useMusicStore } from '@/store/useMusicStore';

/** Idioma do navegador, entre os do app; null se não for nenhum dos dois. */
function browserLang(): Lang | null {
  for (const l of navigator.languages ?? [navigator.language]) {
    const base = l.toLowerCase().slice(0, 2);
    if (base === 'pt') return 'pt';
    if (base === 'en') return 'en';
  }
  return null;
}

const noop = () => () => undefined;

/**
 * Idioma a oferecer para quem chega com o navegador em outro idioma, ou null (já escolheu,
 * ou o navegador está no idioma da página).
 */
export function useLangSuggestion(lang: Lang): Lang | null {
  const chosen = useMusicStore((s) => s.settings.lang);
  // Só no navegador: o HTML pré-renderizado não sabe o idioma de quem abre.
  const browser = useSyncExternalStore(noop, browserLang, () => undefined);
  // Navegador em outro idioma (nem pt nem en): o inglês serve mais que o português.
  const want = browser === undefined ? null : (browser ?? 'en');
  return !chosen && want && want !== lang ? want : null;
}
