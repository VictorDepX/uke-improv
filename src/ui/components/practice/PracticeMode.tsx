import { useEffect, useId, useRef, useState } from 'react';
import { chordToNumeral, findDiatonic, sameChord } from '@/core/harmony';
import { exerciseDef, exerciseProgress } from '@/core/exercises';
import { METERS } from '@/core/rhythm';
import { FUNC_LABEL } from '../../format';
import { Icon } from '../Icon';
import { Toggle } from '../controls';
import { barLabel } from '@/core/progressions';
import { useActiveProgression, useDiatonicChords } from '@/store/selectors';
import { useMusicStore } from '@/store/useMusicStore';
import { useJamPreview } from '../../hooks/useJamPreview';
import { useLatest } from '../../hooks/useLatest';
import { useLandscapePhone } from '../../hooks/useMediaQuery';
import { useToggleJam } from '../../hooks/useJamSync';
import { ExerciseBar, ExerciseSelect } from '../ExerciseBar';
import { LiveFretboard } from '../LiveFretboard';
import { PresetSelect } from '../PresetBar';
import { TapTempo } from '../jam/TapTempo';
import { PracticeNext } from './PracticeNext';
import { useNames, useT } from '@/i18n';

interface PracticeModeProps {
  onClose: () => void;
}

/** Tenta tela cheia e paisagem; ambos são opcionais (iOS e alguns navegadores recusam). */
async function enterImmersive(): Promise<void> {
  try {
    if (!document.fullscreenElement) await document.documentElement.requestFullscreen?.();
  } catch {
    /* sem tela cheia: o modo funciona igual */
  }
  try {
    const orientation = screen.orientation as ScreenOrientation & {
      lock?: (o: 'landscape') => Promise<void>;
    };
    await orientation.lock?.('landscape');
  } catch {
    /* sem trava de orientação */
  }
}

function exitImmersive(): void {
  try {
    screen.orientation?.unlock?.();
  } catch {
    /* nada a desfazer */
  }
  if (document.fullscreenElement) void document.exitFullscreen?.().catch(() => undefined);
}

/**
 * Modo prática: só o que se olha enquanto toca. Acorde atual e próximo, 3 sugestões,
 * a sequência de acordes e o braço ocupando o resto da tela.
 */
