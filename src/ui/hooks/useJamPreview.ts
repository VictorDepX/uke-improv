import { useActiveProgression } from '@/store/selectors';
import { useMusicStore } from '@/store/useMusicStore';

/**
 * Acorde a destacar como "próximo" no braço: durante a contagem e no 4º tempo
 * de cada compasso, enquanto a base toca. Fora disso, null.
 */
export function useJamPreview(): { next: string | null; preview: string | null } {
  const { chords } = useActiveProgression();
  const playing = useMusicStore((s) => s.jam.playing);
  const bar = useMusicStore((s) => s.jam.bar);
  const beat = useMusicStore((s) => s.jam.beat);
  if (!playing || chords.length === 0) return { next: null, preview: null };
  const counting = bar < 0;
  const next = chords[counting ? 0 : (bar + 1) % chords.length] ?? null;
  return { next, preview: counting || beat === 3 ? next : null };
}
