import { useCallback } from 'react';
import { playNote } from '@/audio/engine/sound';
import { useMusicStore } from '@/store/useMusicStore';
import { ChordStrip } from '../components/ChordStrip';
import { ChordSuggestions } from '../components/ChordSuggestions';
import { KeyPicker } from '../components/KeyPicker';
import { ListenBar } from '../components/ListenBar';
import { LiveFretboard } from '../components/LiveFretboard';
import { NoteSuggestions } from '../components/NoteSuggestions';
import { Visor } from '../components/Visor';
import { ExitsBar } from '../components/ExitsBar';
import { useLandscapePhone } from '../hooks/useMediaQuery';

/**
 * Explorar: visor, tom, acordes do tom, braço, saídas da última nota e escuta; na lateral,
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
  // Deitado, os acordes do tom vão para a barra do topo (App) e o resumo das saídas fica sob o braço.
  const landscape = useLandscapePhone();

  return (
    <div className="page page-explore">
      <div className="explore-main">
        <Visor />
        <div id="key-picker" className="key-picker-slot">
          <KeyPicker />
        </div>
        {landscape ? null : <ChordStrip />}
        <div className="board-panel">
          <LiveFretboard legend={!landscape} />
          {landscape ? <ExitsBar /> : null}
        </div>
        <NoteSuggestions onPlayMidi={playMidi} />
        <ListenBar />
      </div>
      <aside className="explore-side">
        <ChordSuggestions />
      </aside>
    </div>
  );
}
