# Sprint 00 — Preparação e Leitura do Projeto

**Objetivo:** Garantir que o agente implementador entenda a estrutura completa do projeto antes de qualquer alteração.

**Nível de dificuldade:** 🟢 Fácil — use coder BARATO

**Dependências:** Nenhuma

**Tempo estimado:** 0.5 dia

---

## Arquivos a inspecionar (em ordem)

| Ordem | Arquivo | O que verificar |
|-------|---------|-----------------|
| 1 | `package.json` | Scripts (`dev`, `build`, `lint`), dependências (React 19, Vite, Tailwind v4, Tone.js), natives de WSL |
| 2 | `src/types.ts` | Interfaces `Realm`, `Province`, `GameState`, `ViewMode`, `War`, `MarchOrder`, `GameSettings` |
| 3 | `src/logic/turnLogic.ts` | `processEndOfTurn` (linha 510), `processActiveWars` (linha 403), `findPath`, `calculateDistancesFromCapital` |
| 4 | `src/logic/aiLogic.ts` | `processAI` (linha 80), `declareWar` local (linha 6-31), `executeAIAttack` (linha 33) |
| 5 | `src/logic/economyLogic.ts` | `executeRecruitment`, `executeBuilding`, `getMaxRecruitable`, `executeTradeExchange` |
| 6 | `src/logic/combatLogic.ts` | `resolveCombat` (linha 45), `calculateRetreat` |
| 7 | `src/logic/diplomacyLogic.ts` | `declareWar` (linha 574), `isWarBetween`, `getMilitaryPower` local (linha 148) |
| 8 | `src/logic/game-constants.ts` | `ACTION_COSTS`, `UNIT_STATS`, `BUILDING_STATS` |
| 9 | `src/components/Map.tsx` | Coloração (linhas 253-263), labels (linhas 298-311), resources mode (linhas 362-390) |
| 10 | `src/components/HUD.tsx` | Estrutura do painel lateral |
| 11 | `src/components/GameEndModal.tsx` | Estrutura atual (linhas 1-89) |
| 12 | `src/hooks/useGameController.ts` | `handleEndTurn` (linha 97), `handleLoad` (linha 799), `handleAction` |
| 13 | `src/persistence.ts` | `saveAutoSave`, `loadSave`, `listSaves` |
| 14 | `src/App.tsx` | Keydown handler (linhas 229-308), modais, `initAudio` |
| 15 | `src/index.css` | Estilos base, variáveis CSS |

---

## Tarefas

### T1 — Verificar dependências e scripts
```bash
cd "/mnt/c/Users/leand/OneDrive/Documentos/Medieval game/Medieval-game"
npm install
```
- Critério de aceite: `npm install` termina sem erros

### T2 — Verificar typecheck
```bash
npx tsc --noEmit
```
- Critério de aceite: documentar erros pré-existentes (se houver), mas NÃO corrigi-los

### T3 — Verificar build
```bash
npm run build
```
- Critério de aceite: build termina sem erros

### T4 — Verificar dev server
```bash
npm run dev
```
- Critério de aceite: servidor inicia, jogo carrega no navegador

### T5 — Mapear estrutura de types
- Ler `src/types.ts` completamente
- Anotar todos os campos de `Realm`, `Province`, `GameState`
- Critério de aceite: lista completa de campos existentes documentada

### T6 — Mapear fluxo de turno
- Ler `processEndOfTurn` em `turnLogic.ts`
- Anotar a ordem das operações: marchOrders → coalitions → activeWars → turn++ → visibility → eventos → gameOver
- Critério de aceite: diagrama mental do fluxo de turno claro

### T7 — Mapear fluxo de IA
- Ler `processAI` em `aiLogic.ts`
- Anotar: IA percorre províncias, constrói (30%), recruta (40%), ataca (se tropas > 25)
- Identificar a função `declareWar` local duplicada (linhas 6-31)
- Critério de aceite: entender que `declareWar` local será removida no Sprint 5

### T8 — Mapear fluxo de combate
- Ler `resolveCombat` em `combatLogic.ts`
- Anotar assinatura: `(attacker: Army, defender: Army, terrain, defenseLevel, state?, provinceId?)`
- Notar que `state` é opcional e usado apenas para efeitos visuais
- Critério de aceite: entender que bônus de combat tech precisa ser aplicado via caller

### T9 — Mapear fluxo de salvamento
- Ler `persistence.ts`
- Anotar: localStorage, sem versionamento de schema
- Critério de aceite: entender que `saveMigration.ts` será necessário no Sprint 8

---

## Comandos de validação
```bash
cd "/mnt/c/Users/leand/OneDrive/Documentos/Medieval game/Medieval-game"
npm run lint         # tsc --noEmit
npm run build        # vite build
npm run dev          # vite --port=3000 --host=0.0.0.0
```

---

## Riscos
- **Erros de typecheck pré-existentes:** Se `tsc --noEmit` falhar por erros que já existiam na Fase 1, documentá-los e NÃO corrigi-los neste sprint
- **Natives do WSL:** Podem faltar `@esbuild/linux-x64`, `@rollup/rollup-linux-x64-gnu` etc. — instalar conforme necessário (`npm install @esbuild/linux-x64 @rollup/rollup-linux-x64-gnu`)
- **Vite HMR stale:** Após edições futuras, pode ser necessário reiniciar em porta nova (`--port=3001`, `--port=3002`, etc.)

---

## O que NÃO deve ser alterado
- **NADA.** Este sprint é apenas de leitura. Nenhum arquivo deve ser modificado.

---

*Sprint 00 — Preparação — Reinos Medievais — Fase 2*
