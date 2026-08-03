# ROADMAP DE EXECUÇÃO — Fase 2: Reinos Medievais

> **Guia visual para iniciantes.** Cada sprint tem um diagrama mostrando o que fazer, em que ordem, com qual modelo, e quanto tempo leva.

---

## 🌍 VISÃO GERAL DA FASE 2

```
SEMANA 1                    SEMANA 2                    SEMANA 3
├─────────────┤├─────────────┤├─────────────┤├─────────────┤├─────────────┤
│SPRINT 00    ││SPRINT 01    ││SPRINT 02 ││SPRINT 03     ││SPRINT 04    │
│Preparação  ││Tecnologia  ││Capitul. ││Governos     ││Modos Mapa  │
│0.5d 🟢     ││3.5d     🟢🔴││1.5d  🟢🔴││2.5d     🟢🔴││2.0d 🟢     │
└─────────────┘└─────────────┘└──────────┘└──────────────┘└─────────────┘

SEMANA 3 (cont)             SEMANA 4
├─────────────┤├─────────────┤├─────────────┤├─────────────┤
│SPRINT 05    ││SPRINT 06    ││SPRINT 07     ││SPRINT 08    │
│Emprést.+IA ││Música      ││Liberty+Der. ││Migração    │
│3.5d     🟢🔴││4.0d 🟢     ││3.5d     🟢🔴││2.0d 🟢     │
└─────────────┘└─────────────┘└──────────────┘└─────────────┘
```

**Legenda:** 🟢 = modelo BARATO | 🔴 = modelo FORTE | 🟢🔴 = sprint misto (começa barato, termina forte)

---

## 📅 SPRINT 00 — Preparação e Leitura (0.5 dia)

```
OBJETIVO: Entender o projeto antes de mexer em nada

MANHÃ (3 horas)
┌──────────────────────────────────────────────────────────┐
│ T1: Instalar dependências (npm install)           5 min  │
│ T2: Verificar typecheck (tsc --noEmit)            2 min  │
│ T3: Verificar build (npm run build)               5 min  │
│ T4: Rodar servidor dev (npm run dev)              2 min  │
│                                                          │
│ T5: Ler types.ts (208 linhas)                    15 min  │
│ T6: Ler turnLogic.ts (713 linhas)                30 min  │
│ T7: Ler aiLogic.ts (119 linhas)                  10 min  │
│ T8: Ler economyLogic.ts (463 linhas)             20 min  │
│ T9: Ler combatLogic.ts (122 linhas)              10 min  │
│ T10: Ler diplomacyLogic.ts (755 linhas)          30 min  │
│ T11: Ler Map.tsx (580 linhas)                    20 min  │
│ T12: Ler App.tsx (857 linhas)                    30 min  │
│ T13: Resumo e checklist                           5 min  │
│                                                          │
│ TOTAL: ~3 horas                                         │
└──────────────────────────────────────────────────────────┘

MODELO: 🟢 BARATO (é só leitura, qualquer IA serve)
ARQUIVO: sprints/tarefas/sprint-00-tarefas.md
PROMPT: "Execute APENAS as tarefas 1 até 13"
```

---

## 📅 SPRINT 01 — Tecnologia (3.5 dias)

