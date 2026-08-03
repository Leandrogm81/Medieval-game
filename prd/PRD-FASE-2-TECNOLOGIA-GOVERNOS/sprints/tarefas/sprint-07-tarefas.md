# Sprint 07 quebrada em tarefas menores — Liberty Desire + Tela de Derrota + Responsividade

> **Coder:** 🟢 BARATO (T1, T3-T12) | 🔴 FORTE (T2, T7, T8)
> **Subpasta de destino:** `tarefas/sprint-07/`

---

## Tarefa 1 — Adicionar campos de tracking em types.ts
- **Objetivo:** Adicionar `vassalLiberty`, `battlesWon`, `realmsDefeated`, `cumulativeGold`, `maxProvincesHeld` em `Realm`.
- **Arquivos prováveis:** `src/types.ts`
- **Passos:**
  1. Em `Realm`, adicionar:
     ```typescript
     vassalLiberty: Record<string, number>;
     battlesWon: number;
     realmsDefeated: number;
     cumulativeGold: number;
     maxProvincesHeld: number;
     ```
  2. `npx tsc --noEmit`
- **Critérios de aceite:** `tsc --noEmit` passa
- **Como validar:** `npx tsc --noEmit`
- **Riscos:** Nenhum

---

## Tarefa 2 — Atualizar mapGeneration.ts com defaults
- **Objetivo:** Novos reinos nascem com tracking zerado.
- **Arquivos prováveis:** `src/logic/mapGeneration.ts`
- **Passos:**
  1. Adicionar em cada novo realm:
     ```typescript
     vassalLiberty: {},
     battlesWon: 0,
     realmsDefeated: 0,
     cumulativeGold: 0,
     maxProvincesHeld: 1,  // começa com pelo menos a capital
     ```
  2. `npm run build`
- **Critérios de aceite:** Novo jogo não quebra por campos undefined
- **Como validar:** `npm run build && npm run dev` — iniciar novo jogo
- **Riscos:** Nenhum

---

## Tarefa 3 — Implementar processVassalLiberty (turnLogic.ts) 🔴 FORTE
- **Objetivo:** Função que atualiza liberty desire de vassalos e dispara rebeliões.
- **Arquivos prováveis:** `src/logic/turnLogic.ts`
- **Passos:**
  1. Criar função `processVassalLiberty(state: GameState): void`
  2. Para cada overlord com vassalos, calcular delta por vassalo:
     - Base: +2
     - +5 se overlord em guerra
     - +10 se `overlord.overextension > 80`
     - +3 se vassalo tem mais províncias que overlord
  3. Aplicar delta com clamp 0-100
  4. Se `liberty >= 100`: rebelião — `vassal.vassalOf = undefined`, remover de `overlord.vassals`, `declareWar(vassalId, overlordId)`
  5. Se `liberty >= 70 && overlord.isPlayer`: notificação
  6. `npx tsc --noEmit`
- **Critérios de aceite:** Liberty sobe/desce conforme fatores, rebelião em 100, código imutável
- **Como validar:** `npm run build && npm run dev` — ter vassalo, passar turnos, ver liberty subir até rebelião
- **Riscos:** `declareWar` de diplomacyLogic modifica state in-place — ok porque state é deep clone. Usar padrão imutável do PRD (seção 9)

---

## Tarefa 4 — Integrar processVassalLiberty em processEndOfTurn
- **Objetivo:** Liberty processado a cada turno.
- **Arquivos prováveis:** `src/logic/turnLogic.ts`
- **Passos:**
  1. Em `processEndOfTurn`, após `processActiveWars` (linha 700) e antes de `newState.turn += 1`:
     ```typescript
     processVassalLiberty(newState);
     ```
  2. `npx tsc --noEmit`
- **Critérios de aceite:** Liberty atualizado a cada turno
- **Como validar:** `npm run build && npm run dev` — ver liberty mudar a cada turno
- **Riscos:** Posição no fluxo — após guerras (para detectar overlord em guerra) e antes do incremento de turno

---

## Tarefa 5 — Adicionar barra de Liberty no HUD
- **Objetivo:** Jogador vê liberty dos vassalos no painel.
- **Arquivos prováveis:** `src/components/HUD.tsx`
- **Passos:**
  1. No painel de vassalos/diplomacia, para cada vassalo:
     - Nome do vassalo
     - Barra de progresso: `width: ${liberty}%`
     - Cor: verde < 50, amarelo 50-69, vermelho >= 70
     - Valor numérico: "85%"
  2. `npm run build`
