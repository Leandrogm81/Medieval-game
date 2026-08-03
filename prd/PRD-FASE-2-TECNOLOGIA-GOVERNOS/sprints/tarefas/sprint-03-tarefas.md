# Sprint 03 quebrada em tarefas menores — Sistema de Governos

> **Coder:** 🟢 BARATO (T1, T2, T4, T6-T12) | 🔴 FORTE (T3, T5)
> **Subpasta de destino:** `tarefas/sprint-03/`

---

## Tarefa 1 — Adicionar GovernmentType e GovernmentStats em types.ts
- **Objetivo:** Criar os tipos base para o sistema de governos.
- **Arquivos prováveis:** `src/types.ts`
- **Passos:**
  1. Adicionar `GovernmentType`:
     ```typescript
     export type GovernmentType = 'monarchy' | 'republic' | 'feudal' | 'theocracy' | 'despotism' | 'oligarchy' | 'tribal';
     ```
  2. Adicionar `GovernmentStats` (interface com ~14 campos numéricos)
  3. Adicionar em `Realm`: `government: GovernmentType` e `governmentChangeCooldown: number`
  4. `npx tsc --noEmit`
- **Critérios de aceite:** `tsc --noEmit` passa
- **Como validar:** `npx tsc --noEmit`
- **Riscos:** Nenhum

---

## Tarefa 2 — Criar GOVERNMENT_STATS (tabela de stats)
- **Objetivo:** Criar `governmentLogic.ts` com a tabela completa de 7 governos.
- **Arquivos prováveis:** `src/logic/governmentLogic.ts` (CRIAR)
- **Passos:**
  1. Criar arquivo
  2. Implementar `GOVERNMENT_STATS` conforme PRD (seção 3):
     - Monarchy: defense 1.10, diplomaticActions -1
     - Republic: goldIncome 1.05, diplomaticActions +1, stabilityInDistant -10
     - Feudal: foodProduction 1.15, vassalLoyaltyBonus 10, goldIncome 0.95
     - Theocracy: loyalty (global +20%), techGeneration 0.90
     - Despotism: attack 1.15, recruitmentCost 0.80, populationGrowth 0.80
     - Oligarchy: vassalGoldBonus 0.25, relationPenalty -10
     - Tribal: strategicResourceBonus 2.0, maxAP -1, techGeneration 0.80
  3. `npx tsc --noEmit`
- **Critérios de aceite:** Tabela compila, todos os 7 governos têm stats
- **Como validar:** `npx tsc --noEmit`
- **Riscos:** Conferir se os valores batem exatamente com o PRD

---

## Tarefa 3 — Criar isProvinceDistant (governmentLogic.ts)
- **Objetivo:** Função BFS que determina se província é distante da capital.
- **Arquivos prováveis:** `src/logic/governmentLogic.ts` (EDITAR)
- **Passos:**
  1. Implementar `isProvinceDistant(state, provinceId, realm, threshold = 2)`
  2. Usar BFS a partir de `realm.capitalId`
  3. Se `capitalId` não existe, retornar `false`
  4. Retornar `true` se distância BFS >= threshold
- **Critérios de aceite:**
  - Capital: `false`
  - Vizinha direta (1 salto): `false` (threshold default 2)
  - 2 saltos ou mais: `true`
- **Como validar:** `npx tsc --noEmit`
- **Riscos:** Reutilizar `calculateDistancesFromCapital` existente em `turnLogic.ts` (linha 360) para evitar duplicação

---

## Tarefa 4 — Criar changeGovernment (governmentLogic.ts)
- **Objetivo:** Função que valida e executa mudança de governo.
- **Arquivos prováveis:** `src/logic/governmentLogic.ts` (EDITAR)
- **Passos:**
  1. Implementar `changeGovernment(realm, newType, state, force)`
  2. Se `!force`: validar `realm.gold >= 500`, `realm.materials >= 200`, `realm.governmentChangeCooldown === 0`
  3. Se `force`: ignorar custo de recursos, ainda causa instabilidade
  4. Aplicar: `realm.government = newType`, `realm.governmentChangeCooldown = 20`, -30 loyalty em todas as províncias por 3 turnos
  5. Retornar `{ success: boolean, message: string }`
- **Critérios de aceite:**
  - Mudança normal cobra 500g + 200m
  - `force=true` ignora custo
  - Cooldown setado para 20 turnos
- **Como validar:** `npx tsc --noEmit`
- **Riscos:** Tracking de instabilidade temporária (-30 loyalty por 3 turnos) — adicionar campo `realm.stabilityPenaltyTurns: number`

---

## Tarefa 5 — Criar checkRevolution (governmentLogic.ts)
- **Objetivo:** Verificar se ocorre revolução por baixa estabilidade.
- **Arquivos prováveis:** `src/logic/governmentLogic.ts` (EDITAR)
- **Passos:**
  1. Implementar `checkRevolution(realm, state): GovernmentType | null`
  2. Contar províncias com `stability < 20`
  3. Se > 50% das províncias: 10% de chance (`Math.random() < 0.1`)
  4. Se ocorrer: escolher governo aleatório diferente do atual, retornar
  5. Senão: `null`
