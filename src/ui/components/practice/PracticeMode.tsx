import { useEffect, useRef } from 'react';
import { playNote } from '@/audio/engine/sound';
import { sameChord } from '@/core/harmony';
import { barLabel } from '@/core/progressions';
import { midiName, prefersFlats } from '@/core/music';
import { useActiveProgression, useDiatonicChords, useNoteSuggestions } from '@/store/selectors';
import { useMusicStore } from '@/store/useMusicStore';
import { useJamPreview } from '../../hooks/useJamPreview';
import { useToggleJam } from '../../hooks/useJamSync';
import { ExerciseBar, ExerciseSelect } from '../ExerciseBar';
import { LiveFretboard } from '../LiveFretboard';
import { PresetSelect } from '../PresetBar';
import { TapTempo } from '../jam/TapTempo';
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
  const current = useMusicStore((s) => s.currentChord);
  const key = useMusicStore((s) => s.key);
  const jam = useMusicStore((s) => s.jam);
  const setChord = useMusicStore((s) => s.setChord);
  const setBpm = useMusicStore((s) => s.setBpm);
  const registerNote = useMusicStore((s) => s.registerNote);
  const followHand = useMusicStore((s) => s.settings.fretWindow === 'auto');
  const updateSettings = useMusicStore((s) => s.updateSettings);
  const arpeggio = useMusicStore((s) => s.settings.arpeggio);
  const suggestions = useNoteSuggestions();
  const diatonic = useDiatonicChords();
  const { bars } = useActiveProgression();
  const { next, previewChord } = useJamPreview();
  const toggleJam = useToggleJam();
  const flats = prefersFlats(key);
  const activeBar = jam.playing && jam.bar >= 0 ? jam.bar % bars.length : -1;

  useEffect(() => {
    void enterImmersive();
    closeRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      exitImmersive();
    };
  }, [onClose]);

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
          className="practice-close"
          onClick={onClose}
          aria-label={t('Sair do modo prática', 'Exit practice mode')}
        >
          <span aria-hidden="true" />
        </button>

        <div className="practice-chord" aria-live="polite">
          <span className="practice-chord-now">{n(current)}</span>
          {next ? (
            <span className="practice-chord-next">
              <span aria-hidden="true">→</span> {n(next)}
            </span>
          ) : null}
        </div>

        <ol
          className="practice-suggestions"
          aria-label={t('Próximas notas sugeridas', 'Suggested next notes')}
        >
          {suggestions.length === 0 ? (
            <li className="practice-hint">{t('Toque uma casa', 'Tap a fret')}</li>
          ) : (
            suggestions.map((s, i) => (
              <li key={s.midi}>
                <button
                  type="button"
                  className="practice-note"
                  data-cls={s.cls}
                  onClick={() => {
                    registerNote(s.midi);
                    void playNote(s.midi);
                  }}
                >
                  <span className="practice-note-rank">{i + 1}</span>
                  {n(midiName(s.midi, flats))}
                </button>
              </li>
            ))
          )}
        </ol>

        <div className="practice-transport">
          <button
            type="button"
            className="practice-play"
            aria-pressed={jam.playing}
            aria-label={
              jam.playing
                ? t('Parar a base', 'Stop the backing track')
                : t('Tocar a base', 'Play the backing track')
            }
            onClick={toggleJam}
          >
            <span
              className="play-icon"
              data-playing={jam.playing || undefined}
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            className="icon-button"
            aria-label={t('Diminuir andamento', 'Slower')}
            onClick={() => setBpm(jam.bpm - 5)}
          >
            −
          </button>
          <span className="practice-bpm mono" aria-label={`${jam.bpm} BPM`}>
            {jam.bpm}
          </span>
          <button
            type="button"
            className="icon-button"
            aria-label={t('Aumentar andamento', 'Faster')}
            onClick={() => setBpm(jam.bpm + 5)}
          >
            +
          </button>
          <TapTempo className="practice-tap" />
        </div>
      </div>

      <div className="practice-row">
        {jam.playing ? (
          <ol
            className="practice-strip"
            aria-label={t('Compassos da progressão', 'Bars of the progression')}
          >
            {bars.map((b, i) => (
              <li
                key={`${barLabel(b)}-${i}`}
                className="practice-chip"
                data-active={i === activeBar || undefined}
              >
                {barLabel(b.map(n))}
              </li>
            ))}
          </ol>
        ) : (
          <div
            className="practice-strip"
            role="radiogroup"
            aria-label={t('Acorde atual', 'Current chord')}
          >
            {diatonic.map((d) => (
              <button
                key={d.numeral}
                type="button"
                role="radio"
                aria-checked={sameChord(d.symbol, current)}
                className="practice-chip"
                data-func={d.func}
                onClick={() => setChord(d.symbol)}
              >
                {n(d.symbol)}
              </button>
            ))}
          </div>
        )}
        <PresetSelect />
        <ExerciseSelect />
        <button
          type="button"
          className="practice-region"
          aria-pressed={arpeggio}
          onClick={() => updateSettings({ arpeggio: !arpeggio })}
        >
          {t('Só arpejo', 'Arpeggio only')}
        </button>
        <button
          type="button"
          className="practice-region"
          aria-pressed={followHand}
          onClick={() => updateSettings({ fretWindow: followHand ? null : 'auto' })}
        >
          {followHand
            ? t('Braço inteiro', 'Whole fretboard')
            : t('Seguir a mão', 'Follow your hand')}
        </button>
      </div>

      <ExerciseBar compact />

      <div className="practice-board">
        <LiveFretboard previewChord={previewChord} legend={false} />
      </div>
      <p className="practice-rotate">
        {t(
          'Gire o celular para ver o braço inteiro.',
          'Turn your phone sideways to see the whole fretboard.',
        )}
      </p>
    </div>
  );
}