- **Critérios de aceite:** Liberty visível no HUD
- **Como validar:** `npm run build && npm run dev` — ver HUD com vassalo
- **Riscos:** Se não houver painel de vassalos, adicionar seção simples

---

## Tarefa 6 — Adicionar ação "Apaziguar Vassalo"
- **Objetivo:** Jogador pode gastar gold para reduzir liberty.
- **Arquivos prováveis:** `src/components/HUD.tsx`, `src/hooks/useGameController.ts`
- **Passos:**
  1. Botão "Apaziguar" ao lado de cada vassalo
  2. Custo: 100 gold
  3. Handler: `vassalLiberty[vassalId] = Math.max(0, vassalLiberty[vassalId] - 5)`
  4. Toast: "Vassalo apaziguado. Liberty reduziu em 5."
  5. `npm run build`
- **Critérios de aceite:** Botão funciona, custa gold, reduz liberty
- **Como validar:** `npm run build && npm run dev` — clicar apaziguar, ver liberty cair
- **Riscos:** Handler precisa seguir padrão imutável

---

## Tarefa 7 — Incrementar battlesWon em resolveCombat caller
- **Objetivo:** Contar batalhas vencidas pelo reino.
- **Arquivos prováveis:** `src/logic/turnLogic.ts` (processMarchOrders)
- **Passos:**
  1. Em `processMarchOrders`, no bloco `if (result.won)` (linha 288):
     ```typescript
     const attackerRealm = newState.realms[baseOrder.realmId];
     if (attackerRealm) {
       attackerRealm.battlesWon = (attackerRealm.battlesWon || 0) + 1;
     }
     ```
  2. Em `aiLogic.ts` `executeAIAttack`, mesmo padrão
  3. `npx tsc --noEmit`
- **Critérios de aceite:** `battlesWon` incrementa ao vencer
- **Como validar:** `npm run build && npm run dev` — vencer batalha, ver `battlesWon`
- **Riscos:** `baseOrder.realmId` pode não ser o atacante em todos os casos. Verificar

---

## Tarefa 8 — Incrementar realmsDefeated na eliminação
- **Objetivo:** Contar reinos eliminados pelo jogador.
- **Arquivos prováveis:** `src/logic/turnLogic.ts`
- **Passos:**
  1. Em `executeCapitulation` (Sprint 02) e em `checkGameOver`, onde `delete state.realms[id]`:
     ```typescript
     const winner = state.realms[winnerId];
     if (winner) {
       winner.realmsDefeated = (winner.realmsDefeated || 0) + 1;
     }
     ```
  2. `npx tsc --noEmit`
- **Critérios de aceite:** `realmsDefeated` incrementa ao eliminar reino
- **Como validar:** `npm run build && npm run dev` — eliminar reino, ver contador
- **Riscos:** Múltiplos pontos de eliminação (capitulação, gameOver). Cobrir todos

---

## Tarefa 9 — Incrementar cumulativeGold em processEndOfTurn
- **Objetivo:** Acumular gold total ganho ao longo do jogo.
- **Arquivos prováveis:** `src/logic/turnLogic.ts`
- **Passos:**
  1. No loop de realms, ANTES das deduções de manutenção:
     ```typescript
     realm.cumulativeGold = (realm.cumulativeGold || 0) + realm.gold;
     ```
  2. `npx tsc --noEmit`
- **Critérios de aceite:** `cumulativeGold` cresce a cada turno
- **Como validar:** `npm run build && npm run dev` — jogar turnos, ver `cumulativeGold`
- **Riscos:** Posição importa — somar gold bruto (antes de deduzir manutenção)

---

## Tarefa 10 — Incrementar maxProvincesHeld em processEndOfTurn
- **Objetivo:** Rastrear pico territorial.
- **Arquivos prováveis:** `src/logic/turnLogic.ts`
- **Passos:**
  1. No loop de realms, após processar províncias:
     ```typescript
     const ownedCount = Object.values(newState.provinces).filter(p => p.ownerId === realm.id).length;
     realm.maxProvincesHeld = Math.max(realm.maxProvincesHeld || 0, ownedCount);
     ```
  2. `npx tsc --noEmit`
- **Critérios de aceite:** `maxProvincesHeld` reflete o pico
- **Como validar:** `npm run build && npm run dev` — expandir e perder território, ver pico mantido
- **Riscos:** Nenhum

---

