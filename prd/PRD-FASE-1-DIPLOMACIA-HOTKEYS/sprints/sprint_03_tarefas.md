# Sprint 03 — Tarefas Decompostas (para coder simples)

> **Origem:** sprint_03_diplomacia_logica_acoes.md
> **Total de tarefas:** 7
> **Ordem de execução:** sequencial
> **Regras:** TODAS as funções são PURAS — retornam novo estado ou dados, NUNCA mutam parâmetros. Deep clone é responsabilidade do CALLER. Funções assumem que recebem um estado deep-clonado.

---

## Tarefa 1 — Adicionar CallToArmsRequest a types.ts

- **Objetivo:** Adicionar o tipo que representa uma chamada às armas pendente.
- **Arquivos prováveis:** `src/types.ts`
- **Passos:**
  1. Abrir `src/types.ts`.
  2. Adicionar interface `CallToArmsRequest`:
     ```typescript
     export interface CallToArmsRequest {
       id: string;
       defenderId: string;
       aggressorId: string;
       calledRealmId: string;
       pactType: 'alliance' | 'defensivePact';
       resolved: boolean;
     }
     ```
  3. NÃO alterar outras interfaces. Apenas adicionar.
- **Critérios de aceite:** `npm run lint` passa. `CallToArmsRequest` exportado.
- **Como validar:** `npm run lint`
- **Riscos:** Nenhum — é só uma interface nova.

---

## Tarefa 2 — Implementar funções de proposta bilateral (alliance, NAP, defensive pact)

- **Objetivo:** Criar `proposeAlliance`, `proposeNonAggressionPact`, `proposeDefensivePact` — funções que recebem estado deep-clonado, aplicam a ação e retornam o novo estado.
- **Arquivos prováveis:** `src/logic/diplomacyLogic.ts`
- **Depende de:** Sprint 02 concluído (diplomacyLogic.ts já tem canPropose* e getDiplomacyAcceptance)
- **Passos:**
  1. Abrir `src/logic/diplomacyLogic.ts` (criado no Sprint 02).
  2. Adicionar função `proposeAlliance(state: GameState, fromId: string, toId: string): GameState`:
     - Validar com `canProposeAlliance(state, fromId, toId)`. Se inválido → retornar estado inalterado + adicionar entry nos logs com motivo.
     - Calcular `acceptance = getDiplomacyAcceptance(...)`.
     - Se `acceptance >= 70`:
       - `fromRealm.alliances.push(toId)`, `toRealm.alliances.push(fromId)`.
       - Adicionar log com flavor text accepted (usar `DIPLOMACY_FLAVOR_TEXTS.alliance.accepted`, substituir `{from}` e `{to}`).
       - Adicionar +30 relações bilateralmente.
     - Se `acceptance < 70`:
       - Adicionar log com flavor text rejected.
       - −5 relações bilateralmente.
     - Retornar o estado (que já foi modificado — o caller passou deep clone).
     - NOTA: esta função NÃO faz deep clone; assume que recebe estado clonado.
  3. Adicionar `proposeNonAggressionPact(state, fromId, toId)`:
     - Validar com `canProposeNAP`. Se inválido → retornar.
     - Se `acceptance >= 60`:
       - `fromRealm.nonAggressionPacts.push(toId)`, `toRealm.nonAggressionPacts.push(fromId)`.
       - `fromRealm.napExpiryTurn[toId] = state.turn + 20`, idem para `toRealm`.
       - Log com flavor text accepted.
       - +15 relações bilateralmente.
     - Se rejeitado: log rejected, −3 relações.
  4. Adicionar `proposeDefensivePact(state, fromId, toId)`:
     - Validar com `canProposeDefensivePact`. Se inválido → retornar.
     - Se `acceptance >= 75`:
       - `fromRealm.defensivePacts.push(toId)`, `toRealm.defensivePacts.push(fromId)`.
       - Log com flavor text accepted.
       - +10 relações bilateralmente.
     - Se rejeitado: log rejected, −3 relações.
  5. NÃO criar toasts aqui — apenas logs no `state.logs`.
  6. Usar `getDiplomacyFlavorText` (será criado na Tarefa 5 — por enquanto, fazer substituição manual de `{from}` e `{to}` inline ou criar helper local).
