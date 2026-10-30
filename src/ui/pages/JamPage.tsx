import { useMusicStore } from '@/store/useMusicStore';
import { Panel } from '../components/controls';
import { JamTransport } from '../components/jam/JamTransport';
import { LayerMixer } from '../components/jam/LayerMixer';
import { ProgressionEditor } from '../components/jam/ProgressionEditor';
import { ProgressionPicker } from '../components/jam/ProgressionPicker';
import { StylePicker } from '../components/jam/StylePicker';
import { ChartAnalyzer } from '../components/jam/ChartAnalyzer';
import { LooperPanel } from '../components/jam/LooperPanel';
import { LiveFretboard } from '../components/LiveFretboard';
import { NoteSuggestions } from '../components/NoteSuggestions';
import { playNote } from '@/audio/engine/sound';
import { useJamPreview } from '../hooks/useJamPreview';
import { PresetBar } from '../components/PresetBar';
import { ExerciseBar } from '../components/ExerciseBar';
import { useT } from '@/i18n';

/** Módulo 4: base em loop; o braço acompanha o acorde e avisa o próximo antes de cada troca. */
export function JamPage() {
  const t = useT();
  const registerNote = useMusicStore((s) => s.registerNote);
  const { previewChord } = useJamPreview();

  return (
    <div className="page page-jam">
      <PresetBar />
      <JamTransport />
      <LiveFretboard previewChord={previewChord} />
      <ExerciseBar />
      <p className="hint small muted">
        {t(
          'No último tempo antes de cada troca, as notas do próximo acorde ganham contorno; contorno duplo marca as notas que servem nos dois.',
          'On the last beat before each change, the next chord’s notes get an outline; a double outline marks notes that fit both.',
        )}
      </p>
      <div className="columns">
        <Panel title={t('Progressão', 'Progression')}>
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
        <Panel title={t('Montar progressão', 'Build a progression')}>
          <ProgressionEditor />
        </Panel>
        <Panel title={t('Analisar cifra', 'Analyze a chord chart')}>
          <ChartAnalyzer />
        </Panel>
      </div>
      <div className="columns">
        <Panel title="Looper">
          <LooperPanel />
        </Panel>
        <Panel title="Mixer">
          <LayerMixer />
        </Panel>
      </div>
    </div>
  );
}
