import { describe, expect, it } from 'vitest';
import { suggestNextChords } from '../suggestChords';
import { makeT } from '@/i18n/lang';

const pt = makeT('pt');

const C = { tonic: 'C', scale: 'major' as const };

describe('suggestNextChords', () => {
  it('sobre G em C maior, as duas primeiras sugestões são C e Am', () => {
    const top = suggestNextChords('G', C);
    expect(top.slice(0, 2).map((s) => s.symbol)).toEqual(['C', 'Am']);
    expect(pt(top[0]!.reason)).toMatch(/V → I/);
    expect(pt(top[1]!.reason)).toMatch(/engano/);
  });

  it('com dominantes secundárias ligadas, E7 (prepara Am) aparece sobre G', () => {
    const top = suggestNextChords('G', C, {
      extras: { secondaryDominants: true, modalBorrowing: false },
      count: 8,
    });
    const e7 = top.find((s) => s.symbol === 'E7');
    expect(e7).toBeDefined();
    expect(e7!.kind).toBe('secondary');
    expect(e7!.numeral).toBe('V7/vi');
  });

  it('uma dominante secundária resolve no seu alvo', () => {
    const [first] = suggestNextChords('E7', C);
    expect(first!.symbol).toBe('Am');
  });

  it('ii leva a V', () => {
    expect(suggestNextChords('Dm', C)[0]!.symbol).toBe('G');
  });

  it('empréstimo modal oferece Fm a partir de F', () => {
    const top = suggestNextChords('F', C, {
      extras: { secondaryDominants: false, modalBorrowing: true },
      count: 8,
    });
    expect(top.some((s) => s.symbol === 'Fm' && s.kind === 'borrowed')).toBe(true);
  });

  it('nunca sugere o próprio acorde nem duas versões da mesma fundamental', () => {
    const top = suggestNextChords('C', C, { count: 8 });
    expect(top.some((s) => s.symbol === 'C')).toBe(false);
    const roots = top.map((s) => s.symbol.replace(/7$/, ''));
    expect(new Set(roots).size).toBe(roots.length);
  });

  it('no menor, V resolve em i', () => {
    expect(suggestNextChords('E', { tonic: 'A', scale: 'minor' })[0]!.symbol).toBe('Am');
  });

  it('penaliza voltar ao acorde de onde se acabou de vir', () => {
    const fresh = suggestNextChords('Am', C);
    const withHistory = suggestNextChords('Am', C, { history: ['F', 'Am'] });
    const f1 = fresh.find((s) => s.symbol === 'F')!.score;
    const f2 = withHistory.find((s) => s.symbol === 'F')!.score;
    expect(f2).toBeLessThan(f1);
  });
});