- **Critérios de aceite:**
  - Aliança com acceptance >= 70% → `alliances` atualizado bilateralmente, log presente.
  - NAP cria `napExpiryTurn` com `turn + 20`.
  - DefensivePact sem NAP → validado e bloqueado por `canProposeDefensivePact`.
  - Rejeição → estado inalterado (exceto relações e log).
- **Como validar:** `npm run lint && npm run build`
- **Riscos:**
  - Modificar `state` diretamente quando o caller espera imutabilidade. Documentar em JSDoc: `/** @param state Deve ser um deep clone. Esta função modifica o objeto recebido. */`.
  - Esquecer de atualizar `relations` bilateralmente.

---

## Tarefa 3 — Implementar funções unilaterais (improveRelations, sendInsult)

- **Objetivo:** Criar funções que alteram relações sem precisar de aceitação do alvo.
- **Arquivos prováveis:** `src/logic/diplomacyLogic.ts`
- **Depende de:** Tarefa 2 (diplomacyLogic.ts já tem estrutura)
- **Passos:**
  1. Adicionar `improveRelations(state, fromId, toId): { newRelations: number; delta: number }`:
     - Obter `currentRelations = fromRealm.relations[toId] ?? 0`.
     - Se `currentRelations >= 100` → retornar `{ newRelations: 100, delta: 0 }`.
     - Calcular delta: `15 + Math.floor(Math.random() * 11)` (15 a 25).
     - Aplicar personality modifier do alvo: Pacificador +5, Agressivo −5, outros 0.
     - `newRelations = Math.min(100, currentRelations + delta)`.
     - Atualizar `fromRealm.relations[toId]` e `toRealm.relations[fromId]` com `newRelations`.
     - Adicionar log com flavor text.
     - Retornar `{ newRelations, delta }`.
  2. Adicionar `sendInsult(state, fromId, toId): { newRelations: number; delta: number }`:
     - Se `currentRelations <= -100` → retornar `{ newRelations: -100, delta: 0 }`.
     - Delta: `-(15 + Math.floor(Math.random() * 11))` (−15 a −25).
     - `newRelations = Math.max(-100, currentRelations + delta)` (delta já é negativo).
     - Atualizar bilateralmente.
     - Adicionar log com flavor text.
     - Retornar `{ newRelations, delta }`.
  3. NÃO retornar o estado completo — apenas o delta. O caller aplica ao estado clonado.
  4. Estas funções NÃO usam `getDiplomacyAcceptance` (são sempre aceites).
- **Critérios de aceite:**
  - `improveRelations` com relações 50 → retorna delta entre +15 e +25.
  - `improveRelations` com relações 100 → retorna `{ newRelations: 100, delta: 0 }`.
  - `sendInsult` com relações −100 → retorna `{ newRelations: -100, delta: 0 }`.
  - `sendInsult` com relações 0 → retorna delta entre −15 e −25.
- **Como validar:** `npm run lint && npm run build`
- **Riscos:**
  - `Math.random()` torna as funções não-determinísticas. Para testes, é aceitável (o jogo usa aleatoriedade).
  - Garantir que `relations` existe no objeto `Realm` antes de aceder (usar `?? 0`).

---

## Tarefa 4 — Implementar sistema de tributos (offer, demand, stop)

