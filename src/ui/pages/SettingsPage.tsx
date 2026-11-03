import { MAX_CAPO, TUNINGS, WINDOW_SIZE, maxWindowStart } from '@/core/fretboard';
import { DEFAULT_WEIGHTS } from '@/core/suggestNotes';
import type { LabelMode, NoteNames, ScoreWeights, Theme, TuningName } from '@/core/types';
import { tx, useLang, useNames, useT, type Lang, type Txt } from '@/i18n';
import { useMusicStore } from '@/store/useMusicStore';
import { AccountPanel } from '../components/AccountPanel';
import { Panel, Segmented, Select, Slider, Toggle } from '../components/controls';
import { PageHead } from '../components/PageHead';
import type { ReactNode } from 'react';

const LABEL_OPTIONS: { value: LabelMode; label: Txt }[] = [
  { value: 'note', label: tx('Nota', 'Note') },
  { value: 'degree', label: tx('Grau', 'Degree') },
  { value: 'interval', label: tx('Intervalo', 'Interval') },
];

const CAPO_SOUNDS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G'];

const WEIGHT_LABELS: Record<keyof ScoreWeights, Txt> = {
  cls: tx('Classe da nota', 'Note class'),
  proximity: tx('Proximidade', 'Proximity'),
  resolution: tx('Resolução de tensões', 'Tension resolution'),
  contour: tx('Contorno após saltos', 'Contour after leaps'),
};

