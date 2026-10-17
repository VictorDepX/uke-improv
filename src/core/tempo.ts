/** Pausa maior que isso entre toques começa uma contagem nova. */
export const TAP_RESET_MS = 2000;

/** Quantos toques recentes entram no cálculo. */
export const TAP_WINDOW = 6;

/** Acrescenta um toque, recomeçando a contagem depois de uma pausa longa. */
export function pushTap(taps: readonly number[], now: number): number[] {
  const last = taps.at(-1);
  if (last === undefined || now - last > TAP_RESET_MS || now <= last) return [now];
  return [...taps, now].slice(-TAP_WINDOW);
}

/**
 * BPM pela mediana dos intervalos entre toques (resiste a um toque atrasado).
 * Precisa de pelo menos 2 toques.
 */
export function bpmFromTaps(taps: readonly number[]): number | null {
  if (taps.length < 2) return null;
  const intervals = taps.slice(1).map((t, i) => t - taps[i]!);
  const sorted = [...intervals].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median = sorted.length % 2 ? sorted[mid]! : (sorted[mid - 1]! + sorted[mid]!) / 2;
  return median > 0 ? Math.round(60000 / median) : null;
}
