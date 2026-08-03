# Sprint 02 quebrada em tarefas menores — Capitulação (Auto-Surrender)

> **Coder:** 🟢 BARATO (T1-T4, T7-T9) | 🔴 FORTE (T5, T6)
> **Subpasta de destino:** `tarefas/sprint-02/`

---

## Tarefa 1 — Adicionar originalOwnerId em Province (types.ts)
- **Objetivo:** Criar o campo `originalOwnerId` na interface `Province`.
- **Arquivos prováveis:** `src/types.ts`
- **Passos:**
  1. Em `Province`, adicionar após `siegeDamage` (linha 51):
     ```typescript
     originalOwnerId?: string;
     ```
  2. `npx tsc --noEmit`
- **Critérios de aceite:** `tsc --noEmit` passa
- **Como validar:** `npx tsc --noEmit`
- **Riscos:** Nenhum — campo opcional

---

## Tarefa 2 — Adicionar interface CapitulationResult (types.ts)
- **Objetivo:** Criar a interface para o resultado da capitulação.
- **Arquivos prováveis:** `src/types.ts`
- **Passos:**
  1. Adicionar após as interfaces existentes:
     ```typescript
     export interface CapitulationResult {
       winnerId: string;
       loserId: string;
       occupationRatio: number;
       provincesToCede: string[];
     }
     ```
  2. `npx tsc --noEmit`
- **Critérios de aceite:** `tsc --noEmit` passa
- **Como validar:** `npx tsc --noEmit`
- **Riscos:** Nenhum

---

## Tarefa 3 — Setar originalOwnerId ao conquistar (turnLogic.ts - processMarchOrders)
- **Objetivo:** Salvar o dono original quando uma província é conquistada em guerra.
- **Arquivos prováveis:** `src/logic/turnLogic.ts`
- **Passos:**
  1. Em `processMarchOrders`, localizar `prov.ownerId = baseOrder.realmId` (linha 290)
  2. ANTES dessa linha, adicionar:
     ```typescript
     if (defenderRealmId !== 'neutral') {
       prov.originalOwnerId = prov.ownerId;
     }
     ```
  3. `npx tsc --noEmit`
- **Critérios de aceite:** Ao conquistar província de outro reino em guerra, `originalOwnerId` é setado com o owner anterior
- **Como validar:** `npm run build && npm run dev` — declarar guerra, conquistar província, verificar `gameState.provinces[id].originalOwnerId` no console
- **Riscos:** `defenderRealmId` pode não estar disponível no escopo. Verificar se a variável existe no bloco (linha 270: `const defenderRealmId = prov.ownerId`)

---

## Tarefa 4 — Setar originalOwnerId ao conquistar (aiLogic.ts - executeAIAttack)
- **Objetivo:** Mesmo comportamento para conquistas da IA.
- **Arquivos prováveis:** `src/logic/aiLogic.ts`
- **Passos:**
  1. Em `executeAIAttack`, localizar `defenderProv.ownerId = realmId` (linha 68)
  2. ANTES dessa linha, adicionar:
     ```typescript
     const oldOwner = defenderProv.ownerId;
     if (oldOwner !== 'neutral') {
       defenderProv.originalOwnerId = oldOwner;
     }
     ```
  3. `npx tsc --noEmit`
- **Critérios de aceite:** IA conquistando província também seta `originalOwnerId`
- **Como validar:** `npm run build && npm run dev` — observar guerras da IA, verificar `originalOwnerId`
- **Riscos:** A variável `oldOwner` já existe na linha 67. Reutilizá-la

---

## Tarefa 5 — Limpar originalOwnerId ao fim da guerra (turnLogic.ts)
- **Objetivo:** Limpar `originalOwnerId` quando a guerra termina.
- **Arquivos prováveis:** `src/logic/turnLogic.ts`
- **Passos:**
  1. Em `processActiveWars`, no bloco onde `warsToFinish.push(war.id)` (linha 437), adicionar limpeza:
     ```typescript
     Object.values(state.provinces).forEach(p => {
       if (p.originalOwnerId === war.attackerId || p.originalOwnerId === war.defenderId) {
         p.originalOwnerId = undefined;
       }
     });
     ```
  2. `npx tsc --noEmit`
- **Critérios de aceite:** Após guerra terminar, `originalOwnerId` é `undefined` nas províncias dos beligerantes
- **Como validar:** `npm run build && npm run dev` — terminar guerra, verificar províncias
- **Riscos:** Certificar de limpar ANTES de remover a guerra do array `state.activeWars`

---

## Tarefa 6 — Implementar checkCapitulation (turnLogic.ts)
- **Objetivo:** Função que decide se um reino deve capitular.
- **Arquivos prováveis:** `src/logic/turnLogic.ts`
- **Passos:**
  1. Criar função `checkCapitulation(state: GameState, war: War): CapitulationResult | null`
  2. Lógica:
     - Contar províncias do defensor com `originalOwnerId === war.defenderId` e `ownerId === war.attackerId` (ocupadas)
     - `totalDefenderProvinces` = províncias com `ownerId === defenderId` OU `originalOwnerId === defenderId`
     - `occupationRatio = occupied / totalDefenderProvinces`
     - `capitalCaptured = state.provinces[defender.capitalId]?.ownerId === war.attackerId`
     - Se `occupationRatio > 0.6` OU `war.warScore > 70` OU (`capitalCaptured && war.warScore > 50`): retornar resultado
     - Senão: `null`
  3. `npx tsc --noEmit`
