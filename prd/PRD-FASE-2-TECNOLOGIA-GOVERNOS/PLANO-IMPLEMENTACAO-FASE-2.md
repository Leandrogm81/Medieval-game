# Plano de Implementação — Fase 2: Tecnologia, Governos e Profundidade Estratégica

> **Baseado em:** PRD-FASE-2-TECNOLOGIA-GOVERNOS-CONSOLIDADO.md (v1.1)
> **Data:** 08/05/2026
> **Estimativa:** 22.5 dias (8 sprints)
> **Formato:** Master Plan — execução sequencial por agente de código

---

## 1. Premissas

1. **Stack:** React 19 + TypeScript 5.8 + Vite 6 + Tailwind v4 + motion (Framer Motion) + Tone.js. O lint é `tsc --noEmit`.
2. **Projeto existente:** Fase 1 concluída. Os arquivos `src/types.ts`, `src/logic/*`, `src/hooks/*`, `src/components/*` já existem com 6 modos de mapa (`political`, `economic`, `military`, `diplomatic`, `resources`, `trade`), IA simples, sistema de guerra/marcha, economia, diplomacia, salvamento.
3. **Estado é imutável:** Todo handler usa `deepClone` (JSON.parse/stringify). NUNCA chamar `setGameState` dentro de updater de `setGameState`. SEMPRE usar `setTimeout(..., 0)` para `showToast` após `setGameState`.
4. **Funções em `src/logic/` devem ser puras:** Sem side-effects de React. `generateTechPoints`, `calculateMilitaryPower`, etc.
5. **`aiLogic.ts` contém `declareWar` local duplicada** (linhas 6-31) — deve ser removida e substituída pela exportada de `diplomacyLogic.ts`.
6. **`GameEndModal.tsx`** já existe com estrutura de vitória/derrota e usa `isPlayerWinner: !gameState.gameOver` (linha 18), mas tem placeholder `enemiesDefeated: 0`.
7. **`persistence.ts`** usa localStorage, sem versionamento de schema. Precisa adicionar `saveMigration.ts`.
8. **`Map.tsx`** coloração por view mode nas linhas 253-263. Labels nas linhas 298-311. Resources mode é condicional separado (linhas 362-390).
9. **`App.tsx`** tem handler de teclado (linhas 229-308) com atalhos 1-5, W, A, S, Q, E, F, Espaço.
10. **`useGameController.ts`:** `handleEndTurn` (linha 97-146) chama `processAI(stateToProcess)` depois `processEndOfTurn(stateToProcess)`. `handleLoad` (linha 799-806) chama `persistence.loadSave(id)`.

---

## 2. Visão geral das sprints

| Sprint | Nome | Funcionalidades | Dias |
|--------|------|----------------|------|
| 0 | Preparação e leitura | Mapeamento da codebase, verificação de dependências | 0.5 |
| 1 | Tipos + Tecnologia | Campos novos em types.ts, technologyLogic.ts, TechnologyModal.tsx, integração em turnLogic/economy/combat | 3.5 |
| 2 | Capitulação | originalOwnerId, checkCapitulation, executeCapitulation em turnLogic.ts | 1.5 |
| 3 | Governos | governmentLogic.ts, GovernmentModal.tsx, integração nos cálculos | 2.5 |
| 4 | Modos de Mapa | 7 novos modos em Map.tsx + atalhos 6-9,0,G,F em App.tsx | 2.0 |
| 5 | Empréstimos + IA Avançada | economyLogic loans, AI personality-based, refatoração declareWar | 3.5 |
| 6 | Música Ambiente | musicLogic.ts, assets MP3, toggle e crossfade | 4.0 |
| 7 | Liberty + Derrota + Responsividade | processVassalLiberty, GameEndModal narrativo, modais mobile | 3.5 |
| 8 | Migração de Save + Integração | saveMigration.ts, testes de integração, validação final | 2.0 |

---

## 3. Sprint 0 — Preparação e leitura do projeto

### Objetivo
Garantir que o agente implementador entenda a estrutura completa do projeto antes de qualquer alteração.

### Arquivos a inspecionar (em ordem)
| Ordem | Arquivo | O que verificar |
|-------|---------|-----------------|
| 1 | `package.json` | Scripts (`dev`, `build`, `lint`), dependências (React 19, Vite, Tailwind v4, Tone.js), natives de WSL |
| 2 | `src/types.ts` | Interfaces `Realm`, `Province`, `GameState`, `ViewMode`, `War`, `MarchOrder`, `GameSettings` |
| 3 | `src/logic/turnLogic.ts` | `processEndOfTurn` (linha 510), `processActiveWars` (linha 403), `findPath`, `calculateDistancesFromCapital` |
| 4 | `src/logic/aiLogic.ts` | `processAI` (linha 80), `declareWar` local (linha 6-31), `executeAIAttack` (linha 33) |
| 5 | `src/logic/economyLogic.ts` | `executeRecruitment`, `executeBuilding`, `getMaxRecruitable`, `executeTradeExchange` |
| 6 | `src/logic/combatLogic.ts` | `resolveCombat` (linha 45), `calculateRetreat` |
| 7 | `src/logic/diplomacyLogic.ts` | `declareWar` (linha 574), `isWarBetween`, `getMilitaryPower` local (linha 148) |
| 8 | `src/logic/game-constants.ts` | `ACTION_COSTS`, `UNIT_STATS`, `BUILDING_STATS` |
| 9 | `src/components/Map.tsx` | Coloração (linhas 253-263), labels (linhas 298-311), resources mode (linhas 362-390) |
| 10 | `src/components/HUD.tsx` | Estrutura do painel lateral |
| 11 | `src/components/GameEndModal.tsx` | Estrutura atual (linhas 1-89) |
| 12 | `src/hooks/useGameController.ts` | `handleEndTurn` (linha 97), `handleLoad` (linha 799), `handleAction` |
| 13 | `src/persistence.ts` | `saveAutoSave`, `loadSave`, `listSaves` |
| 14 | `src/App.tsx` | Keydown handler (linhas 229-308), modais, `initAudio` |
| 15 | `src/index.css` | Estilos base, variáveis CSS |

### Dependências a verificar
```bash
cd "/mnt/c/Users/leand/OneDrive/Documentos/Medieval game/Medieval-game"
npm install
npx tsc --noEmit        # deve passar limpo (ou com erros pré-existentes conhecidos)
npm run build           # deve compilar sem erros
```

### Comandos iniciais
```bash
npm run lint    # alias: tsc --noEmit
npm run build   # vite build
npm run dev     # vite --port=3000 --host=0.0.0.0
```

