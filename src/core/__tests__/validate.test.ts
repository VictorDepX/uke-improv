import { describe, expect, it } from 'vitest';
import {
  LIMITS,
  sanitizeChord,
  sanitizeKey,
  sanitizeProgress,
  sanitizeProgressions,
  sanitizeSettings,
  sanitizeSyncMeta,
} from '../validate';

describe('validação de dados externos', () => {
  it('ajustes: mantém os válidos e descarta tipo errado ou fora da faixa', () => {
    expect(
      sanitizeSettings({
        tuning: 'GCEA-lowG',
        capo: 3,
        fretWindow: 'auto',
        labels: 'degree',
        shapes: false,
        micCalibration: { gain: 2, minRms: 0.01, noiseRms: 0.001, playRms: 0.05 },
      }),
    ).toEqual({
      tuning: 'GCEA-lowG',
      capo: 3,
      fretWindow: 'auto',
      labels: 'degree',
      shapes: false,
      micCalibration: { gain: 2, minRms: 0.01, noiseRms: 0.001, playRms: 0.05 },
    });
    expect(
      sanitizeSettings({
        tuning: 'DGBE',
        capo: 99,
        fretWindow: -4,
        labels: '<img onerror=x>',
        arpeggio: 'sim',
        weights: { cls: 'x' },
        micCalibration: { gain: Infinity },
      }),
    ).toEqual({});
    expect(sanitizeSettings(null)).toEqual({});
    expect(sanitizeSettings('[]')).toEqual({});
  });

  it('progressões: só as bem formadas, com limite de quantidade', () => {
    const good = {
      id: 'custom-1',
      name: 'Minha',
      mode: 'major',
      numerals: ['I', 'V7'],
      meter: '3/4',
    };
    expect(sanitizeProgressions([good])).toEqual([{ ...good, custom: true }]);
    expect(
      sanitizeProgressions([
        { ...good, numerals: 'I V' },
        { ...good, mode: 'lydian' },
        { ...good, numerals: [] },
        { ...good, numerals: ['x'.repeat(LIMITS.numeralLength + 1)] },
        { ...good, name: '' },
        { ...good, meter: '5/4' },
        null,
      ]),
    ).toEqual([
      // só a de compasso desconhecido sobra, sem o compasso
      { id: 'custom-1', name: 'Minha', mode: 'major', numerals: ['I', 'V7'], custom: true },
    ]);
    expect(sanitizeProgressions(Array(500).fill(good))).toHaveLength(LIMITS.progressions);
    expect(sanitizeProgressions({ length: 3 })).toEqual([]);
  });

  it('progresso: só modos e exercícios conhecidos, com contadores inteiros', () => {
    expect(
      sanitizeProgress({
        ear: {
          interval: { correct: 3, total: 4, streak: 1, best: 2 },
          quality: { correct: -1, total: 4, streak: 0, best: 0 },
          __proto__x: { correct: 1, total: 1, streak: 1, best: 1 },
        },
        exercises: {
          repouso: { completed: 2, bestMisses: 0 },
          hack: { completed: 1, bestMisses: 0 },
        },
      }),
    ).toEqual({
      ear: { interval: { correct: 3, total: 4, streak: 1, best: 2 } },
      exercises: { repouso: { completed: 2, bestMisses: 0 } },
    });
    expect(sanitizeProgress('lixo')).toEqual({ ear: {}, exercises: {} });
  });

  it('tom, acorde e instantes de sincronização', () => {
    expect(sanitizeKey({ tonic: 'F#', scale: 'dorian' })).toEqual({ tonic: 'F#', scale: 'dorian' });
    expect(sanitizeKey({ tonic: 'H', scale: 'major' })).toBeNull();
    expect(sanitizeKey({ tonic: 'C', scale: 'evil' })).toBeNull();
    expect(sanitizeChord('Am7')).toBe('Am7');
    expect(sanitizeChord('<script>')).toBeNull();
    expect(sanitizeSyncMeta({ settings: 1_790_000_000_000, progress: 'x', other: 5 })).toEqual({
      settings: 1_790_000_000_000,
    });
  });
});
