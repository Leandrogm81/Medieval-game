# AUDIT_EVIDENCE — Ciclo Fase 2 (Sprints 00B → H + Pendências)

> **Data:** 03/08/2026
> **Escopo:** Sprints 00B, A, B, C, D, E, F, G, H + pendências P1-P5
> **Método:** evidências coletadas durante a execução (commits, testes, builds, checagens locais)

---

## Deliverables

| Item | Requisito | Evidência | Status |
|---|---|---|---|
| Fundação de testes (Sprint 00B) | Suite Vitest com cobertura de `src/logic/` | `src/test/*.test.ts` (9 suites) + vitest.config.ts; commit 3dc0fc2 | Confirmado |
| 2 bugs reais corrigidos (Sprint 00B) | Sem crashes em partidas longas; sem guerra contra si mesmo | `checkGameOver` skip 'neutral' (turnLogic); `canDeclareWar` valida fromId!==toId; testes em smoke/diplomacy | Confirmado |
| Strict mode + zero `any` (Sprint A) | tsconfig strict: true; src/ sem `: any`/`as any` | `npx tsc --noEmit` exit 0 (rodado em todas as sprints); grep `as any` = 0; commit 390996d | Confirmado |
| Deps mortas removidas (Sprint A) | Sem @google/genai/dotenv/express | `npm uninstall` executado; `package.json` sem as 4; vite.config.ts simplificado | Confirmado |
| Modelo de dados Fase 2 (Sprint B) | techLevels, government, vassalLiberty, stats, originalOwnerId, schemaVersion | `types.ts` campos presentes; mapGeneration inicializa; commit 79fc032 | Confirmado |
| Migração de saves v1→v2 (Sprint B) | Saves antigos carregam sem quebrar | `saveMigration.ts` + integração em persistence.loadSave/loadAutoSave; 4 testes | Confirmado |
| Tecnologia (Sprint C) | Custo triangular, 4 categorias, bônus aplicados | `technologyLogic.ts`; turnLogic/economyLogic/combate integrados; TechnologyModal; commit ffa60a0 | Confirmado |
| Governos (Sprint D) | 7 tipos com bônus/penalidades; reforma com custo/cooldown; revolução | `governmentLogic.ts`; GovernmentModal; commit 9168035 | Confirmado |
| Capitulação (Sprint E) | 3 condições; ceder 50%; vassalo/eliminação | `capitulationLogic.ts`; inserida em processActiveWars (após scores, antes exaustão); commit 4e0ab65 | Confirmado |
| Empréstimos (Sprint F) | Parcela ceil(amount*1.15/10); default -10 rel/-5 loyalty | `financeLogic.ts` reescrito; 4 testes | Confirmado |
| IA avançada (Sprint F) | calculateMilitaryPower; personalidades; aiAggression | `aiLogic.ts` (shouldAIAttack, processAIDiplomacy, processAILoans); slider no menu; commit efd158f | Confirmado |
| 13 modos de mapa (Sprint G) | +7 modos; hotkeys; mobile | `ViewMode` expandido; Map.tsx heatmaps; hotkeys 6-9/0/G/V; botões HUD; commit 326fb63 | Confirmado |
| Liberty desire (Sprint H) | Fatores +/-, rebelião ≥100, aviso ≥70 | `vassalLogic.ts`; integrado em processEndOfTurn; commit a0eb3d9 | Confirmado |
| Derrota narrativa (Sprint H) | Detecção de derrota do jogador; stats; frases | checkGameOver derrota; GameEndModal reescrito; tracking battlesWon/realmsDefeated/cumulativeGold/maxProvincesHeld | Confirmado |
| P1: empréstimo do jogador | Botão HUD + validação | `handleTakeLoan` + bloco "Dívidas" no HUD; commit 70699b6 | Confirmado |
| P2: apaziguar vassalo + barra liberty | Ação diplomática -5 liberty; barra visual | `appeaseVassal`/`canAppeaseVassal` (diplomacyLogic); barra Liberty Desire na DiplomacyModal | Confirmado |
| P3: decay pós-guerra | -20 ao longo de 5 turnos (não imediato) | `postWarInstability` (Province) com decay -4/turno; 2 testes | Confirmado |
| P5: lifecycle originalOwnerId | Limpo em paz por exaustão | Filtro em processActiveWars; 1 teste | Confirmado |
| P4: touch targets | Botões ≥44px nos modais | min-h-[44px] em DiplomacyModal/Technology/Government; modais w-full+max-h scroll | Parcial (teste em 375px real não executado — verificado por inspeção de classes) |

## Files

