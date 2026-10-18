import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { buildNoteContext, classifyNote } from '@/core/classify';
import {
  startExercise as freshExercise,
  stepExercise,
  type ExerciseId,
  type ExerciseState,
} from '@/core/exercises';
import { clampWindowStart, followWindow, nearestPosition } from '@/core/fretboard';
import { diatonicChords, toAbsoluteNumeral } from '@/core/harmony';
import { chromaName, mod12, modeOf, prefersFlats } from '@/core/music';
import type { Preset } from '@/core/presets';
import { PROGRESSIONS, makeCustomProgression, progressionChords } from '@/core/progressions';
import { DEFAULT_WEIGHTS } from '@/core/suggestNotes';
import type {
  ChordExtras,
  KeyContext,
  LabelMode,
  Progression,
  ScaleName,
  ScoreWeights,
  TuningName,
} from '@/core/types';
import { safeStorage } from './safeStorage';

export type Layer = 'chords' | 'bass' | 'drums';
export type MicStatus = 'off' | 'starting' | 'on' | 'denied' | 'error';

export interface Settings {
  tuning: TuningName;
  labels: LabelMode;
  weights: ScoreWeights;
  extras: ChordExtras;
  /** Só as notas do acorde contam como "dentro" (treino de arpejo). */
  arpeggio: boolean;
  /** Formas diferentes por classe de nota, além da cor. */
  shapes: boolean;
  /** null = braço inteiro, 'auto' = segue a última nota, número = casa inicial fixa. */
  fretWindow: number | null | 'auto';
  /** Casa do capotraste (0 = sem). Casas de janela e de nota contam a partir dele. */
  capo: number;
}

export interface JamState {
  playing: boolean;
  bpm: number;
  progressionId: string;
  /** Compasso atual (-1 durante a contagem). */
  bar: number;
  /** Tempo dentro do compasso (0 até o nº de tempos − 1). */
  beat: number;
  /** Índice absoluto do acorde da base desde o play (−1 na contagem). */
  segment: number;
  /** Estilo da base (null = batida padrão do compasso). */
  grooveId: string | null;
  layers: Record<Layer, number>;
}

export interface MicState {
  status: MicStatus;
  error: string | null;
  note: { midi: number; cents: number } | null;
  chord: { symbol: string; score: number } | null;
  level: number;
  followChords: boolean;
}

export interface MusicState {
  key: KeyContext;
  currentChord: string;
  lastNotes: number[];
  /** Casa da última nota tocada (para a janela automática). */
  lastFret: number | null;
  /** Casa inicial da janela automática. */
  autoWindowStart: number;
  chordHistory: string[];
  settings: Settings;
  customProgressions: Progression[];
  jam: JamState;
  mic: MicState;
  /** Exercício guiado em andamento (não é salvo). */
  exercise: ExerciseState | null;

  setTonic: (tonic: string) => void;
  setScale: (scale: ScaleName) => void;
  setChord: (symbol: string) => void;
  /** Registra uma nota. Sem `fret` (microfone), usa a posição mais próxima da mão. */
  registerNote: (midi: number, fret?: number) => void;
  /** Desloca a janela de casas (fixa ou automática). */
  shiftWindow: (delta: number) => void;
  clearNotes: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setWeights: (patch: Partial<ScoreWeights>) => void;
  setExtras: (patch: Partial<ChordExtras>) => void;

  selectProgression: (id: string) => void;
  addCustomProgression: (p: Progression) => void;
  removeCustomProgression: (id: string) => void;
  setBpm: (bpm: number) => void;
  setJamPlaying: (playing: boolean) => void;
  setJamPosition: (pos: { bar: number; beat: number; segment: number }) => void;
  setGroove: (id: string | null) => void;
  setLayerVolume: (layer: Layer, value: number) => void;

  setMic: (patch: Partial<MicState>) => void;
  /** Cifra analisada: muda o tom e vira uma progressão própria, já selecionada. */
  loadChart: (chart: {
    key: KeyContext;
    bars: readonly (readonly string[])[];
    name: string;
  }) => void;
  /** Começa (ou recomeça) um exercício; null encerra. */
  startExercise: (id: ExerciseId | null) => void;
  /** Tom, escala, progressão e andamento de uma vez. */
  applyPreset: (preset: Preset) => void;
}

const MAX_NOTES = 4;
const MAX_HISTORY = 4;
export const BPM_RANGE = { min: 60, max: 160 } as const;

