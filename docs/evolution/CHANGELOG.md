# CHANGELOG

## 2026-08-03 - Sprints C-H da Fase 2 + testes finais

### Sprint C — Tecnologia (ffa60a0)

- `technologyLogic.ts`: generateTechPoints (pop/workshops/courts, cap 20), custo triangular `10+5n(n+1)/2`, allocateTechPoints, getTechEffects.
- Integrações: geração por turno (turnLogic), +10% recrutamento/nível (economyLogic), +5% atk/def/nível (combate).
- `TechnologyModal.tsx` + botão no HUD + handleAllocateTech (1 AP + loyalty global +1).

### Sprint D — Governos (9168035)

- `governmentLogic.ts`: 7 governos (GOVERNMENT_STATS), changeGovernment (500g/200m, cooldown 20, force), isProvinceDistant (BFS ≥2 saltos), checkRevolution (10%/turno).
- turnLogic: renda/comida/crescimento por governo, Republic penaliza províncias distantes, Tribal -1 AP (piso 2), revolução de IA.
- Combate: ataque/defesa por governo. `GovernmentModal.tsx` + botão no HUD.

### Sprint E — Capitulação (4e0ab65)

- `capitulationLogic.ts`: checkCapitulation (60% ocupadas | warScore>70 | capital+>50), executeCapitulation (cede 50% mais distantes, vassalo ou eliminação, -20 loyalty, tracking realmsDefeated).
- `originalOwnerId` na conquista de guerra; inserido em processActiveWars após war scores (correção C-01).

### Sprint F — Empréstimos + IA avançada (efd158f)

- financeLogic novo: maxLoan = 5× renda, parcela `ceil(amount*1.15/10)`, default (-10 relações globais, -5 loyalty).
- aiLogic: calculateMilitaryPower, shouldAIAttack por personalidade, processAIDiplomacy, processAILoans, aiAggression (0-100) com slider no menu.

### Sprint G — 13 modos de mapa (326fb63)

- ViewMode +7: population, development, income, stability, buildings, growth, military_strength.
- Hotkeys 6/7/8/9/0/G; V = força militar (F conflita com fullscreen). Botões no HUD para mobile.

### Sprint H — Liberty, derrota narrativa, stats (a0eb3d9)

- `vassalLogic.ts`: processVassalLiberty (fatores +/-, rebelião ≥100 via declareWar canônica, aviso ≥70), appeaseVassal.
- tracking: cumulativeGold, maxProvincesHeld, battlesWon, realmsDefeated.
- GameEndModal: derrota real do jogador detectada (checkGameOver), estatísticas e frases temáticas.

### Testes finais

- `fase2.test.ts` (+28) e `saveMigration.test.ts` (+4): **71 testes no total**, todos verdes. tsc strict limpo, build ok.

## 2026-08-03 - Sprint 00B + Sprint A (ciclo Fase 2)

### Sprint 00B — Fundacao de Testes (commit 3dc0fc2)

- Vitest configurado (vitest.config.ts, scripts npm test/test:watch/test:coverage).
- 6 suites em `src/test/`: smoke, economy, combat, turn, diplomacy, ai (39 testes).
- **2 bugs reais corrigidos** (pegos pelos testes):
  - `checkGameOver` crashava com provincias neutras >=70% (turnLogic.ts).
  - `canDeclareWar` permitia guerra contra si mesmo (diplomacyLogic.ts).

### Sprint A — Limpeza e Debidos (commit 390996d)

- `tsconfig.json` com `strict: true`; 3 erros de tipo corrigidos.
- Zero `any`/`as any` em src/ (10 ocorrencias eliminadas; UnitStats interface nova; `turnsWithoutWar` adicionado a Province).
- README.md reescrito (removido template AI Studio).
- Deps mortas removidas: @google/genai, dotenv, express, @types/express.
- vite.config.ts simplificado.
- `docs/implementation/test-plan.md` criado.

## 2026-08-03 - Ciclo brownfield + Pre-PRD + mapa visual

### Adicionado

- `docs/product/BROWNFIELD_ANALYSIS.md` — analise brownfield completa (10 secoes).
- `docs/product/BROWNFIELD_ANALYSIS_TEMPLATE.md` — prompt L6 preservado (nao estava versionado).
- `docs/product/PRE_PRD_ESCOPO.md` — escopo consolidado das Fases 1-3 + fundacao de testes.
- Decisoes registradas em `docs/evolution/DECISIONS.md` (consolidacao de escopo, mapa visual).

### Alterado

- `src/components/Map.tsx` — portado visual rico da base AI Studio (oceano, rosa dos ventos, escudos, banners, estradas, decoracoes) preservando todas as features; otimizado para mobile (matchMedia).
- `src/App.tsx` — slider de provincias 20-70 (era 15-40).
- `src/hooks/useUI.ts` — default de provincias 30 (era 25).
- Commit ec7d7f3 + push main (working tree zerado).

### Ambiente

- node_modules reinstalado no WSL (rollup linux) — build e dev server funcionando.

## 2026-05-28 - Framework v1.1 inicial

### Adicionado

- Triagem inicial e roteamento.
- Protocolo de rollback.
- Guardrails do coder economico.
- Regra de conflito entre documentos.
- Retrospectiva pos-ciclo.
- Analise Brownfield.
- Registro de componentes aprovados para UI/UX.
- Sprint 00B de fundacao de testes.
- Templates de `HANDOFF` e `CURRENT_STATE`.

### Decisao operacional

- Planilha continua como referencia principal.
- Prompts completos ficam em Markdown.

