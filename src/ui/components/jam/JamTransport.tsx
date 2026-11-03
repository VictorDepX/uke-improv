import { chordToNumeral } from '@/core/harmony';
import { METERS } from '@/core/rhythm';
import { useActiveProgression } from '@/store/selectors';
import { BPM_RANGE, useMusicStore } from '@/store/useMusicStore';
import { useJamPreview } from '../../hooks/useJamPreview';
import { useToggleJam } from '../../hooks/useJamSync';
import { Icon } from '../Icon';
import { TapTempo } from './TapTempo';
import { useNames, useT } from '@/i18n';

/**
 * Transporte do Jam: tocar/parar (56 px, usado com o uke no colo), visor com compasso, acorde
 * e o próximo, pulsos do compasso e andamento.
 */
export function JamTransport() {
  const t = useT();
  const n = useNames();
  const { playing, ready, bpm, bar, beat } = useMusicStore((s) => s.jam);
  const key = useMusicStore((s) => s.key);
  const preparing = playing && !ready;
  const setBpm = useMusicStore((s) => s.setBpm);
  const toggle = useToggleJam();
  const { timeline, meter, bars } = useActiveProgression();
  const live = useJamPreview();
  const info = METERS[meter];
  const counting = playing && bar < 0;
  const current = live.current ?? timeline[0]?.chord ?? '—';
  const next = live.next ?? timeline[1 % Math.max(1, timeline.length)]?.chord ?? '—';
  const num = (c: string) => (c === '—' ? '' : chordToNumeral(c, key));

  return (
    <div className="transport">
      <button
        type="button"
        className="play-button button"
        aria-pressed={playing}
        aria-busy={preparing || undefined}
        data-playing={playing || undefined}
        onClick={toggle}
      >
        <Icon name={playing ? 'stop' : 'play'} />
        {playing ? t('Parar', 'Stop') : t('Tocar base', 'Play backing')}
      </button>

      <div className="transport-lcd" aria-live="polite">
        <div className="visor-cell">
          <span className="visor-label">
            {preparing
              ? t('Preparando', 'Preparing')
              : counting
                ? t('Contagem', 'Count-in')
                : t('Compasso', 'Bar')}
          </span>
          <span className="visor-value">
            <span className="visor-big">
              {counting && !preparing ? info.beats - beat : playing ? (bar % bars.length) + 1 : '–'}
            </span>
            <span className="visor-detail">
              {playing && !counting ? t(`de ${bars.length}`, `of ${bars.length}`) : ''}
            </span>
          </span>
        </div>
        <div className="visor-cell">
          <span className="visor-label">{t('Acorde', 'Chord')}</span>
          <span className="visor-value">
            <span className="visor-big transport-chord">{n(current)}</span>
            <span className="visor-detail">{num(current)}</span>
          </span>
        </div>
        <div className="visor-cell">
          <span className="visor-label">{t('A seguir', 'Next')}</span>
          <span className="visor-value">
            <span className="visor-big">{n(next)}</span>
            <span className="visor-detail">{num(next)}</span>
          </span>
        </div>
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
          aria-label={t('Diminuir andamento', 'Slower')}
          disabled={bpm <= BPM_RANGE.min}
          onClick={() => setBpm(bpm - 5)}
        >
          <Icon name="minus" />
        </button>
        <span className="bpm-value">
          <span className="mono">{bpm}</span>
          <small>BPM{meter === '6/8' ? <span className="dotted-quarter"> ♩.</span> : null}</small>
        </span>
        <button
          type="button"
          className="icon-button"
          aria-label={t('Aumentar andamento', 'Faster')}
          disabled={bpm >= BPM_RANGE.max}
          onClick={() => setBpm(bpm + 5)}
        >
          <Icon name="plus" />
        </button>
        <TapTempo className="button" />
      </div>
    </div>
  );
}
