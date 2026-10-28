import { METERS } from '@/core/rhythm';
import { useActiveProgression } from '@/store/selectors';
import { BPM_RANGE, useMusicStore } from '@/store/useMusicStore';
import { useJamPreview } from '../../hooks/useJamPreview';
import { useToggleJam } from '../../hooks/useJamSync';
import { TapTempo } from './TapTempo';

export function JamTransport() {
  const { playing, ready, bpm, bar, beat } = useMusicStore((s) => s.jam);
  const preparing = playing && !ready;
  const setBpm = useMusicStore((s) => s.setBpm);
  const toggle = useToggleJam();
  const { timeline, meter } = useActiveProgression();
  const live = useJamPreview();
  const info = METERS[meter];
  const counting = playing && bar < 0;
  const current = live.current ?? timeline[0]?.chord ?? '—';
  const next = live.next ?? timeline[1 % Math.max(1, timeline.length)]?.chord ?? '—';

  return (
    <div className="transport">
      <button
        type="button"
        className="play-button"
        aria-pressed={playing}
        aria-busy={preparing || undefined}
        data-loading={preparing || undefined}
        aria-label={playing ? 'Parar a base' : 'Tocar a base'}
        onClick={toggle}
      >
        <span className="play-icon" data-playing={playing || undefined} aria-hidden="true" />
      </button>

      <div className="transport-now" aria-live="polite">
        <span className="eyebrow">
          {preparing
            ? 'Preparando o som…'
            : counting
              ? 'Contagem'
              : playing
                ? `Compasso ${bar + 1}`
                : 'Parado'}
        </span>
        <span className="transport-chord">
          {counting && !preparing ? info.beats - beat : current}
        </span>
        <span className="transport-next">
          a seguir <strong>{next}</strong>
        </span>
      </div>

      <div className="beats" aria-hidden="true" data-meter={meter}>
        {Array.from({ length: info.beats }, (_, b) => (
          <span
            key={b}
            className="beat"
            data-on={(playing && b === beat) || undefined}
            data-accent={info.accents.includes(b) || undefined}
            data-warn={(playing && !counting && b === beat && live.preview) || undefined}
          />
        ))}
        {meter !== '4/4' ? <span className="meter-tag mono">{meter}</span> : null}
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
          <small>BPM{meter === '6/8' ? <span className="dotted-quarter"> ♩.</span> : null}</small>
        </label>
        <button
          type="button"
          className="icon-button"
          aria-label="Aumentar andamento"
          onClick={() => setBpm(bpm + 5)}
        >
          +
        </button>
        <TapTempo />
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
