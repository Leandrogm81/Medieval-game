# Sprint 02 — Diplomacia: Modelo de Dados e Validação

> **PRD de origem:** PRD-FASE-1-DIPLOMACIA-HOTKEYS-v2.md §2 (Estado dos Dados, Tipos, Constantes, Funções de Validação, Cálculo de Aceitação)
> **Duração estimada:** 1.5-2 dias
> **Dependências:** Sprint 01 (hotkeys — tecla `4` ativa modo diplomático)
> **Pré-requisito para:** Sprint 03 (funções de proposta consomem tipos, constantes e validação)

---

## Objetivo da Sprint

Estabelecer a fundação de dados do sistema de diplomacia: novos campos no tipo `Realm`, constantes de custo e flavor text, funções de validação puras, e o motor de cálculo de aceitação. Nenhuma UI é criada neste sprint — o foco é 100% na camada de dados e lógica pura em `src/logic/`.

---

## Scope: User Stories

### US-01 — Tipos DiplomacyAction e Novos Campos em Realm
**Como** sistema de diplomacia, **preciso** que os tipos de dados reflitam todas as ações diplomáticas e relacionamentos **para** que a lógica de propostas possa operar sobre estruturas bem definidas.

**Adicionar em `src/types.ts`:**
- Type `DiplomacyAction` (union de 8 strings: `'alliance' | 'nonAggressionPact' | 'defensivePact' | 'improveRelations' | 'sendInsult' | 'offerTribute' | 'demandTribute' | 'declareWar'`)
- Campos no interface `Realm`:
  - `nonAggressionPacts: string[]` — IDs de reinos com NAP
  - `defensivePacts: string[]` — IDs de reinos com pacto defensivo
  - `tributeFrom: Record<string, number>` — realmId → gold recebido por turno
  - `tributeTo: Record<string, number>` — realmId → gold pago por turno
  - `napExpiryTurn: Record<string, number>` — realmId → turno em que NAP expira

**Arquivos:** `src/types.ts`

### US-02 — Inicialização em mapGeneration.ts
**Como** sistema, **preciso** que todos os novos campos sejam inicializados com valores padrão para cada reino **para** evitar `TypeError: Cannot read properties of undefined` em acessos como `realm.nonAggressionPacts.includes(...)`.

**Em `generateInitialState`, para cada reino gerado:**
```typescript
nonAggressionPacts: [],
defensivePacts: [],
tributeFrom: {},
tributeTo: {},
napExpiryTurn: {},
```

**Inicializar `memory` para cada par de reinos** com:
```typescript
{ betrayal: 0, help: 0, aggression: 0, lastWarTurn: 0, warExhaustion: 0 }
```

**Arquivos:** `src/logic/mapGeneration.ts`

### US-03 — Constantes DIPLOMACY_ACTION_COSTS e DIPLOMACY_FLAVOR_TEXTS
**Como** sistema, **preciso** que os custos de AP e os textos narrativos estejam centralizados **para** que a UI e a lógica de proposta possam consultá-los sem hardcoding.

**Adicionar em `src/logic/game-constants.ts`:**
- `DIPLOMACY_ACTION_COSTS: Record<DiplomacyAction, number>`
  - `improveRelations: 1`, `sendInsult: 1`, `proposeNAP: 1`, `proposeDefensivePact: 1`, `proposeAlliance: 2`, `offerTribute: 1`, `demandTribute: 1`, `declareWar: 2`
- `DIPLOMACY_FLAVOR_TEXTS: Record<DiplomacyAction, { accepted: string; rejected: string }>`
  - Textos narrativos com placeholders `{from}` e `{to}`
  - Todas as 8 ações devem ter entrada (exceto `improveRelations` e `sendInsult` que são unilaterais — têm apenas `accepted`)

**Arquivos:** `src/logic/game-constants.ts`

### US-04 — Funções de Validação (canPropose*)
**Como** UI de diplomacia, **preciso** de funções puras que validem pré-requisitos **para** desabilitar botões e mostrar tooltips com o motivo do bloqueio.

**Criar em `src/logic/diplomacyLogic.ts` — 8 funções puras de consulta:**
1. `canProposeAlliance(state, fromId, toId)` → `{ valid: boolean; reason?: string }` — requer relações >= 50, não estar em guerra, não ser já aliado
2. `canProposeNAP(state, fromId, toId)` — requer relações >= 20, não estar em guerra, NAP não já ativo
3. `canProposeDefensivePact(state, fromId, toId)` — requer NAP ativo + relações >= 40
4. `canImproveRelations(state, fromId, toId)` — sempre válido; inválido se relações já em 100 (reason: "Relações já no máximo")
5. `canSendInsult(state, fromId, toId)` — sempre válido; inválido se relações já em −100
6. `canOfferTribute(state, fromId, toId, amount)` — requer gold suficiente para primeiro pagamento
7. `canDemandTribute(state, fromId, toId, amount)` — sempre válido (pode ser rejeitado, mas pode tentar)
8. `canDeclareWar(state, fromId, toId)` — requer não estar já em guerra, não ter NAP ativo, não ser aliado

