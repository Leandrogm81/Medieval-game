# Guia de Dificuldade — Fase 2: Tecnologia, Governos e Profundidade Estratégica

> Use este guia para decidir qual modelo de coder usar em cada sprint/tarefa.
> **Barato** = coder simples (ex: haiku, gemini-flash, deepseek-v3-small)
> **Forte** = coder avançado (ex: sonnet, opus, deepseek-v4, gpt-4o)

---

## Classificação de Dificuldade

| Nível | Símbolo | Descrição | Coder |
|-------|---------|-----------|-------|
| 🟢 Fácil | E | Funções puras, CSS, tipos, CRUD simples. 1-2 arquivos. | Barato |
| 🟡 Médio | M | Integração entre 2-3 arquivos, lógica com condicionais, UI simples. | Barato com supervisão |
| 🟠 Difícil | D | Refatoração de fluxo existente, UI complexa, múltiplos call sites. | Forte |
| 🔴 Muito Difícil | MD | Reescrita de função central, alteração de arquitetura, integração global. | Forte obrigatório |

---

## Tabela Geral de Sprints

| Sprint | Tarefas | Nível Máximo | Coder | Tempo |
|--------|---------|-------------|-------|-------|
| 00 | Preparação (leitura) | 🟢 Fácil | Barato | 0.5d |
| 01 | Tecnologia | 🔴 Muito Difícil | **Forte** | 3.5d |
| 02 | Capitulação | 🟠 Difícil | **Forte** | 1.5d |
| 03 | Governos | 🔴 Muito Difícil | **Forte** | 2.5d |
| 04 | Modos de Mapa | 🟡 Médio | Barato | 2.0d |
| 05 | Empréstimos + IA | 🔴 Muito Difícil | **Forte** | 3.5d |
| 06 | Música Ambiente | 🟡 Médio | Barato | 4.0d |
| 07 | Liberty + Derrota + Responsividade | 🔴 Muito Difícil | **Forte** | 3.5d |
| 08 | Migração + Testes | 🟡 Médio | Barato | 2.0d |

---

## Detalhamento por Tarefa

### Sprint 00 — Preparação e leitura do projeto

| Tarefa | Nível | Coder |
|--------|-------|-------|
| Inspecionar 15 arquivos | 🟢 Fácil | Barato |
| Verificar dependências (npm install, tsc, build) | 🟢 Fácil | Barato |

**Resumo:** Sprint inteiramente de leitura. Use coder barato.

---

### Sprint 01 — Tipos Base + Sistema de Tecnologia

| # | Tarefa | Nível | Coder | Por quê |
|---|--------|-------|-------|---------|
| T1 | Adicionar `TechLevels` em `types.ts` | 🟢 Fácil | Barato | Só adicionar interfaces |
| T2 | Criar `technologyLogic.ts` (funções puras) | 🟡 Médio | Barato | Matemática pura, sem side effects |
| T3 | Integrar `generateTechPoints` em `turnLogic.ts` | 🟡 Médio | Barato | Adicionar 1 chamada em ponto fixo |
| T4 | Integrar bônus de recrutamento em `economyLogic.ts` | 🟡 Médio | Barato | Multiplicar por fator em 1 função |
| T5 | Integrar bônus de combat em `combatLogic.ts` | 🟠 Difícil | **Forte** | `resolveCombat` não recebe `Realm`. Decidir refactor vs aplicar no caller |
| T6 | Integrar bônus de AP em `turnLogic.ts` | 🟡 Médio | Barato | Fórmula simples no reset de AP |
| T7 | Criar `TechnologyModal.tsx` | 🟠 Difícil | **Forte** | UI complexa com 4 categorias, barras, interações |
| T8 | Integrar modal no HUD e App | 🟢 Fácil | Barato | Adicionar botão e import |
| T9 | Bônus de assimilation no custo | 🟢 Fácil | Barato | Ajustar multiplicador |
| T10 | +1 loyalty ao subir tech | 🟡 Médio | Barato | Loop sobre províncias |

**Resumo Sprint 01:** Use coder FORTE para T5 e T7. As demais 8 tarefas podem ser feitas com coder barato.

---

### Sprint 02 — Capitulação (Auto-Surrender)

