# Sprint 05 — Tarefas Decompostas (para coder simples)

> **Origem:** sprint_05_combate_gestao_imperial.md
> **Total de tarefas:** 7
> **Ordem de execução:** sequencial (T1-T3: Army Retreat; T4-T6: Ações em Massa; T7: Validação)
> **Regras:** Funções puras quando em `src/logic/`. Deep clone nos handlers. Não modificar estado dentro de updaters de setState.

---

## Tarefa 1 — Adicionar getRetreatDestination + calculateRetreat (combatLogic.ts)

- **Objetivo:** Criar duas funções puras para calcular o destino e a composição de tropas em recuo após derrota.
- **Arquivos prováveis:** `src/logic/combatLogic.ts`
- **Passos:**
  1. Abrir `src/logic/combatLogic.ts`.
  2. Adicionar função `getRetreatDestination(state: GameState, defeatedProvinceId: string, realmId: string): string | null`:
     - Se `defeatedProvinceId` não existe em `state.provinces` → retornar `null`.
     - Obter a província derrotada: `prov = state.provinces[defeatedProvinceId]`.
     - Filtrar `prov.neighbors` que pertencem a `realmId` (ownerId === realmId).
     - Se nenhuma → retornar `null`.
     - Se múltiplas → escolher a com maior `troops` (mais segura). Em caso de empate, a primeira.
  3. Adicionar função `calculateRetreat(remainingArmy: Army, retreatRatio = 0.3): Army`:
     - Para cada tipo de tropa (`infantry`, `archers`, `cavalry`, `scouts`):
       - `count = Math.floor(remainingArmy[unitType] * retreatRatio)`.
       - **Mínimo de 1:** se `remainingArmy[unitType] > 0` e `count === 0`, usar 1.
     - Retornar novo objeto Army com os valores calculados.
     - Se `remainingArmy` tem total 0 → retornar `{ infantry: 0, archers: 0, cavalry: 0, scouts: 0 }`.
  4. Ambas as funções são PURAS — não modificam estado.
  5. Exportar as funções.
- **Critérios de aceite:**
  - `getRetreatDestination` com 1 vizinho amigável → retorna esse vizinho.
  - `getRetreatDestination` com 0 vizinhos amigáveis → `null`.
  - `getRetreatDestination` com província inexistente → `null`.
  - `calculateRetreat({ infantry: 10, archers: 3, cavalry: 5, scouts: 0 })` → `{ infantry: 3, archers: 1, cavalry: 1, scouts: 0 }` (mínimo 1 para archers e cavalry, mesmo que 30% de 3 = 0.9 → floor 0, mas mínimo 1).
  - Army vazio → retorna Army com zeros.
- **Como validar:** `npm run lint && npm run build`
- **Riscos:**
  - `remainingArmy[unitType]` pode ser undefined. Usar `remainingArmy[unitType] || 0`.
  - A lógica de mínimo 1: testar com 1 unidade (30% de 1 = 0, mas mínimo 1 → 1 recua).

---

## Tarefa 2 — Integrar recuo no finishAttack (turnLogic.ts)

- **Objetivo:** Modificar o fluxo de combate para que tropas derrotadas recuem em vez de desaparecer.
- **Arquivos prováveis:** `src/logic/turnLogic.ts`
- **Depende de:** Tarefa 1
- **Passos:**
  1. Abrir `src/logic/turnLogic.ts`. Localizar `finishAttack` (dentro de `processMarchOrders`).
  2. Importar `getRetreatDestination`, `calculateRetreat` de `./combatLogic`.
  3. Após a resolução do combate (`const result = resolveCombat(...)`), adicionar:

     **Atacante derrotado** (`!result.won` e `order.realmId` é o atacante):
     - `retreatDest = getRetreatDestination(state, prov.id, order.realmId)`.
     - Se `retreatDest` não nulo:
       - `retreating = calculateRetreat(result.attackerRemaining)`.
       - Adicionar `retreating` às tropas da província de destino.
       - `destProv.troops = destProv.army.infantry + destProv.army.archers + destProv.army.cavalry + destProv.army.scouts`.
       - Log: "DERROTA! {total} tropas recuaram para {destProv.name}."

     **Defensor derrotado** (`result.won`):
     - `retreatDest = getRetreatDestination(state, prov.id, prov.ownerId)`.
     - Mesmo fluxo, usando `result.defenderRemaining`.

  4. NÃO alterar o fluxo de vitória/derrota existente — apenas ADICIONAR o recuo.
  5. O estado recebido por esta função já é deep clone do `processMarchOrders`.