const tonicChord = (key: KeyContext): string => diatonicChords(key)[0]!.symbol;

/** A nota tocada, classificada como o braço mostra agora, vai para o exercício. */
function evaluateExercise(s: MusicState, ex: ExerciseState, midi: number): ExerciseState {
  if (ex.done) return ex;
  const ctx = buildNoteContext(s.key, s.currentChord, s.settings.arpeggio);
  const chroma = mod12(midi);
  return stepExercise(ex, {
    midi,
    name: chromaName(chroma, prefersFlats(s.key)),
    cls: classifyNote(chroma, ctx),
    chord: s.currentChord,
    bar: s.jam.playing ? s.jam.segment : null,
  });
}

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const INITIAL_KEY: KeyContext = { tonic: 'C', scale: 'major' };

export const useMusicStore = create<MusicState>()(
  persist(
    (set, get) => ({
      key: INITIAL_KEY,
      currentChord: tonicChord(INITIAL_KEY),
      lastNotes: [],
      lastFret: null,
      autoWindowStart: 1,
      chordHistory: [],
      settings: {
        tuning: 'GCEA',
        labels: 'note',
        weights: DEFAULT_WEIGHTS,
        extras: { secondaryDominants: false, modalBorrowing: false },
        fretWindow: null,
        shapes: true,
        arpeggio: false,
        capo: 0,
      },
      customProgressions: [],
      jam: {
        playing: false,
        bpm: 90,
        progressionId: PROGRESSIONS[0]!.id,
        bar: 0,
        beat: 0,
        segment: 0,
        grooveId: null,
        layers: { chords: 0.8, bass: 0.7, drums: 0.5 },
      },
      mic: { status: 'off', error: null, note: null, chord: null, level: 0, followChords: true },
      exercise: null,

      setTonic: (tonic) => {
        const key = { ...get().key, tonic };
        set({ key, currentChord: tonicChord(key), chordHistory: [], lastNotes: [] });
      },
      setScale: (scale) => {
        const prev = get().key;
        const key = { ...prev, scale };
        const modeChanged = modeOf(prev.scale) !== modeOf(scale);
        set(modeChanged ? { key, currentChord: tonicChord(key), chordHistory: [] } : { key });
      },
      setChord: (symbol) => {
        const { currentChord, chordHistory } = get();
        if (symbol === currentChord) return;
        set({
          currentChord: symbol,
          chordHistory: [...chordHistory, currentChord].slice(-MAX_HISTORY),
        });
      },
      registerNote: (midi, fret) =>
        set((s) => {
          const lastNotes = [...s.lastNotes, midi].slice(-MAX_NOTES);
          const exercise = s.exercise && evaluateExercise(s, s.exercise, midi);
          const ref = s.lastFret ?? s.autoWindowStart + 2;
          const { tuning, capo } = s.settings;
          const at = fret ?? nearestPosition(midi, tuning, ref, capo)?.fret;
          if (at === undefined) return { lastNotes, exercise };
          return {
            lastNotes,
            exercise,
            lastFret: at,
            autoWindowStart: followWindow(s.autoWindowStart, at, capo),
          };
        }),
      shiftWindow: (delta) =>
        set((s) => {
          const { fretWindow: w, capo } = s.settings;
          if (w === 'auto')
            return { autoWindowStart: clampWindowStart(s.autoWindowStart + delta, capo) };
          if (typeof w === 'number')
            return { settings: { ...s.settings, fretWindow: clampWindowStart(w + delta, capo) } };
          return {};
        }),
      clearNotes: () => set({ lastNotes: [] }),
      updateSettings: (patch) =>
        set((s) => {
          const settings = { ...s.settings, ...patch };
          if (patch.capo === undefined || patch.capo === s.settings.capo) return { settings };
          // Casas relativas ao capo mudam de sentido: mantém a mão na mesma casa física.
          const shift = s.settings.capo - settings.capo;
          const w = settings.fretWindow;
          return {
            settings: {
              ...settings,
              fretWindow: typeof w === 'number' ? clampWindowStart(w + shift, settings.capo) : w,
            },
            autoWindowStart: clampWindowStart(s.autoWindowStart + shift, settings.capo),
            lastFret: null,
          };
        }),
      setWeights: (patch) =>
        set((s) => ({ settings: { ...s.settings, weights: { ...s.settings.weights, ...patch } } })),
      setExtras: (patch) =>
        set((s) => ({ settings: { ...s.settings, extras: { ...s.settings.extras, ...patch } } })),

      selectProgression: (id) => {
        const p = [...PROGRESSIONS, ...get().customProgressions].find((x) => x.id === id);
        if (!p) return;
        const { key } = get();
        const nextScale: ScaleName =
          p.anyScale || modeOf(key.scale) === p.mode
            ? key.scale
            : p.mode === 'major'
              ? 'major'
              : 'minor';
        if (nextScale !== key.scale) get().setScale(nextScale);
        set((s) => ({ jam: { ...s.jam, progressionId: id, bar: 0, beat: 0, segment: 0 } }));
      },
      addCustomProgression: (p) =>
        set((s) => ({
          customProgressions: [...s.customProgressions, p],
          jam: { ...s.jam, progressionId: p.id },
        })),
      removeCustomProgression: (id) =>
        set((s) => ({
          customProgressions: s.customProgressions.filter((p) => p.id !== id),
          jam:
            s.jam.progressionId === id ? { ...s.jam, progressionId: PROGRESSIONS[0]!.id } : s.jam,
        })),
      setBpm: (bpm) =>
        set((s) => ({
          jam: { ...s.jam, bpm: clamp(Math.round(bpm), BPM_RANGE.min, BPM_RANGE.max) },
        })),
      setJamPlaying: (playing) =>
        set((s) => ({ jam: { ...s.jam, playing, bar: playing ? -1 : 0, beat: 0, segment: -1 } })),
      setJamPosition: (pos) => set((s) => ({ jam: { ...s.jam, ...pos } })),
      setGroove: (grooveId) => set((s) => ({ jam: { ...s.jam, grooveId } })),
      setLayerVolume: (layer, value) =>
        set((s) => ({
          jam: { ...s.jam, layers: { ...s.jam.layers, [layer]: clamp(value, 0, 1) } },
        })),

      startExercise: (id) => set({ exercise: id ? freshExercise(id) : null }),
      loadChart: ({ key, bars, name }) => {
        const numerals = bars.map((bar) => bar.map((c) => toAbsoluteNumeral(c, key)));
        const progression = { ...makeCustomProgression(numerals, modeOf(key.scale)), name };
        set((s) => ({
          key,
          currentChord: bars[0]?.[0] ?? tonicChord(key),
          chordHistory: [],
          lastNotes: [],
          customProgressions: [...s.customProgressions, progression],
          jam: { ...s.jam, progressionId: progression.id, bar: 0, beat: 0, segment: 0 },
        }));
      },
      setMic: (patch) => set((s) => ({ mic: { ...s.mic, ...patch } })),

      applyPreset: (preset) => {
        const progression = PROGRESSIONS.find((p) => p.id === preset.progressionId);
        if (!progression) return;
        const key: KeyContext = { tonic: preset.tonic, scale: preset.scale };
        const first = progressionChords(progression, key)[0] ?? tonicChord(key);
        set((s) => ({
          key,
          currentChord: first,
          chordHistory: [],
          lastNotes: [],
          jam: {
            ...s.jam,
            progressionId: progression.id,
            bpm: clamp(preset.bpm, BPM_RANGE.min, BPM_RANGE.max),
            grooveId: preset.grooveId ?? null,
            // Tocando, a base segue sem reiniciar; parado, volta ao primeiro compasso.
            bar: s.jam.playing ? s.jam.bar : 0,
            beat: s.jam.playing ? s.jam.beat : 0,
          },
        }));
      },
    }),
    {
      name: 'uke-improv',
      version: 1,
      storage: createJSONStorage(() => safeStorage),
      partialize: (s) => ({
        key: s.key,
        currentChord: s.currentChord,
        settings: s.settings,
        customProgressions: s.customProgressions,
        jam: {
          bpm: s.jam.bpm,
          progressionId: s.jam.progressionId,
          layers: s.jam.layers,
          grooveId: s.jam.grooveId,
        },
        mic: { followChords: s.mic.followChords },
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<MusicState>;
        return {
          ...current,
          ...p,
          settings: { ...current.settings, ...p.settings },
          jam: { ...current.jam, ...p.jam, playing: false, bar: 0, beat: 0, segment: 0 },
          mic: {
            ...current.mic,
            ...p.mic,
            status: 'off',
            note: null,
            chord: null,
            level: 0,
            error: null,
          },
        };
      },
    },
  ),
);
