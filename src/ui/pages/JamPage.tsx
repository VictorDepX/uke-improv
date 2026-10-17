import { useActiveProgression } from '@/store/selectors';
import { useMusicStore } from '@/store/useMusicStore';
import { Panel } from '../components/controls';
import { JamTransport } from '../components/jam/JamTransport';
import { LayerMixer } from '../components/jam/LayerMixer';
import { ProgressionEditor } from '../components/jam/ProgressionEditor';
import { ProgressionPicker } from '../components/jam/ProgressionPicker';
import { LiveFretboard } from '../components/LiveFretboard';
import { NoteSuggestions } from '../components/NoteSuggestions';
import { playNote } from '@/audio/engine/sound';
import { useJamPreview } from '../hooks/useJamPreview';
import { PresetBar } from '../components/PresetBar';

/** Módulo 4: base em loop; o braço acompanha o acorde e avisa o próximo no 4º tempo. */
export function JamPage() {
  const { chords } = useActiveProgression();
  const registerNote = useMusicStore((s) => s.registerNote);
  const { preview } = useJamPreview();

  return (
    <div className="page page-jam">
      <PresetBar />
      <JamTransport chords={chords} />
      <LiveFretboard previewChord={preview} />
      <p className="hint small muted">
        No 4º tempo, as notas do próximo acorde ganham contorno; contorno duplo marca as notas que
        servem nos dois.
      </p>
      <div className="columns">
        <Panel title="Progressão">
          <ProgressionPicker chords={chords} />
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
        <Panel title="Mixer">
          <LayerMixer />
        </Panel>
      </div>
    </div>
  );
}
