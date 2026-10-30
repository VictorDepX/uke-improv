import { useMusicStore, type Layer } from '@/store/useMusicStore';
import { Slider } from '../controls';
import { tx, useT, type Txt } from '@/i18n';

const LAYERS: { id: Layer; label: Txt }[] = [
  { id: 'chords', label: tx('Acordes', 'Chords') },
  { id: 'bass', label: tx('Baixo', 'Bass') },
  { id: 'drums', label: tx('Bateria', 'Drums') },
];

export function LayerMixer() {
  const t = useT();
  const layers = useMusicStore((s) => s.jam.layers);
  const setVolume = useMusicStore((s) => s.setLayerVolume);
  return (
    <div className="mixer">
      {LAYERS.map((l) => (
        <Slider
          key={l.id}
          id={`layer-${l.id}`}
          label={t(l.label)}
          min={0}
          max={100}
          value={Math.round(layers[l.id] * 100)}
          display={layers[l.id] === 0 ? t('mudo', 'muted') : `${Math.round(layers[l.id] * 100)}%`}
          onChange={(v) => setVolume(l.id, v / 100)}
        />
      ))}
    </div>
  );
}
