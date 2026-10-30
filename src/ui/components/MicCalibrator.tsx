import { useEffect, useRef, useState } from 'react';
import { calibrate, toDb, type CalibrationIssue } from '@/audio/analysis/calibrate';
import { micInput } from '@/audio/engine/mic';
import { useMusicStore } from '@/store/useMusicStore';
import { LOCALE, tx, useLang, useT, type Txt } from '@/i18n';

const SILENCE_MS = 2000;
const PLAY_MS = 3000;

type Step = 'idle' | 'silence' | 'play' | 'done';

const ISSUE_TEXT: Record<Exclude<CalibrationIssue, null>, Txt> = {
  'too-noisy': tx(
    'O toque não se destacou do ruído do ambiente. Chegue o celular mais perto do uke ou procure um lugar mais quieto e refaça.',
    "Your playing didn't stand out from the room noise. Move the phone closer to the uke or find a quieter spot and try again.",
  ),
  'too-quiet': tx(
    'Quase nada chegou ao microfone. Confira se é o microfone certo e toque mais perto dele.',
    'Almost nothing reached the microphone. Check that it is the right microphone and play closer to it.',
  ),
};

const db = (rms: number) => `${Math.round(toDb(rms))} dB`.replace('-', '−');

/**
 * Mede o ruído do ambiente (silêncio) e o volume do uke (toques) e ajusta o limiar de
 * detecção e o ganho. Só funciona com o microfone ligado.
 */
export function MicCalibrator() {
  const t = useT();
  const lang = useLang();
  const calibration = useMusicStore((s) => s.settings.micCalibration);
  const update = useMusicStore((s) => s.updateSettings);
  const [step, setStep] = useState<Step>('idle');
  const [issue, setIssue] = useState<CalibrationIssue>(null);
  const [left, setLeft] = useState(0);
  const alive = useRef(true);
  useEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);

  const countdown = (ms: number) => {
    const end = Date.now() + ms;
    setLeft(Math.ceil(ms / 1000));
    const id = window.setInterval(() => {
      const s = Math.max(0, Math.ceil((end - Date.now()) / 1000));
      if (alive.current) setLeft(s);
      if (s === 0) window.clearInterval(id);
    }, 200);
  };

  const run = async () => {
    setIssue(null);
    try {
      setStep('silence');
      countdown(SILENCE_MS);
      const noise = await micInput.sampleLevels(SILENCE_MS);
      if (!alive.current) return;
      setStep('play');
      countdown(PLAY_MS);
      const play = await micInput.sampleLevels(PLAY_MS);
      if (!alive.current) return;
      const result = calibrate(noise, play);
      setIssue(result.issue);
      if (!result.issue) update({ micCalibration: result.calibration });
      setStep('done');
    } catch {
      if (alive.current) setStep('idle');
    }
  };

  const busy = step === 'silence' || step === 'play';

  return (
    <div className="mic-calibration" aria-live="polite">
      <div className="mic-calibration-head">
        <span className="eyebrow">{t('Calibração', 'Calibration')}</span>
        {calibration ? (
          <span className="small muted">
            {t('Ruído', 'Noise')} {db(calibration.noiseRms)} · {t('toque', 'playing')}{' '}
            {db(calibration.playRms)} · {t('ganho', 'gain')} ×
            {calibration.gain.toLocaleString(LOCALE[lang])}
          </span>
        ) : (
          <span className="small muted">{t('Padrão de fábrica', 'Factory default')}</span>
        )}
      </div>
      {busy ? (
        <p className="mic-calibration-step" data-step={step} role="status">
          {step === 'silence' ? (
            <>
              <strong>{t('Silêncio.', 'Silence.')}</strong>{' '}
              {t('Não toque nada…', "Don't play anything…")} {left}
            </>
          ) : (
            <>
              <strong>{t('Agora toque', 'Now play')}</strong>{' '}
              {t(
                'algumas notas soltas, no volume de sempre…',
                'a few single notes at your usual volume…',
              )}{' '}
              {left}
            </>
          )}
        </p>
      ) : null}
      {step === 'done' && issue ? (
        <p className="notice" role="status">
          {t(ISSUE_TEXT[issue])}
        </p>
      ) : null}
      {step === 'done' && !issue ? (
        <p className="small chart-loaded" role="status">
          {t(
            `Calibrado. Sons mais fracos que ${db(calibration?.minRms ?? 0)}, já com o ganho, são ignorados.`,
            `Calibrated. Sounds quieter than ${db(calibration?.minRms ?? 0)}, after gain, are ignored.`,
          )}
        </p>
      ) : null}
      <div className="editor-actions">
        {calibration && !busy ? (
          <button
            type="button"
            className="link-button"
            onClick={() => update({ micCalibration: null })}
          >
            {t('Voltar ao padrão', 'Reset to default')}
          </button>
        ) : null}
        <button type="button" className="button" onClick={() => void run()} disabled={busy}>
          {calibration
            ? t('Recalibrar', 'Recalibrate')
            : t('Calibrar microfone', 'Calibrate microphone')}
        </button>
      </div>
    </div>
  );
}
