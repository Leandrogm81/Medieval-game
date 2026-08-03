# Sprint 05 — Empréstimos + IA Avançada

**Objetivo:** Implementar sistema de empréstimos e reescrever a IA para usar personalidades, `calculateMilitaryPower`, e remover `declareWar` local.

**Nível de dificuldade:** 🔴 Muito Difícil — use coder FORTE para T6 e T10; use coder BARATO para as demais

**Dependências:** Sprint 01 (tech), Sprint 03 (governos)

**Tempo estimado:** 3.5 dias

---

## Arquivos

| Ação | Arquivo | Coder |
|------|---------|-------|
| Editar | `src/types.ts` | Barato |
| Editar | `src/logic/economyLogic.ts` | Barato |
| Editar | `src/logic/aiLogic.ts` | **Forte** |
| Editar | `src/logic/turnLogic.ts` | Barato |
| Editar | `src/hooks/useGameController.ts` | Barato |
| Editar | `src/components/HUD.tsx` | Barato |
| Editar | `src/App.tsx` | Barato |

---

## Tarefas

### T1 — Adicionar tipos de empréstimo em `types.ts` 🟢 Barato
```typescript
export interface Loan {
  id: string;
  amount: number;            // valor original
  remaining: number;          // parcelas restantes (10 → 0)
  paymentPerTurn: number;     // Math.ceil((amount * 1.15) / 10)
  defaulted: boolean;
}
```
- Campo em `Realm`: `loans: Loan[]`
- Campo em `GameSettings`: `aiAggression: number` (0-100, default 50)
- Critério de aceite: `tsc --noEmit` passa

### T2 — Funções de empréstimo em `economyLogic.ts` 🟡 Barato
- `getMaxLoanAmount(realm)` → `Math.floor((realm.goldIncome || 0) * 5)`
- `requestLoan(realm, amount)`:
  - Validar `amount <= getMaxLoanAmount(realm)`
  - `realm.gold += amount`
  - Criar loan: `{ id: uuid, amount, remaining: 10, paymentPerTurn: Math.ceil((amount * 1.15) / 10), defaulted: false }`
  - Retornar `{ success: boolean }`
- `processLoanPayments(realm, state)`:
  - Para cada loan com `remaining > 0`:
    - Se `realm.gold >= paymentPerTurn`: deduzir, `remaining--`
    - Senão: `defaulted = true`, -10 relações todos os reinos, -5 loyalty todas as províncias
  - Remover loans com `remaining === 0`
- Critério de aceite: funções corretas conforme PRD

### T3 — Integrar `processLoanPayments` em `turnLogic.ts` 🟡 Barato
- Em `processEndOfTurn`, no loop de realms (linha 513), após cálculo de renda e antes dos gastos de manutenção:
```typescript
processLoanPayments(realm, newState);
```
- Critério de aceite: parcelas descontadas automaticamente a cada turno

### T4 — Botão de empréstimo no HUD 🟡 Barato
- `HUD.tsx`: botão "💰 Empréstimo"
- Ao clicar: mostrar input de valor (limitado a `getMaxLoanAmount`)
- Handler em `useGameController.ts`: chamar `requestLoan` e atualizar estado
- Critério de aceite: jogador pode contrair empréstimo via UI, gold aparece imediatamente

### T5 — Criar `calculateMilitaryPower` em `aiLogic.ts` 🟡 Barato
```typescript
export function calculateMilitaryPower(realm: Realm, state: GameState): number {
  const ownedProvinces = Object.values(state.provinces).filter(p => p.ownerId === realm.id);
  let totalTroops = 0;
  for (const prov of ownedProvinces) {
    totalTroops += prov.troops; // ou soma manual infantry+archers+cavalry+scouts
  }
  totalTroops *= (1 + (realm.techLevels?.combat || 0) * 0.05);
  const govStats = GOVERNMENT_STATS[realm.government || 'monarchy'];
  totalTroops *= govStats.attack;
  return Math.round(totalTroops);
}
```
- Critério de aceite: retorna > 0 para reino com tropas, 0 sem tropas

### T6 — Refatorar `aiLogic.ts`: remover `declareWar` local 🔴 FORTE
- Remover função local `declareWar` (linhas 6-31)
- Importar: `import { declareWar } from './diplomacyLogic';`
- Em `executeAIAttack` (linha 46-48), substituir:
```typescript
// ANTES: declareWar(state, realmId, defenderProv.ownerId);
// DEPOIS:
const warResult = declareWar(state, realmId, defenderProv.ownerId);
// NOTA: declareWar de diplomacyLogic retorna { newState, callsToResolve }
// callsToResolve podem ser ignorados para IA (auto-resolve)
```
- Critério de aceite: `grep "function declareWar" src/logic/aiLogic.ts` retorna vazio

