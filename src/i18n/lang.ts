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

/**
 * Marca um nome de nota ou acorde dentro de um texto (`nm('G7')`), para a tela trocar pelo
 * nome no formato escolhido (G7 ou Sol7). Sem troca, só some a marca.
 */
export const nm = (symbol: string): string => `\u27e6${symbol}\u27e7`;
const NAME_RE = /\u27e6([^\u27e7]*)\u27e7/g;
export type NameFn = (symbol: string) => string;
const plain: NameFn = (s) => s;
export const renderNames = (text: string, names: NameFn = plain): string =>
  text.includes('\u27e6') ? text.replace(NAME_RE, (_, sym: string) => names(sym)) : text;

export function makeT(lang: Lang, names: NameFn = plain): T {
  return ((a: Txt | string, b?: string) => {
    const text = typeof a !== 'string' ? a[lang] : b === undefined || lang === 'pt' ? a : b;
    return renderNames(text, names);
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
