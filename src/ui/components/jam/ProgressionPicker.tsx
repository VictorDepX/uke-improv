import type { Progression } from '@/core/types';
import { PROGRESSIONS, barLabel, meterOf } from '@/core/progressions';
import { useActiveProgression } from '@/store/selectors';
import { useMusicStore } from '@/store/useMusicStore';
import { toast } from '../../toast';
import { useNames, useT } from '@/i18n';

export function ProgressionPicker() {
  const t = useT();
  const n = useNames();
  const { bars } = useActiveProgression();
  const selected = useMusicStore((s) => s.jam.progressionId);
  const custom = useMusicStore((s) => s.customProgressions);
  const { playing, bar } = useMusicStore((s) => s.jam);
  const select = useMusicStore((s) => s.selectProgression);
  const remove = useMusicStore((s) => s.removeCustomProgression);
  const restore = useMusicStore((s) => s.addCustomProgression);

  const removeWithUndo = (p: Progression) => {
    const wasSelected = p.id === selected;
    remove(p.id);
    toast.info(t(`“${t(p.name)}” apagada.`, `“${t(p.name)}” deleted.`), {
      label: t('Desfazer', 'Undo'),
      run: () => {
        restore(p);
        if (!wasSelected) select(selected);
      },
    });
  };
  const active = playing && bar >= 0 ? bar % bars.length : -1;

  return (
    <div className="progressions">
      <ol className="bars" aria-label={t('Compassos da progressão', 'Bars of the progression')}>
        {bars.map((b, i) => (
          <li
            key={`${barLabel(b)}-${i}`}
            className="bar"
            data-active={i === active || undefined}
            data-split={b.length > 1 || undefined}
          >
            <span className="mono muted">{i + 1}</span>
            <strong>{barLabel(b.map(n))}</strong>
          </li>
        ))}
      </ol>

      <div
        className="progression-list"
        role="radiogroup"
        aria-label={t('Progressão', 'Progression')}
      >
        {[...PROGRESSIONS, ...custom].map((p) => (
          <div key={p.id} className="progression-item">
            <button
              type="button"
              role="radio"
              aria-checked={p.id === selected}
              className="progression-option"
              onClick={() => select(p.id)}
            >
              <span>{t(p.name)}</span>
              <span className="progression-tags">
                {meterOf(p) !== '4/4' ? <span className="tag">{meterOf(p)}</span> : null}
                <span className="tag">
                  {p.mode === 'major' ? t('maior', 'major') : t('menor', 'minor')}
                </span>
              </span>
            </button>
            {p.custom ? (
              <button
                type="button"
                className="icon-button"
                aria-label={t(`Apagar ${t(p.name)}`, `Delete ${t(p.name)}`)}
                onClick={() => removeWithUndo(p)}
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
