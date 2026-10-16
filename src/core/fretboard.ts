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

const cache = new Map<TuningName, FretPosition[]>();

export function fretPositions(tuning: TuningName): FretPosition[] {
  const cached = cache.get(tuning);
  if (cached) return cached;
  const positions: FretPosition[] = [];
  TUNINGS[tuning].open.forEach((open, string) => {
    for (let fret = 0; fret <= FRET_COUNT; fret++) {
      const midi = open + fret;
      positions.push({ string, fret, midi, chroma: mod12(midi) });
    }
  });
  cache.set(tuning, positions);
  return positions;
}

export function midiRange(tuning: TuningName): { min: number; max: number } {
  const open = TUNINGS[tuning].open;
  return { min: Math.min(...open), max: Math.max(...open) + FRET_COUNT };
}

/** Posição de uma nota mais próxima de uma casa de referência (para o dedo andar pouco). */
export function nearestPosition(
  midi: number,
  tuning: TuningName,
  nearFret: number | null,
): FretPosition | undefined {
  const options = fretPositions(tuning).filter((p) => p.midi === midi);
  if (options.length === 0) return undefined;
  const ref = nearFret ?? 0;
  return options.reduce((best, p) =>
    Math.abs(p.fret - ref) < Math.abs(best.fret - ref) ? p : best,
  );
}
