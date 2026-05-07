# Sprint 01 — Tarefas Decompostas (para coder simples)

> **Origem:** sprint_01_fundacao_hotkeys.md
> **Total de tarefas:** 9
> **Ordem de execução:** sequencial (cada tarefa depende da anterior quando indicado)
> **Instruções gerais:** Executar uma tarefa de cada vez. Após cada tarefa, ler o diff e verificar se nada foi quebrado. Todas as tarefas usam React 19 + TypeScript + Tailwind v4. Evitar mutações de estado — sempre usar deep clone (JSON.parse(JSON.stringify(...))) ao modificar gameState. NÃO escrever código que misture lógica de negócio com UI no mesmo componente.

---

## Tarefa 1 — Criar módulo sfxLogic.ts (lógica pura)

- **Objetivo:** Criar o ficheiro `src/logic/sfxLogic.ts` com funções puras para gerir o estado do áudio (ativado/desativado), sem dependências do React.
- **Arquivos prováveis:**
  - `src/logic/sfxLogic.ts` (novo — criar raiz)
- **Passos:**
  1. Criar `src/logic/sfxLogic.ts`.
  2. Exportar função `initAudio(): void` — chama `Tone.start()` se `Tone` estiver disponível globalmente; caso contrário, não faz nada (sem crash).
  3. Exportar função `getSfxEnabled(): boolean` — lê `localStorage.getItem('sfx_enabled')`; se for `'false'`, retorna `false`; para qualquer outro valor (incluindo `null`, corrompido, ausente) retorna `true`.
  4. Exportar função `toggleSfx(): boolean` — inverte o valor atual (lê com getSfxEnabled, inverte, guarda em localStorage com `setItem('sfx_enabled', String(novoValor))`), retorna o novo valor.
  5. Garantir que o ficheiro NÃO importa React, JSX, hooks, nem componentes. É TypeScript puro.
  6. Tratar `localStorage` como possivelmente inexistente (SSR/Node) com bloco try/catch — fallback silencioso para `true`.
- **Critérios de aceite:**
  - `npm run lint` passa sem erros (o ficheiro novo não introduz erros de tipo).
  - `getSfxEnabled()` retorna `true` na primeira chamada (localStorage vazio).
  - `toggleSfx()` depois de chamado retorna `false` e grava `'false'` em localStorage.
  - `initAudio()` não lança exceção mesmo sem tone.js instalado.
  - O ficheiro NÃO contém JSX, hooks, nem importa React.
- **Como validar:**
  ```bash
  npm run lint
  ```
- **Riscos:**
  - Se o coder importar React ou hooks neste ficheiro, falha o lint e quebra a separação de camadas.
  - Se não usar try/catch no localStorage, quebra em SSR/Node.

---

## Tarefa 2 — Instalar tone.js e ligar initAudio ao primeiro clique

- **Objetivo:** Instalar a dependência `tone` e chamar `initAudio()` no primeiro clique do utilizador no jogo ativo, respeitando a política de autoplay do Chrome.
- **Arquivos prováveis:**
  - `package.json` (adicionar dependência)
  - `src/App.tsx` (adicionar useEffect de clique único)
- **Depende de:** Tarefa 1 (sfxLogic.ts criado)
- **Passos:**
  1. Executar `npm install tone` (ou `npm install tone@latest`).
  2. Em `src/App.tsx`, importar `{ initAudio }` de `'./logic/sfxLogic'`.
  3. Dentro de `App()`, após os hooks existentes mas ANTES de qualquer return condicional (`if (ui.isGenerating)`, `if (ui.showMenu)`), adicionar um `useEffect` que:
     - Adiciona um event listener `'click'` no `document` que chama `initAudio()` uma única vez e depois remove-se a si próprio (via `{ once: true }` ou flag booleana).
     - Retorna uma função de cleanup que remove o listener (para evitar memory leaks se o componente desmontar antes do clique).
  4. O useEffect deve ter array de dependências vazio `[]` (executa uma vez no mount).
  5. NÃO modificar mais nada no App.tsx — apenas adicionar este useEffect. Manter o código existente intacto.
- **Critérios de aceite:**
  - `npm run build` passa sem erros.
  - `tone` aparece em `package.json` > `dependencies`.
  - O jogo abre normalmente (sem crash) — menu principal funciona.
  - Ao inspecionar com DevTools, após o primeiro clique, `Tone.context.state` deve ser `'running'` (se tone funcionar; se não, o jogo não crasha).