```
OBJETIVO: Jogador acumula pontos de tecnologia e gasta em 4 categorias
          Cada categoria dá bônus: +AP, -custo assimilação, +recrutamento, +combate

DIA 1 — BARATO 🟢
┌──────────────────────────────────────────────────────────┐
│ BLOCO 1 (tarefas 1-11) — ~4 horas                       │
│                                                          │
│ T1: Criar interface TechLevels                          │
│ T2: Adicionar campos em Realm                           │
│ T3: Expandir ViewMode                                   │
│ T4: Atualizar mapGeneration (defaults)                  │
│ T5: Criar getTechUpgradeCost (fórmula triangular)       │
│ T6: Criar generateTechPoints (pop + workshops + courts) │
│ T7: Criar allocateTechPoints (gastar pontos)            │
│ T8: Criar getTechEffects (tabela de bônus)              │
│                                                          │
│ T9: Integrar no processEndOfTurn (techPoints sobem)     │
│ T10: Integrar bônus de AP (+0.5 por nível movement)     │
│ T11: Integrar bônus de recrutamento (+10% por nível)    │
│                                                          │
│ ⏸️  PARAR AQUI — trocar para modelo FORTE               │
└──────────────────────────────────────────────────────────┘

DIA 2 — FORTE 🔴
┌──────────────────────────────────────────────────────────┐
│ BLOCO 2 (tarefas 12-17) — ~4 horas                      │
│                                                          │
│ T12: Integrar bônus de combate (NÃO mexer no            │
│      resolveCombat — aplicar bônus no caller)           │
│ T13: Integrar bônus de assimilação (-10% custo/nível)   │
│                                                          │
│ T14: CRIAR TechnologyModal.tsx (UI completa)            │
│      → 4 categorias com barras de progresso             │
│      → Botão de upgrade em cada categoria               │
│      → Mostrar pontos disponíveis e geração/turno       │
│                                                          │
│ T15: Conectar modal ao estado (onAllocate → setState)   │
│ T16: Adicionar botão "🔬 Tecnologia" no HUD             │
│ T17: Validação final (lint + build + teste manual)      │
│                                                          │
│ ⏸️  FIM DO SPRINT 01                                    │
└──────────────────────────────────────────────────────────┘

RESULTADO ESPERADO:
  - Jogador abre modal de tecnologia
  - Vê 4 categorias com níveis e custos
  - Gasta pontos → nível sobe → bônus aplicado
  - AP aumenta, recrutamento rende mais, combate mais forte

MODELOS: 🟢 BARATO (bloco 1) → 🔴 FORTE (bloco 2)
```

---

## 📅 SPRINT 02 — Capitulação (1.5 dias)

```
OBJETIVO: Quando um reino perde >60% do território em guerra, ele se rende
          automaticamente. Isso evita guerras eternas.

DIA 1 — BARATO 🟢
┌──────────────────────────────────────────────────────────┐
│ BLOCO 1 (tarefas 1-7) — ~3 horas                        │
│                                                          │
│ T1: Adicionar originalOwnerId em Province               │
│ T2: Adicionar interface CapitulationResult               │
│ T3: Setar originalOwnerId ao conquistar (player)        │
│ T4: Setar originalOwnerId ao conquistar (IA)            │
│ T5: Limpar originalOwnerId ao fim da guerra             │
│ T6: Criar checkCapitulation (função pura)               │
│ T7: Criar selectProvincesToCede (BFS distância)         │
│                                                          │
│ ⏸️  PARAR AQUI — trocar para modelo FORTE               │
└──────────────────────────────────────────────────────────┘

DIA 2 — FORTE 🔴
┌──────────────────────────────────────────────────────────┐
│ BLOCO 2 (tarefas 8-11) — ~3 horas                       │
│                                                          │
│ T8: Criar executeCapitulation                            │
│     → Transferir províncias para vencedor                │
│     → Derrotado vira vassalo OU é eliminado              │
│     → Penalidade -20 loyalty no vencedor                 │
│                                                          │
│ T9: Integrar no processActiveWars                        │
│     → Inserir entre batalhas e exaustão                  │
│     → Cuidado: não quebrar o loop de guerras            │
│                                                          │
│ T10: Adicionar notificação "🏳️ rendeu"                  │
│ T11: Validação final                                     │
│                                                          │
│ ⏸️  FIM DO SPRINT 02                                    │
└──────────────────────────────────────────────────────────┘

RESULTADO ESPERADO:
  - Guerra contra reino pequeno
  - Conquista >60% das províncias dele
  - No próximo turno: "🏳️ [Reino] se rendeu!"
  - Ele vira seu vassalo (ou some do mapa)

MODELOS: 🟢 BARATO (bloco 1) → 🔴 FORTE (bloco 2)
```

---

## 📅 SPRINT 03 — Governos (2.5 dias)

