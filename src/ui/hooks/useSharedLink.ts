import { useEffect } from 'react';
import { meterOf } from '@/core/progressions';
import { decodeShare } from '@/core/share';
import { tNow } from '@/i18n/lang';
import { useMusicStore } from '@/store/useMusicStore';
import { toast } from '../toast';

/** Abre um link de progressão (?s=…): tom, progressão, andamento e estilo de quem compartilhou. */
export function useSharedLink(): void {
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const code = params.get('s');
    if (!code) return;
    params.delete('s');
    const rest = params.toString();
    history.replaceState(null, '', `${location.pathname}${rest ? `?${rest}` : ''}${location.hash}`);

    const shared = decodeShare(code, `custom-${Date.now().toString(36)}`);
    if (!shared) {
      toast.error(tNow('Link de progressão inválido.', 'Invalid progression link.'));
      return;
    }
    const s = useMusicStore.getState();
    const p = shared.progression;
    // Abrir o mesmo link duas vezes não duplica a progressão.
    const same = s.customProgressions.find(
      (c) =>
        c.mode === p.mode &&
        meterOf(c) === meterOf(p) &&
        c.numerals.join('|') === p.numerals.join('|'),
    );
    s.setTonic(shared.key.tonic);
    s.setScale(shared.key.scale);
    if (same) s.selectProgression(same.id);
    else s.addCustomProgression(p);
    s.setBpm(shared.bpm);
    s.setGroove(shared.grooveId);
    const name = typeof p.name === 'string' ? p.name : p.name.pt;
    toast.success(tNow(`Progressão “${name}” carregada.`, `Progression “${name}” loaded.`));
  }, []);
}