### T7 — Implementar `shouldAIAttack` com personalidades 🟡 Barato
```typescript
function shouldAIAttack(realm: Realm, target: Realm, state: GameState): boolean {
  const myPower = calculateMilitaryPower(realm, state);
  const targetPower = calculateMilitaryPower(target, state);
  const powerRatio = targetPower > 0 ? myPower / targetPower : Infinity;
  
  switch (realm.personality) {
    case 'expansionist': return powerRatio > 1.5;
    case 'opportunistic': return powerRatio > 1.0 && (target.wars.length > 0 || /* target fraco */);
    case 'defensive': return false;
    case 'diplomatic': return powerRatio > 3.0;
    case 'commercial': return powerRatio > 2.5;
    default: return powerRatio > 1.5;
  }
}
```
- Critério de aceite: cada personalidade ataca conforme thresholds

### T8 — Implementar `processAIDiplomacy` 🟡 Barato
- Nova função chamada de `processAI`
- Switch por personalidade:
  - `'diplomatic'`: tentar `proposeAlliance` com vizinhos com relações > 0
  - `'expansionist'`: `sendInsult` para provocar guerra
  - `'commercial'`: oferecer trade routes
- Critério de aceite: IA diplomatic tenta alianças, expansionist insulta

### T9 — Implementar `processAILoans` 🟡 Barato
- Chamada de `processAI`:
```typescript
if (realm.gold < 0 && realm.wars.length > 0) {
  const maxLoan = getMaxLoanAmount(realm);
  if (maxLoan > 100) {
    requestLoan(realm, Math.min(maxLoan, 500));
  }
}
```
- Critério de aceite: IA contrai empréstimo quando em guerra e sem gold

### T10 — Reescrever `processAI` 🔴 FORTE
- Substituir lógica aleatória atual (linhas 80-119) por:
```typescript
export function processAI(state: GameState) {
  Object.values(state.realms).forEach(realm => {
    if (realm.isPlayer || realm.id === 'neutral') return;
    
    // Processar diplomacia e empréstimos
    processAIDiplomacy(state, realm);
    processAILoans(state, realm);
    
    // Agir conforme personalidade
    switch (realm.personality) {
      case 'expansionist':
        aiExpand(state, realm);    // atacar > recrutar > construir
        break;
      case 'defensive':
        aiDefend(state, realm);    // construir > fortificar > diplomacia
        break;
      case 'diplomatic':
        aiDiplo(state, realm);     // diplomacia > economia
        break;
      case 'opportunistic':
        aiOpportune(state, realm); // atacar fraco > economia
        break;
      case 'commercial':
        aiCommerce(state, realm);  // economia > trade > construir
        break;
    }
  });
}
```
- Critério de aceite: cada personalidade age de forma distinta e previsível

### T11 — Aplicar `aiAggression` configurável 🟡 Barato
- Em `shouldAIAttack`, aplicar:
```typescript
const aggressionFactor = 1 - ((state.settings.aiAggression || 50) - 50) / 100;
const effectiveRatio = baseRatio * aggressionFactor;
```
- Critério de aceite: com agressividade 100, IA ataca com 50% menos vantagem necessária

---

## Critérios de aceite da sprint
- [ ] Empréstimo: jogador recebe gold, parcela deduzida por 10 turnos
- [ ] Default causa penalidade de -10 relações e -5 loyalty
- [ ] Limite de crédito = `Math.floor(totalGoldIncome * 5)`
- [ ] `calculateMilitaryPower` correto com bônus de tech e governo
- [ ] Expansionist ataca com powerRatio > 1.5
- [ ] Defensive nunca inicia guerras
- [ ] `aiLogic.ts` sem `declareWar` local
- [ ] Agressividade configurável afeta thresholds

---

## Comandos de validação
```bash
npm run lint && npm run build
npm run dev  # testar: observar IA agindo conforme personalidade, contrair empréstimo
```

---

## Riscos
- **IA atual muta estado diretamente:** `handleEndTurn` já faz deep clone antes de `processAI`. Manter esse padrão
- **`GOVERNMENT_STATS` pode não existir:** se Sprint 03 não estiver completo, usar fallback `{ attack: 1.0 }`
- **IA pode quebrar com campos inexistentes:** usar `realm.techLevels?.combat || 0` e `realm.government || 'monarchy'`

---

## O que NÃO deve ser alterado
- `src/logic/diplomacyLogic.ts` — apenas referenciar `declareWar` exportada
- `src/logic/combatLogic.ts`
- Estrutura de `processEndOfTurn` — apenas adicionar `processLoanPayments`

---

*Sprint 05 — Empréstimos + IA — Reinos Medievais — Fase 2*
