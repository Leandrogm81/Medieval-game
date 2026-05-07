# Sprint 04 — Diplomacia: UI e Integração de Turno

> **PRD de origem:** PRD-FASE-1-DIPLOMACIA-HOTKEYS-v2.md §2 (UI — DiplomacyModal, DiplomacyResultModal, §Call to Arms, §Integração no processEndOfTurn)
> **Duração estimada:** 2-2.5 dias
> **Dependências:** Sprint 03 (funções de lógica diplomática implementadas em diplomacyLogic.ts)
> **Pré-requisito para:** Sprint 05 (não depende diretamente, mas completa o sistema de diplomacia)

---

## Objetivo da Sprint

Entregar a interface completa de diplomacia: modal interativo de ações, modal de resultado, modal de Call to Arms, integração com os hooks do React e processamento de fim de turno. No final deste sprint, o jogador pode realizar TODAS as 7 ações diplomáticas através da UI.

---

## Scope: User Stories

### US-01 — Renomear + Criar Modais de Diplomacia
**Como** jogador, **preciso** de um modal interativo para escolher ações diplomáticas e um modal de resultado para ver o desfecho **para** que a experiência diplomática seja completa e imersiva.

**Tarefas:**

1. **Renomear** `src/components/DiplomacyModal.tsx` → `src/components/DiplomacyResultModal.tsx`
   - Preserva a funcionalidade existente (modal passivo que mostra resultado)
   - Atualizar TODOS os imports que referenciam `DiplomacyModal` (usar search_files para garantir)

2. **Criar NOVO** `src/components/DiplomacyModal.tsx` com UI interativa:
   - **Props:** `isOpen`, `onClose`, `targetRealmId`, `gameState`, `playerRealmId`, `onAction`
   - **Layout:**
     - Cabeçalho: "👑 Diplomacia" com botão fechar
     - Barra de relações: "Reino de {name} ❤️ {relations}" com barra de progresso
     - Indicadores: Poder (⚔️), Personalidade (🦅/🕊️)
     - Lista de ações disponíveis (8 botões):
       - 🤝 Melhorar Relações [1 AP]
       - 💢 Enviar Insulto [1 AP]
       - 🛡️ Pacto Não-Agressão [1 AP]
       - ⚔️ Pacto Defensivo [1 AP]
       - 👑 Aliança [2 AP]
       - 💰 Oferecer Tributo [1 AP]
       - 📜 Exigir Tributo [1 AP]
       - 🔥 Declarar Guerra [2 AP]
     - Histórico de eventos (memória): últimos eventos entre os dois reinos
   - **Regras de UI:**
     - Botões desabilitados com tooltip do motivo (usa `canPropose*` do Sprint 02)
     - AP disponível visível no modal
     - AP descontado visualmente ao selecionar ação
     - Feedback via `ui.showToast(message, 'success' | 'error')` com `setTimeout(..., 0)`
     - Modal fecha após ação bem-sucedida (exceto改善 relações/insulto — manter aberto para ações múltiplas)

**Arquivos:** `src/components/DiplomacyModal.tsx`, `src/components/DiplomacyResultModal.tsx`

### US-02 — Modal de Call to Arms
**Como** jogador, **preciso** decidir se honro ou quebro uma aliança quando meu aliado é atacado **para** que a diplomacia tenha consequências estratégicas reais.

**Criar modal `CallToArmsModal.tsx`** (ou integrar no DiplomacyModal):
- **Props:** `isOpen`, `defenderName`, `aggressorName`, `pactType`, `onAccept`, `onRefuse`
- **Layout:**
  - Título: "⚔️ Chamado às Armas!"
  - Corpo: "{defenderName} está sob ataque de {aggressorName}!"
  - Subtexto: "Deseja honrar sua {aliança/pacto defensivo} e entrar na guerra?"
  - Botão "Entrar na Guerra" (verde) → chama `onAccept`
  - Botão "Recusar (quebra o pacto)" (vermelho) → chama `onRefuse`
  - Tooltip no botão de recusar: "Recusar quebrará o pacto e causará −50 relações com {defenderName}"
