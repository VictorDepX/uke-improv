import { GuideBoard } from '../GuideBoard';

export function ScalesEn() {
  return (
    <>
      <p className="guide-lead">
        Four scales cover almost everything played on the ukulele: major, natural minor, pentatonic
        and blues. Below are the notes of each one in the first five frets, in standard{' '}
        <strong>G C E A</strong> tuning, and when to use each one.
      </p>

      <h2>How to read the positions</h2>
      <p>
        Strings go from the one closest to your face to the one closest to the floor:{' '}
        <strong>G, C, E and A</strong>. The number is the fret (0 is the open string). On a standard
        ukulele the G string is high, so the lowest note on the instrument is the open C.
      </p>

      <h2>Major scale (C major)</h2>
      <p>
        Notes: <strong>C D E F G A B</strong>. It is the scale of happy songs and most pop. Starting
        on the open C, it fits entirely in the first five frets.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">String</th>
            <th scope="col">Frets (note)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>G</td>
            <td>0 (G) · 2 (A) · 4 (B) · 5 (C)</td>
          </tr>
          <tr>
            <td>C</td>
            <td>0 (C) · 2 (D) · 4 (E) · 5 (F)</td>
          </tr>
          <tr>
            <td>E</td>
            <td>0 (E) · 1 (F) · 3 (G) · 5 (A)</td>
          </tr>
          <tr>
            <td>A</td>
            <td>0 (A) · 2 (B) · 3 (C) · 5 (D)</td>
          </tr>
        </tbody>
      </table>
      <GuideBoard
        keyContext={{ tonic: 'C', scale: 'major' }}
        chord="C"
        caption="C major across the whole fretboard, colored by the C chord: green marks the chord tones (C, E, G)."
      />

      <h2>Natural minor scale (A minor)</h2>
      <p>
        Notes: <strong>A B C D E F G</strong>, the same as C major, starting on A. That is why A
        minor is the <strong>relative minor</strong> of C major: the positions are the same as in
        the table above, but phrases rest on A instead of C. It sounds more melancholic.
      </p>

      <h2>Minor pentatonic (A minor pentatonic)</h2>
      <p>
        Notes: <strong>A C D E G</strong>. Five notes, without the half steps of the major scale, so
        it barely clashes with the chords. It is the best scale to start improvising with.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">String</th>
            <th scope="col">Frets (note)</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>G</td>
            <td>0 (G) · 2 (A) · 5 (C)</td>
          </tr>
          <tr>
            <td>C</td>
            <td>0 (C) · 2 (D) · 4 (E)</td>
          </tr>
          <tr>
            <td>E</td>
            <td>0 (E) · 3 (G) · 5 (A)</td>
          </tr>
          <tr>
            <td>A</td>
            <td>0 (A) · 3 (C) · 5 (D)</td>
          </tr>
        </tbody>
      </table>
      <GuideBoard
        keyContext={{ tonic: 'A', scale: 'minorPentatonic' }}
        chord="Am"
        caption="A minor pentatonic over Am: green marks the chord tones (A, C, E); yellow, the other two (D, G)."
      />
      <p>
        The C <strong>major</strong> pentatonic (C D E G A) has exactly the same notes: only the
        note the phrase rests on changes.
      </p>

      <h2>Blues scale (A blues)</h2>
      <p>
        Notes: <strong>A C D E♭ E G</strong>: the minor pentatonic plus one note, the &quot;blue
        note&quot; E♭. On the fretboard it sits on fret 3 of the C string and fret 6 of the A
        string. Use it in passing, between D and E, and don&apos;t stop on it.
      </p>

      <h2>Which scale to use</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Scale</th>
            <th scope="col">Sounds</th>
            <th scope="col">Use it for</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Major</td>
            <td>Happy, resolved</td>
            <td>Songs in a major key, singable melodies</td>
          </tr>
          <tr>
            <td>Natural minor</td>
            <td>Melancholic</td>
            <td>Songs in a minor key</td>
          </tr>
          <tr>
            <td>Pentatonic</td>
            <td>Open, clash-free</td>
            <td>Starting to improvise; rock, pop, folk</td>
          </tr>
          <tr>
            <td>Blues</td>
            <td>Gritty, expressive</td>
            <td>Blues, rock, soul</td>
          </tr>
        </tbody>
      </table>

      <h2>How to practice</h2>
      <ol>
        <li>Play the scale up and down, slowly, with a metronome at 60 BPM.</li>
        <li>Repeat, starting and ending on the tonic (C for major, A for minor).</li>
        <li>
          Put on a backing track and play the scale over it; the method is in{' '}
          <a href="/en/guides/how-to-improvise-on-ukulele">how to improvise on the ukulele</a>.
        </li>
      </ol>
    </>
  );
}