```
OBJETIVO: 7 tipos de governo, cada um com bônus e penalidades.
          Jogador pode reformar o governo (custa ouro) ou sofrer revolução.

DIA 1 — BARATO 🟢
┌──────────────────────────────────────────────────────────┐
│ BLOCO 1 (tarefas 1-9) — ~4 horas                        │
│                                                          │
│ T1: Criar GovernmentType (7 tipos)                      │
│ T2: Criar GovernmentStats (tabela de stats)             │
│ T3: Criar GOVERNMENT_STATS (valores do PRD)             │
│ T4: Criar isProvinceDistant (BFS da capital)            │
│ T5: Criar changeGovernment (valida custo e cooldown)    │
│ T6: Criar checkRevolution (10% chance/turno)            │
│ T7: Criar getGovernmentFlavor (textos de sabor)         │
│ T8: Atualizar mapGeneration (default monarchy)          │
│ T9: Integrar cooldown e penalidade no processEndOfTurn  │
│                                                          │
│ ⏸️  PARAR AQUI — trocar para modelo FORTE               │
└──────────────────────────────────────────────────────────┘

DIA 2 — FORTE 🔴
┌──────────────────────────────────────────────────────────┐
│ BLOCO 2 (tarefas 10-15) — ~4 horas                      │
│                                                          │
│ T10: Integrar applyGovernmentBonuses                     │
│      → Monarchy: +10% defesa                             │
│      → Republic: +5% gold, -estabilidade em distantes   │
│      → Feudal: +15% food, -5% gold                       │
│      → Theocracy: +20% loyalty, -10% tech               │
│      → Despotism: +15% ataque, -20% pop growth          │
│      → Oligarchy: +25% gold vassalos, -10 relações      │
│      → Tribal: recurso 2x, -1 AP, -20% tech             │
│                                                          │
│ T11: Atualizar generateTechPoints com govPenalty real   │
│ T12: Aplicar bônus de ataque/defesa no combate          │
│                                                          │
│ T13: CRIAR GovernmentModal.tsx (UI com 7 governos)      │
│      → Lista de governos com bônus/penalidades          │
│      → Botão "Reformar Governo" com custo               │
│      → Indicador de cooldown                            │
│      → Confirmação antes de reformar                    │
│                                                          │
│ T14: Adicionar botão "🏛️ Governo" no HUD                │
│ T15: Validação final                                     │
│                                                          │
│ ⏸️  FIM DO SPRINT 03                                    │
└──────────────────────────────────────────────────────────┘

RESULTADO ESPERADO:
  - Jogador abre modal de governo
  - Vê 7 opções (Monarchy, Republic, Feudal, etc.)
  - Clica "Reformar" → paga 500g + 200m → governo muda
  - Bônus/penalidades aplicados no próximo turno
  - 20 turnos depois pode mudar de novo
  - Se estabilidade cair muito: revolução!

MODELOS: 🟢 BARATO (bloco 1) → 🔴 FORTE (bloco 2)
```

---

## 📅 SPRINT 04 — Modos de Mapa (2.0 dias)

```
OBJETIVO: Adicionar 7 novas visualizações ao mapa (população, desenvolvimento,
          renda, estabilidade, edifícios, crescimento, força militar).
          Total de 13 modos com atalhos de teclado.

DIA 1-2 — BARATO 🟢 (SPRINT INTEIRO)
┌──────────────────────────────────────────────────────────┐
│ BLOCO ÚNICO (tarefas 1-8) — ~4 horas                    │
│                                                          │
│ T1: Expandir ViewMode (+7 modos)                        │
│ T2: Calcular valores máximos (useMemo)                  │
│                                                          │
│ T3: COLORAÇÃO dos 7 modos:                              │
│     População → verde escuro                            │
│     Desenvolvimento → azul                              │
│     Renda → dourado                                     │
│     Estabilidade → branco/amarelo/vermelho              │
│     Edifícios → roxo                                    │
│     Crescimento → ciano                                 │
│     Força militar → laranja                             │
│                                                          │
│ T4: LABELS dos 7 modos:                                 │
│     "12.450" / "Dev: 45" / "+320g" / "85%" etc.        │
│                                                          │
│ T5: Atalhos 6, 7, 8, 9 no teclado                      │
│ T6: Atalhos 0, G, T, (Shift+)F no teclado              │
│ T7: Verificar modo Trade (já existe)                    │
│ T8: Validação final                                     │
│                                                          │
│ ⏸️  FIM DO SPRINT 04                                    │
└──────────────────────────────────────────────────────────┘

RESULTADO ESPERADO:
  - Pressionar 1-9, 0, T, G, F → muda visualização do mapa
  - Cada modo mostra cores e números diferentes
  - Modo estabilidade: verde = feliz, vermelho = rebelde
  - Performance: sem lag com 40 províncias

MODELO: 🟢 BARATO (sprint inteiro — só visualização, zero lógica de jogo)
```

