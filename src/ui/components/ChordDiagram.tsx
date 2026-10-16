import { memo } from 'react';
import type { Shape } from '@/core/chordShapes';

interface ChordDiagramProps {
  shape: Shape;
  label?: string;
  size?: 'sm' | 'md';
}

const STRINGS = 4;
const FRETS = 4;

/** Diagrama de acorde em SVG, cordas G C E A da esquerda para a direita. */
export const ChordDiagram = memo(function ChordDiagram({
  shape,
  label,
  size = 'md',
}: ChordDiagramProps) {
  const max = Math.max(...shape);
  const base = max > FRETS ? Math.min(...shape.filter((f) => f > 0)) : 1;
  const w = 64;
  const h = 76;
  const left = 10;
  const top = 14;
  const gapX = (w - 2 * left) / (STRINGS - 1);
  const gapY = (h - top - 6) / FRETS;
  const aria = `Diagrama${label ? ` de ${label}` : ''}: casas ${shape.join(', ')} nas cordas G, C, E, A`;
  return (
    <svg
      className="chord-diagram"
      data-size={size}
      viewBox={`0 0 ${w} ${h}`}
      role="img"
      aria-label={aria}
    >
      {base === 1 ? (
        <rect x={left - 1} y={top - 3} width={w - 2 * left + 2} height={3} className="cd-nut" />
      ) : (
        <text x={1} y={top + gapY * 0.65} className="cd-base">
          {base}
        </text>
      )}
      {Array.from({ length: FRETS + 1 }, (_, i) => (
        <line
          key={`f${i}`}
          x1={left}
          x2={w - left}
          y1={top + i * gapY}
          y2={top + i * gapY}
          className="cd-fret"
        />
      ))}
      {Array.from({ length: STRINGS }, (_, i) => (
        <line
          key={`s${i}`}
          x1={left + i * gapX}
          x2={left + i * gapX}
          y1={top}
          y2={top + FRETS * gapY}
          className="cd-string"
        />
      ))}
      {shape.map((fret, i) => {
        const x = left + i * gapX;
        if (fret === 0) return <circle key={i} cx={x} cy={top - 8} r={3} className="cd-open" />;
        const row = fret - base + 0.5;
        return <circle key={i} cx={x} cy={top + row * gapY} r={5} className="cd-dot" />;
      })}
    </svg>
  );
});
