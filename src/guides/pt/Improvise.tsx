import { GuideBoard } from '../GuideBoard';

export function ImprovisePt() {
  return (
    <>
      <p className="guide-lead">
        Improvisar é escolher, na hora, notas que conversam com o acorde que está soando. Não
        precisa saber muita teoria: com seis ideias e uma base para tocar junto, dá para criar
        frases que soam bem desde o primeiro dia.
      </p>

      <h2>1. Saiba quais acordes moram no tom</h2>
      <p>
        Cada tom tem um grupo de acordes que soam bem juntos, o <strong>campo harmônico</strong>. Em
        dó maior eles são <strong>C, Dm, Em, F, G, Am e Bdim</strong>. Quase toda música pop usa uma
        volta com quatro deles, como <strong>C – G – Am – F</strong>. Saber o tom diz quais notas
        você tem à mão: as sete notas da escala de dó (C, D, E, F, G, A, B).
      </p>

      <h2>2. Mire nas notas do acorde</h2>
      <p>
        As notas que formam o acorde da vez são o porto seguro. Sobre C, elas são{' '}
        <strong>C, E e G</strong>. Começar e terminar frases nelas, principalmente no primeiro tempo
        do compasso, faz qualquer frase soar resolvida.
      </p>
      <GuideBoard
        keyContext={{ tonic: 'C', scale: 'major' }}
        chord="C"
        caption="Dó maior sobre o acorde C. Círculos verdes: notas do acorde (repouso). Quadrados amarelos: as outras notas da escala (passagem). Losangos laranja: notas que pedem resolução (tensão)."
      />

      <h2>3. Use a escala para caminhar entre elas</h2>
      <p>
        Entre uma nota do acorde e outra, as notas da escala servem de caminho. O jeito mais simples
        é andar por <strong>graus vizinhos</strong>: de E para F para G, sem pular. Frases assim
        soam cantáveis, porque é como a voz se move.
      </p>

      <h2>4. Crie tensão e resolva</h2>
      <p>
        Algumas notas da escala, tocadas sobre certo acorde, deixam a frase &quot;no ar&quot;. Isso
        não é erro: é tensão, e o ouvido espera que ela se resolva meio tom ou um tom ao lado. O
        exemplo clássico é a passagem de <strong>G7 para C</strong>: a nota B (de G7) sobe para C, e
        a nota F desce para E. Tocar B no fim do G7 e C no começo do C é uma frase pronta.
      </p>

      <h2>5. Cuide do ritmo e da repetição</h2>
      <ul>
        <li>
          <strong>Frases curtas:</strong> dois compassos tocando, dois em silêncio. O silêncio
          também é música.
        </li>
        <li>
          <strong>Pergunta e resposta:</strong> toque uma frase e responda com outra parecida,
          terminando numa nota do acorde.
        </li>
        <li>
          <strong>Repita a ideia:</strong> a mesma frase tocada duas vezes, com uma nota trocada,
          soa intencional.
        </li>
      </ul>

      <h2>6. A pentatônica como atalho</h2>
      <p>
        Se tudo isso for muita coisa de uma vez, use a <strong>pentatônica de lá menor</strong>: A,
        C, D, E e G. São cinco notas da escala de dó sem as duas que mais geram atrito (F e B).
        Sobre a volta C – G – Am – F, quase nada dela soa errado, então você pode se concentrar no
        ritmo. As posições, casa por casa, estão no guia de{' '}
        <a href="/guias/escalas-no-ukulele">escalas no ukulele</a>.
      </p>

      <h2>Uma rotina de 10 minutos</h2>
      <ol>
        <li>
          <strong>2 min:</strong> com a base tocando, só notas do acorde (no app, exercício &quot;Só
          repouso&quot;).
        </li>
        <li>
          <strong>3 min:</strong> caminhe por graus vizinhos entre elas (&quot;Passo a passo&quot;).
        </li>
        <li>
          <strong>3 min:</strong> toque uma tensão e resolva logo depois (&quot;Resolva a
          tensão&quot;).
        </li>
        <li>
          <strong>2 min:</strong> livre, com pergunta e resposta.
        </li>
      </ol>
    </>
  );
}
