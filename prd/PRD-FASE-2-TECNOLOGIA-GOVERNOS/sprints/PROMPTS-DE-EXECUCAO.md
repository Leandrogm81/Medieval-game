# PROMPT DE EXECUÇÃO — Fase 2: Reinos Medievais

> **Copie o bloco abaixo e cole no IDE que estiver usando (Cursor, Cline, Claude Code, etc.)**
> **Quando o modelo terminar as tarefas do bloco, ele vai parar. Você troca de modelo e cola o próximo bloco.**

---

## 📋 INSTRUÇÕES DE USO

1. **Abra** o arquivo `sprints/tarefas/sprint-XX-tarefas.md` correspondente ao sprint que vai executar
2. **Copie** o prompt abaixo substituindo `{SPRINT}` e `{TAREFA_INICIAL}` e `{TAREFA_FINAL}`
3. **Cole** no chat do IDE
4. O modelo vai executar tarefa por tarefa e **parar** quando chegar em `{TAREFA_FINAL}`
5. **Troque de modelo** (barato ↔ forte) conforme o guia `00-guia-dificuldade.md`
6. **Cole o próximo bloco** com `{TAREFA_INICIAL}` = próxima tarefa

---

## ⚡ PROMPT (copie daqui para baixo)

```

=== CONTEXTO DO PROJETO (NÃO MODIFICAR) ===

Você está trabalhando no projeto "Reinos Medievais", um jogo de estratégia
medieval React 19 + TypeScript 5.8 + Vite 6 + Tailwind v4 + motion (Framer Motion).

Local do projeto: C:\Users\leand\OneDrive\Documentos\Medieval game\Medieval-game

Comandos:
- npm run lint     (tsc --noEmit)
- npm run build    (vite build)
- npm run dev      (vite --port=3000 --host=0.0.0.0)

REGRAS CRÍTICAS (leia antes de qualquer código):
1. Estado é IMUTÁVEL. Todo handler usa deepClone (JSON.parse(JSON.stringify())).
   NUNCA chame setGameState dentro de updater de setGameState.
2. SEMPRE use setTimeout(() => showToast(...), 0) após setGameState.
3. Funções em src/logic/ DEVEM ser puras — sem side-effects de React.
4. Antes de editar qualquer arquivo, LEIA-O primeiro para ver o conteúdo atual.
5. Após cada tarefa, execute npm run lint. Se falhar, CORRIJA antes de continuar.
6. Não invente features. Siga exatamente o que a tarefa pede.
7. Trabalhe em WSL: caminhos Windows em /mnt/c/...

ARQUIVOS QUE NUNCA DEVEM SER ALTERADOS:
- src/logic/mapGeneration.ts (apenas adicionar defaults de novos campos, sem alterar lógica)
- src/logic/sfxLogic.ts
- src/logic/game-constants.ts (apenas adicionar novas constantes, sem alterar existentes)

ESTRUTURA DO PROJETO:
src/
├── types.ts               → Todas as interfaces
├── logic/
│   ├── turnLogic.ts       → processEndOfTurn, processActiveWars, findPath
│   ├── economyLogic.ts    → executeRecruitment, executeBuilding, getMaxRecruitable
│   ├── combatLogic.ts     → resolveCombat (NÃO MODIFICAR — aplicar bônus no caller)
│   ├── aiLogic.ts         → processAI (tem declareWar local DUPLICADA — será removida)
│   ├── diplomacyLogic.ts  → declareWar canônica (usar esta)
│   ├── game-constants.ts  → ACTION_COSTS, UNIT_STATS, BUILDING_STATS
│   └── mapGeneration.ts   → generateInitialState
├── hooks/
│   ├── useGameController.ts → handlers, handleEndTurn, handleLoad
│   └── useUI.ts             → estado de UI
├── components/
│   ├── Map.tsx            → renderização de províncias, view modes
│   ├── HUD.tsx            → painel lateral
│   ├── GameEndModal.tsx   → tela de fim de jogo
│   └── ... (outros modais)
└── App.tsx                → orchestrator, keyboard shortcuts

=== FIM DO CONTEXTO ===


=== TAREFA ===

Você vai executar as tarefas do Sprint {SPRINT}.

Arquivo de referência: sprints/tarefas/sprint-{SPRINT}-tarefas.md

Execute APENAS as tarefas {TAREFA_INICIAL} até {TAREFA_FINAL} (inclusive).

Para cada tarefa:
1. Leia a tarefa no arquivo de referência
2. LEIA os arquivos que vai modificar ANTES de editá-los
3. Execute os passos
4. Rode npm run lint após cada tarefa
5. Se lint falhar, CORRIJA antes de prosseguir
6. Marque a tarefa como concluída

FORMATO DE RESPOSTA:
Após cada tarefa, responda exatamente assim:

```
✅ Tarefa {N} concluída: [nome da tarefa]
📁 Arquivos alterados: [lista]
🔍 Lint: [passou/falhou]
```

Quando chegar na tarefa {TAREFA_FINAL}, responda:

```
🏁 SPRINT {SPRINT} BLOCO CONCLUÍDO
✅ Tarefas: {TAREFA_INICIAL}-{TAREFA_FINAL}
📁 Arquivos alterados: [lista completa]
🔍 Lint final: [passou/falhou]
⏸️  PAUSA PARA TROCA DE MODELO
```

NÃO continue após a tarefa {TAREFA_FINAL}.

=== FIM ===
```

