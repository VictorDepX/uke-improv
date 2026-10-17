import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { buildNoteContext } from '@/core/classify';
import { midiRange } from '@/core/fretboard';
import { diatonicChords } from '@/core/harmony';
import { PROGRESSIONS, progressionChords } from '@/core/progressions';
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
  const { tuning, weights } = useMusicStore(
    useShallow((s) => ({ tuning: s.settings.tuning, weights: s.settings.weights })),
  );
  return useMemo(
    () => suggestNextNotes(lastNotes, ctx, { range: midiRange(tuning), weights }),
    [lastNotes, ctx, tuning, weights],
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
    return { progression, chords: progressionChords(progression, key) };
  }, [key, id, custom]);
}