- **Como validar:**
  ```bash
  npm install tone && npm run build
  npm run lint
  ```
  Depois abrir o jogo no browser, clicar em qualquer lado, verificar na consola que não há erros.
- **Riscos:**
  - `npm install tone` pode falhar em WSL (dependências nativas). Verificar com `npm install tone --ignore-scripts` se necessário.
  - O event listener NÃO deve ser adicionado dentro do return condicional do menu — deve ficar no corpo principal de App() para estar sempre ativo.

---

## Tarefa 3 — Adicionar botão toggle SFX no HUD

- **Objetivo:** Adicionar um botão no HUD que alterna entre ícone de som ligado (🔊 Volume2) e desligado (🔈 VolumeX), usando as funções do sfxLogic.
- **Arquivos prováveis:**
  - `src/components/HUD.tsx` (adicionar botão + estado local)
- **Depende de:** Tarefa 1 (sfxLogic.ts criado)
- **Passos:**
  1. Em `src/components/HUD.tsx`, importar `{ getSfxEnabled, toggleSfx }` de `'../logic/sfxLogic'`.
  2. Importar `Volume2` e `VolumeX` de `lucide-react` (adicionar aos imports existentes na linha 5-8).
  3. Dentro do componente HUD, adicionar um `useState<boolean>` inicializado com `getSfxEnabled()`.
  4. Adicionar um botão na barra superior do HUD (na zona de botões "Salvar", "Menu", "Instruções", linha ~212-220) com:
     - Ícone: `sfxOn ? <Volume2 size={14} /> : <VolumeX size={14} />`
     - onClick: chama `toggleSfx()` e atualiza o estado local com o novo valor retornado.
     - Estilo: igual aos botões existentes (`px-1.5 py-0.5 md:p-1 md:px-2 border border-stone-700 bg-stone-800 text-[9px] md:text-[10px] font-bold uppercase rounded hover:bg-stone-700 transition-colors`).
  5. NÃO alterar a lógica de negócio, cálculos de renda, ou outras secções do HUD.
- **Critérios de aceite:**
  - Botão visível no HUD com ícone de som (Volume2 inicialmente).
  - Ao clicar, alterna para VolumeX; ao clicar de novo, volta para Volume2.
  - O valor persiste após reload da página (localStorage).
  - `npm run build` passa sem erros.
- **Como validar:**
  ```bash
  npm run lint && npm run build
  ```
  Abrir o jogo → ver botão de som no HUD → clicar → ver ícone mudar → recarregar página → ícone mantém o estado.
- **Riscos:**
  - Não mexer nos estilos dos botões existentes — apenas adicionar o novo botão no mesmo grupo.
  - O estado local do useState deve refletir o valor do localStorage; se houver discrepância, o botão mostra errado até ao primeiro clique (aceitável).

---

## Tarefa 4 — Adicionar handleQuickSave no useGameController

- **Objetivo:** Criar um handler de quick save (salvamento rápido sem modal) que grava o jogo atual como autosave e mostra toast de confirmação.
- **Arquivos prováveis:**
  - `src/hooks/useGameController.ts` (adicionar função + exportar no return)
- **Depende de:** Nenhuma (usa funções já existentes)
- **Passos:**
  1. Em `src/hooks/useGameController.ts`, localizar a função `handleSave` (linha ~359).
  2. Adicionar uma nova função `handleQuickSave` usando `useCallback` com array de dependências `[gameState, ui]`:
     - Se `gameState` for null, retorna sem fazer nada.
     - Chama `persistence.saveGame('autosave', gameState)` — mesmo ID do autosave existente.
     - Chama `ui.showToast('Jogo salvo! [S]', 'success')`.
  3. Adicionar `handleQuickSave` ao objeto retornado pelo hook (linha ~444+).
  4. NÃO alterar as funções existentes. Apenas adicionar a nova.
- **Critérios de aceite:**
  - `npm run lint` passa sem erros.
  - `handleQuickSave` aparece no objeto de retorno do `useGameController`.
  - O tipo da função é `() => void`.
- **Como validar:**
  ```bash
  npm run lint && npm run build
  ```
  (O teste funcional será feito na Tarefa 7 quando a hotkey `S` invocar esta função.)
- **Riscos:**
  - Não usar `useCallback` com dependências erradas que capturem `gameState` stale. Usar `[gameState, ui]`.
  - Não adicionar lógica de negócio aqui — é só wrapper de `persistence.saveGame`.

---

## Tarefa 5 — Adicionar centerOnCapital no useGameController

