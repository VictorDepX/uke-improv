/** WAV PCM 16 bits a partir de canais em float (−1 a 1), intercalados. */
export function encodeWav(channels: readonly Float32Array[], sampleRate: number): Blob {
  const n = channels[0]?.length ?? 0;
  const ch = channels.length;
  const data = n * ch * 2;
  const view = new DataView(new ArrayBuffer(44 + data));
  const str = (o: number, s: string) =>
    [...s].forEach((c, i) => view.setUint8(o + i, c.charCodeAt(0)));
  str(0, 'RIFF');
  view.setUint32(4, 36 + data, true);
  str(8, 'WAVE');
  str(12, 'fmt ');
  view.setUint32(16, 16, true); // tamanho do bloco fmt
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, ch, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * ch * 2, true);
  view.setUint16(32, ch * 2, true);
  view.setUint16(34, 16, true);
  str(36, 'data');
  view.setUint32(40, data, true);
  let o = 44;
  for (let i = 0; i < n; i++)
    for (let c = 0; c < ch; c++) {
      const v = Math.max(-1, Math.min(1, channels[c]![i]!));
      view.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true);
      o += 2;
    }
  return new Blob([view], { type: 'audio/wav' });
}

/** Converte uma gravação do navegador (webm, m4a, ogg) em WAV. */
export async function blobToWav(blob: Blob): Promise<Blob> {
  const ctx = new OfflineAudioContext(1, 1, 44100);
  const buf = await ctx.decodeAudioData(await blob.arrayBuffer());
  const channels = Array.from({ length: buf.numberOfChannels }, (_, i) => buf.getChannelData(i));
  return encodeWav(channels, buf.sampleRate);
}
