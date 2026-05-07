# Sprint 03 — Diplomacia: Lógica de Ações e Call to Arms

> **PRD de origem:** PRD-FASE-1-DIPLOMACIA-HOTKEYS-v2.md §2 (Ações Diplomáticas, Call to Arms, Memória de Eventos)
> **Duração estimada:** 2-2.5 dias
> **Dependências:** Sprint 02 (tipos, constantes, validação, acceptance — `diplomacyLogic.ts` já existe)
> **Pré-requisito para:** Sprint 04 (UI de Diplomacia consome estas funções)

---

## Objetivo da Sprint

Implementar TODAS as funções de lógica diplomática como funções puras em `src/logic/diplomacyLogic.ts`: propostas bilaterais, ações unilaterais, sistema de tributos, Call to Arms defensivo, declaração de guerra e textos narrativos. No final deste sprint, é possível simular todas as ações diplomáticas via console — a UI virá no Sprint 04.

---

## Scope: User Stories

### US-01 — Funções de Proposta Bilateral
**Como** sistema, **preciso** que alianças, NAPs e pactos defensivos possam ser propostos e resolvidos **para** que o jogador e a IA possam estabelecer relacionamentos diplomáticos.

**Implementar em `src/logic/diplomacyLogic.ts`:**

1. **`proposeAlliance(state, fromId, toId): GameState`**
   - Pré-requisitos: `canProposeAlliance` válido + `getDiplomacyAcceptance >= 70%`
   - Se aceite: adiciona `toId` em `from.alliances` e `fromId` em `to.alliances`. Log: flavor text accepted.
   - Se rejeitado: log com flavor text rejected. Estado inalterado.
   - Quebra futura: −80 relações globais, +30 betrayal (implementado quando quebra ocorrer)

2. **`proposeNonAggressionPact(state, fromId, toId): GameState`**
   - Pré-requisitos: `canProposeNAP` válido + `getDiplomacyAcceptance >= 60%`
   - Se aceite: adiciona `toId` em `from.nonAggressionPacts` e `fromId` em `to.nonAggressionPacts`. Timer: `napExpiryTurn[toId] = state.turn + 20` e vice-versa.
   - Duração: 20 turnos, renovável.
   - Quebra automática se um atacar o outro: −60 relações globais, +25 betrayal.

3. **`proposeDefensivePact(state, fromId, toId): GameState`**
   - Pré-requisitos: `canProposeDefensivePact` válido + `getDiplomacyAcceptance >= 75%`
   - Se aceite: adiciona `toId` em `from.defensivePacts` e `fromId` em `to.defensivePacts`.

**Todas as funções retornam NOVO estado** (deep clone feito pelo caller no useGameController).

**Arquivos:** `src/logic/diplomacyLogic.ts`

### US-02 — Funções Unilaterais (Improve Relations + Send Insult)
**Como** jogador, **quero** melhorar ou piorar relações com outro reino unilateralmente **para** influenciar a aceitação de futuras propostas.

**Implementar em `src/logic/diplomacyLogic.ts`:**

1. **`improveRelations(state, fromId, toId): { newRelations: number; delta: number }`**
   - Sempre aceite (não requer acceptance check)
   - Delta: +15 a +25 (varia com `personalityModifier` do alvo)
   - Cap: não excede 100
   - Se já em 100: retorna `{ newRelations: 100, delta: 0 }` (caller mostra toast informativo)
   - Flavor text: "Mensageiros partem carregando sedas finas e palavras de amizade para {realm}."

2. **`sendInsult(state, fromId, toId): { newRelations: number; delta: number }`**
   - Sempre aceite (unilateral — o alvo não pode "recusar" um insulto)
   - Delta: −15 a −25
   - Floor: não reduz abaixo de −100
   - Se já em −100: retorna `{ newRelations: -100, delta: 0 }`
   - Flavor text: "O arauto real declara publicamente que o soberano de {realm} tem a graça de um javali embriagado."

**Estas funções retornam deltas** (não o estado completo) porque apenas modificam `relations`. O caller aplica o delta ao estado clonado.

**Arquivos:** `src/logic/diplomacyLogic.ts`

### US-03 — Sistema de Tributos
**Como** jogador, **quero** oferecer ou exigir tributo de outros reinos **para** gerar renda passiva ou comprar paz.

**Implementar em `src/logic/diplomacyLogic.ts`:**

1. **`offerTribute(state, fromId, toId, amount): GameState`**
   - Pré-requisitos: `canOfferTribute` válido + `getDiplomacyAcceptance >= 50%`
   - Se aceite: regista em `tributeTo[toId] = amount` e `tributeFrom[fromId] = amount` no reino recetor. +10 relações ao oferecer. +2 relações por turno enquanto pagar.
   - Parar tributo (ação separada): remove o tributo, −20 relações com o recetor.

2. **`demandTribute(state, fromId, toId, amount): { accepted: boolean; newState: GameState }`**
   - Pré-requisitos: `getDiplomacyAcceptance >= 50%` (com poder militar 40%)
   - Se aceite: regista tributo. Alvo acumula +15 betrayal e −1 relação por turno enquanto paga.
   - Se recusar: −10 relações. Jogador pode escalar para `declareWar`.

3. **`stopTribute(state, realmId, targetId): GameState`**
   - Remove entrada de `tributeTo` e `tributeFrom`
   - −20 relações com o recetor

**Arquivos:** `src/logic/diplomacyLogic.ts`

### US-04 — Sistema Call to Arms (Defesa Opcional)
**Como** sistema, **preciso** que aliados e parceiros de pacto defensivo sejam notificados quando um reino é atacado **para** que possam escolher honrar ou quebrar o pacto.

**Implementar em `src/logic/diplomacyLogic.ts`:**

