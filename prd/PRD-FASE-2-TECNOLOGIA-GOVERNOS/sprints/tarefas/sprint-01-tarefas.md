# Sprint 01 quebrada em tarefas menores — Tipos Base + Sistema de Tecnologia

> **Coder:** 🟢 BARATO (T1-T4, T6, T8-T10) | 🔴 FORTE (T5, T7)
> **Subpasta de destino:** `tarefas/sprint-01/`

---

## Tarefa 1 — Adicionar interface TechLevels em types.ts
- **Objetivo:** Criar a interface `TechLevels` sem tocar em mais nada.
- **Arquivos prováveis:** `src/types.ts`
- **Passos:**
  1. Abrir `src/types.ts`
  2. Adicionar antes das interfaces existentes:
     ```typescript
     export interface TechLevels {
       movement: number;
       assimilation: number;
       recruitment: number;
       combat: number;
     }
     ```
  3. Salvar e rodar `npx tsc --noEmit`
- **Critérios de aceite:** `tsc --noEmit` passa sem erros
- **Como validar:** `npx tsc --noEmit`
- **Riscos:** Nenhum — é uma adição pura

---

## Tarefa 2 — Adicionar campos techPoints e techLevels em Realm
- **Objetivo:** Adicionar os dois novos campos na interface `Realm`.
- **Arquivos prováveis:** `src/types.ts`
- **Passos:**
  1. Em `Realm`, adicionar após `foodMaintenance` (linha 86):
     ```typescript
     techPoints: number;
     techLevels: TechLevels;
     ```
  2. Salvar e rodar `npx tsc --noEmit`
- **Critérios de aceite:** `tsc --noEmit` passa. `Realm` tem `techPoints` e `techLevels`
- **Como validar:** `npx tsc --noEmit`
- **Riscos:** Código existente que cria `Realm` (ex: `mapGeneration.ts`) precisará ser atualizado depois

---

## Tarefa 3 — Adicionar 'technology' ao ViewMode
- **Objetivo:** Expandir o union type `ViewMode`.
- **Arquivos prováveis:** `src/types.ts`
- **Passos:**
  1. Na linha do `ViewMode`, adicionar `| 'technology'` ao final
  2. Salvar e rodar `npx tsc --noEmit`
- **Critérios de aceite:** `tsc --noEmit` passa. ViewMode aceita 'technology'
- **Como validar:** `npx tsc --noEmit`
- **Riscos:** Switch/case em `Map.tsx` e `App.tsx` que usam `viewMode` podem precisar de um branch `'technology'` — mas isso é tratado no Sprint 04

---

## Tarefa 4 — Atualizar mapGeneration.ts para criar novos campos
- **Objetivo:** Garantir que `generateInitialState` cria realms com `techPoints: 0` e `techLevels` zerados.
- **Arquivos prováveis:** `src/logic/mapGeneration.ts`
- **Passos:**
  1. Localizar onde realms são criados no `generateInitialState`
  2. Adicionar `techPoints: 0` e `techLevels: { movement: 0, assimilation: 0, recruitment: 0, combat: 0 }` em cada novo realm
  3. Rodar `npx tsc --noEmit` e `npm run build`
- **Critérios de aceite:** Novo jogo inicia com tech zerada. `npm run build` passa
- **Como validar:** `npm run build && npm run dev` — iniciar novo jogo não quebra
- **Riscos:** Se `deepClone` é usado em algum lugar que espera estrutura antiga, pode quebrar. Mas `JSON.parse(JSON.stringify(...))` é indiferente a novos campos

---

## Tarefa 5 — Criar função getTechUpgradeCost
- **Objetivo:** Criar arquivo `technologyLogic.ts` com a primeira função pura.
- **Arquivos prováveis:** `src/logic/technologyLogic.ts` (CRIAR)
- **Passos:**
  1. Criar `src/logic/technologyLogic.ts`
  2. Implementar e exportar:
     ```typescript
     export function getTechUpgradeCost(currentLevel: number): number {
       return 10 + 5 * currentLevel * (currentLevel + 1) / 2;
     }
     ```
  3. Rodar `npx tsc --noEmit`