| Arquivo | Tipo alteração | Relevância | Evidência |
|---|---|---|---|
| `src/logic/technologyLogic.ts` | criado | Alta — sistema de tecnologia | presente no commit ffa60a0 |
| `src/logic/governmentLogic.ts` | criado | Alta — 7 governos | commit 9168035 |
| `src/logic/capitulationLogic.ts` | criado | Alta — capitulação | commit 4e0ab65 |
| `src/logic/vassalLogic.ts` | criado | Alta — liberty desire | commit a0eb3d9 |
| `src/logic/financeLogic.ts` | alterado | Alta — reescrito (parcela/default) | commit efd158f |
| `src/logic/aiLogic.ts` | alterado | Alta — IA avançada | commit efd158f |
| `src/logic/turnLogic.ts` | alterado | Alta — integrações (tech, gov, capitulação, vassalos, decay, limpeza) | commits C-H + 70699b6 |
| `src/logic/diplomacyLogic.ts` | alterado | Alta — appeaseVassal + fix canDeclareWar | 00B + 70699b6 |
| `src/logic/saveMigration.ts` | criado | Média — migração v1→v2 | commit 79fc032 |
| `src/types.ts` | alterado | Alta — schema Fase 2 | commit 79fc032 |
| `src/components/TechnologyModal.tsx` | criado | Média — UI tech | ffa60a0 |
| `src/components/GovernmentModal.tsx` | criado | Média — UI governos | 9168035 |
| `src/components/GameEndModal.tsx` | alterado | Média — derrota narrativa | a0eb3d9 |
| `src/components/HUD.tsx` | alterado | Alta — botões tech/governo/modos/empréstimo | C-H + 70699b6 |
| `src/components/DiplomacyModal.tsx` | alterado | Alta — barra liberty + apaziguar + touch | 70699b6 |
| `src/components/Map.tsx` | alterado | Alta — 7 modos novos | 326fb63 |
| `src/App.tsx` | alterado | Média — hotkeys, slider agressividade, modais | F/G + 70699b6 |
| `src/test/fase2.test.ts` | criado | Alta — 33 testes Fase 2 | 227a1e1 + 70699b6 |
| `vitest.config.ts` | criado | Média — infra de teste | 3dc0fc2 |
| `docs/implementation/test-plan.md` | criado/alterado | Média — 9 suites documentadas | 227a1e1 |

## Commits

| Commit | Mensagem | Relevância | Observação |
|---|---|---|---|
| 3dc0fc2 | Sprint 00B — fundação de testes + 2 bugs | Alta | 43 testes iniciais |
| 390996d | Sprint A — strict, zero any, README, deps | Alta | CRLF→LF no diff |
| 79fc032 | Sprint B — modelo + migração | Alta | schema v2 |
| ffa60a0 | Sprint C — tecnologia | Alta | |
| 9168035 | Sprint D — governos | Alta | |
| 4e0ab65 | Sprint E — capitulação | Alta | |
| efd158f | Sprint F — empréstimos + IA | Alta | |
| 326fb63 | Sprint G — 13 modos | Média | F→V por conflito fullscreen |
| a0eb3d9 | Sprint H — liberty + derrota | Alta | |
| 227a1e1 | testes finais Fase 2 | Alta | 71 testes |
| 70699b6 | pendentes P1-P5 | Alta | 76 testes |

## Tests

| Tipo teste | O que testado | Resultado | Evidência | Status |
|---|---|---|---|---|
| Unit (smoke) | geração + 30 turnos + march | 3/3 pass | `npx vitest run` 76 passed | Confirmado |
| Unit (economy) | recrutamento/custos/limites | 7/7 pass | idem | Confirmado |
| Unit (combat) | combate determinístico/terreno/retirada | 8/8 pass | idem | Confirmado |
| Unit (turn) | findPath/visibilidade/game over | 7/7 pass | idem | Confirmado |
| Unit (diplomacy) | guerra/alianças/NAPs/tributos/imutabilidade | 9/9 pass | idem | Confirmado |
| Unit (ai) | processAI estável/regras jogador | 5/5 pass | idem | Confirmado |
| Unit (saveMigration) | migração v1→v2 | 4/4 pass | idem | Confirmado |
| Unit (fase2) | tech/governos/capitulação/liberty/empréstimos/IA + P2/P3/P5 | 33/33 pass | idem | Confirmado |
| Estabilidade | suites rodadas múltiplas vezes (fase2 3x, smoke 3x) | sem flakiness após calibração | loops de execução | Confirmado |

## Build

| Comando | Resultado | Evidência | Status |
|---|---|---|---|
| `npx tsc --noEmit` | sucesso (0 erros, strict) | executado em cada sprint | Confirmado |
| `npm run build` | sucesso (1m17s, só warning de chunk size) | 22:05:03 | Confirmado |
| `curl localhost:3000` | HTTP 200 | checagens repetidas | Confirmado |
| `npm audit` (via install) | 0 vulnerabilidades | saída do npm install | Confirmado |

---

## Não verificado / Parcial

1. **RF-02-07 em device real:** modais verificados por inspeção de classes (w-full, max-h, min-h-[44px]) — falta teste em 375px real (Parcial).
2. **RNF-05 (70 províncias sem lag):** validação visual feita na Sprint 0 do mapa; sem benchmark formal após os 7 modos novos (Parcial).
3. **Hotkey F:** divergência documentada (F=fullscreen Fase 1; V=força militar) — decisão registrada no DECISIONS.
