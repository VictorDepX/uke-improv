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

const ROLE_LABEL: Record<ChordRole, string> = {
  diatonic: 'diatônico',
  secondary: 'secundária',
  borrowed: 'emprestado',
  chromatic: 'cromático',
};

const PLACEHOLDER = `Cole a cifra, com ou sem letra. Exemplo:

[Intro] G  D/F#  Em  C

G          D/F#
  Uma frase qualquer da letra
Em         C
  E outra frase aqui embaixo

Barras marcam compassos: | Dm7 G7 | C7M |`;

/** Cola uma cifra, mostra tom, escala e o papel de cada acorde, e leva para o jam. */
export function ChartAnalyzer() {
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
    const name = `Cifra: ${bars.slice(0, 4).map(barLabel).join(' – ')}${bars.length > 4 ? ' …' : ''}`;
    loadChart({ key: analysis.key, bars, name });
    setLoaded(
      `${bars.length} ${bars.length === 1 ? 'compasso' : 'compassos'} em ${keyLabelOf(analysis.key)}`,
    );
  };

  return (
    <div className="chart-analyzer">
      <label className="field" htmlFor={id}>
        <span className="field-label">Cifra</span>
        <textarea
          id={id}
          className="chart-input mono"
          rows={7}
          value={text}
          maxLength={MAX_CHART_TEXT}
          placeholder={PLACEHOLDER}
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
          Analisar
        </button>
      </div>

      {parsed && !analysis ? (
        <p className="small muted" role="status">
          Nenhum acorde encontrado. Os acordes precisam estar em linhas próprias, como nas cifras.
        </p>
      ) : null}

      {analysis ? (
        <div className="chart-result" role="region" aria-label="Análise da cifra">
          <div className="chart-key">
            <span className="eyebrow">Tom</span>
            <strong className="chart-key-name">{keyLabelOf(analysis.key)}</strong>
            <span className="small muted">{analysis.scaleReason}</span>
            <span className="small muted">
              {Math.round(analysis.fit * 100)}% dos acordes cabem no tom (diatônicos, secundárias e
              empréstimos).
            </span>
          </div>

          {analysis.alternatives.length ? (
            <div className="editor-row">
              <span className="eyebrow">Outra leitura</span>
              {analysis.alternatives.map((alt) => (
                <button
                  key={`${alt.key.tonic}-${alt.key.scale}`}
                  type="button"
                  className="pill"
                  onClick={() => setForce(alt.key)}
                >
                  {keyLabelOf(alt.key)}
                </button>
              ))}
              {force ? (
                <button type="button" className="link-button" onClick={() => setForce(undefined)}>
                  Voltar à mais provável
                </button>
              ) : null}
            </div>
          ) : null}

          <ul className="chart-chords" aria-label="Acordes da cifra">
            {analysis.chords.map((c) => (
              <li key={c.symbol} className="chart-chord" data-role={c.role}>
                <strong className="chart-sym">{c.written}</strong>
                <span className="chart-num mono muted">{c.numeral}</span>
                <span className="chart-role tag">{ROLE_LABEL[c.role]}</span>
                <span className="chart-note small">{c.note}</span>
                <span className="chart-count small muted">{c.count > 1 ? `×${c.count}` : ''}</span>
              </li>
            ))}
          </ul>

          <div className="editor-actions">
            <button type="button" className="button button-primary" onClick={toJam}>
              Usar no jam
            </button>
          </div>
          {cut ? (
            <p className="small muted">A base usa os {MAX_CHART_BARS} primeiros compassos.</p>
          ) : null}
          {loaded ? (
            <p className="small chart-loaded" role="status">
              Progressão criada e selecionada: {loaded}.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
