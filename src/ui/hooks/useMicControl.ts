import { useCallback, useEffect } from 'react';
import { MicError, micInput } from '@/audio/engine/mic';
import { diatonicChords } from '@/core/harmony';
import { useMusicStore } from '@/store/useMusicStore';

/** Liga e desliga o microfone, publicando notas e acordes detectados no store. */
export function useMicControl() {
  const status = useMusicStore((s) => s.mic.status);
  const setMic = useMusicStore((s) => s.setMic);

  const stop = useCallback(() => {
    micInput.stop();
    setMic({ status: 'off', note: null, chord: null, level: 0 });
  }, [setMic]);

  const start = useCallback(async () => {
    setMic({ status: 'starting', error: null });
    try {
      await micInput.start(
        () => diatonicChords(useMusicStore.getState().key).map((d) => d.symbol),
        {
          onNote: (midi, cents) => {
            const s = useMusicStore.getState();
            s.registerNote(midi);
            s.setMic({ note: { midi, cents } });
          },
          onNoteOff: () => useMusicStore.getState().setMic({ note: null }),
          onChord: (match) => {
            const s = useMusicStore.getState();
            s.setMic({ chord: match });
            if (s.mic.followChords && !s.jam.playing) s.setChord(match.symbol);
          },
          onLevel: (level, tuning) => {
            const s = useMusicStore.getState();
            s.setMic({ level, note: tuning ?? s.mic.note });
          },
        },
      );
      setMic({ status: 'on' });
    } catch (err) {
      const denied = err instanceof MicError && err.kind !== 'other';
      setMic({
        status: denied ? 'denied' : 'error',
        error: err instanceof Error ? err.message : 'Erro desconhecido no microfone.',
      });
    }
  }, [setMic]);

  useEffect(() => () => micInput.stop(), []);

  return { status, start, stop };
}
