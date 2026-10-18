import { useEffect, useRef, useState } from 'react';
import { calibrate, toDb, type CalibrationIssue } from '@/audio/analysis/calibrate';
import { micInput } from '@/audio/engine/mic';
import { useMusicStore } from '@/store/useMusicStore';

const SILENCE_MS = 2000;
const PLAY_MS = 3000;

type Step = 'idle' | 'silence' | 'play' | 'done';

const ISSUE_TEXT: Record<Exclude<CalibrationIssue, null>, string> = {
  'too-noisy':
    'O toque não se destacou do ruído do ambiente. Chegue o celular mais perto do uke ou procure um lugar mais quieto e refaça.',
  'too-quiet':
    'Quase nada chegou ao microfone. Confira se é o microfone certo e toque mais perto dele.',
};

const db = (rms: number) => `${Math.round(toDb(rms))} dB`.replace('-', '−');

/**
 * Mede o ruído do ambiente (silêncio) e o volume do uke (toques) e ajusta o limiar de
 * detecção e o ganho. Só funciona com o microfone ligado.
 */
export function MicCalibrator() {
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
        <span className="eyebrow">Calibração</span>
        {calibration ? (
          <span className="small muted">
            Ruído {db(calibration.noiseRms)} · toque {db(calibration.playRms)} · ganho ×
            {calibration.gain.toLocaleString('pt-BR')}
          </span>
        ) : (
          <span className="small muted">Padrão de fábrica</span>
        )}
      </div>
      {busy ? (
        <p className="mic-calibration-step" data-step={step} role="status">
          {step === 'silence' ? (
            <>
              <strong>Silêncio.</strong> Não toque nada… {left}
            </>
          ) : (
            <>
              <strong>Agora toque</strong> algumas notas soltas, no volume de sempre… {left}
            </>
          )}
        </p>
      ) : null}
      {step === 'done' && issue ? (
        <p className="notice" role="status">
          {ISSUE_TEXT[issue]}
        </p>
      ) : null}
      {step === 'done' && !issue ? (
        <p className="small chart-loaded" role="status">
          Calibrado. Sons mais fracos que {db(calibration?.minRms ?? 0)}, já com o ganho, são
          ignorados.
        </p>
      ) : null}
      <div className="editor-actions">
        {calibration && !busy ? (
          <button
            type="button"
            className="link-button"
            onClick={() => update({ micCalibration: null })}
          >
            Voltar ao padrão
          </button>
        ) : null}
        <button type="button" className="button" onClick={() => void run()} disabled={busy}>
          {calibration ? 'Recalibrar' : 'Calibrar microfone'}
        </button>
      </div>
    </div>
  );
}
