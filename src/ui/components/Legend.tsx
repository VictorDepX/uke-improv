import type { NoteClass } from '@/core/types';
import { tx, useT, type Txt } from '@/i18n';

const ITEMS: { cls: NoteClass; label: Txt; hint: Txt }[] = [
  { cls: 'repouso', label: tx('Repouso', 'Rest'), hint: tx('nota do acorde', 'chord tone') },
  { cls: 'passagem', label: tx('Passagem', 'Passing'), hint: tx('na escala', 'in the scale') },
  { cls: 'tensao', label: tx('Tensão', 'Tension'), hint: tx('pede resolução', 'wants to resolve') },
  { cls: 'fora', label: tx('Fora', 'Outside'), hint: tx('cromatismo', 'chromatic') },
];

export function Legend() {
  const t = useT();
  return (
    <ul className="legend" aria-label={t('Legenda das cores', 'Color legend')}>
      {ITEMS.map((i) => (
        <li key={i.cls}>
          <span className="legend-swatch" data-cls={i.cls} aria-hidden="true" />
          <span className="legend-label">{t(i.label)}</span>
          <span className="legend-hint">{t(i.hint)}</span>
        </li>
      ))}
      <li className="legend-tip">
        {t(
          'Segure uma casa para saber o porquê da cor.',
          'Press and hold a fret to see why it has that color.',
        )}
      </li>
    </ul>
  );
}
