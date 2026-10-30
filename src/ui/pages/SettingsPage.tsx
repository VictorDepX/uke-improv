import { MAX_CAPO, TUNINGS, WINDOW_SIZE, maxWindowStart } from '@/core/fretboard';
import { DEFAULT_WEIGHTS } from '@/core/suggestNotes';
import type { LabelMode, NoteNames, ScoreWeights, TuningName } from '@/core/types';
import { tx, useLang, useNames, useT, type Lang, type Txt } from '@/i18n';
import { useMusicStore } from '@/store/useMusicStore';
import { AccountPanel } from '../components/AccountPanel';
import { Panel, Segmented, Select, Slider, Toggle } from '../components/controls';

const LABEL_OPTIONS: { value: LabelMode; label: Txt }[] = [
  { value: 'note', label: tx('Nota', 'Note') },
  { value: 'degree', label: tx('Grau', 'Degree') },
  { value: 'interval', label: tx('Intervalo', 'Interval') },
];

const CAPO_SOUNDS = ['C', 'C#', 'D', 'Eb', 'E', 'F', 'F#', 'G'];

const WEIGHT_LABELS: Record<keyof ScoreWeights, Txt> = {
  cls: tx('Classe da nota', 'Note class'),
  proximity: tx('Proximidade (passos curtos)', 'Proximity (short steps)'),
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

  return (
    <div className="page page-settings">
      <Panel title={t('Idioma e nomes das notas', 'Language and note names')}>
        <div className="ear-options-row">
          <Segmented
            label={t('Idioma', 'Language')}
            value={lang}
            options={[
              { value: 'pt', label: 'Português' },
              { value: 'en', label: 'English' },
            ]}
            onChange={(v: Lang) => update({ lang: v })}
          />
          <Segmented
            label={t('Nomes das notas', 'Note names')}
            value={settings.noteNames}
            options={[
              { value: 'letters', label: 'C D E' },
              { value: 'solfege', label: lang === 'pt' ? 'Dó Ré Mi' : 'Do Re Mi' },
            ]}
            onChange={(noteNames: NoteNames) => update({ noteNames })}
          />
        </div>
      </Panel>
      {__ACCOUNTS__ ? <AccountPanel /> : null}
      <div className="columns">
        <Panel title={t('Braço', 'Fretboard')}>
          <div className="stack">
            <Select
              id="set-tuning"
              label={t('Afinação', 'Tuning')}
              value={settings.tuning}
              options={tuningOptions}
              onChange={(tuning) => update({ tuning })}
            />
            <Select
              id="set-capo"
              label={t('Capotraste', 'Capo')}
              value={String(settings.capo)}
              options={capoOptions}
              onChange={(v) => update({ capo: Number(v) })}
            />
            {settings.capo ? (
              <p className="small muted">
                {t(
                  `O braço começa no capo e as casas mostram a posição real. Os diagramas mostram a forma que a mão faz: com capo na casa ${settings.capo}, a forma de ${n('C')} soa ${n(CAPO_SOUNDS[settings.capo]!)}.`,
                  `The fretboard starts at the capo and the frets show the real position. Chord diagrams show the shape your hand makes: with the capo on fret ${settings.capo}, the ${n('C')} shape sounds ${n(CAPO_SOUNDS[settings.capo]!)}.`,
                )}
              </p>
            ) : null}
            <Segmented
              label={t('Rótulos nas casas', 'Fret labels')}
              value={settings.labels}
              options={LABEL_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))}
              onChange={(labels) => update({ labels })}
            />
            <Toggle
              id="set-arpeggio"
              label={t('Só arpejo', 'Arpeggio only')}
              hint={t(
                'Só as notas do acorde contam como dentro. Bom para treinar alvos.',
                'Only chord tones count as inside. Good for practicing targets.',
              )}
              checked={settings.arpeggio}
              onChange={(arpeggio) => update({ arpeggio })}
            />
            <Toggle
              id="set-shapes"
              label={t('Formas além da cor', 'Shapes as well as color')}
              hint={t(
                'Círculo = repouso, quadrado = passagem, losango = tensão.',
                'Circle = rest, square = passing, diamond = tension.',
              )}
              checked={settings.shapes}
              onChange={(shapes) => update({ shapes })}
            />
            <Select
              id="set-window"
              label={t('Região do braço', 'Fretboard region')}
              value={settings.fretWindow === null ? 'all' : String(settings.fretWindow)}
              options={windowOptions}
              onChange={(v) =>
                update({ fretWindow: v === 'all' ? null : v === 'auto' ? 'auto' : Number(v) })
              }
            />
            <p className="small muted">
              {t(
                'Limitar a 5 casas ajuda a treinar uma "caixa" de improviso de cada vez. "Seguir a última nota" move a janela conforme você toca, pela tela ou pelo microfone.',
                'Limiting to 5 frets helps you practice one improv "box" at a time. "Follow the last note" moves the window as you play, on screen or through the microphone.',
              )}
            </p>
          </div>
        </Panel>

        <Panel
          title={t('Pesos das sugestões', 'Suggestion weights')}
          aside={
            <button
              type="button"
              className="link-button"
              onClick={() => setWeights(DEFAULT_WEIGHTS)}
            >
              {t('Restaurar', 'Reset')}
            </button>
          }
        >
          <div className="stack">
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
            <p className="small muted">
              {t(
                'Ajuste de ouvido: suba "Resolução" para frases mais cadenciadas, "Proximidade" para melodias mais cantáveis.',
                'Tune by ear: raise "Resolution" for more cadential phrases, "Proximity" for more singable melodies.',
              )}
            </p>
          </div>
        </Panel>
      </div>

      <Panel title={t('Harmonia', 'Harmony')}>
        <div className="stack">
          <Toggle
            id="set-secondary"
            label={t('Sugerir dominantes secundárias', 'Suggest secondary dominants')}
            hint={t(
              `Acordes de fora que preparam um acorde do tom, como ${n('E7')} → ${n('Am')} em ${n('C')} maior.`,
              `Outside chords that set up a chord in the key, like ${n('E7')} → ${n('Am')} in ${n('C')} major.`,
            )}
            checked={settings.extras.secondaryDominants}
            onChange={(v) => setExtras({ secondaryDominants: v })}
          />
          <Toggle
            id="set-borrowed"
            label={t('Sugerir empréstimo modal', 'Suggest modal borrowing')}
            hint={t(
              'No maior: iv, bVI e bVII do tom menor. No menor: IV maior (dórico).',
              'In major: iv, bVI and bVII from the minor key. In minor: major IV (Dorian).',
            )}
            checked={settings.extras.modalBorrowing}
            onChange={(v) => setExtras({ modalBorrowing: v })}
          />
        </div>
      </Panel>
    </div>
  );
}
