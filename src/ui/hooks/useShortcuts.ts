import { useEffect } from 'react';
import { diatonicChords } from '@/core/harmony';
import { tNow } from '@/i18n/lang';
import { useMusicStore } from '@/store/useMusicStore';
import { toast } from '../toast';
import { useToggleJam } from './useJamSync';

/** Atalhos globais: espaço (base), P (modo prática), 1–7 (acorde do campo), ? (lista). */
export function useShortcuts(openPractice: () => void): void {
  const toggleJam = useToggleJam();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey) return;
      const el = e.target as HTMLElement;
      // Campos de texto ficam com as teclas; no foco de um botão, o espaço já o aciona.
      if (el.closest?.('input, textarea, select, [contenteditable="true"]')) return;
      if (e.key === ' ') {
        if (el.closest?.('button, a, [role="radio"], summary')) return;
        e.preventDefault();
        toggleJam();
      } else if (e.key === 'p' || e.key === 'P') openPractice();
      else if (/^[1-7]$/.test(e.key)) {
        const { key, setChord } = useMusicStore.getState();
        const chord = diatonicChords(key).filter((d) => d.numeral !== 'V7')[Number(e.key) - 1];
        if (chord) setChord(chord.symbol);
      } else if (e.key === '?')
        toast.info(
          tNow(
            'Atalhos: espaço toca/para a base · P modo prática · 1–7 acorde do campo · setas andam no braço (Enter toca, I explica).',
            'Shortcuts: space plays/stops the backing track · P practice mode · 1–7 chord in the key · arrows move on the fretboard (Enter plays, I explains).',
          ),
        );
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleJam, openPractice]);
}
