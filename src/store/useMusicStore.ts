import type { MicCalibration } from '@/audio/analysis/calibrate';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { buildNoteContext, classifyNote } from '@/core/classify';
import { EMPTY_SCORE, scoreAnswer, type EarMode, type EarScore } from '@/core/ear';
import {
  startExercise as freshExercise,
  stepExercise,
  type ExerciseId,
  type ExerciseState,
} from '@/core/exercises';
import type { SectionId } from '@/core/sync';
import {
  WINDOW_SIZE,
  clampWindowStart,
  followWindow,
  resolvePosition,
  type HandPosition,
} from '@/core/fretboard';
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
import {
  sanitizeChord,
  sanitizeKey,
  sanitizeProgress,
  sanitizeProgressions,
  sanitizeSettings,
  sanitizeSyncMeta,
} from '@/core/validate';
import { safeStorage } from './safeStorage';

export type Layer = 'chords' | 'bass' | 'drums';

export interface ExerciseRecord {
  completed: number;
  /** Menor número de erros numa conclusão. */
  bestMisses: number;
}

export interface Progress {
  ear: Partial<Record<EarMode, EarScore>>;
  exercises: Partial<Record<ExerciseId, ExerciseRecord>>;
}

export interface AccountState {
  status: 'unknown' | 'signedOut' | 'signedIn';
  user: { id: string; name: string; email: string } | null;
  sync: 'idle' | 'syncing' | 'ok' | 'error';
  lastSync: number | null;
  error: string | null;
}
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
  /** Ganho e limiar do microfone medidos no ambiente; null = padrão. */
  micCalibration: MicCalibration | null;
}

export interface JamState {
  playing: boolean;
  /** O motor de áudio já respondeu desde o play (antes disso, a tela mostra "Preparando"). */
  ready: boolean;
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
  /**
   * Onde a última nota foi tocada. `heard`: veio só a altura (microfone, sugestão) e a
   * posição foi deduzida; a mesma nota pode estar em outros lugares do braço.
   */
  lastPos: (HandPosition & { midi: number; heard: boolean }) | null;
  /** Casa inicial da janela automática. */
  autoWindowStart: number;
  chordHistory: string[];
  settings: Settings;
  customProgressions: Progression[];
  jam: JamState;
  mic: MicState;
  /** Exercício guiado em andamento (não é salvo). */
  exercise: ExerciseState | null;
  /** Placar do treino de ouvido e exercícios concluídos (salvo e sincronizado). */
  progress: Progress;
  /** Instante da última mudança de cada bloco sincronizado (ms). */
  syncMeta: Partial<Record<SectionId, number>>;
  /** Conta e estado da sincronização (não é salvo: a sessão fica no cookie). */
  account: AccountState;

  setTonic: (tonic: string) => void;
  setScale: (scale: ScaleName) => void;
  setChord: (symbol: string) => void;
  /** Registra uma nota. Sem `fret` (microfone), usa a posição mais próxima da mão. */
  registerNote: (midi: number, pos?: HandPosition) => void;
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
  recordEarAnswer: (mode: EarMode, right: boolean) => void;
  resetEarScore: (mode: EarMode) => void;
  setAccount: (patch: Partial<AccountState>) => void;
  /** Aplica blocos vindos do servidor, com o instante deles (não conta como mudança local). */
  applyRemote: (pull: Partial<Record<SectionId, { value: unknown; at: number }>>) => void;
  /** Começa (ou recomeça) um exercício; null encerra. */
  startExercise: (id: ExerciseId | null) => void;
  /** Tom, escala, progressão e andamento de uma vez. */
  applyPreset: (preset: Preset) => void;
}

const MAX_NOTES = 4;
const MAX_HISTORY = 4;
export const BPM_RANGE = { min: 60, max: 160 } as const;

const tonicChord = (key: KeyContext): string => diatonicChords(key)[0]!.symbol;

