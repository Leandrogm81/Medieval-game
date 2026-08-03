# Sprint 00 quebrada em tarefas menores

> **Coder:** 🟢 BARATO para todas as tarefas
> **Subpasta de destino:** `tarefas/sprint-00/`

---

## Tarefa 1 — Verificar ambiente e dependências
- **Objetivo:** Garantir que `npm install` funciona e que os scripts `dev`, `build`, `lint` estão disponíveis.
- **Arquivos prováveis:** `package.json`
- **Passos:**
  1. Executar `npm install` na raiz do projeto
  2. Verificar se há erros de native modules (WSL: `@esbuild/linux-x64`, `@rollup/rollup-linux-x64-gnu`)
  3. Executar `npm run lint` e anotar o resultado (pode ter erros pré-existentes — não corrigir)
  4. Executar `npm run build` e verificar se compila
- **Critérios de aceite:**
  - `npm install` termina sem erros fatais
  - `npm run build` gera `dist/` sem erros
- **Como validar:** `npm install && npm run build`
- **Riscos:** WSL pode exigir instalação manual de natives (`npm install @esbuild/linux-x64 @rollup/rollup-linux-x64-gnu lightningcss-linux-x64-gnu`)

---

## Tarefa 2 — Mapear types.ts
- **Objetivo:** Entender todas as interfaces e tipos existentes antes de adicionar novos.
- **Arquivos prováveis:** `src/types.ts`
- **Passos:**
  1. Ler `src/types.ts` completamente (208 linhas)
  2. Anotar cada interface existente: `Province`, `Realm`, `GameState`, `Army`, `War`, `MarchOrder`, `GameSettings`, etc.
  3. Anotar todos os campos de `Realm` (checar se já existem `vassalOf`, `vassals`, `government`, etc.)
  4. Anotar `ViewMode` atual (6 modos: political, economic, military, diplomatic, resources, trade)
- **Critérios de aceite:** Lista completa de interfaces e campos documentada (pode ser em comentário ou papel)
- **Como validar:** Conferir que a lista bate com o conteúdo real do arquivo
- **Riscos:** Nenhum — é leitura pura

---

## Tarefa 3 — Mapear turnLogic.ts (processEndOfTurn)
- **Objetivo:** Entender o fluxo completo de fim de turno, ponto central de integração.
- **Arquivos prováveis:** `src/logic/turnLogic.ts`
- **Passos:**
  1. Ler `processEndOfTurn` (linha 510-712)
  2. Anotar a ordem exata das operações no loop de realms (linhas 513-696)
  3. Identificar onde ocorre: cálculo de renda, manutenção, reset de AP
  4. Identificar chamadas externas: `processMarchOrders`, `processCoalitions`, `processActiveWars`, `handleRandomEvents`, `checkGameOver`
- **Critérios de aceite:** Fluxograma mental ou anotado da ordem de operações em `processEndOfTurn`
- **Como validar:** Conseguir responder: "onde exatamente devo inserir `generateTechPoints`?"
- **Riscos:** Nenhum

---

## Tarefa 4 — Mapear turnLogic.ts (processActiveWars)
- **Objetivo:** Entender o loop de guerras ativas, onde a capitulação será inserida.
- **Arquivos prováveis:** `src/logic/turnLogic.ts`
- **Passos:**
  1. Ler `processActiveWars` (linhas 403-457)
  2. Anotar: como warScore é atualizado, como exaustão é calculada, como guerras terminam
  3. Identificar o ponto exato onde `checkCapitulation` será inserido (após batalhas, antes da exaustão)
- **Critérios de aceite:** Saber exatamente onde inserir o novo código sem quebrar o fluxo
- **Como validar:** Conseguir desenhar o fluxo: `batalhas → [NOVO: capitulação] → exaustão → fim da guerra`
- **Riscos:** Nenhum

---

## Tarefa 5 — Mapear aiLogic.ts
- **Objetivo:** Entender a IA atual e identificar a função `declareWar` duplicada.
- **Arquivos prováveis:** `src/logic/aiLogic.ts`
- **Passos:**
  1. Ler `aiLogic.ts` completo (119 linhas)
  2. Anotar a função local `declareWar` (linhas 6-31) — esta DEVE ser removida
  3. Anotar `executeAIAttack` (linhas 33-78) — como ela chama `declareWar`
  4. Anotar `processAI` (linhas 80-119) — lógica aleatória atual
- **Critérios de aceite:** Saber que `declareWar` local duplica `diplomacyLogic.ts` e será substituída
- **Como validar:** `grep -n "function declareWar" src/logic/aiLogic.ts` mostra a função local
- **Riscos:** Nenhum

---

## Tarefa 6 — Mapear economyLogic.ts
- **Objetivo:** Entender funções de recrutamento e construção que serão afetadas por tech.
- **Arquivos prováveis:** `src/logic/economyLogic.ts`
- **Passos:**
  1. Ler `getMaxRecruitable` (linhas 300-316) — onde aplicar bônus de recruitment tech
  2. Ler `executeRecruitment` (linhas 365-384) e `executeRecruitmentWithComposition` (330-362)
  3. Ler `assimilateProvince` (linhas 143-157) — onde aplicar bônus de assimilation tech
  4. Ler `executeBuilding` (linhas 386-427)
  5. Verificar se já existem funções de empréstimo (NÃO existem)
- **Critérios de aceite:** Saber exatamente quais funções modificar para integrar tech e loans
- **Como validar:** Lista de funções e linhas anotadas
- **Riscos:** Nenhum

---