### Riscos
- **Erros de typecheck pré-existentes:** Se `tsc --noEmit` falhar por erros que já existiam na Fase 1, documentá-los e não corrigi-los neste sprint.
- **Natives do WSL:** Podem faltar `@esbuild/linux-x64`, `@rollup/rollup-linux-x64-gnu` etc. — instalar conforme necessário.
- **Vite HMR stale:** Após edições, pode ser necessário reiniciar em porta nova.

---

## 4. Sprint 1 — Tipos Base + Sistema de Tecnologia

**Objetivo:** Adicionar todos os novos campos de tipo em `types.ts` e implementar o sistema completo de tecnologia (geração, alocação, bônus, UI).

### Arquivos
| Ação | Arquivo |
|------|---------|
| Editar | `src/types.ts` |
| Criar | `src/logic/technologyLogic.ts` |
| Criar | `src/components/TechnologyModal.tsx` |
| Editar | `src/logic/turnLogic.ts` |
| Editar | `src/logic/economyLogic.ts` |
| Editar | `src/logic/combatLogic.ts` |
| Editar | `src/hooks/useGameController.ts` |
| Editar | `src/hooks/useUI.ts` |
| Editar | `src/components/HUD.tsx` |
| Editar | `src/App.tsx` |
| Editar | `src/components/Map.tsx` |

### Tarefas (em ordem)

**T1 — Adicionar `TechLevels` e campos de `Realm` em `types.ts`**
- Adicionar interface `TechLevels` com `movement`, `assimilation`, `recruitment`, `combat` (todos number, 0-10 ou 0-20)
- Adicionar a `Realm`: `techPoints: number` e `techLevels: TechLevels`
- Adicionar ao `ViewMode`: `'technology'` (como 7º modo, mas a implementação visual virá no Sprint 4)
- Critério de aceite: `tsc --noEmit` passa. `Realm` tem os novos campos.

**T2 — Criar `src/logic/technologyLogic.ts` com funções puras**
- `generateTechPoints(realm, state)` → soma 1 base + pop/500 + workshops + courts/2, aplica penalidade de governo, cap 20. Função pura.
- `getTechUpgradeCost(currentLevel)` → `10 + 5 * level * (level + 1) / 2`
- `allocateTechPoints(realm, category)` → deduz cost de `realm.techPoints`, incrementa `realm.techLevels[category]`, retorna boolean
- `getTechEffects(realm)` → retorna `{ bonusAP, assimDiscount, recruitBonus, combatBonus }`
- `applyTechCombatBonus(attacker, defender, atkPower, defPower)` → aplica +5% por nível de combat tech
- Critério de aceite: funções exportadas, puras. `generateTechPoints(Realm, GameState)` testável.

**T3 — Integrar `generateTechPoints` em `processEndOfTurn` (`turnLogic.ts`)**
- No loop de realms em `processEndOfTurn` (linha 513), após cálculo de renda (antes do reset de AP, linha 688), chamar `generateTechPoints` e somar a `realm.techPoints`
- Critério de aceite: ao fim de cada turno, `realm.techPoints` incrementa.

**T4 — Integrar bônus de tech em `economyLogic.ts` (`getMaxRecruitable`)**
- `getMaxRecruitable` (linha 300): aplicar `maxRecruitable *= (1 + realm.techLevels.recruitment * 0.1)`
- Critério de aceite: com recruitment nível 3, pode recrutar 30% mais.

**T5 — Integrar bônus de tech em `combatLogic.ts` (`resolveCombat`)**
- `resolveCombat` (linha 45): após cálculo de `atkPower` e `defPower`, aplicar bônus de combat tech se `state` for passado
- Como `resolveCombat` não recebe `Realm`, adicionar parâmetro opcional ou aplicar bônus no caller (`turnLogic.ts` `processMarchOrders` linha 285)
- Critério de aceite: com combat nível 4 (+20%), poder de ataque e defesa refletem o bônus.

**T6 — Integrar bônus de AP no reset de `processEndOfTurn`**
- Em `processEndOfTurn` (linha 688), antes de `realm.actionPoints = realm.maxActionPoints`, calcular `realm.maxActionPoints = Math.max(2, 5 + realm.techLevels.movement * 0.5 - govPenalty)`
- Critério de aceite: com movement nível 6, maxAP = 8. Com Tribal (-1 AP) e movement nível 6, maxAP = 7. Nunca < 2.

**T7 — Criar `TechnologyModal.tsx`**
- Modal com 4 categorias (movimento, assimilação, recrutamento, combate), cada uma mostrando nível atual, barra de progresso, custo de upgrade, bônus
- Botão de upgrade que chama `allocateTechPoints` via `useGameController`
- Exibir `techPoints` disponíveis e geração por turno (calculada via `generateTechPoints`)
- Seção "Reinos Vizinhos" mostrando tech levels de outros reinos
- Layout conforme wireframe do PRD (seção 1, UI)
- Critério de aceite: modal abre/fecha, alocação funciona, pontos são deduzidos corretamente.

**T8 — Integrar TechnologyModal no HUD e App**
- `HUD.tsx`: adicionar botão "🔬 Tecnologia" que abre o modal
- `App.tsx`: importar `TechnologyModal`, controlar visibilidade via `useUI`
- Critério de aceite: botão visível no HUD, modal abre ao clicar.

**T9 — Aplicar bônus de assimilation tech no custo de assimilação**
- Em `economyLogic.ts` `assimilateProvince` (linha 143): `cost = 50 * (1 - realm.techLevels.assimilation * 0.1)`
- Em `massAssimilate`: mesmo ajuste no config `goldCost`
- Critério de aceite: com assimilation nível 5, custo = 25 (50% de desconto).

**T10 — +1 loyalty global ao subir qualquer tech**
- Em `allocateTechPoints`, após incrementar nível, percorrer províncias do reino e incrementar loyalty em +1
- OU emitir um efeito que `processEndOfTurn` aplica
- Critério de aceite: ao subir uma tech, todas as províncias ganham +1 loyalty.

### Critérios de aceite da sprint
- [ ] `tsc --noEmit` limpo
- [ ] `npm run build` sem erros
- [ ] `generateTechPoints` retorna valor esperado para reino com X pop, Y workshops, Z courts
- [ ] `getTechUpgradeCost(0) === 10`, `getTechUpgradeCost(5) === 85`
- [ ] Alocação de tech deduz pontos e incrementa nível
- [ ] Bônus de movement: +0.5 AP por nível, piso mínimo 2
- [ ] Bônus de recruitment: +10% pop recrutável por nível
- [ ] Bônus de combat: +5% atk/def por nível
- [ ] Cap de 20 pontos gerados por turno
- [ ] +1 loyalty global ao subir tech
- [ ] TechnologyModal funcional

### Comandos de validação
```bash
cd "/mnt/c/Users/leand/OneDrive/Documentos/Medieval game/Medieval-game"
npm run lint         # deve passar limpo
npm run build        # deve compilar
npm run dev          # testar manualmente
```

