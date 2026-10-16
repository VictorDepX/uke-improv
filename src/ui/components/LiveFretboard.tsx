import { useCallback } from 'react';
import { playNote } from '@/audio/engine/sound';
import type { FretPosition } from '@/core/types';
import { useNoteContext, useNoteSuggestions } from '@/store/selectors';
import { useMusicStore } from '@/store/useMusicStore';
import { Fretboard } from './Fretboard';
import { Legend } from './Legend';

/** Braço ligado ao store: tocar uma casa soa a nota e alimenta as sugestões. */
export function LiveFretboard({ previewChord = null }: { previewChord?: string | null }) {
  const ctx = useNoteContext();
  const suggestions = useNoteSuggestions();
  const key = useMusicStore((s) => s.key);
  const settings = useMusicStore((s) => s.settings);
  const lastMidi = useMusicStore((s) => s.lastNotes.at(-1) ?? null);
  const registerNote = useMusicStore((s) => s.registerNote);

  const onPlay = useCallback(
    (pos: FretPosition) => {
      registerNote(pos.midi);
      void playNote(pos.midi);
    },
    [registerNote],
  );

  return (
    <div className="live-fretboard">
      <Fretboard
        ctx={ctx}
        keyContext={key}
        tuning={settings.tuning}
        labels={settings.labels}
        fretWindow={settings.fretWindow}
        suggestions={suggestions}
        lastMidi={lastMidi}
        previewChord={previewChord}
        onPlay={onPlay}
      />
      <Legend />
    </div>
  );
}