- **Objetivo:** Criar funções para oferecer, exigir e cancelar tributos entre reinos.
- **Arquivos prováveis:** `src/logic/diplomacyLogic.ts`
- **Depende de:** Tarefa 2
- **Passos:**
  1. Adicionar `offerTribute(state: GameState, fromId: string, toId: string, amount: number): GameState`:
     - Validar `canOfferTribute`. Se inválido → retornar.
     - Se `getDiplomacyAcceptance >= 50`:
       - Deduzir `amount` de `fromRealm.gold`.
       - Registar: `fromRealm.tributeTo[toId] = amount` (criar ou somar? A sprint diz "regista", então `=` basta, mas o campo é `Record<string, number>` — apenas um tributo ativo por destino).
       - `toRealm.tributeFrom[fromId] = amount`.
       - +10 relações com `toId`.
       - Adicionar log com flavor text.
     - Se rejeitado: −3 relações, log rejected.
  2. Adicionar `demandTribute(state, fromId, toId, amount): { accepted: boolean; newState: GameState }`:
     - Calcular `acceptance` (com poder militar 40% — a função `getDiplomacyAcceptance` já trata isto).
     - Se `acceptance >= 50`:
       - Registar tributo (igual a `offerTribute` mas sem dedução inicial de gold — o pagamento é por turno).
       - `toRealm.memory[fromId].betrayal += 15`.
       - Retornar `{ accepted: true, newState: state }`.
     - Se rejeitado:
       - −10 relações.
       - Retornar `{ accepted: false, newState: state }`.
  3. Adicionar `stopTribute(state, fromId, toId): GameState`:
     - Remover `delete fromRealm.tributeTo[toId]`.
     - Remover `delete toRealm.tributeFrom[fromId]`.
     - −20 relações com `toId`.
     - Log informativo.
  4. Todas assumem estado deep-clonado.
- **Critérios de aceite:**
  - `offerTribute` aceite: gold deduzido, tributo registado, +10 relações.
  - `offerTribute` rejeitado: gold NÃO deduzido, −3 relações.
  - `demandTribute` aceite: tributo registado, +15 betrayal.
  - `demandTribute` rejeitado: −10 relações, sem tributo.
  - `stopTribute`: tributo removido, −20 relações.
- **Como validar:** `npm run lint && npm run build`
- **Riscos:**
  - `offerTribute` com gold insuficiente: `canOfferTribute` já bloqueia. Se chegar aqui com gold insuficiente, o estado fica inconsistente. Adicionar dupla verificação.

---

## Tarefa 5 — Implementar sistema Call to Arms + declareWar + flavor text

- **Objetivo:** Implementar o sistema completo de chamada às armas e declaração de guerra integrada.
- **Arquivos prováveis:** `src/logic/diplomacyLogic.ts`
- **Depende de:** Tarefas 2, 4
- **Passos:**
  1. Adicionar helper `getDiplomacyFlavorText(action, fromName, toName, accepted): string`:
     - Obter template de `DIPLOMACY_FLAVOR_TEXTS[action]`.
     - Se não existir → retornar `"A proposta diplomática foi {accepted|rejected}."`.
     - Substituir `{from}` por `fromName`, `{to}` por `toName`.
     - Escolher `template.accepted` ou `template.rejected` conforme `accepted`.
  2. Adicionar `checkDefensiveCallToArms(state, defenderId, aggressorId): CallToArmsRequest[]`:
     - Obter o defensor: `defender = state.realms[defenderId]`.
     - Para cada reino C em `defender.alliances` e `defender.defensivePacts`:
       - Se C === aggressorId → pular.
       - Criar `CallToArmsRequest` com `id = 'cta_' + Date.now() + '_' + Math.random()`, `defenderId`, `aggressorId`, `calledRealmId: C`, `pactType` (alliance ou defensivePact), `resolved: false`.
     - Retornar array de chamadas.
  3. Adicionar `resolveCallToArms(state, requestId, accepted): GameState`:
     - Encontrar o request. Se não encontrado ou já resolved → retornar.
     - Marcar `request.resolved = true`.
     - Se `accepted`:
       - C (calledRealm) declara guerra a A (aggressor): `cRealm.wars.push(aggressorId)`, `aRealm.wars.push(calledRealmId)`.
       - +15 relações com defensor B.
       - `cRealm.memory[defenderId].help += 20`.
       - Log: "C honra sua aliança/pacto com B e entra na guerra contra A!"
     - Se `!accepted`:
       - Remover aliança/pacto entre C e B.
       - −50 relações entre C e B.
       - `cRealm.memory[defenderId].betrayal += 20`.
       - Log: "C abandona B em sua hora de necessidade."
  4. Adicionar `declareWar(state, fromId, toId): { newState: GameState; callsToResolve: CallToArmsRequest[] }`:
     - Validar `canDeclareWar`. Se inválido → retornar estado inalterado.
     - Adicionar guerra: `fromRealm.wars.push(toId)`, `toRealm.wars.push(fromId)`.
     - Disparar `callsToResolve = checkDefensiveCallToArms(state, toId, fromId)`.
     - +15 aggression na memória.
     - Se NAP ativo entre from e to: quebrar NAP (−60 relações, +25 betrayal) + remover de `nonAggressionPacts` e `napExpiryTurn`.
     - Se aliança ativa: quebrar aliança (−80 relações, +30 betrayal) + remover de `alliances`.
     - Log narrativo.
     - Retornar `{ newState: state, callsToResolve }`.
  5. NÃO implementar IA de decisão automática — isso será feito no Sprint 04 (useGameController).
