import type { CSSProperties } from 'react';

/**
 * Nome do acorde num botão de acorde. Passa o número de caracteres ao CSS (--len), que
 * encolhe a letra quando o nome não cabe ("Sol#dim" em Dó Ré Mi) em vez de cortá-lo.
 */
export function ChordName({ label }: { label: string }) {
  return (
    <span
      className="chord-chip-symbol"
      title={label}
      style={{ '--len': Math.max(3, [...label].length) } as CSSProperties}
    >
      {label}
    </span>
  );
}
