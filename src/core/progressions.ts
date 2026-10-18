import { numeralToChord } from './harmony';
import { parseBar, type Meter } from './rhythm';
import type { KeyContext, Progression } from './types';

export const PROGRESSIONS: readonly Progression[] = [
  { id: 'pop', name: 'Pop (I–V–vi–IV)', mode: 'major', numerals: ['I', 'V', 'vi', 'IV'] },
  { id: 'doo-wop', name: 'Anos 50 (I–vi–IV–V)', mode: 'major', numerals: ['I', 'vi', 'IV', 'V'] },
  { id: 'jazz', name: 'ii–V–I', mode: 'major', numerals: ['ii', 'V7', 'I', 'I'] },
  {
    id: 'blues',
    name: 'Blues de 12 compassos',
    mode: 'major',
    anyScale: true,
    numerals: ['I7', 'I7', 'I7', 'I7', 'IV7', 'IV7', 'I7', 'I7', 'V7', 'IV7', 'I7', 'V7'],
  },
  {
    id: 'minor',
    name: 'Menor épica (i–VI–III–VII)',
    mode: 'minor',
    numerals: ['i', 'bVI', 'bIII', 'bVII'],
  },
  {
    id: 'andaluz',
    name: 'Andaluza (i–VII–VI–V)',
    mode: 'minor',
    numerals: ['i', 'bVII', 'bVI', 'V'],
  },
  { id: 'dorian-vamp', name: 'Groove dórico (i–IV)', mode: 'minor', numerals: ['i', 'IV'] },
  {
    id: 'turnaround',
    name: 'Turnaround (I–vi | ii–V7)',
    mode: 'major',
    numerals: ['I vi', 'ii V7'],
  },
  {
    id: 'valsa',
    name: 'Valsa (I–IV–V7–I)',
    mode: 'major',
    meter: '3/4',
    numerals: ['I', 'IV', 'V7', 'I'],
  },
  {
    id: 'balada-68',
    name: 'Balada em 6/8 (I–vi–IV–V)',
    mode: 'major',
    meter: '6/8',
    numerals: ['I', 'vi', 'IV', 'V'],
  },
  {
    id: 'mixo-vamp',
    name: 'Mixolídio (I–bVII–IV–I)',
    mode: 'major',
    numerals: ['I', 'bVII', 'IV', 'I'],
  },
];

export const meterOf = (p: Progression): Meter => p.meter ?? '4/4';

/** Acordes de cada compasso (1 ou 2 por compasso), já no tom. */
export function progressionBars(progression: Progression, key: KeyContext): string[][] {
  return progression.numerals.map((bar) => parseBar(bar).map((n) => numeralToChord(n, key)));
}

/** Todos os acordes da progressão, na ordem em que soam. */
export function progressionChords(progression: Progression, key: KeyContext): string[] {
  return progressionBars(progression, key).flat();
}

/** Rótulo de um compasso: "Dm G7". */
export const barLabel = (bar: readonly string[]): string => bar.join(' ');

let customCounter = 0;
/** `bars`: numerais por compasso; um compasso pode ter 2 ("ii V7"). */
export function makeCustomProgression(
  bars: readonly (readonly string[])[],
  mode: Progression['mode'],
  meter: Meter = '4/4',
): Progression {
  customCounter += 1;
  const numerals = bars.map((b) => b.join(' '));
  return {
    id: `custom-${Date.now().toString(36)}-${customCounter}`,
    name: numerals.join(' – ') + (meter === '4/4' ? '' : ` (${meter})`),
    mode,
    numerals,
    custom: true,
    ...(meter === '4/4' ? {} : { meter }),
  };
}
