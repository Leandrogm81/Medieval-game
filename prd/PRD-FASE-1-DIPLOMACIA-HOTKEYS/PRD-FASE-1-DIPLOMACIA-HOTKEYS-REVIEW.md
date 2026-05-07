# Revisão Crítica do PRD — Fase 1: Diplomacia, Hotkeys e Refinamentos de Combate

> **Documento auditado:** PRD-FASE-1-DIPLOMACIA-HOTKEYS.md v1.0
> **Data da auditoria:** 07/05/2026
> **Tipo:** Auditoria pré-implementação

---

## Resumo da avaliação

O PRD é ambicioso e bem estruturado, com visão clara e escopo definido. A decisão de priorizar Diplomacia e Hotkeys como críticas é acertada — são as features de maior retorno sobre investimento. No entanto, o documento tem **falhas graves de imutabilidade de estado** (violação da regra #1 do MAESTRO.md), **omissões de inicialização de dados** que causarão crashes, **assinaturas de função inconsistentes**, e **código de exemplo que ensina padrões errados**. Um agente coder que seguir os exemplos de código literalmente **introduzirá mutações de estado** — o bug mais temido no projeto.

**Veredito: Parcialmente pronto** — requer correções nos 7 achados críticos antes de virar plano de implementação.

---

## Achados críticos

---

### C-01 — `executeRetreat` e `massAssimilate` violam a regra de imutabilidade (mutações diretas de estado)

| Atributo | Detalhe |
|----------|---------|
| **Seção** | §3 (Army Retreat) + §4 (Ações em Massa) |
| **Tipo** | Violação de regra de arquitetura |
| **Impacto** | Coder implementa mutação direta → bugs de referência, estado corrompido |

**Problema:**

O MAESTRO.md estabelece como prioridade 1: **"Integridade do Estado. Se não for imutável, está errado."** O skill `medieval-realms-game` reforça: **"Deep clone required for all state mutations."**

O código de exemplo do PRD faz mutação direta:

```typescript
// §3 — executeRetreat (linhas 315-319)
destinationProv.army.infantry += retreating.infantry;  // ← MUTAÇÃO DIRETA
destinationProv.troops = ...;                            // ← MUTAÇÃO DIRETA

// §4 — massAssimilate (linhas 407-408)
realm.gold -= 50;       // ← MUTAÇÃO DIRETA
p.loyalty = Math.min(100, p.loyalty + 5);  // ← MUTAÇÃO DIRETA
```

Um agente coder que seguir estes exemplos introduzirá o bug mais grave do projeto: mutação de objetos aninhados do `GameState` sem deep clone. O resultado são bugs de referência (duas partes do código veem versões diferentes do mesmo objeto) e comportamento imprevisível.

Além disso, `executeRetreat` modifica `destinationProv` que é recebido como parâmetro — a função é declarada como pura (exportada de `src/logic/`) mas tem side effects. A assinatura contradiz o propósito da camada `src/logic/`.

**Correção sugerida:**

- Reescrever os exemplos para usar o padrão de clone profundo + retorno de novo estado:
  ```typescript
  export function executeRetreat(
    remainingArmy: Army,
    destinationProv: Province,
    retreatRatio: number = 0.3
  ): { retreating: Army; updatedProvince: Province } {
    const retreating: Army = { ... };
    const updated = JSON.parse(JSON.stringify(destinationProv));
    updated.army.infantry += retreating.infantry;
    // ...
    return { retreating, updatedProvince: updated };
  }
  ```
- Adicionar nota explícita: **"ATENÇÃO: Aplicar deep clone no estado antes de chamar estas funções. Ver §Critical Pitfalls do skill medieval-realms-game."**

---

### C-02 — Novos campos do `Realm` não têm especificação de inicialização (causarão `undefined`)

| Atributo | Detalhe |
|----------|---------|
| **Seção** | §2 (Diplomacia — Estado dos Dados) |
| **Tipo** | Dados insuficientes |
| **Impacto** | Crashes em runtime ao acessar `realm.nonAggressionPacts.includes(...)` |

**Problema:**

O PRD adiciona 4 novos campos ao `Realm`:
- `nonAggressionPacts: string[]`
- `defensivePacts: string[]`
- `tributeFrom: Record<string, number>`
- `tributeTo: Record<string, number>`

Porém não menciona que `generateInitialState` em `src/logic/mapGeneration.ts` precisa inicializar esses campos para **todos os reinos**. Se o coder apenas adicionar os tipos em `types.ts` e pular a inicialização, qualquer acesso a esses campos será `undefined` e causará crashes (ex: `realm.nonAggressionPacts.includes(...)` → `TypeError: Cannot read properties of undefined`).

O padrão no projeto é que TODOS os campos do Realm são inicializados na geração do estado. Campos opcionais são marcados com `?` (ex: `vassalOf?`, `capitalId?`). Nenhum dos novos campos tem `?`.

**Correção sugerida:**

- Adicionar passo explícito no Fluxo de Implementação: **"0. `src/logic/mapGeneration.ts`: Inicializar `nonAggressionPacts: []`, `defensivePacts: []`, `tributeFrom: {}`, `tributeTo: {}` em `generateInitialState` para cada reino gerado."**
- OU marcar os campos como opcionais (`nonAggressionPacts?: string[]`) e adicionar fallback no código de acesso.

---

### C-03 — `getDiplomacyAcceptance` tem assinatura inconsistente e thresholds incompletos

| Atributo | Detalhe |
|----------|---------|
| **Seção** | §2 (Cálculo de Aceitação) |
| **Tipo** | Regra de negócio incompleta |
| **Impacto** | Coder não sabe como implementar aceitação para 4 das 7 ações |

**Problema:**

A assinatura da função usa `action: DiplomacyAction` como parâmetro mas o tipo `DiplomacyAction` **não é definido em lugar nenhum do PRD**. O coder precisará inventar esse tipo.

Os thresholds de aceitação cobrem apenas 5 ações:

| Ação | Threshold definido? |
|------|:---:|
| Alliance | ✅ 70% |
| NAP | ✅ 60% |
| Defensive Pact | ✅ 75% |
| Tribute (offer/demand?) | ✅ 50% |
| Vassalage | ✅ 85% |
| **Improve Relations** | ❌ |
| **Send Insult** | ❌ |
| **Declare War** | ❌ |
| **Demand Tribute** (distinto de offer) | ❌ |

Improve Relations e Send Insult são provavelmente **sempre aceitos** (são unilaterais), mas o coder não tem como saber. Declare War pode ser sempre aceito ou ter pré-condições. Demand Tribute tem o mesmo threshold de Offer Tribute (50%)? O PRD não diz.

**Correção sugerida:**

- Definir explicitamente o tipo `DiplomacyAction` como union type.
- Especificar thresholds para TODAS as ações, incluindo "sempre aceito" quando for o caso:
  ```
  Improve Relations: sempre aceito (não requer acceptance check)
  Send Insult: sempre aceito
  Declare War: sempre aceito (declaração unilateral)
  Demand Tribute: >= 50%
  ```
- Esclarecer se `acceptance` é 0-100 ou 0-1.

---

### C-04 — Custos de AP diferentes por ação diplomática — `ACTION_COSTS.diplomacy` é insuficiente

| Atributo | Detalhe |
|----------|---------|
| **Seção** | §2 (Ações Diplomáticas) |
| **Tipo** | Integração mal especificada |
| **Impacto** | Coder usa custo fixo de 2 AP para todas as ações, ou implementa sistema ad-hoc inconsistente |

**Problema:**

O PRD define custos variados:
- Alliance: 2 AP
- NAP, Defensive Pact, Improve Relations, Send Insult, Offer Tribute, Demand Tribute: 1 AP cada

Porém `game-constants.ts` tem apenas uma constante: `ACTION_COSTS.diplomacy = 2`.

O coder que usar `ACTION_COSTS.diplomacy` cobrará 2 AP para uma ação que deveria custar 1 AP. Se criar constantes novas, o PRD não diz onde ou como.

**Correção sugerida:**

- Adicionar constantes específicas em `game-constants.ts`:
  ```typescript
  export const DIPLOMACY_ACTION_COSTS = {
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
- OU usar `ACTION_COSTS.diplomacy` como teto e documentar que ações de 1 AP são exceções.

---

### C-05 — `DiplomacyModal.tsx` já existe com estrutura incompatível — "reescrever" é ambíguo

| Atributo | Detalhe |
|----------|---------|
| **Seção** | §2 (Fluxo de Implementação, passo 3) |
| **Tipo** | Ambiguidade de escopo |
| **Impacto** | Coder pode preservar API antiga (com `diplomacyResult` prop) ou quebrar consumidores existentes |

**Problema:**

O PRD diz: **"`DiplomacyModal.tsx`: Reescrever com UI completa"**. O arquivo já existe e tem 74 linhas com a seguinte interface:

```typescript
interface DiplomacyModalProps {
  isOpen: boolean;
  onClose: () => void;
  diplomacyResult: {
    type: 'peace' | 'war' | 'tribute' | 'vassalage' | 'trade';
    realm: string;
    success: boolean;
    message: string;
  };
}
```

O componente atual é um **modal de resultado** (passivo, mostra outcome de uma ação diplomática já concluída). O PRD quer um **modal interativo** com lista de ações, barra de relações, cálculo de aceitação, etc.

O coder precisa saber:
- Devo preservar o componente antigo para mostrar resultados E criar um novo para interação?
- Devo substituir completamente (quebrando quem chama o modal antigo)?
- Qual será o novo nome? `DiplomacyModal` (sobrescrever) ou `DiplomacyInteractionModal`?

**Correção sugerida:**

- Especificar: **"Renomear `DiplomacyModal.tsx` atual para `DiplomacyResultModal.tsx` e criar NOVO `DiplomacyModal.tsx` com UI interativa. Atualizar referências no `useGameController.ts`."**
- OU: **"Estender `DiplomacyModal.tsx` com dois modos: 'result' (existente) e 'interaction' (novo), controlados por prop `mode`."**

---

### C-06 — `processEndOfTurn` para tributos não especifica ordem de processamento

| Atributo | Detalhe |
|----------|---------|
| **Seção** | §2 (Fluxo de Implementação, passo 7) |
| **Tipo** | Regra de negócio incompleta |
| **Impacto** | Comportamento diferente dependendo de quando o tributo é debitado no turno |

**Problema:**

O PRD diz: **"`turnLogic.ts` — `processEndOfTurn`: Tributos processados, NAP timers decrementados"**. Não especifica:

1. **Ordem:** Tributo é debitado ANTES ou DEPOIS do cálculo de renda? Se for antes, o reino pagador pode ficar com gold negativo e não conseguir pagar manutenção — causando disband automático de tropas.
2. **Gold negativo:** O que acontece se `realm.gold < tributeAmount`? O tributo não é pago? É pago parcialmente? Gera penalidade?
3. **NAP timer:** Onde o timer é armazenado? O PRD não define campo para `napExpiryTurn` em `Realm` ou `memory`. Sugere decrementar mas não diz de onde.

**Correção sugerida:**

- Especificar a ordem exata no `processEndOfTurn`:
  1. Processar renda (income)
  2. Processar tributos (deduzir de `tributeTo`, adicionar em `tributeFrom`)
  3. Processar manutenção
  4. Decrementar timers de NAP
- Adicionar campo `napExpiryTurn?: number` no `Realm` ou usar `memory[realmId].truces` existente.
- Definir regra para gold insuficiente: **"Se gold insuficiente para pagar tributo, relação cai -10 e tributo é cancelado."**

---

### C-07 — `checkDefensiveCallToArms` não especifica comportamento completo

| Atributo | Detalhe |
|----------|---------|
| **Seção** | §2 (Fluxo de Implementação, passo 2) + §2.3 |
| **Tipo** | Regra de negócio incompleta |
| **Impacto** | Coder implementa call to arms parcial ou incorreto |

**Problema:**

A função `checkDefensiveCallToArms` é mencionada como **"chamado quando guerra é declarada"** mas o comportamento não é especificado:

- O reino com pacto defensivo **automaticamente** entra na guerra (declara guerra ao agressor)?
- Ou recebe uma **notificação** e pode escolher? (Se puder escolher, a penalidade de -50 relações faz sentido. Se for automático, a penalidade nunca se aplica.)
- O call to arms é **em cadeia**? Se A tem pacto com B e B tem pacto com C, e A é atacado → B entra → C entra?
- O defensor original ganha alguma notificação?

A seção 2.1 (Alliance) diz: **"Se um é atacado, o outro automaticamente entra na guerra (defensive call to arms)"** — automático.
A seção 2.3 (Defensive Pact) diz: **"Se o aliado for atacado, você automaticamente entra na guerra do lado dele."** — automático.
Mas a penalidade de quebra (§2.3) diz: **"Não atender call to arms = -50 relações"** — o que implica que é possível NÃO atender.

Há uma contradição: é automático ou opcional?

**Correção sugerida:**

- Decidir: call to arms é **automático** (sem escolha) ou **opcional** (com penalidade)?
- Se automático: remover penalidade de "não atender" da seção 2.3.
- Se opcional: reescrever seção 2.1 e 2.3 para dizer "pode escolher entrar na guerra".
- Especificar se o call to arms é em cadeia ou apenas direto.

---

## Achados importantes

---

### I-01 — `resolveCombat` não retorna `attackerRemaining`/`defenderRemaining` — estrutura de retorno existente é incompatível

| Atributo | Detalhe |
|----------|---------|
| **Seção** | §3 (Army Retreat) |
| **Tipo** | Suposição incorreta sobre código existente |
| **Impacto** | Código de exemplo do PRD referencia `result.attackerRemaining` mas o retorno real de `resolveCombat` é `BattleResult` |

**Problema:**

O código de exemplo do PRD (linhas 331-345) referencia:
```typescript
if (!result.won) {
  const retreating = executeRetreat(result.attackerRemaining, ...);
}
```

O tipo `BattleResult` existe em `types.ts` e inclui `attackerRemaining` e `defenderRemaining` — isso está correto. Mas a função `resolveCombat` **atual** em `src/logic/combatLogic.ts` realmente retorna `BattleResult` com esses campos. **Este achado é falso positivo — o código está correto.** 

*Retratado: o PRD referencia corretamente a estrutura existente. Manter como verificável.*

---

### I-02 — Minimapa (150x100px no canto inferior esquerdo) conflita com botões de zoom e toggle HUD

| Atributo | Detalhe |
|----------|---------|
| **Seção** | §7 (Minimapa) + código existente |
| **Tipo** | Conflito de UI |
| **Impacto** | Sobreposição de elementos sem regra de z-index |

**Problema:**

O minimapa é posicionado no **canto inferior esquerdo** (150x100px). O código atual (`Map.tsx`, `HUD.tsx`) já tem elementos nesta região:
- Botões de zoom (+/-) no canto inferior direito ou esquerdo
- Toggle do HUD em mobile

O PRD não especifica z-index, posicionamento relativo, ou comportamento em mobile. Em telas pequenas, 150px de largura podem cobrir botões essenciais.

**Correção sugerida:**

- Especificar z-index do minimapa (`z-20`) e garantir que botões fiquem acima (`z-30`).
- Definir comportamento mobile: **"Em telas < 768px, minimapa é 100x70px ou oculto (toggle via botão)."**

---

### I-03 — Múltipla seleção: AP insuficiente não tem tratamento

| Atributo | Detalhe |
|----------|---------|
| **Seção** | §5 (Múltipla Seleção) |
| **Tipo** | Regra de negócio incompleta |
| **Impacto** | Comportamento indefinido quando AP < número de províncias selecionadas |

**Problema:**

O PRD diz: **"Ação consome 1 AP por província de origem"**. Se o jogador seleciona 5 províncias mas tem apenas 3 AP:
- Marcha apenas 3 (quais? as mais próximas? as com mais tropas?)?
- Rejeita a ação inteira e mostra toast de erro?
- Marcha parcial com confirmação?

Nenhum desses cenários é coberto.

**Correção sugerida:**

- Especificar: **"Se AP insuficiente para todas as origens, age nas N províncias mais próximas do destino (menor `remainingPath.length`). Exibe toast: 'AP insuficiente para todas as seleções. Marchando de X/Y províncias.'"**

---

### I-04 — `executeRetreat` com `Math.floor` pode zerar tipos de unidade

| Atributo | Detalhe |
|----------|---------|
| **Seção** | §3 (Army Retreat, código exemplo) |
| **Tipo** | Edge case não tratado |
| **Impacto** | Exército com 3 archers derrotado → 0 archers recuam (perda desproporcional) |

**Problema:**

```typescript
const retreating: Army = {
  infantry: Math.floor(remainingArmy.infantry * retreatRatio),  // 0.3
  archers: Math.floor(remainingArmy.archers * retreatRatio),
  // ...
};
```

Com `retreatRatio = 0.3`:
- 10 infantry → 3 recuam ✅
- 3 archers → `Math.floor(0.9)` = **0 recuam** ❌
- 2 cavalry → `Math.floor(0.6)` = **0 recuam** ❌

Isso significa que exércitos pequenos ou diversificados perdem tipos de unidade inteiros no recuo, alterando a composição do exército de forma desproporcional.

**Correção sugerida:**

- Garantir mínimo de 1 por tipo não-zero: `Math.max(remainingArmy.infantry > 0 ? 1 : 0, Math.floor(remainingArmy.infantry * retreatRatio))`
- OU usar `Math.round` em vez de `Math.floor`.
- OU calcular o recuo sobre o total de tropas primeiro, depois distribuir proporcionalmente.

---

### I-05 — Memória de eventos: PRD não especifica QUANDO popular os campos

| Atributo | Detalhe |
|----------|---------|
| **Seção** | §2 (Estado dos Dados) + §2.1-2.7 |
| **Tipo** | Dados insuficientes |
| **Impacto** | Sistema de memória existe mas nunca é populado → acceptance calculation usa zeros |

**Problema:**

O PRD menciona que `memory` tem campos `betrayal`, `help`, `aggression`, `lastWarTurn`, `warExhaustion` e que estes influenciam o cálculo de aceitação (peso 15%). Porém só especifica valores de penalidade na **quebra** de pactos (ex: "+30 betrayal" ao quebrar aliança). Não especifica:

- Quando `help` é incrementado? (Ao enviar gold? Ao ajudar em guerra? Ao aceitar call to arms?)
- Quando `aggression` é incrementado? (Ao declarar guerra? Ao atacar província?)
- `lastWarTurn` e `warExhaustion` são populados automaticamente ou manualmente?
- Qual o valor inicial? Zero para todos?

Sem essas regras, o coder implementará o sistema de memória pela metade — os campos existirão mas nunca serão populados, e o cálculo de aceitação usará zeros para tudo.

**Correção sugerida:**

- Adicionar tabela de eventos que populam a memória:
  | Evento | Campo | Delta |
  |--------|-------|-------|
  | Quebrar aliança/NAP/pacto | betrayal | +25 a +30 |
  | Declarar guerra | aggression | +15 |
  | Ajudar em guerra (call to arms atendido) | help | +20 |
  | Enviar gold/tributo voluntário | help | +5 |
  | Guerra termina | lastWarTurn, warExhaustion | turn atual, reset |

---

### I-06 — `VisualEffect` type existente não inclui partículas — "estender" é vago

| Atributo | Detalhe |
|----------|---------|
| **Seção** | §8 (Partículas) |
| **Tipo** | Especificação incompleta |
| **Impacto** | Coder pode adicionar tipo novo, reutilizar existente, ou quebrar código que faz switch em `VisualEffect.type` |

**Problema:**

O PRD diz: **"`VisualEffect` já existe — estender para suportar partículas."** O tipo atual é:
```typescript
export interface VisualEffect {
  type: 'battle' | 'conquest' | 'trade';
  // ...
}
```

"Estender" pode significar:
- Adicionar `'particle'` ao union type
- Criar um tipo separado `ParticleEffect`
- Adicionar campo `particleType` ao `VisualEffect`

O PRD não especifica qual abordagem. Se houver código que faz `switch (effect.type)` com casos exaustivos, adicionar um novo tipo quebrará a compilação ou causará casos não tratados.

**Correção sugerida:**

- Especificar exatamente: **"Adicionar `'conquest_particles' | 'battle_particles' | 'build_particles'` ao union type `VisualEffect.type`. Adicionar campo opcional `particleCount?: number`. Atualizar todos os `switch (effect.type)` existentes."**

---

### I-07 — Testes não cobrem cenários de erro

| Atributo | Detalhe |
|----------|---------|
| **Seção** | Todas as seções de teste |
| **Tipo** | Cobertura de teste insuficiente |
| **Impacto** | Bugs de edge case não detectados |

**Problema:**

Nenhum checklist de teste cobre cenários de erro:
- Diplomacia: o que acontece se tentar aliança com reino que já é aliado?
- Diplomacia: o que acontece se tentar NAP com reino em guerra?
- Army Retreat: o que acontece se `defeatedProvinceId` não existe?
- Ações em Massa: o que acontece com 0 províncias do jogador?
- Hotkeys: o que acontece se duas hotkeys conflitantes são pressionadas?
- SFX: o que acontece se `AudioContext` falhar (ex: política de autoplay do Chrome)?

**Correção sugerida:**

- Adicionar seção de **"Testes de Edge Case e Erro"** no final de cada feature.
- Exemplo para Diplomacia:
  ```
  - [ ] Propor aliança com reino já aliado → toast "Já são aliados"
  - [ ] Propor NAP com reino em guerra → ação bloqueada
  - [ ] Melhorar relações com relações já em 100 → sem efeito, toast informativo
  ```

---

### I-08 — Estimativa de 0.5 dia para Hotkeys é irrealista

| Atributo | Detalhe |
|----------|---------|
| **Seção** | Tabela de Entregáveis (§1) |
| **Tipo** | Estimativa subdimensionada |
| **Impacto** | Coder tenta entregar em 0.5 dia → shortcuts, bugs |

**Problema:**

13 hotkeys com condições diferentes, handler de `keydown` no `App.tsx`, tooltips em todos os botões do HUD, 8 testes, e garantir que hotkeys não funcionam em inputs/menu. Isso é no mínimo 1-1.5 dias de trabalho, especialmente considerando a necessidade de testar em múltiplos browsers e com diferentes layouts de teclado.

**Correção sugerida:**

- Ajustar estimativa para **1-1.5 dias**.

---

## Achados opcionais

---

### O-01 — SFX com Web Audio API procedural — curva de aprendizado não considerada

**Seção:** §6

**Problema:** Gerar sons proceduralmente com `AudioContext` e osciladores requer conhecimento de síntese sonora (frequências, envelopes, wave types). O PRD trata como "1 dia" mas um coder sem experiência em áudio pode levar 2-3 dias. Uma alternativa mais rápida seria usar arquivos de áudio curtos (MP3/WAV base64 inline) ou uma biblioteca como `tone.js`.

**Correção sugerida:** Adicionar nota: **"Se o coder não tem experiência com Web Audio API, considere usar `tone.js` ou samples base64 como fallback."** Ou ajustar estimativa para 2 dias.

---

### O-02 — Ordem de prioridade entre features "Críticas" não definida

**Seção:** Tabela de Entregáveis

**Problema:** Hotkeys e Diplomacia são ambas "🔴 Crítica". Se houver conflito de tempo ou dependência técnica, qual implementar primeiro? Hotkeys são pré-requisito para Diplomacia (atalhos W/A para ataque)? Ou Diplomacia é mais impactante e deve vir primeiro?

**Correção sugerida:** Adicionar nota: **"Ordem de implementação: 1) Hotkeys (0.5-1d) → 2) Diplomacia (3.5d) → 3) Army Retreat (1d) → ... As hotkeys são fundação que as outras features usarão."**

---

### O-03 — PRD não referencia o sistema de toast existente

**Seção:** Todo o documento

**Problema:** O projeto já tem um sistema de toast (`useUI.showToast`, `ToastContainer.tsx`). O PRD não menciona que as ações diplomáticas e de massa devem usar `showToast` para feedback. O coder pode implementar outro sistema de notificação ou usar `alert()`.

**Correção sugerida:** Adicionar nas seções relevantes: **"Usar `ui.showToast(message, 'success' | 'error')` para feedback de ações diplomáticas."** (seguindo o padrão do item 6 do skill `medieval-realms-game`: "showToast after setGameState needs setTimeout").

---

### O-04 — `diplomacyLogic.ts` não especifica funções de validação (canProposeAlliance, etc.)

**Seção:** §2 (Fluxo de Implementação, passo 2)

**Problema:** O PRD lista funções `proposeAlliance`, `proposeNonAggressionPact`, etc. mas não inclui funções de **validação** separadas (`canProposeAlliance(state, from, to): { valid: boolean; reason?: string }`). Sem validação, o coder misturará lógica de validação com execução, dificultando a preview de ações na UI (ex: desabilitar botão de Alliance se relações < 50).

**Correção sugerida:** Adicionar ao fluxo: **"Funções de validação exportadas: `canProposeAlliance`, `canProposeNAP`, etc. — usadas pela UI para desabilitar botões e mostrar tooltips de requisitos."**

---

### O-05 — Flavor text é definido mas não há sistema de localização ou fallback

**Seção:** §2.1-2.5

**Problema:** Cada ação tem flavor text em português fixo no código. Se o jogo algum dia for traduzido, essas strings estarão espalhadas na lógica. Além disso, se `getDiplomacyFlavorText` não encontrar uma ação, o que retorna? String vazia? Throw?

**Correção sugerida:** Mover flavor texts para um objeto de constantes (ex: `DIPLOMACY_FLAVOR_TEXTS` em `game-constants.ts` ou `diplomacyLogic.ts`). Adicionar fallback genérico para ações não mapeadas.

---

### O-06 — Minimapa em mobile não tem especificação de touch

**Seção:** §7

**Problema:** "Clicar no minimapa = mover viewport" — em mobile, isso é um toque. Mas o minimapa é pequeno (150x100px), e o dedo cobre uma área significativa. A precisão do toque pode ser ruim. Além disso, o gesto de pan no mapa principal pode conflitar com o toque no minimapa.

**Correção sugerida:** Especificar: **"Em touch devices, minimapa é 120x80px. Toque no minimapa move a viewport com animação. O pan no mapa principal tem prioridade sobre o minimapa (touch no minimapa só ativa se o toque começar E terminar dentro da área do minimapa)."**

---

## Correções recomendadas (ordem de prioridade)

| Prio | ID | Ação |
|:----:|:--:|------|
| 1 | C-01 | Reescrever exemplos de código com deep clone + retorno de novo estado |
| 2 | C-02 | Adicionar passo 0 no fluxo: inicializar novos campos em `mapGeneration.ts` |
| 3 | C-03 | Definir `DiplomacyAction` type e thresholds para TODAS as 7 ações |
| 4 | C-04 | Criar constantes de AP por ação diplomática em `game-constants.ts` |
| 5 | C-05 | Especificar se `DiplomacyModal.tsx` é substituição total ou componente novo |
| 6 | C-06 | Especificar ordem de processamento de tributos e timer de NAP |
| 7 | C-07 | Resolver contradição: call to arms automático vs opcional |
| 8 | I-02 | Especificar z-index e comportamento mobile do minimapa |
| 9 | I-03 | Definir comportamento com AP insuficiente na múltipla seleção |
| 10 | I-04 | Corrigir `Math.floor` para não zerar tipos de unidade no recuo |
| 11 | I-05 | Adicionar tabela de eventos que populam `Realm.memory` |
| 12 | I-06 | Especificar exatamente como estender `VisualEffect.type` |
| 13 | I-07 | Adicionar testes de edge case e erro para cada feature |
| 14 | I-08 | Ajustar estimativa de hotkeys para 1-1.5 dias |
| 15 | O-01 | Adicionar nota sobre complexidade de Web Audio procedural |
| 16 | O-02 | Definir ordem de implementação entre features críticas |
| 17 | O-03 | Referenciar sistema de toast existente (`useUI.showToast`) |
| 18 | O-04 | Adicionar funções de validação (`canPropose...`) ao `diplomacyLogic.ts` |
| 19 | O-05 | Mover flavor texts para constantes |
| 20 | O-06 | Especificar comportamento de touch no minimapa |

---

## Veredito final

**Parcialmente pronto.**

O PRD tem visão estratégica excelente e cobre as features certas. A estrutura de seções (Resumo → Especificação → Implementação → Testes) é consistente e fácil de seguir. A decisão de focar em Diplomacia como feature âncora da fase é acertada.

No entanto, **os 7 achados críticos são bloqueantes** para um agente coder:

- **C-01** fará o coder introduzir mutações de estado — o bug #1 do projeto.
- **C-02** causará crashes em runtime na primeira ação diplomática.
- **C-03** e **C-04** deixarão o sistema de aceitação e custos de AP incompletos.
- **C-05** criará confusão sobre o componente existente.
- **C-06** e **C-07** deixarão a economia de tributos e o sistema de call to arms com comportamento indefinido.

Recomendo corrigir **C-01 a C-07** antes de transformar este PRD em plano de implementação. Os achados importantes (I-01 a I-08) devem ser resolvidos durante o planning, e os opcionais (O-01 a O-06) podem ser tratados como melhorias durante a implementação.

Se as correções críticas forem aplicadas, o PRD estará **pronto** para virar plano de implementação.

---

*Fim da auditoria.*
