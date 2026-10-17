import { useCallback } from 'react';
import { playChord } from '@/audio/engine/sound';
import { sameChord } from '@/core/harmony';
import { useDiatonicChords, useVoicing } from '@/store/selectors';
import { useMusicStore } from '@/store/useMusicStore';

/** Campo harmônico do tom; tocar um acorde o torna o acorde atual. */
export function ChordStrip() {
  const chords = useDiatonicChords();
  const current = useMusicStore((s) => s.currentChord);
  const voicing = useVoicing();
  const setChord = useMusicStore((s) => s.setChord);

  const choose = useCallback(
    (symbol: string) => {
      setChord(symbol);
      void playChord(voicing(symbol).midis);
    },
    [setChord, voicing],
  );

  return (
    <div className="chord-strip" role="radiogroup" aria-label="Acorde atual">
      {chords.map((c) => (
        <button
          key={c.numeral}
          type="button"
          role="radio"
          aria-checked={sameChord(c.symbol, current)}
          className="chord-chip"
          data-func={c.func}
          onClick={() => choose(c.symbol)}
        >
          <span className="chord-chip-numeral mono">{c.numeral}</span>
          <span className="chord-chip-symbol">{c.symbol}</span>
        </button>
      ))}
    </div>
  );
}
