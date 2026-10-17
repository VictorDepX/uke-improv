import { describe, expect, it } from 'vitest';
import { TAP_WINDOW, bpmFromTaps, pushTap } from '../tempo';

const tapsAt = (bpm: number, n: number, start = 1000) =>
  Array.from({ length: n }, (_, i) => start + (i * 60000) / bpm);

describe('tap tempo', () => {
  it('precisa de dois toques', () => {
    expect(bpmFromTaps([])).toBeNull();
    expect(bpmFromTaps([1000])).toBeNull();
  });

  it('calcula o andamento de toques regulares', () => {
    expect(bpmFromTaps(tapsAt(90, 4))).toBe(90);
    expect(bpmFromTaps(tapsAt(120, 6))).toBe(120);
  });

  it('a mediana ignora um toque fora do tempo', () => {
    const taps = tapsAt(100, 5);
    taps[3]! += 180; // um toque atrasado
    expect(bpmFromTaps(taps)).toBe(100);
  });

  it('uma pausa longa recomeça a contagem', () => {
    const taps = pushTap(tapsAt(80, 3), 1000 + 3 * 750 + 2500);
    expect(taps).toHaveLength(1);
  });

  it('guarda só os toques recentes', () => {
    let taps: number[] = [];
    for (const t of tapsAt(100, 10)) taps = pushTap(taps, t);
    expect(taps).toHaveLength(TAP_WINDOW);
  });
});
