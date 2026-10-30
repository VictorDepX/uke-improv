import { useId, useMemo, useState } from 'react';
import {
  MAX_CHART_BARS,
  analyzeChart,
  parseChart,
  MAX_CHART_TEXT,
  type ChordRole,
  type ParsedChart,
} from '@/core/chart';
import { barLabel } from '@/core/progressions';
import type { KeyContext } from '@/core/types';
import { useMusicStore } from '@/store/useMusicStore';
import { keyLabelOf } from '../../format';
import { tx, useNames, useT, type Txt } from '@/i18n';

const ROLE_LABEL: Record<ChordRole, Txt> = {
  diatonic: tx('diatônico', 'diatonic'),
  secondary: tx('secundária', 'secondary'),
  borrowed: tx('emprestado', 'borrowed'),
  chromatic: tx('cromático', 'chromatic'),
};

const PLACEHOLDER = tx(
  `Cole a cifra, com ou sem letra. Exemplo:

[Intro] G  D/F#  Em  C

G          D/F#
  Uma frase qualquer da letra
Em         C
  E outra frase aqui embaixo

Barras marcam compassos: | Dm7 G7 | C7M |`,
  `Paste a chord chart, with or without lyrics. Example:

[Intro] G  D/F#  Em  C

G          D/F#
  Any line of the lyrics
Em         C
  And another line below it

Bars mark measures: | Dm7 G7 | Cmaj7 |`,
);

/** Cola uma cifra, mostra tom, escala e o papel de cada acorde, e leva para o jam. */
export function ChartAnalyzer() {
  const t = useT();
  const n = useNames();
  const id = useId();
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState<ParsedChart | null>(null);
  const [force, setForce] = useState<KeyContext | undefined>(undefined);
  const [loaded, setLoaded] = useState<string | null>(null);
  const loadChart = useMusicStore((s) => s.loadChart);

  const analysis = useMemo(() => (parsed ? analyzeChart(parsed, force) : null), [parsed, force]);

  const analyze = () => {
    setParsed(parseChart(text));
    setForce(undefined);
    setLoaded(null);
  };

  const bars = parsed ? parsed.bars.slice(0, MAX_CHART_BARS) : [];
  const cut = parsed ? parsed.bars.length > MAX_CHART_BARS : false;

  const toJam = () => {
    if (!analysis) return;
    const name = `${t('Cifra', 'Chart')}: ${bars.slice(0, 4).map(barLabel).join(' – ')}${bars.length > 4 ? ' …' : ''}`;
    loadChart({ key: analysis.key, bars, name });
    const k = keyLabelOf(analysis.key);
    setLoaded(
      t(
        `${bars.length} ${bars.length === 1 ? 'compasso' : 'compassos'} em ${t(tx(k.pt, k.pt))}`,
        `${bars.length} ${bars.length === 1 ? 'bar' : 'bars'} in ${t(tx(k.en, k.en))}`,
      ),
    );
  };

  return (
    <div className="chart-analyzer">
      <label className="field" htmlFor={id}>
        <span className="field-label">{t('Cifra', 'Chord chart')}</span>
        <textarea
          id={id}
          className="chart-input mono"
          rows={7}
          value={text}
          maxLength={MAX_CHART_TEXT}
          placeholder={t(PLACEHOLDER)}
          onChange={(e) => setText(e.target.value)}
          spellCheck={false}
        />
      </label>
      <div className="editor-actions">
        <button
          type="button"
          className="button button-primary"
          onClick={analyze}
          disabled={!text.trim()}
        >
          {t('Analisar', 'Analyze')}
        </button>
      </div>

      {parsed && !analysis ? (
        <p className="small muted" role="status">
          {t(
            'Nenhum acorde encontrado. Os acordes precisam estar em linhas próprias, como nas cifras.',
            'No chords found. Chords need to be on their own lines, as in chord charts.',
          )}
        </p>
      ) : null}

      {analysis ? (
        <div
          className="chart-result"
          role="region"
          aria-label={t('Análise da cifra', 'Chart analysis')}
        >
          <div className="chart-key">
            <span className="eyebrow">{t('Tom', 'Key')}</span>
            <strong className="chart-key-name">{t(keyLabelOf(analysis.key))}</strong>
            <span className="small muted">{t(analysis.scaleReason)}</span>
            <span className="small muted">
              {t(
                `${Math.round(analysis.fit * 100)}% dos acordes cabem no tom (diatônicos, secundárias e empréstimos).`,
                `${Math.round(analysis.fit * 100)}% of the chords fit the key (diatonic, secondary and borrowed).`,
              )}
            </span>
          </div>

          {analysis.alternatives.length ? (
            <div className="editor-row">
              <span className="eyebrow">{t('Outra leitura', 'Other reading')}</span>
              {analysis.alternatives.map((alt) => (
                <button
                  key={`${alt.key.tonic}-${alt.key.scale}`}
                  type="button"
                  className="pill"
                  onClick={() => setForce(alt.key)}
                >
                  {t(keyLabelOf(alt.key))}
                </button>
              ))}
              {force ? (
                <button type="button" className="link-button" onClick={() => setForce(undefined)}>
                  {t('Voltar à mais provável', 'Back to the most likely')}
                </button>
              ) : null}
            </div>
          ) : null}

          <ul className="chart-chords" aria-label={t('Acordes da cifra', 'Chords in the chart')}>
            {analysis.chords.map((c) => (
              <li key={c.symbol} className="chart-chord" data-role={c.role}>
                <strong className="chart-sym">{n(c.written)}</strong>
                <span className="chart-num mono muted">{c.numeral}</span>
                <span className="chart-role tag">{t(ROLE_LABEL[c.role])}</span>
                <span className="chart-note small">{t(c.note)}</span>
                <span className="chart-count small muted">{c.count > 1 ? `×${c.count}` : ''}</span>
              </li>
            ))}
          </ul>

          <div className="editor-actions">
            <button type="button" className="button button-primary" onClick={toJam}>
              {t('Usar no jam', 'Use in the jam')}
            </button>
          </div>
          {cut ? (
            <p className="small muted">
              {t(
                `A base usa os ${MAX_CHART_BARS} primeiros compassos.`,
                `The backing track uses the first ${MAX_CHART_BARS} bars.`,
              )}
            </p>
          ) : null}
          {loaded ? (
            <p className="small chart-loaded" role="status">
              {t('Progressão criada e selecionada:', 'Progression created and selected:')} {loaded}.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
