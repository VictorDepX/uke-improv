# Uke Improv

Assistente de improviso e harmonia para ukulele. Dado o tom e o acorde atual, mostra no braço quais notas soam bem a seguir e quais acordes combinam como próximos.

## Módulos

| Módulo | O que faz | Onde |
| --- | --- | --- |
| 1. Braço sugestivo | Colore cada casa (repouso, passagem, tensão, fora) e numera as 3 melhores próximas notas | `src/core/classify.ts`, `suggestNotes.ts`, `ui/components/Fretboard.tsx` |
| 2. Escuta | Detecta nota (pitchy/McLeod) e acorde (cromagrama) pelo microfone; afinador; análise de gravação | `src/audio/analysis/`, `src/audio/engine/mic.ts` |
| 3. Sugeridor de progressão | Próximos acordes por função harmônica, dominantes secundárias, empréstimo modal, diagramas GCEA | `src/core/suggestChords.ts`, `chordShapes.ts` |
| 4. Modo jam | Base em loop (Tone.js) com acordes, baixo e bateria; o braço acompanha e avisa o próximo acorde | `src/audio/engine/jam.ts`, `ui/pages/JamPage.tsx` |

## Onda 1: tocar sem atrito

- **Menu recolhido no celular:** a barra não fica fixa e o seletor de tom abre sob demanda.
- **Modo prática:** tela cheia pensada para o celular deitado, com acorde atual e próximo, 3 sugestões e o braço ocupando o resto.
- **Região automática:** janela de 5 casas que segue a última nota (toque ou microfone), com setas para deslocar.
- **Tela acesa:** Wake Lock durante a base e o modo prática.
- **Presets:** tom, escala, progressão e andamento com um toque.
- **PWA:** instalável e offline; fontes servidas localmente e service worker gerado no build (`scripts/sw-plugin.ts`). Ícones: `python3 scripts/make-icons.py`.

## Comandos

```bash
npm install
npm run dev            # servidor local (o microfone funciona em localhost)
npm test               # 100 testes (núcleo, áudio sintetizado, store, interface)
npm run lint
npm run typecheck
npm run build          # build normal em dist/
npm run build:artifact # página única para publicar como artifact
```

## Arquitetura

- `core/`: teoria musical pura, sem navegador. Testável isoladamente.
- `audio/analysis/`: detectores puros (recebem `Float32Array`), testados com sinais sintetizados em `src/test/signals.ts` (síntese aditiva e Karplus-Strong, com semente fixa).
- `audio/engine/`: Web Audio e Tone.js (carregado sob demanda).
- `store/`: um store Zustand; sugestões são derivadas, não armazenadas. Preferências persistem em `localStorage` com acesso protegido.
- `ui/`: React. Os módulos só conversam pelo store.

## Limitação conhecida

Dentro do artifact do claude.ai o navegador bloqueia o microfone. Lá, use "Analisar gravação" (mesmos detectores). Rodando com `npm run dev` ou num deploy com HTTPS, o microfone ao vivo funciona.
