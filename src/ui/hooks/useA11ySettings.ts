import { useEffect } from 'react';
import { useMusicStore } from '@/store/useMusicStore';

/** Tema, contraste e paleta dos Ajustes viram atributos do <html>, que o CSS lê. */
export function useA11ySettings(): void {
  const theme = useMusicStore((s) => s.settings.theme);
  const highContrast = useMusicStore((s) => s.settings.highContrast);
  const colorblind = useMusicStore((s) => s.settings.colorblind);
  useEffect(() => {
    const d = document.documentElement.dataset;
    if (theme === 'auto') delete d.theme;
    else d.theme = theme;
    if (highContrast) d.contrast = 'more';
    else delete d.contrast;
    if (colorblind) d.palette = 'colorblind';
    else delete d.palette;
  }, [theme, highContrast, colorblind]);

  // Pulso: a cada tempo da base, vibra (onde houver) e pisca a borda da tela.
  useEffect(
    () =>
      useMusicStore.subscribe((s, prev) => {
        const { jam } = s;
        if (!s.settings.pulse || !jam.playing || !jam.ready) return;
        if (jam.beat === prev.jam.beat && jam.bar === prev.jam.bar) return;
        const accent = jam.beat === 0;
        navigator.vibrate?.(accent ? 40 : 15);
        const el = document.getElementById('pulse');
        if (!el) return;
        el.dataset.accent = String(accent);
        el.classList.remove('on');
        void el.offsetWidth; // reinicia a animação
        el.classList.add('on');
      }),
    [],
  );
}
