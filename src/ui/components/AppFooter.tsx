/**
 * Rodapé das páginas do app: diz em texto o que o app faz (para quem chega pela busca e para os
 * buscadores) e liga aos guias. Fica abaixo do conteúdo, fora do caminho de quem está tocando.
 */
export function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="app-footer-inner">
        <section aria-labelledby="about-title">
          <h2 id="about-title">Improvise no ukulele sabendo a próxima nota</h2>
          <p>
            Escolha o tom e o acorde: o braço mostra em cores quais notas repousam, quais servem de
            passagem e quais pedem resolução, e sugere os próximos acordes. Toque junto com bases em
            pop, reggae, bossa nova, swing e valsa, grave loops e treine o ouvido. O microfone
            reconhece o que você toca no seu ukulele. Grátis, sem anúncios e funciona offline.
          </p>
        </section>
        <nav aria-labelledby="guides-title">
          <h2 id="guides-title">Guias</h2>
          <ul>
            <li>
              <a href="/guias/como-improvisar-no-ukulele">Como improvisar no ukulele</a>
            </li>
            <li>
              <a href="/guias/escalas-no-ukulele">Escalas no ukulele</a>
            </li>
            <li>
              <a href="/en/guides/how-to-improvise-on-ukulele" hrefLang="en" lang="en">
                How to improvise on the ukulele
              </a>
            </li>
          </ul>
        </nav>
        <p className="app-footer-meta">
          Código aberto (MIT) · <a href="https://github.com/VictorDepX/uke-improv">GitHub</a>
        </p>
      </div>
    </footer>
  );
}
