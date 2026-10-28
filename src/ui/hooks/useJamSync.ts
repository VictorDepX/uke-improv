import { toast } from '../toast';
import { useCallback, useEffect } from 'react';
import { jamEngine } from '@/audio/engine/jam';
import { looper } from '@/audio/looper/looper';
import { resolveGroove } from '@/core/grooves';
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
  const grooveId = useMusicStore((s) => s.jam.grooveId);
  const groove = resolveGroove(grooveId, meter);
  const latest = useLatest({ bars, meter, groove, bpm, tuning, capo, layers });

  useEffect(() => {
    if (!playing) return;
    let cancelled = false;
    const {
      bars: b,
      meter: m,
      groove: g,
      bpm: tempo,
      tuning: t,
      capo: k,
      layers: l,
    } = latest.current;
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
          groove: g,
          bpm: tempo,
          tuning: t,
          capo: k,
          onPosition: setJamPosition,
          onChord: setChord,
        });
      } catch {
        setJamPlaying(false);
        toast.error(
          'Não consegui ligar o som. Toque no play de novo; se continuar, recarregue a página.',
        );
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
    if (playing) jamEngine.update({ bars, meter, groove, tuning, capo });
  }, [playing, bars, meter, groove, tuning, capo]);

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
    // Base e looper dividem o relógio (Transport): ligar a base encerra o looper.
    if (!playing && looper.active) looper.clear();
    if (!playing) void ensureAudio().catch(() => undefined);
    setJamPlaying(!playing);
  }, [setJamPlaying]);
}
