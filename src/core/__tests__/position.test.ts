import { describe, expect, it } from 'vitest';
import { resolvePosition } from '../fretboard';

const A4 = 69;

describe('posição de uma nota ouvida pelo microfone', () => {
  it('prefere a janela visível: casas 5–9 → A4 na corda E, casa 5', () => {
    expect(resolvePosition(A4, 'GCEA', { window: [5, 9] })).toMatchObject({ string: 2, fret: 5 });
  });

  it('segue a mão: perto da casa 2 é G2; perto da 9 é C9', () => {
    expect(resolvePosition(A4, 'GCEA', { last: { string: 0, fret: 3 } })).toMatchObject({
      string: 0,
      fret: 2,
    });
    expect(resolvePosition(A4, 'GCEA', { last: { string: 1, fret: 10 } })).toMatchObject({
      string: 1,
      fret: 9,
    });
  });

  it('corda solta está sempre ao alcance: depois de C5 na corda A (casa 3), A4 é a A solta', () => {
    expect(resolvePosition(A4, 'GCEA', { last: { string: 3, fret: 3 } })).toMatchObject({
      string: 3,
      fret: 0,
    });
  });

  it('nota que só existe num lugar vai para ele; fora do braço não tem posição', () => {
    expect(resolvePosition(60, 'GCEA', { window: [5, 9] })).toMatchObject({ string: 1, fret: 0 });
    expect(resolvePosition(40, 'GCEA', {})).toBeUndefined();
  });

  it('com capo, as casas contam a partir dele', () => {
    // Capo 2: A4 é a corda G solta (casa 0 do capo).
    expect(resolvePosition(A4, 'GCEA', { capo: 2, last: { string: 0, fret: 1 } })).toMatchObject({
      string: 0,
      fret: 0,
    });
  });
});
