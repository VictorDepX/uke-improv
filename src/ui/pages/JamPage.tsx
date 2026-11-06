import { JamTransport } from '../components/jam/JamTransport';
import { LayerMixer } from '../components/jam/LayerMixer';
import { ProgressionEditor } from '../components/jam/ProgressionEditor';
import { ProgressionList, ProgressionPanel } from '../components/jam/ProgressionPicker';
import { LooperPanel } from '../components/jam/LooperPanel';
import { LiveFretboard } from '../components/LiveFretboard';
import { useJamPreview } from '../hooks/useJamPreview';
import { PresetBar } from '../components/PresetBar';
import { useState } from 'react';
import { useT } from '@/i18n';
import { Icon } from '../components/Icon';

/**
 * Jam: bases prontas, transporte, o braço que acompanha a troca de acorde e a progressão; montar
 * uma própria abre sob demanda. Na lateral, a lista de progressões; mixer e looper recolhidos.
 */
export function JamPage() {
  const t = useT();
  const { previewChord } = useJamPreview();
  // O montador fica recolhido: o caminho principal é escolher uma base e tocar.
  const [building, setBuilding] = useState(false);

  return (
    <div className="page page-jam">
      <div className="jam-main">
        <PresetBar />
        <JamTransport />
        <div className="board-panel">
          <LiveFretboard previewChord={previewChord} legend="compact" />
          <p className="board-hint">
            {t(
              'No último tempo antes de cada troca, as notas do próximo acorde ganham contorno. Mire nelas e a troca soa resolvida.',
              'On the last beat before each change, the next chord’s notes get an outline. Aim for them and the change sounds resolved.',
            )}
          </p>
        </div>
        <ProgressionPanel />
        <div>
          <button
            type="button"
            className="button button-ghost jam-build-toggle"
            aria-expanded={building}
            aria-controls="jam-editor"
            onClick={() => setBuilding((b) => !b)}
          >
            <Icon name={building ? 'close' : 'plus'} />
            {building
              ? t('Fechar o montador', 'Close the builder')
              : t('Montar a sua progressão', 'Build your own progression')}
          </button>
        </div>
        {/* Escondido, não desmontado: o rascunho continua lá quando o montador reabre. */}
        <div id="jam-editor" hidden={!building}>
          <ProgressionEditor />
        </div>
      </div>
      <aside className="jam-side">
        <ProgressionList />
        <details className="side-details">
          <summary>
            {t('Mixer', 'Mixer')}
            <Icon name="chevron" />
          </summary>
          <LayerMixer />
        </details>
        <details className="side-details">
          <summary>
            Looper
            <Icon name="chevron" />
          </summary>
          <LooperPanel />
        </details>
      </aside>
    </div>
  );
}