export function PracticeMode({ onClose }: PracticeModeProps) {
  const t = useT();
  const n = useNames();
  const closeRef = useRef<HTMLButtonElement>(null);
  // Celular deitado: base, exercício e chaves ficam num painel que abre por cima do braço.
  const [optionsOpen, setOptionsOpen] = useState(false);
  const optionsId = useId();
  const optionsOpenRef = useLatest(optionsOpen);
  const current = useMusicStore((s) => s.currentChord);
  const key = useMusicStore((s) => s.key);
  const jam = useMusicStore((s) => s.jam);
  const exercise = useMusicStore((s) => s.exercise);
  const setChord = useMusicStore((s) => s.setChord);
  const setBpm = useMusicStore((s) => s.setBpm);
  const fretWindowSetting = useMusicStore((s) => s.settings.fretWindow);
  // Igual ao braço: no celular deitado, sem região escolhida, a janela já segue a mão.
  const landscape = useLandscapePhone();
  const followHand = fretWindowSetting === 'auto' || (fretWindowSetting === null && landscape);
  const updateSettings = useMusicStore((s) => s.updateSettings);
  const arpeggio = useMusicStore((s) => s.settings.arpeggio);
  const lastNotes = useMusicStore((s) => s.lastNotes);
  const diatonic = useDiatonicChords();
  const { bars, meter, timeline } = useActiveProgression();
  const { next, previewChord } = useJamPreview();
  const toggleJam = useToggleJam('practice');
  const activeBar = jam.playing && jam.bar >= 0 ? jam.bar % bars.length : -1;
  const func = diatonic.find((d) => sameChord(d.symbol, current))?.func;
  const upcoming = next ?? timeline[1 % Math.max(1, timeline.length)]?.chord ?? null;
  const def = exercise ? exerciseDef(exercise.id) : null;
  const beats = METERS[meter].beats;

  useEffect(() => {
    void enterImmersive();
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      // Esc fecha primeiro o painel de opções; só depois sai do modo prática.
      if (optionsOpenRef.current) setOptionsOpen(false);
      else onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      exitImmersive();
      // Sair do modo prática para a base que foi ligada nele.
      const s = useMusicStore.getState();
      if (s.jam.playing && s.jam.startedBy === 'practice') s.setJamPlaying(false);
    };
  }, [onClose, optionsOpenRef]);

  return (
    <div
      className="practice"
      role="dialog"
      aria-modal="true"
      aria-label={t('Modo prática', 'Practice mode')}
    >
      <div className="practice-head">
        <button
          ref={closeRef}
          type="button"
          className="icon-button practice-close"
          onClick={onClose}
          aria-label={t('Sair do modo prática', 'Exit practice mode')}
        >
          <Icon name="close" />
        </button>

        <div className="transport-lcd practice-lcd" aria-live="polite">
          <div className="visor-cell">
            <span className="visor-label">{t('Acorde', 'Chord')}</span>
            <span className="visor-value">
              <span className="visor-big">{n(current)}</span>
              <span className="visor-detail">
                {[chordToNumeral(current, key), func ? t(FUNC_LABEL[func]) : null]
                  .filter(Boolean)
                  .join(' · ')}
              </span>
            </span>
          </div>
          {upcoming && jam.playing ? (
            <div className="visor-cell">
              <span className="visor-label">{t('A seguir', 'Next')}</span>
              <span className="visor-value">
                <span className="visor-big">{n(upcoming)}</span>
                <span className="visor-detail">{chordToNumeral(upcoming, key)}</span>
              </span>
            </div>
          ) : null}
          <div className="visor-cell practice-lcd-exercise">
            <span className="visor-label">{t('Exercício', 'Exercise')}</span>
            <span className="visor-value">
              <span className="visor-big">{def ? t(def.title) : t('Livre', 'Free')}</span>
              <span className="visor-detail">
                {exercise && def
                  ? `${Math.min(exerciseProgress(exercise), def.target)}/${def.target}`
                  : lastNotes.length === 0
                    ? t('toque uma casa', 'tap a fret')
                    : ''}
              </span>
            </span>
          </div>
        </div>

        <div className="practice-transport">
          <div className="beats" aria-hidden="true">
            {Array.from({ length: beats }, (_, b) => (
              <span
                key={b}
                className="beat"
                data-on={(jam.playing && b === jam.beat) || undefined}
              />
            ))}
          </div>
          <button
            type="button"
            className="button play-button practice-play"
            aria-pressed={jam.playing}
            data-playing={jam.playing || undefined}
            onClick={toggleJam}
          >
            <Icon name={jam.playing ? 'stop' : 'play'} />
            {jam.playing ? t('Parar', 'Stop') : t('Tocar base', 'Play backing')}
          </button>
          <div className="bpm">
            <button
              type="button"
              className="icon-button"
              aria-label={t('Diminuir andamento', 'Slower')}
              onClick={() => setBpm(jam.bpm - 5)}
            >
              <Icon name="minus" />
            </button>
            <span className="bpm-value">
              <span className="mono">{jam.bpm}</span>
              <small>BPM</small>
            </span>
            <button
              type="button"
              className="icon-button"
              aria-label={t('Aumentar andamento', 'Faster')}
              onClick={() => setBpm(jam.bpm + 5)}
            >
              <Icon name="plus" />
            </button>
            <TapTempo className="button practice-tap" />
          </div>
          <button
            type="button"
            className="icon-button practice-options-toggle"
            aria-label={t('Base, exercício e opções', 'Backing, exercise and options')}
            aria-expanded={optionsOpen}
            aria-controls={optionsId}
            data-open={optionsOpen || undefined}
            onClick={() => setOptionsOpen((o) => !o)}
          >
            <Icon name={optionsOpen ? 'close' : 'more'} />
          </button>
        </div>
      </div>

      {jam.playing ? (
        <ol
          className="chord-strip practice-strip"
          aria-label={t('Compassos da progressão', 'Bars of the progression')}
        >
          {bars.map((b, i) => (
            <li
              key={`${barLabel(b)}-${i}`}
              className="chord-chip"
              data-func={findDiatonic(b[0]!, key)?.func}
              data-active={i === activeBar || undefined}
              aria-current={i === activeBar || undefined}
            >
              <span className="chord-chip-numeral mono">
                {b.map((c) => chordToNumeral(c, key)).join(' ')}
              </span>
              <span className="chord-chip-symbol">{barLabel(b.map(n))}</span>
            </li>
          ))}
        </ol>
      ) : (
        <div
          className="chord-strip practice-strip"
          role="radiogroup"
          aria-label={t('Acorde atual', 'Current chord')}
        >
          {diatonic.map((d) => (
            <button
              key={d.numeral}
              type="button"
              role="radio"
              aria-checked={sameChord(d.symbol, current)}
              className="chord-chip"
              data-func={d.func}
              onClick={() => setChord(d.symbol)}
            >
              <span className="chord-chip-numeral mono">{d.numeral}</span>
              <span className="chord-chip-symbol">{n(d.symbol)}</span>
            </button>
          ))}
        </div>
      )}

      <ExerciseBar />

      <div className="practice-board">
        <LiveFretboard previewChord={previewChord} legend="compact" />
      </div>
      <PracticeNext />
      <p className="practice-rotate">
        {t(
          'Gire o celular para ver o braço inteiro.',
          'Turn your phone sideways to see the whole fretboard.',
        )}
      </p>

      <div className="practice-row" id={optionsId} data-open={optionsOpen || undefined}>
        <PresetSelect />
        <ExerciseSelect />
        <div className="practice-toggles">
          <Toggle
            id="practice-arpeggio"
            label={t('Só arpejo', 'Arpeggio only')}
            checked={arpeggio}
            onChange={(v) => updateSettings({ arpeggio: v })}
          />
          <Toggle
            id="practice-follow"
            label={t('Seguir a mão', 'Follow your hand')}
            checked={followHand}
            onChange={(v) =>
              updateSettings({
                // Deitado, desligar prende a janela onde está (sem região, ela voltaria a seguir).
                fretWindow: v
                  ? 'auto'
                  : landscape
                    ? useMusicStore.getState().autoWindowStart
                    : null,
              })
            }
          />
        </div>
      </div>
    </div>
  );
}
