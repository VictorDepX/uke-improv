import { useCallback, useState } from 'react';
import { playNote } from '@/audio/engine/sound';
import { MAX_WINDOW_START, WINDOW_SIZE } from '@/core/fretboard';
import type { FretPosition } from '@/core/types';
import { useNoteContext, useNoteSuggestions } from '@/store/selectors';
import { useMusicStore } from '@/store/useMusicStore';
import { Fretboard } from './Fretboard';
import { Legend } from './Legend';
import { NoteInfo } from './NoteInfo';

/** Braço ligado ao store: tocar uma casa soa a nota e alimenta as sugestões. */
export function LiveFretboard({
  previewChord = null,
  legend = true,
}: {
  previewChord?: string | null;
  legend?: boolean;
}) {
  const ctx = useNoteContext();
  const suggestions = useNoteSuggestions();
  const key = useMusicStore((s) => s.key);
  const settings = useMusicStore((s) => s.settings);
  const autoWindowStart = useMusicStore((s) => s.autoWindowStart);
  const lastMidi = useMusicStore((s) => s.lastNotes.at(-1) ?? null);
  const registerNote = useMusicStore((s) => s.registerNote);
  const shiftWindow = useMusicStore((s) => s.shiftWindow);
  const currentChord = useMusicStore((s) => s.currentChord);
  const [inspected, setInspected] = useState<FretPosition | null>(null);
  const closeInfo = useCallback(() => setInspected(null), []);

  const { fretWindow } = settings;
  const auto = fretWindow === 'auto';
  const windowStart: number | null = fretWindow === 'auto' ? autoWindowStart : fretWindow;

  const onPlay = useCallback(
    (pos: FretPosition) => {
      registerNote(pos.midi, pos.fret);
      void playNote(pos.midi);
    },
    [registerNote],
  );

  return (
    <div className="live-fretboard">
      {windowStart !== null ? (
        <div className="fb-window-nav">
          <button
            type="button"
            className="icon-button"
            aria-label="Casas mais graves"
            disabled={windowStart <= 1}
            onClick={() => shiftWindow(-1)}
          >
            ‹
          </button>
          <span className="fb-window-label" aria-live="polite">
            Casas {windowStart}–{windowStart + WINDOW_SIZE - 1}
            {auto ? <span className="tag">segue a mão</span> : null}
          </span>
          <button
            type="button"
            className="icon-button"
            aria-label="Casas mais agudas"
            disabled={windowStart >= MAX_WINDOW_START}
            onClick={() => shiftWindow(1)}
          >
            ›
          </button>
        </div>
      ) : null}
      <Fretboard
        ctx={ctx}
        keyContext={key}
        tuning={settings.tuning}
        labels={settings.labels}
        fretWindow={windowStart}
        suggestions={suggestions}
        lastMidi={lastMidi}
        previewChord={previewChord}
        onPlay={onPlay}
        onInspect={setInspected}
      />
      {legend ? <Legend /> : null}
      {inspected ? (
        <NoteInfo
          pos={inspected}
          ctx={ctx}
          keyContext={key}
          chordSymbol={currentChord}
          onPlay={() => onPlay(inspected)}
          onClose={closeInfo}
        />
      ) : null}
    </div>
  );
}
