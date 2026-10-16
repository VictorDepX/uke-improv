import { SCALES, TONICS } from '@/core/music';
import type { ScaleName } from '@/core/types';
import { useMusicStore } from '@/store/useMusicStore';
import { Select } from './controls';

const TONIC_OPTIONS = TONICS.map((t) => ({ value: t as string, label: t }));
const SCALE_OPTIONS = (Object.keys(SCALES) as ScaleName[]).map((s) => ({
  value: s,
  label: SCALES[s].label,
}));

export function KeyPicker() {
  const key = useMusicStore((s) => s.key);
  const setTonic = useMusicStore((s) => s.setTonic);
  const setScale = useMusicStore((s) => s.setScale);
  return (
    <div className="key-picker">
      <Select
        id="key-tonic"
        label="Tom"
        value={key.tonic}
        options={TONIC_OPTIONS}
        onChange={setTonic}
      />
      <Select
        id="key-scale"
        label="Escala"
        value={key.scale}
        options={SCALE_OPTIONS}
        onChange={setScale}
      />
    </div>
  );
}