function recordCompletion(progress: Progress, ex: ExerciseState): Progress {
  const prev = progress.exercises[ex.id];
  return {
    ...progress,
    exercises: {
      ...progress.exercises,
      [ex.id]: {
        completed: (prev?.completed ?? 0) + 1,
        bestMisses: Math.min(prev?.bestMisses ?? Infinity, ex.misses),
      },
    },
  };
}

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
      lastPos: null,
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
        micCalibration: null,
      },
      customProgressions: [],
      jam: {
        playing: false,
        ready: false,
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
      progress: { ear: {}, exercises: {} },
      syncMeta: {},
      account: { status: 'unknown', user: null, sync: 'idle', lastSync: null, error: null },

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
      registerNote: (midi, played) =>
        set((s) => {
          const lastNotes = [...s.lastNotes, midi].slice(-MAX_NOTES);
          const exercise = s.exercise && evaluateExercise(s, s.exercise, midi);
          const progress =
            exercise?.done && !s.exercise?.done
              ? recordCompletion(s.progress, exercise)
              : s.progress;
          const { tuning, capo, fretWindow } = s.settings;
          const start =
            fretWindow === 'auto'
              ? s.autoWindowStart
              : typeof fretWindow === 'number'
                ? fretWindow
                : null;
          const window =
            start === null
              ? null
              : ([
                  clampWindowStart(start, capo),
                  clampWindowStart(start, capo) + WINDOW_SIZE - 1,
                ] as const);
          const pos = played ?? resolvePosition(midi, tuning, { last: s.lastPos, window, capo });
          if (!pos) return { lastNotes, exercise, progress, lastPos: null };
          return {
            lastNotes,
            exercise,
            progress,
            lastFret: pos.fret,
            lastPos: { string: pos.string, fret: pos.fret, midi, heard: !played },
            autoWindowStart: followWindow(s.autoWindowStart, pos.fret, capo),
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
      clearNotes: () => set({ lastNotes: [], lastPos: null }),
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
            lastPos: null,
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
        set((s) => ({
          jam: { ...s.jam, playing, ready: false, bar: playing ? -1 : 0, beat: 0, segment: -1 },
        })),
      setJamPosition: (pos) => set((s) => ({ jam: { ...s.jam, ...pos, ready: true } })),
      setGroove: (grooveId) => set((s) => ({ jam: { ...s.jam, grooveId } })),
      setLayerVolume: (layer, value) =>
        set((s) => ({
          jam: { ...s.jam, layers: { ...s.jam.layers, [layer]: clamp(value, 0, 1) } },
        })),

      startExercise: (id) => set({ exercise: id ? freshExercise(id) : null }),
      recordEarAnswer: (mode, right) =>
        set((s) => ({
          progress: {
            ...s.progress,
            ear: {
              ...s.progress.ear,
              [mode]: scoreAnswer(s.progress.ear[mode] ?? EMPTY_SCORE, right),
            },
          },
        })),
      resetEarScore: (mode) =>
        set((s) => ({
          progress: { ...s.progress, ear: { ...s.progress.ear, [mode]: EMPTY_SCORE } },
        })),
      setAccount: (patch) => set((s) => ({ account: { ...s.account, ...patch } })),
      applyRemote: (pull) =>
        set((s) => {
          const next: Partial<MusicState> = { syncMeta: { ...s.syncMeta } };
          if (pull.settings) {
            next.settings = { ...s.settings, ...sanitizeSettings(pull.settings.value) };
            next.syncMeta!.settings = pull.settings.at;
          }
          if (pull.progressions) {
            next.customProgressions = sanitizeProgressions(pull.progressions.value);
            next.syncMeta!.progressions = pull.progressions.at;
          }
          if (pull.progress) {
            next.progress = sanitizeProgress(pull.progress.value);
            next.syncMeta!.progress = pull.progress.at;
          }
          return next;
        }),
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
        progress: s.progress,
        syncMeta: s.syncMeta,
      }),
      merge: (persisted, current) => {
        // O localStorage é editável no navegador: nada dele entra sem validação.
        const p = (persisted ?? {}) as Record<string, unknown>;
        const pj = (typeof p.jam === 'object' && p.jam !== null ? p.jam : {}) as Record<
          string,
          unknown
        >;
        const pm = (typeof p.mic === 'object' && p.mic !== null ? p.mic : {}) as Record<
          string,
          unknown
        >;
        const layers = pj.layers as Record<string, unknown> | undefined;
        return {
          ...current,
          key: sanitizeKey(p.key) ?? current.key,
          currentChord: sanitizeChord(p.currentChord) ?? current.currentChord,
          settings: { ...current.settings, ...sanitizeSettings(p.settings) },
          customProgressions: sanitizeProgressions(p.customProgressions),
          progress: sanitizeProgress(p.progress),
          syncMeta: sanitizeSyncMeta(p.syncMeta),
          account: current.account,
          jam: {
            ...current.jam,
            bpm:
              typeof pj.bpm === 'number' && Number.isFinite(pj.bpm)
                ? clamp(pj.bpm, BPM_RANGE.min, BPM_RANGE.max)
                : current.jam.bpm,
            progressionId:
              typeof pj.progressionId === 'string' && pj.progressionId.length <= 64
                ? pj.progressionId
                : current.jam.progressionId,
            grooveId:
              pj.grooveId === null || (typeof pj.grooveId === 'string' && pj.grooveId.length <= 64)
                ? (pj.grooveId as string | null)
                : current.jam.grooveId,
            layers: Object.fromEntries(
              Object.entries(current.jam.layers).map(([k, def]) => {
                const v = layers?.[k];
                return [k, typeof v === 'number' && v >= 0 && v <= 1 ? v : def];
              }),
            ) as JamState['layers'],
            playing: false,
            ready: false,
            bar: 0,
            beat: 0,
            segment: 0,
          },
          mic: {
            ...current.mic,
            followChords:
              typeof pm.followChords === 'boolean' ? pm.followChords : current.mic.followChords,
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
