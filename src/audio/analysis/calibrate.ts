/**
 * Calibração do microfone: com o RMS do silêncio do ambiente e o RMS de alguns toques,
 * escolhe o limiar de detecção e um ganho de software. Funções puras.
 */

export interface MicCalibration {
  /** Ganho aplicado antes da análise (1 = sem ganho). */
  gain: number;
  /** RMS mínimo, já depois do ganho, para considerar que há som. */
  minRms: number;
  /** Medidas que originaram a calibração (RMS sem ganho), para mostrar ao usuário. */
  noiseRms: number;
  playRms: number;
}

/** Sem calibração: os valores de fábrica do detector. */
export const DEFAULT_CALIBRATION: MicCalibration = {
  gain: 1,
  minRms: 0.01,
  noiseRms: 0,
  playRms: 0,
};

/** Nível que o detector espera de um toque (RMS depois do ganho). */
const TARGET_PLAY_RMS = 0.08;
const MAX_GAIN = 8;
/** Limiar fica entre o ruído e o toque, em escala logarítmica, mais perto do ruído. */
const THRESHOLD_POSITION = 0.35;
const MIN_THRESHOLD = 0.003;

export type CalibrationIssue = 'too-noisy' | 'too-quiet' | null;

export function percentile(values: readonly number[], p: number): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.max(0, Math.round((p / 100) * (sorted.length - 1))));
  return sorted[idx]!;
}

export const toDb = (rms: number): number => (rms > 0 ? 20 * Math.log10(rms) : -Infinity);

/**
 * `noise`: RMS por quadro durante o silêncio. `play`: RMS por quadro enquanto toca.
 * Os dois sem ganho. O ruído usa o percentil 95 (ignora estalos isolados); o toque usa
 * o percentil 75 (os ataques, não o decaimento).
 */
export function calibrate(
  noise: readonly number[],
  play: readonly number[],
): { calibration: MicCalibration; issue: CalibrationIssue } {
  const noiseRms = Math.max(percentile(noise, 95), 1e-5);
  const playRms = percentile(play, 75);

  if (playRms < noiseRms * 2) {
    // O toque não se destaca do ruído: o microfone não consegue separar.
    return {
      calibration: { ...DEFAULT_CALIBRATION, noiseRms, playRms },
      issue: playRms < 0.002 ? 'too-quiet' : 'too-noisy',
    };
  }

  const gain = Math.min(MAX_GAIN, Math.max(1, TARGET_PLAY_RMS / playRms));
  const n = noiseRms * gain;
  const p = playRms * gain;
  const threshold = Math.exp(Math.log(n) + THRESHOLD_POSITION * (Math.log(p) - Math.log(n)));
  return {
    calibration: {
      gain: Math.round(gain * 100) / 100,
      minRms: Math.max(MIN_THRESHOLD, threshold),
      noiseRms,
      playRms,
    },
    issue: null,
  };
}
