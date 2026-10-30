import type { NoteNames } from '@/core/types';
import type { Lang, NameFn } from './lang';

/** Dó fixo: C = Dó. Em inglês, sem acento (Do Re Mi), como se escreve lá. */
const SOLFEGE: Record<Lang, Record<string, string>> = {
  pt: { C: 'Dó', D: 'Ré', E: 'Mi', F: 'Fá', G: 'Sol', A: 'Lá', B: 'Si' },
  en: { C: 'Do', D: 'Re', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Si' },
};

/**
 * Nome de nota ou acorde no formato escolhido: troca só a letra da fundamental (e do baixo,
 * em C/E); acidente, oitava e tipo do acorde ficam (C#m7 → Dó#m7, Bb4 → Sib4, C/E → Dó/Mi).
 * O app guarda e calcula sempre com letras; isto é só para a tela.
 */
export function noteNamer(mode: NoteNames, lang: Lang): NameFn {
  if (mode === 'letters') return (s) => s;
  const map = SOLFEGE[lang];
  return (symbol) => symbol.replace(/(^|\/)([A-G])/g, (_, pre: string, l: string) => pre + map[l]);
}
