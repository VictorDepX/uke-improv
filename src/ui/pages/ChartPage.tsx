import { useT } from '@/i18n';
import { Panel } from '../components/controls';
import { ChartAnalyzer } from '../components/jam/ChartAnalyzer';

/** Página do analisador de cifra, para quem busca descobrir o tom de uma música. */
export function ChartPage() {
  const t = useT();
  return (
    <div className="page page-chart">
      <Panel title={t('Cole a cifra', 'Paste the chord chart')}>
        <ChartAnalyzer />
      </Panel>
    </div>
  );
}
