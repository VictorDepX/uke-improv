import { describe, expect, it } from 'vitest';
import { encodeWav } from '../wav';

describe('encodeWav', () => {
  it('cabeçalho PCM 16 bits e amostras limitadas a ±1', async () => {
    const blob = encodeWav([new Float32Array([0, 1, -1, 2])], 8000);
    const v = new DataView(await blob.arrayBuffer());
    const tag = (o: number) => String.fromCharCode(...[0, 1, 2, 3].map((i) => v.getUint8(o + i)));
    expect([tag(0), tag(8), tag(36)]).toEqual(['RIFF', 'WAVE', 'data']);
    expect(v.getUint32(24, true)).toBe(8000);
    expect(v.getUint32(40, true)).toBe(8);
    expect([0, 1, 2, 3].map((i) => v.getInt16(44 + i * 2, true))).toEqual([
      0, 32767, -32768, 32767,
    ]);
  });
});
