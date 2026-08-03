# PRD — Reinos Medievais (Mestre)

> **Versão:** 1.1
> **Data:** 03/08/2026
> **Status:** ✅ Aprovado com ressalvas (PRD_REVIEW aplicado — v1.1 incorpora C-01, C-02, M-01, M-02, M-03)
> **Base:** `docs/product/PRE_PRD_ESCOPO.md` v1.0
> **Revisão:** `docs/product/PRD_REVIEW.md` (03/08/2026)
> **Fontes detalhadas:** `prd/PRD-FASE-1-DIPLOMACIA-HOTKEYS/PRD-FASE-1-DIPLOMACIA-HOTKEYS-v2.md`, `prd/PRD-FASE-2-TECNOLOGIA-GOVERNOS/PRD-FASE-2-TECNOLOGIA-GOVERNOS-CONSOLIDADO.md`, `prd/PRD-FASE-3-RELIGIOES-MARAVILHAS/PRD-FASE-3-RELIGIOES-MARAVILHAS.md`
> **Decisões do usuário (03/08/2026):** Fase 2 inteira em um ciclo; SEM música ambiente; prioridade = profundidade estratégica (Fase 2); hot-seat multiplayer = especulativo (fora de escopo ativo)

---

## 1. Visão do produto

Reinos Medievais é um grand strategy medieval single-player (React 19 + Vite + D3 Voronoi), inspirado em Age of History 2. O jogador governa um reino em mapa procedural: economia, exército, conquista e diplomacia. **Objetivo deste ciclo:** transformar o MVP em estratégia completa com tecnologia, governos, capitulação, IA distinta e fundação de testes — entregando a Fase 2 inteira.

## 2. Escopo

### 2.1 Dentro do escopo (ciclo atual)

| Bloco | Itens | Estimativa |
|---|---|---|
| **Fundação** | Sprint 00B (Vitest + smoke), testes de regressão em src/logic/, tsconfig strict, README correto, limpeza de deps mortas, migração docs | 7-9d |
| **Fase 1 restante** | UI de tecnologia, peace deals completos, UI de vassalagem, flavor text diplomático | 6d |
| **Fase 2 completa** | Tecnologia, capitulação, governos, 7 novos modos de mapa, empréstimos, IA avançada, modais responsivos, liberty desire, tela de derrota narrativa, migração de saves | 20d |
| **Total** | | **33-35d** |

### 2.2 Fora do escopo (registrado para backlog)

- Música ambiente (decisão do usuário 03/08 — reavaliar em ciclo futuro)
- Religiões, maravilhas, editor de cenários, achievements, nukes (Fase 3 — próximo ciclo)
- Multiplayer online e hot-seat (especulativo — backlog)
- i18n, replay, PWA, mods (backlog)
- Mapa mundi real com 13.892 províncias (arquitetura diferente — nunca)
- Monetização, contas, backend

---

## 3. Requisitos funcionais

### 3.0 Fundação de testes (PRÉ-REQUISITO — bloqueia features)

- **RF-00-01:** Configurar Vitest + jsdom como framework de testes.
- **RF-00-02:** Script `npm test` e `npm run test:coverage`.
- **RF-00-03:** Smoke test que gera estado inicial (generateInitialState) e roda 1 turno completo sem exceção.
- **RF-00-04:** Testes de regressão para `src/logic/`: economyLogic, combatLogic, turnLogic (findPath, processEndOfTurn, march), diplomacyLogic (declareWar, pactos, tributos), aiLogic.
- **RF-00-05:** `tsconfig.json` com `strict: true` e eliminação de todos os `any` (hoje: Map.tsx ×3, useGameController ×1).
- **RF-00-06:** README.md reescrito (remover template AI Studio); remover dependências mortas (express, @google/genai, dotenv) do package.json.
- **RF-00-07:** Sprint de modelo de dados ANTES de tech/governos: adicionar a `types.ts` os campos novos (`techLevels`, `government`, `governmentChangeCooldown`, `vassalLiberty`, `schemaVersion` em Realm/GameState; `originalOwnerId` em Province) + `src/logic/saveMigration.ts` com defaults para TODOS os campos novos (RF-02-10). Sem isso, nenhuma lógica de Fase 2 pode ser implementada.
- **Critério de aceite:** `npm test` verde; `npx tsc --noEmit` limpo com strict; `npm run build` ok.

### 3.1 Fase 1 restante

- **RF-01-01 (UI de tecnologia):** techPoints visíveis no HUD com modal de alocação (4 categorias: movement, assimilation, recruitment, combat) — ver RF-02-01 para regras de negócio.
- **RF-01-02 (Peace deals):** além da paz por exaustão, tratado de paz negociável: ceder províncias, exigir tributo, impor governo (integra com RF-02-03).
- **RF-01-03 (UI de vassalagem):** painel listando vassalos com tributo, loyalty e ações (apaziguar, exigir).
- **RF-01-04 (Flavor text):** textos narrativos nas ações diplomáticas (declarar guerra, aliança, tributo) — sem impacto mecânico.

### 3.2 Fase 2 — Tecnologia