### Riscos
- **Penalidades de governo ainda não existem** (virão no Sprint 3): usar placeholder `govPenalty = 0` em `generateTechPoints` e no cálculo de AP até o Sprint 3
- **`resolveCombat` não recebe `Realm`:** pode precisar de refactor na assinatura OU aplicar bônus no caller (`processMarchOrders` em `turnLogic.ts`). Preferir aplicar no caller para manter `resolveCombat` pura.
- **Tone.js conflito:** O projeto já importa Tone.js. `TechnologyModal` pode usar motion/react normalmente.

### O que NÃO deve ser alterado
- `src/logic/mapGeneration.ts` — geração de mapa
- `src/logic/diplomacyLogic.ts` — diplomacia (exceto se a função `declareWar` local de aiLogic.ts for removida)
- `src/logic/game-constants.ts` — a menos que precise de novas constantes documentadas no PRD
- `src/logic/sfxLogic.ts` — efeitos sonoros
- Estrutura de marcha/combate em `turnLogic.ts` `processMarchOrders`

---

## 5. Sprint 2 — Capitulação (Auto-Surrender)

**Objetivo:** Implementar o sistema de capitulação onde um reino se rende automaticamente ao perder território suficiente.

### Arquivos
| Ação | Arquivo |
|------|---------|
| Editar | `src/types.ts` |
| Editar | `src/logic/turnLogic.ts` |
| Editar | `src/logic/diplomacyLogic.ts` |

### Tarefas (em ordem)

**T1 — Adicionar `originalOwnerId` em `Province` e `CapitulationResult` em `types.ts`**
- `Province.originalOwnerId?: string` — campo opcional
- Interface `CapitulationResult` com `winnerId`, `loserId`, `occupationRatio`, `provincesToCede`
- Critério de aceite: `tsc --noEmit` passa.

**T2 — Setar `originalOwnerId` ao conquistar província em guerra**
- Em `turnLogic.ts` `processMarchOrders` (linha 289), antes de `prov.ownerId = baseOrder.realmId`, salvar `prov.originalOwnerId = prov.ownerId`
- Em `aiLogic.ts` `executeAIAttack` (linha 68), mesmo padrão
- Critério de aceite: ao conquistar província durante guerra ativa, `originalOwnerId` é setado.

**T3 — Limpar `originalOwnerId` ao fim da guerra**
- Em `processActiveWars` (linha 403), no bloco `warsToFinish` (linha 456), iterar sobre províncias envolvidas e limpar `originalOwnerId = undefined`
- Critério de aceite: ao terminar guerra, `originalOwnerId` é `undefined` em todas as províncias dos beligerantes.

**T4 — Implementar `checkCapitulation` em `turnLogic.ts`**
- Nova função `checkCapitulation(state, war)` → retorna `CapitulationResult | null`
- Condições: >60% províncias ocupadas OU warScore > 70 OU (capital capturada + warScore > 50)
- Usar `originalOwnerId` para detectar ocupação
- Critério de aceite: função retorna resultado quando condições são atingidas.

**T5 — Implementar `selectProvincesToCede` e `executeCapitulation`**
- `selectProvincesToCede(state, occupiedIds, defender, fraction)` → ordenar por distância BFS da capital do defensor, retornar as mais distantes
- `executeCapitulation(state, result)` → ceder províncias, transformar em vassalo ou eliminar, limpar `originalOwnerId`, penalidade de -20 loyalty por 5 turnos
- Critério de aceite: províncias cedidas são as mais distantes da capital do derrotado.

**T6 — Integrar `checkCapitulation` em `processActiveWars`**
- Conforme diagrama do PRD: após loop de batalhas, antes do cálculo de exaustão
- Estrutura: para cada `activeWar`, checar `checkCapitulation`. Se retornar resultado, executar `executeCapitulation` e pular exaustão para esta guerra
- Critério de aceite: fluxo `batalhas → capitulação → exaustão` funciona.

**T7 — Adicionar notificação especial de capitulação**
- Log formatado conforme PRD: "🏳️ {Derrotado} se rendeu a {Vencedor}!..."
- Critério de aceite: notificação aparece no TurnSummary.

### Critérios de aceite da sprint
- [ ] >60% províncias ocupadas → capitulação
- [ ] War score >70% → capitulação
- [ ] Capital capturada + war score >50% → capitulação
- [ ] `originalOwnerId` setado ao conquistar e limpo ao fim da guerra
- [ ] Derrotado vira vassalo se ainda tem províncias
- [ ] Derrotado eliminado se perdeu todas
- [ ] Províncias cedidas são as mais distantes
- [ ] Vencedor sofre -20 loyalty por 5 turnos

### Comandos de validação
```bash
npm run lint && npm run build
```

### Riscos
- **`findPath` existente:** A função `findPath` em `turnLogic.ts` (linha 89) usa BFS. Pode ser reutilizada para `selectProvincesToCede` ou precisar de adaptação (ela filtra por `realmId`). Verificar se aceita pathfinding entre províncias de reinos diferentes.
- **Interação com o sistema de vassalagem existente:** O PRD não especifica se já existe `vassalOf` sendo usado. Verificar se há lógica de tributo de vassalos em `processEndOfTurn` (linha 614-623).
- **Guerra com múltiplos atacantes:** O PRD assume 1 atacante vs 1 defensor. Se houver guerras multilaterais, `originalOwnerId` pode ter comportamento ambíguo.

### O que NÃO deve ser alterado
- `src/logic/combatLogic.ts` — resolução de combate
- `src/logic/economyLogic.ts` — economia
- `src/components/*` — sem alterações de UI neste sprint
- Sistema de exaustão existente em `processActiveWars` — apenas adicionar capitulação ANTES

---

## 6. Sprint 3 — Sistema de Governos

**Objetivo:** Implementar 7 tipos de governo com bônus/penalidades, modal de seleção, mudança com custo/cooldown, e revolução.

### Arquivos
| Ação | Arquivo |
|------|---------|
| Editar | `src/types.ts` |
| Criar | `src/logic/governmentLogic.ts` |
| Criar | `src/components/GovernmentModal.tsx` |
| Editar | `src/logic/turnLogic.ts` |
| Editar | `src/logic/technologyLogic.ts` |
| Editar | `src/hooks/useGameController.ts` |
| Editar | `src/hooks/useUI.ts` |
| Editar | `src/components/HUD.tsx` |
| Editar | `src/App.tsx` |

### Tarefas (em ordem)

**T1 — Adicionar tipos de governo em `types.ts`**
- `GovernmentType` (union type dos 7)
- `GovernmentStats` (interface com todos os modificadores: defense, attack, goldIncome, etc.)
- Campos em `Realm`: `government: GovernmentType` (default `'monarchy'`), `governmentChangeCooldown: number`
- Critério de aceite: `tsc --noEmit` passa.

