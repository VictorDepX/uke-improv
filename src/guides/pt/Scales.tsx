import { GuideBoard } from '../GuideBoard';

export function ScalesPt() {
  return (
    <>
      <p className="guide-lead">
        Quatro escalas cobrem quase tudo o que se toca no ukulele: maior, menor natural, pentatônica
        e blues. Abaixo estão as notas de cada uma nas cinco primeiras casas, na afinação padrão{' '}
        <strong>G C E A</strong>, e quando usar cada uma.
      </p>

      <h2>Como ler as posições</h2>
      <p>
        As cordas vão da mais próxima do rosto para a mais próxima do chão:{' '}
        <strong>G, C, E e A</strong>. O número é a casa (0 é a corda solta). No ukulele padrão, a
        corda G é aguda, então a nota mais grave do instrumento é o C solto.
      </p>

      <h2>Escala maior (dó maior)</h2>
      <p>
        Notas: <strong>C D E F G A B</strong>. É a escala das músicas alegres e da maior parte do
        pop. Começando no C solto, ela cabe toda nas cinco primeiras casas.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Corda</th>
            <th scope="col">Casas (nota)</th>
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
        caption="Dó maior no braço inteiro, colorida pelo acorde C: verde são as notas do acorde (C, E, G)."
      />

      <h2>Escala menor natural (lá menor)</h2>
      <p>
        Notas: <strong>A B C D E F G</strong>, as mesmas de dó maior, começando em A. Por isso lá
        menor é a <strong>relativa menor</strong> de dó maior: as posições são as mesmas da tabela
        acima, mas a frase repousa em A em vez de C. Soa mais melancólica.
      </p>

      <h2>Pentatônica menor (lá menor pentatônica)</h2>
      <p>
        Notas: <strong>A C D E G</strong>. Cinco notas, sem os semitons da escala maior, por isso
        quase não gera choque com os acordes. É a melhor escala para começar a improvisar.
      </p>
      <table>
        <thead>
          <tr>
            <th scope="col">Corda</th>
            <th scope="col">Casas (nota)</th>
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
        caption="Lá menor pentatônica sobre Am: verde são as notas do acorde (A, C, E); amarelo, as outras duas (D, G)."
      />
      <p>
        A pentatônica <strong>maior</strong> de dó (C D E G A) tem exatamente as mesmas notas: muda
        só a nota em que a frase descansa.
      </p>

      <h2>Escala blues (lá blues)</h2>
      <p>
        Notas: <strong>A C D E♭ E G</strong>: a pentatônica menor com uma nota a mais, a &quot;blue
        note&quot; E♭. No braço, ela fica na casa 3 da corda C e na casa 6 da corda A. Use de
        passagem, entre D e E, e não pare nela.
      </p>

      <h2>Qual escala usar</h2>
      <table>
        <thead>
          <tr>
            <th scope="col">Escala</th>
            <th scope="col">Soa</th>
            <th scope="col">Use quando</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Maior</td>
            <td>Alegre, resolvida</td>
            <td>Música em tom maior, melodias cantáveis</td>
          </tr>
          <tr>
            <td>Menor natural</td>
            <td>Melancólica</td>
            <td>Música em tom menor</td>
          </tr>
          <tr>
            <td>Pentatônica</td>
            <td>Aberta, sem choques</td>
            <td>Começar a improvisar; rock, pop, folk</td>
          </tr>
          <tr>
            <td>Blues</td>
            <td>Suja, expressiva</td>
            <td>Blues, rock, soul</td>
          </tr>
        </tbody>
      </table>

      <h2>Como praticar</h2>
      <ol>
        <li>Toque a escala subindo e descendo, devagar, com metrônomo a 60 BPM.</li>
        <li>Repita começando e terminando na tônica (C na maior, A na menor).</li>
        <li>
          Coloque uma base para tocar e use a escala por cima; o método está em{' '}
          <a href="/guias/como-improvisar-no-ukulele">como improvisar no ukulele</a>.
        </li>
      </ol>
    </>
  );
}
