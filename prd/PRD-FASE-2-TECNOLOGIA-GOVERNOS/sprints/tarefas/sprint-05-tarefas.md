# Sprint 05 quebrada em tarefas menores — Empréstimos + IA Avançada

> **Coder:** 🟢 BARATO (T1-T5, T7-T12, T14-T16) | 🔴 FORTE (T6, T13)
> **Subpasta de destino:** `tarefas/sprint-05/`

---

## Tarefa 1 — Adicionar interface Loan em types.ts
- **Objetivo:** Criar o tipo para empréstimos.
- **Arquivos prováveis:** `src/types.ts`
- **Passos:**
  1. Adicionar interface:
     ```typescript
     export interface Loan {
       id: string;
       amount: number;
       remaining: number;
       paymentPerTurn: number;
       defaulted: boolean;
     }
     ```
  2. Em `Realm`: `loans: Loan[]`
  3. `npx tsc --noEmit`
- **Critérios de aceite:** `tsc --noEmit` passa
- **Como validar:** `npx tsc --noEmit`
- **Riscos:** Nenhum

---

## Tarefa 2 — Adicionar aiAggression em GameSettings
- **Objetivo:** Campo de configuração de agressividade da IA.
- **Arquivos prováveis:** `src/types.ts`
- **Passos:**
  1. Em `GameSettings`: `aiAggression: number` (default 50)
  2. Em `mapGeneration.ts`, setar `aiAggression: 50` na criação
  3. `npx tsc --noEmit`
- **Critérios de aceite:** `tsc --noEmit` passa. `GameSettings` tem `aiAggression`
- **Como validar:** `npx tsc --noEmit`
- **Riscos:** UI de configuração de jogo (App.tsx menu) pode precisar de slider para `aiAggression` — mas isso é opcional, pode usar default 50

---

## Tarefa 3 — Criar getMaxLoanAmount (economyLogic.ts)
- **Objetivo:** Função que calcula o limite de crédito.
- **Arquivos prováveis:** `src/logic/economyLogic.ts`
- **Passos:**
  1. Adicionar função exportada:
     ```typescript
     export function getMaxLoanAmount(realm: Realm): number {
       return Math.floor((realm.goldIncome || 0) * 5);
     }
     ```
  2. `npx tsc --noEmit`
- **Critérios de aceite:** Retorna `goldIncome * 5` arredondado para baixo
- **Como validar:** `npx tsc --noEmit`
- **Riscos:** `goldIncome` pode ser undefined. Fallback `0`

---

## Tarefa 4 — Criar requestLoan (economyLogic.ts)
- **Objetivo:** Função que cria um empréstimo e adiciona gold ao reino.
- **Arquivos prováveis:** `src/logic/economyLogic.ts`
- **Passos:**
  1. Implementar:
     ```typescript
     export function requestLoan(realm: Realm, amount: number): { success: boolean; paymentPerTurn: number } {
       const maxLoan = getMaxLoanAmount(realm);
       if (amount <= 0 || amount > maxLoan) return { success: false, paymentPerTurn: 0 };
       const paymentPerTurn = Math.ceil((amount * 1.15) / 10);
       realm.gold += amount;
       realm.loans = realm.loans || [];
       realm.loans.push({
         id: crypto.randomUUID ? crypto.randomUUID() : `loan_${Date.now()}_${Math.random()}`,
         amount,
         remaining: 10,
         paymentPerTurn,
         defaulted: false,
       });
       return { success: true, paymentPerTurn };
     }
     ```
  2. `npx tsc --noEmit`
- **Critérios de aceite:** Gold adicionado imediatamente. Loan criado com 10 parcelas
- **Como validar:** `npx tsc --noEmit`
- **Riscos:** `crypto.randomUUID()` pode não existir em HTTP. Usar fallback com `Date.now()`

---

