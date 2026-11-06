import { HTML_LANG, type Lang } from '@/i18n';
import { useMusicStore } from '@/store/useMusicStore';
import { useLangSuggestion } from '../hooks/useLangSuggestion';

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

/** Oferta de idioma dentro das boas-vindas: uma linha, sem competir com "Começar". */
export function WelcomeLang({ lang, onSwitch }: { lang: Lang; onSwitch: (l: Lang) => void }) {
  const suggest = useLangSuggestion(lang);
  if (!suggest) return null;
  const text = TEXT[suggest];
  return (
    <p className="welcome-lang" lang={HTML_LANG[suggest]}>
      {text.body}{' '}
      <button type="button" className="link-button" onClick={() => onSwitch(suggest)}>
        {text.go}
      </button>
    </p>
  );
}

/**
 * Quem chega com o navegador em outro idioma vê a oferta nas boas-vindas; esta faixa só
 * aparece depois delas, para quem ainda não escolheu. Não redireciona sozinho: o buscador e
 * quem abriu o link de propósito ficam na página que pediram. Fechar a faixa conta como
 * escolha, e ela não volta.
 */
export function LangHint({ lang, onSwitch }: { lang: Lang; onSwitch: (l: Lang) => void }) {
  const onboarded = useMusicStore((s) => s.settings.onboarded);
  const updateSettings = useMusicStore((s) => s.updateSettings);
  const suggest = useLangSuggestion(lang);

  if (!onboarded || !suggest) return null;
  const text = TEXT[suggest];
  return (
    <div className="lang-hint" role="region" aria-label={text.body} lang={HTML_LANG[suggest]}>
      <p>{text.body}</p>
      <button type="button" className="button" onClick={() => onSwitch(suggest)}>
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
