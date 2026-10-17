import { useCallback } from 'react';
import { playNote } from '@/audio/engine/sound';
import { useMusicStore } from '@/store/useMusicStore';
import { ChordStrip } from '../components/ChordStrip';
import { ChordSuggestions } from '../components/ChordSuggestions';
import { ExerciseBar } from '../components/ExerciseBar';
import { LiveFretboard } from '../components/LiveFretboard';
import { MicPanel } from '../components/MicPanel';
import { NoteSuggestions } from '../components/NoteSuggestions';

/** Módulos 1, 2 e 3: braço sugestivo, escuta e sugeridor de progressão. */
export function ExplorePage() {
  const registerNote = useMusicStore((s) => s.registerNote);
  const playMidi = useCallback(
    (midi: number) => {
      registerNote(midi);
      void playNote(midi);
    },
    [registerNote],
  );

  return (
    <div className="page page-explore">
      <ChordStrip />
      <LiveFretboard />
      <ExerciseBar />
      <div className="columns">
        <NoteSuggestions onPlayMidi={playMidi} />
        <ChordSuggestions />
      </div>
      <MicPanel />
    </div>
  );
}
