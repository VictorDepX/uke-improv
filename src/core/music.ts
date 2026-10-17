import { Chord, Note, Scale } from 'tonal';
import type { ChordInfo, Chroma, KeyContext, Mode, ScaleName } from './types';

export const TONICS = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'F#', 'G', 'Ab', 'A', 'Bb', 'B'] as const;

export const SCALES: Record<ScaleName, { label: string; tonal: string; mode: Mode }> = {
  major: { label: 'Maior', tonal: 'major', mode: 'major' },
  minor: { label: 'Menor natural', tonal: 'aeolian', mode: 'minor' },
  majorPentatonic: { label: 'Pentatônica maior', tonal: 'major pentatonic', mode: 'major' },
  minorPentatonic: { label: 'Pentatônica menor', tonal: 'minor pentatonic', mode: 'minor' },
  blues: { label: 'Blues', tonal: 'blues', mode: 'minor' },
  dorian: { label: 'Dórico', tonal: 'dorian', mode: 'minor' },
  mixolydian: { label: 'Mixolídio', tonal: 'mixolydian', mode: 'major' },
  harmonicMinor: { label: 'Menor harmônica', tonal: 'harmonic minor', mode: 'minor' },
};

const SHARP_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
const FLAT_NAMES = ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'];

/** Tônicas cujo campo harmônico se escreve com bemóis. */
const FLAT_TONICS = new Set(['F', 'Bb', 'Eb', 'Ab', 'Db', 'Gb']);
const FLAT_MINOR_TONICS = new Set(['D', 'G', 'C', 'F', 'Bb', 'Eb']);

export const mod12 = (n: number): number => ((n % 12) + 12) % 12;

export function chromaOf(note: string): Chroma {
  const c = Note.chroma(note);
  if (c === undefined || Number.isNaN(c)) throw new Error(`Nota inválida: ${note}`);
  return c;
}

export function modeOf(scale: ScaleName): Mode {
  return SCALES[scale].mode;
}

export function prefersFlats(key: KeyContext): boolean {
  return modeOf(key.scale) === 'major'
    ? FLAT_TONICS.has(key.tonic)
    : FLAT_MINOR_TONICS.has(key.tonic);
}

export function chromaName(chroma: Chroma, flats = false): string {
  const names = flats ? FLAT_NAMES : SHARP_NAMES;
  return names[mod12(chroma)]!;
}

export function midiName(midi: number, flats = false): string {
  return `${chromaName(midi, flats)}${Math.floor(midi / 12) - 1}`;
}

export const midiToFreq = (midi: number): number => 440 * 2 ** ((midi - 69) / 12);

export function scaleChromas(key: KeyContext): Chroma[] {
  const notes = Scale.get(`${key.tonic} ${SCALES[key.scale].tonal}`).notes;
  return notes.map(chromaOf);
}

/** Grau da nota relativo à tônica, em notação de intervalo curta (1, b3, 5, #4…). */
const DEGREE_LABELS = ['1', 'b2', '2', 'b3', '3', '4', '#4', '5', 'b6', '6', 'b7', '7'];
export function degreeLabel(chroma: Chroma, tonic: Chroma): string {
  return DEGREE_LABELS[mod12(chroma - tonic)]!;
}

const INTERVAL_LABELS = ['R', 'b2', '2', 'b3', '3', '4', 'b5', '5', '#5', '6', 'b7', '7'];
export function intervalLabel(chroma: Chroma, root: Chroma): string {
  return INTERVAL_LABELS[mod12(chroma - root)]!;
}

const chordCache = new Map<string, ChordInfo>();

export function chordInfo(symbol: string): ChordInfo {
  const cached = chordCache.get(symbol);
  if (cached) return cached;
  const c = Chord.get(symbol);
  if (c.empty || !c.tonic) throw new Error(`Acorde inválido: ${symbol}`);
  const root = chromaOf(c.tonic);
  const stable: Chroma[] = [];
  let seventh: Chroma | null = null;
  c.intervals.forEach((ivl, i) => {
    const ch = chromaOf(c.notes[i]!);
    const num = parseInt(ivl, 10);
    if (num === 1 || num === 3 || num === 5) stable.push(ch);
    else if (num === 7) seventh = ch;
  });
  const info: ChordInfo = {
    symbol,
    root,
    chromas: c.notes.map(chromaOf),
    stable,
    seventh,
    isMajor: c.intervals.includes('3M'),
  };
  chordCache.set(symbol, info);
  return info;
}

export function isValidChord(symbol: string): boolean {
  const c = Chord.get(symbol);
  return !c.empty && Boolean(c.tonic);
}
