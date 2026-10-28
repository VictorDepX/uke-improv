import { buildNoteContext } from '@/core/classify';
import type { KeyContext } from '@/core/types';
import { Fretboard } from '@/ui/components/Fretboard';

// `inert` tira as casas do Tab (são botões que aqui não tocam nada). Os tipos do React 18 ainda
// não conhecem o atributo, que o navegador aceita como string vazia.
const INERT = { inert: '' } as object;

interface GuideBoardProps {
  keyContext: KeyContext;
  chord: string;
  /** Legenda visível; também é a descrição para leitores de tela. */
  caption: string;
  /** Só as notas do acorde (arpejo). */
  arpeggio?: boolean;
}

/**
 * O mesmo braço do app, parado, como figura do guia. As casas não tocam nada aqui, então o
 * desenho fica escondido dos leitores de tela; a legenda e o texto ao redor dizem o que ele mostra.
 */
export function GuideBoard({ keyContext, chord, caption, arpeggio = false }: GuideBoardProps) {
  return (
    <figure className="guide-board">
      <div className="guide-board-frame" aria-hidden="true" {...INERT}>
        <Fretboard
          ctx={buildNoteContext(keyContext, chord, arpeggio)}
          keyContext={keyContext}
          tuning="GCEA"
          labels="note"
          fretWindow={null}
        />
      </div>
      <figcaption>{caption}</figcaption>
    </figure>
  );
}
