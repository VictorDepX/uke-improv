import { tx, type Txt } from '@/i18n/lang';
import { mod12 } from './music';
import type { FretPosition, TuningName } from './types';

export const FRET_COUNT = 15;

/** MIDI das cordas soltas, da 4ª (G) para a 1ª (A). */
export const TUNINGS: Record<TuningName, { label: Txt; open: readonly number[] }> = {
  GCEA: { label: tx('GCEA (G agudo)', 'GCEA (high G)'), open: [67, 60, 64, 69] },
  'GCEA-lowG': { label: tx('GCEA (G grave)', 'GCEA (low G)'), open: [55, 60, 64, 69] },
};

export const STRING_NAMES = ['G', 'C', 'E', 'A'] as const;

/** Casas com marcação no braço. */
export const INLAY_FRETS = new Set([5, 7, 10, 12, 15]);

/** Maior casa em que o capotraste pode ficar. */
export const MAX_CAPO = 7;

const cache = new Map<string, FretPosition[]>();

/**
 * Todas as posições do braço. Com capotraste, `fret` conta a partir dele
 * (0 = corda presa pelo capo) e as cordas soltas soam `capo` semitons acima.
 */
export function fretPositions(tuning: TuningName, capo = 0): FretPosition[] {
  const cacheKey = `${tuning}|${capo}`;
  const cached = cache.get(cacheKey);
  if (cached) return cached;
  const positions: FretPosition[] = [];
  TUNINGS[tuning].open.forEach((open, string) => {
    for (let fret = 0; fret <= FRET_COUNT - capo; fret++) {
      const midi = open + capo + fret;
      positions.push({ string, fret, midi, chroma: mod12(midi) });
    }
  });
  cache.set(cacheKey, positions);
  return positions;
}

export function midiRange(tuning: TuningName, capo = 0): { min: number; max: number } {
  const open = TUNINGS[tuning].open;
  return { min: Math.min(...open) + capo, max: Math.max(...open) + FRET_COUNT };
}

/** Posição de uma nota mais próxima de uma casa de referência (para o dedo andar pouco). */
export function nearestPosition(
  midi: number,
  tuning: TuningName,
  nearFret: number | null,
  capo = 0,
): FretPosition | undefined {
  const options = fretPositions(tuning, capo).filter((p) => p.midi === midi);
  if (options.length === 0) return undefined;
  const ref = nearFret ?? 0;
  return options.reduce((best, p) =>
    Math.abs(p.fret - ref) < Math.abs(best.fret - ref) ? p : best,
  );
}

/** Quantas casas a janela de prática mostra (além das cordas soltas). */
export const WINDOW_SIZE = 5;

/** Maior casa inicial possível para a janela (sem capo). */
export const MAX_WINDOW_START = FRET_COUNT - WINDOW_SIZE + 1;

/** Maior casa inicial da janela, contando a partir do capo. */
export const maxWindowStart = (capo = 0): number => MAX_WINDOW_START - capo;

export const clampWindowStart = (start: number, capo = 0): number =>
  Math.min(maxWindowStart(capo), Math.max(1, Math.round(start)));

/**
 * Janela que segue a mão: só muda quando a casa tocada sai da janela atual
 * (histerese), e então recentra a casa na janela. Cordas soltas não movem a janela.
 */
export function followWindow(start: number, fret: number, capo = 0): number {
  if (fret <= 0) return start;
  if (fret >= start && fret < start + WINDOW_SIZE) return start;
  return clampWindowStart(fret - Math.floor(WINDOW_SIZE / 2), capo);
}

/** Onde a mão está: corda e casa (contando a partir do capo). */
export interface HandPosition {
  string: number;
  fret: number;
}

export interface ResolveContext {
  /** Última posição tocada. */
  last?: HandPosition | null;
  /** Janela de casas visível [primeira, última]; corda solta conta como dentro. */
  window?: readonly [number, number] | null;
  capo?: number;
}

/** Fora da janela visível: só se não houver outra opção. */
const OUTSIDE_WINDOW = 100;
/** Peso de mudar de corda, em casas. */
const STRING_COST = 0.5;

/**
 * Onde uma nota ouvida (só a altura) provavelmente foi tocada. O microfone não sabe a corda:
 * no GCEA, 19 das 25 alturas existem em mais de um lugar. Prefere a janela visível e o menor
 * deslocamento da mão (casa e corda); corda solta está ao alcance com a mão nas primeiras casas.
 */
export function resolvePosition(
  midi: number,
  tuning: TuningName,
  { last = null, window = null, capo = 0 }: ResolveContext = {},
): FretPosition | undefined {
  const options = fretPositions(tuning, capo).filter((p) => p.midi === midi);
  if (options.length <= 1) return options[0];
  const hand = last ? last.fret : window ? window[0] + 2 : 0;
  const cost = (p: FretPosition) => {
    const outside = window && p.fret > 0 && (p.fret < window[0] || p.fret > window[1]);
    const fretCost = p.fret === 0 ? (hand <= 4 ? 1 : 3) : Math.abs(p.fret - hand);
    const stringCost = last ? STRING_COST * Math.abs(p.string - last.string) : 0;
    return (outside ? OUTSIDE_WINDOW : 0) + fretCost + stringCost;
  };
  return options.reduce((best, p) => {
    const d = cost(p) - cost(best);
    if (d < 0) return p;
    if (d > 0) return best;
    return p.fret < best.fret || (p.fret === best.fret && p.string < best.string) ? p : best;
  });
}
