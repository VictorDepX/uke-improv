import { useState } from 'react';
import { canRecord } from '@/audio/engine/recorder';
import { useT } from '@/i18n';
import { useMusicStore } from '@/store/useMusicStore';
import { useMicControl } from '../hooks/useMicControl';
import { Toggle } from './controls';
import { Icon } from './Icon';
import { MicCalibrator } from './MicCalibrator';
import { MicProblem } from './MicProblem';
import { RecordingAnalyzer } from './RecordingAnalyzer';
import { TakesPanel } from './Takes';

type Extra = 'calibrate' | 'record' | null;

/**
 * Escuta (Explorar): calibrar, gravar e analisar numa linha, e o acorde ouvido virando o atual.
 * Calibrar e gravar ligam o microfone e abrem o painel logo abaixo.
 */
export function ListenBar() {
  const t = useT();
  const { status, start } = useMicControl();
  const followChords = useMusicStore((s) => s.mic.followChords);
  const setMic = useMusicStore((s) => s.setMic);
  const [extra, setExtra] = useState<Extra>(null);
  const on = status === 'on';

  const open = (which: Exclude<Extra, null>) => {
    const next = extra === which ? null : which;
    setExtra(next);
    if (next && !on && status !== 'starting') void start();
  };

  return (
    <section className="listen-bar" aria-labelledby="listen-title">
      <div className="field-row">
        <h2 id="listen-title" className="field-label">
          {t('Escuta', 'Listening')}
        </h2>
        <div className="listen-actions">
          <button
            type="button"
            className="button"
            aria-expanded={extra === 'calibrate'}
            aria-controls="listen-extra"
            onClick={() => open('calibrate')}
          >
            {t('Calibrar microfone', 'Calibrate microphone')}
          </button>
          {canRecord() ? (
            <button
              type="button"
              className="button"
              aria-expanded={extra === 'record'}
              aria-controls="listen-extra"
              onClick={() => open('record')}
            >
              <Icon name="record" />
              {t('Gravar improviso', 'Record your improv')}
            </button>
          ) : null}
          <RecordingAnalyzer />
          <Toggle
            id="mic-follow"
            label={t('Seguir acorde ouvido', 'Follow the chord I play')}
            checked={followChords}
            onChange={(v) => setMic({ followChords: v })}
          />
        </div>
      </div>
      <div id="listen-extra" className="listen-extra" hidden={extra === null}>
        {status === 'denied' || status === 'error' ? (
          <MicProblem onRetry={() => void start()} />
        ) : !on ? (
          <p className="muted">{t('Ligando o microfone…', 'Turning the microphone on…')}</p>
        ) : extra === 'calibrate' ? (
          <MicCalibrator />
        ) : extra === 'record' ? (
          <TakesPanel />
        ) : null}
      </div>
    </section>
  );
}
