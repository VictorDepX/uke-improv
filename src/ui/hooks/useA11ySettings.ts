import { useEffect } from 'react';
import { useMusicStore } from '@/store/useMusicStore';

/** Cor da barra de status por tema; igual ao fundo da barra do topo (--bg). */
const THEME_COLOR = { light: '#eeebe4', dark: '#16181a' } as const;

/**
 * Tema escolhido à mão nos Ajustes: as duas metas theme-color passam a usar a cor dele, senão
 * o celular em modo escuro pintaria a barra de status escura sobre o app claro (e vice-versa).
 */
function syncThemeColor(theme: 'auto' | 'light' | 'dark'): void {
  for (const meta of document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]')) {
    const scheme = meta.media.includes('dark') ? 'dark' : 'light';
    meta.content = THEME_COLOR[theme === 'auto' ? scheme : theme];
  }
}

/** Tema, contraste e paleta dos Ajustes viram atributos do <html>, que o CSS lê. */
export function useA11ySettings(): void {
  const theme = useMusicStore((s) => s.settings.theme);
  const highContrast = useMusicStore((s) => s.settings.highContrast);
  const colorblind = useMusicStore((s) => s.settings.colorblind);
  const leftHanded = useMusicStore((s) => s.settings.leftHanded);
  useEffect(() => {
    const d = document.documentElement.dataset;
    if (theme === 'auto') delete d.theme;
    else d.theme = theme;
    if (highContrast) d.contrast = 'more';
    else delete d.contrast;
    if (colorblind) d.palette = 'colorblind';
    else delete d.palette;
    if (leftHanded) d.hand = 'left';
    else delete d.hand;
    syncThemeColor(theme);
  }, [theme, highContrast, colorblind, leftHanded]);

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
        // Web Animations: recomeça a cada tempo sem forçar recálculo de layout (o antigo
        // remove/offsetWidth/add) e a opacidade roda fora da thread principal.
        const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        el.getAnimations?.().forEach((a) => a.cancel());
        el.animate?.([{ opacity: 0.9 }, { opacity: 0 }], {
          duration: reduce ? 400 : 180,
          easing: 'ease-out',
        });
      }),
    [],
  );
}
