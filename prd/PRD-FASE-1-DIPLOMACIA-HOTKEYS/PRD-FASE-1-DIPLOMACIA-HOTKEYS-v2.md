# PRD — Fase 1: Diplomacia, Hotkeys e Refinamentos de Combate

> **Versão:** 2.1 (decisões P-01/P-02 resolvidas)
> **Data:** 07/05/2026
> **Status:** ✅ Pronto para implementação
> **Estimativa:** 9-12 dias
> **PRD pai:** [IMPLEMENTACOES-FUTURAS.md](../IMPLEMENTACOES-FUTURAS.md)
> **Revisão de origem:** PRD-FASE-1-DIPLOMACIA-HOTKEYS-REVIEW.md

---

## 🎯 Visão da Fase

Transformar Reinos Medievais de um jogo de guerra pura para um jogo de estratégia completa com diplomacia funcional, atalhos de teclado, refinamentos de combate e polimento audiovisual. Esta fase entrega o maior retorno sobre investimento: com ~10 dias de trabalho, o jogo ganha uma nova dimensão de profundidade estratégica.

---

## 📦 Entregáveis

| # | Funcionalidade | Dias | Prioridade | Ordem | Arquivos |
|---|---|---|---|---|---|
| 1 | Hotkeys | 1.0-1.5 | 🔴 Crítica | 1º | `App.tsx`, `useUI.ts` |
| 2 | Diplomacia | 3.5 | 🔴 Crítica | 2º | `diplomacyLogic.ts`, `DiplomacyModal.tsx`, `DiplomacyResultModal.tsx`, `types.ts` |
| 3 | Army Retreat | 1.0 | 🟡 Alta | 3º | `combatLogic.ts`, `turnLogic.ts` |
| 4 | Ações em Massa | 1.0 | 🟡 Alta | 4º | `economyLogic.ts`, `HUD.tsx` |
| 5 | Múltipla Seleção | 1.5 | 🟡 Alta | 5º | `Map.tsx`, `useGameController.ts` |
| 6 | Efeitos Sonoros (tone.js) | 1.0-1.5 | 🟢 Média | 6º | `sfxLogic.ts` |
| 7 | Minimapa | 1.0 | 🟢 Média | 7º | `Minimap.tsx`, `Map.tsx` |
| 8 | Partículas | 1.0 | 🟢 Média | 8º | `Map.tsx`, `index.css` |

**Ordem de implementação:** 1) Hotkeys → 2) Diplomacia → 3) Army Retreat → 4) Ações em Massa → 5) Múltipla Seleção → 6) SFX → 7) Minimapa → 8) Partículas. Hotkeys são fundação que as outras features usarão; Diplomacia é a feature âncora da fase.

---

## ⚠️ Regras de Arquitetura (Obrigatório)

> **ATENÇÃO — Leia antes de implementar qualquer seção.**