- **Critérios de aceite:**
  - `getTechUpgradeCost(0) === 10`
  - `getTechUpgradeCost(1) === 15`
  - `getTechUpgradeCost(5) === 85`
  - `getTechUpgradeCost(9) === 235`
- **Como validar:** `npx tsc --noEmit` (a função é pura, sem dependências)
- **Riscos:** Nenhum

---

## Tarefa 6 — Criar função generateTechPoints
- **Objetivo:** Implementar a função de geração de tech points.
- **Arquivos prováveis:** `src/logic/technologyLogic.ts` (EDITAR)
- **Passos:**
  1. Adicionar import: `import { GameState, Realm } from '../types';`
  2. Implementar:
     ```typescript
     export function generateTechPoints(realm: Realm, state: GameState): number {
       const ownedProvinces = Object.values(state.provinces).filter(p => p.ownerId === realm.id);
       const totalPop = ownedProvinces.reduce((sum, p) => sum + p.population, 0);
       const totalWorkshops = ownedProvinces.reduce((sum, p) => sum + p.buildings.workshops, 0);
       const totalCourts = ownedProvinces.reduce((sum, p) => sum + p.buildings.courts, 0);
       let points = 1;
       points += Math.floor(totalPop / 500);
       points += totalWorkshops;
       points += Math.floor(totalCourts / 2);
       // Penalidade de governo placeholder (Sprint 03 implementa de verdade)
       const govPenalty = 0;
       points = Math.floor(points * (1 - govPenalty));
       return Math.min(points, 20);
     }
     ```
  3. Rodar `npx tsc --noEmit`
- **Critérios de aceite:** Função compila e retorna número entre 1 e 20
- **Como validar:** `npx tsc --noEmit`
- **Riscos:** `govPenalty = 0` placeholder — será substituído no Sprint 03

---

## Tarefa 7 — Criar função allocateTechPoints
- **Objetivo:** Implementar alocação de pontos em uma categoria.
- **Arquivos prováveis:** `src/logic/technologyLogic.ts` (EDITAR)
- **Passos:**
  1. Definir tipo: `export type TechCategory = 'movement' | 'assimilation' | 'recruitment' | 'combat';` (colocar em types.ts ou no próprio arquivo)
  2. Implementar:
     ```typescript
     export function allocateTechPoints(realm: Realm, category: TechCategory, state: GameState): boolean {
       const currentLevel = realm.techLevels[category];
       const maxLevel = category === 'combat' ? 20 : 10;
       if (currentLevel >= maxLevel) return false;
       const cost = getTechUpgradeCost(currentLevel);
       if (realm.techPoints < cost) return false;
       realm.techPoints -= cost;
       realm.techLevels[category] += 1;
       // +1 loyalty global
       Object.values(state.provinces).forEach(p => {
         if (p.ownerId === realm.id) {
           p.loyalty = Math.min(100, p.loyalty + 1);
         }
       });
       return true;
     }
     ```
  3. Rodar `npx tsc --noEmit`
- **Critérios de aceite:**
  - Deduz `techPoints` e incrementa nível
  - Retorna `false` se pontos insuficientes ou nível máximo
  - +1 loyalty em todas as províncias do reino
- **Como validar:** `npx tsc --noEmit`
- **Riscos:** `TechCategory` precisa ser adicionado em `types.ts` ou no próprio arquivo

---