**T2 — Criar `src/logic/governmentLogic.ts`**
- `GOVERNMENT_STATS: Record<GovernmentType, GovernmentStats>` — tabela completa com os 7 governos
- `applyGovernmentBonuses(realm, state)` — aplica bônus/penalidades (defesa, ataque, gold, food, tech, recrutamento, etc.)
- `changeGovernment(realm, newType, state, force)` — custo 500g+200m, instabilidade -30 loyalty/3 turnos, cooldown 20 turnos. Se `force=true`, ignora custo mas ainda causa instabilidade
- `checkRevolution(realm, state)` — se estabilidade < 20 em >50% das províncias, 10% chance/turno de revolução
- `getGovernmentFlavor(type)` — texto de sabor
- `isProvinceDistant(state, provinceId, realm, threshold=2)` — BFS da capital, retorna true se caminho >= threshold saltos
- Critério de aceite: todas as funções exportadas e puras.

**T3 — Integrar `applyGovernmentBonuses` em `processEndOfTurn`**
- No loop de realms (linha 513), após cálculo de renda base, aplicar modificadores de governo
- Bônus de defesa: multiplicar `defPower` em combate
- Penalidade de tech: aplicar em `generateTechPoints` (já tem placeholder do Sprint 1)
- Bônus/penalidade de AP: aplicar no reset de AP (já tem placeholder do Sprint 1)
- Critério de aceite: bônus e penalidades refletidos nos cálculos.

**T4 — Integrar `checkRevolution` em `processEndOfTurn`**
- Após processamento de estabilidade, checar revolução
- Se ocorrer: mudar governo aleatoriamente, logar evento
- Critério de aceite: revolução ocorre com ~10% chance/turno quando condições são atingidas.

**T5 — Criar `GovernmentModal.tsx`**
- Lista de 7 governos com nome, bônus, penalidade, texto de sabor
- Botão "Reformar Governo" mostrando custo (500g + 200m + instabilidade)
- Indicador de cooldown
- Confirmação: "Esta reforma custará 500 gold, 200 materials e causará instabilidade (-30 loyalty) por 3 turnos. Continuar?"
- Layout conforme PRD (seção 3)
- Critério de aceite: modal funcional, muda governo, cobra custo correto.

**T6 — Integrar GovernmentModal no HUD e App**
- `HUD.tsx`: botão "🏛️ Governo" que abre modal
- `App.tsx`: keydown handler
- Critério de aceite: modal acessível via HUD.

**T7 — Aplicar penalidade de "províncias distantes" para Republic**
- Em `processEndOfTurn`, no loop de províncias, chamar `isProvinceDistant` para Republic
- Se distante, aplicar -10% estabilidade
- Critério de aceite: capital + vizinhas diretas imunes, províncias a ≥2 saltos sofrem penalidade.

**T8 — Aplicar bônus/penalidades restantes**
- Oligarchy: +25% gold de vassalos (em `processEndOfTurn` linha 614-623)
- Oligarchy: -10 relações com todos os reinos (a cada turno)
- Tribal: recurso estratégico dobrado (em `processEndOfTurn` linha 593-596)
- Despotism: recrutamento 20% mais barato (em `getRecruitCost` ou `executeRecruitment`)
- Theocracy: -10% tech generation (em `generateTechPoints`)
- Critério de aceite: cada governo tem seus bônus/penalidades aplicados.

### Critérios de aceite da sprint
- [ ] 7 governos disponíveis com stats corretos
- [ ] Mudança de governo custa 500g + 200m + instabilidade
- [ ] Cooldown de 20 turnos
- [ ] Revolução ocorre com estabilidade < 20 em >50% das províncias
- [ ] `maxActionPoints` nunca < 2 (Tribal + outras penalidades)
- [ ] Republic: -10% estabilidade em províncias distantes (≥2 saltos)
- [ ] Oligarchy: +25% gold de vassalos, -10 relações
- [ ] Tribal: recurso dobrado, -1 AP, -20% tech

### Comandos de validação
```bash
npm run lint && npm run build
```

### Riscos
- **Interação com bônus de tech já implementados:** Garantir que `maxActionPoints` final reflita `Math.max(2, 5 + techBonus - govPenalty)`
- **Overextension > 80 não tem tracking atualizado por turno:** Já existe `realm.overextension` sendo decrementado em 5 por turno (linha 522). A revolução usa `estabilidade < 20` que é calculada em `calculateStabilityDelta` (linha 339). Verificar que a estabilidade é atualizada antes de `checkRevolution`.
- **Cooldown de mudança de governo:** Precisa de tracking de quantos turnos restam. Usar `realm.governmentChangeCooldown` decrementado a cada turno.

### O que NÃO deve ser alterado
- Sistema de vassalagem existente em `processEndOfTurn` (linhas 614-623) — apenas aplicar modificador Oligarchy
- `src/logic/mapGeneration.ts`
- `src/logic/sfxLogic.ts`

---

## 7. Sprint 4 — Novos Modos de Mapa

**Objetivo:** Adicionar 7 novos modos de visualização ao mapa com heatmaps e labels, e atalhos de teclado correspondentes.

### Arquivos
| Ação | Arquivo |
|------|---------|
| Editar | `src/types.ts` |
| Editar | `src/components/Map.tsx` |
| Editar | `src/App.tsx` |

### Tarefas (em ordem)

**T1 — Expandir `ViewMode` em `types.ts`**
- Adicionar: `'population' | 'development' | 'income' | 'stability' | 'buildings' | 'growth' | 'military_strength'`
- Critério de aceite: `tsc --noEmit` passa.

**T2 — Adicionar lógica de coloração para cada novo modo em `Map.tsx`**
- Na seção de `fillColor` (linhas 253-263), adicionar branches para cada novo modo:
  - **População (7):** Verde escuro proporcional a `pop / maxPop`
  - **Desenvolvimento (8):** Azul proporcional a `wealth + sum(buildings)`
  - **Renda Total (9):** Dourado proporcional a `goldIncome`
  - **Estabilidade (10):** Branco (>70) → Amarelo (40-70) → Vermelho (<40)
  - **Edifícios (11):** Roxo proporcional a soma de edifícios
  - **Crescimento (12):** Ciano proporcional a growth rate
  - **Força Militar (13):** Laranja proporcional a `troops / maxTroops`
- Critério de aceite: cada modo renderiza com o heatmap correto.

**T3 — Adicionar labels para cada novo modo em `Map.tsx`**
- Na seção de labels (linhas 298-311), adicionar branches:
  - População: `"12.450"` (valor formatado)
  - Desenvolvimento: `"Dev: 45"`
  - Renda: `"+320g"`
  - Estabilidade: `"85%"`
  - Edifícios: `"🏘️4"`
  - Crescimento: `"+3%"`
  - Força Militar: `"⚔️45"`