| # | Tarefa | Nível | Coder | Por quê |
|---|--------|-------|-------|---------|
| T1 | Adicionar `originalOwnerId` e `CapitulationResult` em `types.ts` | 🟢 Fácil | Barato | Só adicionar campo e interface |
| T2 | Setar `originalOwnerId` ao conquistar | 🟡 Médio | Barato | Salvar valor antes de sobrescrever |
| T3 | Limpar `originalOwnerId` ao fim da guerra | 🟡 Médio | Barato | Iterar e limpar |
| T4 | Implementar `checkCapitulation` | 🟡 Médio | Barato | Função pura com condições |
| T5 | Implementar `selectProvincesToCede` e `executeCapitulation` | 🟠 Difícil | **Forte** | BFS + vassalagem + eliminação de reino |
| T6 | Integrar `checkCapitulation` em `processActiveWars` | 🟠 Difícil | **Forte** | Modificar fluxo de controle do loop de guerras |
| T7 | Notificação de capitulação | 🟢 Fácil | Barato | push em array de logs |

**Resumo Sprint 02:** Use coder FORTE para T5 e T6. As demais 5 tarefas podem ser feitas com coder barato.

---

### Sprint 03 — Sistema de Governos

| # | Tarefa | Nível | Coder | Por quê |
|---|--------|-------|-------|---------|
| T1 | Adicionar tipos de governo em `types.ts` | 🟢 Fácil | Barato | Union type + interface |
| T2 | Criar `governmentLogic.ts` | 🟡 Médio | Barato | Tabela de stats + funções puras |
| T3 | Integrar `applyGovernmentBonuses` em `turnLogic.ts` | 🔴 Muito Difícil | **Forte** | Afeta renda, AP, tech, recrutamento — múltiplos pontos de integração |
| T4 | Integrar `checkRevolution` em `turnLogic.ts` | 🟡 Médio | Barato | Chamada condicional após estabilidade |
| T5 | Criar `GovernmentModal.tsx` | 🟠 Difícil | **Forte** | UI com 7 governos, custos, confirmação |
| T6 | Integrar modal no HUD e App | 🟢 Fácil | Barato | Adicionar botão e import |
| T7 | Penalidade de províncias distantes (Republic) | 🟡 Médio | Barato | BFS + condicional |
| T8 | Bônus/penalidades restantes (Oligarchy, Tribal, Despotism, Theocracy) | 🟡 Médio | Barato | Ajustes pontuais em economia/tech |

**Resumo Sprint 03:** Use coder FORTE para T3 e T5. As demais 6 tarefas podem ser feitas com coder barato.

---

### Sprint 04 — Novos Modos de Mapa

| # | Tarefa | Nível | Coder | Por quê |
|---|--------|-------|-------|---------|
| T1 | Expandir `ViewMode` em `types.ts` | 🟢 Fácil | Barato | Adicionar strings ao union type |
| T2 | Coloração dos 7 novos modos em `Map.tsx` | 🟡 Médio | Barato | switch/case com heatmaps |
| T3 | Labels dos 7 novos modos em `Map.tsx` | 🟡 Médio | Barato | switch/case com formatação |
| T4 | Atalhos de teclado em `App.tsx` | 🟢 Fácil | Barato | Adicionar cases no switch |
| T5 | Verificar modo Trade | 🟢 Fácil | Barato | Conferir e corrigir se necessário |

**Resumo Sprint 04:** 🟢 **Sprint inteira pode ser feita com coder BARATO.** Apenas visualização, sem lógica de jogo.

---

### Sprint 05 — Empréstimos + IA Avançada

| # | Tarefa | Nível | Coder | Por quê |
|---|--------|-------|-------|---------|
| T1 | Adicionar tipos de empréstimo em `types.ts` | 🟢 Fácil | Barato | Interface + campo |
| T2 | Funções de empréstimo em `economyLogic.ts` | 🟡 Médio | Barato | CRUD de array, matemática simples |
| T3 | Integrar `processLoanPayments` em `turnLogic.ts` | 🟡 Médio | Barato | Adicionar chamada no loop de realms |
| T4 | Botão de empréstimo no HUD | 🟡 Médio | Barato | Botão + modal simples |
| T5 | Criar `calculateMilitaryPower` em `aiLogic.ts` | 🟡 Médio | Barato | Soma de tropas × multiplicadores |
| T6 | Refatorar: remover `declareWar` local do `aiLogic.ts` | 🟠 Difícil | **Forte** | Adaptar call sites para interface de `diplomacyLogic.declareWar` |
| T7 | Implementar `shouldAIAttack` com personalidades | 🟡 Médio | Barato | switch com thresholds |
| T8 | Implementar `processAIDiplomacy` | 🟡 Médio | Barato | switch por personalidade |
| T9 | Implementar `processAILoans` | 🟡 Médio | Barato | Condicional simples |
| T10 | Reescrever `processAI` | 🔴 Muito Difícil | **Forte** | Reescrita completa da IA central |
| T11 | Aplicar `aiAggression` configurável | 🟡 Médio | Barato | Multiplicador nos thresholds |

**Resumo Sprint 05:** Use coder FORTE para T6 e T10. As demais 9 tarefas podem ser feitas com coder barato.

