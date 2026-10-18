// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  barSeconds,
  defaultLatency,
  fadeEdges,
  loopSeconds,
  nextBoundary,
  sliceCapture,
  waveform,
} from '../timing';

describe('tempo do looper', () => {
  it('duração do compasso em cada fórmula', () => {
    expect(barSeconds(120, '4/4')).toBeCloseTo(2);
    expect(barSeconds(120, '3/4')).toBeCloseTo(1.5);
    // 6/8 a 60 BPM de semínima pontuada: 2 pulsos de 1 s.
    expect(barSeconds(60, '6/8')).toBeCloseTo(2);
    expect(loopSeconds(90, '4/4', 4)).toBeCloseTo(32 / 3);
  });

  it('próximo começo de ciclo', () => {
    expect(nextBoundary(0.5, 1, 4)).toBe(1);
    expect(nextBoundary(1, 1, 4)).toBe(1);
    expect(nextBoundary(1.01, 1, 4)).toBe(5);
    expect(nextBoundary(9, 1, 4)).toBe(9);
  });

  it('recorta a captura no instante exato, com silêncio onde faltou', () => {
    const sr = 1000;
    const block = (t: number, v: number) => ({ t, data: new Float32Array(100).fill(v) });
    const chunks = [block(0, 1), block(0.1, 2), block(0.2, 3), block(0.4, 4)];
    const out = sliceCapture(chunks, sr, 0.05, 0.4);
    expect(out).toHaveLength(400);
    expect(out[0]).toBe(1); // t = 0.05
    expect(out[50]).toBe(2); // t = 0.10
    expect(out[150]).toBe(3); // t = 0.20
    expect(out[260]).toBe(0); // 0.31: buraco na captura
    expect(out[355]).toBe(4); // t = 0.405
  });

  it('suaviza as emendas e resume a forma de onda', () => {
    const s = fadeEdges(new Float32Array(1000).fill(1), 1000, 10);
    expect(s[0]).toBe(0);
    expect(s[5]).toBeCloseTo(0.5);
    expect(s[500]).toBe(1);
    expect(s[999]).toBe(0);
    const w = waveform(Float32Array.from([0, 0.5, -0.9, 0.1, 0, 0, 0.2, -0.3]), 4);
    [0.5, 0.9, 0, 0.3].forEach((v, i) => expect(w[i]).toBeCloseTo(v));
  });

  it('latência padrão soma saída, base e uma estimativa da entrada', () => {
    expect(defaultLatency(0.02, 0.005)).toBeCloseTo(0.04);
    expect(defaultLatency(undefined, undefined)).toBeCloseTo(0.015);
  });
});
