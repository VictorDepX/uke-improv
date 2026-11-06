import type { NoteClass } from '@/core/types';
import { tx, useT, type Txt } from '@/i18n';

const ITEMS: { cls: NoteClass; label: Txt; hint: Txt }[] = [
  { cls: 'repouso', label: tx('Repouso', 'Rest'), hint: tx('nota do acorde', 'chord tone') },
  { cls: 'passagem', label: tx('Passagem', 'Passing'), hint: tx('na escala', 'in the scale') },
  { cls: 'tensao', label: tx('Tensão', 'Tension'), hint: tx('pede resolução', 'wants to resolve') },
  { cls: 'fora', label: tx('Fora', 'Outside'), hint: tx('cromatismo', 'chromatic') },
];

/**
 * Legenda das cores e formas do braço. A compacta (só cor e nome, numa linha) fica junto do
 * braço onde se toca (celular deitado, Jam, prática), para o significado nunca sumir.
 */
export function Legend({ compact = false }: { compact?: boolean }) {
  const t = useT();
  return (
    <ul
      className="legend"
      data-compact={compact || undefined}
      aria-label={t('Legenda das cores', 'Color legend')}
    >
      {ITEMS.map((i) => (
        <li key={i.cls}>
          <span className="legend-swatch" data-cls={i.cls} aria-hidden="true" />
          <span className="legend-label">{t(i.label)}</span>
          {compact ? null : <span className="legend-hint">{t(i.hint)}</span>}
        </li>
      ))}
      {compact ? null : (
        <li className="legend-tip">
          {t(
            'Segure uma casa para saber o porquê da cor.',
            'Press and hold a fret to see why it has that color.',
          )}
        </li>
      )}
    </ul>
  );
}