## Tarefa 8 — Criar função getTechEffects
- **Objetivo:** Função utilitária que retorna todos os bônus de tech.
- **Arquivos prováveis:** `src/logic/technologyLogic.ts` (EDITAR)
- **Passos:**
  1. Implementar:
     ```typescript
     export interface TechEffects {
       bonusAP: number;
       assimDiscount: number;
       recruitBonus: number;
       combatBonus: number;
     }
     export function getTechEffects(realm: Realm): TechEffects {
       return {
         bonusAP: (realm.techLevels.movement || 0) * 0.5,
         assimDiscount: (realm.techLevels.assimilation || 0) * 0.1,
         recruitBonus: (realm.techLevels.recruitment || 0) * 0.1,
         combatBonus: (realm.techLevels.combat || 0) * 0.05,
       };
     }
     ```
  2. Rodar `npx tsc --noEmit`
- **Critérios de aceite:** Função retorna objeto com 4 multiplicadores
- **Como validar:** `npx tsc --noEmit`
- **Riscos:** Nenhum

---

## Tarefa 9 — Integrar generateTechPoints em processEndOfTurn
- **Objetivo:** Fazer o jogo gerar tech points a cada turno.
- **Arquivos prováveis:** `src/logic/turnLogic.ts`
- **Passos:**
  1. Adicionar import: `import { generateTechPoints } from './technologyLogic';`
  2. Em `processEndOfTurn`, no loop de realms (linha 513), localizar após `realm.materialsIncome = ...` (linha 685) e ANTES de `realm.actionPoints = realm.maxActionPoints` (linha 688)
  3. Adicionar: `realm.techPoints = (realm.techPoints || 0) + generateTechPoints(realm, newState);`
  4. Rodar `npx tsc --noEmit`
- **Critérios de aceite:** Ao fim de cada turno, `techPoints` incrementa. Valor visível no estado
- **Como validar:** `npm run build && npm run dev` — jogar alguns turnos e inspecionar `gameState.realms[playerId].techPoints` via console
- **Riscos:** Posição errada pode fazer tech points serem gerados antes da renda (inofensivo) ou depois do reset (não persiste). Seguir posição indicada

---

## Tarefa 10 — Integrar bônus de AP da tech de movement
- **Objetivo:** `maxActionPoints` refletir o bônus de movement tech.
- **Arquivos prováveis:** `src/logic/turnLogic.ts`
- **Passos:**
  1. Em `processEndOfTurn`, localizar `realm.actionPoints = realm.maxActionPoints` (linha 688)
  2. ANTES dessa linha, adicionar:
     ```typescript
     const techEffects = getTechEffects(realm);
     const govPenalty = 0; // placeholder até Sprint 03
     realm.maxActionPoints = Math.max(2, 5 + techEffects.bonusAP - govPenalty);
     ```
  3. Adicionar import: `import { getTechEffects } from './technologyLogic';`
  4. Rodar `npx tsc --noEmit`
- **Critérios de aceite:**
  - Sem tech: `maxActionPoints = 5`
  - Movement nível 6: `maxActionPoints = 8`
  - Nunca < 2
- **Como validar:** `npm run build && npm run dev` — verificar AP no HUD após upar movement
- **Riscos:** `getTechEffects` depende de `realm.techLevels` que pode ser undefined em saves antigos. Usar `|| 0`

---

## Tarefa 11 — Integrar bônus de recruitment tech em getMaxRecruitable
- **Objetivo:** Poder recrutar mais tropas com recruitment tech.
- **Arquivos prováveis:** `src/logic/economyLogic.ts`
- **Passos:**
  1. Em `getMaxRecruitable` (linha 300), localizar o `return` (linha 315)
  2. ANTES do return, adicionar:
     ```typescript
     const recruitBonus = 1 + (realm.techLevels?.recruitment || 0) * 0.1;
     maxByPop = Math.floor(maxByPop * recruitBonus);
     ```
  3. Ou, mais simples, multiplicar o resultado final:
     ```typescript
     const baseResult = Math.max(0, Math.min(maxByGold, maxByFood, maxByMaterials, maxByPop));
     const recruitBonus = 1 + (realm.techLevels?.recruitment || 0) * 0.1;
     return Math.floor(baseResult * recruitBonus);
     ```
  4. Rodar `npx tsc --noEmit`