- **Critérios de aceite:** ~10% chance/turno quando >50% províncias com estabilidade < 20
- **Como validar:** `npx tsc --noEmit`
- **Riscos:** `stability` pode ser undefined. Usar `p.stability ?? 70`

---

## Tarefa 6 — Criar getGovernmentFlavor (governmentLogic.ts)
- **Objetivo:** Textos de sabor para a UI.
- **Arquivos prováveis:** `src/logic/governmentLogic.ts` (EDITAR)
- **Passos:**
  1. Criar record com frases do PRD (seção 3, coluna "Flavor")
  2. Exportar `getGovernmentFlavor(type)` que retorna a string
- **Critérios de aceite:** Cada governo tem seu texto de sabor
- **Como validar:** `npx tsc --noEmit`
- **Riscos:** Nenhum

---

## Tarefa 7 — Atualizar mapGeneration.ts para governo inicial
- **Objetivo:** Todo reino nasce com `government: 'monarchy'`.
- **Arquivos prováveis:** `src/logic/mapGeneration.ts`
- **Passos:**
  1. Na criação de realms, adicionar:
     ```typescript
     government: 'monarchy',
     governmentChangeCooldown: 0,
     ```
  2. `npm run build`
- **Critérios de aceite:** Novo jogo: todos os reinos são Monarchy
- **Como validar:** `npm run build && npm run dev` — verificar `gameState.realms[id].government`
- **Riscos:** Nenhum

---

## Tarefa 8 — Integrar cooldown e penalidade de estabilidade em processEndOfTurn
- **Objetivo:** Decrementar cooldown e aplicar penalidade de instabilidade a cada turno.
- **Arquivos prováveis:** `src/logic/turnLogic.ts`
- **Passos:**
  1. No loop de realms, decrementar: `realm.governmentChangeCooldown = Math.max(0, (realm.governmentChangeCooldown || 0) - 1)`
  2. Se `realm.stabilityPenaltyTurns > 0`: aplicar -30 loyalty nas províncias e decrementar
  3. `npx tsc --noEmit`
- **Critérios de aceite:** Cooldown diminui 1 por turno. Penalidade some após 3 turnos
- **Como validar:** `npm run build && npm run dev` — mudar governo, ver cooldown e penalidade
- **Riscos:** `stabilityPenaltyTurns` precisa ser adicionado em `Realm` (types.ts)

---

## Tarefa 9 — Integrar checkRevolution em processEndOfTurn
- **Objetivo:** Revolução checada a cada turno.
- **Arquivos prováveis:** `src/logic/turnLogic.ts`
- **Passos:**
  1. No loop de realms, após processamento de estabilidade, chamar `checkRevolution(realm, newState)`
  2. Se retornar um governo: aplicar `realm.government = newGov`, logar evento
  3. `npx tsc --noEmit`
- **Critérios de aceite:** Revolução ocorre quando condições são atingidas
- **Como validar:** `npm run build && npm run dev` — causar baixa estabilidade, ver revolução
- **Riscos:** Revolução pode ocorrer múltiplas vezes no mesmo turno. Garantir que o governo do reino é atualizado antes do próximo loop

---

## Tarefa 10 — Integrar applyGovernmentBonuses em processEndOfTurn 🔴 FORTE
- **Objetivo:** Aplicar todos os bônus e penalidades de governo nos cálculos de renda.
- **Arquivos prováveis:** `src/logic/turnLogic.ts`
- **Passos:**
  1. No loop de realms (linha 513), após cálculo base de renda (linhas 588-596):
     - Monarchy: sem alteração na renda; defesa +10% aplicado no combate (T12)
     - Republic: `goldIncome *= 1.05`; estabilidade em províncias distantes -= 10%
     - Feudal: `foodIncome *= 1.15`; `goldIncome *= 0.95`
     - Theocracy: loyalty +20% em todas as províncias; tech generation *= 0.90
     - Despotism: ataque +15% (T12); `recruitmentCost *= 0.80`; `populationGrowth *= 0.80`
     - Oligarchy: vassalos rendem +25% mais gold; -10 relações/turno
     - Tribal: recursos estratégicos dobrados; AP -= 1; tech *= 0.80
  2. Aplicar onde aplicável no mesmo loop
  3. `npx tsc --noEmit`
- **Critérios de aceite:** Cada governo modifica os valores corretamente
- **Como validar:** `npm run build && npm run dev` — mudar governo, ver renda/AP no próximo turno
- **Riscos:** Múltiplas alterações no loop central do jogo. Testar cada governo individualmente

---

