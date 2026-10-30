import { createContext, useContext, useMemo } from 'react';
import { makeT, type Lang, type T } from './lang';

export * from './lang';

const LangContext = createContext<Lang>('pt');
export const LangProvider = LangContext.Provider;
export const useLang = (): Lang => useContext(LangContext);

export function useT(): T {
  const lang = useLang();
  return useMemo(() => makeT(lang), [lang]);
}