---

## 📅 SPRINT 05 — Empréstimos + IA Avançada (3.5 dias)

```
OBJETIVO: Jogador pode pegar empréstimo (10 turnos, 15% juros).
          IA age por personalidade (expansionist ataca, defensive defende, etc.)

DIA 1 — BARATO 🟢
┌──────────────────────────────────────────────────────────┐
│ BLOCO 1 (tarefas 1-11) — ~5 horas                       │
│                                                          │
│ T1: Criar interface Loan                                │
│ T2: Adicionar aiAggression no GameSettings              │
│ T3: Criar getMaxLoanAmount (goldIncome * 5)             │
│ T4: Criar requestLoan (adiciona gold, cria parcelas)    │
│ T5: Criar processLoanPayments (desconta a cada turno)   │
│ T6: Integrar processLoanPayments no processEndOfTurn    │
│ T7: Adicionar botão "💰 Empréstimo" no HUD              │
│                                                          │
│ T8: Criar calculateMilitaryPower                        │
│     (soma tropas × bônus tech × bônus governo)          │
│                                                          │
│ T9: Criar shouldAIAttack                                │
│     Expansionist: ataca se poder > 1.5x                 │
│     Defensive: NUNCA ataca                              │
│     Diplomatic: só ataca se poder > 3x                  │
│     Opportunistic: ataca vizinho em guerra              │
│     Commercial: só ataca se poder > 2.5x                │
│                                                          │
│ T10: Criar processAIDiplomacy (alianças, insultos)      │
│ T11: Criar processAILoans (IA pega empréstimo)          │
│                                                          │
│ ⏸️  PARAR AQUI — trocar para modelo FORTE               │
└──────────────────────────────────────────────────────────┘

DIA 2 — FORTE 🔴
┌──────────────────────────────────────────────────────────┐
│ BLOCO 2 (tarefas 12-16) — ~4 horas                      │
│                                                          │
│ T12: REMOVER declareWar LOCAL do aiLogic.ts              │
│      → Apagar função das linhas 6-31                    │
│      → Substituir chamadas por diplomacyLogic.declareWar │
│      → Perigo: quebrar todas as guerras da IA          │
│                                                          │
│ T13: REESCREVER processAI                                │
│      → Função central da IA (80 linhas atuais)          │
│      → Substituir lógica aleatória por switch:          │
│        Expansionist → atacar > recrutar > construir     │
│        Defensive    → construir > fortificar            │
│        Diplomatic   → diplomacia > economia             │
│        Opportunistic → atacar fraco > economia          │
│        Commercial   → economia > trade                  │
│      → Perigo: IA pode ficar passiva ou quebrar         │
│                                                          │
│ T14: Aplicar aiAggression (slider afeta thresholds)     │
│ T15: Atualizar mapGeneration (defaults)                 │
│ T16: Validação final                                     │
│                                                          │
│ ⏸️  FIM DO SPRINT 05                                    │
└──────────────────────────────────────────────────────────┘

RESULTADO ESPERADO:
  - Botão "💰 Empréstimo" no HUD → pega gold → 10 parcelas
  - IA expansionist ataca agressivamente
  - IA defensive constrói defesas e nunca ataca
  - IA diplomatic tenta alianças
  - aiLogic.ts não tem mais declareWar duplicada

MODELOS: 🟢 BARATO (bloco 1) → 🔴 FORTE (bloco 2)
```

---

## 📅 SPRINT 06 — Música Ambiente (4.0 dias)

