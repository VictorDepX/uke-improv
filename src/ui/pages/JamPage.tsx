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

/** Módulo 4: base em loop; o braço acompanha o acorde e avisa o próximo no 4º tempo. */
export function JamPage() {
  const { chords } = useActiveProgression();
  const { playing, bar, beat } = useMusicStore((s) => s.jam);
  const registerNote = useMusicStore((s) => s.registerNote);

  const counting = playing && bar < 0;
  const warn = playing && (counting || beat === 3);
  const nextIdx = counting ? 0 : (Math.max(bar, 0) + 1) % chords.length;
  const preview = warn ? (chords[nextIdx] ?? null) : null;

  return (
    <div className="page page-jam">
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