- Critério de aceite: cada modo mostra label correto.

**T4 — Adicionar atalhos de teclado em `App.tsx`**
- No keydown handler (linhas 229-308), adicionar cases para `'6'` → population, `'7'` → development, `'8'` → income, `'9'` → stability, `'0'` → buildings, `'G'` → growth, `'F'` → military_strength, `'T'` → trade (já deve existir ou adicionar)
- Critério de aceite: todos os atalhos 1-9, 0, T, G, F funcionam.

**T5 — Verificar modo Trade existente**
- O modo `'trade'` já está no tipo `ViewMode`. Confirmar que o atalho `T` funciona e o modo renderiza corretamente.
- Se não houver lógica de renderização para trade, implementar básica (rotas comerciais visíveis)
- Critério de aceite: modo Trade preservado e funcional.

### Critérios de aceite da sprint
- [ ] 13 modos de mapa funcionais (6 existentes + 7 novos)
- [ ] Cada modo mostra cor/label correta conforme tabela do PRD
- [ ] Estabilidade: verde (>70), amarelo (40-70), vermelho (<40)
- [ ] Todos os atalhos (1-9, 0, T, G, F) funcionam
- [ ] Modo Trade preservado

### Comandos de validação
```bash
npm run lint && npm run build
npm run dev  # testar cada atalho de teclado
```

### Riscos
- **Performance:** 13 modos de mapa com 40 províncias podem causar lag. Cada modo deve ser calculado via `useMemo`.
- **Modo trade pode não ter renderização:** Se não houver lógica de visualização de rotas comerciais no SVG, implementar desenho de linhas entre províncias com `tradeRoutes`.
- **Atalhos conflitantes:** `F` já é usado para fullscreen (linha 285). O PRD especifica `F` para Military Strength. Resolver conflito: manter `F` para fullscreen, usar `Shift+F` ou `M` para Military Strength. **Validar com o usuário antes de alterar.**

### O que NÃO deve ser alterado
- Lógica de jogo — apenas visualização
- `src/logic/*` — nenhum arquivo de lógica
- Estrutura de pan/zoom do mapa

---

## 8. Sprint 5 — Empréstimos + IA Avançada

**Objetivo:** Implementar sistema de empréstimos e reescrever a IA para usar personalidades, `calculateMilitaryPower`, e remover `declareWar` local.

### Arquivos
| Ação | Arquivo |
|------|---------|
| Editar | `src/types.ts` |
| Editar | `src/logic/economyLogic.ts` |
| Editar | `src/logic/aiLogic.ts` |
| Editar | `src/logic/turnLogic.ts` |
| Editar | `src/hooks/useGameController.ts` |
| Editar | `src/components/HUD.tsx` |
| Editar | `src/App.tsx` |

### Tarefas (em ordem)

**T1 — Adicionar tipos de empréstimo em `types.ts`**
- Interface `Loan` com `id`, `amount`, `remaining`, `paymentPerTurn`, `defaulted`
- Campo `loans: Loan[]` em `Realm`
- Campo `aiAggression: number` em `GameSettings` (default 50)
- Critério de aceite: `tsc --noEmit` passa.

**T2 — Implementar funções de empréstimo em `economyLogic.ts`**
- `getMaxLoanAmount(realm)` → `Math.floor(totalGoldIncome * 5)`
- `requestLoan(realm, amount)` → valida limite, cria loan, adiciona gold, calcula `paymentPerTurn = Math.ceil((amount * 1.15) / 10)`
- `processLoanPayments(realm, state)` → para cada loan ativo, deduzir parcela. Se insuficiente: -10 relações todos os reinos, -5 loyalty todas as províncias, `defaulted = true`
- Critério de aceite: funções puras, corretas conforme PRD.

**T3 — Integrar `processLoanPayments` em `processEndOfTurn`**
- No loop de realms (linha 513), após cálculo de renda e antes dos gastos de manutenção, processar pagamentos de empréstimo
- Critério de aceite: parcelas descontadas automaticamente a cada turno.

**T4 — Adicionar botão de empréstimo no HUD**
- `HUD.tsx`: botão "💰 Empréstimo" que abre input de valor ou modal simples
- Handler em `useGameController.ts` que chama `requestLoan`
- Critério de aceite: jogador pode contrair empréstimo via UI.

**T5 — Criar `calculateMilitaryPower` em `aiLogic.ts`**
- Função exportada: soma bruta de todas as tropas (infantry+archers+cavalry+scouts) × bônus de combat tech × multiplicador de ataque do governo
- Critério de aceite: `calculateMilitaryPower` retorna valor > 0 para reino com tropas, 0 sem tropas.

**T6 — Refatorar `aiLogic.ts`: remover `declareWar` local**
- Remover função local `declareWar` (linhas 6-31)
- Importar `declareWar` de `diplomacyLogic.ts`
- Em `executeAIAttack` (linha 46), substituir chamada local por `diplomacyLogic.declareWar`
- Critério de aceite: `aiLogic.ts` não tem mais função `declareWar` local. `grep "function declareWar" src/logic/aiLogic.ts` retorna vazio.

**T7 — Implementar `shouldAIAttack` com personalidades**
- Nova função em `aiLogic.ts` usando `calculateMilitaryPower`
- Thresholds: expansionist (powerRatio > 1.5), opportunistic (>1.0 + target fraco/em guerra), defensive (false), diplomatic (>3.0), commercial (>2.5 + tropas > 50)
- Critério de aceite: cada personalidade ataca (ou não) conforme thresholds.

**T8 — Implementar `processAIDiplomacy`**
- Nova função: diplomatic busca aliados, expansionist insulta, commercial oferece trade
- Integrar no `processAI`
- Critério de aceite: IA diplomatic tenta alianças, IA expansionist envia insultos.

**T9 — Implementar `processAILoans`**
- IA pede empréstimo quando: em guerra + gold < 0 por >2 turnos, OU precisa recrutar e sem gold
- Integrar no `processAI`
- Critério de aceite: IA contrai empréstimo quando necessário.

**T10 — Reescrever `processAI` para usar personalidades**
- Substituir lógica aleatória atual (linhas 80-119) por switch baseado em `realm.personality`
- Expansionist: prioriza ataque > recrutar > construir
- Defensive: construir > fortificar > diplomacia
- Diplomatic: diplomacia > alianças > economia
- Opportunistic: atacar fraco > economia
- Commercial: economia > trade > construir
- Critério de aceite: cada personalidade age de forma distinta.

**T11 — Aplicar `aiAggression` configurável**
- No `processAI` ou `shouldAIAttack`, aplicar multiplicador: `effectiveRatio = baseRatio * (1 - (aiAggression - 50) / 100)`
- Critério de aceite: com agressividade 100, IA ataca com 50% menos vantagem necessária.

