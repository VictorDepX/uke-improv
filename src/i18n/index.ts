import { createContext, useContext, useMemo } from 'react';
import { useMusicStore } from '@/store/useMusicStore';
import { makeT, type Lang, type NameFn, type T } from './lang';
import { noteNamer } from './names';

export * from './lang';
export { noteNamer } from './names';

const LangContext = createContext<Lang>('pt');
export const LangProvider = LangContext.Provider;
export const useLang = (): Lang => useContext(LangContext);

/** Nome de nota ou acorde para a tela (C ou Dó, conforme o ajuste). */
export function useNames(): NameFn {
  const lang = useLang();
  const mode = useMusicStore((s) => s.settings.noteNames);
  return useMemo(() => noteNamer(mode, lang), [mode, lang]);
}

/** Texto no idioma da tela; nomes marcados com `nm` saem no formato escolhido. */
export function useT(): T {
  const lang = useLang();
  const names = useNames();
  return useMemo(() => makeT(lang, names), [lang, names]);
}
