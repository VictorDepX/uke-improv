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
  const capo = useMusicStore((s) => s.settings.capo);
  const setJamPosition = useMusicStore((s) => s.setJamPosition);
  const setChord = useMusicStore((s) => s.setChord);
  const setJamPlaying = useMusicStore((s) => s.setJamPlaying);
  const { bars, meter } = useActiveProgression();
  const latest = useLatest({ bars, meter, bpm, tuning, capo, layers });

  useEffect(() => {
    if (!playing) return;
    let cancelled = false;
    const { bars: b, meter: m, bpm: tempo, tuning: t, capo: k, layers: l } = latest.current;
    void (async () => {
      try {
        const inst = await ensureAudio();
        if (cancelled) return;
        (Object.keys(l) as (keyof typeof l)[]).forEach((layer) =>
          setLayerVolume(inst, layer, l[layer]),
        );
        await jamEngine.start({
          bars: b,
          meter: m,
          bpm: tempo,
          tuning: t,
          capo: k,
          onPosition: setJamPosition,
          onChord: setChord,
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
    if (playing) jamEngine.update({ bars, meter, tuning, capo });
  }, [playing, bars, meter, tuning, capo]);

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
