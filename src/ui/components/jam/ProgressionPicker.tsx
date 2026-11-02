import type { Progression } from '@/core/types';
import { PROGRESSIONS, barLabel, meterOf } from '@/core/progressions';
import { useActiveProgression } from '@/store/selectors';
import { useMusicStore } from '@/store/useMusicStore';
import { toast } from '../../toast';
import { encodeShare } from '@/core/share';
import { TAB_PATHS } from '../../routes';
import { useLang, useNames, useT } from '@/i18n';

export function ProgressionPicker() {
  const t = useT();
  const n = useNames();
  const { bars, progression } = useActiveProgression();
  const lang = useLang();
  const key = useMusicStore((s) => s.key);
  const bpm = useMusicStore((s) => s.jam.bpm);
  const grooveId = useMusicStore((s) => s.jam.grooveId);
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

  // Link com tom, progressão, andamento e estilo; quem abre ganha a progressão já selecionada.
  const share = async () => {
    const code = encodeShare({
      key,
      progression: { ...progression, name: t(progression.name) },
      bpm,
      grooveId,
    });
    const url = `${location.origin}${TAB_PATHS[lang].jam}?s=${code}`;
    try {
      if (navigator.share) await navigator.share({ title: t(progression.name), url });
      else {
        await navigator.clipboard.writeText(url);
        toast.success(t('Link copiado.', 'Link copied.'));
      }
    } catch (err) {
      if ((err as Error).name !== 'AbortError')
        toast.error(t('Não consegui copiar o link.', "Couldn't copy the link."));
    }
  };

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

      <button type="button" className="link-button" onClick={() => void share()}>
        {t('Compartilhar esta progressão', 'Share this progression')}
      </button>

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