- **RF-02-01:** Sistema de tecnologia com 4 categorias (movement, assimilation, recruitment, combat), níveis máximos 10/10/10/20. **NOTA (revisão 03/08):** `techPoints` já acumulam por turno via `calculateTechPointsPerTurn` em turnLogic.ts — falta UI de alocação, fórmula de custo triangular e integração de bônus (combate/recrutamento/AP). Estimativa reduzida para ~2d.
  - Geração: `generateTechPoints(realm, state)` = 1 base + `floor(totalPop/500)` + workshops + `floor(courts/2)`, cap 20/turno, função pura (não armazenar techGeneration).
  - Custo de upgrade: **`cost = 10 + 5 * level * (level + 1) / 2`** (10→15→25→40→60→85→115→150→190→235).
  - Efeitos: movement +0.5 AP/nível; assimilation -10% custo/nível; recruitment +10% pop recrutável/nível; combat +5% atk/def/nível.
  - Piso: `maxActionPoints = Math.max(2, ...)` — nunca < 2.
  - Alocação: 1 AP, só no turno do jogador; +1 loyalty global em todas as províncias ao subir qualquer nível.
  - Arquivo novo: `src/logic/technologyLogic.ts`; integrações em turnLogic (geração por turno), economyLogic (recrutamento), combatLogic (combate).
- **RF-02-02 (Capitulação):** checada após batalhas e antes da exaustão, **inserida DENTRO de `processEndOfTurn`** (não existe função `processActiveWars` — a lógica de guerras é inline em turnLogic.ts ~linhas 420-472; o plano deve criar `checkCapitulation`/`executeCapitulation` novas e chamá-las no ponto após atualizar war scores, antes da checagem de exaustão/fim de guerra). Dispara se: >60% províncias do defensor ocupadas OU war score >70 OU capital capturada + war score >50.
  - Campo `Province.originalOwnerId` (set ao conquistar, limpo ao fim da guerra).
  - Efeitos: guerra termina; derrotado cede 50% das ocupadas (mais distantes da capital via BFS); vira vassalo se ainda tiver províncias; eliminado se não tiver (integrar com a eliminação existente em processEndOfTurn — não duplicar caminhos); vencedor sofre -20 loyalty em todas as províncias por 5 turnos.
  - Interface `CapitulationResult` + notificação narrativa no TurnSummary.
- **RF-02-03 (Governos):** 7 tipos com bônus/penalidades (Monarchy, Republic, Feudal, Theocracy, Despotism, Oligarchy, Tribal) — tabela completa no PRD-FASE-2 §3.
  - Mudança: 500 gold + 200 materials + -30 loyalty por 3 turnos; cooldown 20 turnos; imposição via tratado de paz (force=true, sem custo); revolução se estabilidade <20 em >50% das províncias (10%/turno).
  - "Províncias distantes" (Republic): ≥2 saltos BFS da capital.
  - Arquivo novo: `src/logic/governmentLogic.ts` + `GovernmentModal.tsx`.
- **RF-02-04 (7 novos modos de mapa):** population (6), development (7), income (8), stability (9), buildings (0), growth (G), military_strength (F) — total 13 modos; ViewMode expandido; hotkeys na tabela do PRD-FASE-2 §4.
- **RF-02-05 (Empréstimos):** limite `maxLoan = floor(totalGoldIncome * 5)`; 10 turnos; juros 15% simples; parcela `paymentPerTurn = ceil((amount * 1.15) / 10)`; default (não pagar): -10 relações globais, -5 loyalty, flag `defaulted`. IA pede empréstimo em guerra com gold <0 ou recrutamento urgente.
- **RF-02-06 (IA avançada):**
  - `calculateMilitaryPower(realm, state)` = soma bruta de tropas × (1 + combat*0.05) × gov.attack — função nova em aiLogic.ts.
  - Comportamentos por personalidade (expansionist 1.5×, defensive nunca ataca, opportunistic 1.0× + alvo fraco, diplomatic 3.0×, commercial 2.5× + 50 tropas).
  - `processAIDiplomacy` (alianças, insultos, tributos por personalidade) + `processAILoans`.
  - **Remover** `declareWar` local de aiLogic.ts → usar a canônica de diplomacyLogic.ts.
  - **CONVENÇÃO `declareWar` (revisão 03/08):** a função canônica `declareWar(state, fromId, toId)` MUTA o objeto `state` recebido e retorna `{ newState: state, ... }` (mesma referência). Todo chamador deve passar um deep clone e NÃO reutilizar o original depois. Teste obrigatório: estado original intacto após `declareWar(deepClone(state), ...)`.
  - `GameSettings.aiAggression` (0-100, default 50): `effectiveRatio = baseRatio * (1 - (aiAggression - 50) / 100)`.
