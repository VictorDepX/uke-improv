import { describe, expect, it } from 'vitest';
import { MAX_WINDOW_START, clampWindowStart, followWindow } from '../fretboard';

describe('followWindow', () => {
  it('não mexe enquanto a casa está dentro da janela', () => {
    expect(followWindow(3, 3)).toBe(3);
    expect(followWindow(3, 7)).toBe(3);
  });

  it('cordas soltas não movem a janela', () => {
    expect(followWindow(7, 0)).toBe(7);
  });

  it('recentra quando a casa sai da janela', () => {
    expect(followWindow(1, 7)).toBe(5); // casas 5–9, com a 7 no meio
    expect(followWindow(8, 3)).toBe(1);
  });

  it('respeita os limites do braço', () => {
    expect(followWindow(1, 15)).toBe(MAX_WINDOW_START);
    expect(clampWindowStart(-4)).toBe(1);
    expect(clampWindowStart(99)).toBe(MAX_WINDOW_START);
  });
});
