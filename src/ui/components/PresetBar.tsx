import { PRESETS, matchPreset } from '@/core/presets';
import { useMusicStore } from '@/store/useMusicStore';
import { useT } from '@/i18n';

function useActivePresetId(): string | undefined {
  const key = useMusicStore((s) => s.key);
  const progressionId = useMusicStore((s) => s.jam.progressionId);
  const bpm = useMusicStore((s) => s.jam.bpm);
  const grooveId = useMusicStore((s) => s.jam.grooveId);
  return matchPreset({ key, progressionId, bpm, grooveId })?.id;
}

/** Faixa de presets: um toque ajusta tom, escala, progressão e andamento. */
export function PresetBar() {
  const t = useT();
  const apply = useMusicStore((s) => s.applyPreset);
  const active = useActivePresetId();
  return (
    <section className="preset-section" aria-labelledby="presets-title">
      <h2 id="presets-title" className="field-label">
        {t('Bases prontas', 'Ready-made backings')}
      </h2>
      <div className="preset-bar" role="radiogroup" aria-labelledby="presets-title">
        {PRESETS.map((p) => (
          <button
            key={p.id}
            type="button"
            role="radio"
            aria-checked={p.id === active}
            className="preset"
            onClick={() => apply(p)}
          >
            <span className="preset-name">{t(p.name)}</span>
            <span className="preset-bpm mono">{p.bpm}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

/** Versão compacta para o modo prática. */
export function PresetSelect() {
  const t = useT();
  const apply = useMusicStore((s) => s.applyPreset);
  const active = useActivePresetId();
  return (
    <select
      id="practice-preset"
      className="select practice-preset"
      aria-label={t('Base pronta', 'Ready-made backing')}
      value={active ?? ''}
      onChange={(e) => {
        const preset = PRESETS.find((p) => p.id === e.target.value);
        if (preset) apply(preset);
      }}
    >
      <option value="" disabled>
        {t('Base: escolha uma', 'Backing: pick one')}
      </option>
      {PRESETS.map((p) => (
        <option key={p.id} value={p.id}>
          {t('Base', 'Backing')}: {t(p.name)} · {p.bpm} BPM
        </option>
      ))}
    </select>
  );
}
