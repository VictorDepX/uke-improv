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

const MODE_OPTIONS: { value: EarMode; label: string }[] = [
  { value: 'interval', label: 'Intervalos' },
  { value: 'quality', label: 'Maior × menor' },
  { value: 'function', label: 'Função' },
];

const MODE_HINT: Record<EarMode, string> = {
  interval: 'Duas notas: diga a distância entre elas.',
  quality: 'Um acorde em arpejo e depois junto: maior soa aberto, menor soa mais escuro.',
  function: 'Uma cadência firma o tom; depois soa um acorde. Diga o grau dele no tom.',
};

/** Treino de ouvido: intervalos, qualidade de acorde e função harmônica. */
export function EarPage() {
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
        title="Treino de ouvido"
        aside={
          <span className="ear-score mono" aria-label="Placar">
            {score.correct}/{score.total}
            {score.best > 1 ? (
              <span className="muted"> · melhor sequência {score.best}</span>
            ) : null}
          </span>
        }
      >
        <div className="stack">
          <Segmented
            label="Modo"
            value={mode}
            options={MODE_OPTIONS}
            onChange={(m) => reset(() => setMode(m))}
          />
          {mode === 'interval' ? (
            <div className="ear-options-row">
              <Segmented
                label="Intervalos"
                value={intervalLevel}
                options={[
                  { value: 'basic', label: 'Básicos' },
                  { value: 'all', label: 'Todos' },
                ]}
                onChange={(v) => reset(() => setIntervalLevel(v))}
              />
              <Segmented
                label="Como soam"
                value={direction}
                options={[
                  { value: 'up', label: 'Subindo' },
                  { value: 'down', label: 'Descendo' },
                  { value: 'harmonic', label: 'Juntas' },
                ]}
                onChange={(v) => reset(() => setDirection(v))}
              />
            </div>
          ) : null}
          {mode === 'quality' ? (
            <Segmented
              label="Acordes"
              value={qualityLevel}
              options={[
                { value: 'basic', label: 'Maior e menor' },
                { value: 'all', label: '+ diminuto e aumentado' },
              ]}
              onChange={(v) => reset(() => setQualityLevel(v))}
            />
          ) : null}
          <p className="small muted">
            {MODE_HINT[mode]}
            {mode === 'function' ? ` Tom atual: ${keyLabelOf(key)}.` : ''}
          </p>

          <div className="ear-actions">
            <button type="button" className="button button-primary ear-play" onClick={next}>
              {question && !picked ? 'Nova pergunta' : question ? 'Próxima' : 'Ouvir'}
            </button>
            {question ? (
              <button
                type="button"
                className="button"
                onClick={() => void playSequence(question.play)}
              >
                Repetir
              </button>
            ) : null}
          </div>

          {question ? (
            <div className="ear-question" role="group" aria-label={question.prompt}>
              <span className="eyebrow">{question.prompt}</span>
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
                    {o.label}
                  </button>
                ))}
              </div>
              {picked ? (
                <p className="ear-feedback" data-kind={right ? 'hit' : 'miss'} role="status">
                  <strong>{right ? 'Isso.' : 'Não foi.'}</strong> {question.explain}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </Panel>
    </div>
  );
}
