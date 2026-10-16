import { useMusicStore, type Layer } from '@/store/useMusicStore';
import { Slider } from '../controls';

const LAYERS: { id: Layer; label: string }[] = [
  { id: 'chords', label: 'Acordes' },
  { id: 'bass', label: 'Baixo' },
  { id: 'drums', label: 'Bateria' },
];

export function LayerMixer() {
  const layers = useMusicStore((s) => s.jam.layers);
  const setVolume = useMusicStore((s) => s.setLayerVolume);
  return (
    <div className="mixer">
      {LAYERS.map((l) => (
        <Slider
          key={l.id}
          id={`layer-${l.id}`}
          label={l.label}
          min={0}
          max={100}
          value={Math.round(layers[l.id] * 100)}
          display={layers[l.id] === 0 ? 'mudo' : `${Math.round(layers[l.id] * 100)}%`}
          onChange={(v) => setVolume(l.id, v / 100)}
        />
      ))}
    </div>
  );
}
