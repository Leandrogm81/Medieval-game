# Sprint 04 — Tarefas Decompostas (para coder simples)

> **Origem:** sprint_04_diplomacia_ui_integracao.md
> **Total de tarefas:** 9
> **Ordem de execução:** sequencial
> **Regras críticas:** NUNCA chamar `showToast`/`setUI` dentro do updater de `setGameState`. Deep clone antes de toda modificação de estado. Usar `setTimeout(() => showToast(...), 0)` após `setGameState`.

---

## Tarefa 1 — Renomear DiplomacyModal.tsx → DiplomacyResultModal.tsx + atualizar imports

- **Objetivo:** Renomear o modal de diplomacia existente (que é passivo, só mostra resultado) para `DiplomacyResultModal` e corrigir TODAS as referências.
- **Arquivos prováveis:**
  - `src/components/DiplomacyModal.tsx` (renomear)
  - `src/components/DiplomacyResultModal.tsx` (novo nome)
  - Todos os ficheiros que importam `DiplomacyModal`
- **Passos:**
  1. Usar `search_files` com pattern `DiplomacyModal` para encontrar TODOS os imports/referências.
  2. Renomear o ficheiro: `mv src/components/DiplomacyModal.tsx src/components/DiplomacyResultModal.tsx`.
  3. Dentro do ficheiro renomeado, mudar o nome do componente exportado: `export const DiplomacyResultModal = ...` (ou `export function DiplomacyResultModal`).
  4. Atualizar TODOS os imports encontrados no passo 1 — mudar `DiplomacyModal` para `DiplomacyResultModal` e ajustar o path se necessário.
  5. NÃO alterar a lógica interna do modal — apenas renomear.
- **Critérios de aceite:**
  - `npm run lint` passa.
  - `npm run build` passa (zero imports quebrados).
  - Nenhuma referência a `DiplomacyModal` (nome antigo) permanece no código.
- **Como validar:**
  ```bash
  npm run lint && npm run build
  search_files "DiplomacyModal" → deve retornar 0 resultados (ou apenas no novo ficheiro com nome DiplomacyResultModal)
  ```
- **Riscos:**
  - Esquecer algum import → build falha. O `search_files` deve encontrar todos.
  - Se o ficheiro é referenciado em `App.tsx`, atualizar a tag JSX também.

---

## Tarefa 2 — Criar NOVO DiplomacyModal.tsx (interativo)

- **Objetivo:** Criar um modal interativo completo para ações diplomáticas com 8 botões de ação, barra de relações, e indicadores.
- **Arquivos prováveis:** `src/components/DiplomacyModal.tsx` (novo — recriar após o rename)
- **Depende de:** Tarefa 1 (rename feito, ficheiro DiplomacyModal.tsx está livre)
- **Passos:**
  1. Criar `src/components/DiplomacyModal.tsx` NOVO.
  2. Props do componente:
     ```typescript
     interface DiplomacyModalProps {
       isOpen: boolean;
       onClose: () => void;
       targetRealmId: string;
       gameState: GameState;
       onAction: (action: DiplomacyAction, payload?: any) => void;
       playerRealmId: string;
     }
     ```
  3. Layout:
     - Overlay escuro com `z-50`, centralizado.
     - Cabeçalho: "👑 Diplomacia com {targetRealm.name}".
     - Barra de relações: `"❤️ {relations}"` com barra de progresso colorida (verde se > 50, amarela 0-50, vermelha < 0).
     - Indicadores: poder militar relativo, personalidade (emoji).
     - Lista de 8 botões de ação, cada um com:
       - Ícone + nome + custo AP
       - Desabilitado se `!canPropose*(...).valid`, com tooltip mostrando `reason`
       - onClick chama `onAction(action, payload?)`
     - Secção "Histórico": últimos 5 eventos da memória entre os dois reinos.
  4. Importar `canPropose*` e `DIPLOMACY_ACTION_COSTS` dos módulos de lógica.
  5. Importar `DiplomacyAction` de types.
  6. Usar `motion` para animações de entrada/saída (como os outros modais).
  7. NÃO implementar lógica de estado aqui — apenas UI. A lógica está nos handlers (Tarefa 5).
