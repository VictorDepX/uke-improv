import { buildNoteContext, classifyNote } from './classify';
import { mod12 } from './music';
import type { KeyContext, NoteClass } from './types';

/** Uma nota detectada durante a gravação. */
export interface TakeNote {
  /** Segundos desde o começo da gravação. */
  t: number;
  midi: number;
  /** Acorde que soava quando a nota entrou. */
  chord: string;
  cls: NoteClass;
  /** Posição deduzida no braço (corda e casa a partir do capo), quando houver. */
  pos?: { string: number; fret: number };
}

/** Classifica a nota como o braço mostrava naquele momento. */
export function takeNote(
  t: number,
  midi: number,
  key: KeyContext,
  chord: string,
  arpeggio = false,
  pos?: { string: number; fret: number },
): TakeNote {
  return {
    t,
    midi,
    chord,
    cls: classifyNote(mod12(midi), buildNoteContext(key, chord, arpeggio)),
    ...(pos ? { pos } : {}),
  };
}

/** Índice da nota que soa no instante `t` (a última que entrou até ali), ou −1. */
export function noteIndexAt(notes: readonly TakeNote[], t: number): number {
  let lo = 0;
  let hi = notes.length - 1;
  let found = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (notes[mid]!.t <= t) {
      found = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return found;
}

export interface TakeSummary {
  total: number;
  byClass: Record<NoteClass, number>;
  /** Fração das notas que são do acorde. */
  chordTones: number;
  /** Fração das notas dentro da escala (tudo menos "fora"). */
  inScale: number;
  /** Tensões seguidas, logo depois, por nota do acorde a até um tom. */
  tensions: number;
  resolved: number;
  /** Maior sequência de notas fora da escala. */
  longestOut: number;
}

export function summarizeTake(notes: readonly TakeNote[]): TakeSummary {
  const byClass: Record<NoteClass, number> = { repouso: 0, passagem: 0, tensao: 0, fora: 0 };
  let tensions = 0;
  let resolved = 0;
  let run = 0;
  let longestOut = 0;
  notes.forEach((n, i) => {
    byClass[n.cls] += 1;
    if (n.cls === 'fora') {
      run += 1;
      longestOut = Math.max(longestOut, run);
    } else run = 0;
    if (n.cls === 'tensao') {
      tensions += 1;
      const next = notes[i + 1];
      if (
        next &&
        next.cls === 'repouso' &&
        Math.abs(next.midi - n.midi) <= 2 &&
        next.midi !== n.midi
      )
        resolved += 1;
    }
  });
  const total = notes.length;
  return {
    total,
    byClass,
    chordTones: total ? byClass.repouso / total : 0,
    inScale: total ? (total - byClass.fora) / total : 0,
    tensions,
    resolved,
    longestOut,
  };
}

/** Uma frase curta sobre a gravação, com o ponto mais útil para a próxima. */
export function takeAdvice(s: TakeSummary): string {
  if (s.total === 0) return 'Nenhuma nota detectada. Calibre o microfone ou toque mais perto dele.';
  if (s.inScale < 0.75)
    return 'Muitas notas fora da escala. Tente o exercício "Só repouso" e volte a gravar.';
  if (s.tensions > 0 && s.resolved / s.tensions < 0.5)
    return 'Boa parte das tensões ficou sem resolver: depois de uma laranja, desça ou suba para uma verde.';
  if (s.chordTones < 0.3)
    return 'Pouca nota do acorde: termine as frases numa verde para soar mais resolvido.';
  return 'Frases dentro do tom e tensões resolvidas. Tente variar o ritmo na próxima.';
}
