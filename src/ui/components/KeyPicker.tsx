import { useId } from 'react';
import { SCALES, TONICS } from '@/core/music';
import type { ScaleName } from '@/core/types';
import { tx, useNames, useT, type Txt } from '@/i18n';
import { useMusicStore } from '@/store/useMusicStore';
import { Segmented, Select } from './controls';

/** Rótulos curtos para caber as 8 escalas numa linha (o nome completo fica no seletor). */
const SHORT: Partial<Record<ScaleName, Txt>> = {
  minor: tx('Menor', 'Minor'),
  majorPentatonic: tx('Pent. maior', 'Maj. pent.'),
  minorPentatonic: tx('Pent. menor', 'Min. pent.'),
  dorian: tx('Dórica', 'Dorian'),
  mixolydian: tx('Mixolídia', 'Mixolydian'),
  harmonicMinor: tx('Menor harm.', 'Harm. minor'),
};

/**
 * Tom: as 12 tônicas lado a lado, como teclas (acidentes num tom mais escuro), e a escala.
 * Desktop: escala em controle segmentado; celular: em seletor (passa de 4 opções).
 */
export function KeyPicker() {
  const t = useT();
  const n = useNames();
  const labelId = useId();
  const key = useMusicStore((s) => s.key);
  const setTonic = useMusicStore((s) => s.setTonic);
  const setScale = useMusicStore((s) => s.setScale);
  const scales = Object.keys(SCALES) as ScaleName[];
  return (
    <div className="key-picker">
      <div className="field-row">
        <span id={labelId} className="field-label">
          {t('Tônica', 'Tonic')}
        </span>
        <div className="tonic-keys" role="radiogroup" aria-labelledby={labelId}>
          {TONICS.map((x) => (
            <button
              key={x}
              type="button"
              role="radio"
              aria-checked={key.tonic === x}
              className="tonic-key mono"
              data-accidental={x.length > 1 || undefined}
              onClick={() => setTonic(x)}
            >
              {n(x)}
            </button>
          ))}
        </div>
      </div>
      <div className="field-row scale-wide">
        <Segmented
          label={t('Escala', 'Scale')}
          value={key.scale}
          options={scales.map((s) => ({ value: s, label: t(SHORT[s] ?? SCALES[s].label) }))}
          onChange={setScale}
        />
      </div>
      <div className="scale-narrow">
        <Select
          id="key-scale"
          label={t('Escala', 'Scale')}
          value={key.scale}
          options={scales.map((s) => ({ value: s, label: t(SCALES[s].label) }))}
          onChange={setScale}
        />
      </div>
    </div>
  );
}
