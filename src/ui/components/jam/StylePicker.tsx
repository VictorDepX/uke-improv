import { groovesFor, resolveGroove } from '@/core/grooves';
import { useActiveProgression } from '@/store/selectors';
import { useMusicStore } from '@/store/useMusicStore';
import { Segmented } from '../controls';

/** Estilo da base, entre os que servem para o compasso da progressão. */
export function StylePicker() {
  const { meter } = useActiveProgression();
  const grooveId = useMusicStore((s) => s.jam.grooveId);
  const setGroove = useMusicStore((s) => s.setGroove);
  const options = groovesFor(meter).map((g) => ({ value: g.id, label: g.name }));
  const current = resolveGroove(grooveId, meter);
  return (
    <Segmented
      label={`Estilo (${meter})`}
      value={current.id}
      options={options}
      onChange={(id) => setGroove(id)}
    />
  );
}