```
OBJETIVO: Trilha sonora medieval de fundo.
          3 faixas (menu, paz, guerra) com crossfade de 2 segundos.

DIA 1-4 — BARATO 🟢 (SPRINT INTEIRO)
┌──────────────────────────────────────────────────────────┐
│ BLOCO ÚNICO (tarefas 1-10) — ~6 horas                   │
│                                                          │
│ T1: BAIXAR 3 MP3 gratuitos (CC0)                       │
│     → OpenGameArt.org ou Pixabay                        │
│     → menu.mp3 (calma)                                  │
│     → peace.mp3 (neutra)                                │
│     → war.mp3 (intensa)                                 │
│     → Salvar em public/music/                           │
│ ⚠️  Esta é a tarefa mais demorada (2-3h procurando)     │
│                                                          │
│ T2: Criar musicLogic.ts (variáveis)                     │
│ T3: Implementar initMusic (criar <audio>)               │
│ T4: Implementar startMenuMusic / startGameMusic         │
│ T5: Implementar crossfade (transição suave 2s)          │
│ T6: Implementar stopMusic / setVolume / isPlaying       │
│                                                          │
│ T7: Integrar no App.tsx (iniciar no primeiro clique)    │
│ T8: Integrar transições (menu→jogo, paz↔guerra)        │
│ T9: Adicionar toggle 🔈/🔊 e slider no HUD              │
│ T10: Validação final                                     │
│                                                          │
│ ⏸️  FIM DO SPRINT 06                                    │
└──────────────────────────────────────────────────────────┘

RESULTADO ESPERADO:
  - Abre o jogo → silêncio
  - Clica em qualquer lugar → música do menu toca
  - Inicia jogo → crossfade para música de paz
  - Declara guerra → crossfade para música de guerra
  - Faz paz → volta música de paz
  - Botão 🔈🔊 no HUD liga/desliga
  - Slider ajusta volume

MODELO: 🟢 BARATO (sprint inteiro — áudio nativo, sem lógica de jogo)
```

---

## 📅 SPRINT 07 — Liberty + Derrota + Responsividade (3.5 dias)

```
OBJETIVO: Vassalos acumulam desejo de liberdade e podem se rebelar.
          Tela de derrota mostra estatísticas da partida.
          Todos os modais funcionam em celular.

DIA 1 — BARATO 🟢
┌──────────────────────────────────────────────────────────┐
│ BLOCO 1 (tarefas 1-6) — ~3 horas                        │
│                                                          │
│ T1: Adicionar campos de tracking em Realm               │
│     → vassalLiberty, battlesWon, realmsDefeated         │
│     → cumulativeGold, maxProvincesHeld                  │
│ T2: Atualizar mapGeneration (defaults)                  │
│                                                          │
│ T3: (PULAR — vai no bloco FORTE)                        │
│                                                          │
│ T4: Integrar processVassalLiberty no processEndOfTurn   │
│ T5: Adicionar barra de Liberty no HUD                   │
│ T6: Adicionar botão "Apaziguar Vassalo"                 │
│                                                          │
│ ⏸️  PARAR AQUI — trocar para modelo FORTE               │
└──────────────────────────────────────────────────────────┘

DIA 2 — FORTE 🔴
┌──────────────────────────────────────────────────────────┐
│ BLOCO 2 (tarefas 3, 7-10) — ~4 horas                    │
│                                                          │
│ T3: CRIAR processVassalLiberty                          │
│     → +2/turno base                                     │
│     → +5 se overlord em guerra                          │
│     → +10 se overextension > 80                         │
│     → +3 se vassalo maior que overlord                  │
│     → Liberty >= 100 → REBELIÃO (declara independência) │
│     → Liberty >= 70 → notificação                       │
│     → Código IMUTÁVEL (padrão deep clone)               │
│                                                          │
│ T7: Incrementar battlesWon no combate                   │
│ T8: Incrementar realmsDefeated na eliminação            │
│ T9: Incrementar cumulativeGold a cada turno             │
│ T10: Rastrear maxProvincesHeld (pico territorial)       │
│                                                          │
│ ⏸️  PARAR AQUI — trocar para modelo BARATO              │
└──────────────────────────────────────────────────────────┘

DIA 3 — BARATO 🟢
┌──────────────────────────────────────────────────────────┐
│ BLOCO 3 (tarefas 11-14) — ~4 horas                      │
│                                                          │
│ T11: REESCREVER GameEndModal (derrota narrativa)         │
│      → Detectar se jogador perdeu                       │
│      → Mostrar 💀 caveira                               │
│      → "O FIM DE UMA ERA"                               │
│      → Frase temática aleatória (4 frases)              │
│      → Estatísticas: turnos, províncias, batalhas,      │
│        reinos derrotados, ouro acumulado                │
│      → Botões "Tentar Novamente" e "Menu"               │
│ ⚠️  Esta tarefa é FORTE se o coder barato não conseguir  │
│                                                          │
│ T12: Adicionar CSS media query no index.css             │
│ T13: Aplicar responsividade em 8 modais                 │
│      → 375px: sem overflow horizontal                   │
│      → Botões com min-height: 48px                      │
│ T14: Validação final                                     │
│                                                          │
│ ⏸️  FIM DO SPRINT 07                                    │
└──────────────────────────────────────────────────────────┘

RESULTADO ESPERADO:
  - Vassalo com liberty 85% → notificação "está inquieto"
  - Liberty 100% → "REBELIÃO: [Vassalo] declarou independência!"
  - Perdeu o jogo → tela com estatísticas e frase medieval
  - Celular (375px): todos os modais abrem corretamente

MODELOS: 🟢 BARATO (bloco 1) → 🔴 FORTE (bloco 2) → 🟢 BARATO (bloco 3)
```

