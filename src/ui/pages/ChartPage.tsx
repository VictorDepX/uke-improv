import { useT } from '@/i18n';
import { ChartAnalyzer } from '../components/jam/ChartAnalyzer';
import { PageHead } from '../components/PageHead';

/** Página do analisador de cifra, para quem busca descobrir o tom de uma música. */
export function ChartPage() {
  const t = useT();
  return (
    <div className="page page-chart">
      <PageHead
        tab="cifra"
        lead={t(
          'Cole a cifra com ou sem letra. Acordes com baixo (D/F#) e sétimas são reconhecidos.',
          'Paste the chart with or without lyrics. Slash chords (D/F#) and sevenths are recognized.',
        )}
      />
      <ChartAnalyzer />
    </div>
  );
}
