import type { NoteClass } from './types';

export type ExerciseId = 'repouso' | 'resolva' | 'passo' | 'alvo';

export interface ExerciseDef {
  id: ExerciseId;
  title: string;
  /** O que fazer, em uma frase. */
  goal: string;
  /** Acertos (ou notas seguidas, no passo a passo) para concluir. */
  target: number;
  unit: string;
  /** Só faz sentido com a base tocando. */
  needsJam?: boolean;
}

export const EXERCISES: readonly ExerciseDef[] = [
  {
    id: 'repouso',
    title: 'Só repouso',
    goal: 'Toque só notas do acorde atual (as verdes). Troque de acorde quando quiser.',
    target: 8,
    unit: 'notas do acorde',
  },
  {
    id: 'resolva',
    title: 'Resolva a tensão',
    goal: 'Toque uma tensão (laranja) e, logo depois, uma nota do acorde a até um tom de distância.',
    target: 4,
    unit: 'resoluções',
  },
  {
    id: 'passo',
    title: 'Passo a passo',
    goal: 'Faça uma frase só com notas vizinhas da escala (meio tom ou um tom), sem saltos.',
    target: 8,
    unit: 'notas seguidas',
  },
  {
    id: 'alvo',
    title: 'Alvo na troca',
    goal: 'Com a base tocando, comece cada compasso com uma nota do acorde novo.',
    target: 4,
    unit: 'compassos',
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
  /** Compasso da base (−1 na contagem) ou null com a base parada. */
  bar: number | null;
}

export interface Feedback {
  kind: 'hit' | 'miss' | 'info';
  text: string;
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
  /** Último compasso avaliado (alvo na troca). */
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

const CLASS_TEXT: Record<NoteClass, string> = {
  repouso: 'é do acorde',
  passagem: 'é passagem',
  tensao: 'é tensão',
  fora: 'está fora da escala',
};

const hit = (text: string): Feedback => ({ kind: 'hit', text });
const miss = (text: string): Feedback => ({ kind: 'miss', text });
const info = (text: string): Feedback => ({ kind: 'info', text });

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
          `Concluído: ${next.hits} ${next.hits === 1 ? 'acerto' : 'acertos'}, ${next.misses} ${
            next.misses === 1 ? 'erro' : 'erros'
          }.`,
        )
      : next.feedback,
  };
}

function evaluate(s: ExerciseState, n: ExerciseNote): ExerciseState {
  switch (s.id) {
    case 'repouso':
      return n.cls === 'repouso'
        ? { ...s, hits: s.hits + 1, feedback: hit(`${n.name} é do acorde ${n.chord}.`) }
        : {
            ...s,
            misses: s.misses + 1,
            feedback: miss(`${n.name} ${CLASS_TEXT[n.cls]}. Procure uma verde.`),
          };

    case 'resolva': {
      const prev = s.prev;
      if (s.pending && prev) {
        const dist = Math.abs(n.midi - prev.midi);
        if (n.cls === 'repouso' && dist > 0 && dist <= MAX_STEP)
          return {
            ...s,
            hits: s.hits + 1,
            pending: false,
            feedback: hit(`Resolveu: ${prev.name} → ${n.name}.`),
          };
        if (n.cls === 'tensao')
          return { ...s, feedback: info(`Nova tensão em ${n.name}. Agora resolva.`) };
        return {
          ...s,
          misses: s.misses + 1,
          pending: false,
          feedback: miss(
            n.cls === 'repouso'
              ? `${n.name} é do acorde, mas longe de ${prev.name}. Resolva por passo.`
              : `${n.name} ${CLASS_TEXT[n.cls]}: ${prev.name} ficou sem resolver.`,
          ),
        };
      }
      return n.cls === 'tensao'
        ? { ...s, pending: true, feedback: info(`Tensão em ${n.name}. Agora resolva.`) }
        : { ...s, feedback: info('Comece por uma tensão (laranja).') };
    }

    case 'passo': {
      if (n.cls === 'fora')
        return {
          ...s,
          misses: s.prev ? s.misses + 1 : s.misses,
          streak: 0,
          feedback: miss(`${n.name} está fora da escala. Recomece.`),
        };
      const prev = s.prev;
      if (!prev || prev.cls === 'fora' || s.streak === 0)
        return { ...s, streak: 1, feedback: info(`Começou em ${n.name}. Ande para um vizinho.`) };
      const dist = Math.abs(n.midi - prev.midi);
      if (dist === 0) return { ...s, feedback: info('A mesma nota não conta: ande um passo.') };
      if (dist <= MAX_STEP)
        return {
          ...s,
          hits: s.hits + 1,
          streak: s.streak + 1,
          feedback: hit(`${prev.name} → ${n.name}: passo.`),
        };
      return {
        ...s,
        misses: s.misses + 1,
        streak: 1,
        feedback: miss(`Salto de ${dist} semitons. A frase recomeça em ${n.name}.`),
      };
    }

    case 'alvo': {
      if (n.bar === null) return { ...s, feedback: info('Ligue a base para este exercício.') };
      if (n.bar < 0) return { ...s, feedback: info('Espere a contagem terminar.') };
      // Só a primeira nota de cada compasso conta; o resto do compasso é livre.
      if (n.bar === s.lastBar) return s;
      return n.cls === 'repouso'
        ? {
            ...s,
            lastBar: n.bar,
            hits: s.hits + 1,
            feedback: hit(`Alvo certo: ${n.name} em ${n.chord}.`),
          }
        : {
            ...s,
            lastBar: n.bar,
            misses: s.misses + 1,
            feedback: miss(`${n.name} ${CLASS_TEXT[n.cls]} em ${n.chord}. Mire uma verde.`),
          };
    }
  }
}
