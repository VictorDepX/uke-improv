/**
 * Idiomas do app. Cada texto é escrito nos dois idiomas no próprio lugar onde aparece:
 * `t('Salvar', 'Save')` na interface e `tx('…', '…')` no núcleo, que devolve os dois para a
 * interface escolher. Assim nenhum texto fica sem tradução (o tipo exige as duas) e não há
 * arquivo de chaves para manter em sincronia.
 */
export type Lang = 'pt' | 'en';
export const LANGS: readonly Lang[] = ['pt', 'en'];

/** Texto nos dois idiomas, para módulos que não sabem qual idioma está na tela. */
export interface Txt {
  pt: string;
  en: string;
}
export const tx = (pt: string, en: string): Txt => ({ pt, en });

export interface T {
  (pt: string, en: string): string;
  (text: Txt | string): string;
}

export function makeT(lang: Lang): T {
  return ((a: Txt | string, b?: string) => {
    if (typeof a !== 'string') return a[lang];
    return b === undefined || lang === 'pt' ? a : b;
  }) as T;
}

/** Atributo `lang` do HTML para cada idioma. */
export const HTML_LANG: Record<Lang, string> = { pt: 'pt-BR', en: 'en' };
export const LOCALE = HTML_LANG;

export const isLang = (v: unknown): v is Lang => v === 'pt' || v === 'en';

// Para código fora do React (avisos, mensagens do microfone e da sincronização): o App
// atualiza este valor sempre que o idioma da tela muda.
let current: Lang = 'pt';
export const setCurrentLang = (lang: Lang) => {
  current = lang;
};
export const currentLang = (): Lang => current;
/** Mesmo que `t`, no idioma que está na tela agora. */
export const tNow: T = ((a: Txt | string, b?: string) =>
  makeT(current)(a as string, b as string)) as T;
