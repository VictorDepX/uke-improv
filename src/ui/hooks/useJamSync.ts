import { useCallback, useEffect } from 'react';
import { jamEngine } from '@/audio/engine/jam';
import { ensureAudio, setLayerVolume } from '@/audio/engine/sound';
import { useActiveProgression } from '@/store/selectors';
import { useMusicStore } from '@/store/useMusicStore';
import { useLatest } from './useLatest';

/**
 * Liga o motor da base ao store. Montado uma vez, na raiz do app,
 * para a base continuar tocando ao trocar de aba.
 */
export function useJamSync(): void {
  const playing = useMusicStore((s) => s.jam.playing);
  const bpm = useMusicStore((s) => s.jam.bpm);
  const layers = useMusicStore((s) => s.jam.layers);
  const tuning = useMusicStore((s) => s.settings.tuning);
  const setJamPosition = useMusicStore((s) => s.setJamPosition);
  const setChord = useMusicStore((s) => s.setChord);
  const setJamPlaying = useMusicStore((s) => s.setJamPlaying);
  const { chords } = useActiveProgression();
  const latest = useLatest({ chords, bpm, tuning, layers });

  useEffect(() => {
    if (!playing) return;
    let cancelled = false;
    const { chords: c, bpm: b, tuning: t, layers: l } = latest.current;
    void (async () => {
      try {
        const inst = await ensureAudio();
        if (cancelled) return;
        (Object.keys(l) as (keyof typeof l)[]).forEach((layer) =>
          setLayerVolume(inst, layer, l[layer]),
        );
        await jamEngine.start({
          chords: c,
          bpm: b,
          tuning: t,
          onPosition: (bar, beat) => {
            setJamPosition(bar, beat);
            const current = latest.current.chords;
            if (bar >= 0 && beat === 0 && current.length) setChord(current[bar % current.length]!);
          },
        });
      } catch {
        setJamPlaying(false);
      }
    })();
    return () => {
      cancelled = true;
      jamEngine.stop();
    };
  }, [playing, latest, setJamPosition, setChord, setJamPlaying]);

  useEffect(() => {
    if (playing) jamEngine.setBpm(bpm);
  }, [playing, bpm]);

  useEffect(() => {
    if (playing) jamEngine.updateChords(chords, tuning);
  }, [playing, chords, tuning]);

  useEffect(() => {
    if (!playing) return;
    void ensureAudio().then((inst) =>
      (Object.keys(layers) as (keyof typeof layers)[]).forEach((l) =>
        setLayerVolume(inst, l, layers[l]),
      ),
    );
  }, [playing, layers]);
}

/** Alterna a base. Liga o áudio dentro do gesto do usuário antes de mudar o estado. */
export function useToggleJam(): () => void {
  const setJamPlaying = useMusicStore((s) => s.setJamPlaying);
  return useCallback(() => {
    const { playing } = useMusicStore.getState().jam;
    if (!playing) void ensureAudio().catch(() => undefined);
    setJamPlaying(!playing);
  }, [setJamPlaying]);
}
