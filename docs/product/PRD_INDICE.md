# Índice de PRDs — Reinos Medievais

> **Atualizado:** 03/08/2026
> **Propósito:** mapear os PRDs avulsos (prd/) para o framework docs/ (produto)

---

## Documentos mestres (framework)

| Documento | Caminho | Status |
|---|---|---|
| Pre-PRD (escopo consolidado) | `docs/product/PRE_PRD_ESCOPO.md` | ✅ Ativo (03/08) |
| PRD mestre v1.1 | `docs/product/PRD.md` | ✅ Aprovado com ressalvas |
| Revisão crítica | `docs/product/PRD_REVIEW.md` | ✅ Aplicada no PRD v1.1 |
| Análise Brownfield | `docs/product/BROWNFIELD_ANALYSIS.md` | ✅ (02/08) |
| Plano de implementação | `docs/implementation/PLANO_IMPLEMENTACAO.md` | ✅ Ativo |
| Plano de testes | `docs/implementation/test-plan.md` | ✅ Ativo |

## PRDs de fase (históricos — fonte detalhada)

| PRD | Caminho | Status |
|---|---|---|
| Fase 1 — Diplomacia, Hotkeys, Combate (v2.1) | `prd/PRD-FASE-1-DIPLOMACIA-HOTKEYS/PRD-FASE-1-DIPLOMACIA-HOTKEYS-v2.md` | 🟢 ~90% implementada |
| Fase 1 — Revisão | `prd/PRD-FASE-1-DIPLOMACIA-HOTKEYS/PRD-FASE-1-DIPLOMACIA-HOTKEYS-REVIEW.md` | Referência |
| Fase 2 — Tecnologia, Governos (v1.1) | `prd/PRD-FASE-2-TECNOLOGIA-GOVERNOS/PRD-FASE-2-TECNOLOGIA-GOVERNOS-CONSOLIDADO.md` | 🟡 Em implementação (Sprints C–H) |
| Fase 2 — Plano de implementação original | `prd/PRD-FASE-2-TECNOLOGIA-GOVERNOS/PLANO-IMPLEMENTACAO-FASE-2.md` | Substituído pelo plano mestre |
| Fase 3 — Religiões, Maravilhas, Multiplayer (v1.0) | `prd/PRD-FASE-3-RELIGIOES-MARAVILHAS/PRD-FASE-3-RELIGIOES-MARAVILHAS.md` | 🔴 Backlog (pós-Fase 2) |
| Matriz AoH2 (comparativa) | `PLANO-ATUALIZACAO-AOH2.md` (raiz) | Referência |
| Roadmap de fases | `IMPLEMENTACOES-FUTURAS.md` (raiz) | Referência |

## Regra de uso

- O **PRD mestre** (`docs/product/PRD.md`) é a fonte canônica para implementação.
- Os **PRDs de fase** em `prd/` são consultados para detalhes técnicos (fórmulas, tabelas, testes por feature).
- Em caso de conflito entre PRD mestre e PRD de fase, vale a hierarquia das regras operacionais (PRD versionado mais recente = PRD mestre v1.1).
