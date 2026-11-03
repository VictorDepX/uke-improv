import { JamTransport } from '../components/jam/JamTransport';
import { LayerMixer } from '../components/jam/LayerMixer';
import { ProgressionEditor } from '../components/jam/ProgressionEditor';
import { ProgressionList, ProgressionPanel } from '../components/jam/ProgressionPicker';
import { LooperPanel } from '../components/jam/LooperPanel';
import { LiveFretboard } from '../components/LiveFretboard';
import { useJamPreview } from '../hooks/useJamPreview';
import { PresetBar } from '../components/PresetBar';
import { useT } from '@/i18n';

/**
 * Jam: bases prontas, transporte, o braço que acompanha a troca de acorde, a progressão e a
 * montagem de uma própria; na lateral, a lista de progressões, o mixer e o looper.
 */
export function JamPage() {
  const t = useT();
  const { previewChord } = useJamPreview();

  return (
    <div className="page page-jam">
      <div className="jam-main">
        <PresetBar />
        <JamTransport />
        <div className="board-panel">
          <LiveFretboard previewChord={previewChord} legend={false} />
          <p className="board-hint">
            {t(
              'No último tempo antes de cada troca, as notas do próximo acorde ganham contorno. Mire nelas e a troca soa resolvida.',
              'On the last beat before each change, the next chord’s notes get an outline. Aim for them and the change sounds resolved.',
            )}
          </p>
        </div>
        <ProgressionPanel />
        <ProgressionEditor />
      </div>
      <aside className="jam-side">
        <ProgressionList />
        <LayerMixer />
        <LooperPanel />
      </aside>
    </div>
  );
}