---

### Sprint 06 — Música Ambiente

| # | Tarefa | Nível | Coder | Por quê |
|---|--------|-------|-------|---------|
| T1 | Obter assets MP3 (CC0) | 🟢 Fácil | Barato | Download de arquivos |
| T2 | Criar `musicLogic.ts` | 🟡 Médio | Barato | API de `<audio>` nativa, sem lógica de jogo |
| T3 | Integrar em `App.tsx` | 🟡 Médio | Barato | Chamadas em handlers existentes |
| T4 | Toggle de música no HUD | 🟢 Fácil | Barato | Botão + slider |

**Resumo Sprint 06:** 🟢 **Sprint inteira pode ser feita com coder BARATO.** Música é isolada do resto do jogo.

---

### Sprint 07 — Liberty Desire + Tela de Derrota + Responsividade

| # | Tarefa | Nível | Coder | Por quê |
|---|--------|-------|-------|---------|
| T1 | Adicionar campos de tracking em `types.ts` | 🟢 Fácil | Barato | 5 campos numéricos |
| T2 | Implementar `processVassalLiberty` em `turnLogic.ts` | 🔴 Muito Difícil | **Forte** | Múltiplos fatores, clamping, rebelião com `declareWar`, padrão imutável |
| T3 | Barra de Liberty no HUD | 🟡 Médio | Barato | Exibir valor + botão de apaziguar |
| T4 | Incrementar `battlesWon` em `combatLogic.ts` | 🟢 Fácil | Barato | +1 em condição de vitória |
| T5 | Incrementar `realmsDefeated` | 🟢 Fácil | Barato | +1 ao eliminar reino |
| T6 | Incrementar `cumulativeGold` e `maxProvincesHeld` | 🟢 Fácil | Barato | Acumuladores no loop de turno |
| T7 | Reescrever `GameEndModal.tsx` para derrota narrativa | 🟠 Difícil | **Forte** | UI com template condicional, estatísticas reais, frases aleatórias |
| T8 | Responsividade de 8 modais | 🟡 Médio | Barato | CSS media queries, sem lógica |

**Resumo Sprint 07:** Use coder FORTE para T2 e T7. As demais 6 tarefas podem ser feitas com coder barato.

---

### Sprint 08 — Migração de Save + Testes de Integração

| # | Tarefa | Nível | Coder | Por quê |
|---|--------|-------|-------|---------|
| T1 | Adicionar `schemaVersion` em `types.ts` | 🟢 Fácil | Barato | Um campo number |
| T2 | Criar `saveMigration.ts` | 🟡 Médio | Barato | Aplicar defaults com `??` |
| T3 | Integrar `migrateSaveGame` em `useGameController.ts` | 🟡 Médio | Barato | Chamar antes de setState |
| T4 | Testes de integração manuais | 🟡 Médio | Barato | Seguir checklist |

**Resumo Sprint 08:** 🟡 **Sprint inteira pode ser feita com coder BARATO.** Sem lógica complexa.

---

## Resumo Executivo

### Use coder BARATO (simples/barato) para:
| Sprint | Nome | Dias |
|--------|------|------|
| 00 | Preparação | 0.5 |
| 04 | Modos de Mapa | 2.0 |
| 06 | Música Ambiente | 4.0 |
| 08 | Migração + Testes | 2.0 |
| **Total barato** | | **8.5 dias** |

### Use coder FORTE (avançado/caro) para:
| Sprint | Nome | Dias | Tarefas críticas |
|--------|------|------|------------------|
| 01 | Tecnologia | 3.5 | T5 (combat tech), T7 (modal) |
| 02 | Capitulação | 1.5 | T5 (cede provinces), T6 (fluxo de guerras) |
| 03 | Governos | 2.5 | T3 (integrar bônus), T5 (modal) |
| 05 | Empréstimos + IA | 3.5 | T6 (refatorar declareWar), T10 (reescrever processAI) |
| 07 | Liberty + Derrota + Resp. | 3.5 | T2 (processVassalLiberty), T7 (GameEndModal) |
| **Total forte** | | **14.5 dias** | |

### Estratégia recomendada:
1. Use **coder FORTE** nos sprints 01, 02, 03, 05, 07 (tarefas críticas)
2. Use **coder BARATO** nas tarefas simples DENTRO desses mesmos sprints (70% das tarefas são baratas)
3. Use **coder BARATO** nos sprints 00, 04, 06, 08 (sprints inteiros)
4. Para cada sprint "forte", execute primeiro as tarefas baratas, depois chame o coder forte só para as tarefas críticas

---

*Guia gerado em 08/05/2026 — Reinos Medievais — Fase 2*
