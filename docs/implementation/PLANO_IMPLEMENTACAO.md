# PLANO DE IMPLEMENTAÇÃO — Reinos Medievais (Ciclo Fase 2)

> **Status:** 🔴 TODO (aguardando Sprint 0)
> **Data:** 03/08/2026
> **Base:** `docs/product/PRD.md` v1.1 (aprovado com ressalvas)
> **Revisão aplicada:** `docs/product/PRD_REVIEW.md` (C-01, C-02, M-01, M-02, M-03)
> **Estimativa total:** 30-35 dias de execução por agente

---

## 🎯 Objetivo

Entregar a Fase 2 completa (tecnologia, governos, capitulação, empréstimos, IA avançada, 7 novos modos de mapa, liberty desire, derrota narrativa, modais responsivos) + fundação de testes + limpeza de débitos, sem regressões em economia/combate/diplomacia existentes.

## ⚠️ Análise de Risco (Triage)

- **Tipo:** feature (multi-sistema)
- **Nível:** structural (mexe em types, estado, lógica e UI)
- **Impacto:** Economia, Combate, IA, Diplomacia, Estado, UI, Persistência (saves)

---

## 🗺️ Estratégia Geral

**Regra de ouro (vinda do PRD_REVIEW):** testes e modelo de dados ANTES de qualquer lógica nova. Ordem dos blocos:

```
Sprint 00B (testes) → Sprint A (limpeza) → Sprint B (modelo de dados + migração)
→ Sprint C (tech) → Sprint D (governos) → Sprint E (capitulação)
→ Sprint F (empréstimos + IA) → Sprint G (modos de mapa) → Sprint H (liberty + modais + derrota)
→ Auditoria final
```

Cada sprint entrega código que compila (`npx tsc --noEmit`), passa nos testes existentes (`npm test`) e mantém o build (`npm run build`).

---

## Sprint 00B — Fundação de Testes (2-3d) [BLOQUEANTE]

| Tarefa | Arquivos | Critério de aceite |
|---|---|---|
| Configurar Vitest + jsdom + scripts | `package.json`, `vite.config.ts`, `src/test/setup.ts` | `npm test` roda |
| Smoke test: generateInitialState + 1 turno completo | `src/test/smoke.test.ts` | Sem exceção em 30 iterações |
| Testes economyLogic (recrutamento, construção, renda) | `src/test/economy.test.ts` | Cobertura dos fluxos principais |
| Testes combatLogic (terreno, retirada, conquista) | `src/test/combat.test.ts` | Vitória/derrota determinísticas |
| Testes turnLogic (findPath, march, processEndOfTurn) | `src/test/turn.test.ts` | March chega no fim do turno |
| Testes diplomacyLogic (declareWar, pactos, tributos) | `src/test/diplomacy.test.ts` | Guerra/aliança/NAP corretos |
| Teste de imutabilidade: declareWar não muta original | `src/test/diplomacy.test.ts` | `deepClone` antes → original intacto (C-02) |
| Testes aiLogic (processAI roda sem crash) | `src/test/ai.test.ts` | IA age sem exceção |

**Gate:** `npm test` verde + `npx tsc --noEmit` limpo.

## Sprint A — Limpeza e Débitos (2d)

| Tarefa | Arquivos | Critério de aceite |
|---|---|---|
| `strict: true` no tsconfig + corrigir erros | `tsconfig.json`, `src/**` | tsc limpo com strict |
| Eliminar `any` (Map.tsx ×3, useGameController ×1) | `src/components/Map.tsx`, `src/hooks/useGameController.ts` | 0 ocorrências `: any` |
| Reescrever README.md | `README.md` | Descrição real do jogo, sem template AI Studio |
| Remover deps mortas (express, @google/genai, dotenv) | `package.json` | `npm ls` sem essas deps; build ok |
| Migrar PRDs avulsos para docs/ (links) | `docs/product/` | Referências consistentes |

**Gate:** build + lint + testes verdes.

## Sprint B — Modelo de Dados + Migração de Saves (2d)