**Todas as funções são PURAS:** não modificam o estado, apenas leem e retornam booleanos.

**Arquivos:** `src/logic/diplomacyLogic.ts` (criar)

### US-05 — Função getDiplomacyAcceptance
**Como** sistema de propostas, **preciso** calcular a probabilidade de aceitação de uma ação diplomática **para** que a IA decida realisticamente se aceita ou rejeita propostas.

**Assinatura:**
```typescript
function getDiplomacyAcceptance(
  playerRealm: Realm,
  targetRealm: Realm,
  action: DiplomacyAction,
  state: GameState
): { acceptance: number; reasons: string[] }
```

**Fatores ponderados:**
| Fator | Peso | Descrição |
|-------|------|-----------|
| Relações atuais (0-100) | 40% | Relação mapeada diretamente |
| Diferença de poder militar | 20% | `(playerPower − targetPower) / max(...)` mapeado para 0-100 |
| Personalidade do alvo | 15% | Pacificador (+bónus), Agressivo (−penalidade) |
| Memória de eventos | 15% | `betrayal` reduz, `help` aumenta |
| Inimigos em comum | 5% | +5 por inimigo em comum (max +15) |
| Distância geográfica | 5% | +5 se vizinho, −5 se > 5 províncias |

**Regra especial:** Para `demandTribute`, poder militar dobra para 40% e personalidade cai para 5%.

**Ações unilaterais** (`improveRelations`, `sendInsult`, `declareWar`): retornam `{ acceptance: 100, reasons: ['Ação unilateral — sempre aceita.'] }`.

**Thresholds de aceitação:**
- Alliance: >= 70%
- NAP: >= 60%
- Defensive Pact: >= 75%
- Offer Tribute: >= 50%
- Demand Tribute: >= 50%

**Arquivos:** `src/logic/diplomacyLogic.ts`

---

## Arquivos Afetados

| Arquivo | Ação | User Stories |
|---------|------|-------------|
| `src/types.ts` | Editar — adicionar DiplomacyAction + novos campos em Realm | US-01 |
| `src/logic/mapGeneration.ts` | Editar — inicializar campos diplomáticos + memory | US-02 |
| `src/logic/game-constants.ts` | Editar — DIPLOMACY_ACTION_COSTS + DIPLOMACY_FLAVOR_TEXTS | US-03 |
| `src/logic/diplomacyLogic.ts` | **Criar** — validação (canPropose*) + getDiplomacyAcceptance | US-04, US-05 |

---

## Critérios de Aceitação

- [ ] Tipo `DiplomacyAction` compila sem erros (union de 8 strings)
- [ ] Tipo `Realm` inclui todos os 5 novos campos (`nonAggressionPacts`, `defensivePacts`, `tributeFrom`, `tributeTo`, `napExpiryTurn`)
- [ ] `generateInitialState` inicializa os 5 campos para CADA reino (não apenas o jogador)
- [ ] `memory` inicializada com zeros para cada par de reinos (betrayal, help, aggression, lastWarTurn, warExhaustion)
- [ ] `DIPLOMACY_ACTION_COSTS` cobre todas as 8 ações com valores corretos
- [ ] `DIPLOMACY_FLAVOR_TEXTS` tem entrada para cada ação (com placeholders `{from}` e `{to}`)
- [ ] `canProposeAlliance` retorna `valid: false, reason: "..."` quando relações < 50
- [ ] `canProposeNAP` retorna `valid: false` quando NAP já ativo
- [ ] `canProposeDefensivePact` retorna `valid: false` quando sem NAP ativo
- [ ] `canDeclareWar` retorna `valid: false` quando já em guerra, com NAP ativo, ou aliado
- [ ] `getDiplomacyAcceptance` retorna `acceptance` entre 0 e 100
- [ ] `getDiplomacyAcceptance` retorna `reasons` detalhando cada fator
- [ ] Ações unilaterais retornam `{ acceptance: 100, reasons: ['Ação unilateral — sempre aceita.'] }`
- [ ] `demandTribute` usa peso de poder militar 40% (em vez de 20%)
- [ ] Todas as funções são puras — não modificam `state` nem nenhum parâmetro

---

## Definição de Pronto (DoD)

- [ ] `npm run lint` — zero erros
- [ ] `npm run build` — sem erros (TypeScript compila limpo; exports de `diplomacyLogic.ts` resolvem)
- [ ] Nenhuma função modifica parâmetros de entrada (puras)
- [ ] `generateInitialState` inicializa TODOS os campos novos — verificar com `Object.keys(realm)` que nenhum é `undefined`
- [ ] Cobertura de edge cases: relações em 100, relações em −100, gold 0, reinos já aliados, etc.
- [ ] Constantes exportadas do módulo correto (`game-constants.ts`)
