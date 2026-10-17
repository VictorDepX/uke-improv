import { useRef, useState } from 'react';
import { bpmFromTaps, pushTap } from '@/core/tempo';
import { useMusicStore } from '@/store/useMusicStore';

/** Toque no pulso da música: a partir do 2º toque o andamento acompanha. */
export function TapTempo({ className = '' }: { className?: string }) {
  const setBpm = useMusicStore((s) => s.setBpm);
  const taps = useRef<number[]>([]);
  const [count, setCount] = useState(0);

  const tap = () => {
    taps.current = pushTap(taps.current, performance.now());
    setCount(taps.current.length);
    const bpm = bpmFromTaps(taps.current);
    if (bpm !== null) setBpm(bpm);
  };

  return (
    <button
      type="button"
      className={`tap-tempo ${className}`}
      onClick={tap}
      aria-label="Tap tempo: toque no pulso para definir o andamento"
      data-active={count > 1 || undefined}
    >
      Tap
    </button>
  );
}
