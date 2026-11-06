import { canRecord } from '@/audio/engine/recorder';
import { playNote } from '@/audio/engine/sound';
import { TUNINGS } from '@/core/fretboard';
import { midiName } from '@/core/music';
import { LOCALE, useLang, useNames, useT } from '@/i18n';
import { useMusicStore } from '@/store/useMusicStore';
import { Toggle } from '../components/controls';
import { Icon } from '../components/Icon';
import { MicCalibrator } from '../components/MicCalibrator';
import { PageHead } from '../components/PageHead';
import { TakesPanel } from '../components/Takes';
import { LiveInputMeter } from '../components/Visor';
import { MicProblem } from '../components/MicProblem';
import { useMicControl } from '../hooks/useMicControl';

const IN_TUNE = 5;

/** Desvio em cents: marcas de 10 em 10, o centro em destaque e a agulha. */
function TunerMeter({ cents, active }: { cents: number; active: boolean }) {
  const t = useT();
  const clamped = Math.max(-50, Math.min(50, cents));
  return (
    <div className="tuner-meter">
      <div
        className="tuner-track"
        role="meter"
        aria-label={t('Desvio da afinação, em cents', 'Tuning offset, in cents')}
        aria-valuemin={-50}
        aria-valuemax={50}
        aria-valuenow={Math.round(clamped)}
      >
        {Array.from({ length: 11 }, (_, i) => (
          <span key={i} className="tuner-tick" data-center={i === 5 || undefined} />
        ))}
        {active ? (
          <span
            className="tuner-needle"
            style={{ transform: `translateX(${clamped}%)` }}
            data-in-tune={Math.abs(cents) <= IN_TUNE || undefined}
          />
        ) : null}
      </div>
      <span className="tuner-scale mono" aria-hidden="true">
        <span>−50</span>
        <span>0</span>
        <span>+50 cents</span>
      </span>
    </div>
  );
}

