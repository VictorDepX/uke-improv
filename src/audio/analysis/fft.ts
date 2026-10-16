/**
 * FFT radix-2 iterativa. O app usa o AnalyserNode do navegador; esta implementação existe
 * para analisar áudio fora do Web Audio (testes com sinais sintetizados, análise offline).
 */
export function magnitudeSpectrum(frame: Float32Array): Float32Array {
  const n = frame.length;
  if ((n & (n - 1)) !== 0) throw new Error('O tamanho do quadro deve ser potência de 2');
  const re = new Float64Array(n);
  const im = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const hann = 0.5 - 0.5 * Math.cos((2 * Math.PI * i) / (n - 1));
    re[i] = frame[i]! * hann;
  }
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j]!, re[i]!];
      [im[i], im[j]] = [im[j]!, im[i]!];
    }
  }
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1;
      let ci = 0;
      for (let k = 0; k < len / 2; k++) {
        const ar = re[i + k]!;
        const ai = im[i + k]!;
        const br = re[i + k + len / 2]! * cr - im[i + k + len / 2]! * ci;
        const bi = re[i + k + len / 2]! * ci + im[i + k + len / 2]! * cr;
        re[i + k] = ar + br;
        im[i + k] = ai + bi;
        re[i + k + len / 2] = ar - br;
        im[i + k + len / 2] = ai - bi;
        const t = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = t;
      }
    }
  }
  const out = new Float32Array(n / 2);
  for (let k = 0; k < n / 2; k++) out[k] = Math.hypot(re[k]!, im[k]!) / n;
  return out;
}
