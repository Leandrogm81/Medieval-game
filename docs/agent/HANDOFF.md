# HANDOFF — Reinos Medievais

> **Data:** 03/08/2026
> **De:** Sessão Hermes (ciclo Fase 2)
> **Para:** Próxima sessão/agente
> **Formato:** conforme `docs/agent/HANDOFF_TEMPLATE.md`

---

## 1. Onde estamos

Fluxo L1–L8 em andamento. Concluídos: TRIAGE, Brownfield, Pre-PRD, PRD v1.1 (aprovado com ressalvas), Revisão, Plano de Implementação, Sprint 0, **Sprint 00B (testes)**, **Sprint A (limpeza)**. Working tree limpo, push feito (main: 390996d).

**Próxima etapa:** Sprint B — modelo de dados + migração de saves. Ver `docs/implementation/PLANO_IMPLEMENTACAO.md` para o plano completo (Sprints B–H + auditoria).

## 2. Contexto essencial para continuar

- **Stack:** React 19 + Vite 6 + TS (strict) + Tailwind v4 + D3 + Vitest. Node 22 no WSL.
- **Rodar:** `npx vite --port=3000 --host=0.0.0.0` (dev server); `npm test`; `npm run build`.
- **Regras:** `docs/agent/agent-operating-rules.md` (hierarquia de docs, evidência antes de conclusão, imutabilidade de estado via deep clone).
- **MAESTRO:** `.agents/rules/MAESTRO.md` — 12 regras kernel (deep clone, lógica pura em src/logic/, strict typing, minimal change).

## 3. Armadilhas conhecidas (não repetir)

1. **`declareWar` MUTA o estado** — o chamador deve passar deep clone (C-02 do PRD_REVIEW). Teste de imutabilidade existe em diplomacy.test.ts.
2. **Não existe `processActiveWars`** — lógica de guerras é inline em `processEndOfTurn` (turnLogic.ts ~420-472). Capitulação (Sprint E) entra lá.
3. **Não mockar Math.random antes de `makeState()`** — quebra a geração Voronoi (ver test-plan.md).
4. **HMR stale do Vite** — após mudanças estruturais, reiniciar em porta nova se o bundle não atualizar.
5. **Saves antigos não têm campos novos** — Sprint B (migração) é pré-requisito de qualquer campo novo.

## 4. Decisões pendentes / abertas

- Nenhuma em aberto para o usuário — as 4 decisões do ciclo foram tomadas (Fase 2 inteira, sem música, prioridade Fase 2, hot-seat fora).
- Backlog Fase 3 (religiões, maravilhas, editor) só após Fase 2 + auditoria.

## 5. Como validar entrega

- `npm test` verde (39 testes)
- `npx tsc --noEmit` limpo
- `npm run build` ok
- Dev server HTTP 200 em localhost:3000
- Registrar no CHANGELOG + DECISIONS (regras operacionais seção 3)
