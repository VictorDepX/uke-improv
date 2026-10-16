import { PROGRESSIONS } from '@/core/progressions';
import { useMusicStore } from '@/store/useMusicStore';

export function ProgressionPicker({ chords }: { chords: readonly string[] }) {
  const selected = useMusicStore((s) => s.jam.progressionId);
  const custom = useMusicStore((s) => s.customProgressions);
  const { playing, bar } = useMusicStore((s) => s.jam);
  const select = useMusicStore((s) => s.selectProgression);
  const remove = useMusicStore((s) => s.removeCustomProgression);
  const active = playing && bar >= 0 ? bar % chords.length : -1;

  return (
    <div className="progressions">
      <ol className="bars" aria-label="Compassos da progressão">
        {chords.map((c, i) => (
          <li key={`${c}-${i}`} className="bar" data-active={i === active || undefined}>
            <span className="mono muted">{i + 1}</span>
            <strong>{c}</strong>
          </li>
        ))}
      </ol>

      <div className="progression-list" role="radiogroup" aria-label="Progressão">
        {[...PROGRESSIONS, ...custom].map((p) => (
          <div key={p.id} className="progression-item">
            <button
              type="button"
              role="radio"
              aria-checked={p.id === selected}
              className="progression-option"
              onClick={() => select(p.id)}
            >
              <span>{p.name}</span>
              <span className="tag">{p.mode === 'major' ? 'maior' : 'menor'}</span>
            </button>
            {p.custom ? (
              <button
                type="button"
                className="icon-button"
                aria-label={`Apagar ${p.name}`}
                onClick={() => remove(p.id)}
              >
                ×
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
