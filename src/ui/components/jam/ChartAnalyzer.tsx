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
import { tx, useLang, useNames, useT, type Txt } from '@/i18n';
import { SCALES } from '@/core/music';
import { navigateTo } from '../../routes';

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
  const setTonic = useMusicStore((s) => s.setTonic);
  const setScale = useMusicStore((s) => s.setScale);
  const lang = useLang();

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

  const distinct = analysis?.chords.length ?? 0;
  const keyName = analysis ? t(keyLabelOf(analysis.key)) : '';
  const seeOnBoard = () => {
    if (!analysis) return;
    setTonic(analysis.key.tonic);
    setScale(analysis.key.scale);
    navigateTo('explorar', lang);
  };

  return (
    <div className="chart-analyzer">
      <div className="chart-input-col">
        <label className="field" htmlFor={id}>
          <span className="field-label">{t('Cifra', 'Chord chart')}</span>
          <textarea
            id={id}
            className="chart-input mono"
            rows={8}
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
          <button
            type="button"
            className="button button-ghost"
            onClick={() => {
              setText('');
              setParsed(null);
              setForce(undefined);
              setLoaded(null);
            }}
            disabled={!text && !parsed}
          >
            {t('Limpar', 'Clear')}
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
      </div>

      {analysis ? (
        <div
          className="chart-result"
          role="region"
          aria-label={t('Análise da cifra', 'Chart analysis')}
        >
          <div className="transport-lcd chart-lcd">
            <div className="visor-cell">
              <span className="visor-label">{t('Tom', 'Key')}</span>
              <span className="visor-value chart-key-name">
                <span className="visor-big">{n(analysis.key.tonic)}</span>
                <span className="visor-detail">
                  {t(SCALES[analysis.key.scale].label).toLowerCase()}
                </span>
              </span>
            </div>
            <div className="visor-cell">
              <span className="visor-label">{t('Acordes', 'Chords')}</span>
              <span className="visor-value">
                <span className="visor-big">{distinct}</span>
                <span className="visor-detail">
                  {t(distinct === 1 ? 'diferente' : 'diferentes', 'distinct')}
                </span>
              </span>
            </div>
            <div className="visor-cell">
              <span className="visor-label">{t('Encaixe', 'Fit')}</span>
              <span className="visor-value">
                <span className="visor-big">{Math.round(analysis.fit * 100)}%</span>
                <span className="visor-detail">
                  {t(`no campo de ${n(analysis.key.tonic)}`, `in ${n(analysis.key.tonic)}`)}
                </span>
              </span>
            </div>
          </div>

          <ul className="chart-chords" aria-label={t('Acordes da cifra', 'Chords in the chart')}>
            {analysis.chords.map((c) => (
              <li key={c.symbol} className="chart-chord" data-role={c.role}>
                <strong className="chart-sym">{n(c.written)}</strong>
                <span className="chart-num mono">{c.numeral}</span>
                <span className="chart-note func-label" data-func={c.func}>
                  {sentenceCase(t(c.note))}
                  {c.role !== 'diatonic' ? (
                    <span className="sr-only"> ({t(ROLE_LABEL[c.role])})</span>
                  ) : null}
                </span>
                <span className="chart-count mono">{c.count > 1 ? `×${c.count}` : ''}</span>
              </li>
            ))}
          </ul>

          <p className="chart-reason">
            {t(analysis.scaleReason)}{' '}
            {t(
              `${Math.round(analysis.fit * 100)}% dos acordes cabem em ${keyName} (diatônicos, secundárias e empréstimos).`,
              `${Math.round(analysis.fit * 100)}% of the chords fit ${keyName} (diatonic, secondary and borrowed).`,
            )}
          </p>

          {analysis.alternatives.length ? (
            <div className="editor-row chart-alts">
              <span className="field-label">{t('Outra leitura', 'Other reading')}</span>
              {analysis.alternatives.map((alt) => (
                <button
                  key={`${alt.key.tonic}-${alt.key.scale}`}
                  type="button"
                  className="button button-ghost"
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

          <div className="editor-actions chart-actions">
            <button type="button" className="button button-primary" onClick={toJam}>
              {t('Usar no Jam', 'Use in the Jam')}
            </button>
            <button type="button" className="button" onClick={seeOnBoard}>
              {t(`Ver ${keyName} no braço`, `See ${keyName} on the fretboard`)}
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

const sentenceCase = (s: string) => `${s.charAt(0).toUpperCase()}${s.slice(1)}`;