| Tarefa | Arquivos | Critério de aceite |
|---|---|---|
| Adicionar campos a Realm: `techLevels`, `government`, `governmentChangeCooldown`, `vassalLiberty`, `battlesWon`, `realmsDefeated`, `cumulativeGold`, `maxProvincesHeld` | `src/types.ts` | Tipos compilam |
| Adicionar `originalOwnerId` a Province | `src/types.ts` | Tipos compilam |
| Adicionar `schemaVersion: 2` a GameState + GovernType/TechCategory | `src/types.ts` | Tipos compilam |
| Criar `saveMigration.ts` (v1→v2, defaults p/ todos os campos) | `src/logic/saveMigration.ts` | Save Fase 1 carrega sem quebrar |
| Chamar migração em useGameController (load + new game) | `src/hooks/useGameController.ts` | Teste de migração verde |

**Gate:** teste de migração (save antigo → estado válido schemaVersion 2).

## Sprint C — Tecnologia (2d, estimativa revisada M-01)

| Tarefa | Arquivos | Critério de aceite |
|---|---|---|
| `technologyLogic.ts` (generateTechPoints pura, allocate, custo triangular, efeitos) | `src/logic/technologyLogic.ts` | Fórmula `10+5n(n+1)/2` testada |
| Integrar bônus: AP (movement), recrutamento, combate | `turnLogic.ts`, `economyLogic.ts`, `combatLogic.ts` | Bônus aplicados; AP ≥ 2 |
| `TechnologyModal.tsx` (4 categorias, barras, custo, vizinhos) | `src/components/TechnologyModal.tsx` | Alocar gasta 1 AP + pontos |
| Handler de alocação no controller + HUD (techPoints visível) | `useGameController.ts`, `HUD.tsx` | UI mostra pontos e geração/turno |
| +1 loyalty global ao subir nível | `technologyLogic.ts` | Teste verde |

**Gate:** testes tech + build.

## Sprint D — Governos (3d)

| Tarefa | Arquivos | Critério de aceite |
|---|---|---|
| `governmentLogic.ts` (GOVERNMENT_STATS, change, revolution, isProvinceDistant) | `src/logic/governmentLogic.ts` | 7 governos com bônus/penalidades |
| Integrar efeitos: defesa/ataque/gold/food/AP/recrutamento/tech | `combatLogic.ts`, `economyLogic.ts`, `turnLogic.ts`, `technologyLogic.ts` | Multiplicadores aplicados |
| `GovernmentModal.tsx` + HUD (custos, cooldown, confirmação) | `src/components/GovernmentModal.tsx`, `HUD.tsx` | Mudança custa 500g/200m, cooldown 20 |
| Revolução (estabilidade <20 em >50% → 10%/turno) | `governmentLogic.ts`, `turnLogic.ts` | Teste probabilístico determinístico |
| Imposição via tratado de paz (force) | `diplomacyLogic.ts` | Integra com RF-01-02 |

**Gate:** testes governos + build.

## Sprint E — Capitulação (2d)

| Tarefa | Arquivos | Critério de aceite |
|---|---|---|
| `checkCapitulation` + `executeCapitulation` (inseridas em processEndOfTurn após war scores, antes da exaustão — C-01) | `turnLogic.ts` | 3 condições de disparo testadas |
| Set/clear de `originalOwnerId` (conquista/fim de guerra) | `turnLogic.ts`, `combatLogic.ts` | Lifecycle testado |
| Ceder 50% das ocupadas (BFS distância da capital) | `turnLogic.ts` | Províncias mais distantes primeiro |
| Vassalo ou eliminação (integrar com eliminação existente — M-02) | `turnLogic.ts` | Sem duplicação de caminhos |
| -20 loyalty por 5 turnos + notificação TurnSummary | `turnLogic.ts`, `TurnResultModal.tsx` | Penalidade e texto narrativo |

**Gate:** testes capitulação + build.

## Sprint F — Empréstimos + IA Avançada (3.5d)