1. **`checkDefensiveCallToArms(state, defenderId, aggressorId): { callsToResolve: CallToArmsRequest[] }`**
   - Chamado quando `declareWar` é executado
   - Para cada reino C que tem `alliance` ou `defensivePact` com o defensor B:
     - Cria `CallToArmsRequest` com: defensor B, agressor A, reino chamado C, tipo de pacto
   - Se C é o jogador → modal de decisão (Sprint 04)
   - Se C é IA → decide automaticamente:
     - Relações com B (40%): se > 60, tende a aceitar
     - Poder militar relativo (35%): se A é muito mais forte, tende a recusar
     - Personalidade (25%): Honrado (sempre aceita), Oportunista (aceita se vantajoso), Covarde (sempre recusa)
   - Call to Arms NÃO é em cadeia (apenas aliados diretos do defensor)

2. **`resolveCallToArms(state, requestId, accepted): GameState`**
   - Se **aceitar**: C declara guerra a A automaticamente. +15 relações com B. +20 help na memória. Log: "{C} honra sua aliança/pacto com {B} e entra na guerra contra {A}!"
   - Se **recusar**: Aliança/pacto defensivo quebrado. −50 relações com B. +20 betrayal. Log: "{C} abandona {B} em sua hora de necessidade."

**Timing:** A decisão acontece no mesmo momento da declaração de guerra (antes do próximo turno).

**Novo tipo** em `types.ts`:
```typescript
interface CallToArmsRequest {
  id: string;
  defenderId: string;
  aggressorId: string;
  calledRealmId: string;
  pactType: 'alliance' | 'defensivePact';
  resolved: boolean;
}
```

**Arquivos:** `src/logic/diplomacyLogic.ts`, `src/types.ts`

### US-05 — Declare War Integrada + Flavor Text Helper
**Como** sistema, **preciso** que a declaração de guerra dispare Call to Arms e que todas as ações usem textos narrativos **para** completar o ciclo diplomático.

**Implementar em `src/logic/diplomacyLogic.ts`:**

1. **`declareWar(state, fromId, toId): { newState: GameState; callsToResolve: CallToArmsRequest[] }`**
   - Pré-requisitos: `canDeclareWar` válido
   - Adiciona `toId` em `from.wars` e `fromId` em `to.wars`
   - Dispara `checkDefensiveCallToArms(state, toId, fromId)` — defensor pode chamar aliados
   - +15 aggression na memória do alvo e aliados do alvo
   - Se havia NAP ativo entre from e to: NAP quebrado (−60 relações globais, +25 betrayal)
   - Se havia aliança: aliança quebrada (−80 relações globais, +30 betrayal)

2. **`getDiplomacyFlavorText(action, fromName, toName, accepted): string`**
   - Substitui `{from}` e `{to}` nos templates de `DIPLOMACY_FLAVOR_TEXTS`
   - Fallback: "A proposta diplomática foi {accepted|rejected}." se ação não tiver texto mapeado

**Arquivos:** `src/logic/diplomacyLogic.ts`

---

## Arquivos Afetados

| Arquivo | Ação | User Stories |
|---------|------|-------------|
| `src/logic/diplomacyLogic.ts` | Editar — adicionar 12+ funções | US-01 a US-05 |
| `src/types.ts` | Editar — adicionar `CallToArmsRequest` | US-04 |

---

## Critérios de Aceitação

- [ ] `proposeAlliance` com acceptance >= 70%: aliança bilateral criada, log com flavor text
- [ ] `proposeAlliance` com acceptance < 70%: rejeitada, log com flavor text rejected
- [ ] `proposeNonAggressionPact`: NAP bilateral + `napExpiryTurn[turnoAtual + 20]`
- [ ] `proposeDefensivePact` sem NAP ativo: bloqueada (canProposeDefensivePact retorna false)
- [ ] `improveRelations`: +15 a +25, cap 100, delta 0 se já em 100
- [ ] `sendInsult`: −15 a −25, floor −100, delta 0 se já em −100
- [ ] `offerTribute`: gold deduzido, tributo registado, +10 relações
- [ ] `demandTribute` aceite: tributo registado, +15 betrayal para o alvo
- [ ] `demandTribute` rejeitado: −10 relações, estado inalterado
- [ ] `checkDefensiveCallToArms`: retorna lista de chamadas para todos os aliados/defensivePact do defensor
- [ ] IA decide Call to Arms com base em relações (40%), poder (35%), personalidade (25%)
- [ ] `resolveCallToArms` aceite: guerra declarada, +15 relações, +20 help
- [ ] `resolveCallToArms` recusado: pacto quebrado, −50 relações, +20 betrayal
- [ ] `declareWar`: adiciona guerra bilateral, dispara Call to Arms, quebra NAP/aliança se existente
- [ ] `getDiplomacyFlavorText` substitui placeholders corretamente
- [ ] Fallback de flavor text funciona para ações sem entrada na tabela

---

## Definição de Pronto (DoD)

- [ ] `npm run lint` — zero erros
- [ ] `npm run build` — sem erros (TypeScript compila; todos os exports de `diplomacyLogic.ts` resolvem)
- [ ] **Todas as funções são puras** — retornam novo estado ou dados; NUNCA mutam parâmetros
- [ ] Deep clone é responsabilidade do CALLER (useGameController) — documentado em JSDoc de cada função
- [ ] Memória de eventos (`betrayal`, `help`, `aggression`) populada nos eventos corretos (quebra de pacto, Call to Arms, declaração de guerra)
- [ ] `declareWar` remove NAP e/ou aliança automaticamente se existentes entre os beligerantes
- [ ] `CallToArmsRequest` inclui `id` único para tracking
- [ ] Cobertura de edge cases: relações já no cap/floor, gold 0, aceitação 0%, aceitação 100%