## Tarefa 5 — Criar processLoanPayments (economyLogic.ts)
- **Objetivo:** Função chamada a cada turno para processar parcelas.
- **Arquivos prováveis:** `src/logic/economyLogic.ts`
- **Passos:**
  1. Implementar:
     ```typescript
     export function processLoanPayments(realm: Realm, state: GameState): void {
       if (!realm.loans) return;
       for (const loan of realm.loans) {
         if (loan.remaining <= 0) continue;
         if (realm.gold >= loan.paymentPerTurn) {
           realm.gold -= loan.paymentPerTurn;
           loan.remaining--;
         } else {
           loan.defaulted = true;
           // -10 relações com todos os reinos
           Object.keys(state.realms).forEach(otherId => {
             if (otherId !== realm.id && otherId !== 'neutral') {
               realm.relations[otherId] = Math.max(-100, (realm.relations[otherId] || 0) - 10);
             }
           });
           // -5 loyalty em todas as províncias
           Object.values(state.provinces).forEach(p => {
             if (p.ownerId === realm.id) {
               p.loyalty = Math.max(0, p.loyalty - 5);
             }
           });
         }
       }
       // Remover loans quitados
       realm.loans = realm.loans.filter(l => l.remaining > 0 && !l.defaulted);
     }
     ```
  2. `npx tsc --noEmit`
- **Critérios de aceite:** Parcela deduzida a cada turno. Default aplica penalidades
- **Como validar:** `npx tsc --noEmit`
- **Riscos:** Penalidade modifica `state.realms` e `state.provinces` — ok porque `state` é deep clone em `processEndOfTurn`

---

## Tarefa 6 — Integrar processLoanPayments em processEndOfTurn
- **Objetivo:** Empréstimos processados automaticamente a cada turno.
- **Arquivos prováveis:** `src/logic/turnLogic.ts`
- **Passos:**
  1. No loop de realms (linha 513), após cálculo de renda e ANTES de manutenção:
     ```typescript
     import { processLoanPayments } from './economyLogic';
     processLoanPayments(realm, newState);
     ```
  2. `npx tsc --noEmit`
- **Critérios de aceite:** Parcelas descontadas automaticamente
- **Como validar:** `npm run build && npm run dev` — contrair empréstimo, passar turnos, ver gold diminuir
- **Riscos:** Posição importa — processar após renda (para ter gold) e antes de manutenção

---

## Tarefa 7 — Adicionar botão de empréstimo no HUD
- **Objetivo:** Jogador pode contrair empréstimo pela UI.
- **Arquivos prováveis:** `src/components/HUD.tsx`, `src/hooks/useGameController.ts`
- **Passos:**
  1. `HUD.tsx`: botão "💰 Empréstimo" no painel de economia
  2. Ao clicar: prompt com valor (ou input field)
  3. Handler em `useGameController.ts`: chamar `requestLoan`, atualizar estado
  4. Toast: "Empréstimo de X gold contraído. Parcela: Y por turno."
  5. `npm run build`
- **Critérios de aceite:** Botão funcional, gold aparece imediatamente
- **Como validar:** `npm run build && npm run dev` — clicar, inserir valor, ver gold
- **Riscos:** Handler precisa seguir padrão imutável

---

## Tarefa 8 — Criar calculateMilitaryPower (aiLogic.ts)
- **Objetivo:** Função exportada que calcula poder militar de um reino.
- **Arquivos prováveis:** `src/logic/aiLogic.ts`
- **Passos:**
  1. Implementar:
     ```typescript
     export function calculateMilitaryPower(realm: Realm, state: GameState): number {
       const ownedProvinces = Object.values(state.provinces).filter(p => p.ownerId === realm.id);
       let totalTroops = 0;
       for (const prov of ownedProvinces) {
         totalTroops += prov.troops || 0;
       }
       const combatBonus = 1 + (realm.techLevels?.combat || 0) * 0.05;
       totalTroops *= combatBonus;
       // Bônus de governo (importar GOVERNMENT_STATS se disponível)
       try {
         const { GOVERNMENT_STATS } = require('./governmentLogic');
         const attackBonus = GOVERNMENT_STATS[realm.government || 'monarchy']?.attack || 1;
         totalTroops *= attackBonus;
       } catch { /* governmentLogic pode não existir ainda */ }
       return Math.round(totalTroops);
     }
     ```
  2. `npx tsc --noEmit`