export function SettingsPage() {
  const t = useT();
  const n = useNames();
  const lang = useLang();
  const settings = useMusicStore((s) => s.settings);
  const update = useMusicStore((s) => s.updateSettings);
  const setWeights = useMusicStore((s) => s.setWeights);
  const setExtras = useMusicStore((s) => s.setExtras);

  const tuningOptions = (Object.keys(TUNINGS) as TuningName[]).map((x) => ({
    value: x,
    label: t(TUNINGS[x].label),
  }));
  const capoOptions = Array.from({ length: MAX_CAPO + 1 }, (_, c) => ({
    value: String(c),
    label: c === 0 ? t('Sem capo', 'No capo') : t(`Casa ${c}`, `Fret ${c}`),
  }));
  // Janelas contam a partir do capo; o rótulo mostra a casa física.
  const windowOptions = [
    { value: 'all', label: t('Braço inteiro', 'Whole fretboard') },
    {
      value: 'auto',
      label: t(
        `Seguir a última nota (${WINDOW_SIZE} casas)`,
        `Follow the last note (${WINDOW_SIZE} frets)`,
      ),
    },
    ...Array.from({ length: maxWindowStart(settings.capo) }, (_, i) => ({
      value: String(i + 1),
      label: t(
        `Casas ${i + 1 + settings.capo}–${i + settings.capo + WINDOW_SIZE}`,
        `Frets ${i + 1 + settings.capo}–${i + settings.capo + WINDOW_SIZE}`,
      ),
    })),
  ];

  const row = (control: ReactNode) => <div className="field-row settings-row">{control}</div>;

  return (
    <div className="page page-settings">
      <PageHead tab="ajustes" />
      <div className="settings-cols">
        <div className="settings-col">
          <Panel
            className="panel-sm"
            title={t('Idioma e nomes das notas', 'Language and note names')}
          >
            <div className="stack-tight">
              {row(
                <Segmented
                  label={t('Idioma', 'Language')}
                  value={lang}
                  options={[
                    { value: 'pt', label: 'Português' },
                    { value: 'en', label: 'English' },
                  ]}
                  onChange={(v: Lang) => update({ lang: v })}
                />,
              )}
              {row(
                <Segmented
                  label={t('Notas', 'Notes')}
                  value={settings.noteNames}
                  options={[
                    { value: 'letters', label: 'C D E' },
                    { value: 'solfege', label: lang === 'pt' ? 'Dó Ré Mi' : 'Do Re Mi' },
                  ]}
                  onChange={(noteNames: NoteNames) => update({ noteNames })}
                />,
              )}
            </div>
          </Panel>
          <Panel className="panel-sm" title={t('Acessibilidade', 'Accessibility')}>
            <div className="stack-tight">
              {row(
                <Segmented
                  label={t('Tema', 'Theme')}
                  value={settings.theme}
                  options={[
                    { value: 'auto', label: t('Do sistema', 'System') },
                    { value: 'light', label: t('Claro', 'Light') },
                    { value: 'dark', label: t('Escuro', 'Dark') },
                  ]}
                  onChange={(theme: Theme) => update({ theme })}
                />,
              )}
              <Toggle
                id="set-contrast"
                label={t('Alto contraste', 'High contrast')}
                checked={settings.highContrast}
                onChange={(highContrast) => update({ highContrast })}
              />
              <Toggle
                id="set-colorblind"
                label={t('Cores para daltonismo', 'Colorblind-friendly colors')}
                hint={t(
                  'Repouso em azul e tensão em vermelhão; as formas continuam',
                  'Rest in blue and tension in vermilion; the shapes stay',
                )}
                checked={settings.colorblind}
                onChange={(colorblind) => update({ colorblind })}
              />
              <Toggle
                id="set-pulse"
                label={t('Pulso visível e na vibração', 'Visible and vibrating pulse')}
                hint={t(
                  'O tempo da base pisca na tela e vibra no celular',
                  'The backing track beat flashes on screen and vibrates the phone',
                )}
                checked={settings.pulse}
                onChange={(pulse) => update({ pulse })}
              />
            </div>
          </Panel>
          {__ACCOUNTS__ ? <AccountPanel /> : null}
        </div>

        <div className="settings-col">
          <Panel className="panel-sm" title={t('Braço', 'Fretboard')}>
            <div className="stack-tight">
              {row(
                <Select
                  id="set-tuning"
                  label={t('Afinação', 'Tuning')}
                  value={settings.tuning}
                  options={tuningOptions}
                  onChange={(tuning) => update({ tuning })}
                />,
              )}
              {row(
                <Select
                  id="set-capo"
                  label={t('Capotraste', 'Capo')}
                  value={String(settings.capo)}
                  options={capoOptions}
                  onChange={(v) => update({ capo: Number(v) })}
                />,
              )}
              {settings.capo ? (
                <p className="small muted">
                  {t(
                    `O braço começa no capo e as casas mostram a posição real. Os diagramas mostram a forma que a mão faz: com capo na casa ${settings.capo}, a forma de ${n('C')} soa ${n(CAPO_SOUNDS[settings.capo]!)}.`,
                    `The fretboard starts at the capo and the frets show the real position. Chord diagrams show the shape your hand makes: with the capo on fret ${settings.capo}, the ${n('C')} shape sounds ${n(CAPO_SOUNDS[settings.capo]!)}.`,
                  )}
                </p>
              ) : null}
              {row(
                <Select
                  id="set-window"
                  label={t('Região', 'Region')}
                  value={settings.fretWindow === null ? 'all' : String(settings.fretWindow)}
                  options={windowOptions}
                  onChange={(v) =>
                    update({ fretWindow: v === 'all' ? null : v === 'auto' ? 'auto' : Number(v) })
                  }
                />,
              )}
              {row(
                <Segmented
                  label={t('Rótulos', 'Labels')}
                  value={settings.labels}
                  options={LABEL_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))}
                  onChange={(labels) => update({ labels })}
                />,
              )}
              <Toggle
                id="set-left"
                label={t('Canhoto', 'Left-handed')}
                checked={settings.leftHanded}
                onChange={(leftHanded) => update({ leftHanded })}
              />
              <Toggle
                id="set-arpeggio"
                label={t('Só arpejo', 'Arpeggio only')}
                hint={t('Esconde as notas que não são do acorde', 'Hides notes outside the chord')}
                checked={settings.arpeggio}
                onChange={(arpeggio) => update({ arpeggio })}
              />
              <Toggle
                id="set-shapes"
                label={t('Formas além da cor', 'Shapes as well as color')}
                hint={t(
                  'Círculo, quadrado e losango diferenciam os tipos de nota',
                  'Circle, square and diamond tell the note types apart',
                )}
                checked={settings.shapes}
                onChange={(shapes) => update({ shapes })}
              />
            </div>
          </Panel>

          <Panel className="panel-sm" title={t('Pesos das sugestões', 'Suggestion weights')}>
            <div className="stack-tight">
              <p className="small muted">
                {t(
                  'Quanto cada critério conta na hora de ordenar as próximas notas.',
                  'How much each criterion counts when ranking the next notes.',
                )}
              </p>
              {(Object.keys(WEIGHT_LABELS) as (keyof ScoreWeights)[]).map((k) => (
                <Slider
                  key={k}
                  id={`weight-${k}`}
                  label={t(WEIGHT_LABELS[k])}
                  min={0}
                  max={100}
                  value={Math.round(settings.weights[k] * 100)}
                  display={settings.weights[k].toFixed(2)}
                  onChange={(v) => setWeights({ [k]: v / 100 })}
                />
              ))}
              <div>
                <button
                  type="button"
                  className="button button-ghost"
                  onClick={() => setWeights(DEFAULT_WEIGHTS)}
                >
                  {t('Restaurar padrão', 'Reset to default')}
                </button>
              </div>
            </div>
          </Panel>

          <Panel className="panel-sm" title={t('Harmonia', 'Harmony')}>
            <div className="stack-tight">
              <Toggle
                id="set-secondary"
                label={t('Sugerir dominantes secundárias', 'Suggest secondary dominants')}
                hint={t(`ex.: ${n('E7')} antes de ${n('Am')}`, `e.g. ${n('E7')} before ${n('Am')}`)}
                checked={settings.extras.secondaryDominants}
                onChange={(v) => setExtras({ secondaryDominants: v })}
              />
              <Toggle
                id="set-borrowed"
                label={t('Sugerir empréstimo modal', 'Suggest modal borrowing')}
                hint={t(
                  `ex.: ${n('Fm')} ou ${n('Bb')} em ${n('C')} maior`,
                  `e.g. ${n('Fm')} or ${n('Bb')} in ${n('C')} major`,
                )}
                checked={settings.extras.modalBorrowing}
                onChange={(v) => setExtras({ modalBorrowing: v })}
              />
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
