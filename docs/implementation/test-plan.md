# Plano de Testes — Reinos Medievais

> **Data:** 03/08/2026
> **Status:** ✅ Ativo (Sprint 00B concluída)
> **Framework:** Vitest 4.x + node environment

---

## Como rodar

```bash
npm test                 # suite completa (uma vez)
npm run test:watch       # modo watch
npm run test:coverage    # cobertura (v8)
npm run lint             # typecheck (tsc --noEmit, strict)
npm run build            # build de produção
```

## Suites (src/test/)

| Arquivo | O que cobre | Testes |
|---|---|---|
| `helpers.ts` | Factories de estado (makeState/makeSettings) — não é suite | — |
| `smoke.test.ts` | Geração de estado, 30 turnos completos (IA + fim de turno), march orders | 3 |
| `economy.test.ts` | Recrutamento, custos, limites, construção, normalização | 7 |
| `combat.test.ts` | Combate determinístico (Math.random fixo), terreno, tech, defesa, retirada, imutabilidade | 8 |
| `turn.test.ts` | findPath (marcha, scouts, inimigos), visibilidade, game over | 7 |
| `diplomacy.test.ts` | Guerra (imutabilidade!), alianças, NAPs, relações, tributos, flavor | 9 |
| `ai.test.ts` | processAI sem crash, não age pelo jogador, estabilidade | 5 |
| `saveMigration.test.ts` | Migração v1→v2 (defaults, idempotência, inválido, maxProvincesHeld) | 4 |
| `fase2.test.ts` | Tech (custo triangular, alocação), Governos (7 tipos, cooldown, force), Capitulação (3 condições, vassalo/eliminação), Liberty (rebelião), Empréstimos (parcela, default), IA (military power) | 28 |

**Total: 71 testes.**

## Convenções importantes

1. **Determinismo em combate:** `resolveCombat` usa `Math.random()`. Testes fixam com `vi.spyOn(Math, 'random').mockReturnValue(0.5)` (fator exatamente 1.0). Restaurar com `vi.restoreAllMocks()` no afterEach.
2. **NUNCA mockar Math.random antes de `makeState()`** — a geração do mapa depende de random para pontos Voronoi; mockar antes gera polígonos inválidos.
3. **`declareWar` muta o clone** (convenção C-02): nos testes, sempre `JSON.parse(JSON.stringify(state))` antes de chamar; verificar que o original ficou intacto.
4. **Estado com 4 reinos / 25 províncias** via `makeState()`; não assumir existência de províncias neutras (nem sempre há).

## Histórico de bugs pegos pelos testes

| Data | Bug | Arquivo corrigido |
|---|---|---|
| 03/08/2026 | `checkGameOver` crashava ('reading name') quando províncias neutras ≥70% (reino eliminado) | `turnLogic.ts` |
| 03/08/2026 | `canDeclareWar` permitia guerra contra si mesmo (sem validação fromId===toId) | `diplomacyLogic.ts` |

## Próximos passos (Sprint 00B do plano)

- Testes de `financeLogic` (empréstimos) e `techLogic` quando UI for integrada (Sprint C/F)
- Testes de `saveMigration` (Sprint B)
- Testes de capitulação e governos (Sprints D/E)