### Critérios de aceite da sprint
- [ ] Empréstimo: jogador recebe gold, parcela deduzida por 10 turnos
- [ ] Default causa penalidade de -10 relações e -5 loyalty
- [ ] Limite de crédito = `Math.floor(totalGoldIncome * 5)`
- [ ] IA pede empréstimo em guerra com gold negativo
- [ ] `calculateMilitaryPower` correto com bônus de tech e governo
- [ ] Expansionist ataca com powerRatio > 1.5
- [ ] Defensive nunca inicia guerras
- [ ] `aiLogic.ts` sem `declareWar` local
- [ ] Agressividade configurável afeta thresholds

### Comandos de validação
```bash
npm run lint && npm run build
```

### Riscos
- **`executeAIAttack` muta estado diretamente:** A AI atual muta `state` (passado por referência) e NÃO usa deep clone. O `handleEndTurn` já faz deep clone antes de passar para `processAI`. Isso é correto e deve ser mantido.
- **`calculateMilitaryPower` depende de `GOVERNMENT_STATS`:** Se o Sprint 3 (Governos) não estiver completo, `GOVERNMENT_STATS` pode não existir. Usar fallback `1.0` se indisponível.
- **IA pode quebrar com campos inexistentes:** Se `techLevels` ou `government` não existirem (saves antigos), usar defaults.

### O que NÃO deve ser alterado
- `src/logic/diplomacyLogic.ts` — apenas referenciar `declareWar` exportada
- `src/logic/combatLogic.ts`
- Estrutura de `processEndOfTurn` — apenas adicionar `processLoanPayments`

---

## 9. Sprint 6 — Música Ambiente

**Objetivo:** Adicionar trilha sonora medieval com 3 faixas (menu, paz, guerra), toggle de volume, crossfade.

### Arquivos
| Ação | Arquivo |
|------|---------|
| Criar | `src/logic/musicLogic.ts` |
| Adicionar assets | `public/music/menu.mp3`, `public/music/peace.mp3`, `public/music/war.mp3` |
| Editar | `src/App.tsx` |
| Editar | `src/components/HUD.tsx` |

### Tarefas (em ordem)

**T1 — Obter assets MP3 gratuitos (CC0)**
- Buscar em OpenGameArt.org ou Pixabay Music
- 3 faixas: menu (calma), jogo-paz (neutra), jogo-guerra (intensa)
- Cada ~2-4 minutos, loop-friendly
- Salvar em `public/music/`
- Critério de aceite: 3 arquivos MP3 no diretório público.

**T2 — Criar `src/logic/musicLogic.ts`**
- Usar elemento `<audio>` nativo (não Web Audio API/Tone.js para música de fundo)
- Funções: `initMusic()`, `startMenuMusic()`, `startGameMusic(isAtWar)`, `switchToWarMusic()`, `switchToPeaceMusic()`, `stopMusic()`, `setMusicVolume(0-100)`, `isMusicPlaying()`
- Dois elementos `<audio>` para crossfade (fade out um, fade in outro via `setTimeout` 2s)
- Contornar autoplay policy: iniciar após primeiro gesto do usuário, fallback com botão "🔊 Ativar Som"
- Critério de aceite: música toca em loop, crossfade funciona.

**T3 — Integrar em `App.tsx`**
- Iniciar `initMusic()` no primeiro clique do usuário (já existe handler `handleFirstClick` na linha 81-83)
- `startMenuMusic()` ao mostrar menu
- `startGameMusic(isAtWar)` ao iniciar/retomar jogo
- Alternar entre paz/guerra quando `realm.wars.length > 0`
- Critério de aceite: música inicia após primeiro clique, transita entre menu/jogo.

**T4 — Adicionar toggle de música no HUD**
- Botão 🔈/🔊 no HUD (e no menu)
- Slider de volume (0-100)
- Critério de aceite: toggle liga/desliga, slider ajusta volume.

### Critérios de aceite da sprint
- [ ] Música inicia após primeiro clique do usuário
- [ ] 3 faixas tocam em loop
- [ ] Transição menu → jogo → guerra/paz com crossfade
- [ ] Toggle e volume funcionam
- [ ] Se `play()` falhar, botão "Ativar Som" aparece

### Comandos de validação
```bash
npm run lint && npm run build
npm run dev  # testar: abrir menu (música menu), iniciar jogo (música paz), declarar guerra (música guerra)
```

### Riscos
- **Autoplay policy do browser:** Chrome/Firefox bloqueiam `audio.play()` sem gesto do usuário. A estratégia de iniciar no primeiro clique + fallback mitiga.
- **Assets MP3:** Se não encontrar assets CC0 adequados, usar placeholder (silêncio) e documentar.
- **Conflito com Tone.js:** O projeto já usa Tone.js para SFX (`sfxLogic.ts`). A música de fundo usa `<audio>` nativo separado — não deve haver conflito.
- **Estimativa de 4 dias:** Pode ser maior se assets forem difíceis de encontrar.

### O que NÃO deve ser alterado
- `src/logic/sfxLogic.ts` — SFX existentes (batalha, construção, recrutamento)
- Tone.js — continua para SFX

---

## 10. Sprint 7 — Liberty Desire + Tela de Derrota + Responsividade

**Objetivo:** Implementar sistema de Liberty Desire para vassalos, tela de derrota narrativa com estatísticas, e responsividade de todos os modais.

### Arquivos
| Ação | Arquivo |
|------|---------|
| Editar | `src/types.ts` |
| Editar | `src/logic/turnLogic.ts` |
| Editar | `src/logic/combatLogic.ts` |
| Editar | `src/components/GameEndModal.tsx` |
| Editar | `src/components/HUD.tsx` |
| Editar | `src/hooks/useGameController.ts` |
| Editar | `src/components/CombatSetupModal.tsx` |
| Editar | `src/components/BattleOutcomeModal.tsx` |
| Editar | `src/components/TurnResultModal.tsx` |
| Editar | `src/components/DiplomacyModal.tsx` |
| Editar | `src/components/SaveGameModal.tsx` |
| Editar | `src/components/ChronicleModal.tsx` |
| Editar | `src/components/GameInstructionsModal.tsx` |
| Editar | `src/index.css` |

### Tarefas (em ordem)

**T1 — Adicionar campos de tracking em `Realm` (`types.ts`)**
- `vassalLiberty: Record<string, number>`
- `battlesWon: number`
- `realmsDefeated: number`
- `cumulativeGold: number`
- `maxProvincesHeld: number`
- Critério de aceite: `tsc --noEmit` passa.