- **Critérios de aceite:** Com recruitment nível 3, pode recrutar 30% mais unidades
- **Como validar:** `npm run build && npm run dev` — comparar quantidade recrutável antes/depois de upar recruitment
- **Riscos:** `realm.techLevels` pode ser undefined. Usar optional chaining `?.`

---

## Tarefa 12 — Integrar bônus de combat tech (NO CALLER) 🔴 FORTE
- **Objetivo:** Aplicar +5% atk/def por nível de combat tech sem modificar `resolveCombat`.
- **Arquivos prováveis:** `src/logic/turnLogic.ts`, `src/logic/aiLogic.ts`
- **Passos:**
  1. NÃO modificar `resolveCombat` — ele permanece puro
  2. Em `turnLogic.ts` `processMarchOrders`, na linha 285 (`const result = resolveCombat(...)`)
  3. ANTES de chamar `resolveCombat`, aplicar bônus nos exércitos:
     ```typescript
     import { getTechEffects } from './technologyLogic';
     // ...
     const attackerRealm = newState.realms[baseOrder.realmId];
     const defenderRealm = newState.realms[defenderRealmId];
     const atkBonus = attackerRealm ? (1 + getTechEffects(attackerRealm).combatBonus) : 1;
     const defBonus = defenderRealm ? (1 + getTechEffects(defenderRealm).combatBonus) : 1;
     const boostedAttacker = { /* multiplicar cada tipo por atkBonus */ };
     const boostedDefender = { /* multiplicar cada tipo por defBonus */ };
     const result = resolveCombat(boostedAttacker, boostedDefender, prov.terrain, prov.defense, state, prov.id);
     ```
  4. Em `aiLogic.ts` `executeAIAttack` (linha 52), mesmo padrão
  5. Rodar `npx tsc --noEmit`
- **Critérios de aceite:** Com combat nível 4 (+20%), tropas causam/absorvem 20% mais dano
- **Como validar:** `npm run build && npm run dev` — testar batalha com e sem combat tech
- **Riscos:** Multiplicar Army traz valores quebrados. Usar `Math.floor()` ou arredondar. A alternativa é modificar `resolveCombat` para aceitar `attackerRealm` e `defenderRealm` opcionais

---

## Tarefa 13 — Integrar bônus de assimilation tech
- **Objetivo:** Reduzir custo de assimilação com assimilation tech.
- **Arquivos prováveis:** `src/logic/economyLogic.ts`
- **Passos:**
  1. Em `assimilateProvince` (linha 143), modificar:
     ```typescript
     const assimDiscount = 1 - (realm.techLevels?.assimilation || 0) * 0.1;
     const cost = Math.floor(50 * assimDiscount);
     ```
  2. Em `massAssimilate` (linha 130), modificar `goldCost: 50` para:
     ```typescript
     goldCost: Math.floor(50 * (1 - (realm.techLevels?.assimilation || 0) * 0.1))
     ```
  3. Rodar `npx tsc --noEmit`
- **Critérios de aceite:** Com assimilation nível 5, custo = 25 (50% de desconto)
- **Como validar:** `npm run build && npm run dev` — verificar custo de assimilação antes/depois de upar
- **Riscos:** `massAssimilate` recebe `state` e `realmId` mas o `realm` pode não ter `techLevels`. Passar o realm corretamente

---

## Tarefa 14 — Criar TechnologyModal (estrutura base) 🔴 FORTE
- **Objetivo:** Criar o modal com layout e 4 categorias, sem lógica de alocação ainda.
- **Arquivos prováveis:** `src/components/TechnologyModal.tsx` (CRIAR)
- **Passos:**
  1. Criar componente React com props: `isOpen`, `onClose`, `gameState`, `onAllocate`
  2. Estrutura HTML/CSS:
     - Header: "🔬 Tecnologia" + pontos disponíveis + geração/turno + botão X
     - 4 seções (movimento, assimilação, recrutamento, combate):
       - Ícone + nome + nível atual
       - Barra de progresso visual (▓▓▓░░░)
       - Bônus atual
       - Custo de próximo nível + botão "↑"
     - Footer opcional: "Reinos Vizinhos" (pode deixar vazio)
  3. Usar `motion/react` para animação de entrada (consistente com outros modais)
  4. Rodar `npx tsc --noEmit`
