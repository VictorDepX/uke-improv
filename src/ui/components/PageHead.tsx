import { useLang } from '@/i18n';
import { TABS, type TabId } from '../routes';

/** Título visível (o H1 da aba) e uma linha de apoio, nas páginas de ferramenta. */
export function PageHead({ tab, lead }: { tab: TabId; lead?: string }) {
  const lang = useLang();
  const def = TABS.find((d) => d.id === tab)!;
  return (
    <header className="page-head">
      <h1>{def.h1[lang]}</h1>
      {lead ? <p>{lead}</p> : null}
    </header>
  );
}