- **Objetivo:** Criar uma função que centraliza o mapa na província capital do jogador, calculando o offset de pan necessário.
- **Arquivos prováveis:**
  - `src/hooks/useGameController.ts` (adicionar função + exportar)
  - `src/types.ts` (verificar tipos existentes — NÃO alterar)
- **Depende de:** Nenhuma
- **Passos:**
  1. Em `useGameController.ts`, adicionar função `centerOnCapital` usando `useCallback` com dependências `[gameState, ui]`:
     - Se `gameState` for null, retorna sem fazer nada.
     - Obtém o realm do jogador: `const realm = gameState.realms[gameState.playerRealmId]`.
     - Se `realm.capitalId` não existir ou a província não existir em `gameState.provinces`, retorna sem fazer nada.
     - Obtém o centroide da capital: `const capital = gameState.provinces[realm.capitalId]`. O centroide está em `capital.centroid` como `[number, number]` (verificar no tipo Province em types.ts).
     - Calcula o offset para centralizar: `const centerX = window.innerWidth / 2; const centerY = window.innerHeight / 2;`.
     - Define o pan: `ui.setPanOffset({ x: centerX - capital.centroid[0] * ui.zoom, y: centerY - capital.centroid[1] * ui.zoom })`.
     - Define o zoom para 1: `ui.setZoom(1)`.
  2. Adicionar `centerOnCapital` ao objeto de retorno do hook.
  3. NÃO alterar outras funções.
- **Critérios de aceite:**
  - `npm run lint` passa.
  - `centerOnCapital` aparece no retorno de `useGameController`.
  - A função lida graciosamente com `gameState === null`, `capitalId` ausente, e província inexistente (sem crash).
- **Como validar:**
  ```bash
  npm run lint && npm run build
  ```
  (O teste funcional será na Tarefa 6 quando a tecla `Space` invocar esta função.)
- **Riscos:**
  - O cálculo do offset pode precisar de ajuste se o mapa usar coordenadas SVG (não screen pixels). Verificar em `Map.tsx` como as coordenadas do SVG são transformadas. Se o pan já funcionar com drag do rato, o mesmo sistema de coordenadas serve.
  - Se `capital.centroid` não for `[number, number]` mas tiver outro formato, adaptar. Ver `types.ts` antes de codar.

---

## Tarefa 6 — Adicionar useEffect de hotkeys: modos de visão, zoom, fullscreen, center

- **Objetivo:** Adicionar um `useEffect` no `App.tsx` que escuta eventos `keydown` e responde às teclas `1`-`5` (modos de visão), `Q`/`E` (zoom), `Space` (centralizar capital), `F` (fullscreen).
- **Arquivos prováveis:**
  - `src/App.tsx` (adicionar useEffect)
- **Depende de:** Tarefa 5 (centerOnCapital), Tarefa 4 (handleQuickSave — mas NÃO usar nesta tarefa)
- **Passos:**
  1. Em `src/App.tsx`, localizar `ctrl` (já existe como `const ctrl = useGameController(...)`) e `toggleFullScreen` (já existe na linha ~63).
  2. ADICIONAR um NOVO `useEffect` após os `useEffect` existentes (após a linha ~61). NÃO modificar os useEffects existentes.
  3. O useEffect:
     - Define um handler `handleKeyDown = (e: KeyboardEvent) => {}`.
     - **Guarda 1 — foco em input:** se `e.target` for `HTMLInputElement` ou `HTMLTextAreaElement`, retorna imediatamente (não processa hotkey).
     - **Guarda 2 — menu ativo:** se `ui.showMenu === true`, retorna imediatamente.
     - **Guarda 3 — evitar double-fire:** se `e.repeat === true`, retorna imediatamente.
     - Mapeia as teclas:
       - `'1'` → `ui.setViewMode('political')`
       - `'2'` → `ui.setViewMode('economic')`
       - `'3'` → `ui.setViewMode('military')`
       - `'4'` → `ui.setViewMode('diplomatic')`
       - `'5'` → `ui.setViewMode('resources')`
       - `'q'` ou `'Q'` → `ui.setZoom(Math.max(0.5, ui.zoom - 0.2))`
       - `'e'` ou `'E'` → `ui.setZoom(Math.min(3, ui.zoom + 0.2))`
       - `' '` (Space) → `e.preventDefault(); ctrl.centerOnCapital()`
       - `'f'` ou `'F'` → `toggleFullScreen()`
     - Adiciona o listener: `document.addEventListener('keydown', handleKeyDown)`.
     - Retorna cleanup: `return () => document.removeEventListener('keydown', handleKeyDown)`.
  4. Array de dependências: `[ui.showMenu, ui.zoom, ui.setViewMode, ui.setZoom, ctrl.centerOnCapital]` — NOTA: `setViewMode` e `setZoom` são estáveis (vêm de useState), então incluir é seguro.
  5. NÃO incluir hotkeys de ação (`Enter`, `Esc`, `W`, `A`, `S`) nesta tarefa — serão adicionadas na Tarefa 7.