| Tarefa | Arquivos | Critério de aceite |
|---|---|---|
| Completar empréstimos: requestLoan, limite 5×renda, parcela, default | `financeLogic.ts`, `economyLogic.ts`, `HUD.tsx` | Parcela `ceil((amount*1.15)/10)`; default -10 relações/-5 loyalty |
| `calculateMilitaryPower` (soma tropas × tech × governo) | `aiLogic.ts` | Teste: >0 com tropas, 0 sem |
| Comportamentos por personalidade (5 tipos) | `aiLogic.ts` | Expansionist ataca 1.5×, defensive nunca |
| `processAIDiplomacy` + `processAILoans` | `aiLogic.ts` | IA busca aliados/pede empréstimo |
| Remover declareWar local da IA → canônica (C-02) | `aiLogic.ts` | Teste: sem função local; original intacto |
| `aiAggression` configurável (menu novo jogo) | `types.ts`, `App.tsx`, `aiLogic.ts` | Slider 0-100 default 50 afeta thresholds |

**Gate:** testes IA + build.

## Sprint G — Novos Modos de Mapa (2d)

| Tarefa | Arquivos | Critério de aceite |
|---|---|---|
| Expandir ViewMode (7 novos: population, development, income, stability, buildings, growth, military_strength) | `types.ts` | Tipos compilam |
| Coloração + labels dos novos modos no Map | `Map.tsx` | Tabela do PRD-FASE-2 §4 |
| Hotkeys 6-9, 0, G, F | `App.tsx` | Atalhos funcionam; sem conflito (1-5, T livres) |
| Teste com 70 províncias sem lag | `Map.tsx` | RNF-05 |

**Gate:** build + teste manual no browser.

## Sprint H — Liberty Desire + Modais + Derrota (3d)

| Tarefa | Arquivos | Critério de aceite |
|---|---|---|
| `processVassalLiberty` (fatores +/-, rebelião via declareWar canônica) | `turnLogic.ts` | Liberty ≥100 → rebelião; notificação ≥70 |
| Barra de liberty + "Apaziguar Vassalo" no HUD | `HUD.tsx`, `DiplomacyModal.tsx` | -5 liberty por ação |
| Modais responsivos (<768px, touch ≥48px) | Todos os modais | RF-02-07 testado em 375px |
| Tela de derrota narrativa (estatísticas + frases) | `GameEndModal.tsx` | Campos de tracking incrementam (RF-02-09) |

**Gate:** testes + build + teste mobile.

---

## Sprint 0 — Preparação de Ambiente (1d, antes do 00B)

| Tarefa | Critério |
|---|---|
| Verificar `npm install`, `npm run build`, `npm run dev` no WSL | Build ok (já validado 03/08) |
| Confirmar porta 3000 e dev server | Jogo abre |
| Registrar baseline de commits | `git log` limpo |

---

## 🧪 Plano de Testes (geral)

- **Regressão:** toda sprint roda `npm test` (suite da 00B) + `npx tsc --noEmit` + `npm run build`.
- **Cenário A (tech):** jogador aloca 10 pontos → custo 10; 15; 25... → AP sobe 0.5/nível.
- **Cenário B (capitulação):** ocupar >60% do defensor → capitula no fim do turno, cede províncias, vira vassalo.
- **Cenário C (governos):** mudar para Republic → +1 ação diplomática, -10% estabilidade em províncias ≥2 saltos.
- **Cenário D (IA):** expansionist com 2× poder ataca; defensive nunca inicia guerra.
- **Cenário E (saves):** save da Fase 1 carrega com schemaVersion 2 e todos os defaults.
- **Cenário F (mobile):** 13 modos + modais em 375px sem overflow.

---

## 📝 Notas & Riscos Residuais

- `declareWar` muta o estado — TODOS os chamadores novos devem clonar antes (C-02).
- Não existe `processActiveWars` — capitulação entra em `processEndOfTurn` (C-01).
- Tech/loans já têm base no código — não recriar, completar (M-01).
- Eliminação de reinos já existe — capitulação integra, não duplica (M-02).
- Saves antigos: migração obrigatória antes de qualquer campo novo em produção (M-03).
- Música ambiente fora de escopo (decisão do usuário 03/08).
