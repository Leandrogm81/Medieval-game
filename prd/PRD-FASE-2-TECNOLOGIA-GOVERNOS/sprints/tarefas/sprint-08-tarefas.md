# Sprint 08 quebrada em tarefas menores — Migração de Save + Testes de Integração

> **Coder:** 🟢 BARATO para TODAS as tarefas
> **Subpasta de destino:** `tarefas/sprint-08/`

---

## Tarefa 1 — Adicionar schemaVersion em GameState (types.ts)
- **Objetivo:** Versionar o schema de save para migração futura.
- **Arquivos prováveis:** `src/types.ts`
- **Passos:**
  1. Em `GameState`, adicionar como primeiro campo:
     ```typescript
     schemaVersion: number;
     ```
  2. `npx tsc --noEmit`
- **Critérios de aceite:** `tsc --noEmit` passa
- **Como validar:** `npx tsc --noEmit`
- **Riscos:** Todos os lugares que criam `GameState` precisam setar `schemaVersion: 2`

---

## Tarefa 2 — Setar schemaVersion em mapGeneration.ts
- **Objetivo:** Novos jogos nascem com versão correta.
- **Arquivos prováveis:** `src/logic/mapGeneration.ts`
- **Passos:**
  1. No retorno de `generateInitialState`, adicionar `schemaVersion: 2`
  2. `npm run build`
- **Critérios de aceite:** Novo jogo tem `schemaVersion: 2`
- **Como validar:** `npm run build && npm run dev` — iniciar novo jogo, ver `gameState.schemaVersion`
- **Riscos:** Nenhum

---

## Tarefa 3 — Criar saveMigration.ts
- **Objetivo:** Função que migra saves da Fase 1 para Fase 2.
- **Arquivos prováveis:** `src/logic/saveMigration.ts` (CRIAR)
- **Passos:**
  1. Criar arquivo
  2. Implementar `migrateSaveGame(data: any): GameState`:
     - Se `!data.schemaVersion || data.schemaVersion < 2`: migrar
     - Para cada realm: aplicar defaults com `??`:
       - `techPoints: 0`, `techLevels: { movement:0, assimilation:0, recruitment:0, combat:0 }`
       - `government: 'monarchy'`, `governmentChangeCooldown: 0`
       - `vassalLiberty: {}`, `loans: []`
       - `battlesWon: 0`, `realmsDefeated: 0`, `cumulativeGold: 0`
       - `maxProvincesHeld`: contar províncias atuais
     - Para cada província: `originalOwnerId = undefined`
     - `data.schemaVersion = 2`
     - Retornar `data as GameState`
  3. `npx tsc --noEmit`
- **Critérios de aceite:** Save da Fase 1 carrega sem erros com defaults aplicados
- **Como validar:** `npx tsc --noEmit`
- **Riscos:** Dados podem ter `null` em vez de `undefined`. `??` cobre ambos

---

## Tarefa 4 — Integrar migrateSaveGame em handleLoad (useGameController.ts)
- **Objetivo:** Todo save carregado passa pela migração.
- **Arquivos prováveis:** `src/hooks/useGameController.ts`
- **Passos:**
  1. Adicionar import: `import { migrateSaveGame } from '../logic/saveMigration';`
  2. Em `handleLoad` (linha 799), modificar:
     ```typescript
     const rawData = persistence.loadSave(id);
     if (rawData) {
       const migrated = migrateSaveGame(rawData);
       setGameState(migrated);
       ui.setShowMenu(false);
       ui.showToast("Partida carregada.", "info");
     }
     ```
  3. `npx tsc --noEmit`
- **Critérios de aceite:** Save da Fase 1 carrega com migração automática
- **Como validar:** `npm run build && npm run dev` — carregar save antigo, verificar que não quebra
- **Riscos:** Se `loadSave` retorna `GameState` (tipado) e não `any`, pode precisar de cast

---

## Tarefa 5 — Teste: lint e build limpos
- **Objetivo:** Garantir que o projeto compila sem erros.
- **Arquivos prováveis:** Nenhum
- **Passos:**
  1. `npm run lint` — deve passar limpo
  2. `npm run build` — deve gerar `dist/` sem erros
  3. Se houver erros, corrigir um por um