- **Critérios de aceite:** Retorna > 0 com tropas, 0 sem tropas, reflete bônus
- **Como validar:** `npx tsc --noEmit`
- **Riscos:** `governmentLogic` pode não existir se Sprint 03 não foi executado. Usar try/catch

---

## Tarefa 9 — Implementar shouldAIAttack (aiLogic.ts)
- **Objetivo:** Decisão de ataque baseada na personalidade e poder militar.
- **Arquivos prováveis:** `src/logic/aiLogic.ts`
- **Passos:**
  1. Implementar função que recebe `realm`, `target`, `state` e retorna `boolean`
  2. Calcular `powerRatio = calculateMilitaryPower(realm) / calculateMilitaryPower(target)`
  3. Switch por personalidade:
     - `'expansionist'`: `powerRatio > 1.5`
     - `'opportunistic'`: `powerRatio > 1.0 && (target.wars.length > 0 || target fraco)`
     - `'defensive'`: `false`
     - `'diplomatic'`: `powerRatio > 3.0`
     - `'commercial'`: `powerRatio > 2.5`
  4. `npx tsc --noEmit`
- **Critérios de aceite:** Cada personalidade tem threshold correto
- **Como validar:** `npx tsc --noEmit`
- **Riscos:** Divisão por zero. Usar `targetPower > 0 ? myPower / targetPower : Infinity`

---

## Tarefa 10 — Implementar processAIDiplomacy (aiLogic.ts)
- **Objetivo:** IA age diplomaticamente conforme personalidade.
- **Arquivos prováveis:** `src/logic/aiLogic.ts`
- **Passos:**
  1. Função auxiliar chamada de `processAI`
  2. Diplomatic: `proposeAlliance` com vizinhos com relações > 0
  3. Expansionist: `sendInsult` para reduzir relações (provocar guerra)
  4. Commercial: sem ação diplomática agressiva
  5. `npx tsc --noEmit`
- **Critérios de aceite:** IA diplomatic tenta alianças; expansionist insulta
- **Como validar:** `npm run build && npm run dev` — observar logs de diplomacia da IA
- **Riscos:** `proposeAlliance` modifica estado. Precisamos garantir que o estado passado é o deep clone

---

## Tarefa 11 — Implementar processAILoans (aiLogic.ts)
- **Objetivo:** IA contrai empréstimo quando necessário.
- **Arquivos prováveis:** `src/logic/aiLogic.ts`
- **Passos:**
  1. Função auxiliar chamada de `processAI`
  2. Se `realm.gold < 0 && realm.wars.length > 0`: `requestLoan(realm, Math.min(maxLoan, 500))`
  3. Ou se `realm.gold < 50 && precisa recrutar`: pedir empréstimo pequeno
  4. `npx tsc --noEmit`
- **Critérios de aceite:** IA contrai empréstimo quando em guerra e sem gold
- **Como validar:** `npm run build && npm run dev` — observar IA em guerra com gold negativo
- **Riscos:** IA pode contrair muitos empréstimos e entrar em default. Limitar a 1 empréstimo por vez

---

## Tarefa 12 — Remover declareWar local do aiLogic.ts 🔴 FORTE
- **Objetivo:** Eliminar duplicação, usar a função canônica.
- **Arquivos prováveis:** `src/logic/aiLogic.ts`
- **Passos:**
  1. Remover função local `declareWar` (linhas 6-31)
  2. Adicionar import: `import { declareWar } from './diplomacyLogic';`
  3. Em `executeAIAttack` (linha 47), substituir:
     ```typescript
     // ANTES: declareWar(state, realmId, defenderProv.ownerId);
     // DEPOIS:
     const warResult = declareWar(state, realmId, defenderProv.ownerId);
     // callsToResolve podem ser ignorados para IA (auto-resolve não necessário)
     ```
  4. `npx tsc --noEmit`
