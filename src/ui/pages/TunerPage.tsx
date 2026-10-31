import { useT } from '@/i18n';
import { MicPanel } from '../components/MicPanel';

/** Página do afinador: o painel de escuta (afinador, nota e acorde) sozinho, para quem busca afinar. */
export function TunerPage() {
  const t = useT();
  return (
    <div className="page page-tuner">
      <MicPanel
        hint={t(
          'Ligue o microfone e toque uma corda solta por vez: G, C, E e A. O ponteiro mostra se a nota está alta ou baixa; afinada, ele para no centro.',
          'Turn on the microphone and play one open string at a time: G, C, E and A. The needle shows whether the note is sharp or flat; in tune, it stops in the center.',
        )}
      />
    </div>
  );
}
