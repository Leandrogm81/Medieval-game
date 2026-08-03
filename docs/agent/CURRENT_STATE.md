# CURRENT_STATE — Reinos Medievais

> **Atualizado:** 03/08/2026 (fim da Sprint A)
> **Formato:** conforme `docs/agent/CURRENT_STATE_TEMPLATE.md`

---

## Estado geral

- **Projeto:** MVP jogável em produção (React 19 + Vite 6 + TS strict + Tailwind v4 + D3 Voronoi)
- **Fluxo do framework:** L1_TRIAGE ✅ → L6_BROWNFIELD ✅ → PRE_PRD ✅ → PRD_MASTER v1.1 ✅ → PRD_REVIEW ✅ → IMPLEMENTATION_PLAN ✅ → Sprint 0 ✅ → **Sprint 00B ✅ → Sprint A ✅** → Sprint B (próxima)
- **Branch:** main (commits 3dc0fc2, 390996d; push ok)
- **Dev server:** http://localhost:3000 (Vite, porta 3000, HMR ativo)

## O que está implementado

- Mapa visual rico (oceano, rosa dos ventos, escudos, banners, estradas) portado da base AI Studio
- Slider de províncias 20–70 (default 30), otimização mobile (matchMedia)
- 39 testes Vitest (smoke, economy, combat, turn, diplomacy, ai)
- tsconfig strict: true, zero `any` no src/
- README real, deps mortas removidas (@google/genai, dotenv, express)

## Bugs corrigidos nesta sessão (pegos pelos testes)

1. `checkGameOver` crashava com províncias neutras ≥70% (turnLogic.ts)
2. `canDeclareWar` permitia guerra contra si mesmo (diplomacyLogic.ts)

## Próximo passo

**Sprint B — Modelo de dados + migração de saves** (docs/implementation/PLANO_IMPLEMENTACAO.md):
- Adicionar a `types.ts`: `techLevels`, `government`, `governmentChangeCooldown`, `vassalLiberty`, `battlesWon`, `realmsDefeated`, `cumulativeGold`, `maxProvincesHeld` (Realm); `originalOwnerId` (Province); `schemaVersion: 2` (GameState)
- Criar `src/logic/saveMigration.ts` (v1→v2 com defaults)
- Chamar migração em useGameController (load + new game)

## Decisões do usuário (03/08)

- Fase 2 inteira em um ciclo; SEM música ambiente; prioridade = Fase 2; hot-seat = especulativo (fora de escopo)

## Riscos ativos

- Saves antigos quebram quando campos novos forem adicionados → Sprint B resolve com migração
- Dev server cai se o processo WSL morrer → reiniciar com `npx vite --port=3000 --host=0.0.0.0`
