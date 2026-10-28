import { toast } from '../../toast';
import { useState } from 'react';
import { toAbsoluteNumeral } from '@/core/harmony';
import { modeOf } from '@/core/music';
import { barLabel, makeCustomProgression } from '@/core/progressions';
import { MAX_CHORDS_PER_BAR, METERS, type Meter } from '@/core/rhythm';
import { suggestNextChords } from '@/core/suggestChords';
import { useDiatonicChords } from '@/store/selectors';
import { useMusicStore } from '@/store/useMusicStore';
import { Segmented } from '../controls';

const MAX_BARS = 16;

const METER_OPTIONS = (Object.keys(METERS) as Meter[]).map((m) => ({ value: m, label: m }));

/** Monta uma progressão própria; pode usar o sugeridor para escolher cada próximo acorde. */
export function ProgressionEditor() {
  /** Compassos; cada um com 1 ou 2 acordes. */
  const [draft, setDraft] = useState<string[][]>([]);
  const [meter, setMeter] = useState<Meter>('4/4');
  /** O próximo acorde entra no mesmo compasso do último. */
  const [split, setSplit] = useState(false);
  const diatonic = useDiatonicChords();
  const key = useMusicStore((s) => s.key);
  const extras = useMusicStore((s) => s.settings.extras);
  const add = useMusicStore((s) => s.addCustomProgression);

  const flat = draft.flat();
  const last = flat.at(-1);
  const lastBar = draft.at(-1);
  const canSplit = !!lastBar && lastBar.length < MAX_CHORDS_PER_BAR;
  const suggested = last
    ? suggestNextChords(last, key, { extras, history: flat.slice(0, -1), count: 3 })
    : [];
  const push = (symbol: string) => {
    setDraft((d) => {
      const tail = d.at(-1);
      if (split && tail && tail.length < MAX_CHORDS_PER_BAR)
        return [...d.slice(0, -1), [...tail, symbol]];
      return d.length < MAX_BARS ? [...d, [symbol]] : d;
    });
    setSplit(false);
  };
  const undo = () =>
    setDraft((d) => {
      const tail = d.at(-1);
      if (!tail) return d;
      return tail.length > 1 ? [...d.slice(0, -1), tail.slice(0, -1)] : d.slice(0, -1);
    });

  const save = () => {
    if (flat.length < 2) return;
    add(
      makeCustomProgression(
        draft.map((bar) => bar.map((c) => toAbsoluteNumeral(c, key))),
        modeOf(key.scale),
        meter,
      ),
    );
    setDraft([]);
    setSplit(false);
    toast.success('Progressão salva e escolhida na base.');
  };

  return (
    <div className="editor">
      <Segmented label="Compasso" value={meter} options={METER_OPTIONS} onChange={setMeter} />
      <div className="editor-draft" aria-live="polite" aria-label="Compassos montados">
        {draft.length === 0 ? (
          <span className="muted">Escolha os acordes na ordem dos compassos.</span>
        ) : (
          draft.map((bar, i) => (
            <span
              key={`${barLabel(bar)}-${i}`}
              className="pill"
              data-split={bar.length > 1 || undefined}
            >
              {barLabel(bar)}
            </span>
          ))
        )}
      </div>

      {suggested.length > 0 ? (
        <div className="editor-row">
          <span className="eyebrow">Sugeridos</span>
          {suggested.map((s) => (
            <button
              key={s.symbol}
              type="button"
              className="pill pill-suggested"
              onClick={() => push(s.symbol)}
            >
              {s.symbol}
            </button>
          ))}
        </div>
      ) : null}

      <div className="editor-row">
        <span className="eyebrow">Campo</span>
        {diatonic.map((d) => (
          <button key={d.numeral} type="button" className="pill" onClick={() => push(d.symbol)}>
            {d.symbol}
          </button>
        ))}
      </div>

      <div className="editor-actions">
        <button type="button" className="button" onClick={undo} disabled={!draft.length}>
          Desfazer
        </button>
        <button
          type="button"
          className="button"
          aria-pressed={split}
          onClick={() => setSplit((v) => !v)}
          disabled={!canSplit}
          title="O próximo acorde divide o último compasso com o anterior"
        >
          2 acordes neste compasso
        </button>
        <button
          type="button"
          className="button button-primary"
          onClick={save}
          disabled={flat.length < 2}
        >
          Salvar progressão
        </button>
      </div>
    </div>
  );
}
