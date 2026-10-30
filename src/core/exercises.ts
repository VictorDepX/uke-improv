import { nm, tx, type Txt } from '@/i18n/lang';
import type { NoteClass } from './types';

export type ExerciseId = 'repouso' | 'resolva' | 'passo' | 'alvo';

export interface ExerciseDef {
  id: ExerciseId;
  title: Txt;
  /** O que fazer, em uma frase. */
  goal: Txt;
  /** Acertos (ou notas seguidas, no passo a passo) para concluir. */
  target: number;
  unit: Txt;
  /** Só faz sentido com a base tocando. */
  needsJam?: boolean;
}

export const EXERCISES: readonly ExerciseDef[] = [
  {
    id: 'repouso',
    title: tx('Só repouso', 'Rest notes only'),
    goal: tx(
      'Toque só notas do acorde atual (as verdes). Troque de acorde quando quiser.',
      'Play only notes of the current chord (the green ones). Change chords whenever you like.',
    ),
    target: 8,
    unit: tx('notas do acorde', 'chord tones'),
  },
  {
    id: 'resolva',
    title: tx('Resolva a tensão', 'Resolve the tension'),
    goal: tx(
      'Toque uma tensão (laranja) e, logo depois, uma nota do acorde a até um tom de distância.',
      'Play a tension note (orange), then a chord tone no more than a whole step away.',
    ),
    target: 4,
    unit: tx('resoluções', 'resolutions'),
  },
  {
    id: 'passo',
    title: tx('Passo a passo', 'Step by step'),
    goal: tx(
      'Faça uma frase só com notas vizinhas da escala (meio tom ou um tom), sem saltos.',
      'Play a phrase using only neighboring scale notes (a half or whole step), no leaps.',
    ),
    target: 8,
    unit: tx('notas seguidas', 'notes in a row'),
  },
  {
    id: 'alvo',
    title: tx('Alvo na troca', 'Target the change'),
    goal: tx(
      'Com a base tocando, a cada troca de acorde, comece com uma nota do acorde novo.',
      'With the backing track playing, start each chord change on a note of the new chord.',
    ),
    target: 4,
    unit: tx('trocas', 'changes'),
    needsJam: true,
  },
];

export const exerciseDef = (id: ExerciseId): ExerciseDef => EXERCISES.find((e) => e.id === id)!;

/** Maior distância, em semitons, que ainda conta como passo. */
export const MAX_STEP = 2;

export interface ExerciseNote {
  midi: number;
  /** Nome para as mensagens (ex.: "F"). */
  name: string;
  cls: NoteClass;
  /** Acorde que soava quando a nota foi tocada. */
  chord: string;
  /** Índice do acorde da base desde o play (−1 na contagem) ou null com a base parada. */
  bar: number | null;
}

export interface Feedback {
  kind: 'hit' | 'miss' | 'info';
  text: Txt;
}

export interface ExerciseState {
  id: ExerciseId;
  hits: number;
  misses: number;
  /** Notas seguidas no passo a passo. */
  streak: number;
  done: boolean;
  prev: ExerciseNote | null;
  /** Última nota foi uma tensão esperando resolução. */
  pending: boolean;
  /** Último acorde da base avaliado (alvo na troca). */
  lastBar: number | null;
  feedback: Feedback | null;
}

export function startExercise(id: ExerciseId): ExerciseState {
  return {
    id,
    hits: 0,
    misses: 0,
    streak: 0,
    done: false,
    prev: null,
    pending: false,
    lastBar: null,
    feedback: null,
  };
}

/** Quanto falta: acertos, ou notas seguidas no passo a passo. */
export function exerciseProgress(s: ExerciseState): number {
  return s.id === 'passo' ? s.streak : s.hits;
}

const CLASS_TEXT: Record<NoteClass, Txt> = {
  repouso: tx('é do acorde', 'is a chord tone'),
  passagem: tx('é passagem', 'is a passing note'),
  tensao: tx('é tensão', 'is a tension note'),
  fora: tx('está fora da escala', 'is outside the scale'),
};

const hit = (text: Txt): Feedback => ({ kind: 'hit', text });
const miss = (text: Txt): Feedback => ({ kind: 'miss', text });
const info = (text: Txt): Feedback => ({ kind: 'info', text });
const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

/** Avalia uma nota tocada (tela ou microfone). Função pura: devolve o estado novo. */
export function stepExercise(state: ExerciseState, note: ExerciseNote): ExerciseState {
  if (state.done) return state;
  const next = evaluate(state, note);
  const done = exerciseProgress(next) >= exerciseDef(state.id).target;
  return {
    ...next,
    prev: note,
    done,
    feedback: done
      ? hit(
          tx(
            `Concluído: ${plural(next.hits, 'acerto', 'acertos')}, ${plural(next.misses, 'erro', 'erros')}.`,
            `Done: ${plural(next.hits, 'hit', 'hits')}, ${plural(next.misses, 'miss', 'misses')}.`,
          ),
        )
      : next.feedback,
  };
}