**T2 — Implementar `processVassalLiberty` em `turnLogic.ts`**
- Conforme código do PRD (seção 9), com padrão imutável
- Fatores: +2/turno base, +5 se overlord em guerra, +10 se overextension > 80, +3 se vassalo maior
- Redutores: -5 ao receber gold, -3 se overlord mais tropas, -2 se pacto defensivo
- Liberty >= 100 → rebelião usando `declareWar` de `diplomacyLogic.ts`
- Notificação quando Liberty >= 70
- Integrar no `processEndOfTurn` após economia, antes de limpeza
- Critério de aceite: liberty sobe/desce conforme fatores, rebelião ocorre em 100.

**T3 — Adicionar barra de Liberty no HUD**
- `HUD.tsx`: mostrar Liberty de cada vassalo no painel de diplomacia/vassalos
- Ação "Apaziguar Vassalo" (custa gold, reduz -5 liberty)
- Critério de aceite: liberty visível no HUD, apaziguamento funciona.

**T4 — Incrementar `battlesWon` em `resolveCombat` (`combatLogic.ts`)**
- Quando `result.won === true` e o atacante é um reino, incrementar `state.realms[attackerId].battlesWon`
- Critério de aceite: contador de batalhas vencidas incrementa.

**T5 — Incrementar `realmsDefeated` em `processActiveWars` ou `checkGameOver`**
- Quando `delete state.realms[defeatedId]`, incrementar `state.realms[winnerId].realmsDefeated`
- Critério de aceite: contador de reinos derrotados incrementa.

**T6 — Incrementar `cumulativeGold` e `maxProvincesHeld` em `processEndOfTurn`**
- `cumulativeGold += realm.gold` antes de deduzir manutenção
- `maxProvincesHeld = Math.max(maxProvincesHeld, ownedCount)`
- Critério de aceite: tracking funciona ao longo dos turnos.

**T7 — Reescrever `GameEndModal.tsx` para derrota narrativa**
- Detectar se `winnerId !== playerRealmId` → jogador perdeu
- Template de derrota com caveira, frase temática aleatória, estatísticas finais
- Estatísticas: turnos, províncias máximas, batalhas vencidas, reinos derrotados, ouro acumulado
- Botões "Tentar Novamente" e "Menu"
- Usar campos de tracking adicionados (battlesWon, realmsDefeated, cumulativeGold, maxProvincesHeld)
- Critério de aceite: tela de derrota mostra estatísticas reais, frase aleatória.

**T8 — Responsividade de modais**
- Adicionar media query `@media (max-width: 768px)` em `index.css`
- Aplicar classes em cada modal:
  - `CombatSetupModal`: layout vertical, sliders maiores
  - `BattleOutcomeModal`: fonte maior, botão maior
  - `TurnResultModal`: scroll vertical, cards empilhados
  - `DiplomacyModal`: lista scrollável, botões touch-friendly
  - `SaveGameModal`: layout compacto
  - `ChronicleModal`: fonte menor, scroll
  - `GameInstructionsModal`: accordion
  - `GameEndModal`: layout vertical
- Touch targets ≥ 48px
- Critério de aceite: todos os modais usáveis em 375px de largura, sem overflow horizontal.

### Critérios de aceite da sprint
- [ ] Liberty sobe a cada turno conforme fatores
- [ ] Liberty >= 100 → rebelião usando `declareWar` canônica
- [ ] Apaziguar vassalo (-5 liberty) funciona
- [ ] Tela de derrota narrativa com estatísticas reais
- [ ] Todos os modais sem overflow horizontal em 375px
- [ ] Touch targets ≥ 48px

### Comandos de validação
```bash
npm run lint && npm run build
npm run dev  # testar em viewport 375px (Chrome DevTools)
```

### Riscos
- **`declareWar` de `diplomacyLogic.ts` retorna `{ newState, callsToResolve }`:** A integração em `processVassalLiberty` deve usar o `newState` retornado ou trabalhar sobre o clone já existente.
- **GameEndModal existente já tem lógica `isPlayerWinner`:** Cuidado para não quebrar o fluxo de vitória ao adicionar o de derrota.
- **Modais podem quebrar com Tailwind v4:** Verificar que classes como `max-h-[90vh]` e `overflow-y-auto` funcionam na versão atual.

### O que NÃO deve ser alterado
- Sistema de vassalagem existente — apenas adicionar liberty tracking
- Template de vitória do `GameEndModal` — apenas adicionar branch de derrota
- Lógica de jogo nos modais — apenas CSS/layout

---

## 11. Sprint 8 — Migração de Save + Testes de Integração

**Objetivo:** Implementar migração de saves da Fase 1 para Fase 2, garantir que todos os sistemas funcionam juntos.

### Arquivos
| Ação | Arquivo |
|------|---------|
| Criar | `src/logic/saveMigration.ts` |
| Editar | `src/types.ts` (adicionar `schemaVersion`) |
| Editar | `src/hooks/useGameController.ts` |
| Editar | `src/persistence.ts` |

### Tarefas (em ordem)

**T1 — Adicionar `schemaVersion` a `GameState` em `types.ts`**
- `schemaVersion: number` (1 = Fase 1, 2 = Fase 2)
- Critério de aceite: `tsc --noEmit` passa.

**T2 — Criar `src/logic/saveMigration.ts`**
- `migrateSaveGame(data: any): GameState` — função que detecta versão e aplica defaults
- Defaults para todos os novos campos: `techPoints: 0`, `techLevels: {...0}`, `government: 'monarchy'`, `governmentChangeCooldown: 0`, `vassalLiberty: {}`, `loans: []`, `battlesWon: 0`, `realmsDefeated: 0`, `cumulativeGold: 0`, `maxProvincesHeld: ownedCount`
- `originalOwnerId: undefined` em todas as províncias
- `schemaVersion: 2` ao final
- Critério de aceite: save da Fase 1 carrega sem erros com todos os defaults.

**T3 — Integrar `migrateSaveGame` em `useGameController.ts`**
- `handleLoad` (linha 799): após `persistence.loadSave(id)`, chamar `migrateSaveGame(data)` antes de `setGameState`
- `startNewGame`: garantir que `generateInitialState` já cria `schemaVersion: 2` (ou aplicar após geração)
- Critério de aceite: saves antigos migram automaticamente, novos jogos nascem com v2.

**T4 — Testes de integração manuais (checklist)**
- [ ] Tecnologia + Governos: bônus de AP não causam valores negativos
- [ ] Capitulação não deixa `originalOwnerId` sujo
- [ ] IA + Empréstimos: IA não entra em dívida infinita
- [ ] Liberty + Vassalos + Capitulação: independência e anexação coexistem
- [ ] Música não conflita com SFX
- [ ] 13 modos de mapa sem lag (40 províncias)
- [ ] Modais responsivos sem overflow
- [ ] Save Fase 1 carrega com migração
- [ ] Save Fase 2 salva e carrega
- [ ] `calculateMilitaryPower` sem NaN/Infinity
- [ ] `maxActionPoints` nunca < 2