- **Estilo:** Modal dramático, com ícone de guerra e cores de urgência

**Arquivos:** `src/components/CallToArmsModal.tsx` (criar)

### US-03 — Handlers no useGameController + Estados no useUI
**Como** sistema, **preciso** conectar a UI de diplomacia ao estado do jogo **para** que as ações do jogador tenham efeito real.

**Adicionar em `src/hooks/useGameController.ts`:**

1. **`handleDiplomacyAction(action, payload?)`**
   - Deep clone do gameState: `const clone = JSON.parse(JSON.stringify(gameState))`
   - Validar AP suficiente (`DIPLOMACY_ACTION_COSTS[action]`)
   - Chamar função correspondente de `diplomacyLogic.ts`
   - Se ação retornar `CallToArmsRequest[]`: armazenar em `pendingCallToArms` e abrir modal
   - Deduzir AP: `clone.actionPoints -= DIPLOMACY_ACTION_COSTS[action]`
   - `setGameState(clone)`
   - `setTimeout(() => showToast(...), 0)`

2. **`handleDeclareWar(targetId)`**
   - Deep clone
   - Chamar `declareWar(state, playerId, targetId)`
   - Se retornar `callsToResolve`: pausar para resolver (modal de Call to Arms)
   - Toast: "Guerra declarada contra {realm}!"

3. **`handleCallToArmsResponse(requestId, accepted)`**
   - Deep clone
   - Chamar `resolveCallToArms(state, requestId, accepted)`
   - Fechar modal de Call to Arms
   - Se há mais chamadas pendentes: abrir próximo modal
   - Toast com resultado

**Adicionar em `src/hooks/useUI.ts`:**
- `showDiplomacyModal: boolean`
- `selectedDiplomacyTargetId: string | null`
- `showCallToArmsModal: boolean`
- `pendingCallToArms: CallToArmsRequest[]`

**Arquivos:** `src/hooks/useGameController.ts`, `src/hooks/useUI.ts`

### US-04 — Integração no processEndOfTurn
**Como** sistema, **preciso** que tributos, expiração de NAP e memória de eventos sejam processados a cada turno **para** que o mundo diplomático evolua dinamicamente.

**Modificar `src/logic/turnLogic.ts` — `processEndOfTurn`:**

Nova ordem de processamento (manter passos existentes; adicionar os novos):
1. Processar renda (income de províncias) — existente
2. **Processar tributos:** deduzir `tributeTo` do gold, adicionar em `tributeFrom` do recetor
   - Se gold insuficiente para pagar tributo: −10 relações com o recetor, tributo cancelado, toast "Tributo a {realm} cancelado por falta de fundos."
3. Processar manutenção de tropas — existente
4. **Decrementar timers de NAP:** para cada `napExpiryTurn[realmId] <= turnoAtual`:
   - Remover `realmId` de `nonAggressionPacts`
   - Remover entrada em `napExpiryTurn`
   - Log: "O Pacto de Não-Agressão com {realm} expirou."
5. **População de memória de eventos:**
   - Guerra termina: `lastWarTurn = turnoAtual`, `warExhaustion = 0`
   - Tributo pago com sucesso: +5 help (acumulativo por turno)
6. Processar march orders — existente

**Arquivos:** `src/logic/turnLogic.ts`

### US-05 — Botão Diplomacia no HUD + Testes de Integração
**Como** jogador, **quero** um botão visível para abrir o modal de diplomacia **para** iniciar interações diplomáticas a partir do mapa.

**Adicionar em `src/components/HUD.tsx`:**
- Botão "👑 Diplomacia" no painel de ações
- Só visível com província de outro reino selecionada (targetRealmId !== playerRealmId)
- Ao clicar: `ui.showDiplomacyModal = true` com `selectedDiplomacyTargetId`
- Integrar com hotkey `4` (modo diplomático) — ao entrar no modo diplomático e clicar numa província, abrir modal