function evaluate(s: ExerciseState, note: ExerciseNote): ExerciseState {
  // Nomes marcados, para a tela mostrar no formato escolhido (C ou Dó).
  const n = { ...note, name: nm(note.name), chord: nm(note.chord) };
  const prevNote = s.prev ? { ...s.prev, name: nm(s.prev.name) } : null;
  switch (s.id) {
    case 'repouso':
      return n.cls === 'repouso'
        ? {
            ...s,
            hits: s.hits + 1,
            feedback: hit(
              tx(`${n.name} é do acorde ${n.chord}.`, `${n.name} is in the ${n.chord} chord.`),
            ),
          }
        : {
            ...s,
            misses: s.misses + 1,
            feedback: miss(
              tx(
                `${n.name} ${CLASS_TEXT[n.cls].pt}. Procure uma verde.`,
                `${n.name} ${CLASS_TEXT[n.cls].en}. Look for a green one.`,
              ),
            ),
          };

    case 'resolva': {
      const prev = prevNote;
      if (s.pending && prev) {
        const dist = Math.abs(n.midi - prev.midi);
        if (n.cls === 'repouso' && dist > 0 && dist <= MAX_STEP)
          return {
            ...s,
            hits: s.hits + 1,
            pending: false,
            feedback: hit(
              tx(`Resolveu: ${prev.name} → ${n.name}.`, `Resolved: ${prev.name} → ${n.name}.`),
            ),
          };
        if (n.cls === 'tensao')
          return {
            ...s,
            feedback: info(
              tx(
                `Nova tensão em ${n.name}. Agora resolva.`,
                `New tension on ${n.name}. Now resolve it.`,
              ),
            ),
          };
        return {
          ...s,
          misses: s.misses + 1,
          pending: false,
          feedback: miss(
            n.cls === 'repouso'
              ? tx(
                  `${n.name} é do acorde, mas longe de ${prev.name}. Resolva por passo.`,
                  `${n.name} is a chord tone, but far from ${prev.name}. Resolve by step.`,
                )
              : tx(
                  `${n.name} ${CLASS_TEXT[n.cls].pt}: ${prev.name} ficou sem resolver.`,
                  `${n.name} ${CLASS_TEXT[n.cls].en}: ${prev.name} was left unresolved.`,
                ),
          ),
        };
      }
      return n.cls === 'tensao'
        ? {
            ...s,
            pending: true,
            feedback: info(
              tx(`Tensão em ${n.name}. Agora resolva.`, `Tension on ${n.name}. Now resolve it.`),
            ),
          }
        : {
            ...s,
            feedback: info(
              tx('Comece por uma tensão (laranja).', 'Start with a tension note (orange).'),
            ),
          };
    }

    case 'passo': {
      if (n.cls === 'fora')
        return {
          ...s,
          misses: s.prev ? s.misses + 1 : s.misses,
          streak: 0,
          feedback: miss(
            tx(
              `${n.name} está fora da escala. Recomece.`,
              `${n.name} is outside the scale. Start over.`,
            ),
          ),
        };
      const prev = prevNote;
      if (!prev || prev.cls === 'fora' || s.streak === 0)
        return {
          ...s,
          streak: 1,
          feedback: info(
            tx(
              `Começou em ${n.name}. Ande para um vizinho.`,
              `Started on ${n.name}. Move to a neighbor.`,
            ),
          ),
        };
      const dist = Math.abs(n.midi - prev.midi);
      if (dist === 0)
        return {
          ...s,
          feedback: info(
            tx(
              'A mesma nota não conta: ande um passo.',
              "The same note doesn't count: take a step.",
            ),
          ),
        };
      if (dist <= MAX_STEP)
        return {
          ...s,
          hits: s.hits + 1,
          streak: s.streak + 1,
          feedback: hit(tx(`${prev.name} → ${n.name}: passo.`, `${prev.name} → ${n.name}: step.`)),
        };
      return {
        ...s,
        misses: s.misses + 1,
        streak: 1,
        feedback: miss(
          tx(
            `Salto de ${dist} semitons. A frase recomeça em ${n.name}.`,
            `Leap of ${dist} semitones. The phrase restarts on ${n.name}.`,
          ),
        ),
      };
    }

    case 'alvo': {
      if (n.bar === null)
        return {
          ...s,
          feedback: info(
            tx('Ligue a base para este exercício.', 'Start the backing track for this exercise.'),
          ),
        };
      if (n.bar < 0)
        return {
          ...s,
          feedback: info(tx('Espere a contagem terminar.', 'Wait for the count-in to finish.')),
        };
      // Só a primeira nota de cada acorde conta; o resto, até a próxima troca, é livre.
      if (n.bar === s.lastBar) return s;
      return n.cls === 'repouso'
        ? {
            ...s,
            lastBar: n.bar,
            hits: s.hits + 1,
            feedback: hit(
              tx(`Alvo certo: ${n.name} em ${n.chord}.`, `On target: ${n.name} on ${n.chord}.`),
            ),
          }
        : {
            ...s,
            lastBar: n.bar,
            misses: s.misses + 1,
            feedback: miss(
              tx(
                `${n.name} ${CLASS_TEXT[n.cls].pt} em ${n.chord}. Mire uma verde.`,
                `${n.name} ${CLASS_TEXT[n.cls].en} on ${n.chord}. Aim for a green one.`,
              ),
            ),
          };
    }
  }
}