- **Critérios de aceite:**
  - Atacante perde batalha → tropas sobreviventes recuam para província vizinha amigável.
  - Defensor perde batalha → tropas sobreviventes recuam.
  - Sem vizinho amigável → tropas perdidas (comportamento atual, sem crash).
  - `destProv.troops` atualizado corretamente após adicionar tropas recuadas.
- **Como validar:** `npm run lint && npm run build`
- **Riscos:**
  - `result.attackerRemaining` pode não existir. Verificar a assinatura de `resolveCombat` primeiro.
  - Aceder `state.provinces[retreatDest]` quando `retreatDest` pode ser null → adicionar verificação.

---

## Tarefa 3 — Atualizar BattleOutcomeModal com detalhes do recuo

- **Objetivo:** Mostrar no modal de resultado de batalha quantas tropas recuaram e para onde.
- **Arquivos prováveis:** `src/components/BattleOutcomeModal.tsx`
- **Depende de:** Tarefa 2
- **Passos:**
  1. Abrir `src/components/BattleOutcomeModal.tsx`.
  2. Verificar as props atuais. Se necessário, adicionar nova prop opcional:
     - `retreatInfo?: { count: number; destinationName: string; composition: Army }`.
  3. No corpo do modal, se `retreatInfo` existe e `retreatInfo.count > 0`:
     - Adicionar secção "🏃 Recuo":
       - "{N} tropas recuaram para {destinationName}"
       - "Composição: ⚔️{infantry} 🏹{archers} 🐴{cavalry} 🦇{scouts}"
  4. Se `retreatInfo` não existe ou count = 0 → não mostrar secção.
  5. NÃO alterar o layout existente de vitória/derrota — apenas adicionar abaixo.
- **Critérios de aceite:**
  - Modal de derrota mostra detalhes do recuo.
  - Modal de vitória (onde o inimigo recuou) também pode mostrar (opcional).
  - Se não houve recuo, a secção não aparece.
- **Como validar:** `npm run lint && npm run build`
- **Riscos:**
  - O componente BattleOutcomeModal pode ser usado em vários locais. Garantir que a nova prop é opcional (`retreatInfo?`) para não quebrar usos existentes.

---

## Tarefa 4 — Adicionar funções de ação em massa (economyLogic.ts)

- **Objetivo:** Criar funções para executar ações económicas em todas as províncias do reino de uma vez.
- **Arquivos prováveis:** `src/logic/economyLogic.ts`
- **Passos:**
  1. Abrir `src/logic/economyLogic.ts`.
  2. Adicionar `estimateMassActionCost(state, realmId, costGold, costMaterials?): { totalCostGold: number; totalCostMaterials: number; affectedCount: number }`:
     - Contar províncias do reino (`ownerId === realmId`).
     - Multiplicar pelo custo unitário.
     - Função pura de consulta.
  3. Adicionar `massAssimilate(state, realmId): { count: number; cost: number }`:
     - Para cada província do reino (ordenadas por distância da capital, mais próximas primeiro):
       - Se `realm.gold >= 50` e `prov.loyalty < 100`:
         - `realm.gold -= 50`, `prov.loyalty = Math.min(100, prov.loyalty + 5)`, `count++`.
       - Se gold insuficiente → parar (não processa mais províncias).
     - Retornar `{ count, cost: count * 50 }`.
  4. Adicionar `massInvest(state, realmId): { count: number; cost: number }`:
     - Similar: +10 wealth por província, custo 100 gold cada.
  5. Adicionar `massBuildFarms(state, realmId): { count: number; costGold: number; costMaterials: number }`:
     - Custo: 100 gold + 50 materials por província.
     - +1 farm onde possível.
     - Só age se a província tem resource compatível (wood — verificar no gameState ou tipo Province).
  6. Adicionar `massBuildMines`, `massBuildWorkshops`, `massBuildCourts`:
     - Custos: Mines=150g+75m, Workshops=200g+100m, Courts=300g+150m.
     - Cada uma verifica resource relevante: Mines precisa de mountain terrain? Verificar no tipo Province.
  7. Todas as funções assumem estado deep-clonado (modificam o objeto recebido).
  8. Ordenação por distância da capital: reutilizar `calculateDistancesFromCapital` de turnLogic.ts se já existir, ou calcular BFS simples a partir de `realm.capitalId`.