- **Critérios de aceite:** `grep "function declareWar" src/logic/aiLogic.ts` retorna vazio
- **Como validar:** `grep -n "function declareWar" src/logic/aiLogic.ts` — sem resultados
- **Riscos:** `diplomacyLogic.declareWar` retorna `{ newState, callsToResolve }`. Garantir que `state` passado é o mesmo objeto (mutado in-place)

---

## Tarefa 13 — Reescrever processAI com personalidades 🔴 FORTE
- **Objetivo:** IA age de forma distinta por personalidade.
- **Arquivos prováveis:** `src/logic/aiLogic.ts`
- **Passos:**
  1. Substituir `processAI` atual (linhas 80-119) por:
     ```typescript
     export function processAI(state: GameState) {
       Object.values(state.realms).forEach(realm => {
         if (realm.isPlayer || realm.id === 'neutral') return;
         processAIDiplomacy(state, realm);
         processAILoans(state, realm);
         switch (realm.personality) {
           case 'expansionist': aiAct(state, realm, { attackFirst: true }); break;
           case 'defensive': aiAct(state, realm, { buildFirst: true, neverAttack: true }); break;
           case 'diplomatic': aiAct(state, realm, { diplomacyFirst: true, attackThreshold: 3.0 }); break;
           case 'opportunistic': aiAct(state, realm, { attackWeakFirst: true }); break;
           case 'commercial': aiAct(state, realm, { economyFirst: true, attackThreshold: 2.5 }); break;
         }
       });
     }
     ```
  2. Criar função helper `aiAct` que executa ações conforme flags
  3. `npx tsc --noEmit`
- **Critérios de aceite:** Expansionist ataca, Defensive constrói, Commercial economiza
- **Como validar:** `npm run build && npm run dev` — observar comportamento de cada IA por vários turnos
- **Riscos:** Reescrita completa da função mais delicada do jogo. Testar exaustivamente

---

## Tarefa 14 — Aplicar aiAggression configurável
- **Objetivo:** Slider de agressividade afeta thresholds de ataque.
- **Arquivos prováveis:** `src/logic/aiLogic.ts`
- **Passos:**
  1. Em `shouldAIAttack`, aplicar:
     ```typescript
     const aggression = state.settings.aiAggression || 50;
     const aggressionFactor = 1 - (aggression - 50) / 100;
     const effectiveRatio = baseThreshold * aggressionFactor;
     ```
  2. `npx tsc --noEmit`
- **Critérios de aceite:** Com agressividade 100, thresholds 50% menores
- **Como validar:** `npm run build && npm run dev` — mudar agressividade, ver IA atacar mais
- **Riscos:** `aiAggression` precisa estar em `GameSettings` (T2)

---

## Tarefa 15 — Atualizar mapGeneration para novos campos
- **Objetivo:** Novos realms nascem com `loans: []`.
- **Arquivos prováveis:** `src/logic/mapGeneration.ts`
- **Passos:**
  1. Na criação de realms, adicionar `loans: []`
  2. Se `aiAggression` foi adicionado, setar default 50
  3. `npm run build`
- **Critérios de aceite:** Novo jogo não quebra por `loans` undefined
- **Como validar:** `npm run build && npm run dev` — iniciar novo jogo
- **Riscos:** Nenhum

---

## Tarefa 16 — Validação final do Sprint 05
- **Objetivo:** Testar empréstimos e IA integrados.
- **Arquivos prováveis:** Nenhum
- **Passos:**
  1. `npm run lint && npm run build`
  2. `npm run dev` — testar:
     - Contrair empréstimo, ver gold, passar turnos, ver parcelas
     - Default: gastar todo gold, ver penalidades
     - IA Expansionist ataca com vantagem > 1.5
     - IA Defensive nunca inicia guerra
     - IA Diplomatic tenta alianças
     - IA pede empréstimo em guerra
     - `aiLogic.ts` sem `declareWar` local
- **Critérios de aceite:** Checklist completo
- **Como validar:** Executar comandos e teste manual
- **Riscos:** Nenhum

---

*Sprint 05 quebrada — 16 tarefas — Reinos Medievais — Fase 2*
