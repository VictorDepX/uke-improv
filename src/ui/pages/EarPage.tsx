import { useCallback, useMemo, useState } from 'react';
import { playSequence } from '@/audio/engine/sound';
import {
  EMPTY_SCORE,
  makeQuestion,
  type Direction,
  type EarMode,
  type EarQuestion,
  type IntervalLevel,
  type QualityLevel,
} from '@/core/ear';
import { useVoicing } from '@/store/selectors';
import { useMusicStore } from '@/store/useMusicStore';
import { Panel, Segmented } from '../components/controls';
import { keyLabelOf } from '../format';
import { tx, useT, type Txt } from '@/i18n';

const MODE_OPTIONS: { value: EarMode; label: Txt }[] = [
  { value: 'interval', label: tx('Intervalos', 'Intervals') },
  { value: 'quality', label: tx('Maior × menor', 'Major vs. minor') },
  { value: 'function', label: tx('Função', 'Function') },
];

const MODE_HINT: Record<EarMode, Txt> = {
  interval: tx(
    'Duas notas: diga a distância entre elas.',
    'Two notes: name the distance between them.',
  ),
  quality: tx(
    'Um acorde em arpejo e depois junto: maior soa aberto, menor soa mais escuro.',
    'A chord arpeggiated and then together: major sounds open, minor sounds darker.',
  ),
  function: tx(
    'Uma cadência firma o tom; depois soa um acorde. Diga o grau dele no tom.',
    'A cadence sets the key; then a chord plays. Name its degree in the key.',
  ),
};

/** Treino de ouvido: intervalos, qualidade de acorde e função harmônica. */
export function EarPage() {
  const t = useT();
  const key = useMusicStore((s) => s.key);
  const voicing = useVoicing();
  const [mode, setMode] = useState<EarMode>('interval');
  const [intervalLevel, setIntervalLevel] = useState<IntervalLevel>('basic');
  const [direction, setDirection] = useState<Direction>('up');
  const [qualityLevel, setQualityLevel] = useState<QualityLevel>('basic');
  const [question, setQuestion] = useState<EarQuestion | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const score = useMusicStore((s) => s.progress.ear[mode] ?? EMPTY_SCORE);
  const recordEarAnswer = useMusicStore((s) => s.recordEarAnswer);

  const settings = useMemo(
    () => ({ intervalLevel, direction, qualityLevel, voicing: (s: string) => voicing(s).midis }),
    [intervalLevel, direction, qualityLevel, voicing],
  );

  const next = useCallback(() => {
    const q = makeQuestion(mode, key, settings);
    setQuestion(q);
    setPicked(null);
    void playSequence(q.play);
  }, [mode, key, settings]);

  const reset = (fn: () => void) => {
    fn();
    setQuestion(null);
    setPicked(null);
  };

  const answer = (id: string) => {
    if (!question || picked) return;
    setPicked(id);
    recordEarAnswer(mode, id === question.answer);
  };

  const right = picked !== null && question !== null && picked === question.answer;

  return (
    <div className="page page-ear">
      <Panel
        title={t('Treino de ouvido', 'Ear training')}
        aside={
          <span className="ear-score mono" aria-label={t('Placar', 'Score')}>
            {score.correct}/{score.total}
            {score.best > 1 ? (
              <span className="muted">
                {' '}
                · {t('melhor sequência', 'best streak')} {score.best}
              </span>
            ) : null}
          </span>
        }
      >
        <div className="stack">
          <Segmented
            label={t('Modo', 'Mode')}
            value={mode}
            options={MODE_OPTIONS.map((o) => ({ ...o, label: t(o.label) }))}
            onChange={(m) => reset(() => setMode(m))}
          />
          {mode === 'interval' ? (
            <div className="ear-options-row">
              <Segmented
                label={t('Intervalos', 'Intervals')}
                value={intervalLevel}
                options={[
                  { value: 'basic', label: t('Básicos', 'Basic') },
                  { value: 'all', label: t('Todos', 'All') },
                ]}
                onChange={(v) => reset(() => setIntervalLevel(v))}
              />
              <Segmented
                label={t('Como soam', 'How they sound')}
                value={direction}
                options={[
                  { value: 'up', label: t('Subindo', 'Rising') },
                  { value: 'down', label: t('Descendo', 'Falling') },
                  { value: 'harmonic', label: t('Juntas', 'Together') },
                ]}
                onChange={(v) => reset(() => setDirection(v))}
              />
            </div>
          ) : null}
          {mode === 'quality' ? (
            <Segmented
              label={t('Acordes', 'Chords')}
              value={qualityLevel}
              options={[
                { value: 'basic', label: t('Maior e menor', 'Major and minor') },
                { value: 'all', label: t('+ diminuto e aumentado', '+ diminished and augmented') },
              ]}
              onChange={(v) => reset(() => setQualityLevel(v))}
            />
          ) : null}
          <p className="small muted">
            {t(MODE_HINT[mode])}
            {mode === 'function'
              ? t(` Tom atual: ${t(keyLabelOf(key))}.`, ` Current key: ${t(keyLabelOf(key))}.`)
              : ''}
          </p>

          <div className="ear-actions">
            <button type="button" className="button button-primary ear-play" onClick={next}>
              {question && !picked
                ? t('Nova pergunta', 'New question')
                : question
                  ? t('Próxima', 'Next')
                  : t('Ouvir', 'Listen')}
            </button>
            {question ? (
              <button
                type="button"
                className="button"
                onClick={() => void playSequence(question.play)}
              >
                {t('Repetir', 'Repeat')}
              </button>
            ) : null}
          </div>

          {question ? (
            <div className="ear-question" role="group" aria-label={t(question.prompt)}>
              <span className="eyebrow">{t(question.prompt)}</span>
              <div className="ear-choices">
                {question.options.map((o) => (
                  <button
                    key={o.id}
                    type="button"
                    className="ear-choice"
                    data-state={
                      picked
                        ? o.id === question.answer
                          ? 'right'
                          : o.id === picked
                            ? 'wrong'
                            : undefined
                        : undefined
                    }
                    aria-pressed={picked === o.id}
                    disabled={picked !== null}
                    onClick={() => answer(o.id)}
                  >
                    {t(o.label)}
                  </button>
                ))}
              </div>
              {picked ? (
                <p className="ear-feedback" data-kind={right ? 'hit' : 'miss'} role="status">
                  <strong>{right ? t('Isso.', 'Correct.') : t('Não foi.', 'Not quite.')}</strong>{' '}
                  {t(question.explain)}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