## Tarefa 11 — Reescrever GameEndModal para derrota narrativa 🔴 FORTE
- **Objetivo:** Mostrar tela temática quando o jogador perde.
- **Arquivos prováveis:** `src/components/GameEndModal.tsx`
- **Passos:**
  1. Corrigir `isPlayerWinner` (linha 18): `gameState.gameOver?.winnerId === gameState.playerRealmId`
  2. Adicionar branch `if (!isPlayerWinner)`:
     - 💀 caveira (já existe, linha 39-43)
     - Título: "O FIM DE UMA ERA"
     - Subtítulo: "O reino de {PlayerRealm} caiu."
     - Frase temática aleatória do array:
       - "As crônicas lembrarão seu nome, mas as muralhas já não o protegem."
       - "Até os maiores impérios viram pó. O seu não foi exceção."
       - "A história é escrita pelos vencedores. Hoje, você não segura a pena."
       - "Seu castelo resistiu a incontáveis cercos, mas nenhum reino é eterno."
     - Grade de estatísticas:
       - Turnos: `gameState.turn`
       - Províncias máximas: `playerRealm.maxProvincesHeld`
       - Batalhas vencidas: `playerRealm.battlesWon`
       - Reinos derrotados: `playerRealm.realmsDefeated`
       - Ouro acumulado: `playerRealm.cumulativeGold`
     - Botões: "Tentar Novamente" e "Menu" (já existem, linhas 70-82)
  3. `npm run build`
- **Critérios de aceite:** Tela de derrota mostra estatísticas reais, frase aleatória, botões funcionam
- **Como validar:** `npm run build && npm run dev` — perder jogo, ver tela
- **Riscos:** Não quebrar o branch de vitória existente. Usar `if/else` claro

---

## Tarefa 12 — Adicionar media query base em index.css
- **Objetivo:** Criar classes reutilizáveis para responsividade.
- **Arquivos prováveis:** `src/index.css`
- **Passos:**
  1. Adicionar:
     ```css
     @media (max-width: 768px) {
       .modal-responsive {
         width: 95vw !important;
         max-height: 90vh !important;
         overflow-y: auto !important;
         padding: 0.75rem !important;
         border-radius: 0.5rem !important;
       }
       .btn-touch {
         min-height: 48px;
         min-width: 48px;
       }
     }
     ```
  2. `npm run build`
- **Critérios de aceite:** Classes disponíveis para uso nos modais
- **Como validar:** `npm run build && npm run dev` — verificar no DevTools que classes existem
- **Riscos:** `!important` pode conflitar com Tailwind. Testar

---

## Tarefa 13 — Aplicar responsividade nos 8 modais
- **Objetivo:** Todos os modais funcionam em mobile (375px).
- **Arquivos prováveis:** 8 arquivos de modal em `src/components/`
- **Passos:**
  1. Para CADA modal, adicionar classes `modal-responsive` no container principal e `btn-touch` nos botões:
     - `CombatSetupModal.tsx`
     - `BattleOutcomeModal.tsx`
     - `TurnResultModal.tsx`
     - `DiplomacyModal.tsx`
     - `SaveGameModal.tsx`
     - `ChronicleModal.tsx`
     - `GameInstructionsModal.tsx`
     - `GameEndModal.tsx`
  2. Ajustes individuais:
     - `CombatSetupModal`: sliders com `min-height: 48px`
     - `TurnResultModal`: cards em coluna (flex-col)
     - `DiplomacyModal`: lista scrollável
     - `GameInstructionsModal`: accordion (opcional, pode só scroll)
  3. `npm run build`
- **Critérios de aceite:** Nenhum modal tem overflow horizontal em 375px. Touch targets ≥ 48px
- **Como validar:** `npm run build && npm run dev` — Chrome DevTools 375px, abrir cada modal
- **Riscos:** Tailwind v4 pode ter classes diferentes. Ajustar conforme necessário

---

## Tarefa 14 — Validação final do Sprint 07
- **Objetivo:** Testar liberty, derrota e responsividade.
- **Arquivos prováveis:** Nenhum
- **Passos:**
  1. `npm run lint && npm run build`
  2. `npm run dev` — testar:
     - Ter vassalo → ver liberty subir → rebelião em 100
     - Apaziguar vassalo → liberty diminui
     - Perder jogo → tela de derrota narrativa com estatísticas
     - 375px → todos os 8 modais abrem sem overflow
     - Touch targets ≥ 48px
     - Tracking: battlesWon, realmsDefeated, cumulativeGold, maxProvincesHeld
- **Critérios de aceite:** Checklist completo
- **Como validar:** Executar comandos e teste manual
- **Riscos:** Nenhum

---

*Sprint 07 quebrada — 14 tarefas — Reinos Medievais — Fase 2*
