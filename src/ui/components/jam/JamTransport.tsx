import { BPM_RANGE, useMusicStore } from '@/store/useMusicStore';
import { useToggleJam } from '../../hooks/useJamSync';

export function JamTransport({ chords }: { chords: readonly string[] }) {
  const { playing, bpm, bar, beat } = useMusicStore((s) => s.jam);
  const setBpm = useMusicStore((s) => s.setBpm);
  const toggle = useToggleJam();
  const counting = playing && bar < 0;
  const idx = bar >= 0 ? bar % chords.length : 0;
  const current = chords[idx] ?? '—';
  const next = counting ? chords[0] : chords[(idx + 1) % chords.length];

  return (
    <div className="transport">
      <button
        type="button"
        className="play-button"
        aria-pressed={playing}
        aria-label={playing ? 'Parar a base' : 'Tocar a base'}
        onClick={toggle}
      >
        <span className="play-icon" data-playing={playing || undefined} aria-hidden="true" />
      </button>

      <div className="transport-now" aria-live="polite">
        <span className="eyebrow">
          {counting ? 'Contagem' : playing ? `Compasso ${bar + 1}` : 'Parado'}
        </span>
        <span className="transport-chord">{counting ? 4 - beat : current}</span>
        <span className="transport-next">
          a seguir <strong>{next}</strong>
        </span>
      </div>

      <div className="beats" aria-hidden="true">
        {[0, 1, 2, 3].map((b) => (
          <span
            key={b}
            className="beat"
            data-on={(playing && b === beat) || undefined}
            data-warn={b === 3 || undefined}
          />
        ))}
      </div>

      <div className="bpm">
        <button
          type="button"
          className="icon-button"
          aria-label="Diminuir andamento"
          onClick={() => setBpm(bpm - 5)}
        >
          −
        </button>
        <label htmlFor="jam-bpm" className="bpm-value">
          <span className="mono">{bpm}</span>
          <small>BPM</small>
        </label>
        <button
          type="button"
          className="icon-button"
          aria-label="Aumentar andamento"
          onClick={() => setBpm(bpm + 5)}
        >
          +
        </button>
        <input
          id="jam-bpm"
          type="range"
          min={BPM_RANGE.min}
          max={BPM_RANGE.max}
          value={bpm}
          onChange={(e) => setBpm(Number(e.target.value))}
          aria-label="Andamento em BPM"
        />
      </div>
    </div>
  );
}
