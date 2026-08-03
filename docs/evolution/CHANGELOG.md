# CHANGELOG

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

