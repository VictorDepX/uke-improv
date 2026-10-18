# Uke Improv

Assistente de improviso e harmonia para ukulele. Dado o tom e o acorde atual, mostra no braço quais notas soam bem a seguir e quais acordes combinam como próximos.

## Módulos

| Módulo                     | O que faz                                                                                        | Onde                                                                     |
| -------------------------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| 1. Braço sugestivo         | Colore cada casa (repouso, passagem, tensão, fora) e numera as 3 melhores próximas notas         | `src/core/classify.ts`, `suggestNotes.ts`, `ui/components/Fretboard.tsx` |
| 2. Escuta                  | Detecta nota (pitchy/McLeod) e acorde (cromagrama) pelo microfone; afinador; análise de gravação | `src/audio/analysis/`, `src/audio/engine/mic.ts`                         |
| 3. Sugeridor de progressão | Próximos acordes por função harmônica, dominantes secundárias, empréstimo modal, diagramas GCEA  | `src/core/suggestChords.ts`, `chordShapes.ts`                            |
| 4. Modo jam                | Base em loop (Tone.js) com acordes, baixo e bateria; o braço acompanha e avisa o próximo acorde  | `src/audio/engine/jam.ts`, `ui/pages/JamPage.tsx`                        |

## Onda 1: tocar sem atrito

- **Menu recolhido no celular:** a barra não fica fixa e o seletor de tom abre sob demanda.
- **Modo prática:** tela cheia pensada para o celular deitado, com acorde atual e próximo, 3 sugestões e o braço ocupando o resto.
- **Região automática:** janela de 5 casas que segue a última nota (toque ou microfone), com setas para deslocar.
- **Tela acesa:** Wake Lock durante a base e o modo prática.
- **Presets:** tom, escala, progressão e andamento com um toque.
- **PWA:** instalável e offline; fontes servidas localmente e service worker gerado no build (`scripts/sw-plugin.ts`). Ícones: `python3 scripts/make-icons.py`.

## Onda 2: aprender tocando

- **Formas além da cor:** círculo = repouso, quadrado = passagem, losango = tensão (desligável em Ajustes).
- **Por que essa cor?:** toque longo ou clique direito numa casa explica grau, intervalo e para onde a nota tende (`src/core/explain.ts`).
- **Mais escalas:** dórico, mixolídio e menor harmônica, com campos harmônicos, progressões e presets próprios; modo "só arpejo".
- **Tap tempo:** andamento pelo pulso tocado (mediana dos intervalos, `src/core/tempo.ts`).
- **Capotraste:** casas 1–7; braço, janela, diagramas ("forma de C"), base e microfone contam a partir do capo.
- **Exercícios guiados:** só repouso, resolva a tensão, passo a passo e alvo na troca; avaliam cada nota da tela ou do microfone (`src/core/exercises.ts`).

## Onda 3: tocar músicas reais e abrir para outras pessoas

- **Compassos 3/4 e 6/8 e acordes de 2 tempos:** a base toca uma grade de semicolcheias calculada por funções puras (`src/core/rhythm.ts`, `sequencer.ts`); "ii V7" num compasso divide os tempos.
- **Estilos de base:** pop, reggae, bossa nova, swing (com baixo caminhante e tercina) e valsa (`src/core/grooves.ts`).
- **Analisador de cifra:** cola uma cifra com letra, acha o tom, sugere a escala, explica cada acorde e leva para o jam (`src/core/chart.ts`).
- **Treino de ouvido:** intervalos, maior × menor e função harmônica, na aba Ouvido (`src/core/ear.ts`).
- **Calibração do microfone:** mede ruído e toque e ajusta ganho e limiar (`src/audio/analysis/calibrate.ts`).
- **Gravar e reouvir:** grava o microfone e as notas detectadas; na reprodução, o braço marca cada nota (`src/core/take.ts`).
- **Looper:** até 4 camadas no compasso, com captura por AudioWorklet e compensação de latência (`src/audio/looper/`).
- **Contas e sincronização:** e-mail e senha pelo Neon Auth; ajustes, progressões e progresso sincronizados pelo Data API com RLS (`src/sync/`). As chamadas passam por `/api` no domínio do app (rewrites em `vercel.json`, proxy no `vite.config.ts`).

## Comandos

```bash
npm install
npm run dev            # servidor local (o microfone funciona em localhost)
npm test               # 227 testes (núcleo, áudio sintetizado, motor da base, sincronização, interface)
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
