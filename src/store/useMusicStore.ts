import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { diatonicChords } from '@/core/harmony';
import { modeOf } from '@/core/music';
import { PROGRESSIONS } from '@/core/progressions';
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
  /** Primeira casa da janela de 5 casas, ou null para o braço inteiro. */
  fretWindow: number | null;
}

export interface JamState {
  playing: boolean;
  bpm: number;
  progressionId: string;
  /** Compasso atual (-1 durante a contagem). */
  bar: number;
  /** Tempo dentro do compasso, 0–3. */
  beat: number;
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
  chordHistory: string[];
  settings: Settings;
  customProgressions: Progression[];
  jam: JamState;
  mic: MicState;

  setTonic: (tonic: string) => void;
  setScale: (scale: ScaleName) => void;
  setChord: (symbol: string) => void;
  registerNote: (midi: number) => void;
  clearNotes: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
  setWeights: (patch: Partial<ScoreWeights>) => void;
  setExtras: (patch: Partial<ChordExtras>) => void;

  selectProgression: (id: string) => void;
  addCustomProgression: (p: Progression) => void;
  removeCustomProgression: (id: string) => void;
  setBpm: (bpm: number) => void;
  setJamPlaying: (playing: boolean) => void;
  setJamPosition: (bar: number, beat: number) => void;
  setLayerVolume: (layer: Layer, value: number) => void;

  setMic: (patch: Partial<MicState>) => void;
}

const MAX_NOTES = 4;
const MAX_HISTORY = 4;
export const BPM_RANGE = { min: 60, max: 160 } as const;

const tonicChord = (key: KeyContext): string => diatonicChords(key)[0]!.symbol;

const clamp = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

const INITIAL_KEY: KeyContext = { tonic: 'C', scale: 'major' };

export const useMusicStore = create<MusicState>()(
  persist(
    (set, get) => ({
      key: INITIAL_KEY,
      currentChord: tonicChord(INITIAL_KEY),
      lastNotes: [],
      chordHistory: [],
      settings: {
        tuning: 'GCEA',
        labels: 'note',
        weights: DEFAULT_WEIGHTS,
        extras: { secondaryDominants: false, modalBorrowing: false },
        fretWindow: null,
      },
      customProgressions: [],
      jam: {
        playing: false,
        bpm: 90,
        progressionId: PROGRESSIONS[0]!.id,
        bar: 0,
        beat: 0,
        layers: { chords: 0.8, bass: 0.7, drums: 0.5 },
      },
      mic: { status: 'off', error: null, note: null, chord: null, level: 0, followChords: true },

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
      registerNote: (midi) => set((s) => ({ lastNotes: [...s.lastNotes, midi].slice(-MAX_NOTES) })),
      clearNotes: () => set({ lastNotes: [] }),
      updateSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      setWeights: (patch) =>
        set((s) => ({ settings: { ...s.settings, weights: { ...s.settings.weights, ...patch } } })),
      setExtras: (patch) =>
        set((s) => ({ settings: { ...s.settings, extras: { ...s.settings.extras, ...patch } } })),

      selectProgression: (id) => {
        const p = [...PROGRESSIONS, ...get().customProgressions].find((x) => x.id === id);
        if (!p) return;
        const { key } = get();
        const nextScale: ScaleName =
          modeOf(key.scale) === p.mode ? key.scale : p.mode === 'major' ? 'major' : 'minor';
        if (nextScale !== key.scale) get().setScale(nextScale);
        set((s) => ({ jam: { ...s.jam, progressionId: id, bar: 0, beat: 0 } }));
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
        set((s) => ({ jam: { ...s.jam, playing, bar: playing ? -1 : 0, beat: 0 } })),
      setJamPosition: (bar, beat) => set((s) => ({ jam: { ...s.jam, bar, beat } })),
      setLayerVolume: (layer, value) =>
        set((s) => ({
          jam: { ...s.jam, layers: { ...s.jam.layers, [layer]: clamp(value, 0, 1) } },
        })),

      setMic: (patch) => set((s) => ({ mic: { ...s.mic, ...patch } })),
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
        jam: { bpm: s.jam.bpm, progressionId: s.jam.progressionId, layers: s.jam.layers },
        mic: { followChords: s.mic.followChords },
      }),
      merge: (persisted, current) => {
        const p = (persisted ?? {}) as Partial<MusicState>;
        return {
          ...current,
          ...p,
          settings: { ...current.settings, ...p.settings },
          jam: { ...current.jam, ...p.jam, playing: false, bar: 0, beat: 0 },
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
