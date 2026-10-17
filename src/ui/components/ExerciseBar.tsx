import { EXERCISES, exerciseDef, exerciseProgress, type ExerciseId } from '@/core/exercises';
import { useMusicStore } from '@/store/useMusicStore';
import { useToggleJam } from '../hooks/useJamSync';

/**
 * Exercícios guiados. Sem exercício: a lista para escolher. Com um em andamento:
 * progresso e o retorno de cada nota, tocada na tela ou no microfone.
 * `compact` (modo prática) mostra só o exercício em andamento, numa linha.
 */
export function ExerciseBar({ compact = false }: { compact?: boolean }) {
  const exercise = useMusicStore((s) => s.exercise);
  const start = useMusicStore((s) => s.startExercise);
  const playing = useMusicStore((s) => s.jam.playing);
  const toggleJam = useToggleJam();

  if (!exercise) {
    if (compact) return null;
    return (
      <section className="exercise-bar" aria-label="Exercícios guiados">
        <span className="eyebrow">Exercícios</span>
        <div className="exercise-picks">
          {EXERCISES.map((e) => (
            <button key={e.id} type="button" className="exercise-pick" onClick={() => start(e.id)}>
              <strong>{e.title}</strong>
              <span>{e.goal}</span>
            </button>
          ))}
        </div>
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
      aria-label={`Exercício: ${def.title}`}
    >
      <div className="exercise-head">
        <strong className="exercise-title">{def.title}</strong>
        <div
          className="exercise-meter"
          role="progressbar"
          aria-label={def.unit}
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
          <span className="exercise-misses mono" aria-label={`${exercise.misses} erros`}>
            ✕{exercise.misses}
          </span>
        ) : null}
        <div className="exercise-actions">
          {askJam ? (
            <button type="button" className="link-button" onClick={toggleJam}>
              Tocar a base
            </button>
          ) : null}
          <button type="button" className="link-button" onClick={() => start(exercise.id)}>
            Recomeçar
          </button>
          <button
            type="button"
            className="icon-button exercise-close"
            aria-label="Encerrar exercício"
            onClick={() => start(null)}
          >
            ×
          </button>
        </div>
      </div>
      <p className="exercise-feedback" data-kind={fb?.kind} aria-live="polite">
        {fb?.text ?? def.goal}
      </p>
    </section>
  );
}

/** Escolha de exercício compacta, para a barra do modo prática. */
export function ExerciseSelect() {
  const id = useMusicStore((s) => s.exercise?.id ?? '');
  const start = useMusicStore((s) => s.startExercise);
  return (
    <select
      className="select practice-preset"
      aria-label="Exercício"
      value={id}
      onChange={(e) => start((e.target.value || null) as ExerciseId | null)}
    >
      <option value="">Exercício</option>
      {EXERCISES.map((e) => (
        <option key={e.id} value={e.id}>
          {e.title}
        </option>
      ))}
    </select>
  );
}