### Critérios de aceite da sprint
- [ ] `npm run lint` limpo
- [ ] `npm run build` sem erros
- [ ] Save da Fase 1 carrega corretamente após migração
- [ ] Novo jogo Fase 2 salva e carrega com `schemaVersion: 2`
- [ ] Todos os sistemas funcionam integrados sem loops infinitos

### Comandos de validação
```bash
npm run lint
npm run build
npm run dev  # testar: carregar save antigo, iniciar novo jogo, jogar vários turnos
```

### Riscos
- **Saves antigos podem ter estruturas inesperadas:** A função `migrateSaveGame` usa `??` (nullish coalescing). Se houver campos com `null` em vez de `undefined`, o comportamento pode ser diferente.
- **Tamanho do localStorage:** Múltiplos saves com `schemaVersion` e novos campos podem exceder o limite de 5-10MB do localStorage.

### O que NÃO deve ser alterado
- Formato de save existente — apenas adicionar migração
- `persistence.ts` — estrutura de `saveGame`/`loadSave` mantida

---

## 12. Ordem de execução recomendada

A sequência ideal é **linear**, pois há dependências em cadeia:

```
Sprint 0 (Preparação)
  ↓
Sprint 1 (Tipos + Tecnologia)  ← Base para todos os outros sprints
  ↓
Sprint 2 (Capitulação)         ← Independente, mas usa tipos do Sprint 1
  ↓
Sprint 3 (Governos)            ← Depende dos tipos do Sprint 1; é referenciado pelo Sprint 5
  ↓
Sprint 4 (Modos de Mapa)       ← Independente, pode começar após Sprint 1
  ↓
Sprint 5 (Empréstimos + IA)    ← Depende de Sprint 1 (tech) e Sprint 3 (governos)
  ↓
Sprint 6 (Música)              ← Independente, pode rodar em paralelo com Sprint 4 ou 5
  ↓
Sprint 7 (Liberty + Derrota + Responsividade) ← Depende parcialmente de Sprint 2 (capitulação)
  ↓
Sprint 8 (Migração + Testes)   ← Depende de todos os anteriores
```

**Paralelismo possível:**
- Sprint 4 (Mapa) e Sprint 6 (Música) podem rodar em paralelo com Sprint 5 (IA)
- Sprint 7 pode começar após Sprint 2, sem esperar Sprint 5 e 6

---

## 13. Checklist de validação geral

### Lint
```bash
npm run lint    # tsc --noEmit deve passar limpo em TODOS os sprints
```

### Typecheck
```bash
npx tsc --noEmit --strict
```

### Build
```bash
npm run build   # vite build sem erros
```

### Testes manuais de fluxo
- [ ] Iniciar novo jogo → alocar tech → ver bônus de AP
- [ ] Construir workshops → ver geração de tech points aumentar
- [ ] Mudar governo → ver bônus/penalidades no próximo turno
- [ ] Declarar guerra → conquistar >60% → ver capitulação
- [ ] Contrair empréstimo → ver parcelas descontadas por 10 turnos
- [ ] Ter vassalo → ver liberty subir → rebelião em 100
- [ ] Perder todas as províncias → ver tela de derrota narrativa
- [ ] Alternar modos de mapa → ver 13 modos com heatmaps corretos
- [ ] Música tocar no menu → transição para jogo → guerra/paz
- [ ] Carregar save da Fase 1 → ver migração automática

### Responsividade
- [ ] Chrome DevTools 375px: todos os modais abrem sem overflow horizontal
- [ ] Touch targets ≥ 48px em todos os botões de modal

### Regressões
- [ ] Recrutamento, construção, marcha, ataque funcionam como antes
- [ ] Diplomacia (aliança, NAP, tributo, insulto) funciona como antes
- [ ] Salvamento e carregamento funcionam
- [ ] Vitória (conquista/econômica) ainda funciona
- [ ] SFX (batalha, construção, recrutamento) não conflitam com música

---

## 14. Pontos que exigem modelo mais forte

| Sprint | Tarefa | Por quê |
|--------|--------|---------|
| 1 | T5 — Integrar bônus de combat tech em `resolveCombat` | Requer entender a assinatura atual de `resolveCombat`, decidir entre refactor vs aplicar no caller, e não quebrar o fluxo de combate existente (que é assíncrono via march orders) |
| 1 | T7 — Criar `TechnologyModal.tsx` | UI complexa com 4 categorias, barras de progresso, estados de hover, interações. Modelos fracos tendem a gerar layouts quebrados |
| 2 | T6 — Integrar `checkCapitulation` em `processActiveWars` | Requer modificar fluxo de controle existente (loop de guerras) com novo ponto de inserção. Erro aqui quebra TODAS as guerras |
| 3 | T3 — Integrar `applyGovernmentBonuses` em `processEndOfTurn` | Função central do jogo. Bônus/penalidades afetam renda, AP, tech, recrutamento. Erro causa desbalanceamento global |
| 5 | T6 — Refatorar `aiLogic.ts`: remover `declareWar` local | Exige entender a interface de `diplomacyLogic.declareWar` (retorna `{ newState, callsToResolve }`) e adaptar todos os call sites |
| 5 | T10 — Reescrever `processAI` | Reescrita completa da função central da IA. Modelos fracos tendem a gerar IA que não age ou age erraticamente |
| 7 | T2 — `processVassalLiberty` | Lógica complexa com múltiplos fatores, clamping, rebelião que chama `declareWar`, e padrão imutável obrigatório |
| 8 | T4 — Testes de integração | Requer visão holística de todos os sistemas para detectar interações quebradas |

### Tarefas seguras para modelos fracos

| Sprint | Tarefa | Por quê |
|--------|--------|---------|
| 1 | T1, T2 — Tipos e funções puras | Adicionar interfaces e funções matemáticas sem dependências complexas |
| 1 | T3, T4 — Integrações pontuais | Adicionar chamadas de função em locais bem definidos |
| 2 | T1, T2, T3 — originalOwnerId lifecycle | Operações mecânicas de set/clear em pontos específicos |
| 4 | T1, T2, T3, T4 — Modos de mapa | Coloração e labels são switch/case com fórmulas simples. Sem lógica de jogo |
| 5 | T1, T2, T3 — Tipos e funções de empréstimo | Funções matemáticas simples, CRUD de array de loans |
| 6 | T1, T2, T3, T4 — Música | APIs de áudio nativas, sem lógica de jogo |
| 7 | T8 — Responsividade de modais | CSS media queries, ajustes de layout |
| 8 | T1, T2, T3 — Migração de save | Aplicação de defaults via `??`, sem lógica complexa |

---

*Plano gerado em 08/05/2026 — Reinos Medievais — Fase 2*