- **Critérios de aceite:**
  - Modal abre com `isOpen=true` e fecha com `onClose` ou botão X.
  - Barra de relações mostra valor correto e cor apropriada.
  - Botões desabilitados mostram tooltip com motivo (ex: "Relações insuficientes (precisa 50, tem 35)").
  - 8 botões visíveis com ícones e custo AP.
  - Histórico mostra eventos da memória (se vazio, mostrar "Sem eventos registrados").
- **Como validar:** `npm run lint && npm run build`
- **Riscos:**
  - Não duplicar lógica de validação — usar as funções `canPropose*` importadas.
  - O modal não deve modificar estado diretamente — apenas chamar `onAction`.

---

## Tarefa 3 — Criar CallToArmsModal.tsx

- **Objetivo:** Criar modal de decisão para quando o jogador é chamado às armas por um aliado.
- **Arquivos prováveis:** `src/components/CallToArmsModal.tsx` (novo)
- **Depende de:** Nenhuma (usa props simples)
- **Passos:**
  1. Criar `src/components/CallToArmsModal.tsx`.
  2. Props:
     ```typescript
     interface CallToArmsModalProps {
       isOpen: boolean;
       defenderName: string;
       aggressorName: string;
       pactType: 'alliance' | 'defensivePact';
       onAccept: () => void;
       onRefuse: () => void;
     }
     ```
  3. Layout:
     - Título: "⚔️ Chamado às Armas!"
     - Corpo: "{defenderName} está sob ataque de {aggressorName}!"
     - Subtexto: "Deseja honrar sua {aliança/pacto defensivo} e entrar na guerra?"
     - Botão verde "Entrar na Guerra" → `onAccept`
     - Botão vermelho "Recusar (quebra o pacto)" → `onRefuse`
     - Tooltip no botão vermelho: "Recusar quebrará o pacto e causará −50 relações com {defenderName}"
  4. Usar `motion` para entrada dramática. Cores de urgência (vermelho, laranja).
  5. Sem lógica de negócio — apenas UI.
- **Critérios de aceite:**
  - Modal abre com `isOpen=true`.
  - Botão aceitar chama `onAccept`.
  - Botão recusar chama `onRefuse`.
  - Texto reflete corretamente `pactType` ("aliança" ou "pacto defensivo").
- **Como validar:** `npm run lint && npm run build`
- **Riscos:**
  - Esquecer de exportar o componente.

---

## Tarefa 4 — Adicionar estados de UI para diplomacia (useUI.ts)

- **Objetivo:** Adicionar ao hook `useUI` os estados necessários para controlar os modais de diplomacia.
- **Arquivos prováveis:** `src/hooks/useUI.ts`
- **Passos:**
  1. Abrir `src/hooks/useUI.ts`.
  2. Adicionar 4 novos estados (usar `useState`):
     - `showDiplomacyModal: boolean` (default: `false`)
     - `selectedDiplomacyTargetId: string | null` (default: `null`)
     - `showCallToArmsModal: boolean` (default: `false`)
     - `pendingCallToArms: CallToArmsRequest[]` (default: `[]`)
  3. Adicionar os setters ao objeto de retorno do hook (junto com os existentes).
  4. Importar `CallToArmsRequest` de `../types`.
  5. NÃO alterar estados existentes — só adicionar os novos.
- **Critérios de aceite:**
  - `npm run lint` passa.
  - Os 4 novos estados aparecem no retorno de `useUI`.
  - `pendingCallToArms` é inicializado como array vazio.
- **Como validar:** `npm run lint && npm run build`
- **Riscos:**
  - A ordem no retorno não importa (é um objeto com nomes).
  - Não esquecer de importar `CallToArmsRequest`.

---

## Tarefa 5 — Adicionar handlers de diplomacia ao useGameController