- **Critérios de aceite:** Zero erros de lint e build
- **Como validar:** `npm run lint && npm run build`
- **Riscos:** Erros acumulados de sprints anteriores. Corrigir antes de prosseguir

---

## Tarefa 6 — Teste: novo jogo
- **Objetivo:** Verificar que um jogo novo funciona com todos os sistemas.
- **Arquivos prováveis:** Nenhum
- **Passos:**
  1. `npm run dev`
  2. Iniciar novo jogo
  3. Verificar: `techPoints: 0`, `government: 'monarchy'`, `loans: []`, `schemaVersion: 2`
  4. Jogar 5 turnos: tech points sobem, economia funciona, IA age
- **Critérios de aceite:** Jogo novo funcional, sem erros no console
- **Como validar:** Console do browser sem erros
- **Riscos:** Nenhum

---

## Tarefa 7 — Teste: tecnologia
- **Objetivo:** Verificar fluxo completo de tecnologia.
- **Arquivos prováveis:** Nenhum
- **Passos:**
  1. Construir workshops → próximo turno techPoints aumentam
  2. Alocar ponto → nível sobe, pontos deduzidos
  3. Verificar AP aumentou (movement)
  4. Verificar pode recrutar mais (recruitment)
- **Critérios de aceite:** Sistema de tech funcional
- **Como validar:** Teste manual no jogo
- **Riscos:** Nenhum

---

## Tarefa 8 — Teste: governos
- **Objetivo:** Verificar todos os 7 governos.
- **Arquivos prováveis:** Nenhum
- **Passos:**
  1. Abrir GovernmentModal → 7 governos listados
  2. Mudar para Republic → gold income +5%
  3. Mudar para Despotism → ataque +15%
  4. Verificar cooldown (20 turnos)
  5. Causar revolução (estabilidade < 20 em >50% províncias)
- **Critérios de aceite:** Todos os governos funcionam
- **Como validar:** Teste manual
- **Riscos:** Revolução pode ser difícil de testar (10% chance). Forçar via console

---

## Tarefa 9 — Teste: capitulação
- **Objetivo:** Verificar fluxo de capitulação.
- **Arquivos prováveis:** Nenhum
- **Passos:**
  1. Declarar guerra contra reino pequeno
  2. Conquistar >60% das províncias
  3. Ver capitulação no próximo turno
  4. Verificar vassalagem ou eliminação
  5. Verificar `originalOwnerId` limpo
- **Critérios de aceite:** Capitulação funciona
- **Como validar:** Teste manual
- **Riscos:** Nenhum

---

## Tarefa 10 — Teste: empréstimos
- **Objetivo:** Verificar fluxo de empréstimos.
- **Arquivos prováveis:** Nenhum
- **Passos:**
  1. Contrair empréstimo → gold aparece
  2. Passar turnos → parcelas descontadas
  3. Após 10 turnos → loan removido
  4. Default: gastar todo gold → penalidades aplicadas
- **Critérios de aceite:** Empréstimos funcionam
- **Como validar:** Teste manual
- **Riscos:** Nenhum

---

## Tarefa 11 — Teste: IA
- **Objetivo:** Verificar IA age por personalidade.
- **Arquivos prováveis:** Nenhum
- **Passos:**
  1. Observar IA Expansionist atacar com vantagem
  2. Observar IA Defensive construir/fortificar
  3. Verificar `aiLogic.ts` sem `declareWar` local
  4. Verificar `calculateMilitaryPower` sem NaN
- **Critérios de aceite:** IA age distintamente
- **Como validar:** Teste manual observando logs
- **Riscos:** Comportamento da IA pode ser sutil. Verificar logs do jogo

---

## Tarefa 12 — Teste: música
- **Objetivo:** Verificar fluxo de música.
- **Arquivos prováveis:** Nenhum
- **Passos:**
  1. Menu → música toca
  2. Iniciar jogo → crossfade para paz
  3. Declarar guerra → crossfade para guerra
  4. Toggle desliga → silêncio
  5. Toggle liga → volta
