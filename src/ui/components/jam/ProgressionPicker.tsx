import type { Progression } from '@/core/types';
import { findDiatonic } from '@/core/harmony';
import { PROGRESSIONS, meterOf } from '@/core/progressions';
import { chordToNumeral } from '@/core/harmony';
import { useActiveProgression } from '@/store/selectors';
import { useMusicStore } from '@/store/useMusicStore';
import { toast } from '../../toast';
import { encodeShare } from '@/core/share';
import { TAB_PATHS, navigateTo } from '../../routes';
import { useLang, useNames, useT } from '@/i18n';
import { Icon } from '../Icon';
import { ChordName } from '../ChordName';
import { StylePicker } from './StylePicker';

/**
 * Progressão da base (coluna principal do Jam): nome e compasso, estilo e os compassos como
 * pads, com o tocando agora em destaque; colar uma cifra e compartilhar.
 */
export function ProgressionPanel() {
  const t = useT();
  const n = useNames();
  const lang = useLang();
  const { bars, progression, meter } = useActiveProgression();
  const key = useMusicStore((s) => s.key);
  const bpm = useMusicStore((s) => s.jam.bpm);
  const grooveId = useMusicStore((s) => s.jam.grooveId);
  const { playing, bar } = useMusicStore((s) => s.jam);
  const active = playing && bar >= 0 ? bar % bars.length : 0;

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
    <section className="panel progression-panel" aria-labelledby="progression-title">
      <header className="panel-head">
        <h2 id="progression-title">{t('Progressão', 'Progression')}</h2>
        <span className="panel-sub">
          {t(progression.name)} · {meter}
        </span>
        <span className="panel-actions">
          <button
            type="button"
            className="button button-ghost"
            onClick={() => navigateTo('cifra', lang)}
          >
            {t('Colar uma cifra', 'Paste a chord chart')}
          </button>
          <button type="button" className="button button-ghost" onClick={() => void share()}>
            {t('Compartilhar', 'Share')}
          </button>
        </span>
      </header>
      <div className="field-row">
        <StylePicker />
      </div>
      <ol className="bars" aria-label={t('Compassos da progressão', 'Bars of the progression')}>
        {bars.map((b, i) => (
          <li
            key={`${b.join('|')}-${i}`}
            className="bar"
            data-active={i === active || undefined}
            aria-current={(playing && i === active) || undefined}
          >
            <span className="bar-num mono">{i + 1}</span>
            <span className="bar-chords">
              {b.map((c, j) => (
                <span
                  key={`${c}-${j}`}
                  className="chord-chip bar-chord"
                  data-func={findDiatonic(c, key)?.func}
                >
                  <span className="chord-chip-numeral mono">{chordToNumeral(c, key)}</span>
                  <ChordName label={n(c)} />
                </span>
              ))}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** Lista de progressões (lateral do Jam): prontas e próprias, com o tipo de cada uma. */
export function ProgressionList() {
  const t = useT();
  const selected = useMusicStore((s) => s.jam.progressionId);
  const custom = useMusicStore((s) => s.customProgressions);
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

  return (
    <section className="side-block" aria-labelledby="progressions-title">
      <h2 id="progressions-title">{t('Progressões', 'Progressions')}</h2>
      <div className="progression-list" role="radiogroup" aria-labelledby="progressions-title">
        {[...PROGRESSIONS, ...custom].map((p) => (
          <div key={p.id} className="progression-item">
            <button
              type="button"
              role="radio"
              aria-checked={p.id === selected}
              className="progression-option"
              onClick={() => select(p.id)}
            >
              <span className="progression-name" title={t(p.name)}>
                {t(p.name)}
              </span>
              <span className="progression-tag mono">
                {meterOf(p) !== '4/4'
                  ? meterOf(p)
                  : p.mode === 'major'
                    ? t('maior', 'major')
                    : t('menor', 'minor')}
              </span>
            </button>
            {p.custom ? (
              <button
                type="button"
                className="icon-button"
                aria-label={t(`Apagar ${t(p.name)}`, `Delete ${t(p.name)}`)}
                onClick={() => removeWithUndo(p)}
              >
                <Icon name="close" size={20} />
              </button>
            ) : null}
          </div>
        ))}
      </div>
    </section>
  );
}
