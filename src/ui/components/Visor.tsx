import { classifyNote } from '@/core/classify';
import { chordToNumeral, sameChord } from '@/core/harmony';
import { chordInfo, midiName, mod12, prefersFlats, SCALES } from '@/core/music';
import { tx, useNames, useT, type Txt } from '@/i18n';
import { useDiatonicChords, useNoteContext, useVoicing } from '@/store/selectors';
import { useMusicStore } from '@/store/useMusicStore';
import { CLASS_SHORT, FUNC_LABEL } from '../format';
import { useMicControl } from '../hooks/useMicControl';
import { useKeyPicker } from '../keyPicker';

/** Nome do intervalo da nota sobre a fundamental do acorde, quando ela é do acorde. */
const CHORD_TONE: Record<number, Txt> = {
  0: tx('fundamental', 'root'),
  3: tx('3ª do acorde', '3rd of the chord'),
  4: tx('3ª do acorde', '3rd of the chord'),
  6: tx('5ª do acorde', '5th of the chord'),
  7: tx('5ª do acorde', '5th of the chord'),
  8: tx('5ª do acorde', '5th of the chord'),
  9: tx('6ª do acorde', '6th of the chord'),
  10: tx('7ª do acorde', '7th of the chord'),
  11: tx('7ª do acorde', '7th of the chord'),
};

/** Alturas das 20 barras do medidor de entrada (desenho do Figma). */
const BARS = [10, 12, 14, 16, 18, 12, 14, 16, 18, 20, 10, 12, 14, 16, 18, 12, 14, 16, 18, 20];

/** Medidor de entrada do microfone: 20 barras, acesas conforme o nível. */
export function InputMeter({ level }: { level: number }) {
  const lit = Math.round(Math.min(1, level * 8) * BARS.length);
  return (
    <span className="input-meter" aria-hidden="true">
      {BARS.map((h, i) => (
        <span key={i} style={{ height: h }} data-on={i < lit || undefined} />
      ))}
    </span>
  );
}

/**
 * Visor do topo (desktop): tom, acorde, última nota e o microfone, em leitura rápida.
 * O que está aqui não se repete em outro painel da mesma tela.
 */
export function Visor() {
  const t = useT();
  const n = useNames();
  const key = useMusicStore((s) => s.key);
  const current = useMusicStore((s) => s.currentChord);
  const lastNotes = useMusicStore((s) => s.lastNotes);
  const level = useMusicStore((s) => s.mic.level);
  const ctx = useNoteContext();
  const chords = useDiatonicChords();
  const { status, start, stop } = useMicControl();
  const keyOpen = useKeyPicker((s) => s.open);
  const toggleKey = useKeyPicker((s) => s.toggle);
  const on = status === 'on';
  const flats = prefersFlats(key);

  const capo = useMusicStore((s) => s.settings.capo);
  const voicing = useVoicing();
  const func = chords.find((c) => sameChord(c.symbol, current))?.func;
  // Com capo, o visor diz também a forma que a mão faz (D com capo 2 = forma de C).
  const shape = capo ? `${t('forma de', 'shape of')} ${n(voicing(current).shapeName)}` : null;
  const chordDetail = [chordToNumeral(current, key), func ? t(FUNC_LABEL[func]) : null, shape]
    .filter(Boolean)
    .join(' · ');

  const last = lastNotes.at(-1);
  let lastDetail = '';
  if (last !== undefined) {
    const info = chordInfo(current);
    const interval = mod12(last - info.root);
    lastDetail = info.chromas.includes(mod12(last))
      ? t(CHORD_TONE[interval] ?? CLASS_SHORT.repouso)
      : t(CLASS_SHORT[classifyNote(mod12(last), ctx)]);
  }

  return (
    <section className="visor" aria-label={t('Visor', 'Display')}>
      <button
        type="button"
        className="visor-cell visor-key"
        aria-expanded={keyOpen}
        aria-controls="key-picker"
        onClick={toggleKey}
      >
        <span className="visor-label">
          {t('Tom', 'Key')}
          <span className="key-toggle-caret" aria-hidden="true" />
        </span>
        <span className="visor-value">
          <span className="visor-big">{n(key.tonic)}</span>
          <span className="visor-detail">{t(SCALES[key.scale].label).toLowerCase()}</span>
        </span>
      </button>
      <div className="visor-cell">
        <span className="visor-label">{t('Acorde', 'Chord')}</span>
        <span className="visor-value" aria-live="polite">
          <span className="visor-big">{n(current)}</span>
          <span className="visor-detail">{chordDetail}</span>
        </span>
      </div>
      <div className="visor-cell">
        <span className="visor-label">{t('Última nota', 'Last note')}</span>
        <span className="visor-value">
          <span className="visor-big">
            {last === undefined ? '–' : n(midiName(last, flats).replace(/-?\d+$/, ''))}
          </span>
          <span className="visor-detail">{lastDetail}</span>
        </span>
      </div>
      <div className="visor-cell visor-mic">
        <span className="visor-label">{t('Microfone', 'Microphone')}</span>
        <InputMeter level={on ? level : 0} />
      </div>
      <button
        type="button"
        className="visor-status"
        data-on={on || undefined}
        aria-pressed={on}
        disabled={status === 'starting'}
        onClick={() => (on ? stop() : void start())}
      >
        <span className="visor-dot" aria-hidden="true" />
        {on
          ? t('Ouvindo', 'Listening')
          : status === 'starting'
            ? t('Abrindo…', 'Opening…')
            : t('Ligar microfone', 'Turn microphone on')}
      </button>
    </section>
  );
}