- **Critérios de aceite:**
  - `estimateMassActionCost` retorna valores corretos.
  - `massAssimilate` com 5 províncias e 300 gold → 5 assimiladas, custo 250.
  - `massAssimilate` com gold insuficiente → processa máximo possível, prioridade capital.
  - loyalty já em 100 → província saltada.
  - `massBuildFarms` com província sem resource → saltada.
- **Como validar:** `npm run lint && npm run build`
- **Riscos:**
  - A estrutura de resources por província (`strategicResource`) precisa ser verificada no tipo Province.
  - A ordenação por distância requer `realm.capitalId`. Se não existir, usar a primeira província do reino.
  - Evitar loops infinitos: a lista de províncias é finita.

---

## Tarefa 5 — Adicionar handleMassAction ao useGameController

- **Objetivo:** Criar o handler que conecta os botões de ação em massa às funções de economia.
- **Arquivos prováveis:** `src/hooks/useGameController.ts`
- **Depende de:** Tarefa 4
- **Passos:**
  1. Abrir `src/hooks/useGameController.ts`.
  2. Importar funções mass* de `../logic/economyLogic`.
  3. Adicionar `handleMassAction`:
     - Recebe `actionType: 'assimilate' | 'invest' | 'buildFarms' | 'buildMines' | 'buildWorkshops' | 'buildCourts'`.
     - Deep clone do gameState.
     - Chamar função mass* correspondente.
     - Deduzir gold/materials do reino (a função mass* já faz isso — verificar).
     - `setGameState(clone)`.
     - `setTimeout(() => showToast("{action} concluída em {N} províncias. Custo: {cost}g."), 0)`.
  4. Adicionar ao retorno do hook.
- **Critérios de aceite:**
  - Ação em massa funciona com deep clone.
  - Toast mostra resumo correto.
  - Gold/materials deduzidos corretamente.
- **Como validar:** `npm run lint && npm run build`
- **Riscos:**
  - MESMA regra: NÃO chamar showToast dentro do updater. Fazer `setGameState(clone); setTimeout(...)`.

---

## Tarefa 6 — Adicionar UI de Ações em Massa no HUD

- **Objetivo:** Adicionar botão e submenu de ações em massa no painel económico do HUD.
- **Arquivos prováveis:** `src/components/HUD.tsx`
- **Depende de:** Tarefa 5
- **Passos:**
  1. Abrir `src/components/HUD.tsx`.
  2. Adicionar nova prop: `onMassAction: (actionType: string) => void`.
  3. No painel económico, adicionar botão "⚡ Ações em Massa".
  4. Ao clicar, expandir submenu com 6 opções:
     - "Assimilar Todas (50 ouro/prov)" — chama `onMassAction('assimilate')`
     - "Investir em Todas (100 ouro/prov)" — `onMassAction('invest')`
     - "Construir Farms (100 ouro + 50 materiais/prov)"
     - "Construir Mines (150 ouro + 75 materiais/prov)"
     - "Construir Workshops (200 ouro + 100 materiais/prov)"
     - "Construir Courts (300 ouro + 150 materiais/prov)"
  5. Mostrar estimativa de custo em cada opção (usar `estimateMassActionCost` — importar).
  6. NÃO alterar outros botões.
- **Critérios de aceite:**
  - Botão visível no HUD.
  - Submenu expande ao clicar.
  - Cada opção mostra custo estimado.
  - Gold insuficiente → botão desabilitado.
- **Como validar:** `npm run lint && npm run build`
- **Riscos:**
  - O HUD já tem muitos botões. Adicionar em secção colapsável ou com scroll.
  - Import de `estimateMassActionCost` num componente React é OK (é função pura, não hook).

---

## Tarefa 7 — Validação final

- **Objetivo:** Verificar Army Retreat e Ações em Massa.
- **Arquivos prováveis:** (nenhum)
- **Depende de:** Tarefas 1 a 6
- **Passos:**
  1. `npm run lint` — zero erros.
  2. `npm run build` — sem erros.
  3. Testar recuo: provocar derrota em batalha, verificar tropas recuam.
  4. Testar ações em massa: verificar gold deduzido, loyalty/wealth/buildings atualizados.
  5. Testar edge cases: gold 0, províncias sem resource, 0 províncias.
- **Critérios de aceite:** (checklist da sprint original)
- **Como validar:** `npm run lint && npm run build`
