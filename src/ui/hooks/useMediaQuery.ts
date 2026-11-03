import { useSyncExternalStore } from 'react';

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const mql = window.matchMedia(query);
      mql.addEventListener('change', onChange);
      return () => mql.removeEventListener('change', onChange);
    },
    () => window.matchMedia(query).matches,
    () => false,
  );
}

/** Celular deitado: tela baixa e larga. O braço vira janela de 5 casas e os acordes sobem. */
export const LANDSCAPE_PHONE = '(max-height: 540px) and (orientation: landscape)';
export const useLandscapePhone = () => useMediaQuery(LANDSCAPE_PHONE);
