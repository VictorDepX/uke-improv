/**
 * Validação do que entra no store vindo de fora do código: o localStorage (editável por
 * qualquer um no navegador, ou corrompido) e a linha do servidor. Campo inválido é
 * descartado e fica o padrão; nada de tipo errado chega aos componentes.
 */
import type { MicCalibration } from '@/audio/analysis/calibrate';
import type { EarMode, EarScore } from './ear';
import { EXERCISES, type ExerciseId } from './exercises';
import { FRET_COUNT, MAX_CAPO, TUNINGS } from './fretboard';
import { SCALES } from './music';
import { METERS } from './rhythm';
import type {
  ChordExtras,
  KeyContext,
  LabelMode,
  Progression,
  ScaleName,
  ScoreWeights,
  TuningName,
} from './types';

/** Limites para dados guardados: cabem com folga no uso real. */
export const LIMITS = {
  progressions: 50,
  barsPerProgression: 64,
  numeralLength: 32,
  nameLength: 300,
  idLength: 64,
  counter: 1_000_000,
} as const;

type Obj = Record<string, unknown>;
const isObj = (v: unknown): v is Obj => typeof v === 'object' && v !== null && !Array.isArray(v);
const isNum = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const isInt = (v: unknown, min: number, max: number): v is number =>
  isNum(v, min, max) && Number.isInteger(v);
const oneOf = <T extends string>(v: unknown, options: readonly T[]): v is T =>
  typeof v === 'string' && (options as readonly string[]).includes(v);
const shortText = (v: unknown, max: number): v is string =>
  typeof v === 'string' && v.length > 0 && v.length <= max;

const LABELS: readonly LabelMode[] = ['note', 'degree', 'interval'];
const TONIC_RE = /^[A-G](#|b)?$/;
const EAR_MODES: readonly EarMode[] = ['interval', 'quality', 'function'];
const EXERCISE_IDS: readonly ExerciseId[] = EXERCISES.map((e) => e.id);

export interface SettingsShape {
  tuning: TuningName;
  labels: LabelMode;
  weights: ScoreWeights;
  extras: ChordExtras;
  arpeggio: boolean;
  shapes: boolean;
  fretWindow: number | null | 'auto';
  capo: number;
  micCalibration: MicCalibration | null;
}

/** Só os campos de ajuste válidos; os outros ficam com o valor atual. */
export function sanitizeSettings(v: unknown): Partial<SettingsShape> {
  if (!isObj(v)) return {};
  const out: Partial<SettingsShape> = {};
  if (oneOf(v.tuning, Object.keys(TUNINGS) as TuningName[])) out.tuning = v.tuning;
  if (oneOf(v.labels, LABELS)) out.labels = v.labels;
  if (typeof v.arpeggio === 'boolean') out.arpeggio = v.arpeggio;
  if (typeof v.shapes === 'boolean') out.shapes = v.shapes;
  if (isInt(v.capo, 0, MAX_CAPO)) out.capo = v.capo;
  if (v.fretWindow === null || v.fretWindow === 'auto' || isInt(v.fretWindow, 0, FRET_COUNT))
    out.fretWindow = v.fretWindow;
  const w = v.weights;
  if (isObj(w) && ['cls', 'proximity', 'resolution', 'contour'].every((k) => isNum(w[k], 0, 10)))
    out.weights = {
      cls: w.cls as number,
      proximity: w.proximity as number,
      resolution: w.resolution as number,
      contour: w.contour as number,
    };
  const e = v.extras;
  if (
    isObj(e) &&
    typeof e.secondaryDominants === 'boolean' &&
    typeof e.modalBorrowing === 'boolean'
  )
    out.extras = { secondaryDominants: e.secondaryDominants, modalBorrowing: e.modalBorrowing };
  const c = v.micCalibration;
  if (c === null) out.micCalibration = null;
  else if (
    isObj(c) &&
    isNum(c.gain, 0.1, 8) &&
    isNum(c.minRms, 0, 1) &&
    isNum(c.noiseRms, 0, 1) &&
    isNum(c.playRms, 0, 1)
  )
    out.micCalibration = {
      gain: c.gain,
      minRms: c.minRms,
      noiseRms: c.noiseRms,
      playRms: c.playRms,
    };
  return out;
}

/** Progressões próprias válidas, no máximo LIMITS.progressions; as inválidas saem. */
export function sanitizeProgressions(v: unknown): Progression[] {
  if (!Array.isArray(v)) return [];
  const out: Progression[] = [];
  for (const p of v.slice(0, LIMITS.progressions)) {
    if (!isObj(p)) continue;
    if (!shortText(p.id, LIMITS.idLength) || !shortText(p.name, LIMITS.nameLength)) continue;
    if (p.mode !== 'major' && p.mode !== 'minor') continue;
    const numerals = p.numerals;
    if (
      !Array.isArray(numerals) ||
      numerals.length === 0 ||
      numerals.length > LIMITS.barsPerProgression ||
      !numerals.every((n) => shortText(n, LIMITS.numeralLength))
    )
      continue;
    const prog: Progression = {
      id: p.id,
      name: p.name,
      mode: p.mode,
      numerals: [...(numerals as string[])],
      custom: true,
    };
    if (oneOf(p.meter, Object.keys(METERS) as (keyof typeof METERS)[])) prog.meter = p.meter;
    if (typeof p.anyScale === 'boolean') prog.anyScale = p.anyScale;
    out.push(prog);
  }
  return out;
}

export interface ProgressShape {
  ear: Partial<Record<EarMode, EarScore>>;
  exercises: Partial<Record<ExerciseId, { completed: number; bestMisses: number }>>;
}

/** Placar e progresso: só modos e exercícios conhecidos, com contadores inteiros. */
export function sanitizeProgress(v: unknown): ProgressShape {
  const out: ProgressShape = { ear: {}, exercises: {} };
  if (!isObj(v)) return out;
  const n = (x: unknown) => isInt(x, 0, LIMITS.counter);
  if (isObj(v.ear))
    for (const mode of EAR_MODES) {
      const s = v.ear[mode];
      if (isObj(s) && n(s.correct) && n(s.total) && n(s.streak) && n(s.best))
        out.ear[mode] = { correct: s.correct, total: s.total, streak: s.streak, best: s.best };
    }
  if (isObj(v.exercises))
    for (const id of EXERCISE_IDS) {
      const r = v.exercises[id];
      if (isObj(r) && n(r.completed) && n(r.bestMisses))
        out.exercises[id] = { completed: r.completed, bestMisses: r.bestMisses };
    }
  return out;
}

/** Tom guardado; null se inválido. */
export function sanitizeKey(v: unknown): KeyContext | null {
  if (!isObj(v) || typeof v.tonic !== 'string' || !TONIC_RE.test(v.tonic)) return null;
  if (!oneOf(v.scale, Object.keys(SCALES) as ScaleName[])) return null;
  return { tonic: v.tonic, scale: v.scale };
}

/** Acorde guardado: texto curto de cifra; null se inválido. */
export function sanitizeChord(v: unknown): string | null {
  return typeof v === 'string' && /^[A-G][#b]?[^\s]{0,15}$/.test(v) ? v : null;
}

/** Instante de mudança por bloco: só números de data plausíveis. */
export function sanitizeSyncMeta(v: unknown): Record<string, number> {
  if (!isObj(v)) return {};
  const out: Record<string, number> = {};
  for (const k of ['settings', 'progressions', 'progress'])
    if (isInt(v[k], 0, 8.64e15)) out[k] = v[k] as number;
  return out;
}
