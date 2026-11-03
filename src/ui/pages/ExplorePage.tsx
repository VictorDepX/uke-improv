import { useCallback } from 'react';
import { playNote } from '@/audio/engine/sound';
import { useMusicStore } from '@/store/useMusicStore';
import { ChordStrip } from '../components/ChordStrip';
import { ChordSuggestions } from '../components/ChordSuggestions';
import { ExerciseBar } from '../components/ExerciseBar';
import { KeyPicker } from '../components/KeyPicker';
import { ListenBar } from '../components/ListenBar';
import { LiveFretboard } from '../components/LiveFretboard';
import { NoteSuggestions } from '../components/NoteSuggestions';
import { Visor } from '../components/Visor';

/**
 * Explorar: visor, tom, acordes do tom, braço, saídas da última nota, modo e escuta; na lateral,
 * o próximo acorde. No celular a coluna principal se desfaz e as peças seguem a ordem do toque.
 */
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
      <div className="explore-main">
        <Visor />
        <div id="key-picker" className="key-picker-slot">
          <KeyPicker />
        </div>
        <ChordStrip />
        <div className="board-panel">
          <LiveFretboard />
        </div>
        <NoteSuggestions onPlayMidi={playMidi} />
        <ExerciseBar />
        <ListenBar />
      </div>
      <aside className="explore-side">
        <ChordSuggestions />
      </aside>
    </div>
  );
}
