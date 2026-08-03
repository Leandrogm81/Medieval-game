# Sprint 06 quebrada em tarefas menores — Música Ambiente

> **Coder:** 🟢 BARATO para TODAS as tarefas
> **Subpasta de destino:** `tarefas/sprint-06/`

---

## Tarefa 1 — Buscar e baixar assets MP3
- **Objetivo:** Obter 3 arquivos de música medieval gratuitos.
- **Arquivos prováveis:** `public/music/menu.mp3`, `public/music/peace.mp3`, `public/music/war.mp3`
- **Passos:**
  1. Acessar OpenGameArt.org ou Pixabay Music
  2. Buscar por "medieval ambient", "medieval battle", "medieval menu"
  3. Baixar 3 faixas com licença CC0:
     - `menu.mp3`: calma, contemplativa (~2-4 min, loop-friendly)
     - `peace.mp3`: ambiente neutra (~2-4 min, loop-friendly)
     - `war.mp3`: intensa, batalha (~2-4 min, loop-friendly)
  4. Salvar em `public/music/`
- **Critérios de aceite:** 3 arquivos MP3 no diretório, licença CC0
- **Como validar:** `ls -la public/music/` mostra 3 arquivos
- **Riscos:** Dificuldade em encontrar assets CC0 adequados. Se não encontrar, criar placeholders de silêncio e documentar

---

## Tarefa 2 — Criar musicLogic.ts (inicialização)
- **Objetivo:** Criar o módulo de música com elementos `<audio>`.
- **Arquivos prováveis:** `src/logic/musicLogic.ts` (CRIAR)
- **Passos:**
  1. Criar arquivo
  2. Declarar variáveis no escopo do módulo:
     ```typescript
     let menuAudio: HTMLAudioElement | null = null;
     let gameAudioA: HTMLAudioElement | null = null;
     let gameAudioB: HTMLAudioElement | null = null;
     let activeGameAudio: 'A' | 'B' = 'A';
     let currentVolume = 0.5;
     let musicEnabled = true;
     ```
  3. `npx tsc --noEmit`
- **Critérios de aceite:** Módulo compila
- **Como validar:** `npx tsc --noEmit`
- **Riscos:** `HTMLAudioElement` pode não estar disponível em SSR. O projeto é client-only (Vite), seguro

---

## Tarefa 3 — Implementar initMusic (musicLogic.ts)
- **Objetivo:** Criar os elementos de áudio.
- **Arquivos prováveis:** `src/logic/musicLogic.ts` (EDITAR)
- **Passos:**
  1. Implementar:
     ```typescript
     export function initMusic(): void {
       menuAudio = new Audio('/music/menu.mp3');
       menuAudio.loop = true;
       menuAudio.volume = currentVolume;
       gameAudioA = new Audio('/music/peace.mp3');
       gameAudioA.loop = true;
       gameAudioA.volume = currentVolume;
       gameAudioB = new Audio('/music/peace.mp3');
       gameAudioB.loop = true;
       gameAudioB.volume = 0;
     }
     ```
  2. `npx tsc --noEmit`
- **Critérios de aceite:** Função cria 3 elementos `<audio>` com loop ativado
- **Como validar:** `npx tsc --noEmit`
- **Riscos:** Caminhos relativos `/music/...` dependem da configuração do Vite (pasta `public/`)

---

## Tarefa 4 — Implementar startMenuMusic e startGameMusic
- **Objetivo:** Iniciar a faixa correta conforme contexto.
- **Arquivos prováveis:** `src/logic/musicLogic.ts` (EDITAR)
- **Passos:**
  1. `startMenuMusic()`: parar todos, `menuAudio.play().catch(handleAutoplayError)`
  2. `startGameMusic(isAtWar)`: parar todos, `gameAudioA.src = isAtWar ? '/music/war.mp3' : '/music/peace.mp3'`, `gameAudioA.play()`
  3. `npx tsc --noEmit`
- **Critérios de aceite:** Funções iniciam a faixa correta
- **Como validar:** `npx tsc --noEmit`
- **Riscos:** `play()` retorna Promise que pode ser rejeitada (autoplay policy). Tratar com `.catch()`

---

## Tarefa 5 — Implementar crossfade (musicLogic.ts)
- **Objetivo:** Transição suave de 2 segundos entre faixas.
- **Arquivos prováveis:** `src/logic/musicLogic.ts` (EDITAR)
- **Passos:**
  1. Implementar `switchToWarMusic()` e `switchToPeaceMusic()`
  2. Ambas chamam função interna `crossfadeTo(src)`:
     - Determinar qual `Audio` está ativo e qual está inativo
     - Setar `src` no inativo, `volume = 0`, `play()`
     - Usar `requestAnimationFrame` para fade out do ativo e fade in do inativo ao longo de 2000ms
     - Ao final: `pause()` no que saiu, inverter `activeGameAudio`
  3. `npx tsc --noEmit`
