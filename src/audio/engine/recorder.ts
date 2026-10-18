/** Formatos tentados em ordem: Chrome/Firefox gravam webm/opus; Safari, mp4. */
const MIME_CANDIDATES = [
  'audio/webm;codecs=opus',
  'audio/webm',
  'audio/mp4',
  'audio/ogg;codecs=opus',
];

export function pickMimeType(
  isSupported: (t: string) => boolean = (t) =>
    typeof MediaRecorder !== 'undefined' && MediaRecorder.isTypeSupported(t),
): string | undefined {
  return MIME_CANDIDATES.find(isSupported);
}

export const canRecord = (): boolean =>
  typeof window !== 'undefined' && typeof window.MediaRecorder !== 'undefined';

/** Grava o microfone em memória; `stop` devolve o áudio. */
export class TakeRecorder {
  private rec: MediaRecorder | null = null;
  private chunks: Blob[] = [];

  get recording(): boolean {
    return this.rec?.state === 'recording';
  }

  start(stream: MediaStream): void {
    if (this.recording) return;
    const mimeType = pickMimeType();
    this.chunks = [];
    this.rec = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    this.rec.ondataavailable = (e) => {
      if (e.data.size) this.chunks.push(e.data);
    };
    this.rec.start(250);
  }

  stop(): Promise<Blob> {
    const rec = this.rec;
    if (!rec) return Promise.reject(new Error('Nada gravando.'));
    return new Promise((resolve) => {
      rec.onstop = () => {
        resolve(new Blob(this.chunks, { type: rec.mimeType || 'audio/webm' }));
        this.chunks = [];
      };
      rec.stop();
      this.rec = null;
    });
  }
}