---

## 📝 EXEMPLOS DE USO

### Exemplo 1: Sprint 01 inteiro com modelo FORTE

```
=== CONTEXTO DO PROJETO (NÃO MODIFICAR) ===
... (igual acima) ...

=== TAREFA ===
Você vai executar as tarefas do Sprint 01.
Arquivo de referência: sprints/tarefas/sprint-01-tarefas.md
Execute APENAS as tarefas 1 até 17 (inclusive).
...
```

### Exemplo 2: Sprint 01, tarefas baratas (1-11)

```
=== CONTEXTO DO PROJETO (NÃO MODIFICAR) ===
... (igual acima) ...

=== TAREFA ===
Você vai executar as tarefas do Sprint 01.
Arquivo de referência: sprints/tarefas/sprint-01-tarefas.md
Execute APENAS as tarefas 1 até 11 (inclusive).
...
```

### Exemplo 3: Sprint 01, tarefas fortes (12-17) — depois de trocar modelo

```
=== CONTEXTO DO PROJETO (NÃO MODIFICAR) ===
... (igual acima) ...

=== TAREFA ===
Você vai executar as tarefas do Sprint 01.
Arquivo de referência: sprints/tarefas/sprint-01-tarefas.md
Execute APENAS as tarefas 12 até 17 (inclusive).
...
```

---

## 🗺️ MAPA DE EXECUÇÃO RECOMENDADO

### Sprint 00 — Preparação (0.5 dia) — 🟢 BARATO
```
Tarefas: 1-13 (todas)
Modelo: BARATO (leitura, sem código)
Prompt: sprint-00, tarefas 1 até 13
```

### Sprint 01 — Tecnologia (3.5 dias) — 🔴 FORTE no fim
```
Bloco 1: tarefas 1-11  → BARATO  (tipos, funções puras, integrações pontuais)
Bloco 2: tarefas 12-17 → FORTE   (combat tech, TechnologyModal)
```

### Sprint 02 — Capitulação (1.5 dias) — 🔴 FORTE no fim
```
Bloco 1: tarefas 1-7   → BARATO  (tipos, set/clear originalOwnerId, funções puras)
Bloco 2: tarefas 8-11  → FORTE   (executeCapitulation, integrar no fluxo)
```

### Sprint 03 — Governos (2.5 dias) — 🔴 FORTE no meio
```
Bloco 1: tarefas 1-9   → BARATO  (tipos, tabela de stats, funções puras)
Bloco 2: tarefas 10-15 → FORTE   (integrar bônus no processEndOfTurn, GovernmentModal)
```

### Sprint 04 — Modos de Mapa (2.0 dias) — 🟢 BARATO
```
Tarefas: 1-8 (todas)
Modelo: BARATO (só visualização, sem lógica de jogo)
Prompt: sprint-04, tarefas 1 até 8
```

### Sprint 05 — Empréstimos + IA (3.5 dias) — 🔴 FORTE no fim
```
Bloco 1: tarefas 1-11  → BARATO  (tipos, funções de loan, calculateMilitaryPower, shouldAIAttack)
Bloco 2: tarefas 12-16 → FORTE   (remover declareWar local, reescrever processAI)
```

### Sprint 06 — Música (4.0 dias) — 🟢 BARATO
```
Tarefas: 1-10 (todas)
Modelo: BARATO (áudio nativo, sem lógica de jogo)
Prompt: sprint-06, tarefas 1 até 10
```

### Sprint 07 — Liberty + Derrota (3.5 dias) — 🔴 FORTE no meio
```
Bloco 1: tarefas 1-6   → BARATO  (tipos, tracking, HUD)
Bloco 2: tarefas 7-10  → FORTE   (processVassalLiberty, GameEndModal narrativo)
Bloco 3: tarefas 11-14 → BARATO  (responsividade, validação)
```

### Sprint 08 — Migração + Testes (2.0 dias) — 🟢 BARATO
```
Tarefas: 1-18 (todas)
Modelo: BARATO (migração de dados, checklists manuais)
Prompt: sprint-08, tarefas 1 até 18
```

---

## ⚠️ OBSERVAÇÕES IMPORTANTES

1. **O prompt acima é o mesmo para todos os sprints.** Só mude `{SPRINT}`, `{TAREFA_INICIAL}` e `{TAREFA_FINAL}`.
2. **Sempre leia o arquivo de tarefas** (`sprints/tarefas/sprint-XX-tarefas.md`) antes de começar.
3. **Se uma tarefa falhar**, corrija antes de prosseguir. Não acumule erros.
4. **Se o modelo começar a inventar features**, lembre-o: "Apenas execute a tarefa como descrita. Não adicione nada."
5. **Após cada sprint**, faça `npm run build` para garantir que tudo compila.
6. **Guarde os arquivos alterados** em cada bloco para saber o estado do projeto ao trocar de modelo.

---

*Guia de prompts — Reinos Medievais — Fase 2*
