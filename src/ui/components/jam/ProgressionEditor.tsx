import { toast } from '../../toast';
import { useState } from 'react';
import { chordToNumeral, toAbsoluteNumeral } from '@/core/harmony';
import { modeOf } from '@/core/music';
import { makeCustomProgression } from '@/core/progressions';
import { MAX_CHORDS_PER_BAR, METERS, type Meter } from '@/core/rhythm';
import { suggestNextChords } from '@/core/suggestChords';
import { useDiatonicChords } from '@/store/selectors';
import { useMusicStore } from '@/store/useMusicStore';
import { Segmented } from '../controls';
import { useNames, useT } from '@/i18n';

const MAX_BARS = 16;

const METER_OPTIONS = (Object.keys(METERS) as Meter[]).map((m) => ({ value: m, label: m }));

/** Monta uma progressão própria; pode usar o sugeridor para escolher cada próximo acorde. */
export function ProgressionEditor() {
  const t = useT();
  const n = useNames();
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
    toast.success(
      t(
        'Progressão salva e escolhida na base.',
        'Progression saved and selected for the backing track.',
      ),
    );
  };

  const slots = Math.min(MAX_BARS, Math.max(3, draft.length + 1));

  return (
    <section className="panel editor" aria-labelledby="editor-title">
      <header className="panel-head">
        <h2 id="editor-title">{t('Montar progressão', 'Build a progression')}</h2>
      </header>
      <p className="panel-lead">
        {t(
          'Toque os acordes na ordem. Dois acordes no mesmo compasso dividem o tempo.',
          'Tap the chords in order. Two chords in the same bar share its beats.',
        )}
      </p>
      <div className="field-row">
        <Segmented
          label={t('Compasso', 'Time signature')}
          value={meter}
          options={METER_OPTIONS}
          onChange={setMeter}
        />
      </div>
      <div className="field-row">
        <span className="field-label" id="editor-field">
          {t('Campo', 'In key')}
        </span>
        <div className="editor-pads" role="group" aria-labelledby="editor-field">
          {diatonic.map((d) => (
            <button
              key={d.numeral}
              type="button"
              className="chord-chip editor-pad"
              data-func={d.func}
              data-suggested={suggested.some((s) => s.symbol === d.symbol) || undefined}
              onClick={() => push(d.symbol)}
            >
              <span className="chord-chip-numeral mono">{d.numeral}</span>
              <span className="chord-chip-symbol">{n(d.symbol)}</span>
            </button>
          ))}
        </div>
      </div>
      {suggested.length > 0 ? (
        <div className="field-row">
          <span className="field-label">{t('Sugeridos', 'Suggested')}</span>
          <div className="editor-row">
            {suggested.map((s) => (
              <button
                key={s.symbol}
                type="button"
                className="button editor-suggested"
                onClick={() => push(s.symbol)}
              >
                {n(s.symbol)} <span className="mono muted">{s.numeral}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}
      <div className="field-row editor-bottom">
        <span className="field-label">{t('Rascunho', 'Draft')}</span>
        <div className="editor-line">
          <ol
            className="transport-lcd editor-draft"
            aria-live="polite"
            aria-label={t('Compassos montados', 'Bars so far')}
          >
            {Array.from({ length: slots }, (_, i) => {
              const bar = draft[i];
              return (
                <li key={i} className="visor-cell" data-empty={!bar || undefined}>
                  <span className="visor-label">{t(`Compasso ${i + 1}`, `Bar ${i + 1}`)}</span>
                  <span className="visor-value">
                    {bar ? (
                      <>
                        <span className="visor-big">{bar.map(n).join(' ')}</span>
                        <span className="visor-detail">
                          {bar.length > 1
                            ? t(`${bar.length} acordes`, `${bar.length} chords`)
                            : chordToNumeral(bar[0]!, key)}
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="visor-big">–</span>
                        <span className="visor-detail">{t('vazio', 'empty')}</span>
                      </>
                    )}
                  </span>
                </li>
              );
            })}
          </ol>
          <div className="editor-actions">
            <button
              type="button"
              className="button button-ghost"
              aria-pressed={split}
              onClick={() => setSplit((v) => !v)}
              disabled={!canSplit}
              title={t(
                'O próximo acorde divide o último compasso com o anterior',
                'The next chord shares the last bar with the previous one',
              )}
            >
              {t('2 acordes neste compasso', '2 chords in this bar')}
            </button>
            <button
              type="button"
              className="button button-ghost"
              onClick={undo}
              disabled={!draft.length}
            >
              {t('Desfazer', 'Undo')}
            </button>
            <button type="button" className="button" onClick={save} disabled={flat.length < 2}>
              {t('Salvar progressão', 'Save progression')}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
