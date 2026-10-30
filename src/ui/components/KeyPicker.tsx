import { SCALES, TONICS } from '@/core/music';
import type { ScaleName } from '@/core/types';
import { useNames, useT } from '@/i18n';
import { useMusicStore } from '@/store/useMusicStore';
import { Select } from './controls';

export function KeyPicker() {
  const t = useT();
  const n = useNames();
  const key = useMusicStore((s) => s.key);
  const setTonic = useMusicStore((s) => s.setTonic);
  const setScale = useMusicStore((s) => s.setScale);
  const tonicOptions = TONICS.map((x) => ({ value: x as string, label: n(x) }));
  const scaleOptions = (Object.keys(SCALES) as ScaleName[]).map((s) => ({
    value: s,
    label: t(SCALES[s].label),
  }));
  return (
    <div className="key-picker">
      <Select
        id="key-tonic"
        label={t('Tom', 'Key')}
        value={key.tonic}
        options={tonicOptions}
        onChange={setTonic}
      />
      <Select
        id="key-scale"
        label={t('Escala', 'Scale')}
        value={key.scale}
        options={scaleOptions}
        onChange={setScale}
      />
    </div>
  );
}