- **Objetivo:** Criar handlers que conectam a UI de diplomacia às funções de lógica pura, gerindo deep clone, AP, e toasts.
- **Arquivos prováveis:** `src/hooks/useGameController.ts`
- **Depende de:** Tarefas 4 (useUI), Sprint 03 completo (funções em diplomacyLogic.ts)
- **Passos:**
  1. Abrir `src/hooks/useGameController.ts`.
  2. Importar TODAS as funções de `../logic/diplomacyLogic` e `DIPLOMACY_ACTION_COSTS`.
  3. Adicionar handler `handleDiplomacyAction`:
     ```typescript
     const handleDiplomacyAction = useCallback((action: DiplomacyAction, payload?: any) => {
       if (!gameState) return;
       const cost = DIPLOMACY_ACTION_COSTS[action];
       if (playerRealm.actionPoints < cost) {
         ui.showToast("Pontos de ação insuficientes.", "error");
         return;
       }
       const clone = deepClone(gameState);
       // switch por ação, chamar função correspondente
       // ...
       clone.realms[playerId].actionPoints -= cost;
       setGameState(clone);
       setTimeout(() => ui.showToast("...", "success"), 0);
     }, [gameState, ui]);
     ```
  4. Para ações unilaterais (`improveRelations`, `sendInsult`): chamar a função que retorna delta, aplicar ao clone, NÃO fechar o modal (permite múltiplas ações).
  5. Para ações bilaterais: fechar modal após ação (`ui.setShowDiplomacyModal(false)`).
  6. Para `declareWar`: chamar `declareWar` que retorna `callsToResolve`. Armazenar em `ui.setPendingCallToArms(callsToResolve)`.
  7. Adicionar handler `handleCallToArmsResponse`:
     - Recebe `requestId` e `accepted: boolean`.
     - Deep clone, chamar `resolveCallToArms(state, requestId, accepted)`.
     - Remover o request resolvido de `pendingCallToArms`.
     - Se há mais chamadas pendentes: abrir próximo modal (pegar primeiro da fila).
     - Toast com resultado.
  8. Adicionar ao retorno do hook: `handleDiplomacyAction`, `handleCallToArmsResponse`.
- **Critérios de aceite:**
  - Ações unilaterais não fecham o modal.
  - Ações bilaterais fecham o modal após sucesso.
  - `declareWar` dispara Call to Arms e armazena no estado.
  - `handleCallToArmsResponse` processa um request e avança para o próximo.
  - Deep clone em todas as modificações.
  - Toast via `setTimeout(..., 0)`.
- **Como validar:** `npm run lint && npm run build`
- **Riscos:**
  - **CRÍTICO:** Não chamar `showToast` dentro do updater do `setGameState`. Sempre: `setGameState(clone); setTimeout(() => showToast(...), 0);`.
  - `playerRealm.actionPoints` pode ser `undefined`. Usar `?? 0`.
  - O switch precisa cobrir todos os 8 tipos de `DiplomacyAction`.

---

## Tarefa 6 — Integrar tributos e NAP expiry no processEndOfTurn

- **Objetivo:** Adicionar processamento de tributos e expiração de NAP ao ciclo de fim de turno.
- **Arquivos prováveis:** `src/logic/turnLogic.ts`
- **Depende de:** Sprint 03 (funções de tributo existem)
- **Passos:**
  1. Abrir `src/logic/turnLogic.ts`. Localizar `processEndOfTurn`.
  2. Após processar renda e ANTES de processar manutenção de tropas, adicionar bloco "Processar Tributos":
     - Para cada reino, para cada entrada em `tributeTo`:
       - `amount = realm.tributeTo[targetId]`.
       - Se `realm.gold >= amount`: `realm.gold -= amount`, `targetRealm.gold += amount`.
       - Se `realm.gold < amount`: tributo cancelado — remover entrada, −10 relações, log "Tributo a {realm} cancelado por falta de fundos."
  3. Após manutenção de tropas, adicionar bloco "Expiração de NAP":
     - Para cada reino, para cada entrada em `napExpiryTurn`:
       - Se `napExpiryTurn[realmId] <= state.turn`:
         - Remover `realmId` de `nonAggressionPacts` bilateralmente.
         - Remover entrada em `napExpiryTurn` bilateralmente.
         - Log: "O Pacto de Não-Agressão com {realm} expirou."
  4. NÃO usar deep clone aqui — `processEndOfTurn` já recebe estado clonado do `handleEndTurn`.
  5. Manter TODOS os passos existentes de `processEndOfTurn` intactos. Apenas inserir os novos blocos na ordem correta.
- **Critérios de aceite:**
  - Tributo pago com sucesso: gold transferido.
  - Tributo com fundos insuficientes: cancelado, −10 relações, log.
  - NAP expira após `turn >= napExpiryTurn[realmId]` — removido sem penalidade.
  - Renda e manutenção existentes continuam a funcionar.
