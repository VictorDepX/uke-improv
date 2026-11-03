import { EXERCISES, exerciseDef, exerciseProgress, type ExerciseId } from '@/core/exercises';
import { useMusicStore } from '@/store/useMusicStore';
import { useToggleJam } from '../hooks/useJamSync';
import { useNames, useT } from '@/i18n';
import { classifyNote } from '@/core/classify';
import { useNoteContext } from '@/store/selectors';
import { Icon } from './Icon';

/**
 * Exercício em andamento (modo prática): progresso e o retorno de cada nota, tocada na tela ou
 * no microfone, numa linha. A escolha fica no seletor do modo prática (ExerciseSelect).
 */
export function ExerciseBar() {
  const t = useT();
  const exercise = useMusicStore((s) => s.exercise);
  const start = useMusicStore((s) => s.startExercise);
  const playing = useMusicStore((s) => s.jam.playing);
  const toggleJam = useToggleJam('exercise');
  const ctx = useNoteContext();
  const current = useMusicStore((s) => s.currentChord);
  const arpeggio = useMusicStore((s) => s.settings.arpeggio);
  const n = useNames();

  if (!exercise) return null;

  const def = exerciseDef(exercise.id);
  const progress = Math.min(exerciseProgress(exercise), def.target);
  const fb = exercise.feedback;
  // Pentatônicas, acordes dóricos e o "Só arpejo" podem não ter tensão sobre o acorde atual:
  // sem aviso, "Resolva a tensão" pareceria quebrado.
  const noTension =
    exercise.id === 'resolva' &&
    !exercise.done &&
    !Array.from({ length: 12 }, (_, c) => c).some((c) => classifyNote(c, ctx) === 'tensao');
  const askJam = def.needsJam && !playing && !exercise.done;

  return (
    <section
      className="exercise-bar"
      data-active
      data-compact
      data-done={exercise.done || undefined}
      aria-label={t(`Exercício: ${t(def.title)}`, `Exercise: ${t(def.title)}`)}
    >
      <div className="exercise-head">
        <strong className="exercise-title">{t(def.title)}</strong>
        <div
          className="exercise-meter"
          role="progressbar"
          aria-label={t(def.unit)}
          aria-valuemin={0}
          aria-valuemax={def.target}
          aria-valuenow={progress}
        >
          <span style={{ width: `${(progress / def.target) * 100}%` }} />
        </div>
        <span className="exercise-count mono">
          {progress}/{def.target}
        </span>
        {exercise.misses ? (
          <span
            className="exercise-misses mono"
            aria-label={t(`${exercise.misses} erros`, `${exercise.misses} misses`)}
          >
            ✕{exercise.misses}
          </span>
        ) : null}
        <div className="exercise-actions">
          {askJam ? (
            <button type="button" className="link-button" onClick={toggleJam}>
              {t('Tocar a base', 'Play the backing track')}
            </button>
          ) : null}
          <button type="button" className="link-button" onClick={() => start(exercise.id)}>
            {t('Recomeçar', 'Restart')}
          </button>
          <button
            type="button"
            className="icon-button exercise-close"
            aria-label={t('Encerrar exercício', 'End exercise')}
            onClick={() => start(null)}
          >
            <Icon name="close" size={20} />
          </button>
        </div>
      </div>
      <p className="exercise-feedback" data-kind={fb?.kind} aria-live="polite">
        {t(fb?.text ?? def.goal)}
      </p>
      {noTension ? (
        <p className="notice exercise-notice" role="status">
          {arpeggio
            ? t(
                `Com "Só arpejo" ligado, sobre ${n(current)} não há nota de tensão. Desligue em Ajustes ou escolha um acorde com sétima.`,
                `With "Arpeggio only" on, ${n(current)} has no tension note. Turn it off in Settings or pick a seventh chord.`,
              )
            : t(
                `Sobre ${n(current)}, nesta escala, não há nota de tensão. Escolha outro acorde do tom (os de sétima sempre têm) ou outra escala.`,
                `Over ${n(current)}, in this scale, there is no tension note. Pick another chord in the key (seventh chords always have one) or another scale.`,
              )}
        </p>
      ) : null}
    </section>
  );
}

/** Escolha de exercício compacta, para a barra do modo prática. */
export function ExerciseSelect() {
  const t = useT();
  const id = useMusicStore((s) => s.exercise?.id ?? '');
  const start = useMusicStore((s) => s.startExercise);
  return (
    <select
      className="select practice-preset"
      aria-label={t('Exercício', 'Exercise')}
      value={id}
      onChange={(e) => start((e.target.value || null) as ExerciseId | null)}
    >
      <option value="">
        {t('Exercício', 'Exercise')}: {t('Livre', 'Free')}
      </option>
      {EXERCISES.map((e) => (
        <option key={e.id} value={e.id}>
          {t('Exercício', 'Exercise')}: {t(e.title)}
        </option>
      ))}
    </select>
  );
}
