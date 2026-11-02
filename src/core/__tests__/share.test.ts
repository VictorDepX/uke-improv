import { describe, expect, it } from 'vitest';
import { decodeShare, encodeShare } from '../share';

describe('link de progressão', () => {
  it('ida e volta com tom, compasso, andamento e estilo', () => {
    const code = encodeShare({
      key: { tonic: 'D', scale: 'major' },
      progression: {
        id: 'x',
        name: 'Valsa ç',
        mode: 'major',
        numerals: ['I', 'IV', 'V7', 'I'],
        meter: '3/4',
      },
      bpm: 120,
      grooveId: 'valsa',
    });
    expect(code).toMatch(/^[A-Za-z0-9_-]+$/);
    const back = decodeShare(code, 'custom-1')!;
    expect(back.key).toEqual({ tonic: 'D', scale: 'major' });
    expect(back.progression).toMatchObject({
      id: 'custom-1',
      name: 'Valsa ç',
      meter: '3/4',
      custom: true,
    });
    expect(back.bpm).toBe(120);
    expect(back.grooveId).toBe('valsa');
  });

  it('recusa lixo e campos inválidos', () => {
    expect(decodeShare('%%%', 'a')).toBeNull();
    expect(decodeShare(btoa('{"k":{"tonic":"H","scale":"major"}}'), 'a')).toBeNull();
    const bad = encodeShare({
      key: { tonic: 'C', scale: 'major' },
      progression: { id: 'x', name: 'n', mode: 'major', numerals: ['<script>'] },
      bpm: 90,
      grooveId: 'nao-existe',
    });
    expect(decodeShare(bad, 'a')).toBeNull();
    const badQuality = encodeShare({
      key: { tonic: 'C', scale: 'major' },
      progression: { id: 'x', name: 'n', mode: 'major', numerals: ['I:zz9'] },
      bpm: 90,
      grooveId: null,
    });
    expect(decodeShare(badQuality, 'a')).toBeNull();
  });
});
