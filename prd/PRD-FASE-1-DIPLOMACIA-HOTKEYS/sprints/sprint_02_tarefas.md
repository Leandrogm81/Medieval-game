# Sprint 02 — Tarefas Decompostas (para coder simples)

> **Origem:** sprint_02_diplomacia_modelo_validacao.md
> **Total de tarefas:** 6
> **Ordem de execução:** sequencial
> **Regras:** Funções puras (não modificam parâmetros). `npm run lint` após cada tarefa. Não escrever UI — é só dados e lógica.

---

## Tarefa 1 — Adicionar tipo DiplomacyAction e novos campos em Realm (types.ts)

- **Objetivo:** Estender os tipos TypeScript para suportar todas as ações diplomáticas e relacionamentos entre reinos.
- **Arquivos prováveis:** `src/types.ts`
- **Passos:**
  1. Abrir `src/types.ts`. Localizar o type `Realm` (interface).
  2. Adicionar os 5 novos campos ao `Realm`:
     - `nonAggressionPacts: string[]` (IDs de reinos com NAP)
     - `defensivePacts: string[]` (IDs com pacto defensivo)
     - `tributeFrom: Record<string, number>` (realmId → gold recebido)
     - `tributeTo: Record<string, number>` (realmId → gold pago)
     - `napExpiryTurn: Record<string, number>` (realmId → turno expiração NAP)
  3. Adicionar NOVA interface `RealmMemory`:
     ```typescript
     export interface RealmMemory {
       betrayal: number;
       help: number;
       aggression: number;
       lastWarTurn: number;
       warExhaustion: number;
     }
     ```
  4. Adicionar à interface `Realm` o campo: `memory: Record<string, RealmMemory>` (mapeia realmId → memória).
  5. Adicionar o tipo `DiplomacyAction` como union type (fora das interfaces, no topo ou após os types):
     `export type DiplomacyAction = 'alliance' | 'nonAggressionPact' | 'defensivePact' | 'improveRelations' | 'sendInsult' | 'offerTribute' | 'demandTribute' | 'declareWar'`.
  6. NÃO alterar campos existentes. Só adicionar os novos.
- **Critérios de aceite:**
  - `DiplomacyAction` é um union type de 8 strings.
  - `Realm` tem os 5 novos campos + `memory: Record<string, RealmMemory>`.
  - `RealmMemory` tem os 5 campos numéricos.
  - `npm run lint` passa (atenção: `npm run lint` é `tsc --noEmit` — pode falhar porque os novos campos não são inicializados em mapGeneration.ts. Isto é ESPERADO e será corrigido na Tarefa 2).
- **Como validar:** `npm run lint` (esperar erros de inicialização em mapGeneration.ts — normais, serão corrigidos na Tarefa 2).
- **Riscos:**
  - Se modificar campos existentes do Realm, pode quebrar outras partes do código.
  - Garantir que `DiplomacyAction` é exportado para poder ser importado em game-constants.ts.

---

## Tarefa 2 — Inicializar novos campos em mapGeneration.ts

- **Objetivo:** Garantir que todos os novos campos sejam inicializados com valores padrão para cada reino, evitando erros de `undefined`.
- **Arquivos prováveis:** `src/logic/mapGeneration.ts`
- **Depende de:** Tarefa 1 (tipos definidos)
- **Passos:**
  1. Abrir `src/logic/mapGeneration.ts`. Localizar onde os reinos são criados (função `generateInitialState`, na secção de inicialização de cada `Realm`).
  2. Para CADA reino gerado, adicionar os valores padrão:
     ```typescript
     nonAggressionPacts: [],
     defensivePacts: [],
     tributeFrom: {},
     tributeTo: {},
     napExpiryTurn: {},
     memory: {},
     ```
  3. Inicializar `memory` para cada PAR de reinos:
     - Após criar todos os reinos, fazer um loop duplo: para cada par `(realmA, realmB)` onde `realmA.id !== realmB.id`:
       ```typescript
       realmA.memory[realmB.id] = { betrayal: 0, help: 0, aggression: 0, lastWarTurn: 0, warExhaustion: 0 };
       realmB.memory[realmA.id] = { betrayal: 0, help: 0, aggression: 0, lastWarTurn: 0, warExhaustion: 0 };
       ```
     - NOTA: inicializar antes de os reinos serem congelados/retornados.
  4. Verificar que o reino do jogador também recebe os campos.
  5. NÃO alterar a lógica de geração do mapa. Só adicionar inicialização.