---

## 📅 SPRINT 08 — Migração + Testes (2.0 dias)

```
OBJETIVO: Saves da Fase 1 carregam na Fase 2 sem quebrar.
          Testar TUDO para garantir que nada quebrou.

DIA 1-2 — BARATO 🟢 (SPRINT INTEIRO)
┌──────────────────────────────────────────────────────────┐
│ BLOCO ÚNICO (tarefas 1-18) — ~6 horas                   │
│                                                          │
│ T1: Adicionar schemaVersion no GameState                │
│ T2: Setar schemaVersion: 2 no mapGeneration             │
│ T3: CRIAR saveMigration.ts                              │
│     → Se schemaVersion < 2: aplicar defaults            │
│     → techPoints: 0, techLevels: zeros                  │
│     → government: 'monarchy'                            │
│     → vassalLiberty: {}, loans: []                      │
│     → battlesWon: 0, cumulativeGold: 0                  │
│     → originalOwnerId: undefined em todas províncias    │
│                                                          │
│ T4: Integrar migrateSaveGame no handleLoad              │
│                                                          │
│ ⚠️  T5-T18 são TESTES MANUAIS (você testa, não a IA)    │
│                                                          │
│ T5: lint + build limpos                                 │
│ T6: Novo jogo funciona                                  │
│ T7: Tecnologia funciona                                 │
│ T8: Governos funcionam                                  │
│ T9: Capitulação funciona                                │
│ T10: Empréstimos funcionam                              │
│ T11: IA funciona                                        │
│ T12: Música funciona                                    │
│ T13: Liberty + Derrota funcionam                        │
│ T14: 13 modos de mapa funcionam                         │
│ T15: 8 modais responsivos                               │
│ T16: Save Fase 1 carrega sem quebrar                    │
│ T17: Funcionalidades da Fase 1 ainda funcionam          │
│ T18: Checklist final completo                            │
│                                                          │
│ ⏸️  FIM DO SPRINT 08 — FASE 2 CONCLUÍDA 🎉              │
└──────────────────────────────────────────────────────────┘

RESULTADO ESPERADO:
  - Save antigo carrega normalmente (com defaults)
  - Novo jogo salva e carrega com schemaVersion: 2
  - NADA quebrou da Fase 1
  - TUDO da Fase 2 funciona
  - npm run lint LIMPO
  - npm run build SEM ERROS

MODELO: 🟢 BARATO (sprint inteiro — migração simples + testes manuais)
```

---

## 🎯 CHECKLIST DE CONCLUSÃO DA FASE 2

Quando todos os 8 sprints estiverem concluídos, verifique:

```
[ ] npm run lint → ZERO erros
[ ] npm run build → compila sem erros
[ ] Novo jogo → todos os sistemas funcionam
[ ] Save Fase 1 → carrega com migração
[ ] Save Fase 2 → salva e carrega
[ ] Tecnologia → alocar pontos, ver bônus
[ ] Capitulação → conquistar >60%, ver rendição
[ ] Governos → 7 tipos, reformar, revolução
[ ] Modos de mapa → 13 modos, todos atalhos funcionam
[ ] Empréstimos → contrair, pagar parcelas, default
[ ] IA → age por personalidade, sem declareWar local
[ ] Música → menu/paz/guerra, toggle, volume
[ ] Liberty → vassalos acumulam, rebelam em 100
[ ] Derrota → tela narrativa com estatísticas
[ ] Responsividade → 375px sem overflow
[ ] Regressão → Fase 1 continua funcionando
```

---

*Roadmap — Reinos Medievais — Fase 2*
