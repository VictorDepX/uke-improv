import { numeralToChord } from './harmony';
import type { KeyContext, Progression } from './types';

export const PROGRESSIONS: readonly Progression[] = [
  { id: 'pop', name: 'Pop (I–V–vi–IV)', mode: 'major', numerals: ['I', 'V', 'vi', 'IV'] },
  { id: 'doo-wop', name: 'Anos 50 (I–vi–IV–V)', mode: 'major', numerals: ['I', 'vi', 'IV', 'V'] },
  { id: 'jazz', name: 'ii–V–I', mode: 'major', numerals: ['ii', 'V7', 'I', 'I'] },
  {
    id: 'blues',
    name: 'Blues de 12 compassos',
    mode: 'major',
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
];

export function progressionChords(progression: Progression, key: KeyContext): string[] {
  return progression.numerals.map((n) => numeralToChord(n, key));
}

let customCounter = 0;
export function makeCustomProgression(numerals: string[], mode: Progression['mode']): Progression {
  customCounter += 1;
  return {
    id: `custom-${Date.now().toString(36)}-${customCounter}`,
    name: numerals.join(' – '),
    mode,
    numerals,
    custom: true,
  };
}
