import { useNoteContext } from '@/store/selectors';
import { useMusicStore } from '@/store/useMusicStore';
import { classifyNote } from '@/core/classify';
import { midiName, prefersFlats } from '@/core/music';
import { CLASS_SHORT } from '../format';
import { useMicControl } from '../hooks/useMicControl';
import { Panel, Toggle } from './controls';
import { canRecord } from '@/audio/engine/recorder';
import { MicCalibrator } from './MicCalibrator';
import { TakesPanel } from './Takes';
import { RecordingAnalyzer } from './RecordingAnalyzer';
import { useNames, useT } from '@/i18n';

/** Módulo 2: escuta em tempo real, com afinador e indicador da classe da nota tocada. */
export function MicPanel() {
  const t = useT();
  const n = useNames();
  const { status, start, stop } = useMicControl();
  const mic = useMusicStore((s) => s.mic);
  const key = useMusicStore((s) => s.key);
  const setMic = useMusicStore((s) => s.setMic);
  const ctx = useNoteContext();
  const flats = prefersFlats(key);
  const on = status === 'on';
  const cls = mic.note ? classifyNote(mic.note.midi, ctx) : null;
  const cents = mic.note?.cents ?? 0;

  return (
    <Panel
      title={t('Escuta', 'Listening')}
      className="mic-panel"
      aside={
        <button
          type="button"
          className="mic-button"
          data-on={on || undefined}
          aria-pressed={on}
          disabled={status === 'starting'}
          onClick={() => (on ? stop() : void start())}
        >
          <span className="mic-button-dot" aria-hidden="true" />
          {on
            ? t('Desligar microfone', 'Turn microphone off')
            : status === 'starting'
              ? t('Abrindo…', 'Opening…')
              : t('Ligar microfone', 'Turn microphone on')}
        </button>
      }
    >
      {on ? (
        <div className="mic-live">
          <div className="meter" aria-hidden="true">
            <span style={{ transform: `scaleX(${Math.min(1, mic.level * 8)})` }} />
          </div>
          <div className="mic-readout">
            <div>
              <span className="eyebrow">{t('Nota', 'Note')}</span>
              <span className="mic-note" data-cls={cls ?? undefined}>
                {mic.note ? n(midiName(mic.note.midi, flats)) : '—'}
              </span>
              {cls ? <span className="mono muted">{t(CLASS_SHORT[cls])}</span> : null}
            </div>
            <div>
              <span className="eyebrow">{t('Acorde', 'Chord')}</span>
              <span className="mic-note">{mic.chord ? n(mic.chord.symbol) : '—'}</span>
              {mic.chord ? (
                <span className="mono muted">{Math.round(mic.chord.score * 100)}%</span>
              ) : null}
            </div>
          </div>
          <div
            className="tuner"
            role="meter"
            aria-label={t('Afinação', 'Tuning')}
            aria-valuemin={-50}
            aria-valuemax={50}
            aria-valuenow={cents}
          >
            <span className="tuner-center" aria-hidden="true" />
            <span
              className="tuner-needle"
              style={{ left: `${50 + cents}%` }}
              data-in-tune={Math.abs(cents) <= 5 || undefined}
            />
            <span className="tuner-scale mono" aria-hidden="true">
              <span>−50</span>
              <span>0</span>
              <span>+50 cents</span>
            </span>
          </div>
          <MicCalibrator />
          {canRecord() ? <TakesPanel /> : null}
          <Toggle
            id="mic-follow"
            label={t(
              'Acorde detectado vira o acorde atual',
              'Detected chord becomes the current chord',
            )}
            checked={mic.followChords}
            onChange={(v) => setMic({ followChords: v })}
          />
        </div>
      ) : (
        <div className="mic-off">
          {status === 'denied' || status === 'error' ? (
            <p className="notice" role="status">
              {mic.error}{' '}
              {t(
                'Verifique a permissão do microfone no navegador. Enquanto isso, analise uma gravação:',
                'Check the microphone permission in your browser. Meanwhile, analyze a recording:',
              )}
            </p>
          ) : (
            <p className="empty">
              {t(
                'Toque no uke perto do celular: a nota vira entrada para as sugestões e o acorde detectado pode virar o acorde atual.',
                'Play your uke near the phone: the note feeds the suggestions and the detected chord can become the current chord.',
              )}
            </p>
          )}
          <RecordingAnalyzer />
        </div>
      )}
    </Panel>
  );
}
