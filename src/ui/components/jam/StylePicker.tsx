import { groovesFor, resolveGroove } from '@/core/grooves';
import { useActiveProgression } from '@/store/selectors';
import { useMusicStore } from '@/store/useMusicStore';
import { Segmented } from '../controls';
import { useT } from '@/i18n';

/** Estilo da base, entre os que servem para o compasso da progressão. */
export function StylePicker() {
  const t = useT();
  const { meter } = useActiveProgression();
  const grooveId = useMusicStore((s) => s.jam.grooveId);
  const setGroove = useMusicStore((s) => s.setGroove);
  const options = groovesFor(meter).map((g) => ({ value: g.id, label: t(g.name) }));
  const current = resolveGroove(grooveId, meter);
  return (
    <Segmented
      label={t(`Estilo (${meter})`, `Style (${meter})`)}
      value={current.id}
      options={options}
      onChange={(id) => setGroove(id)}
    />
  );
}
