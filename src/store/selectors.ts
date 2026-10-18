import { useCallback, useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { voicingFor, type Voicing } from '@/core/chordShapes';
import { buildNoteContext } from '@/core/classify';
import { midiRange } from '@/core/fretboard';
import { diatonicChords } from '@/core/harmony';
import { prefersFlats } from '@/core/music';
import { PROGRESSIONS, meterOf, progressionBars } from '@/core/progressions';
import { buildTimeline } from '@/core/rhythm';
import { suggestNextChords } from '@/core/suggestChords';
import { suggestNextNotes } from '@/core/suggestNotes';
import { useMusicStore } from './useMusicStore';

export function useNoteContext(chordOverride?: string) {
  const key = useMusicStore((s) => s.key);
  const current = useMusicStore((s) => s.currentChord);
  const arpeggio = useMusicStore((s) => s.settings.arpeggio);
  const chord = chordOverride ?? current;
  return useMemo(() => buildNoteContext(key, chord, arpeggio), [key, chord, arpeggio]);
}

export function useNoteSuggestions() {
  const ctx = useNoteContext();
  const lastNotes = useMusicStore((s) => s.lastNotes);
  const { tuning, weights, capo } = useMusicStore(
    useShallow((s) => ({
      tuning: s.settings.tuning,
      weights: s.settings.weights,
      capo: s.settings.capo,
    })),
  );
  return useMemo(
    () => suggestNextNotes(lastNotes, ctx, { range: midiRange(tuning, capo), weights }),
    [lastNotes, ctx, tuning, weights, capo],
  );
}

export function useChordSuggestions(count = 5) {
  const key = useMusicStore((s) => s.key);
  const current = useMusicStore((s) => s.currentChord);
  const history = useMusicStore((s) => s.chordHistory);
  const extras = useMusicStore((s) => s.settings.extras);
  return useMemo(
    () => suggestNextChords(current, key, { extras, history, count }),
    [current, key, extras, history, count],
  );
}

export function useDiatonicChords() {
  const key = useMusicStore((s) => s.key);
  return useMemo(() => diatonicChords(key), [key]);
}

export function useActiveProgression() {
  const key = useMusicStore((s) => s.key);
  const id = useMusicStore((s) => s.jam.progressionId);
  const custom = useMusicStore((s) => s.customProgressions);
  return useMemo(() => {
    const progression = [...PROGRESSIONS, ...custom].find((p) => p.id === id) ?? PROGRESSIONS[0]!;
    const bars = progressionBars(progression, key);
    const meter = meterOf(progression);
    return { progression, bars, meter, timeline: buildTimeline(bars, meter) };
  }, [key, id, custom]);
}

/** Como tocar cada acorde com a afinação e o capotraste atuais. */
export function useVoicing(): (symbol: string) => Voicing {
  const tuning = useMusicStore((s) => s.settings.tuning);
  const capo = useMusicStore((s) => s.settings.capo);
  const key = useMusicStore((s) => s.key);
  const flats = prefersFlats(key);
  return useCallback(
    (symbol: string) => voicingFor(symbol, tuning, capo, flats),
    [tuning, capo, flats],
  );
}