- **Critérios de aceite:** Modal renderiza sem erros. Abre e fecha
- **Como validar:** `npm run build && npm run dev` — modal abre (via botão temporário)
- **Riscos:** UI pode ficar complexa. Se o coder barato não conseguir, simplificar: remover barra de progresso, usar texto simples

---

## Tarefa 15 — Conectar TechnologyModal ao gameState 🔴 FORTE
- **Objetivo:** Modal lê dados reais e o botão de upgrade funciona.
- **Arquivos prováveis:** `src/components/TechnologyModal.tsx` (EDITAR)
- **Passos:**
  1. Ler `gameState.realms[playerRealmId].techPoints` e `techLevels`
  2. Exibir valor real de pontos e níveis
  3. Botão "↑" chama `onAllocate(category)` que dispara `allocateTechPoints`
  4. Desabilitar botão se `techPoints < cost` ou nível máximo
  5. Barra de progresso mostrar `currentLevel / maxLevel` (10 ou 20)
- **Critérios de aceite:**
  - Modal mostra dados reais do reino do jogador
  - Botão de upgrade funciona e deduz pontos
  - Botão desabilitado quando sem pontos
- **Como validar:** `npm run build && npm run dev` — alocar pontos via modal, ver `techPoints` diminuir
- **Riscos:** `onAllocate` precisa de acesso ao `setGameState`. Implementar via `useGameController`

---

## Tarefa 16 — Integrar TechnologyModal no App e HUD
- **Objetivo:** Modal acessível pelo jogador via botão no HUD.
- **Arquivos prováveis:** `src/App.tsx`, `src/components/HUD.tsx`, `src/hooks/useUI.ts`
- **Passos:**
  1. `useUI.ts`: adicionar `showTechnologyModal: boolean` e setter `setShowTechnologyModal`
  2. `App.tsx`: importar `TechnologyModal`, renderizar quando `ui.showTechnologyModal === true`
  3. `App.tsx`: handler `handleAllocateTech(category)` que chama `allocateTechPoints` e atualiza estado
  4. `HUD.tsx`: adicionar botão "🔬 Tecnologia" que chama `ui.setShowTechnologyModal(true)`
  5. Rodar `npx tsc --noEmit` e `npm run build`
- **Critérios de aceite:** Botão no HUD abre modal. Modal fecha ao clicar X. Upgrade funciona
- **Como validar:** `npm run build && npm run dev` — fluxo completo: abrir modal → alocar ponto → fechar
- **Riscos:** `handleAllocateTech` precisa seguir padrão imutável: deep clone, modificar, setState, setTimeout toast

---

## Tarefa 17 — Validação final do Sprint 01
- **Objetivo:** Garantir que tudo compila e funciona integrado.
- **Arquivos prováveis:** Nenhum (verificação)
- **Passos:**
  1. `npm run lint` — deve passar limpo
  2. `npm run build` — sem erros
  3. `npm run dev` — testar:
     - Iniciar novo jogo (techPoints = 0)
     - Jogar turnos (techPoints sobem)
     - Abrir TechnologyModal (níveis zerados)
     - Alocar ponto (nível sobe, pontos deduzidos)
     - Verificar AP aumentou (se upou movement)
     - Recrutar (se upou recruitment, mais unidades)
- **Critérios de aceite:** Checklist completo sem erros
- **Como validar:** Executar os 3 comandos e o teste manual
- **Riscos:** Nenhum novo — apenas validação

---

*Sprint 01 quebrada — 17 tarefas — Reinos Medievais — Fase 2*