- **Critérios de aceite:** Crossfade de 2 segundos sem gaps
- **Como validar:** `npm run build && npm run dev` — testar transição guerra→paz
- **Riscos:** `requestAnimationFrame` pode não ser suave. Alternativa: `setInterval` a cada 50ms

---

## Tarefa 6 — Implementar stopMusic, setMusicVolume, isMusicPlaying
- **Objetivo:** Funções de controle.
- **Arquivos prováveis:** `src/logic/musicLogic.ts` (EDITAR)
- **Passos:**
  1. `stopMusic()`: `pause()` em todos
  2. `setMusicVolume(vol)`: `currentVolume = vol / 100`, aplicar em todos
  3. `isMusicPlaying()`: retornar `musicEnabled`
  4. `npx tsc --noEmit`
- **Critérios de aceite:** Controles funcionam
- **Como validar:** `npx tsc --noEmit`
- **Riscos:** Nenhum

---

## Tarefa 7 — Integrar música no App.tsx (inicialização)
- **Objetivo:** Iniciar música após primeiro clique do usuário (autoplay policy).
- **Arquivos prováveis:** `src/App.tsx`
- **Passos:**
  1. Adicionar import: `import { initMusic, startMenuMusic } from './logic/musicLogic';`
  2. No `handleFirstClick` (linha 81), após `initAudio()`:
     ```typescript
     initMusic();
     startMenuMusic();
     ```
  3. `npx tsc --noEmit`
- **Critérios de aceite:** Música do menu inicia após primeiro clique
- **Como validar:** `npm run build && npm run dev` — abrir página, clicar, ouvir música
- **Riscos:** `handleFirstClick` já existe. Adicionar chamada sem remover a existente

---

## Tarefa 8 — Integrar música no App.tsx (transições)
- **Objetivo:** Música muda ao entrar/sair do jogo e ao declarar guerra.
- **Arquivos prováveis:** `src/App.tsx`, `src/hooks/useGameController.ts`
- **Passos:**
  1. Em `startNewGame` e `handleLoad`, após `setShowMenu(false)`: `startGameMusic(false)`
  2. Em `handleEndTurn`, após processar turno, verificar se jogador está em guerra:
     ```typescript
     const playerAtWar = next.realms[next.playerRealmId].wars.length > 0;
     if (playerAtWar && !wasAtWar) switchToWarMusic();
     else if (!playerAtWar && wasAtWar) switchToPeaceMusic();
     ```
  3. `npx tsc --noEmit`
- **Critérios de aceite:** Música transita menu→jogo→guerra→paz
- **Como validar:** `npm run build && npm run dev` — iniciar jogo, declarar guerra, fazer paz
- **Riscos:** Tracking de `wasAtWar` entre renders — usar ref ou variável de módulo

---

## Tarefa 9 — Adicionar toggle de música no HUD
- **Objetivo:** Botão 🔈/🔊 e slider de volume no HUD.
- **Arquivos prováveis:** `src/components/HUD.tsx`
- **Passos:**
  1. Adicionar botão no canto do HUD
  2. Estado: `musicEnabled` (toggle)
  3. Ao clicar: alternar entre `stopMusic()` e voltar a tocar
  4. Slider `<input type="range" min="0" max="100">` que chama `setMusicVolume`
  5. `npm run build`
- **Critérios de aceite:** Toggle funciona, volume ajustável
- **Como validar:** `npm run build && npm run dev` — testar toggle e slider
- **Riscos:** Armazenar estado do toggle no módulo `musicLogic` (não no React state) para persistir entre remounts

---

## Tarefa 10 — Validação final do Sprint 06
- **Objetivo:** Testar todo o fluxo de música.
- **Arquivos prováveis:** Nenhum
- **Passos:**
  1. `npm run lint && npm run build`
  2. `npm run dev` — testar:
     - Abrir página → silêncio
     - Clicar → música do menu toca
     - Iniciar jogo → crossfade para música de paz
     - Declarar guerra → crossfade para música de guerra
     - Fazer paz → crossfade para música de paz
     - Toggle desliga → silêncio
     - Toggle liga → volta a tocar
     - Slider ajusta volume
     - Loop contínuo (deixar tocando alguns minutos)
- **Critérios de aceite:** Checklist completo
- **Como validar:** Executar comandos e teste manual
- **Riscos:** Autoplay pode bloquear em alguns browsers. Testar Chrome e Firefox

---

*Sprint 06 quebrada — 10 tarefas — Reinos Medievais — Fase 2*
