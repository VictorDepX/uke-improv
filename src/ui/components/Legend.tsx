import type { NoteClass } from '@/core/types';

const ITEMS: { cls: NoteClass; label: string; hint: string }[] = [
  { cls: 'repouso', label: 'Repouso', hint: 'nota do acorde' },
  { cls: 'passagem', label: 'Passagem', hint: 'na escala' },
  { cls: 'tensao', label: 'Tensão', hint: 'pede resolução' },
  { cls: 'fora', label: 'Fora', hint: 'cromatismo' },
];

export function Legend() {
  return (
    <ul className="legend" aria-label="Legenda das cores">
      {ITEMS.map((i) => (
        <li key={i.cls}>
          <span className="legend-swatch" data-cls={i.cls} aria-hidden="true" />
          <span className="legend-label">{i.label}</span>
          <span className="legend-hint">{i.hint}</span>
        </li>
      ))}
    </ul>
  );
}
