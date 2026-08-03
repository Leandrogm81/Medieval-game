# CURRENT_STATE — Reinos Medievais

> **Atualizado:** 03/08/2026 (Fase 2 COMPLETA — Sprints 00B a H)
> **Formato:** conforme `docs/agent/CURRENT_STATE_TEMPLATE.md`

---

## Estado geral

- **Projeto:** MVP jogável em produção (React 19 + Vite 6 + TS strict + Tailwind v4 + D3 Voronoi)
- **Fluxo do framework:** L1_TRIAGE ✅ → L6_BROWNFIELD ✅ → PRE_PRD ✅ → PRD_MASTER v1.1 ✅ → PRD_REVIEW ✅ → IMPLEMENTATION_PLAN ✅ → Sprint 0 ✅ → **Sprints 00B, A, B, C, D, E, F, G, H — TODAS CONCLUÍDAS** → Auditoria final (pendente)
- **Branch:** main (commits 3dc0fc2, 390996d; push ok)
- **Dev server:** http://localhost:3000 (Vite, porta 3000, HMR ativo)

## O que está implementado

- FASE 2 COMPLETA: Tecnologia (4 categorias, custo triangular), Governos (7 tipos + revolução), Capitulação, Empréstimos (parcela fixa + default), IA avançada (personalidades + calculateMilitaryPower + aiAggression), 13 modos de mapa, Liberty desire, derrota narrativa com stats
- Mapa visual rico (oceano, rosa dos ventos, escudos, banners, estradas) portado da base AI Studio
- Slider de províncias 20–70 (default 30), otimização mobile (matchMedia)
- 71 testes Vitest (9 suites), tsconfig strict, zero `any`, migração de saves v1→v2

## Bugs corrigidos nesta sessão (pegos pelos testes)

1. `checkGameOver` crashava com províncias neutras ≥70% (turnLogic.ts)
2. `canDeclareWar` permitia guerra contra si mesmo (diplomacyLogic.ts)

## Próximo passo

**Auditoria final do ciclo** (docs/implementation/PLANO_IMPLEMENTACAO.md):
- Gerar AUDIT_EVIDENCE.md (evidências por sprint)
- Auditoria em contexto separado → final-audit.md
- Correção pos-auditoria → validação → retrospectiva

## Decisões do usuário (03/08)

- Fase 2 inteira em um ciclo; SEM música ambiente; prioridade = Fase 2; hot-seat = especulativo (fora de escopo)

## Riscos ativos

- Saves antigos quebram quando campos novos forem adicionados → Sprint B resolve com migração
- Dev server cai se o processo WSL morrer → reiniciar com `npx vite --port=3000 --host=0.0.0.0`
