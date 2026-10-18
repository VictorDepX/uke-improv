import { upcoming, type Upcoming } from '@/core/rhythm';
import { useActiveProgression } from '@/store/selectors';
import { useMusicStore } from '@/store/useMusicStore';

/**
 * Acorde atual e próximo da base. `preview` é o próximo enquanto é hora de antecipá-lo
 * (contagem e último tempo antes da troca); fora disso, null. Com a base parada, tudo null.
 */
export function useJamPreview(): Upcoming & { previewChord: string | null } {
  const { timeline, meter } = useActiveProgression();
  const playing = useMusicStore((s) => s.jam.playing);
  const bar = useMusicStore((s) => s.jam.bar);
  const beat = useMusicStore((s) => s.jam.beat);
  if (!playing || timeline.length === 0)
    return { current: null, next: null, preview: false, previewChord: null };
  const u = upcoming(timeline, meter, bar, beat);
  return { ...u, previewChord: u.preview ? u.next : null };
}