- **Critérios de aceite:** Função retorna resultado quando condições são atingidas, `null` caso contrário
- **Como validar:** `npx tsc --noEmit`
- **Riscos:** `defender.capitalId` pode ser undefined. Usar `defender.capitalId || ''`

---

## Tarefa 7 — Implementar selectProvincesToCede (turnLogic.ts)
- **Objetivo:** Selecionar quais províncias ocupadas serão cedidas (as mais distantes).
- **Arquivos prováveis:** `src/logic/turnLogic.ts`
- **Passos:**
  1. Criar função `selectProvincesToCede(state, occupiedIds, defender, fraction)`
  2. Para cada província ocupada, calcular distância BFS até a capital do defensor
  3. Reutilizar `findPath` existente ou `calculateDistancesFromCapital`
  4. Ordenar por distância (mais distantes primeiro)
  5. Retornar `Math.ceil(occupiedIds.length * fraction)` primeiras
- **Critérios de aceite:** Províncias cedidas são as mais distantes da capital
- **Como validar:** `npx tsc --noEmit`
- **Riscos:** `findPath` existente (linha 89) filtra por `realmId`. Pode precisar de BFS sem filtro de owner

---

## Tarefa 8 — Implementar executeCapitulation (turnLogic.ts) 🔴 FORTE
- **Objetivo:** Aplicar os efeitos da capitulação no estado do jogo.
- **Arquivos prováveis:** `src/logic/turnLogic.ts`
- **Passos:**
  1. Criar função `executeCapitulation(state, result)`
  2. Transferir `provincesToCede` para o vencedor: `prov.ownerId = winnerId; prov.originalOwnerId = undefined`
  3. Limpar `originalOwnerId` de TODAS as províncias envolvidas na guerra
  4. Verificar se defensor ainda tem províncias:
     - Sim: `defender.vassalOf = winnerId; winner.vassals.push(defenderId)`
     - Não: `delete state.realms[defenderId]` (eliminado)
  5. Penalidade: -20 loyalty em todas as províncias do vencedor por 5 turnos (adicionar tracking `realm.postWarInstability: number`)
  6. Remover guerra de `state.activeWars`
  7. Limpar `attacker.wars` e `defender.wars`
- **Critérios de aceite:** Efeitos aplicados corretamente. Estado consistente
- **Como validar:** `npm run build && npm run dev` — forçar capitulação, verificar vassalagem/eliminação
- **Riscos:** `delete state.realms[id]` pode quebrar referências em outros lugares. Verificar se `attacker.wars` e `defender.wars` são limpos antes

---

## Tarefa 9 — Integrar checkCapitulation em processActiveWars 🔴 FORTE
- **Objetivo:** Inserir a checagem de capitulação no fluxo de guerras.
- **Arquivos prováveis:** `src/logic/turnLogic.ts`
- **Passos:**
  1. Em `processActiveWars`, após o loop de batalhas e ANTES do cálculo de exaustão
  2. Adicionar segundo loop sobre `activeWars`:
     ```typescript
     for (const war of state.activeWars) {
       const result = checkCapitulation(state, war);
       if (result) {
         executeCapitulation(state, result);
         continue; // pular exaustão para esta guerra
       }
       // ... exaustão normal ...
     }
     ```
  3. Cuidado: não modificar o array enquanto itera. Usar `[...state.activeWars]` ou processar em dois loops
- **Critérios de aceite:** Fluxo `batalhas → capitulação → exaustão` funciona sem loops infinitos
- **Como validar:** `npm run build && npm run dev` — jogar guerra até >60% ocupação, ver capitulação
- **Riscos:** Modificar `state.activeWars` (removendo guerras) durante iteração causa bugs. Iterar sobre cópia

---

## Tarefa 10 — Adicionar notificação de capitulação
- **Objetivo:** Log formatado quando ocorre capitulação.
- **Arquivos prováveis:** `src/logic/turnLogic.ts`
- **Passos:**
  1. Em `executeCapitulation`, adicionar:
     ```typescript
     state.logs.push(
       `🏳️ ${defender.name} se rendeu a ${winner.name}! ` +
       `Após perder ${count} províncias e ver sua capital ameaçada, ` +
       `o reino de ${defender.name} depôs suas armas. ` +
       `${ceded} províncias foram cedidas. ${defender.name} agora é vassalo de ${winner.name}.`
     );
     ```
  2. Ajustar mensagem se defensor foi eliminado
- **Critérios de aceite:** Notificação aparece no TurnSummary
- **Como validar:** `npm run build && npm run dev` — ver log após capitulação
- **Riscos:** Nenhum

---

## Tarefa 11 — Validação final do Sprint 02
- **Objetivo:** Testar o fluxo completo de capitulação.
- **Arquivos prováveis:** Nenhum
- **Passos:**
  1. `npm run lint && npm run build`
  2. `npm run dev` — testar:
     - Declarar guerra contra reino pequeno
     - Conquistar >60% das províncias
     - Verificar capitulação no próximo turno
     - Verificar vassalagem ou eliminação
     - Verificar `originalOwnerId` limpo
- **Critérios de aceite:** Checklist completo
- **Como validar:** Executar comandos e teste manual
- **Riscos:** Nenhum

---

*Sprint 02 quebrada — 11 tarefas — Reinos Medievais — Fase 2*