- **Critérios de aceite:**
  - `npm run build` passa sem erros.
  - `npm run lint` passa.
  - As teclas `1`-`5` mudam o modo de visão no HUD.
  - `Q`/`E` ajustam o zoom. `Q` não desce abaixo de 0.5. `E` não sobe acima de 3.
  - `Space` centraliza na capital.
  - `F` alterna tela cheia.
  - Hotkeys NÃO funcionam quando o foco está num `<input>` ou `<textarea>`.
  - Hotkeys NÃO funcionam no menu principal.
  - Tecla mantida pressionada não dispara múltiplas vezes (sem double-fire).
- **Como validar:**
  ```bash
  npm run lint && npm run build
  ```
  Abrir jogo → testar cada tecla listada → verificar que não há erros na consola do browser.
- **Riscos:**
  - As dependências do useEffect podem causar re-subscribe frequente se `ui.zoom` mudar. Isto é aceitável porque o zoom é um número e o handler é leve. Alternativa: usar ref para `ui` mas aumenta complexidade — NÃO fazer.
  - `ctrl.centerOnCapital` precisa existir (depende da Tarefa 5). Se não existir ainda, esta tarefa falha no lint.
  - O `e.key` para Space pode ser `' '` (espaço) ou `'Spacebar'` dependendo do browser. Testar ambos ou usar `e.code === 'Space'`.

---

## Tarefa 7 — Adicionar hotkeys de ação ao mesmo useEffect (Enter, Esc, W, A, S)

- **Objetivo:** Expandir o useEffect de hotkeys criado na Tarefa 6 para incluir teclas de ação de jogo: Enter (encerrar turno), Esc (cancelar ação), W (marchar), A (atacar), S (quick save).
- **Arquivos prováveis:**
  - `src/App.tsx` (editar o useEffect criado na Tarefa 6)
- **Depende de:** Tarefa 6 (useEffect de hotkeys criado), Tarefa 4 (handleQuickSave)
- **Passos:**
  1. Localizar o `useEffect` de hotkeys criado na Tarefa 6 no `App.tsx`.
  2. DENTRO do `handleKeyDown`, após os guardas existentes e ANTES do mapeamento das teclas da Tarefa 6, adicionar os novos casos:
     - `'Enter'` → `e.preventDefault(); ctrl.handleEndTurn()`
     - `'Escape'` → `e.preventDefault();` depois verificar `if (ui.actionState !== 'idle')` → executar a mesma lógica do `onCancelAction` do HUD (linhas ~471-477): `ui.setActionState('idle'); ui.setActionSourceId(null); ui.setPreviewPath([]); ui.setActionBannerMessage(null); ui.setSelectingMoveComposition(false);`. Se `actionState === 'idle'`, não faz nada.
     - `'w'` ou `'W'` → verificar `if (ui.selectedProvinceId && ui.actionState === 'idle')` → obter a província selecionada de `gameState.provinces`, verificar se `prov.ownerId === gameState.playerRealmId`, se sim → invocar o mesmo bloco de `onMapAction('move')` que está nas linhas ~485-497 do App.tsx. Se não houver província selecionada ou não for do jogador, não faz nada (no-op silencioso).
     - `'a'` ou `'A'` → mesma lógica que `W`, mas invocar `onMapAction('attack')` (bloco linhas ~498-503).
     - `'s'` ou `'S'` → verificar `if (!e.ctrlKey && !e.metaKey)` (NÃO interceptar Ctrl+S / Cmd+S). Se true, `e.preventDefault(); ctrl.handleQuickSave()`.
  3. NÃO duplicar os casos de teclas da Tarefa 6 — apenas adicionar os novos casos ao switch/if-chain existente.
  4. As novas teclas herdam automaticamente os guardas da Tarefa 6 (focus em input, menu ativo, repeat).
