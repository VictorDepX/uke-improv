import { mod12 } from './music';
import type { FretPosition, TuningName } from './types';

export const FRET_COUNT = 15;

/** MIDI das cordas soltas, da 4ª (G) para a 1ª (A). */
export const TUNINGS: Record<TuningName, { label: string; open: readonly number[] }> = {
  GCEA: { label: 'GCEA (G agudo)', open: [67, 60, 64, 69] },
  'GCEA-lowG': { label: 'GCEA (G grave)', open: [55, 60, 64, 69] },
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
