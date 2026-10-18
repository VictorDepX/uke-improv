import { describe, expect, it } from 'vitest';
import {
  analyzeChart,
  displayNumeral,
  parseChart,
  parseChordToken,
  simplifyQuality,
} from '../chart';

describe('leitura da cifra', () => {
  it('converte a notação brasileira e reduz tensões', () => {
    expect(simplifyQuality('7M')).toBe('maj7');
    expect(simplifyQuality('7M(9)')).toBe('maj7');
    expect(simplifyQuality('m7(b5)')).toBe('m7b5');
    expect(simplifyQuality('º')).toBe('dim');
    expect(simplifyQuality('º7')).toBe('dim7');
    expect(simplifyQuality('7(9)')).toBe('7');
    expect(simplifyQuality('m7(11)')).toBe('m7');
    expect(simplifyQuality('(add9)')).toBe('');
    expect(simplifyQuality('sus4')).toBe('sus4');
    expect(simplifyQuality('-7')).toBe('m7');
    expect(simplifyQuality('6')).toBe('6');
    expect(simplifyQuality('+')).toBe('aug');
  });

  it('lê baixo invertido e recusa palavras', () => {
    expect(parseChordToken('D/F#')).toEqual({ written: 'D/F#', symbol: 'D', bass: 'F#' });
    expect(parseChordToken('Bbm7')).toMatchObject({ symbol: 'Bbm7' });
    expect(parseChordToken('Amor')).toBeNull();
    expect(parseChordToken('Em,')).toMatchObject({ symbol: 'Em' });
  });

  it('separa linhas de acordes da letra, ignora seções e tablatura', () => {
    const chart = parseChart(`[Intro] G  D/F#  Em  C

G              D/F#
  A estrada é longa e o sol
Em              C
  Esquenta a calçada do bairro
e|---3---2---0---|

[Refrão]
C        D        G
  Canto alto, canto à toa`);
    expect(chart.chords.map((c) => c.symbol)).toEqual([
      'G',
      'D',
      'Em',
      'C',
      'G',
      'D',
      'Em',
      'C',
      'C',
      'D',
      'G',
    ]);
    // Sem barras: um acorde por compasso, repetido seguido vira um só.
    expect(chart.bars).toEqual([
      ['G'],
      ['D'],
      ['Em'],
      ['C'],
      ['G'],
      ['D'],
      ['Em'],
      ['C'],
      ['D'],
      ['G'],
    ]);
    expect(chart.barred).toBe(false);
  });

  it('uma linha com "A" de letra não vira acorde', () => {
    expect(parseChart('A casa é minha e a rua também').chords).toEqual([]);
    expect(parseChart('A   E   F#m   D').chords.map((c) => c.symbol)).toEqual([
      'A',
      'E',
      'F#m',
      'D',
    ]);
  });

  it('respeita os compassos marcados com barras', () => {
    const chart = parseChart('| Dm7  G7 | C7M | A7 | Dm7 G7 C7M |');
    expect(chart.barred).toBe(true);
    expect(chart.bars).toEqual([['Dm7', 'G7'], ['Cmaj7'], ['A7'], ['Dm7', 'G7'], ['Cmaj7']]);
  });
});

describe('análise do tom', () => {
  const analyze = (text: string) => analyzeChart(parseChart(text))!;

  it('acha o tom maior e explica cada acorde', () => {
    const a = analyze('G D/F# Em C\nG D C D\nAm7 D7 G');
    expect(a.key).toEqual({ tonic: 'G', scale: 'major' });
    expect(a.fit).toBe(1);
    const by = Object.fromEntries(a.chords.map((c) => [c.symbol, c]));
    expect(by['Em']).toMatchObject({ numeral: 'vi', role: 'diatonic' });
    expect(by['Am7']).toMatchObject({ numeral: 'ii7', role: 'diatonic' });
    expect(by['D7']).toMatchObject({ numeral: 'V7', role: 'diatonic' });
  });

  it('acorde menor no começo e no fim decide o relativo menor', () => {
    const a = analyze('Am F C G\nAm F C E7\nAm');
    expect(a.key).toEqual({ tonic: 'A', scale: 'minor' });
    expect(a.chords.find((c) => c.symbol === 'E7')).toMatchObject({
      numeral: 'V7',
      role: 'diatonic',
    });
  });

  it('marca dominantes secundárias e empréstimos', () => {
    const a = analyze('| C | A7 | Dm | G7 | C | E7 | Am | Fm | C |');
    expect(a.key.tonic).toBe('C');
    const by = Object.fromEntries(a.chords.map((c) => [c.symbol, c]));
    expect(by['A7']).toMatchObject({
      role: 'secondary',
      numeral: 'V7/ii',
      note: 'dominante secundária: prepara Dm',
    });
    expect(by['E7']).toMatchObject({ role: 'secondary', numeral: 'V7/vi' });
    expect(by['Fm']).toMatchObject({ role: 'borrowed', note: 'emprestado do tom menor' });
  });

  it('meio-diminuto é o viiø7 diatônico e o ii–V–I em F é lido em F', () => {
    const a = analyze('Gm7 C7 F7M\nEm7(b5) A7 Dm7\nGm7 C7 F7M');
    expect(a.key).toMatchObject({ tonic: 'F' });
    expect(a.chords.find((c) => c.symbol === 'Em7b5')).toMatchObject({
      numeral: 'viiø7',
      role: 'diatonic',
    });
  });

  it('sugere a escala: mixolídio com bVII, dórico com IV maior, blues com dominantes', () => {
    expect(analyze('D C G D\nD C G D').key).toEqual({ tonic: 'D', scale: 'mixolydian' });
    expect(analyze('Dm G Dm G\nDm G Dm').key).toEqual({ tonic: 'D', scale: 'dorian' });
    expect(analyze('| A7 | A7 | D7 | A7 | E7 | D7 | A7 | E7 |').key).toEqual({
      tonic: 'A',
      scale: 'blues',
    });
  });

  it('grafa a tônica como o seletor de tom (Bb, não A#)', () => {
    expect(analyze('A#m F# C# G#\nA#m').key.tonic).toBe('Bb');
  });

  it('texto sem acordes não tem análise', () => {
    expect(analyzeChart(parseChart('só letra aqui, nada de cifra'))).toBeNull();
  });
});

describe('detalhes de leitura', () => {
  it('mantém o parêntese da cifra e tira o de anotação', () => {
    expect(parseChordToken('A7(9)')).toMatchObject({ written: 'A7(9)', symbol: 'A7' });
    expect(parseChordToken('(Em)')).toMatchObject({ written: 'Em', symbol: 'Em' });
  });

  it('numeral de leitura para acordes com cor', () => {
    const D = { tonic: 'D', scale: 'major' } as const;
    expect(displayNumeral('Gm6', D)).toBe('iv6');
    expect(displayNumeral('Em7', D)).toBe('ii7');
    expect(displayNumeral('Gmaj7', D)).toBe('IVmaj7');
    expect(displayNumeral('C#m7b5', D)).toBe('viiø7');
    expect(displayNumeral('C', D)).toBe('bVII');
  });
});