## Tarefa 11 — Atualizar generateTechPoints com penalidade de governo
- **Objetivo:** Theocracy e Tribal reduzem geração de tech.
- **Arquivos prováveis:** `src/logic/technologyLogic.ts`
- **Passos:**
  1. Em `generateTechPoints`, substituir placeholder `govPenalty = 0`:
     ```typescript
     import { GOVERNMENT_STATS } from './governmentLogic';
     const govStats = GOVERNMENT_STATS[realm.government || 'monarchy'];
     const govPenalty = 1 - (govStats.techGeneration || 0);
     ```
  2. `npx tsc --noEmit`
- **Critérios de aceite:** Theocracy gera 10% menos tech, Tribal gera 20% menos
- **Como validar:** `npm run build && npm run dev` — verificar geração de tech com Theocracy vs Monarchy
- **Riscos:** Dependência circular se `governmentLogic.ts` importar `technologyLogic.ts`. Manter import unidirecional

---

## Tarefa 12 — Aplicar bônus de ataque/defesa do governo no combate
- **Objetivo:** Despotism (+15% atk) e Monarchy (+10% def) afetam batalhas.
- **Arquivos prováveis:** `src/logic/turnLogic.ts` (processMarchOrders), `src/logic/aiLogic.ts` (executeAIAttack)
- **Passos:**
  1. Em `processMarchOrders` (linha 285) e `executeAIAttack` (linha 52), ANTES de `resolveCombat`:
     ```typescript
     import { GOVERNMENT_STATS } from './governmentLogic';
     const atkGov = GOVERNMENT_STATS[attackerRealm.government]?.attack || 1;
     const defGov = GOVERNMENT_STATS[defenderRealm.government]?.defense || 1;
     // Multiplicar poder de ataque/defesa
     ```
  2. `npx tsc --noEmit`
- **Critérios de aceite:** Despotism causa 15% mais dano; Monarchy recebe 10% menos dano
- **Como validar:** `npm run build && npm run dev` — testar batalha com Despotism vs Monarchy
- **Riscos:** `defenderRealm.government` pode ser undefined em saves antigos. Usar fallback `'monarchy'`

---

## Tarefa 13 — Criar GovernmentModal (UI) 🔴 FORTE
- **Objetivo:** Modal para o jogador ver e mudar de governo.
- **Arquivos prováveis:** `src/components/GovernmentModal.tsx` (CRIAR)
- **Passos:**
  1. Criar componente com props: `isOpen`, `onClose`, `gameState`, `onChangeGovernment`
  2. Listar 7 governos em cards/linhas:
     - Nome + ícone
     - Bônus (verde) e penalidades (vermelha)
     - Texto de sabor (itálico, cinza)
     - Governo atual destacado (borda dourada)
  3. Botão "Reformar Governo" no governo selecionado:
     - Mostrar custo (500g + 200m)
     - Mostrar cooldown se > 0: "Disponível em X turnos"
     - Confirmação: modal secundário ou alerta
  4. `npx tsc --noEmit`
- **Critérios de aceite:** Modal renderiza, muda governo ao clicar, mostra cooldown
- **Como validar:** `npm run build && npm run dev` — abrir modal, selecionar governo, confirmar
- **Riscos:** UI complexa. O coder barato pode fazer layout simples (lista vertical sem cards)

---

## Tarefa 14 — Integrar GovernmentModal no App e HUD
- **Objetivo:** Modal acessível pelo HUD.
- **Arquivos prováveis:** `src/App.tsx`, `src/components/HUD.tsx`, `src/hooks/useUI.ts`
- **Passos:**
  1. `useUI.ts`: adicionar `showGovernmentModal: boolean` e setter
  2. `App.tsx`: importar e renderizar `GovernmentModal`
  3. `HUD.tsx`: botão "🏛️ Governo"
  4. Handler `handleChangeGovernment` em `useGameController.ts` que chama `changeGovernment`
  5. `npm run build`
- **Critérios de aceite:** Botão no HUD abre/fecha modal, mudança persiste
- **Como validar:** `npm run build && npm run dev` — fluxo completo
- **Riscos:** Handler precisa seguir padrão imutável (deep clone)

---

## Tarefa 15 — Validação final do Sprint 03
- **Objetivo:** Testar todos os 7 governos.
- **Arquivos prováveis:** Nenhum
- **Passos:**
  1. `npm run lint && npm run build`
  2. `npm run dev` — testar cada governo:
     - Monarchy: +10% defesa
     - Republic: +5% gold, províncias distantes perdem estabilidade
     - Feudal: +15% food, -5% gold
     - Theocracy: +20% loyalty, -10% tech
     - Despotism: +15% ataque, -20% pop growth
     - Oligarchy: +25% gold de vassalos, -10 relações
     - Tribal: recurso dobrado, -1 AP, -20% tech
  3. Testar mudança de governo: custo, cooldown
  4. Testar revolução
- **Critérios de aceite:** Checklist completo
- **Como validar:** Executar comandos e teste manual
- **Riscos:** Nenhum

---

*Sprint 03 quebrada — 15 tarefas — Reinos Medievais — Fase 2*