- **RF-02-07 (Modais responsivos):** todos os 8 modais usáveis em <768px: layout vertical, touch targets ≥48px, scroll, fechar por tap fora.
- **RF-02-08 (Liberty desire):** vassalos acumulam liberty (+2 base, +5 overlord em guerra, +10 overextension >80, +3 vassalo maior; -5 apaziguar, -3 overlord mais forte, -2 pacto defensivo); >=100 → rebelião via `declareWar` canônica; notificação >=70; campo `Realm.vassalLiberty`.
- **RF-02-09 (Derrota narrativa):** GameEndModal com estatísticas (turnos, max províncias, batalhas vencidas, reinos derrotados, ouro acumulado) + frase temática aleatória. Novos campos em Realm: `battlesWon`, `realmsDefeated`, `cumulativeGold`, `maxProvincesHeld` com regras de incremento definidas no PRD-FASE-2 §10.
- **RF-02-10 (Migração de saves):** `GameState.schemaVersion` (1→2); `src/logic/saveMigration.ts` com defaults para todos os campos novos; chamar em useGameController ao carregar save e ao iniciar novo jogo.

---

## 4. Requisitos não funcionais

| ID | Requisito | Verificação |
|---|---|---|
| RNF-01 | Imutabilidade de estado (deep clone obrigatório, MAESTRO K03) | Revisão de código + testes |
| RNF-02 | Lógica de negócio apenas em `src/logic/` (funções puras) | Estrutura de arquivos |
| RNF-03 | Tipagem estrita (`strict: true`, sem `any`) | `npx tsc --noEmit` |
| RNF-04 | Build de produção sem erros | `npm run build` |
| RNF-05 | 13 modos de mapa renderizam sem lag com 70 províncias | Teste manual + browser |
| RNF-06 | Modais funcionais em mobile (<768px) e desktop | Teste manual |
| RNF-07 | Saves antigos (Fase 1) carregam sem quebrar | Teste de migração |

---

## 5. Critérios de aceite (fase)

- [ ] `npm test` roda com suite de testes cobrindo src/logic/ (smoke + regressão)
- [ ] `npx tsc --noEmit` limpo com `strict: true`
- [ ] Jogador aloca tech points em 4 categorias com custo triangular
- [ ] Bônus de tech afetam AP, assimilação, recrutamento e combate
- [ ] Civilizações capitulam (>60% ocupadas / war score >70 / capital + >50)
- [ ] Jogador escolhe entre 7 governos com bônus/penalidades reais
- [ ] 13 modos de mapa funcionais com atalhos (1-9, 0, T, G, F)
- [ ] Empréstimos com parcela `ceil((amount*1.15)/10)` e default penalizado
- [ ] IA distinta por personalidade usando calculateMilitaryPower
- [ ] Modais usáveis em <768px
- [ ] Vassalos se rebelam em Liberty >=100 (padrão imutável)
- [ ] Derrota mostra tela narrativa com estatísticas rastreadas
- [ ] Saves Fase 1 migrados automaticamente para schemaVersion 2
- [ ] Música ambiente NÃO é implementada (decisão do usuário)

---

## 6. Riscos e mitigações

| Risco | Mitigação |
|---|---|
| Regressões em economia/combate/IA sem testes | RF-00-01..04 (testes ANTES de features — bloqueante) |
| Escopo grande (33-35d) em sessões curtas | Ordem rígida: Fundação → Fase 1 restante → Fase 2; auditoria ao fim de cada bloco |
| Saves antigos quebram com campos novos | RF-02-10 (migração com defaults) |
| IA avançada introduz loops ou NaN | Testes de integração (calculateMilitaryPower sem NaN, IA sem dívida infinita) |
| 13 modos de mapa degradam performance | RNF-05 com 70 províncias |
| `declareWar` duplicada causa divergência | RF-02-06: remover local, usar canônica (teste verifica) |

---

## 7. Ordem de implementação (referência para o plano)

1. **Sprint 00B** — fundação de testes (bloqueia tudo)
2. **Sprint A** — limpeza: strict mode, README, deps mortas, migração docs
3. **Sprint B** — Fase 1 restante (peace deals, vassalos UI, flavor text, UI tech)
4. **Sprint C** — Tecnologia completa (logic + modal + integrações)
5. **Sprint D** — Governos (logic + modal + revolução + imposição)
6. **Sprint E** — Capitulação + migração de saves
7. **Sprint F** — Empréstimos + IA avançada
8. **Sprint G** — Novos modos de mapa + hotkeys
9. **Sprint H** — Liberty desire + modais responsivos + derrota narrativa
10. **Auditoria final** (evidências → final-audit.md → correções → validação)

---

## 8. Referências

- Pre-PRD: `docs/product/PRE_PRD_ESCOPO.md`
- Brownfield: `docs/product/BROWNFIELD_ANALYSIS.md`
- Fase 1 detalhada: `prd/PRD-FASE-1-DIPLOMACIA-HOTKEYS/PRD-FASE-1-DIPLOMACIA-HOTKEYS-v2.md`
- Fase 2 detalhada: `prd/PRD-FASE-2-TECNOLOGIA-GOVERNOS/PRD-FASE-2-TECNOLOGIA-GOVERNOS-CONSOLIDADO.md`
- Fase 3 (backlog): `prd/PRD-FASE-3-RELIGIOES-MARAVILHAS/PRD-FASE-3-RELIGIOES-MARAVILHAS.md`
- Decisões: `docs/evolution/DECISIONS.md`