- **Critérios de aceite:**
  - `Enter` encerra o turno e mostra TurnSummary (se o fim de turno estiver implementado).
  - `Esc` cancela a ação atual (marcha/ataque/scout) e volta ao estado idle.
  - `Esc` com `actionState === 'idle'` não faz nada nem gera erro.
  - `W` com província aliada selecionada e estado idle → ativa modo marcha (banner aparece, preview path aparece).
  - `W` sem província selecionada → nada acontece, sem erro na consola.
  - `A` com província aliada selecionada → ativa modo ataque.
  - `A` sem província selecionada → nada acontece.
  - `S` (sem Ctrl) → quick save (toast "Jogo salvo!" aparece).
  - `Ctrl+S` → comportamento nativo do browser (guardar página) — NÃO é interceptado.
  - `Cmd+S` (Mac) → comportamento nativo — NÃO é interceptado.
- **Como validar:**
  ```bash
  npm run lint && npm run build
  ```
  Testar no browser cada tecla nas várias condições (com/sem província selecionada, com/sem ação ativa, com/sem Ctrl).
- **Riscos:**
  - O bloco de código para `W`/`A` duplica a lógica de `onMapAction` que já existe nas linhas ~485-510 do App.tsx. Isto é intencional (evita refatoração que aumentaria escopo). O coder deve copiar-colar o bloco relevante, adaptando as referências.
  - `handleEndTurn` pode depender de `gameState` não ser null. O guarda implícito (se gameState for null, o jogo não está ativo e `showMenu` é true) cobre isto.
  - Acesso a `gameState.provinces` dentro do handler: `gameState` pode ser null. Adicionar verificação `if (!gameState) return` no início do handler ou antes dos casos W/A.

---

## Tarefa 8 — Adicionar tooltips de hotkey nos botões do HUD

- **Objetivo:** Atualizar os tooltips e labels dos botões do HUD para mostrar a tecla de atalho correspondente, ajudando o jogador a aprender as hotkeys.
- **Arquivos prováveis:**
  - `src/components/HUD.tsx` (editar labels/tooltips/textos dos botões)
- **Depende de:** Tarefa 7 (hotkeys implementadas — os tooltips documentam algo que já funciona)
- **Passos:**
  1. Em `src/components/HUD.tsx`, localizar os botões que têm hotkeys associadas.
  2. Adicionar a dica da tecla nos seguintes locais:
     - **Botão "Encerrar Turno"** (procurar por `onEndTurn` no onClick de um botão): adicionar `[Enter]` ao texto ou tooltip. Ex: `"Encerrar Turno [Enter]"` ou adicionar um `title="Encerrar Turno (Enter)"`.
     - **Botão "Cancelar ação"** (linha ~223-229): adicionar `[Esc]` — ex: `"Cancelar ação [Esc]"`.
     - **Botões de modo de visão** (procurar os botões que chamam `onToggleMode`): adicionar `[1]` a `[5]` conforme o modo. Ex: se existe um botão para o modo Political, o texto deve incluir `[1]`.
     - **Botões de marcha/ataque** (procurar botões que chamam `onMapAction('move')` e `onMapAction('attack')`): adicionar `[W]` e `[A]`.
  3. O formato exato (tooltip via atributo `title`, texto inline, ou badge) fica ao critério do coder, mas deve ser consistente com o estilo existente do HUD. Recomendação: usar `title="Nome da Ação (Tecla)"` para não poluir o UI.
  4. NÃO alterar a funcionalidade dos botões — apenas adicionar informação textual.
  5. NÃO alterar estilos, cores, ou layout.
- **Critérios de aceite:**
  - Passar o rato sobre "Encerrar Turno" mostra tooltip com `[Enter]`.
  - Passar o rato sobre "Cancelar ação" mostra tooltip com `[Esc]`.
  - Os botões de modo de visão (se existirem) mostram as teclas `[1]`-`[5]`.
  - Os botões de marcha/ataque mostram `[W]`/`[A]`.
  - `npm run build` passa sem erros.
- **Como validar:**
  ```bash
  npm run lint && npm run build
  ```
  Abrir o jogo → inspecionar tooltips dos botões no HUD → verificar que cada um mostra a tecla correspondente.
- **Riscos:**
  - O HUD é um ficheiro grande (1003 linhas). Procurar os botões pelo texto ou pela prop onClick para localizar onde adicionar o tooltip.
  - Alguns botões podem não ter tooltip ainda — adicionar o atributo `title` é seguro e não quebra estilos.

---

## Tarefa 9 — Validação final (lint, build, smoke test)

- **Objetivo:** Verificar que todas as tarefas anteriores integram corretamente: lint limpo, build limpo, e as hotkeys funcionam no jogo.
- **Arquivos prováveis:**
  - (nenhum — é verificação, não implementação)
