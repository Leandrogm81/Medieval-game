# Sprint 06 — Música Ambiente

**Objetivo:** Adicionar trilha sonora medieval com 3 faixas (menu, paz, guerra), toggle de volume, crossfade.

**Nível de dificuldade:** 🟡 Médio — use coder BARATO para TODAS as tarefas

**Dependências:** Nenhuma (totalmente independente)

**Tempo estimado:** 4.0 dias

---

## Arquivos

| Ação | Arquivo | Coder |
|------|---------|-------|
| Criar | `src/logic/musicLogic.ts` | Barato |
| Adicionar | `public/music/menu.mp3` | Barato |
| Adicionar | `public/music/peace.mp3` | Barato |
| Adicionar | `public/music/war.mp3` | Barato |
| Editar | `src/App.tsx` | Barato |
| Editar | `src/components/HUD.tsx` | Barato |

---

## Tarefas

### T1 — Obter assets MP3 gratuitos (CC0) 🟢 Barato
- **Fontes recomendadas:** OpenGameArt.org, Pixabay Music
- **3 faixas necessárias:**
  - `menu.mp3` — calma, contemplativa, medieval
  - `peace.mp3` — ambiente neutra, exploração
  - `war.mp3` — intensa, batalha
- Cada ~2-4 minutos, loop-friendly (fim emenda com início sem clique audível)
- Salvar em: `public/music/`
- Critério de aceite: 3 arquivos MP3 existem no diretório

### T2 — Criar `src/logic/musicLogic.ts` 🟡 Barato
- Usar elemento `<audio>` nativo do HTML5 (NÃO Tone.js / Web Audio API)
- **Estrutura:**
```typescript
let menuAudio: HTMLAudioElement;
let gameAudio1: HTMLAudioElement;  // para crossfade
let gameAudio2: HTMLAudioElement;
let currentGameAudio: 1 | 2 = 1;
let isPlaying = false;
let volume = 0.5;

export function initMusic(): void {
  menuAudio = new Audio('/music/menu.mp3');
  menuAudio.loop = true;
  gameAudio1 = new Audio('/music/peace.mp3');
  gameAudio1.loop = true;
  gameAudio2 = new Audio('/music/peace.mp3');
  gameAudio2.loop = true;
  // Aplicar volume inicial
  setMusicVolume(50);
}

export function startMenuMusic(): void {
  stopAll();
  menuAudio.currentTime = 0;
  menuAudio.play().catch(() => { /* mostrar botão Ativar Som */ });
  isPlaying = true;
}

export function startGameMusic(isAtWar: boolean): void {
  stopAll();
  const src = isAtWar ? '/music/war.mp3' : '/music/peace.mp3';
  gameAudio1.src = src;
  gameAudio1.currentTime = 0;
  gameAudio1.play().catch(() => {});
  isPlaying = true;
}

export function switchToWarMusic(): void {
  crossfade('/music/war.mp3');
}

export function switchToPeaceMusic(): void {
  crossfade('/music/peace.mp3');
}

function crossfade(newSrc: string): void {
  const fadeOut = currentGameAudio === 1 ? gameAudio1 : gameAudio2;
  const fadeIn = currentGameAudio === 1 ? gameAudio2 : gameAudio1;
  fadeIn.src = newSrc;
  fadeIn.currentTime = 0;
  fadeIn.volume = 0;
  fadeIn.play();
  
  // Fade out antigo, fade in novo (2 segundos)
  const startTime = Date.now();
  const duration = 2000;
  const tick = () => {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(1, elapsed / duration);
    fadeOut.volume = volume * (1 - progress);
    fadeIn.volume = volume * progress;
    if (progress < 1) requestAnimationFrame(tick);
    else { fadeOut.pause(); currentGameAudio = currentGameAudio === 1 ? 2 : 1; }
  };
  tick();
}

export function stopMusic(): void {
  menuAudio.pause();
  gameAudio1.pause();
  gameAudio2.pause();
  isPlaying = false;
}

export function setMusicVolume(vol: number): void {
  volume = vol / 100;
  menuAudio.volume = volume;
  const active = currentGameAudio === 1 ? gameAudio1 : gameAudio2;
  active.volume = volume;
}

export function isMusicPlaying(): boolean { return isPlaying; }
```
- Critério de aceite: música toca em loop, crossfade funciona

### T3 — Integrar em `App.tsx` 🟡 Barato
- No `handleFirstClick` (linha 81): chamar `initMusic()` e `startMenuMusic()`
- Ao iniciar jogo (`startNewGame` ou `handleLoad`): chamar `startGameMusic(false)`
- No `handleEndTurn` (useGameController.ts linha 97), após processar o turno: verificar se jogador está em guerra (`realm.wars.length > 0`) e alternar música
- Critério de aceite: música inicia após primeiro clique, transita entre menu/jogo

### T4 — Adicionar toggle de música no HUD 🟢 Barato
- Botão 🔈/🔊 no canto do HUD
- Ao clicar: alternar entre `stopMusic()` e `startGameMusic(isAtWar)`
- Slider de volume (0-100) que chama `setMusicVolume`
- Mesmo toggle deve aparecer no menu principal
- Critério de aceite: toggle liga/desliga, slider ajusta volume

---

## Critérios de aceite da sprint
- [ ] Música inicia após primeiro clique do usuário (autoplay policy)
- [ ] 3 faixas tocam em loop sem gaps audíveis
- [ ] Transição menu → jogo → guerra/paz com crossfade de 2s
- [ ] Toggle 🔈/🔊 funciona
- [ ] Volume ajustável via slider
- [ ] Se `play()` falhar (Promise rejected), botão "Ativar Som" aparece

---

## Comandos de validação
```bash
npm run lint && npm run build
npm run dev
# Testar manualmente:
# 1. Abrir página → clicar → música do menu toca
# 2. Iniciar jogo → música de paz toca
# 3. Declarar guerra → crossfade para música de guerra
# 4. Toggle desliga e liga
# 5. Slider ajusta volume
```

---

## Riscos
- **Autoplay policy:** Chrome/Firefox bloqueiam `audio.play()` sem gesto. A estratégia de iniciar no `handleFirstClick` + fallback mitiga
- **Assets MP3:** Se não encontrar assets CC0 adequados, usar placeholder e documentar. O código funciona mesmo sem os arquivos (áudio simplesmente não toca)
- **Conflito com Tone.js:** O projeto já usa Tone.js para SFX. A música usa `<audio>` nativo separado — sem conflito
- **Loops com gap:** Arquivos MP3 têm silêncio no início/fim por natureza do codec. Usar arquivos WAV ou editar para remover silêncio. Alternativa: usar `loopStart`/`loopEnd` se disponível
- **Estimativa de 4 dias:** Maior parte do tempo é busca e edição de assets, não código

---

## O que NÃO deve ser alterado
- `src/logic/sfxLogic.ts` — SFX existentes (batalha, construção, recrutamento)
- Tone.js — continua para SFX
- Nenhuma lógica de jogo

---

*Sprint 06 — Música — Reinos Medievais — Fase 2*