- **Critérios de aceite:** Música funciona
- **Como validar:** Teste manual auditivo
- **Riscos:** Autoplay policy. Testar com e sem interação prévia

---

## Tarefa 13 — Teste: liberty e derrota
- **Objetivo:** Verificar liberty de vassalos e tela de derrota.
- **Arquivos prováveis:** Nenhum
- **Passos:**
  1. Ter vassalo → ver liberty subir → rebelião
  2. Apaziguar vassalo → liberty diminui
  3. Perder jogo → tela de derrota narrativa
  4. Estatísticas: battlesWon, realmsDefeated, cumulativeGold, maxProvincesHeld
- **Critérios de aceite:** Liberty e derrota funcionam
- **Como validar:** Teste manual
- **Riscos:** Perder o jogo pode ser demorado. Forçar via console

---

## Tarefa 14 — Teste: modos de mapa
- **Objetivo:** Verificar 13 modos de mapa.
- **Arquivos prováveis:** Nenhum
- **Passos:**
  1. Pressionar cada atalho 1-9, 0, T, G, (Shift+)F
  2. Verificar cor e label de cada modo
  3. Verificar estabilidade: cores corretas
  4. Verificar performance (sem lag)
- **Critérios de aceite:** 13 modos funcionais
- **Como validar:** Teste manual
- **Riscos:** Nenhum

---

## Tarefa 15 — Teste: responsividade
- **Objetivo:** Verificar modais em mobile.
- **Arquivos prováveis:** Nenhum
- **Passos:**
  1. Chrome DevTools 375px
  2. Abrir cada modal:
     - CombatSetupModal
     - BattleOutcomeModal
     - TurnResultModal
     - DiplomacyModal
     - SaveGameModal
     - ChronicleModal
     - GameInstructionsModal
     - GameEndModal
  3. Verificar: sem overflow horizontal, botões ≥ 48px, scroll funciona
- **Critérios de aceite:** 8 modais responsivos
- **Como validar:** Teste manual
- **Riscos:** Nenhum

---

## Tarefa 16 — Teste: migração de save
- **Objetivo:** Verificar que save da Fase 1 carrega.
- **Arquivos prováveis:** Nenhum
- **Passos:**
  1. Ter um save da Fase 1 no localStorage
  2. Carregar → verificar que não quebra
  3. Verificar defaults: `techPoints: 0`, `government: 'monarchy'`, etc.
  4. Salvar e recarregar → `schemaVersion: 2`
- **Critérios de aceite:** Migração funciona
- **Como validar:** Teste manual
- **Riscos:** Pode não ter save da Fase 1 disponível. Criar um manualmente

---

## Tarefa 17 — Teste: regressões da Fase 1
- **Objetivo:** Garantir que nada quebrou.
- **Arquivos prováveis:** Nenhum
- **Passos:**
  1. Recrutamento funciona
  2. Construção funciona
  3. Marcha funciona
  4. Ataque funciona
  5. Diplomacia funciona (aliança, NAP, tributo, insulto)
  6. Salvamento e carregamento funcionam
  7. Vitória (conquista) funciona
  8. `maxActionPoints` nunca < 2
  9. `calculateMilitaryPower` sem NaN/Infinity
- **Critérios de aceite:** Funcionalidades da Fase 1 preservadas
- **Como validar:** Teste manual
- **Riscos:** Regressões sutis. Testar cada funcionalidade

---

## Tarefa 18 — Validação final do Sprint 08
- **Objetivo:** Confirmação de que a Fase 2 está completa.
- **Arquivos prováveis:** Nenhum
- **Passos:**
  1. `npm run lint` — limpo
  2. `npm run build` — sem erros
  3. `npm run dev` — revisitar checklist completo
- **Critérios de aceite:** PRD da Fase 2 100% implementado e funcional
- **Como validar:** `npm run lint && npm run build && npm run dev`
- **Riscos:** Nenhum

---

*Sprint 08 quebrada — 18 tarefas — Reinos Medievais — Fase 2*
