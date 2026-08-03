# Revisão Crítica do PRD Mestre — Reinos Medievais

> **Documento auditado:** `docs/product/PRD.md` v1.0 (03/08/2026)
> **Data da revisão:** 03/08/2026
> **Método:** Verificação de cada RF contra o código real (`src/logic/`, `src/hooks/`, `src/types.ts`)
> **Tipo:** Revisão pré-implementação (PRD_REVIEW)

---

## Resumo da avaliação

O PRD mestre está **bem estruturado e pronto para virar plano de implementação**, com escopo claro (Fase 2 inteira, sem música), fórmulas fechadas e critérios de aceite verificáveis. Porém, a verificação contra o código revelou **divergências entre o PRD-FASE-2 (fonte) e o código real** que precisam ser resolvidas ANTES do plano de implementação — em 3 pontos, o PRD-FASE-2 descreve funções/estruturas que não existem ou têm comportamento diferente do que o texto afirma.

**Veredito: APROVADO COM RESSALVAS** — 5 achados (2 críticos, 3 médios) que o plano de implementação deve incorporar como correções de especificação.

---

## Achados

### C-01 — `processActiveWars` não existe como função (crítico)

| Atributo | Detalhe |
|---|---|
| **Seção do PRD** | RF-02-02 (Capitulação), fonte PRD-FASE-2 §2 |
| **Tipo** | Divergência especificação vs código |

**Problema:** O PRD-FASE-2 §2 instrui modificar `processActiveWars` ("ponto de inserção: após o loop de batalhas, antes da exaustão"). **Essa função não existe** — a lógica de guerras (exaustão, war score, fim de guerra) está inline dentro de `processEndOfTurn` (turnLogic.ts linhas ~420-472).

**Correção para o plano:** A capitulação deve ser inserida como uma função nova `checkCapitulation/executeCapitulation` chamada dentro de `processEndOfTurn` no ponto equivalente (após atualizar war scores, antes da checagem de exaustão/fim de guerra). O plano não deve referenciar `processActiveWars`.

### C-02 — `declareWar` muta o estado; a seção 9 do PRD-FASE-2 a usa como se fosse pura (crítico)

| Atributo | Detalhe |
|---|---|
| **Seção do PRD** | RF-02-06 (IA) e RF-02-08 (Liberty), fonte PRD-FASE-2 §6 e §9 |
| **Tipo** | Inconsistência interna + risco de bug de imutabilidade |

**Problema:** `declareWar(state, fromId, toId)` (diplomacyLogic.ts:574) **muta o objeto `state` recebido** (chama `addUniqueWar`, `markAggressionMemories`, `removePactPair`, etc.) e retorna `{ newState: state, ... }` — a MESMA referência. A convenção real do projeto é: **o chamador clona antes** (useGameController: `declareWar(clone, ...)`).

O PRD-FASE-2 tem duas descrições contraditórias:
- §6 (IA): "usar a canônica: `const { newState } = declareWar(state, ...)`" — sugere função pura com retorno de novo estado.
- §9 (Liberty): `declareWar(state, vassalId, overlord.id)` "modifica state internamente" — trata como mutação.

**Correção para o plano:** Documentar a convenção real: `declareWar` recebe UM DEEP CLONE e o muta (o retorno é a mesma referência). Todos os chamadores (IA, liberty, capitulação) devem clonar antes. Adicionar teste que garanta que o estado original NÃO é alterado após `declareWar(deepClone(state), ...)`.

### M-01 — Tecnologia e empréstimos JÁ têm implementação parcial rodando no turno (médio)

| Atributo | Detalhe |
|---|---|
| **Seção do PRD** | RF-02-01, RF-02-05 |
| **Tipo** | Estimativa superestimada |

**Evidência:** `processEndOfTurn` (turnLogic.ts:526) já chama `calculateTechPointsPerTurn(realm, ownedProvinces.length)` e `processRealmLoans(realm)` — techPoints acumulam por turno e empréstimos são processados. `techLogic.ts` e `financeLogic.ts` existem (commitados 03/08).

**Impacto:** A estimativa de "Sistema de Tecnologia 3d" pode cair para ~1.5-2d (falta: UI de alocação, fórmula de custo triangular, integração de bônus em combate/recrutamento). Ajustar no plano.

### M-02 — Capitulação parcial já existe (reino sem províncias é eliminado) (médio)

| Atributo | Detalhe |
|---|---|
| **Seção do PRD** | RF-02-02 |
| **Tipo** | Sobreposição com lógica existente |

**Evidência:** `processEndOfTurn` já elimina reinos com `ownedProvinces.length === 0` (turnLogic.ts ~544). A capitulação nova (ceder 50% das ocupadas, virar vassalo, war score) é um sistema adicional — mas o plano deve integrar com a eliminação existente para não duplicar caminhos.

### M-03 — `techLevels`/`government`/`schemaVersion` ainda não existem em types.ts (médio)

| Atributo | Detalhe |
|---|---|
| **Seção do PRD** | RF-02-01, RF-02-03, RF-02-10 |
| **Tipo** | Dependência de modelo |

**Evidência:** `types.ts` tem `techPoints` e `unlockedTechs`, mas NÃO tem `techLevels`, `government`, `governmentChangeCooldown`, `vassalLiberty`, `schemaVersion`, `originalOwnerId` (Province). O PRD-FASE-2 assumia que `PersonalityType` era governo — não é.

**Correção para o plano:** Sprint de modelo de dados primeiro (types.ts + migração), antes de qualquer lógica de tech/governos. A migração de saves (RF-02-10) deve cobrir TODOS os campos novos listados no PRD-FASE-2 §Migração.

---

## Itens confirmados (sem ressalvas)

- ✅ Fórmula de custo tech triangular `10 + 5 * level * (level + 1) / 2` — fechada e testável
- ✅ Piso de AP `Math.max(2, ...)` — consistente com código (AP clamp já existe)
- ✅ Parcela de empréstimo `Math.ceil((amount * 1.15) / 10)` — consistente com financeLogic existente
- ✅ `calculateMilitaryPower` como soma bruta de tropas × tech × governo — simples, testável
- ✅ `originalOwnerId` lifecycle (set na conquista, limpo no fim da guerra) — necessário e bem definido
- ✅ 7 novos modos de mapa com atalhos — sem conflito com hotkeys existentes (1-5, T usados; 6-9, 0, G, F livres)
- ✅ Remoção de música do escopo (decisão do usuário) — correta, reduz risco de escopo
- ✅ Ordem de implementação (testes → limpeza → Fase 1 restante → Fase 2) — bloqueios respeitados

---

## Correções obrigatórias antes do plano

1. Reescrever RF-02-02 para referenciar inserção em `processEndOfTurn` (não `processActiveWars`).
2. Adicionar nota de convenção em RF-02-06/RF-02-08: `declareWar` muta o clone; chamadores devem clonar antes; teste de não-mutação do original.
3. Atualizar estimativa de RF-02-01 (tech) para refletir implementação parcial existente.
4. Adicionar RF-00-08 (novo): Sprint de modelo de dados + migração ANTES de tech/governos (M-03).

---

## Recomendação

**PRD aprovado com ressalvas** — aplicar as 4 correções acima no PRD.md (v1.1) e seguir para IMPLEMENTATION_PLAN. Não é necessária nova rodada completa de revisão; as correções são pontuais e verificáveis.
