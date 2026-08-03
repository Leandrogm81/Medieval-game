# Sprint 02 — Capitulação (Auto-Surrender)

**Objetivo:** Implementar o sistema de capitulação onde um reino se rende automaticamente ao perder território suficiente.

**Nível de dificuldade:** 🟠 Difícil — use coder FORTE para T5 e T6; use coder BARATO para as demais

**Dependências:** Sprint 01 (tipos base)

**Tempo estimado:** 1.5 dias

---

## Arquivos

| Ação | Arquivo | Coder |
|------|---------|-------|
| Editar | `src/types.ts` | Barato |
| Editar | `src/logic/turnLogic.ts` | **Forte** |
| Editar | `src/logic/aiLogic.ts` | Barato |

---

## Tarefas

### T1 — Adicionar `originalOwnerId` e `CapitulationResult` em `types.ts` 🟢 Barato
- `Province.originalOwnerId?: string` — campo opcional
- Interface `CapitulationResult`:
```typescript
export interface CapitulationResult {
  winnerId: string;
  loserId: string;
  occupationRatio: number;       // 0-1
  provincesToCede: string[];     // provinceIds
}
```
- Critério de aceite: `tsc --noEmit` passa

### T2 — Setar `originalOwnerId` ao conquistar província em guerra 🟡 Barato
- Em `turnLogic.ts` `processMarchOrders` (linha 289): antes de `prov.ownerId = baseOrder.realmId`, salvar:
```typescript
if (defenderRealmId !== 'neutral') {
  prov.originalOwnerId = prov.ownerId;
}
```
- Em `aiLogic.ts` `executeAIAttack` (linha 67-68): mesmo padrão
- Critério de aceite: ao conquistar província durante guerra ativa, `originalOwnerId` é setado

### T3 — Limpar `originalOwnerId` ao fim da guerra 🟡 Barato
- Em `processActiveWars` (linha 403), no bloco onde a guerra termina (linha 456):
```typescript
// Limpar originalOwnerId em províncias dos beligerantes
Object.values(newState.provinces).forEach(p => {
  if (p.originalOwnerId === war.attackerId || p.originalOwnerId === war.defenderId) {
    p.originalOwnerId = undefined;
  }
});
```
- Critério de aceite: ao terminar guerra, `originalOwnerId` é `undefined`

### T4 — Implementar `checkCapitulation` 🟡 Barato
- Nova função em `turnLogic.ts`:
```typescript
function checkCapitulation(state: GameState, war: War): CapitulationResult | null
```
- Condições: >60% províncias ocupadas OU warScore > 70 OU (capital capturada + warScore > 50)
- Usar `originalOwnerId` para detectar ocupação
- Critério de aceite: função retorna resultado quando condições são atingidas, null caso contrário

### T5 — Implementar `selectProvincesToCede` e `executeCapitulation` 🔴 FORTE
- `selectProvincesToCede(state, occupiedIds, defender, fraction)`:
  - Ordenar por distância BFS da capital do defensor (mais distantes primeiro)
  - Retornar `Math.ceil(occupiedIds.length * fraction)` províncias
- `executeCapitulation(state, result)`:
  - Transferir `provincesToCede` para o vencedor
  - Limpar `originalOwnerId` nas províncias envolvidas
  - Se defensor ainda tem províncias: `defender.vassalOf = winner.id`; `winner.vassals.push(defender.id)`
  - Se não tem: `delete state.realms[defender.id]`
  - Penalidade: -20 loyalty por 5 turnos nas províncias do vencedor
- Critério de aceite: províncias cedidas são as mais distantes da capital

### T6 — Integrar `checkCapitulation` em `processActiveWars` 🔴 FORTE
- Fluxo conforme PRD:
```
processActiveWars(state):
  para cada activeWar:
    1. resolveCombat / atualizar warScore   // já existe
  para cada activeWar:                       // NOVO loop
    2. result = checkCapitulation(state, war)
    se result:
      3. executeCapitulation(state, result)
      4. continue (pular exaustão)
    5. calculateWarExhaustion(war)           // já existe
```
- Critério de aceite: fluxo `batalhas → capitulação → exaustão` funciona, sem loops infinitos

### T7 — Adicionar notificação especial de capitulação 🟢 Barato
```typescript
state.logs.push(
  `🏳️ ${defender.name} se rendeu a ${winner.name}! ` +
  `Após perder ${count} províncias, o reino de ${defender.name} depôs suas armas. ` +
  `${ceded} províncias foram cedidas.`
);
```
- Critério de aceite: notificação aparece no TurnSummary

---

## Critérios de aceite da sprint
- [ ] >60% províncias ocupadas → capitulação
- [ ] War score >70% → capitulação
- [ ] Capital capturada + war score >50% → capitulação
- [ ] `originalOwnerId` setado ao conquistar e limpo ao fim da guerra
- [ ] Derrotado vira vassalo se ainda tem províncias
- [ ] Derrotado eliminado se perdeu todas
- [ ] Províncias cedidas são as mais distantes
- [ ] Vencedor sofre -20 loyalty por 5 turnos

---

## Comandos de validação
```bash
npm run lint && npm run build
npm run dev  # testar: iniciar guerra, conquistar >60% das províncias, ver capitulação
```

---

## Riscos
- **`findPath` existente:** usa BFS mas filtra por `realmId` (linha 141). Para `selectProvincesToCede`, pode precisar de BFS sem filtro de owner
- **Vassalagem existente:** verificar se `vassalOf` e `vassals` já são usados em `processEndOfTurn` (linhas 614-623 para tributo)
- **Guerra com múltiplos atacantes:** assumir 1 atacante vs 1 defensor. Se houver coalizões, `originalOwnerId` pode ser ambíguo

---

## O que NÃO deve ser alterado
- `src/logic/combatLogic.ts`
- `src/logic/economyLogic.ts`
- `src/components/*` — sem UI neste sprint
- Sistema de exaustão existente em `processActiveWars` — apenas adicionar capitulação ANTES

---

*Sprint 02 — Capitulação — Reinos Medievais — Fase 2*
