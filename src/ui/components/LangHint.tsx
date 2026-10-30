import { useSyncExternalStore } from 'react';
import { HTML_LANG, type Lang } from '@/i18n';
import { useMusicStore } from '@/store/useMusicStore';

/** Idioma do navegador, entre os do app; null se não for nenhum dos dois. */
function browserLang(): Lang | null {
  for (const l of navigator.languages ?? [navigator.language]) {
    const base = l.toLowerCase().slice(0, 2);
    if (base === 'pt') return 'pt';
    if (base === 'en') return 'en';
  }
  return null;
}

const noop = () => () => undefined;

const TEXT: Record<Lang, { body: string; go: string; stay: string }> = {
  en: {
    body: 'Uke Improv is also available in English.',
    go: 'Switch to English',
    stay: 'Dismiss',
  },
  pt: {
    body: 'O Uke Improv também está em português.',
    go: 'Mudar para português',
    stay: 'Fechar',
  },
};

/**
 * Quem chega com o navegador em outro idioma vê uma faixa oferecendo trocar. Não redireciona
 * sozinho: o buscador e quem abriu o link de propósito ficam na página que pediram. Fechar a
 * faixa conta como escolha, e ela não volta.
 */
export function LangHint({ lang, onSwitch }: { lang: Lang; onSwitch: (l: Lang) => void }) {
  const chosen = useMusicStore((s) => s.settings.lang);
  const updateSettings = useMusicStore((s) => s.updateSettings);
  // Só no navegador: o HTML pré-renderizado não sabe o idioma de quem abre.
  const browser = useSyncExternalStore(noop, browserLang, () => undefined);
  // Navegador em outro idioma (nem pt nem en): o inglês serve mais que o português.
  const want = browser === undefined ? null : (browser ?? 'en');
  const suggest = want && want !== lang ? want : null;

  if (chosen || !suggest) return null;
  const text = TEXT[suggest];
  return (
    <div className="lang-hint" role="region" aria-label={text.body} lang={HTML_LANG[suggest]}>
      <p>{text.body}</p>
      <button type="button" className="button button-primary" onClick={() => onSwitch(suggest)}>
        {text.go}
      </button>
      <button
        type="button"
        className="button button-ghost"
        onClick={() => updateSettings({ lang })}
      >
        {text.stay}
      </button>
    </div>
  );
}