- **Como validar:** `npm run lint && npm run build`
- **Riscos:**
  - Modificar `state` durante a iteração de `Object.entries(state.realms)` pode causar problemas. Iterar sobre `Object.keys` primeiro e coletar alterações, depois aplicar.
  - `napExpiryTurn` pode ter entradas para reinos que já não existem. Verificar `state.realms[realmId]` antes de aceder.

---

## Tarefa 7 — Adicionar botão Diplomacia no HUD

- **Objetivo:** Adicionar um botão visível no HUD que abre o modal de diplomacia quando uma província de outro reino está selecionada.
- **Arquivos prováveis:** `src/components/HUD.tsx`
- **Depende de:** Tarefas 2 (DiplomacyModal), 4 (useUI)
- **Passos:**
  1. Abrir `src/components/HUD.tsx`.
  2. Adicionar nova prop: `onDiplomacy: (targetRealmId: string) => void`.
  3. No painel de ações (zona onde estão os botões de marcha/ataque), adicionar botão:
     - Texto: "👑 Diplomacia"
     - Visível APENAS quando `selectedProvinceId` pertence a outro reino (`ownerId !== playerRealmId && ownerId !== 'neutral'`).
     - onClick: `onDiplomacy(selectedProvince.ownerId)`.
  4. Estilo consistente com os botões existentes.
  5. NÃO alterar outros botões ou lógica do HUD.
- **Critérios de aceite:**
  - Botão visível com província inimiga selecionada.
  - Botão oculto com província própria ou neutra selecionada.
  - Botão oculto sem província selecionada.
- **Como validar:** `npm run lint && npm run build`
- **Riscos:**
  - A prop `onDiplomacy` precisa ser passada de App.tsx → HUD (ver Tarefa 8).

---

## Tarefa 8 — Ligar modais e handlers no App.tsx

- **Objetivo:** Conectar todos os modais de diplomacia, handlers e o botão do HUD no componente raiz.
- **Arquivos prováveis:** `src/App.tsx`
- **Depende de:** Tarefas 1-7
- **Passos:**
  1. Abrir `src/App.tsx`.
  2. Importar `DiplomacyModal` (novo), `DiplomacyResultModal` (renomeado), `CallToArmsModal`.
  3. Adicionar renderização condicional dos modais:
     - `<DiplomacyModal>` quando `ui.showDiplomacyModal && ui.selectedDiplomacyTargetId`.
     - `<CallToArmsModal>` quando `ui.showCallToArmsModal && ui.pendingCallToArms.length > 0`.
  4. Passar `onDiplomacy` para `<HUD>`:
     - `onDiplomacy={(targetId) => { ui.setSelectedDiplomacyTargetId(targetId); ui.setShowDiplomacyModal(true); }}`.
  5. Integrar com modo diplomático (tecla `4`): ao clicar numa província no modo diplomático → abrir modal (similar ao `onMapAction` mas para diplomacia).
  6. NÃO quebrar os modais existentes (Chronicle, Save, Instructions, etc.).
- **Critérios de aceite:**
  - DiplomacyModal abre ao clicar "Diplomacia" no HUD.
  - DiplomacyModal abre ao clicar província no modo diplomático (tecla `4`).
  - CallToArmsModal abre quando há chamadas pendentes.
  - Modais existentes continuam a funcionar.
- **Como validar:** `npm run lint && npm run build`
- **Riscos:**
  - Conflito de `z-index` entre modais. Usar `z-50` para modais de diplomacia.
  - Múltiplos modais abertos simultaneamente → apenas o último deve ser visível.

---

## Tarefa 9 — Validação final

- **Objetivo:** Verificar integração completa do sistema de diplomacia.
- **Arquivos prováveis:** (nenhum)
- **Depende de:** Tarefas 1 a 8
- **Passos:**
  1. `npm run lint` — zero erros.
  2. `npm run build` — sem erros.
  3. Testar fluxo completo no browser.
  4. Verificar AP deduzido corretamente.
  5. Verificar toasts aparecem após ações.
  6. Verificar que `processEndOfTurn` processa tributos e NAP expiry.
- **Critérios de aceite:** (ver checklist completa na sprint original)
- **Como validar:** `npm run lint && npm run build`
- **Riscos:** Nenhum novo — apenas deteção de problemas das tarefas anteriores.