Toda função em `src/logic/` que modifica o estado do jogo DEVE seguir o padrão de imutabilidade do projeto (MAESTRO.md Regra #1):

1. **Deep clone obrigatório**: `JSON.parse(JSON.stringify(prev)) as GameState` para qualquer handler que toque objetos aninhados. `{ ...prev }` é shallow — objetos internos (`realms`, `provinces`, `army`) manterão referências compartilhadas.
2. **Funções puras em `src/logic/`**: Devem retornar novo estado ou dados de modificação. NUNCA mutar parâmetros de entrada.
3. **Toast após setState com setTimeout**: `setGameState(next); setTimeout(() => showToast(...), 0);` — evita que o toast seja engolido pelo batching do React.
4. **Nunca chamar state setters dentro do updater de setGameState**: clone → modifique clone → setState(clone) → depois chame showToast/setUI fora do updater.

**Ver skill `medieval-realms-game` §Critical Pitfalls para detalhes completos.**

---

## 1. ⌨️ Hotkeys / Atalhos de Teclado

### Resumo
Adicionar atalhos de teclado globais para acelerar ações frequentes, seguindo o padrão do Age of History 2 DE (teclas A,S,D,F para recrutamento).

### Especificação

| Tecla | Ação | Condição |
|-------|------|----------|
| `Enter` | Encerrar turno | Sempre (com jogo ativo) |
| `Esc` | Cancelar ação atual | Com ação ativa (moving/attacking/scouting) |
| `1` | Modo Political | Com jogo ativo |
| `2` | Modo Economic | Com jogo ativo |
| `3` | Modo Military | Com jogo ativo |
| `4` | Modo Diplomatic | Com jogo ativo |
| `5` | Modo Resources | Com jogo ativo |
| `W` | Iniciar marcha (Move) | Com província aliada selecionada |
| `A` | Iniciar ataque (Attack) | Com província aliada selecionada |
| `Q` | Zoom out | Com jogo ativo |
| `E` | Zoom in | Com jogo ativo |
| `Space` | Centralizar na capital | Com jogo ativo |
| `S` | Salvar jogo (quick save) | Com jogo ativo (Ctrl+S não interceptado) |
| `F` | Alternar tela cheia | Sempre |

### Implementação

**Arquivo:** `src/App.tsx` — adicionar `useEffect` com listener `keydown`

```typescript
useEffect(() => {
  if (!gameState || ui.showMenu) return;

  const handleKeyDown = (e: KeyboardEvent) => {
    // Ignorar se foco está em input/textarea
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

    const modeKeys: Record<string, ViewMode> = {
      '1': 'political', '2': 'economic', '3': 'military',
      '4': 'diplomatic', '5': 'resources'
    };

    switch(e.key) {
      case 'Enter': ctrl.handleEndTurn(); break;
      case 'Escape': cancelCurrentAction(); break;
      case 'w': case 'W': if (ui.selectedProvinceId) handleMapAction('move'); break;
      case 'a': case 'A': if (ui.selectedProvinceId) handleMapAction('attack'); break;
      case 'q': case 'Q': ui.setZoom(Math.max(0.5, ui.zoom - 0.2)); break;
      case 'e': case 'E': ui.setZoom(Math.min(3, ui.zoom + 0.2)); break;
      case ' ': focusCapital(); e.preventDefault(); break;
      case 's': case 'S': if (!e.ctrlKey) { ctrl.handleSave('quicksave'); e.preventDefault(); } break;
      case 'f': case 'F': toggleFullScreen(); break;
    }

    if (modeKeys[e.key]) {
      ui.setViewMode(modeKeys[e.key]);
    }
  };

  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [gameState, ui, ctrl]);
```

**UX adicional:** Tooltips nos botões do HUD devem mostrar a hotkey (ex: "Marchar [W]").

### Testes
- [ ] Enter encerra turno e mostra TurnSummary
- [ ] Esc cancela ação de marcha/ataque/scout ativa
- [ ] 1-5 alternam modos de visão corretamente
- [ ] W/A iniciam marcha/ataque a partir da província selecionada
- [ ] Q/E ajustam zoom com animação
- [ ] Space centraliza na capital do jogador
- [ ] Hotkeys NÃO funcionam quando foco está em input
- [ ] Hotkeys NÃO funcionam no menu principal

### Testes de Edge Case
- [ ] Duas hotkeys pressionadas simultaneamente → apenas a primeira processa (sem double-fire)
- [ ] W pressionado sem província selecionada → nada acontece, sem erro
- [ ] Ctrl+S nativo do browser NÃO é interceptado (salva o jogo só com S sem Ctrl)
- [ ] Hotkeys funcionam com layout de teclado ABNT2 (teclado brasileiro)

---

## 2. 👑 Sistema de Diplomacia Completo

### Resumo
Implementar um sistema de diplomacia completo com múltiplas ações, cálculo de aceitação baseado em relações/poder/personalidade, memória de eventos históricos, e UI rica com texto narrativo.

### Estado dos Dados

**Campos existentes em `Realm`:**
```typescript
wars: string[]        // ✅ — IDs de reinos em guerra
pacts: string[]       // 🟡 — existe mas não usado
alliances: string[]   // 🟡 — existe mas sem UI
vassals: string[]     // ✅ — funcional
vassalOf?: string     // ✅ — funcional
relations: Record<string, number>  // 🟡 — existe mas sem ação para alterar
memory: Record<string, { betrayal, help, aggression, lastWarTurn, warExhaustion }> // 🟡 — existe campos mas não populados
```

**Novos campos a adicionar em `Realm` (`types.ts`):**
```typescript
nonAggressionPacts: string[]     // IDs de reinos com NAP
defensivePacts: string[]         // IDs de reinos com pacto defensivo
tributeFrom: Record<string, number>  // realmId → gold por turno recebido
tributeTo: Record<string, number>    // realmId → gold por turno pago
napExpiryTurn: Record<string, number>  // realmId → turno em que o NAP expira
```

**⚠️ CRÍTICO — Inicialização:** Todos os novos campos devem ser inicializados em `src/logic/mapGeneration.ts` na função `generateInitialState` para CADA reino gerado:
```typescript
// Em generateInitialState, para cada reino:
nonAggressionPacts: [],
defensivePacts: [],
tributeFrom: {},
tributeTo: {},
napExpiryTurn: {},
```
Sem esta inicialização, qualquer acesso (ex: `realm.nonAggressionPacts.includes(...)`) causará `TypeError: Cannot read properties of undefined`.

### Tipos

**`DiplomacyAction`** (adicionar em `types.ts`):
```typescript
export type DiplomacyAction =
  | 'alliance'
  | 'nonAggressionPact'
  | 'defensivePact'
  | 'improveRelations'
  | 'sendInsult'
  | 'offerTribute'
  | 'demandTribute'
  | 'declareWar';
```

### Constantes de Custo de AP

**Adicionar em `src/logic/game-constants.ts`:**
```typescript
export const DIPLOMACY_ACTION_COSTS: Record<DiplomacyAction, number> = {
  improveRelations: 1,
  sendInsult: 1,
  proposeNAP: 1,
  proposeDefensivePact: 1,
  proposeAlliance: 2,
  offerTribute: 1,
  demandTribute: 1,
  declareWar: 2,
};
```

### Ações Diplomáticas

#### 2.1 — Aliança (Alliance)
- **AP:** 2 (DIPLOMACY_ACTION_COSTS.proposeAlliance)
- **Pré-requisitos:** relações >= 50, NÃO estar em guerra com o alvo, NÃO ser já aliado
- **Efeito:** Adiciona aliança bilateral. Se um for atacado, o outro pode escolher entrar na guerra (defensive call to arms — ver §Call to Arms). Não pode declarar guerra contra aliado.
- **Quebra:** Custa -80 relações com todos os reinos, +30 betrayal na memória
- **Flavor text aceito:** `DIPLOMACY_FLAVOR_TEXTS.alliance.accepted` → "Os exércitos de {realm} e {player} agora marcham como um só. Que esta aliança ecoe através das eras!"
- **Flavor text rejeitado:** `DIPLOMACY_FLAVOR_TEXTS.alliance.rejected` → "{realm} declina educadamente. 'Nossos caminhos ainda não se cruzam, nobre senhor.'"

#### 2.2 — Pacto de Não-Agressão (NAP)
- **AP:** 1 (DIPLOMACY_ACTION_COSTS.proposeNAP)
- **Pré-requisitos:** relações >= 20, NÃO estar em guerra com o alvo, NÃO ter NAP já ativo
- **Efeito:** Não pode declarar guerra por 20 turnos. Quebra automática se um atacar o outro.
- **Quebra:** -60 relações globais, +25 betrayal
- **Duração:** 20 turnos, renovável. Timer armazenado em `napExpiryTurn[realmId] = turnoAtual + 20`.
- **Expiração:** Ao expirar, NAP é removido automaticamente em `processEndOfTurn` (sem penalidade).

#### 2.3 — Pacto Defensivo
- **AP:** 1 (DIPLOMACY_ACTION_COSTS.proposeDefensivePact)
- **Pré-requisitos:** NAP ativo + relações >= 40
- **Efeito:** Se o aliado for atacado, você pode escolher entrar na guerra do lado dele (ver §Call to Arms).
- **Quebra:** Não atender call to arms = -50 relações, +20 betrayal, pacto defensivo removido.
- **Atender call to arms:** +20 help na memória do aliado defendido, +15 relações com o defensor.

#### 2.4 — Melhorar Relações
- **AP:** 1 (DIPLOMACY_ACTION_COSTS.improveRelations)
- **Aceitação:** Sempre aceito (não requer cálculo de acceptance — ação unilateral)
- **Efeito:** +15 a +25 relações (varia com personalidade do alvo: `baseValue + personalityModifier`)
- **Cap:** Não excede 100. Se já em 100, toast informativo: "Relações com {realm} já estão no máximo."
- **Flavor text:** `DIPLOMACY_FLAVOR_TEXTS.improveRelations` → "Mensageiros partem carregando sedas finas e palavras de amizade para {realm}."

#### 2.5 — Enviar Insulto
- **AP:** 1 (DIPLOMACY_ACTION_COSTS.sendInsult)
- **Aceitação:** Sempre aceito (ação unilateral — o alvo não pode "recusar" um insulto)
- **Efeito:** -15 a -25 relações
- **Floor:** Não reduz abaixo de -100
- **Flavor text:** `DIPLOMACY_FLAVOR_TEXTS.sendInsult` → "O arauto real declara publicamente que o soberano de {realm} tem a graça de um javali embriagado."

#### 2.6 — Oferecer Tributo
- **AP:** 1 (DIPLOMACY_ACTION_COSTS.offerTribute)
- **Efeito:** Oferece X gold por turno. +10 relações ao oferecer, +2 por turno enquanto pagar.
- **Parar tributo:** Pode parar a qualquer momento, mas causa -20 relações com o receptor.
- **Aceitação:** >= 50% (cálculo de acceptance). Se rejeitado, relações não mudam e ação não tem efeito.

#### 2.7 — Exigir Tributo
- **AP:** 1 (DIPLOMACY_ACTION_COSTS.demandTribute)
- **Efeito:** Exige X gold por turno.
- **Aceitação:** >= 50%, com peso maior para diferença de poder militar (40% em vez de 20%).
- **Se recusar:** -10 relações.
- **Se aceitar:** Pagam o tributo, mas acumulam +15 betrayal e -1 relação por turno enquanto pagam.
- **Ultimato:** Se recusar, o jogador pode escalar para guerra (ação separada `declareWar`).

### Call to Arms (Defesa Opcional)

Quando um reino A declara guerra a um reino B, o sistema verifica aliados de B que podem ser chamados à guerra:

1. `checkDefensiveCallToArms(state, defenderId: B, aggressorId: A)` é disparado.
2. Para cada reino C que possui `alliance` ou `defensivePact` com B:
   - O jogador (se for C) recebe um modal de decisão: **"{B} está sob ataque de {A}! Deseja honrar sua aliança/pacto defensivo e entrar na guerra?"**
   - Opções: "Entrar na Guerra" ou "Recusar (quebra o pacto)".
   - Se **aceitar**: C declara guerra a A automaticamente. Log: "{C} honra sua aliança/pacto com {B} e entra na guerra contra {A}!" Relações com B sobem +15. Memória: +20 help.
   - Se **recusar**: Aliança/pacto defensivo é quebrado. Relações com B caem -50. Memória: +20 betrayal. Log: "{C} abandona {B} em sua hora de necessidade. A aliança está quebrada."
3. Se o jogador NÃO é C (é um reino IA), a IA decide automaticamente com base em:
   - Relações com B (peso 40%): se > 60, tende a aceitar.
   - Poder militar relativo (peso 35%): se A é muito mais forte, tende a recusar.
   - Personalidade (peso 25%): Honrado (sempre aceita), Oportunista (aceita se vantajoso), Covarde (sempre recusa).
4. Call to arms **NÃO é em cadeia**: apenas aliados diretos de B recebem a chamada. Aliados de C NÃO são notificados (C entrou ofensivamente ao declarar guerra a A, não foi atacado).
5. O defensor original B recebe logs de quais aliados atenderam e quais recusaram.

**Timing:** A decisão de call to arms acontece no mesmo momento em que a guerra é declarada (antes do próximo turno). O jogo pausa para resolver todas as chamadas antes de continuar.

### Cálculo de Aceitação

```typescript
function getDiplomacyAcceptance(
  playerRealm: Realm,
  targetRealm: Realm,
  action: DiplomacyAction,
  state: GameState
): { acceptance: number; reasons: string[] }
```

- `acceptance` é um número de 0 a 100 (percentual).
- `reasons` são strings explicativas para debug/UI (ex: "Relações altas (+32)", "Poder militar inferior (-15)").

**Ações que NÃO usam acceptance:** `improveRelations`, `sendInsult`, `declareWar` — são sempre executáveis (unilaterais). A função deve retornar `{ acceptance: 100, reasons: ['Ação unilateral — sempre aceita.'] }` para estas ações ou o caller deve pular o check.

**Fatores que influenciam (apenas para ações que requerem acceptance):**

| Fator | Peso | Descrição |
|-------|------|-----------|
| Relações atuais (mapeado 0-100) | 40% | Quanto maior a relação, maior a chance |
| Diferença de poder militar | 20% | `(playerPower - targetPower) / max(playerPower, targetPower)` mapeado para 0-100 |
| Personalidade do alvo | 15% | Pacificador (+bonus), Agressivo (-penalidade) |
| Memória de eventos (betrayal, help, aggression) | 15% | `betrayal` reduz, `help` aumenta |
| Inimigos em comum | 5% | +5 por cada inimigo em comum (max +15) |
| Distância geográfica | 5% | Quanto mais longe, menos relevante (+5 se vizinho, -5 se > 5 províncias) |

**Thresholds de aceitação:**

| Ação | Threshold | Notas |
|------|:---:|-------|
| Alliance | >= 70% | |
| Non-Aggression Pact | >= 60% | |
| Defensive Pact | >= 75% | Requer NAP ativo como pré-requisito adicional |
| Offer Tribute | >= 50% | |
| Demand Tribute | >= 50% | Peso de poder militar dobra para 40% (personalidade cai para 5%) |
| Vassalage | >= 85% | Fora do escopo desta fase — referência futura |
| Improve Relations | N/A | Sempre aceito (unilateral) |
| Send Insult | N/A | Sempre aceito (unilateral) |
| Declare War | N/A | Sempre aceito (unilateral — declaração não requer consentimento) |

### Memória de Eventos — Regras de População

Os campos de `Realm.memory[realmId]` devem ser populados nos seguintes eventos:

| Evento | Campo | Delta | Quando |
|--------|-------|-------|--------|
| Quebrar aliança | betrayal | +30 | Ao remover aliança unilateralmente |
| Quebrar NAP | betrayal | +25 | Ao atacar reino com NAP ativo |
| Quebrar pacto defensivo | betrayal | +20 | Ao recusar call to arms |
| Declarar guerra | aggression | +15 | Ao declarar guerra (para o alvo e aliados do alvo) |
| Atender call to arms | help | +20 | Ao aceitar entrar na guerra para defender aliado |
| Enviar tributo voluntário | help | +5 | A cada turno que tributo é pago (acumulativo) |
| Guerra termina (qualquer lado) | lastWarTurn | turno atual | No `processEndOfTurn` em que a guerra é removida |
| Guerra termina (qualquer lado) | warExhaustion | reset para 0 | Junto com `lastWarTurn` |

**Valor inicial de memory para cada relação entre reinos:**
```typescript
{ betrayal: 0, help: 0, aggression: 0, lastWarTurn: 0, warExhaustion: 0 }
```
Inicializado em `mapGeneration.ts` para cada par de reinos.

### UI — DiplomacyModal (Interativo) + DiplomacyResultModal (Resultado)

**Estratégia de componentes:**

O arquivo `DiplomacyModal.tsx` atual (74 linhas) é um **modal de resultado passivo** (mostra outcome de ação diplomática concluída). Deve ser:

1. **Renomeado** para `DiplomacyResultModal.tsx` (preserva a funcionalidade existente).
2. **Atualizar referências** em `useGameController.ts` e onde mais for importado.
3. **Criar NOVO** `DiplomacyModal.tsx` com a UI interativa completa descrita abaixo.

O novo `DiplomacyModal` deve receber props:
```typescript
interface DiplomacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRealmId: string;
  gameState: GameState;
  playerRealmId: string;
  onAction: (action: DiplomacyAction, payload?: { amount?: number }) => void;
}
```

**Layout do novo DiplomacyModal:**
```
┌──────────────────────────────────┐
│ 👑 Diplomacia                [X] │
├──────────────────────────────────┤
│ Reino de Avalon ❤️ 72            │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░            │
│ Poder: ⚔️🔥🔥 │ Personalidade: 🦅 │
│                                  │
│ Ações Disponíveis:               │
│ ┌──────────────────────────────┐ │
│ │ 🤝 Melhorar Relações  [1 AP] │ │
│ │ 💢 Enviar Insulto     [1 AP] │ │
│ │ 🛡️ Pacto Não-Agressão [1 AP] │ │ ← desabilitado se NAP ativo ou em guerra
│ │ ⚔️ Pacto Defensivo    [1 AP] │ │ ← desabilitado se sem NAP ou relações < 40
│ │ 👑 Aliança            [2 AP] │ │ ← desabilitado se relações < 50 ou já aliado
│ │ 💰 Oferecer Tributo   [1 AP] │ │
│ │ 📜 Exigir Tributo     [1 AP] │ │
│ │ 🔥 Declarar Guerra    [2 AP] │ │ ← desabilitado se já em guerra
│ └──────────────────────────────┘ │
│                                  │
│ Histórico:                       │
│ • Turno 5: Avalon ajudou na     │
│   guerra contra Thorne (+15)    │
│ • Turno 12: Avalon quebrou      │
│   pacto comercial (-8)          │
└──────────────────────────────────┘
```

**Regras de UI:**
- Botões desabilitados devem mostrar tooltip com o motivo (ex: "Relações insuficientes (precisa 50, tem 42)").
- Usar funções `canPropose*` (ver §Funções de Validação) para controlar disable.
- Feedback de ações usar `ui.showToast(message, 'success' | 'error')` — seguindo o padrão do projeto com `setTimeout(..., 0)` após `setGameState` (ver §Regras de Arquitetura).
- AP disponível deve ser visível no modal e descontado visualmente ao selecionar ação.

### Funções de Validação

**Adicionar em `src/logic/diplomacyLogic.ts`:**
```typescript
export function canProposeAlliance(state: GameState, fromId: string, toId: string): { valid: boolean; reason?: string }
export function canProposeNAP(state: GameState, fromId: string, toId: string): { valid: boolean; reason?: string }
export function canProposeDefensivePact(state: GameState, fromId: string, toId: string): { valid: boolean; reason?: string }
export function canImproveRelations(state: GameState, fromId: string, toId: string): { valid: boolean; reason?: string }
export function canSendInsult(state: GameState, fromId: string, toId: string): { valid: boolean; reason?: string }
export function canOfferTribute(state: GameState, fromId: string, toId: string, amount: number): { valid: boolean; reason?: string }
export function canDemandTribute(state: GameState, fromId: string, toId: string, amount: number): { valid: boolean; reason?: string }
export function canDeclareWar(state: GameState, fromId: string, toId: string): { valid: boolean; reason?: string }
```

Estas funções são usadas pela UI para desabilitar botões e mostrar tooltips de requisitos. NÃO devem modificar o estado — são funções de consulta puras.

### Constantes de Flavor Text

**Adicionar em `src/logic/diplomacyLogic.ts` (ou `game-constants.ts`):**
```typescript
export const DIPLOMACY_FLAVOR_TEXTS: Record<DiplomacyAction, { accepted: string; rejected: string }> = {
  alliance: {
    accepted: "Os exércitos de {to} e {from} agora marcham como um só. Que esta aliança ecoe através das eras!",
    rejected: "{to} declina educadamente. 'Nossos caminhos ainda não se cruzam, nobre senhor.'",
  },
  nonAggressionPact: {
    accepted: "Um pacto de não-agressão é firmado entre {from} e {to}. Que a paz reine por 20 turnos.",
    rejected: "{to} recusa o pacto. 'Não confiamos em suas intenções.'",
  },
  // ... demais ações
};
```

Fallback: se uma ação não tiver flavor text mapeado, usar string genérica: `"A proposta diplomática foi {accepted|rejected}."`.

### Fluxo de Implementação

0. **`src/logic/mapGeneration.ts`**: Inicializar `nonAggressionPacts: []`, `defensivePacts: []`, `tributeFrom: {}`, `tributeTo: {}`, `napExpiryTurn: {}` em `generateInitialState` para cada reino. Inicializar `memory` com zeros para cada par de reinos.
1. **`types.ts`**: Adicionar `nonAggressionPacts`, `defensivePacts`, `tributeFrom`, `tributeTo`, `napExpiryTurn` ao `Realm`. Adicionar type `DiplomacyAction`.
2. **`src/logic/game-constants.ts`**: Adicionar `DIPLOMACY_ACTION_COSTS`.
3. **`src/logic/diplomacyLogic.ts`**: Funções puras exportadas:
   - `canProposeAlliance(state, fromId, toId)`, `canProposeNAP(...)`, etc. (validação — 8 funções)
   - `proposeAlliance(state, fromId, toId): GameState` (retorna NOVO estado)
   - `proposeNonAggressionPact(state, fromId, toId): GameState`
   - `proposeDefensivePact(state, fromId, toId): GameState`
   - `improveRelations(state, fromId, toId): { newRelations: number; delta: number }` (dados de modificação)
   - `sendInsult(state, fromId, toId): { newRelations: number; delta: number }`
   - `offerTribute(state, fromId, toId, amount): GameState`
   - `demandTribute(state, fromId, toId, amount): { accepted: boolean; newState: GameState }`
   - `getDiplomacyAcceptance(state, fromId, toId, action): { acceptance: number; reasons: string[] }`
   - `getDiplomacyFlavorText(action, fromName, toName, accepted): string`
   - `checkDefensiveCallToArms(state, defenderId, aggressorId): { callsToResolve: CallToArmsRequest[] }` — chamado quando guerra é declarada, retorna lista de chamadas pendentes
   - `resolveCallToArms(state, requestId, accepted: boolean): GameState` — processa a decisão (aceitar ou recusar)
4. **Renomear** `DiplomacyModal.tsx` → `DiplomacyResultModal.tsx`. Atualizar imports.
5. **Criar NOVO** `DiplomacyModal.tsx` com UI interativa completa.
6. **`useGameController.ts`**: Adicionar handlers: `handleDiplomacyAction()`, `handleDeclareWar()`, `handleCallToArmsResponse()`. Handlers devem fazer deep clone do gameState ANTES de chamar funções de `diplomacyLogic.ts`.
7. **`useUI.ts`**: Adicionar estados: `showDiplomacyModal`, `selectedDiplomacyTargetId`, `showCallToArmsModal`, `pendingCallToArms`.
8. **`HUD.tsx`**: Botão "Diplomacia" no painel.
9. **`turnLogic.ts` — `processEndOfTurn`**: Processar na seguinte ordem:
   1. Processar renda (income de províncias)
   2. Processar tributos (deduzir de `tributeTo`, adicionar em `tributeFrom`)
   3. **Se gold insuficiente para pagar tributo**: relação cai -10 com o receptor, tributo é cancelado, toast "Tributo a {realm} cancelado por falta de fundos."
   4. Processar manutenção de tropas
   5. Decrementar timers de NAP: para cada `napExpiryTurn[realmId] <= turnoAtual`, remover o reino de `nonAggressionPacts`, remover entrada em `napExpiryTurn`

### Testes
- [ ] Aliança impede declarar guerra contra aliado
- [ ] Pacto defensivo: atacar aliado = call to arms opcional (modal de decisão aparece)
- [ ] Melhorar relações: valor sobe entre +15 e +25, cap em 100
- [ ] Insulto: valor cai entre -15 e -25, floor em -100
- [ ] Tributo: gold transferido a cada turno; parar = -20 relações
- [ ] Aceitação considera todos os fatores (poder, personalidade, memória)
- [ ] Flavor text muda dependendo do resultado (aceito/rejeitado)
- [ ] Memória de eventos persiste entre turnos e é populada nos eventos corretos
- [ ] NAP expira após 20 turnos e é removido automaticamente
- [ ] NAP timer é inicializado corretamente (`napExpiryTurn[realmId] = turnoAtual + 20`)
- [ ] Botões do DiplomacyModal desabilitam com tooltip quando pré-requisitos não atendidos

### Testes de Edge Case
- [ ] Propor aliança com reino já aliado → toast "Já são aliados", ação bloqueada
- [ ] Propor NAP com reino em guerra → ação bloqueada, tooltip "Não é possível firmar pacto durante guerra"
- [ ] Melhorar relações com relações já em 100 → sem efeito, toast informativo
- [ ] Enviar insulto com relações em -100 → sem efeito, toast informativo
- [ ] Tentar ação diplomática com AP insuficiente → toast "Action Points insuficientes"
- [ ] Oferecer tributo com gold insuficiente para o primeiro pagamento → ação bloqueada
- [ ] Exigir tributo de reino muito mais poderoso → acceptance muito baixo, provável rejeição
- [ ] Pagar tributo com gold negativo (após manutenção alta) → tributo cancelado, -10 relações
- [ ] Recusar call to arms → aliança/pacto quebrado, -50 relações, +20 betrayal
- [ ] Aceitar call to arms → +20 help na memória do defensor, +15 relações, guerra declarada automaticamente
- [ ] IA aliada recebe call to arms → decide com base em relações/poder/personalidade

---

## 3. 🏃 Army Retreat (Recuo de Exército)

### Resumo
Quando um exército é derrotado em batalha, uma porcentagem das tropas sobreviventes recua para uma província vizinha amigável, em vez de desaparecer completamente.

### Especificação

**Regras:**
- 30% das tropas sobreviventes (pós-batalha) recuam
- Destino: província vizinha com mesmo ownerId (amigável)
- Se múltiplas províncias vizinhas amigáveis → escolhe a com maior troops (mais segura)
- Se NENHUMA província vizinha amigável → tropas são perdidas (sem recuo)
- Recuo NÃO conta como ação (acontece automaticamente)
- Tropas recuadas mantêm sua composição proporcional
- **Mínimo de 1 unidade por tipo**: se um tipo de tropa tem tropas > 0 no exército sobrevivente, pelo menos 1 unidade daquele tipo recua (evita zerar tipos de unidade)

### Implementação

**Arquivo:** `src/logic/combatLogic.ts` — adicionar funções puras de recuo

```typescript
/**
 * Encontra a melhor província vizinha amigável para recuo.
 * Retorna o ID da província ou null se nenhuma disponível.
 * Função pura — não modifica o estado.
 */
export function getRetreatDestination(
  state: GameState,
  defeatedProvinceId: string,
  realmId: string
): string | null {
  const prov = state.provinces[defeatedProvinceId];
  if (!prov) return null;

  const friendlyNeighbors = prov.neighbors
    .map(id => state.provinces[id])
    .filter(p => p && p.ownerId === realmId)
    .sort((a, b) => b.troops - a.troops); // mais segura primeiro

  return friendlyNeighbors.length > 0 ? friendlyNeighbors[0].id : null;
}

/**
 * Calcula as tropas que recuam e retorna os dados para o caller aplicar.
 * NÃO modifica destinationProv — retorna os deltas para aplicação imutável.
 * Garante mínimo de 1 unidade por tipo não-zero no exército sobrevivente.
 */
export function calculateRetreat(
  remainingArmy: Army,
  retreatRatio: number = 0.3
): Army {
  const retreating: Army = {
    infantry: remainingArmy.infantry > 0
      ? Math.max(1, Math.floor(remainingArmy.infantry * retreatRatio))
      : 0,
    archers: remainingArmy.archers > 0
      ? Math.max(1, Math.floor(remainingArmy.archers * retreatRatio))
      : 0,
    cavalry: remainingArmy.cavalry > 0
      ? Math.max(1, Math.floor(remainingArmy.cavalry * retreatRatio))
      : 0,
    scouts: (remainingArmy.scouts || 0) > 0
      ? Math.max(1, Math.floor((remainingArmy.scouts || 0) * retreatRatio))
      : 0,
  };
  return retreating;
}
```

**Aplicação no caller (deep clone obrigatório):**

```typescript
// Em turnLogic.ts — finishAttack (DENTRO de processMarchOrders, que já clonou o estado)
const finishAttack = (order, prov) => {
  // ... existing combat resolution (resolveCombat já é puro) ...

  if (!result.won) {
    // Attacker lost — try retreat
    const retreatDest = getRetreatDestination(state, prov.id, order.realmId);
    if (retreatDest) {
      const retreating = calculateRetreat(result.attackerRemaining);
      // Aplicar ao estado clonado (já é deep clone, então mutação aqui é segura)
      const dest = state.provinces[retreatDest];
      dest.army.infantry += retreating.infantry;
      dest.army.archers += retreating.archers;
      dest.army.cavalry += retreating.cavalry;
      dest.army.scouts = (dest.army.scouts || 0) + retreating.scouts;
      dest.troops = dest.army.infantry + dest.army.archers + dest.army.cavalry + dest.army.scouts;

      if (order.realmId === state.playerRealmId) {
        const totalRetreated = retreating.infantry + retreating.archers + retreating.cavalry + retreating.scouts;
        state.logs.push(`DERROTA! ${totalRetreated} tropas recuaram para ${dest.name}.`);
      }
    }
  } else {
    // Defender lost — try retreat for defender
    const retreatDest = getRetreatDestination(state, prov.id, prov.ownerId);
    if (retreatDest) {
      const retreating = calculateRetreat(result.defenderRemaining);
      const dest = state.provinces[retreatDest];
      dest.army.infantry += retreating.infantry;
      dest.army.archers += retreating.archers;
      dest.army.cavalry += retreating.cavalry;
      dest.army.scouts = (dest.army.scouts || 0) + retreating.scouts;
      dest.troops = dest.army.infantry + dest.army.archers + dest.army.cavalry + dest.army.scouts;
    }
  }
  // ... rest of existing logic ...
};
```

**`BattleOutcomeModal.tsx`**: Mostrar detalhes do recuo (quantas tropas, para onde, composição).

### Testes
- [ ] Atacante derrotado: 30% das tropas restantes recuam para província amigável vizinha
- [ ] Defensor derrotado: 30% das tropas restantes recuam para província amigável vizinha
- [ ] Sem província amigável vizinha: tropas são perdidas
- [ ] Múltiplas províncias vizinhas: recua para a mais segura (mais tropas)
- [ ] Recuo não gasta action points
- [ ] Modal de resultado mostra detalhes do recuo

### Testes de Edge Case
- [ ] Exército com 3 archers derrotado → pelo menos 1 archer recua (não zera o tipo)
- [ ] Exército com 1 cavalry derrotado → 1 cavalry recua
- [ ] Província de destino já cheia (muitas tropas) → recuo funciona normalmente (sem cap)
- [ ] `defeatedProvinceId` não existe no estado → `getRetreatDestination` retorna null, sem crash
- [ ] `resolveCombat` retorna `attackerRemaining`/`defenderRemaining` com total 0 → `calculateRetreat` retorna Army com todos os campos 0

---

## 4. 🏗️ Ações em Massa nas Províncias

### Resumo
Permitir que o jogador execute ações em TODAS as províncias simultaneamente, essencial para gerenciar impérios grandes sem micro-gerenciamento tedioso.

### Ações

| Ação | Custo por Província | Efeito |
|------|---------------------|--------|
| Assimilar Todas | 50 gold | +5 loyalty em todas as províncias |
| Investir em Todas | 100 gold | +10 wealth em todas as províncias |
| Construir Farms | 100 gold + 50 materials | +1 farm em províncias elegíveis |
| Construir Mines | 150 gold + 75 materials | +1 mine em províncias elegíveis |
| Construir Workshops | 200 gold + 100 materials | +1 workshop em províncias elegíveis |
| Construir Courts | 300 gold + 150 materials | +1 court em províncias elegíveis |

**Regras:**
- Só age em províncias do jogador
- Custo total = soma de custos de cada província
- Se recursos insuficientes → age no máximo de províncias possível (da capital para fora, priorizando as mais próximas)
- Mostrar estimativa de custo ANTES de confirmar
- Confirmação: modal "Esta ação custará X gold e Y materials. Afetará N províncias. Continuar?"
- Feedback via `ui.showToast(message, 'success')` após execução

### Implementação

**Arquivo:** `src/logic/economyLogic.ts`

> ⚠️ **IMPORTANTE:** O exemplo abaixo segue o padrão de imutabilidade. O caller (`useGameController`) deve fazer deep clone do estado ANTES de chamar estas funções.

```typescript
/**
 * Executa assimilação em massa nas províncias do reino.
 * Modifica o estado clonado passado como argumento.
 * Retorna sumário da operação.
 */
export function massAssimilate(state: GameState, realmId: string): { count: number; cost: number } {
  const realm = state.realms[realmId];
  if (!realm) return { count: 0, cost: 0 };

  const provinces = Object.values(state.provinces)
    .filter(p => p.ownerId === realmId)
    .sort((a, b) => {
      // Ordenar por distância da capital (mais próximas primeiro)
      const distA = a.id === realm.capitalId ? 0 : 999;
      const distB = b.id === realm.capitalId ? 0 : 999;
      return distA - distB;
    });

  let count = 0;
  for (const p of provinces) {
    if (realm.gold < 50) break;
    realm.gold -= 50;
    p.loyalty = Math.min(100, p.loyalty + 5);
    count++;
  }

  return { count, cost: count * 50 };
}

// Padrão similar para massInvest, massBuildFarms, etc.
```

**`HUD.tsx`**: Adicionar botão "⚡ Ações em Massa" que abre submenu com as opções.

**Estimativa de custo pré-confirmação:**
Antes de executar, calcular custo percorrendo as províncias sem modificar o estado:
```typescript
export function estimateMassActionCost(state: GameState, realmId: string, costPerProvince: number): { totalCost: number; affectedCount: number } {
  const realm = state.realms[realmId];
  if (!realm) return { totalCost: 0, affectedCount: 0 };
  const count = Object.values(state.provinces).filter(p => p.ownerId === realmId).length;
  return { totalCost: count * costPerProvince, affectedCount: count };
}
```

### Testes
- [ ] Assimilar todas: +5 loyalty em cada província, gold deduzido
- [ ] Construir farms: +1 farm onde possível, custo total correto
- [ ] Recursos insuficientes: age nas províncias mais próximas da capital primeiro
- [ ] Modal de confirmação mostra custo estimado corretamente
- [ ] Províncias neutras/inimigas não são afetadas
- [ ] Não crasha com 0 gold (simplesmente não faz nada)

### Testes de Edge Case
- [ ] Jogador com 0 províncias → botão de ação em massa desabilitado ou toast "Nenhuma província para agir"
- [ ] Construir farms sem resources necessários (ex: sem wood) → província sem resource é pulada
- [ ] Loyalty já em 100 → não excede 100, mas ainda consome gold (comportamento esperado — toast informa)

---

## 5. 🖱️ Múltipla Seleção de Exércitos

### Resumo
Permitir selecionar múltiplas províncias de uma vez (via Shift+Click ou arrasto) e mover todos os exércitos simultaneamente para um destino.

### Especificação

**Modos de seleção:**
1. **Shift+Click**: Adiciona/remove província da seleção múltipla
2. **Arrasto com botão direito**: Seleciona todas as províncias do jogador na área do retângulo de arrasto

**Quando múltiplas províncias estão selecionadas:**
- Clicar em destino → cria march orders para TODAS as províncias selecionadas
- Cada uma envia suas próprias tropas (composição padrão: todas as tropas disponíveis)
- Preview path mostra caminhos de todas as selecionadas (cores diferentes ou tracejado)
- Ação consome 1 AP por província de origem

**AP insuficiente:**
- Se o jogador tem N províncias selecionadas mas apenas M AP (M < N), marcha apenas as M províncias mais próximas do destino (menor `remainingPath.length`).
- Exibe toast: `"AP insuficiente para todas as seleções. Marchando de M/N províncias."`
- Províncias não marchadas permanecem selecionadas (para o jogador agir no próximo turno).

**UI:**
- Províncias selecionadas: borda dourada pulsante
- Contador: "3 províncias selecionadas" no banner de ação

### Implementação

**Arquivo:** `src/hooks/useUI.ts`
```typescript
multiSelectedProvinceIds: string[]  // nova propriedade
```

**Arquivo:** `src/components/Map.tsx`
- Handler de Shift+Click
- Handler de arrasto (mousedown → mousemove → mouseup) — detectar botão direito
- Highlight das províncias multi-selecionadas

### Testes
- [ ] Shift+Click adiciona/remove província da seleção múltipla
- [ ] Arrasto seleciona todas as províncias do jogador na área
- [ ] Clicar em destino cria march orders para todas as selecionadas
- [ ] Cada origem gasta 1 AP
- [ ] Preview mostra caminhos de todas as origens
- [ ] Clicar em província sem shift limpa a seleção múltipla

### Testes de Edge Case
- [ ] AP insuficiente: marcha M mais próximas, toast informativo
- [ ] Selecionar província sem tropas → enviará 0 tropas (march order sem efeito ou bloqueada)
- [ ] Destino inalcançável para algumas origens → essas origens são ignoradas, toast lista quais falharam
- [ ] Selecionar província inimiga com Shift+Click → ignorado (só províncias do jogador entram na seleção)
- [ ] Arrasto que cobre províncias de múltiplos donos → só as do jogador são selecionadas

---

## 6. 🔊 Efeitos Sonoros (SFX)

### Resumo
Adicionar efeitos sonoros para ações do jogo usando a biblioteca **tone.js** — síntese de áudio procedural com API de alto nível. Abordagem escolhida: tone.js oferece o equilíbrio ideal entre qualidade sonora, facilidade de implementação e controle sobre os parâmetros de cada som.

### Eventos e Sons

| Evento | Som | Trigger |
|--------|-----|---------|
| Batalha | Clash metálico | `resolveCombat` chamado |
| Vitória | Fanfarra curta | `BattleOutcomeModal` com `won=true` |
| Derrota | Som grave | `BattleOutcomeModal` com `won=false` |
| Recrutamento | Martelo/forja | `executeRecruitment` sucesso |
| Construção | Pedra/madeira | `executeBuilding` sucesso |
| Fim de Turno | Badalo de relógio | `handleEndTurn` |
| Conquista de Província | Trombeta | `finishAttack` com `result.won` |
| Nova Guerra | Tambor | `declareWar` |
| Notificação | Sino suave | Toast |

### Implementação

**Dependência:**
```bash
npm install tone
```

**Arquivo:** `src/logic/sfxLogic.ts`

```typescript
import * as Tone from 'tone';

// Inicializa o AudioContext no primeiro clique do usuário
// (resolve política de autoplay do Chrome)
export async function initAudio(): Promise<void> {
  await Tone.start();
}

// Cada som usa synths built-in do tone.js com parâmetros ajustados
// Exemplo: som de batalha com MetalSynth
export function playBattleSound(): void {
  const metal = new Tone.MetalSynth({
    frequency: 200,
    harmonicity: 5,
    modulationIndex: 32,
    resonance: 4000,
    octaves: 1.5
  }).toDestination();
  metal.triggerAttackRelease('16n');
}

export function playVictoryFanfare(): void {
  const synth = new Tone.Synth({ oscillator: { type: 'triangle' } }).toDestination();
  synth.triggerAttackRelease('C5', '8n');
  synth.triggerAttackRelease('E5', '8n', Tone.now() + 0.15);
  synth.triggerAttackRelease('G5', '4n', Tone.now() + 0.3);
}

export function playDefeatSound(): void { /* ... */ }
export function playRecruitSound(): void { /* ... */ }
export function playBuildSound(): void { /* ... */ }
export function playEndTurnSound(): void { /* ... */ }
```

**Inicialização no App.tsx:**
```typescript
// No primeiro clique do usuário no jogo (ex: no menu principal ou mapa):
useEffect(() => {
  const handleFirstInteraction = () => {
    initAudio();
    window.removeEventListener('click', handleFirstInteraction);
  };
  window.addEventListener('click', handleFirstInteraction);
  return () => window.removeEventListener('click', handleFirstInteraction);
}, []);
```

**Toggle:** Botão 🔈/🔊 no HUD. Preferência salva em localStorage (`sfx_enabled`).

### Testes
- [ ] Cada ação tem seu som distinto
- [ ] Toggle liga/desliga todos os sons
- [ ] Sons não tocam quando jogo está pausado/menu
- [ ] Sem crash se AudioContext não disponível (fallback silencioso)
- [ ] Preferência persiste após reload

### Testes de Edge Case
- [ ] Chrome com politica de autoplay: `AudioContext` criado mas em estado `suspended` → `audioCtx.resume()` ao primeiro clique do usuário
- [ ] Disparar 10 sons simultâneos → sem crash, sons fazem fila ou tocam sobrepostos
- [ ] Toggle durante som tocando → som atual termina, próximos são silenciados
- [ ] localStorage corrompido (ex: valor inválido) → fallback para `enabled=true`

---

## 7. 🗺️ Minimapa

### Resumo
Um minimapa no canto inferior esquerdo mostrando uma visão reduzida do mapa com indicação da viewport atual.

### Especificação

**Posição:** Canto inferior esquerdo, 150x100px
**Z-index:** `z-20` (botões de zoom e HUD ficam em `z-30`, garantindo que fiquem acima do minimapa).

**Conteúdo:**
- Todas as províncias coloridas por ownerId (versão minificada)
- Retângulo branco indicando a viewport atual
- Clicar no minimapa = mover viewport para aquela posição

**Tamanho:** Fixo proporcional ao tamanho do mapa
**Zoom:** O retângulo da viewport ajusta com o zoom

**Comportamento mobile:** Em telas < 768px, minimapa é 100x70px ou oculto com toggle (botão "🗺️" no HUD mobile).

**Comportamento touch:** Toque no minimapa move a viewport com animação. O pan no mapa principal tem prioridade sobre o minimapa — touch no minimapa só ativa se o toque começar E terminar dentro da área do minimapa (sem arrasto).

### Implementação

**Arquivo:** `src/components/Minimap.tsx`
- Renderiza versão minificada SVG do mapa
- Overlay do retângulo de viewport
- Handler de click/touch para navegação

```typescript
interface MinimapProps {
  gameState: GameState;
  panOffset: { x: number; y: number };
  zoom: number;
  viewportSize: { width: number; height: number };
  onNavigate: (x: number, y: number) => void;
}
```

### Testes
- [ ] Minimapa renderiza cores corretas por ownerId
- [ ] Retângulo de viewport move com pan
- [ ] Retângulo de viewport ajusta tamanho com zoom
- [ ] Clicar no minimapa move a viewport principal
- [ ] Minimapa some no menu (só aparece no jogo)
- [ ] Responsivo em mobile (100x70px ou toggle)

### Testes de Edge Case
- [ ] Toque no minimapa não conflita com pan do mapa principal (touch começa e termina na área do minimapa)
- [ ] Viewport muito pequena (zoom out máximo) → retângulo de viewport visível como ponto
- [ ] Mapa com muitas províncias (100+) → minimapa renderiza sem perda de performance

---

## 8. ✨ Efeitos de Partículas

### Resumo
Adicionar partículas visuais para eventos importantes: batalhas, conquistas e construções.

### Eventos

| Evento | Partículas | Cor | Duração |
|--------|-----------|-----|---------|
| Batalha | Faíscas/explosão | Laranja/Vermelho | 800ms |
| Conquista | Confete/subida | Dourado | 1200ms |
| Construção | Pó/pedras caindo | Cinza | 600ms |

### Implementação

**Arquivo:** `src/index.css` — animações CSS

```css
@keyframes particle-burst {
  0% { transform: scale(0) translate(0, 0); opacity: 1; }
  100% { transform: scale(1) translate(var(--tx), var(--ty)); opacity: 0; }
}

.particle {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  animation: particle-burst 0.8s ease-out forwards;
}
```

**`Map.tsx`**: Renderizar `<div>` absoluto sobre província afetada com N partículas, cada uma com `--tx` e `--ty` aleatórios.

**`types.ts`**: Estender `VisualEffect.type` para incluir partículas:

```typescript
export interface VisualEffect {
  type: 'battle' | 'conquest' | 'trade' | 'conquest_particles' | 'battle_particles' | 'build_particles';
  provinceId: string;
  particleCount?: number;  // novo campo opcional para controlar densidade
  // ... demais campos existentes
}
```

⚠️ **Importante:** Atualizar TODOS os `switch (effect.type)` existentes no código para tratar os novos casos (exaustividade do TypeScript). Adicionar `default:` com handler genérico como fallback.

### Testes
- [ ] Partículas aparecem na posição da província
- [ ] Cores diferentes para cada tipo de evento
- [ ] Partículas desaparecem após duração
- [ ] Performance: máximo 3 animações simultâneas (limitar via fila)
- [ ] Não crasha com múltiplos eventos no mesmo frame

### Testes de Edge Case
- [ ] 10 eventos de partículas disparados no mesmo frame → apenas 3 renderizam, resto entra em fila
- [ ] Partícula de conquista sobrepondo batalha → renderiza ambas sem conflito
- [ ] `particleCount` não definido → default 8 partículas
- [ ] `switch (effect.type)` cobre todos os novos tipos → compilação TypeScript limpa

---

## 🧪 Testes de Integração da Fase

- [ ] Hotkeys + Diplomacia + Army Retreat funcionam juntos sem conflitos
- [ ] Ações em massa não interferem com march orders ativas
- [ ] Múltipla seleção + hotkeys (W/A) funcionam em conjunto
- [ ] SFX + Partículas não causam lag
- [ ] Minimapa atualiza após conquistas/trocas de dono
- [ ] Todas as novas funcionalidades funcionam em mobile (touch events)
- [ ] `npm run lint` limpo
- [ ] `npm run build` sem erros
- [ ] Nenhuma mutação de estado fora do padrão (deep clone em todos os handlers)
- [ ] GameState permanece consistente após 50+ turnos com todas as novas mecânicas

---

## 📊 Critérios de Aceitação da Fase

- [ ] Jogador pode realizar TODAS as ações diplomáticas listadas (7 ações)
- [ ] Hotkeys documentadas cobrem todas as ações listadas (13 atalhos)
- [ ] Exército derrotado recua em vez de desaparecer (30% das tropas)
- [ ] Ações em massa funcionam para pelo menos 3 tipos (assimilar, investir, construir farms)
- [ ] Seleção múltipla funciona com Shift+Click e arrasto
- [ ] SFX audível para batalha, vitória, derrota e construção
- [ ] Minimapa funcional com navegação por clique, z-index correto, e toggle mobile
- [ ] Partículas visíveis em batalhas e conquistas
- [ ] Nenhum estado do jogo é mutado incorretamente (deep clone em todos os handlers)
- [ ] Novos campos do Realm são inicializados em `mapGeneration.ts` (sem crashes por `undefined`)
- [ ] GameState permanece consistente após 50+ turnos com todas as novas mecânicas

---

## ✅ Decisões Resolvidas

As duas pendências identificadas na versão 2.0 foram resolvidas:

### P-01 — Call to Arms: Opcional com penalidade ✅

**Decisão:** Opção B — o jogador pode escolher se entra ou não na guerra ao lado do aliado.

**Implementado em:**
- §2.1 (Aliança): "pode escolher entrar na guerra"
- §2.3 (Pacto Defensivo): penalidades de recusa definidas (-50 relações, +20 betrayal, pacto removido); bônus de aceitação (+15 relações, +20 help)
- §Call to Arms: reescrito como "Defesa Opcional" com modal de decisão, lógica de IA, e timing

### P-02 — SFX: tone.js ✅

**Decisão:** Usar tone.js como biblioteca de áudio procedural.

**Justificativa:** Melhor equilíbrio entre facilidade (~1-1.5 dias), qualidade sonora, e flexibilidade para ajustar parâmetros sem regravar samples. A estimativa de SFX foi ajustada de 1.5-2.0 para 1.0-1.5 dias.

---

*PRD-FASE-1 | Reinos Medievais | Versão 2.1 | 07/05/2026*