## Tarefa 7 — Mapear combatLogic.ts
- **Objetivo:** Entender `resolveCombat` e decidir como integrar bônus de combat tech.
- **Arquivos prováveis:** `src/logic/combatLogic.ts`
- **Passos:**
  1. Ler `resolveCombat` (linhas 45-122)
  2. Anotar assinatura: `(attacker: Army, defender: Army, terrain, defenseLevel, state?, provinceId?)`
  3. Notar que `state` é opcional e usado SOMENTE para efeitos visuais
  4. Decidir: aplicar bônus de tech no CALLER (`processMarchOrders` e `executeAIAttack`) em vez de modificar `resolveCombat`
- **Critérios de aceite:** Decisão de design documentada
- **Como validar:** Saber que `resolveCombat` NÃO será alterado — bônus será aplicado pelos callers
- **Riscos:** Nenhum

---

## Tarefa 8 — Mapear diplomacyLogic.ts (declareWar)
- **Objetivo:** Entender a função canônica `declareWar` que será usada pela IA e vassalos.
- **Arquivos prováveis:** `src/logic/diplomacyLogic.ts`
- **Passos:**
  1. Ler `declareWar` (linhas 574-606)
  2. Anotar assinatura: `(state, fromId, toId) => { newState, callsToResolve }`
  3. Notar que `state` é modificado in-place (não retorna novo objeto, retorna o mesmo com wrapper)
  4. Ler `isWarBetween` (linhas 131-142) — usada para checar guerras existentes
- **Critérios de aceite:** Saber como importar e usar `declareWar` corretamente
- **Como validar:** Conseguir escrever o import: `import { declareWar } from './diplomacyLogic';`
- **Riscos:** Nenhum

---

## Tarefa 9 — Mapear Map.tsx (view modes)
- **Objetivo:** Entender como o mapa renderiza cores e labels por view mode.
- **Arquivos prováveis:** `src/components/Map.tsx`
- **Passos:**
  1. Ler seção de `fillColor` (linhas 253-263) — switch atual: economic, military, default (political)
  2. Ler seção de labels (linhas 298-311) — switch atual: economic, military, default (nome da província)
  3. Ler resources mode (linhas 362-390) — renderização condicional separada
  4. Identificar onde adicionar novos branches
- **Critérios de aceite:** Saber exatamente onde inserir `else if (viewMode === 'population')` etc.
- **Como validar:** Lista de linhas exatas para modificar
- **Riscos:** Nenhum

---

## Tarefa 10 — Mapear App.tsx (keyboard shortcuts)
- **Objetivo:** Entender o handler de teclado e identificar conflitos.
- **Arquivos prováveis:** `src/App.tsx`
- **Passos:**
  1. Ler keydown handler (linhas 229-308)
  2. Anotar atalhos existentes: 1-5, W, A, S, Q, E, F (fullscreen), Espaço
  3. Identificar conflito: `F` = fullscreen vs `F` = military_strength (PRD)
  4. Anotar onde adicionar novos atalhos: 6, 7, 8, 9, 0, G, T
- **Critérios de aceite:** Lista de atalhos atuais + conflitos identificados
- **Como validar:** Saber que `F` precisa ser resolvido antes de implementar
- **Riscos:** Nenhum

---

## Tarefa 11 — Mapear persistence.ts e salvamento
- **Objetivo:** Entender como saves são armazenados e carregados.
- **Arquivos prováveis:** `src/persistence.ts`, `src/hooks/useGameController.ts`
- **Passos:**
  1. Ler `persistence.ts` (141 linhas) — localStorage, sem versionamento
  2. Ler `handleLoad` em `useGameController.ts` (linhas 799-806)
  3. Ler `handleEndTurn` (linhas 97-146) — `persistence.saveAutoSave(next)`
  4. Anotar que `saveAutoSave` faz `JSON.parse(JSON.stringify(state))` — compatível com novos campos
- **Critérios de aceite:** Saber onde injetar `migrateSaveGame` no fluxo de carregamento
- **Como validar:** Saber que `handleLoad` é o ponto único de entrada para carregar saves
- **Riscos:** Nenhum

---

## Tarefa 12 — Mapear modais existentes
- **Objetivo:** Listar todos os modais que precisam de responsividade.
- **Arquivos prováveis:**
  - `src/components/CombatSetupModal.tsx`
  - `src/components/BattleOutcomeModal.tsx`
  - `src/components/TurnResultModal.tsx`
  - `src/components/DiplomacyModal.tsx`
  - `src/components/SaveGameModal.tsx`
  - `src/components/ChronicleModal.tsx`
  - `src/components/GameInstructionsModal.tsx`
  - `src/components/GameEndModal.tsx`
- **Passos:**
  1. Para cada modal, anotar classes CSS usadas no container principal
  2. Verificar se já existe media query para mobile
  3. Anotar largura atual em px
- **Critérios de aceite:** Lista de modais com classes principais anotadas
- **Como validar:** Abrir cada modal no dev server e inspecionar com DevTools
- **Riscos:** Alguns modais podem usar classes Tailwind que não são óbvias no código fonte

---

## Tarefa 13 — Resumo e confirmação
- **Objetivo:** Consolidar tudo que foi mapeado em um resumo.
- **Arquivos prováveis:** Nenhum (documentação mental)
- **Passos:**
  1. Confirmar que todos os 15 arquivos foram lidos
  2. Confirmar que `npm run build` funciona
  3. Confirmar que os pontos de integração estão identificados
- **Critérios de aceite:** Confiança para iniciar o Sprint 01
- **Como validar:** Checklist mental completo
- **Riscos:** Nenhum

---

*Sprint 00 quebrada — 13 tarefas — Reinos Medievais — Fase 2*