/** Afinador: microfone, visor com nota, desvio e acorde, o medidor e as quatro cordas. */
export function TunerPage() {
  const t = useT();
  const n = useNames();
  const lang = useLang();
  const { status, start, stop } = useMicControl();
  // Campos separados: o nível do microfone (que muda a cada leitura) fica com o medidor.
  const micNote = useMusicStore((s) => s.mic.note);
  const micChord = useMusicStore((s) => s.mic.chord);
  const followChords = useMusicStore((s) => s.mic.followChords);
  const setMic = useMusicStore((s) => s.setMic);
  const tuning = useMusicStore((s) => s.settings.tuning);
  const on = status === 'on';
  const note = on ? micNote : null;
  const cents = note?.cents ?? 0;
  const open = TUNINGS[tuning].open;
  const nearest = note
    ? open.reduce((best, m) => (Math.abs(m - note.midi) < Math.abs(best - note.midi) ? m : best))
    : null;
  const hz = note ? 440 * 2 ** ((note.midi - 69 + note.cents / 100) / 12) : null;
  const name = note ? midiName(note.midi, false) : null;
  const pitch = name?.replace(/-?\d+$/, '');
  const octave = name?.match(/-?\d+$/)?.[0];
  const direction =
    !note || Math.abs(cents) <= IN_TUNE
      ? t('afinado', 'in tune')
      : cents < 0
        ? t('baixo', 'flat')
        : t('alto', 'sharp');

  return (
    <div className="page page-tuner">
      <PageHead
        tab="afinador"
        lead={t(
          'Toque uma corda solta por vez. A agulha mostra quanto falta, em cents.',
          'Play one open string at a time. The needle shows how far off it is, in cents.',
        )}
      />
      <div className="tuner-layout">
        <div className="tuner-main">
          <div className="tuner-mic">
            <button
              type="button"
              className="icon-button mic-toggle"
              data-live={on || undefined}
              aria-pressed={on}
              aria-label={t('Microfone', 'Microphone')}
              disabled={status === 'starting'}
              onClick={() => (on ? stop() : void start())}
            >
              <Icon name="mic" />
            </button>
            <span className="tuner-mic-state">
              {on
                ? t('Ouvindo', 'Listening')
                : status === 'starting'
                  ? t('Abrindo…', 'Opening…')
                  : t('Microfone desligado', 'Microphone off')}
            </span>
            <LiveInputMeter />
            <button
              type="button"
              className="button button-ghost tuner-mic-switch"
              disabled={status === 'starting'}
              onClick={() => (on ? stop() : void start())}
            >
              {on
                ? t('Desligar microfone', 'Turn microphone off')
                : t('Ligar microfone', 'Turn microphone on')}
            </button>
          </div>
          {status === 'denied' || status === 'error' ? (
            <MicProblem alert onRetry={() => void start()} />
          ) : null}

          <div className="transport-lcd tuner-lcd" aria-live="polite">
            <div className="visor-cell">
              <span className="visor-label">{t('Nota', 'Note')}</span>
              <span className="visor-value">
                <span className="visor-big">{pitch ? n(pitch) : '–'}</span>
                <span className="visor-detail">
                  {hz
                    ? `${octave} · ${hz.toLocaleString(LOCALE[lang], { maximumFractionDigits: 1, minimumFractionDigits: 1 })} Hz`
                    : ''}
                </span>
              </span>
            </div>
            <div className="visor-cell">
              <span className="visor-label">{t('Desvio', 'Offset')}</span>
              <span className="visor-value">
                <span className="visor-big">
                  {note
                    ? `${cents > 0 ? '+' : cents < 0 ? '−' : ''}${Math.abs(Math.round(cents))}`
                    : '–'}
                </span>
                <span className="visor-detail">{note ? `cents · ${direction}` : ''}</span>
              </span>
            </div>
            <div className="visor-cell">
              <span className="visor-label">{t('Acorde', 'Chord')}</span>
              <span className="visor-value">
                <span className="visor-big">{on && micChord ? n(micChord.symbol) : '–'}</span>
                <span className="visor-detail">
                  {on && micChord
                    ? `${Math.round(micChord.score * 100)}%`
                    : t('toque 3 cordas ou mais', 'play 3 strings or more')}
                </span>
              </span>
            </div>
          </div>

          <TunerMeter cents={cents} active={!!note} />

          <div className="field-row">
            <span className="field-label" id="tuner-strings">
              {t('Corda', 'String')}
            </span>
            <div className="tuner-strings" role="group" aria-labelledby="tuner-strings">
              {open.map((m) => {
                const label = n(midiName(m, false));
                return (
                  <button
                    key={m}
                    type="button"
                    className="tonic-key tuner-string"
                    aria-pressed={m === nearest}
                    aria-label={t(
                      `${label}: ouvir a nota de referência`,
                      `${label}: play the reference note`,
                    )}
                    onClick={() => void playNote(m)}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
          <p className="tuner-note">
            {tuning === 'GCEA'
              ? t(
                  'GCEA com G agudo: a corda G soa acima do C. Para G grave, troque a afinação em Ajustes.',
                  'GCEA with high G: the G string sounds above the C. For low G, change the tuning in Settings.',
                )
              : t(
                  'GCEA com G grave: a corda G soa uma oitava abaixo. Para G agudo, troque a afinação em Ajustes.',
                  'GCEA with low G: the G string sounds an octave lower. For high G, change the tuning in Settings.',
                )}
          </p>
        </div>

        <aside className="tuner-side">
          <section className="panel panel-tool">
            {on ? (
              <MicCalibrator />
            ) : (
              <div className="mic-calibration">
                <div className="mic-calibration-head">
                  <span className="eyebrow">{t('Calibração', 'Calibration')}</span>
                </div>
                <p className="small muted">
                  {t(
                    'Calibre se o microfone pega pouco som ou reage a ruído de fundo. Ligue o microfone para começar.',
                    'Calibrate if the microphone picks up too little or reacts to background noise. Turn the microphone on to start.',
                  )}
                </p>
              </div>
            )}
          </section>
          {canRecord() ? (
            <section className="panel panel-tool">
              {on ? (
                <TakesPanel />
              ) : (
                <div className="takes">
                  <div className="takes-head">
                    <span className="eyebrow">{t('Gravar improviso', 'Record your improv')}</span>
                    <span className="small muted">
                      {t(
                        'Até 3 minutos. A gravação fica só no seu aparelho. Ligue o microfone para gravar.',
                        'Up to 3 minutes. The recording stays on your device. Turn the microphone on to record.',
                      )}
                    </span>
                  </div>
                </div>
              )}
            </section>
          ) : null}
          <Toggle
            id="tuner-follow"
            label={t('Seguir acorde ouvido', 'Follow the chord I play')}
            hint={t(
              'O acorde detectado vira o acorde atual do braço',
              'The detected chord becomes the current chord',
            )}
            checked={followChords}
            onChange={(v) => setMic({ followChords: v })}
          />
        </aside>
      </div>
    </div>
  );
}
