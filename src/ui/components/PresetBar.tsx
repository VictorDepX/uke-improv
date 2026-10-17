import { PRESETS, matchPreset } from '@/core/presets';
import { useMusicStore } from '@/store/useMusicStore';

function useActivePresetId(): string | undefined {
  const key = useMusicStore((s) => s.key);
  const progressionId = useMusicStore((s) => s.jam.progressionId);
  const bpm = useMusicStore((s) => s.jam.bpm);
  return matchPreset({ key, progressionId, bpm })?.id;
}

/** Faixa de presets: um toque ajusta tom, escala, progressão e andamento. */
export function PresetBar() {
  const apply = useMusicStore((s) => s.applyPreset);
  const active = useActivePresetId();
  return (
    <div className="preset-bar" role="radiogroup" aria-label="Presets">
      {PRESETS.map((p) => (
        <button
          key={p.id}
          type="button"
          role="radio"
          aria-checked={p.id === active}
          className="preset"
          onClick={() => apply(p)}
        >
          <span className="preset-name">{p.name}</span>
          <span className="preset-bpm mono">{p.bpm}</span>
        </button>
      ))}
    </div>
  );
}

/** Versão compacta para o modo prática. */
export function PresetSelect() {
  const apply = useMusicStore((s) => s.applyPreset);
  const active = useActivePresetId();
  return (
    <select
      id="practice-preset"
      className="select practice-preset"
      aria-label="Preset"
      value={active ?? ''}
      onChange={(e) => {
        const preset = PRESETS.find((p) => p.id === e.target.value);
        if (preset) apply(preset);
      }}
    >
      <option value="" disabled>
        Preset
      </option>
      {PRESETS.map((p) => (
        <option key={p.id} value={p.id}>
          {p.name}
        </option>
      ))}
    </select>
  );
}
