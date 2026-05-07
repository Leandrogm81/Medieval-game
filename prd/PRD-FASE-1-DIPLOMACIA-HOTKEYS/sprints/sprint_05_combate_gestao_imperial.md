# Sprint 05 — Combate e Gestão Imperial: Army Retreat + Ações em Massa

> **PRD de origem:** PRD-FASE-1-DIPLOMACIA-HOTKEYS-v2.md §3 (Army Retreat) + §4 (Ações em Massa)
> **Duração estimada:** 2 dias
> **Dependências:** Sprint 01 (hotkeys `W`/`A` para marcha/ataque). Diplomacia (Sprints 02-04) não é bloqueante — este sprint é independente.
> **Pré-requisito para:** Sprint 06 (múltipla seleção interage com march orders)

---

## Objetivo da Sprint

Implementar duas melhorias de qualidade de vida para gestão de combate e império: (1) recuo automático de tropas sobreviventes após derrota em batalha, e (2) ações económicas em massa para evitar micro-gerenciamento de cada província individualmente.

---

## Scope: User Stories

### US-01 — Army Retreat: Funções Puras
**Como** sistema de combate, **preciso** que tropas derrotadas recuem em vez de desaparecer **para** que derrotas táticas não sejam catastróficas.

**Implementar em `src/logic/combatLogic.ts`:**

1. **`getRetreatDestination(state, defeatedProvinceId, realmId): string | null`**
   - Função pura — não modifica estado
   - Encontra províncias vizinhas com mesmo `ownerId === realmId`
   - Se múltiplas: escolhe a com maior `troops` (mais segura)
   - Se nenhuma: retorna `null` (tropas perdidas)
   - Edge case: `defeatedProvinceId` não existe → retorna `null`

2. **`calculateRetreat(remainingArmy, retreatRatio = 0.3): Army`**
   - Função pura
   - Calcula 30% de cada tipo de tropa (infantry, archers, cavalry, scouts)
   - **Mínimo de 1 unidade por tipo**: se `remainingArmy.infantry > 0`, pelo menos 1 infantry recua
   - Se `remainingArmy` tem total 0 → retorna Army com todos os campos 0
   - Arredonda para baixo com `Math.floor`

**Regras de recuo:**
- 30% das tropas sobreviventes (pós-batalha) recuam
- Tropas recuadas mantêm composição proporcional
- Recuo NÃO conta como ação (acontece automaticamente após combate)
- Sem província vizinha amigável → tropas perdidas

**Arquivos:** `src/logic/combatLogic.ts`

### US-02 — Army Retreat: Integração no Fluxo de Combate
**Como** jogador, **quero** ver minhas tropas recuarem após uma derrota **para** preservar parte do meu exército para futuras batalhas.

**Integrar em `src/logic/turnLogic.ts` — `finishAttack` (dentro de `processMarchOrders`):**

- **Atacante derrotado** (`!result.won`):
  1. `retreatDest = getRetreatDestination(state, prov.id, order.realmId)`
  2. Se `retreatDest` não nulo: `retreating = calculateRetreat(result.attackerRemaining)`
  3. Adicionar tropas ao destino (o estado já é deep clone do `processMarchOrders`)
  4. Atualizar `dest.troops = soma de todos os tipos`
  5. Se `order.realmId === playerRealmId`: adicionar log "DERROTA! {N} tropas recuaram para {dest.name}."

- **Defensor derrotado** (`result.won`):
  1. Mesmo fluxo, mas usando `prov.ownerId` como `realmId`
  2. Usar `result.defenderRemaining`

**Atualizar `src/components/BattleOutcomeModal.tsx`:**
- Mostrar detalhes do recuo: quantas tropas recuaram, para qual província, composição
- Formato: "⚔️ Resultado da Batalha\n... \n\n🏃 Recuo: {N} tropas recuaram para {provinceName}\nComposição: ⚔️{N} 🏹{N} 🐴{N}"

**Arquivos:** `src/logic/turnLogic.ts`, `src/components/BattleOutcomeModal.tsx`

### US-03 — Ações em Massa: Funções em economyLogic.ts
**Como** jogador com um império grande, **quero** executar ações em todas as províncias de uma vez **para** não perder tempo com micro-gerenciamento.

**Implementar em `src/logic/economyLogic.ts`:**

1. **`estimateMassActionCost(state, realmId, costPerProvince): { totalCost: number; affectedCount: number }`**
   - Função pura de consulta — não modifica estado
   - Conta províncias do reino e multiplica pelo custo unitário

2. **`massAssimilate(state, realmId): { count: number; cost: number }`**
   - +5 loyalty em cada província do reino
   - Custo: 50 gold por província
   - Se gold insuficiente: processa da capital para fora (mais próximas primeiro)
   - Cap: loyalty não excede 100
   - Retorna resumo: quantas províncias afetadas, custo total

3. **`massInvest(state, realmId): { count: number; cost: number }`**
   - +10 wealth em cada província
   - Custo: 100 gold por província
   - Mesma lógica de prioridade (capital → periferia)

4. **`massBuildFarms(state, realmId): { count: number; cost: { gold: number; materials: number } }`**
   - +1 farm em províncias elegíveis
   - Custo: 100 gold + 50 materials por província
   - Só age em províncias que podem ter farms (têm resource compatível)

5. **`massBuildMines(state, realmId)`**, **`massBuildWorkshops(state, realmId)`**, **`massBuildCourts(state, realmId)`**
   - Padrão similar com custos específicos (ver PRD §4)