- **Critérios de aceite:**
  - `npm run lint` passa SEM erros (todos os novos campos são inicializados).
  - Nenhum campo fica `undefined` em nenhum reino.
  - `memory` é inicializado simetricamente para todos os pares de reinos.
- **Como validar:** `npm run lint && npm run build`
- **Riscos:**
  - O loop duplo pode ser pesado se houver muitos reinos — mas com max 8 reinos, 8×7=56 entradas, é insignificante.
  - Garantir que a inicialização acontece ANTES de qualquer acesso aos campos.

---

## Tarefa 3 — Adicionar constantes DIPLOMACY_ACTION_COSTS e DIPLOMACY_FLAVOR_TEXTS

- **Objetivo:** Centralizar custos de AP e textos narrativos para todas as ações diplomáticas.
- **Arquivos prováveis:** `src/logic/game-constants.ts`
- **Depende de:** Tarefa 1 (DiplomacyAction type)
- **Passos:**
  1. Abrir `src/logic/game-constants.ts`. Adicionar no final do ficheiro (antes de qualquer export final).
  2. Importar `DiplomacyAction` de `../types`.
  3. Adicionar `DIPLOMACY_ACTION_COSTS: Record<DiplomacyAction, number>`:
     ```
     improveRelations: 1
     sendInsult: 1
     nonAggressionPact: 1
     defensivePact: 1
     alliance: 2
     offerTribute: 1
     demandTribute: 1
     declareWar: 2
     ```
  4. Adicionar `DIPLOMACY_FLAVOR_TEXTS: Record<DiplomacyAction, { accepted: string; rejected?: string }>`:
     - Cada ação tem `accepted` (obrigatório). Ações bilaterais têm também `rejected`.
     - Usar placeholders `{from}` e `{to}` para nomes de reinos.
     - Exemplo: `alliance: { accepted: "{from} e {to} selam uma aliança sagrada.", rejected: "{to} rejeita a proposta de aliança de {from}." }`
     - `improveRelations` e `sendInsult` (unilaterais): apenas `accepted`, SEM `rejected`.
     - Todos os 8 tipos devem ter entrada.
  5. Textos podem ser em português (já que o jogo está em português).
  6. NÃO alterar constantes existentes. Só adicionar as novas.
- **Critérios de aceite:**
  - `npm run lint` passa.
  - `DIPLOMACY_ACTION_COSTS` tem 8 entradas com os valores corretos.
  - `DIPLOMACY_FLAVOR_TEXTS` tem 8 entradas.
  - Ações unilaterais (`improveRelations`, `sendInsult`) NÃO têm campo `rejected`.
- **Como validar:** `npm run lint && npm run build`
- **Riscos:**
  - Typo no nome das chaves (ex: `nonAgressionPact` vs `nonAggressionPact`). Usar copy-paste dos tipos para garantir.
  - Esquecer de importar `DiplomacyAction` → erro de tipo.

---

## Tarefa 4 — Criar diplomacyLogic.ts com funções de validação (canPropose*)

