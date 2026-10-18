import { useMusicStore } from '@/store/useMusicStore';
import { Panel } from '../components/controls';
import { JamTransport } from '../components/jam/JamTransport';
import { LayerMixer } from '../components/jam/LayerMixer';
import { ProgressionEditor } from '../components/jam/ProgressionEditor';
import { ProgressionPicker } from '../components/jam/ProgressionPicker';
import { StylePicker } from '../components/jam/StylePicker';
import { ChartAnalyzer } from '../components/jam/ChartAnalyzer';
import { LiveFretboard } from '../components/LiveFretboard';
import { NoteSuggestions } from '../components/NoteSuggestions';
import { playNote } from '@/audio/engine/sound';
import { useJamPreview } from '../hooks/useJamPreview';
import { PresetBar } from '../components/PresetBar';
import { ExerciseBar } from '../components/ExerciseBar';

/** Módulo 4: base em loop; o braço acompanha o acorde e avisa o próximo antes de cada troca. */
export function JamPage() {
  const registerNote = useMusicStore((s) => s.registerNote);
  const { previewChord } = useJamPreview();

  return (
    <div className="page page-jam">
      <PresetBar />
      <JamTransport />
      <LiveFretboard previewChord={previewChord} />
      <ExerciseBar />
      <p className="hint small muted">
        No último tempo antes de cada troca, as notas do próximo acorde ganham contorno; contorno
        duplo marca as notas que servem nos dois.
      </p>
      <div className="columns">
        <Panel title="Progressão">
          <StylePicker />
          <ProgressionPicker />
        </Panel>
        <NoteSuggestions
          onPlayMidi={(m) => {
            registerNote(m);
            void playNote(m);
          }}
        />
      </div>
      <div className="columns">
        <Panel title="Montar progressão">
          <ProgressionEditor />
        </Panel>
        <Panel title="Analisar cifra">
          <ChartAnalyzer />
        </Panel>
      </div>
      <div className="columns">
        <Panel title="Mixer">
          <LayerMixer />
        </Panel>
      </div>
    </div>
  );
}