**Testes manuais de integração:**
- Fluxo completo: abrir modal → melhorar relações → propor NAP → propor aliança → declarar guerra → Call to Arms → resolver
- Verificar que AP é deduzido corretamente
- Verificar que toasts aparecem após cada ação
- Verificar que gameState é atualizado corretamente (sem mutações)
- Verificar que processEndOfTurn processa tributos e NAP expiry

**Arquivos:** `src/components/HUD.tsx`

---

## Arquivos Afetados

| Arquivo | Ação | User Stories |
|---------|------|-------------|
| `src/components/DiplomacyModal.tsx` | Renomear existente → DiplomacyResultModal; criar NOVO interativo | US-01 |
| `src/components/DiplomacyResultModal.tsx` | Criar (renomeado do antigo DiplomacyModal) | US-01 |
| `src/components/CallToArmsModal.tsx` | **Criar** — modal de decisão de guerra | US-02 |
| `src/hooks/useGameController.ts` | Editar — 3 novos handlers | US-03 |
| `src/hooks/useUI.ts` | Editar — 4 novos estados | US-03 |
| `src/logic/turnLogic.ts` | Editar — tributos + NAP expiry + memória no processEndOfTurn | US-04 |
| `src/components/HUD.tsx` | Editar — botão Diplomacia | US-05 |
| `src/App.tsx` | Verificar — garantir que modais são renderizados condicionalmente | US-01, US-02 |

---

## Critérios de Aceitação

- [ ] DiplomacyModal abre ao clicar em província de outro reino no modo diplomático
- [ ] Barra de relações mostra valor correto e barra de progresso proporcional
- [ ] Botões desabilitados mostram tooltip com motivo (ex: "Relações insuficientes (precisa 50, tem 42)")
- [ ] Melhorar relações: +15 a +25, cap 100, toast informativo
- [ ] Enviar insulto: −15 a −25, floor −100
- [ ] Propor NAP: aceitação calculada, NAP bilateral criado se aceite
- [ ] Propor aliança: 2 AP deduzidos, aliança bilateral se aceite
- [ ] Declarar guerra: 2 AP deduzidos, guerra bilateral, Call to Arms disparado
- [ ] Call to Arms modal aparece quando aliado é atacado
- [ ] Aceitar Call to Arms: guerra declarada automaticamente, +15 relações, +20 help
- [ ] Recusar Call to Arms: pacto quebrado, −50 relações, +20 betrayal
- [ ] Múltiplos Call to Arms: modais aparecem em sequência (não simultaneamente)
- [ ] Botão Diplomacia no HUD visível apenas com província de outro reino selecionada
- [ ] processEndOfTurn: tributo pago deduz gold; se insuficiente, tributo cancelado
- [ ] processEndOfTurn: NAP expira após 20 turnos e é removido sem penalidade
- [ ] Memória de eventos persiste entre turnos
- [ ] Toast após setGameState usa setTimeout(..., 0) — não é engolido pelo batching

---

## Definição de Pronto (DoD)

- [ ] `npm run lint` — zero erros
- [ ] `npm run build` — sem erros (todos os imports atualizados após rename)
- [ ] NENHUMA chamada a `showToast`/`setUI` dentro do updater de `setGameState` (ver §Regras de Arquitetura do PRD)
- [ ] Deep clone (`JSON.parse(JSON.stringify(gameState))`) em TODOS os handlers antes de modificar estado
- [ ] `DiplomacyModal.tsx` antigo renomeado com sucesso — zero imports quebrados (verificar com search_files)
- [ ] `CallToArmsModal` fecha corretamente após decisão
- [ ] `pendingCallToArms` é limpo após todas as chamadas resolvidas
- [ ] Historico no DiplomacyModal mostra últimos 5 eventos relevantes da memória
- [ ] Modo diplomático (tecla `4` do Sprint 01) integrado — clique em província abre modal
