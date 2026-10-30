import { useCallback, useState } from 'react';
import { playNote } from '@/audio/engine/sound';
import { WINDOW_SIZE, maxWindowStart } from '@/core/fretboard';
import type { FretPosition } from '@/core/types';
import { useNoteContext, useNoteSuggestions } from '@/store/selectors';
import { useMusicStore } from '@/store/useMusicStore';
import { Fretboard } from './Fretboard';
import { Legend } from './Legend';
import { NoteInfo } from './NoteInfo';
import { nm, tx, useT } from '@/i18n';

/** Braço ligado ao store: tocar uma casa soa a nota e alimenta as sugestões. */
export function LiveFretboard({
  previewChord = null,
  legend = true,
}: {
  previewChord?: string | null;
  legend?: boolean;
}) {
  const t = useT();
  const ctx = useNoteContext();
  const suggestions = useNoteSuggestions();
  const key = useMusicStore((s) => s.key);
  const settings = useMusicStore((s) => s.settings);
  const autoWindowStart = useMusicStore((s) => s.autoWindowStart);
  const last = useMusicStore((s) => s.lastPos);
  const registerNote = useMusicStore((s) => s.registerNote);
  const shiftWindow = useMusicStore((s) => s.shiftWindow);
  const currentChord = useMusicStore((s) => s.currentChord);
  const [inspected, setInspected] = useState<FretPosition | null>(null);
  const closeInfo = useCallback(() => setInspected(null), []);

  const { fretWindow, capo } = settings;
  const auto = fretWindow === 'auto';
  const windowStart: number | null = fretWindow === 'auto' ? autoWindowStart : fretWindow;

  const onPlay = useCallback(
    (pos: FretPosition) => {
      registerNote(pos.midi, { string: pos.string, fret: pos.fret });
      void playNote(pos.midi);
    },
    [registerNote],
  );

  return (
    <div className="live-fretboard">
      {capo && windowStart === null ? (
        <div className="fb-window-nav fb-capo-row">
          <span className="capo-badge">Capo {capo}</span>
        </div>
      ) : null}
      {windowStart !== null ? (
        <div className="fb-window-nav">
          <button
            type="button"
            className="icon-button"
            aria-label={t('Casas mais graves', 'Lower frets')}
            disabled={windowStart <= 1}
            onClick={() => shiftWindow(-1)}
          >
            ‹
          </button>
          <span className="fb-window-label" aria-live="polite">
            {t('Casas', 'Frets')} {windowStart + capo}–{windowStart + capo + WINDOW_SIZE - 1}
            {auto ? <span className="tag">{t('segue a mão', 'follows your hand')}</span> : null}
            {capo ? <span className="capo-badge">Capo {capo}</span> : null}
          </span>
          <button
            type="button"
            className="icon-button"
            aria-label={t('Casas mais agudas', 'Higher frets')}
            disabled={windowStart >= maxWindowStart(capo)}
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
        capo={capo}
        labels={settings.labels}
        fretWindow={windowStart}
        suggestions={suggestions}
        last={last}
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
          scaleLabel={
            settings.arpeggio
              ? tx(`arpejo de ${nm(currentChord)}`, `${nm(currentChord)} arpeggio`)
              : undefined
          }
          capo={capo}
          onPlay={() => onPlay(inspected)}
          onClose={closeInfo}
        />
      ) : null}
    </div>
  );
}
