# Sprint 01 — Fundação: Hotkeys e Infraestrutura de Áudio

> **PRD de origem:** PRD-FASE-1-DIPLOMACIA-HOTKEYS-v2.md §1 + §6 (setup)
> **Duração estimada:** 1.5-2 dias
> **Dependências:** Nenhuma (sprint inicial)
> **Pré-requisito para:** Sprints 02-07 (todas as features usarão hotkeys; SFX usará AudioContext)

---

## Objetivo da Sprint

Entregar atalhos de teclado globais para todas as ações frequentes do jogo e preparar a infraestrutura de áudio (tone.js). As hotkeys são a camada de fundação que as demais features da fase usarão — modo diplomático (tecla `4`), atalhos de marcha/ataque (`W`/`A`), e encerramento de turno (`Enter`).

---

## Scope: User Stories

### US-01 — Hotkeys de Navegação e Modo de Visão
**Como** jogador, **quero** alternar entre modos de visão e controlar a câmara com o teclado **para** navegar rapidamente sem usar o rato.

| Tecla | Ação | Condição |
|-------|------|----------|
| `1` | Modo Political | Jogo ativo |
| `2` | Modo Economic | Jogo ativo |
| `3` | Modo Military | Jogo ativo |
| `4` | Modo Diplomatic | Jogo ativo |
| `5` | Modo Resources | Jogo ativo |
| `Q` | Zoom out (−0.2, min 0.5) | Jogo ativo |
| `E` | Zoom in (+0.2, max 3) | Jogo ativo |
| `Space` | Centralizar na capital | Jogo ativo |
| `F` | Alternar tela cheia | Sempre |

**Arquivos:** `src/App.tsx` (useEffect keydown), `src/hooks/useUI.ts`

### US-02 — Hotkeys de Ação
**Como** jogador, **quero** executar ações de jogo com o teclado **para** acelerar o fluxo de turnos.

| Tecla | Ação | Condição |
|-------|------|----------|
| `Enter` | Encerrar turno | Jogo ativo |
| `Esc` | Cancelar ação atual | Com ação ativa (moving/attacking/scouting) |
| `W` | Iniciar marcha (Move) | Com província aliada selecionada |
| `A` | Iniciar ataque (Attack) | Com província aliada selecionada |
| `S` | Quick save | Jogo ativo (Ctrl+S NÃO interceptado) |

**Edge cases:**
- `W`/`A` sem província selecionada → nada acontece, sem erro
- `Ctrl+S` nativo do browser NÃO é interceptado
- Hotkeys NÃO funcionam quando foco está em input/textarea
- Hotkeys NÃO funcionam no menu principal (`ui.showMenu === true`)
- Duas hotkeys simultâneas → apenas a primeira processa (sem double-fire)

**Arquivos:** `src/App.tsx`

### US-03 — Tooltips de Hotkey nos Botões do HUD
**Como** jogador, **quero** ver os atalhos de teclado nos tooltips dos botões **para** aprender as hotkeys naturalmente durante o jogo.

Cada botão do HUD que tem hotkey associada deve exibir a dica no tooltip:
- "Marchar [W]"
- "Atacar [A]"
- "Encerrar Turno [Enter]"
- Modos de visão: "Political [1]", "Economic [2]", etc.

**Arquivos:** `src/components/HUD.tsx`

### US-04 — Infraestrutura de Áudio (tone.js Setup)
**Como** sistema, **preciso** que o AudioContext seja inicializado e que exista um toggle de som **para** que o Sprint 07 (SFX) possa adicionar sons sem preocupações de setup.

- Instalar dependência: `npm install tone`
- Criar `src/logic/sfxLogic.ts` com `initAudio()` (chama `Tone.start()`)
- Inicializar AudioContext no primeiro clique do utilizador (política de autoplay do Chrome)
- Botão toggle 🔈/🔊 no HUD
- Preferência `sfx_enabled` persistida em localStorage
- Fallback silencioso se AudioContext não disponível
- Fallback para `enabled=true` se localStorage corrompido

**Arquivos:** `src/logic/sfxLogic.ts`, `src/App.tsx`, `src/components/HUD.tsx`

---

## Arquivos Afetados

| Arquivo | Ação | User Stories |
|---------|------|-------------|
| `src/App.tsx` | Editar — adicionar useEffect keydown + initAudio | US-01, US-02, US-04 |
| `src/hooks/useUI.ts` | Verificar — garantir que métodos zoom/setViewMode existem | US-01 |
| `src/components/HUD.tsx` | Editar — tooltips + botão toggle SFX | US-03, US-04 |
| `src/logic/sfxLogic.ts` | Criar — initAudio + toggle logic | US-04 |

---

## Critérios de Aceitação

- [ ] `Enter` encerra turno e mostra TurnSummary
- [ ] `Esc` cancela ação de marcha/ataque/scout ativa
- [ ] `1`-`5` alternam modos de visão corretamente (Political, Economic, Military, Diplomatic, Resources)
- [ ] `W`/`A` iniciam marcha/ataque a partir da província selecionada
- [ ] `Q`/`E` ajustam zoom com animação (respeitam limites 0.5-3)
- [ ] `Space` centraliza na capital do jogador
- [ ] `S` (sem Ctrl) executa quick save; `Ctrl+S` não é interceptado (browser save)
- [ ] `F` alterna tela cheia
- [ ] Hotkeys NÃO funcionam quando foco está em `<input>` ou `<textarea>`
- [ ] Hotkeys NÃO funcionam no menu principal
- [ ] Duas hotkeys pressionadas simultaneamente → apenas a primeira processa
- [ ] `W` pressionado sem província selecionada → sem erro (no-op)
- [ ] Hotkeys funcionam com layout de teclado ABNT2 (teclado brasileiro)
- [ ] Tooltips no HUD mostram a hotkey correspondente
- [ ] Botão toggle SFX visível no HUD (🔈/🔊)
- [ ] Preferência SFX persiste após reload da página
- [ ] `Tone.start()` chamado no primeiro clique do utilizador
- [ ] Sem crash se AudioContext não disponível

---

## Definição de Pronto (DoD)

- [ ] `npm run lint` — zero erros
- [ ] `npm run build` — sem erros nem warnings críticos
- [ ] Nenhuma mutação de estado fora do padrão (deep clone nos handlers que tocam gameState)
- [ ] `useEffect` de keydown com cleanup correto (removeEventListener no return)
- [ ] Código segue MAESTRO.md Regra #1 (deep clone obrigatório para handlers que modificam estado)
- [ ] Testes manuais: todos os critérios de aceitação verificados no browser