**Regras comuns:**
- Só age em províncias do jogador (`ownerId === realmId`)
- Prioridade: capital primeiro, depois províncias mais próximas
- Se recursos insuficientes: processa máximo possível (não faz nada parcialmente — ou age na província ou pula)
- Províncias sem resource necessário: puladas (ex: construir farm sem wood)

**Arquivos:** `src/logic/economyLogic.ts`

### US-04 — Ações em Massa: UI de Confirmação e HUD
**Como** jogador, **quero** ver o custo estimado antes de confirmar uma ação em massa **para** evitar gastar recursos acidentalmente.

**Criar modal de confirmação** (pode ser integrado no HUD existente ou componente separado):
- Mostrar: "Esta ação custará X gold e Y materials. Afetará N províncias. Continuar?"
- Botões: "Confirmar" / "Cancelar"
- Estimar custo com `estimateMassActionCost` ANTES de executar

**Adicionar em `src/components/HUD.tsx`:**
- Botão "⚡ Ações em Massa" no painel económico
- Submenu com opções:
  - "Assimilar Todas (50 gold/prov)"
  - "Investir em Todas (100 gold/prov)"
  - "Construir Farms (100g+50m/prov)"
  - "Construir Mines (150g+75m/prov)"
  - "Construir Workshops (200g+100m/prov)"
  - "Construir Courts (300g+150m/prov)"
- Cada opção mostra estimativa de custo antes de abrir modal de confirmação

**Integrar em `useGameController.ts`:**
- Handler `handleMassAction(actionType, realmId)`
- Deep clone → chamar função mass* → setGameState → setTimeout(showToast, 0)
- Toast: "{action} concluída em {N} províncias. Custo: {gold}g {materials}m."

**Arquivos:** `src/components/HUD.tsx`, `src/hooks/useGameController.ts`

### US-05 — Testes de Edge Case
**Como** QA, **preciso** verificar que Army Retreat e Ações em Massa funcionam em cenários extremos **para** garantir robustez.

**Army Retreat edge cases:**
- Exército com 3 archers derrotado → pelo menos 1 archer recua (não zera o tipo)
- Exército com 1 cavalry derrotado → 1 cavalry recua
- Província de destino já cheia (muitas tropas) → recuo funciona normalmente (sem cap)
- `defeatedProvinceId` não existe → `getRetreatDestination` retorna null, sem crash
- `resolveCombat` retorna `attackerRemaining` com total 0 → `calculateRetreat` retorna Army vazio

**Ações em Massa edge cases:**
- Jogador com 0 províncias → botão desabilitado ou toast "Nenhuma província para agir"
- Construir farms sem resources necessários → província sem resource é pulada
- Loyalty já em 100 → não excede 100, mas ainda consome gold
- Gold 0 → massAssimilate retorna `{ count: 0, cost: 0 }`

**Arquivos:** Testes manuais (validar no browser)

---

## Arquivos Afetados

| Arquivo | Ação | User Stories |
|---------|------|-------------|
| `src/logic/combatLogic.ts` | Editar — adicionar getRetreatDestination + calculateRetreat | US-01 |
| `src/logic/turnLogic.ts` | Editar — integrar recuo no finishAttack | US-02 |
| `src/components/BattleOutcomeModal.tsx` | Editar — mostrar detalhes do recuo | US-02 |
| `src/logic/economyLogic.ts` | Editar — 6 funções mass* + estimateMassActionCost | US-03 |
| `src/components/HUD.tsx` | Editar — botão Ações em Massa + submenu | US-04 |
| `src/hooks/useGameController.ts` | Editar — handleMassAction | US-04 |

---

## Critérios de Aceitação

- [ ] Atacante derrotado: 30% das tropas restantes recuam para província amigável vizinha
- [ ] Defensor derrotado: 30% das tropas restantes recuam para província amigável vizinha
- [ ] Sem província amigável vizinha: tropas são perdidas (sem crash)
- [ ] Múltiplas províncias vizinhas: recua para a mais segura (mais tropas)
- [ ] Recuo não gasta action points
- [ ] Modal de resultado mostra detalhes do recuo (quantas tropas, para onde, composição)
- [ ] Exército com 3 archers derrotado → pelo menos 1 archer recua
- [ ] `calculateRetreat` com Army vazio → retorna Army com todos os campos 0
- [ ] `getRetreatDestination` com província inexistente → retorna null
- [ ] Assimilar Todas: +5 loyalty/província, gold deduzido, cap 100
- [ ] Investir em Todas: +10 wealth/província, gold deduzido
- [ ] Construir Farms: +1 farm onde possível, custo total correto
- [ ] Recursos insuficientes: age nas províncias mais próximas da capital primeiro
- [ ] Modal de confirmação mostra custo estimado corretamente
- [ ] Províncias neutras/inimigas não são afetadas
- [ ] Não crasha com 0 gold (função retorna count: 0, cost: 0)

---

## Definição de Pronto (DoD)

- [ ] `npm run lint` — zero erros
- [ ] `npm run build` — sem erros
- [ ] `getRetreatDestination` e `calculateRetreat` são funções puras (não modificam parâmetros)
- [ ] `estimateMassActionCost` é função pura de consulta
- [ ] Funções `mass*` recebem estado clonado do caller (useGameController faz deep clone)
- [ ] Deep clone (`JSON.parse(JSON.stringify(gameState))`) em `handleMassAction`
- [ ] `BattleOutcomeModal` atualizado sem quebrar fluxo existente (vitória ainda funciona)
- [ ] Nenhuma província tem troops negativos após recuo
- [ ] `dest.troops` recalculado após adicionar tropas recuadas (`infantry + archers + cavalry + scouts`)