- **Objetivo:** Implementar 8 funções puras que validam se uma ação diplomática pode ser proposta, retornando `{ valid: boolean; reason?: string }`.
- **Arquivos prováveis:** `src/logic/diplomacyLogic.ts` (criar novo ficheiro)
- **Depende de:** Tarefas 1, 2, 3
- **Passos:**
  1. Criar `src/logic/diplomacyLogic.ts`.
  2. Importar tipos necessários de `../types` e constantes de `./game-constants`.
  3. Implementar as 8 funções. TODAS são puras — apenas leem o estado, não modificam:

     **`canProposeAlliance(state, fromId, toId)`**:
     - Verifica: `relations[toId] >= 50`, NÃO está em guerra com `toId`, NÃO é já aliado (`alliances.includes(toId)`).
     - Se falhar, retorna `{ valid: false, reason: "Relações insuficientes (precisa 50, tem X)." }` ou motivo específico.

     **`canProposeNAP(state, fromId, toId)`**:
     - Verifica: `relations[toId] >= 20`, NÃO em guerra, NAP não já ativo (`nonAggressionPacts.includes(toId)`).

     **`canProposeDefensivePact(state, fromId, toId)`**:
     - Verifica: NAP ativo (`nonAggressionPacts.includes(toId)`), `relations[toId] >= 40`, NÃO já tem pacto defensivo.

     **`canImproveRelations(state, fromId, toId)`**:
     - Se `relations[toId] >= 100` → `{ valid: false, reason: "Relações já no máximo." }`.
     - Caso contrário → `{ valid: true }`.

     **`canSendInsult(state, fromId, toId)`**:
     - Se `relations[toId] <= -100` → `{ valid: false, reason: "Relações já no mínimo." }`.
     - Caso contrário → `{ valid: true }`.

     **`canOfferTribute(state, fromId, toId, amount)`**:
     - Verifica `fromRealm.gold >= amount`.
     - Se não → `{ valid: false, reason: "Ouro insuficiente." }`.

     **`canDemandTribute(state, fromId, toId, amount)`**:
     - Sempre `{ valid: true }` (pode tentar, mesmo que seja rejeitado).

     **`canDeclareWar(state, fromId, toId)`**:
     - Verifica: NÃO está já em guerra, NÃO tem NAP ativo, NÃO é aliado.
     - Motivos específicos para cada bloqueio.

  4. Cada função recebe `state: GameState` como primeiro parâmetro.
  5. NÃO usar React, hooks, JSX. TypeScript puro.
- **Critérios de aceite:**
  - `canProposeAlliance` com relações 30 → `{ valid: false }`.
  - `canProposeNAP` com NAP já ativo → `{ valid: false }`.
  - `canDeclareWar` com guerra já ativa → `{ valid: false }`.
  - `canImproveRelations` com relações 100 → `{ valid: false, reason: "..." }`.
  - `canOfferTribute` com gold 0 e amount 50 → `{ valid: false }`.
  - `canDemandTribute` → sempre `{ valid: true }`.
  - Nenhuma função modifica o estado.
- **Como validar:** `npm run lint && npm run build`
- **Riscos:**
  - Aceder `state.realms[fromId]` quando `fromId` pode não existir → adicionar guard `if (!fromRealm || !toRealm) return { valid: false, reason: "Reino não encontrado." }`.
  - O campo `relations` pode não existir se não foi inicializado. Verificar no início: `fromRealm.relations?.[toId] ?? 0`.

---

## Tarefa 5 — Implementar getDiplomacyAcceptance

