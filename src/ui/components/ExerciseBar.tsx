import { EXERCISES, exerciseDef, exerciseProgress, type ExerciseId } from '@/core/exercises';
import { useMusicStore } from '@/store/useMusicStore';
import { useToggleJam } from '../hooks/useJamSync';
import { useT } from '@/i18n';
import { Segmented, Select } from './controls';
import { Icon } from './Icon';

/**
 * Exercícios guiados. Sem exercício: a lista para escolher. Com um em andamento:
 * progresso e o retorno de cada nota, tocada na tela ou no microfone.
 * `compact` (modo prática) mostra só o exercício em andamento, numa linha.
 */
export function ExerciseBar({ compact = false }: { compact?: boolean }) {
  const t = useT();
  const exercise = useMusicStore((s) => s.exercise);
  const start = useMusicStore((s) => s.startExercise);
  const playing = useMusicStore((s) => s.jam.playing);
  const toggleJam = useToggleJam();

  if (!exercise && compact) return null;

  const modes = [
    { value: 'livre', label: t('Livre', 'Free') },
    ...EXERCISES.map((e) => ({ value: e.id as string, label: t(e.title) })),
  ];
  const pick = (v: string) => start(v === 'livre' ? null : (v as ExerciseId));
  const picker = compact ? null : (
    <div className="exercise-mode">
      <div className="field-row mode-wide">
        <Segmented
          label={t('Modo', 'Mode')}
          value={exercise?.id ?? 'livre'}
          options={modes}
          onChange={pick}
        />
      </div>
      <div className="mode-narrow">
        <Select
          id="exercise-mode"
          label={t('Modo', 'Mode')}
          value={exercise?.id ?? 'livre'}
          options={modes}
          onChange={pick}
        />
      </div>
    </div>
  );

  if (!exercise) {
    return (
      <section className="exercise-bar" aria-label={t('Exercícios guiados', 'Guided exercises')}>
        {picker}
        <p className="exercise-goal">
          {t(
            'Livre: sem regra, o braço só sugere. Os outros modos conferem cada nota que você toca.',
            'Free: no rules, the fretboard only suggests. The other modes check every note you play.',
          )}
        </p>
      </section>
    );
  }

  const def = exerciseDef(exercise.id);
  const progress = Math.min(exerciseProgress(exercise), def.target);
  const fb = exercise.feedback;
  const askJam = def.needsJam && !playing && !exercise.done;

  return (
    <section
      className="exercise-bar"
      data-active
      data-compact={compact || undefined}
      data-done={exercise.done || undefined}
      aria-label={t(`Exercício: ${t(def.title)}`, `Exercise: ${t(def.title)}`)}
    >
      {picker}
      <div className="exercise-head">
        {compact ? <strong className="exercise-title">{t(def.title)}</strong> : null}
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
