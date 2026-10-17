import { FRET_COUNT, TUNINGS } from '@/core/fretboard';
import { DEFAULT_WEIGHTS } from '@/core/suggestNotes';
import type { LabelMode, ScoreWeights, TuningName } from '@/core/types';
import { useMusicStore } from '@/store/useMusicStore';
import { Panel, Segmented, Select, Slider, Toggle } from '../components/controls';

const LABEL_OPTIONS: { value: LabelMode; label: string }[] = [
  { value: 'note', label: 'Nota' },
  { value: 'degree', label: 'Grau' },
  { value: 'interval', label: 'Intervalo' },
];

const TUNING_OPTIONS = (Object.keys(TUNINGS) as TuningName[]).map((t) => ({
  value: t,
  label: TUNINGS[t].label,
}));

const WINDOW_OPTIONS = [
  { value: 'all', label: 'Braço inteiro' },
  { value: 'auto', label: 'Seguir a última nota (5 casas)' },
  ...Array.from({ length: FRET_COUNT - 4 }, (_, i) => ({
    value: String(i + 1),
    label: `Casas ${i + 1}–${i + 5}`,
  })),
];

const WEIGHT_LABELS: Record<keyof ScoreWeights, string> = {
  cls: 'Classe da nota',
  proximity: 'Proximidade (passos curtos)',
  resolution: 'Resolução de tensões',
  contour: 'Contorno após saltos',
};

export function SettingsPage() {
  const settings = useMusicStore((s) => s.settings);
  const update = useMusicStore((s) => s.updateSettings);
  const setWeights = useMusicStore((s) => s.setWeights);
  const setExtras = useMusicStore((s) => s.setExtras);

  return (
    <div className="page page-settings">
      <div className="columns">
        <Panel title="Braço">
          <div className="stack">
            <Select
              id="set-tuning"
              label="Afinação"
              value={settings.tuning}
              options={TUNING_OPTIONS}
              onChange={(tuning) => update({ tuning })}
            />
            <Segmented
              label="Rótulos nas casas"
              value={settings.labels}
              options={LABEL_OPTIONS}
              onChange={(labels) => update({ labels })}
            />
            <Toggle
              id="set-arpeggio"
              label="Só arpejo"
              hint="Só as notas do acorde contam como dentro. Bom para treinar alvos."
              checked={settings.arpeggio}
              onChange={(arpeggio) => update({ arpeggio })}
            />
            <Toggle
              id="set-shapes"
              label="Formas além da cor"
              hint="Círculo = repouso, quadrado = passagem, losango = tensão."
              checked={settings.shapes}
              onChange={(shapes) => update({ shapes })}
            />
            <Select
              id="set-window"
              label="Região do braço"
              value={settings.fretWindow === null ? 'all' : String(settings.fretWindow)}
              options={WINDOW_OPTIONS}
              onChange={(v) =>
                update({ fretWindow: v === 'all' ? null : v === 'auto' ? 'auto' : Number(v) })
              }
            />
            <p className="small muted">
              Limitar a 5 casas ajuda a treinar uma "caixa" de improviso de cada vez. "Seguir a
              última nota" move a janela conforme você toca, pela tela ou pelo microfone.
            </p>
          </div>
        </Panel>

        <Panel
          title="Pesos das sugestões"
          aside={
            <button
              type="button"
              className="link-button"
              onClick={() => setWeights(DEFAULT_WEIGHTS)}
            >
              Restaurar
            </button>
          }
        >
          <div className="stack">
            {(Object.keys(WEIGHT_LABELS) as (keyof ScoreWeights)[]).map((k) => (
              <Slider
                key={k}
                id={`weight-${k}`}
                label={WEIGHT_LABELS[k]}
                min={0}
                max={100}
                value={Math.round(settings.weights[k] * 100)}
                display={settings.weights[k].toFixed(2)}
                onChange={(v) => setWeights({ [k]: v / 100 })}
              />
            ))}
            <p className="small muted">
              Ajuste de ouvido: suba "Resolução" para frases mais cadenciadas, "Proximidade" para
              melodias mais cantáveis.
            </p>
          </div>
        </Panel>
      </div>

      <Panel title="Harmonia">
        <div className="stack">
          <Toggle
            id="set-secondary"
            label="Sugerir dominantes secundárias"
            hint="Acordes de fora que preparam um acorde do tom, como E7 → Am em dó maior."
            checked={settings.extras.secondaryDominants}
            onChange={(v) => setExtras({ secondaryDominants: v })}
          />
          <Toggle
            id="set-borrowed"
            label="Sugerir empréstimo modal"
            hint="No maior: iv, bVI e bVII do tom menor. No menor: IV maior (dórico)."
            checked={settings.extras.modalBorrowing}
            onChange={(v) => setExtras({ modalBorrowing: v })}
          />
        </div>
      </Panel>
    </div>
  );
}