- **Objetivo:** Calcular a probabilidade de aceitação (0-100) de uma proposta diplomática com base em 6 fatores ponderados.
- **Arquivos prováveis:** `src/logic/diplomacyLogic.ts`
- **Depende de:** Tarefa 4 (diplomacyLogic.ts existe)
- **Passos:**
  1. No mesmo `diplomacyLogic.ts`, adicionar função `getDiplomacyAcceptance(playerRealm, targetRealm, action, state)`.
  2. Retorna `{ acceptance: number; reasons: string[] }`.
  3. Ações unilaterais (`improveRelations`, `sendInsult`, `declareWar`): retornar `{ acceptance: 100, reasons: ['Ação unilateral — sempre aceita.'] }`.
  4. Para ações bilaterais, calcular 6 fatores:
     - **Relações (40%):** `(relations + 100) / 2` (mapeia de −100..100 para 0..100).
     - **Poder militar (20% ou 40%):** comparar `playerPower / (playerPower + targetPower) * 100`. Para `demandTribute`, peso = 40%.
     - **Personalidade (15% ou 5%):** Pacificador +20, Agressivo −10. Para `demandTribute`, peso = 5%.
     - **Memória (15%):** `help * 1 - betrayal * 0.5 - aggression * 0.3`, mapeado para 0..100.
     - **Inimigos comuns (5%):** contar reinos em guerra com ambos. Cada um soma +5, máximo +15.
     - **Distância geográfica (5%):** +5 se vizinho (províncias adjacentes), −5 se > 5 províncias de distância.
  5. Soma ponderada: `acceptance = Σ (fator × peso / 100)`.
  6. Clamp final: `Math.max(0, Math.min(100, Math.round(acceptance)))`.
  7. O array `reasons` deve listar cada fator com sua contribuição (ex: `"Relações (40%): +32"`).
  8. NÃO modificar estado. Função pura.
- **Critérios de aceite:**
  - Relações 100, poder equilibrado, personalidade neutra → acceptance ≈ 70-80%.
  - Relações −100 → acceptance perto de 0%.
  - `demandTribute` usa poder militar 40% (em vez de 20%).
  - `declareWar` retorna `{ acceptance: 100 }` (unilateral).
  - `reasons` contém uma string por fator.
  - Resultado sempre entre 0 e 100.
- **Como validar:** `npm run lint && npm run build`. Testar manualmente no console do browser: `import { getDiplomacyAcceptance } from './logic/diplomacyLogic'`.
- **Riscos:**
  - O campo `personality` pode não ser um dos valores esperados. Usar switch com default.
  - Inimigos comuns: garantir que não conta o próprio `toId` como inimigo.
  - Distância: calcular BFS entre capitais ou verificar se províncias são vizinhas.

---

## Tarefa 6 — Validação final

- **Objetivo:** Verificar que toda a sprint 02 compila e funciona.
- **Arquivos prováveis:** (nenhum — verificação)
- **Depende de:** Tarefas 1 a 5
- **Passos:**
  1. `npm run lint` — zero erros.
  2. `npm run build` — sem erros.
  3. No browser, abrir consola e testar:
     - `import { canProposeAlliance, getDiplomacyAcceptance } from './logic/diplomacyLogic'`
     - Criar um `GameState` de exemplo e verificar que as funções retornam valores esperados.
  4. Verificar que `generateInitialState` inicializa todos os campos (sem `undefined`).
  5. Verificar que `DIPLOMACY_ACTION_COSTS` e `DIPLOMACY_FLAVOR_TEXTS` são exportados.
- **Critérios de aceite:**
  - [ ] `npm run lint` — zero erros
  - [ ] `npm run build` — sem erros
  - [ ] `DiplomacyAction` compila como union type
  - [ ] `Realm` tem todos os 5+1 novos campos
  - [ ] `generateInitialState` inicializa campos para CADA reino
  - [ ] `memory` simétrico para todos os pares
  - [ ] `DIPLOMACY_ACTION_COSTS` cobre 8 ações
  - [ ] `DIPLOMACY_FLAVOR_TEXTS` tem 8 entradas
  - [ ] `canPropose*` cobre edge cases (relações min/max, guerra, NAP ativo)
  - [ ] `getDiplomacyAcceptance` retorna 0-100 com reasons
  - [ ] Ações unilaterais retornam `{ acceptance: 100 }`
  - [ ] `demandTribute` usa poder 40%
  - [ ] Todas as funções são puras
- **Como validar:** `npm run lint && npm run build`
- **Riscos:**
  - Se alguma tarefa anterior ficou incompleta, esta apenas deteta. Voltar e corrigir.