- **Critérios de aceite:**
  - `getDiplomacyFlavorText` substitui placeholders corretamente.
  - `checkDefensiveCallToArms` retorna chamadas para aliados e parceiros de pacto defensivo.
  - `resolveCallToArms` aceite → guerra declarada, +15 relações, +20 help.
  - `resolveCallToArms` recusado → pacto quebrado, −50 relações, +20 betrayal.
  - `declareWar` adiciona guerra bilateral, dispara Call to Arms.
  - `declareWar` quebra NAP/aliança se existentes entre beligerantes.
- **Como validar:** `npm run lint && npm run build`
- **Riscos:**
  - `checkDefensiveCallToArms` pode gerar muitas chamadas (reinos com muitos aliados). O array é retornado para o caller gerir.
  - `declareWar` remove NAP/aliança — garantir que remove também a entrada reversa (do outro reino).
  - IDs duplicados em `wars` — verificar se já existe antes de adicionar.

---

## Tarefa 6 — Implementar IA para Call to Arms (decisão automática)

- **Objetivo:** Quando um reino IA é chamado às armas, decidir automaticamente se aceita ou recusa.
- **Arquivos prováveis:** `src/logic/diplomacyLogic.ts`
- **Depende de:** Tarefa 5
- **Passos:**
  1. Adicionar função `autoResolveCallToArms(state, request): boolean`:
     - Recebe o estado e um `CallToArmsRequest`.
     - Retorna `true` se aceitar, `false` se recusar.
     - O reino chamado C decide com base em 3 fatores:
       - **Relações com defensor B (40%):** se > 60, maior probabilidade de aceitar.
       - **Poder militar relativo (35%):** comparar `power(C) + power(B)` vs `power(aggressor)`. Se aggressor muito mais forte, tende a recusar.
       - **Personalidade de C (25%):**
         - `honrado`: SEMPRE aceita.
         - `oportunista`: aceita se poder relativo > 0.6.
         - `covarde`: SEMPRE recusa.
         - outros (`neutro`, `agressivo`, etc.): usa fórmula padrão.
     - Calcular score: `relationsScore * 0.4 + powerScore * 0.35 + personalityScore * 0.25`.
     - Se score > 50 → aceita.
  2. Esta função é chamada pelo caller no useGameController para reinos IA.
  3. NÃO modificar estado — apenas retorna booleano.
- **Critérios de aceite:**
  - Honrado sempre aceita.
  - Covarde sempre recusa.
  - Relações altas + poder equilibrado → tende a aceitar.
  - Relações baixas + poder muito inferior → tende a recusar.
- **Como validar:** `npm run lint && npm run build`
- **Riscos:**
  - O campo `personality` pode não estar definido em todos os reinos. Verificar no início: `const personality = cRealm.personality || 'neutro'`.
  - Cálculo de poder militar: somar `troops` de todas as províncias do reino.

---

## Tarefa 7 — Validação final

- **Objetivo:** Verificar que todas as funções compilam e são puras.
- **Arquivos prováveis:** (nenhum)
- **Depende de:** Tarefas 1 a 6
- **Passos:**
  1. `npm run lint` — zero erros.
  2. `npm run build` — sem erros.
  3. Verificar exports: todas as novas funções devem ser exportadas de `diplomacyLogic.ts`.
  4. Verificar JSDoc: cada função que modifica estado deve ter `@param state Deve ser um deep clone`.
- **Critérios de aceite:** (checklist completa no sprint original)
- **Como validar:** `npm run lint && npm run build`
- **Riscos:** Se funções não forem exportadas, o Sprint 04 não conseguirá importá-las.