- **Depende de:** Todas as tarefas anteriores (1 a 8)
- **Passos:**
  1. Executar `npm run lint`. O resultado deve ser ZERO erros. Se houver erros, corrigir antes de continuar.
  2. Executar `npm run build`. Deve completar sem erros e sem warnings críticos.
  3. Abrir o jogo no browser e testar manualmente:
     - Menu principal: nenhuma hotkey funciona (teclar 1, Enter, etc. não faz nada).
     - Jogo ativo, sem foco em input: testar TODAS as teclas da tabela abaixo.
     - Jogo ativo, com foco num input (ex: campo de nome ao guardar): nenhuma hotkey funciona.
     - Pressionar e manter uma tecla: não dispara repetidamente.
     - Pressionar Ctrl+S: browser abre diálogo de guardar página (hotkey NÃO interceptada).
  4. Verificar que o botão SFX alterna e persiste após reload.
  5. Verificar tooltips dos botões.
- **Critérios de aceite (checklist completa):**
  - [ ] `npm run lint` — zero erros
  - [ ] `npm run build` — sem erros
  - [ ] `1` → Political, `2` → Economic, `3` → Military, `4` → Diplomatic, `5` → Resources
  - [ ] `Q` → zoom out (−0.2, min 0.5), `E` → zoom in (+0.2, max 3)
  - [ ] `Space` → centraliza na capital
  - [ ] `F` → alterna tela cheia
  - [ ] `Enter` → encerra turno
  - [ ] `Esc` → cancela ação ativa
  - [ ] `W` → inicia marcha (com província aliada selecionada)
  - [ ] `A` → inicia ataque (com província aliada selecionada)
  - [ ] `S` (sem Ctrl) → quick save
  - [ ] `Ctrl+S` → NÃO interceptado
  - [ ] Hotkeys NÃO funcionam com foco em input/textarea
  - [ ] Hotkeys NÃO funcionam no menu principal
  - [ ] Double-fire prevenido (tecla mantida = 1 ação)
  - [ ] `W`/`A` sem província = no-op (sem erro)
  - [ ] Tooltips no HUD mostram teclas
  - [ ] Botão SFX toggle funciona e persiste
  - [ ] `Tone.start()` chamado no primeiro clique (sem erro se falhar)
- **Como validar:**
  ```bash
  npm run lint && npm run build
  ```
  Depois percorrer a checklist acima manualmente no browser.
- **Riscos:**
  - Se alguma tarefa anterior foi mal implementada, esta tarefa apenas DETECTA o problema — não o corrige. Voltar à tarefa relevante e corrigir.

---

## Tabela resumo de hotkeys implementadas

| Tecla | Ação | Tarefa | Condições |
|-------|------|--------|-----------|
| `1` | Modo Political | T6 | Jogo ativo |
| `2` | Modo Economic | T6 | Jogo ativo |
| `3` | Modo Military | T6 | Jogo ativo |
| `4` | Modo Diplomatic | T6 | Jogo ativo |
| `5` | Modo Resources | T6 | Jogo ativo |
| `Q` | Zoom out | T6 | Jogo ativo, min 0.5 |
| `E` | Zoom in | T6 | Jogo ativo, max 3 |
| `Space` | Centralizar capital | T6 | Jogo ativo |
| `F` | Tela cheia | T6 | Sempre |
| `Enter` | Encerrar turno | T7 | Jogo ativo |
| `Esc` | Cancelar ação | T7 | Com ação ativa |
| `W` | Marcha | T7 | Província aliada selecionada, idle |
| `A` | Ataque | T7 | Província aliada selecionada, idle |
| `S` | Quick save | T7 | Jogo ativo, Ctrl NÃO pressionado |
| `Ctrl+S` | Browser save | — | NÃO interceptado |

---

## Sequência recomendada de execução

```
T1 (sfxLogic) ──┬── T2 (tone.js + initAudio)
                └── T3 (botão SFX HUD)

T4 (handleQuickSave) ──┐
T5 (centerOnCapital) ──┼── T6 (hotkeys: modos/zoom/fullscreen) ── T7 (hotkeys: ações) ── T8 (tooltips HUD) ── T9 (validação)
                        │
gameState + useUI ──────┘
```

T1 e T3 podem ser feitas em paralelo. T4 e T5 podem ser feitas em paralelo. T6 depende de T5. T7 depende de T4 e T6. T8 depende de T7.
