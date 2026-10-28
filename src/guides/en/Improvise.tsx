import { GuideBoard } from '../GuideBoard';

export function ImproviseEn() {
  return (
    <>
      <p className="guide-lead">
        Improvising means choosing, on the spot, notes that fit the chord that is sounding. You
        don&apos;t need much theory: with six ideas and a backing track to play along with, you can
        make phrases that sound good from day one.
      </p>

      <h2>1. Know which chords live in the key</h2>
      <p>
        Every key has a family of chords that sound good together. In C major they are{' '}
        <strong>C, Dm, Em, F, G, Am and Bdim</strong>. Most pop songs loop four of them, such as{' '}
        <strong>C – G – Am – F</strong>. Knowing the key tells you which notes you have at hand: the
        seven notes of the C major scale (C, D, E, F, G, A, B).
      </p>

      <h2>2. Aim for the chord tones</h2>
      <p>
        The notes that make up the current chord are your safe harbor. Over C, they are{' '}
        <strong>C, E and G</strong>. Starting and ending phrases on them, especially on the first
        beat of the bar, makes any phrase sound resolved.
      </p>
      <GuideBoard
        keyContext={{ tonic: 'C', scale: 'major' }}
        chord="C"
        caption="C major over the C chord. Green circles: chord tones (rest). Yellow squares: the other scale notes (passing). Orange diamonds: notes that want to resolve (tension)."
      />

      <h2>3. Use the scale to walk between them</h2>
      <p>
        Between one chord tone and the next, the scale notes are the path. The simplest way is to
        move by <strong>neighboring steps</strong>: from E to F to G, without jumping. Phrases like
        this sound singable, because that is how the voice moves.
      </p>

      <h2>4. Build tension and resolve it</h2>
      <p>
        Some scale notes, played over a given chord, leave the phrase hanging. That is not a
        mistake: it is tension, and the ear expects it to resolve a half step or a whole step away.
        The classic example is <strong>G7 to C</strong>: the note B (from G7) rises to C, and F
        falls to E. Playing B at the end of G7 and C at the start of C is a ready-made phrase.
      </p>

      <h2>5. Mind rhythm and repetition</h2>
      <ul>
        <li>
          <strong>Short phrases:</strong> two bars playing, two bars of silence. Silence is music
          too.
        </li>
        <li>
          <strong>Call and response:</strong> play a phrase and answer it with a similar one that
          ends on a chord tone.
        </li>
        <li>
          <strong>Repeat the idea:</strong> the same phrase played twice, with one note changed,
          sounds intentional.
        </li>
      </ul>

      <h2>6. The pentatonic shortcut</h2>
      <p>
        If that is a lot at once, use the <strong>A minor pentatonic</strong>: A, C, D, E and G.
        These are five notes of the C major scale without the two that clash the most (F and B).
        Over the C – G – Am – F loop almost nothing in it sounds wrong, so you can focus on rhythm.
        The positions, fret by fret, are in the{' '}
        <a href="/en/guides/ukulele-scales">ukulele scales</a> guide.
      </p>

      <h2>A 10-minute routine</h2>
      <ol>
        <li>
          <strong>2 min:</strong> with the backing track playing, chord tones only.
        </li>
        <li>
          <strong>3 min:</strong> walk between them by neighboring steps.
        </li>
        <li>
          <strong>3 min:</strong> play a tension note and resolve it right after.
        </li>
        <li>
          <strong>2 min:</strong> free play, with call and response.
        </li>
      </ol>
    </>
  );
}
