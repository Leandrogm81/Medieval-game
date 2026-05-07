# PRD — Fase 1: Diplomacia, Hotkeys e Refinamentos de Combate

> **Versão:** 1.0
> **Data:** 07/05/2026
> **Status:** 🔴 TODO
> **Estimativa:** 7-10 dias
> **PRD pai:** [IMPLEMENTACOES-FUTURAS.md](../IMPLEMENTACOES-FUTURAS.md)

---

## 🎯 Visão da Fase

Transformar Reinos Medievais de um jogo de guerra pura para um jogo de estratégia completa com diplomacia funcional, atalhos de teclado, refinamentos de combate e polimento audiovisual. Esta fase entrega o maior retorno sobre investimento: com ~10 dias de trabalho, o jogo ganha uma nova dimensão de profundidade estratégica.

---

## 📦 Entregáveis

| # | Funcionalidade | Dias | Prioridade | Arquivos |
|---|---|---|---|---|
| 1 | Hotkeys | 0.5 | 🔴 Crítica | `App.tsx`, `useUI.ts` |
| 2 | Diplomacia | 3.5 | 🔴 Crítica | `diplomacyLogic.ts`, `DiplomacyModal.tsx`, `types.ts` |
| 3 | Army Retreat | 1.0 | 🟡 Alta | `combatLogic.ts`, `turnLogic.ts` |
| 4 | Ações em Massa | 1.0 | 🟡 Alta | `economyLogic.ts`, `HUD.tsx` |
| 5 | Múltipla Seleção | 1.5 | 🟡 Alta | `Map.tsx`, `useGameController.ts` |
| 6 | Efeitos Sonoros | 1.0 | 🟢 Média | `sfxLogic.ts`, assets |
| 7 | Minimapa | 1.0 | 🟢 Média | `Minimap.tsx`, `Map.tsx` |
| 8 | Partículas | 1.0 | 🟢 Média | `Map.tsx`, `index.css` |

---

## 1. ⌨️ Hotkeys / Atalhos de Teclado

### Resumo
Adicionar atalhos de teclado globais para acelerar ações frequentes, seguindo o padrão do Age of History 2 DE (teclas A,S,D,F para recrutamento).

### Especificação

| Tecla | Ação | Condição |
|-------|------|----------|
| `Enter` | Encerrar turno | Sempre (com jogo ativo) |
| `Esc` | Cancelar ação atual | Com ação ativa (moving/attacking/scouting) |
| `1` | Modo Political | Com jogo ativo |
| `2` | Modo Economic | Com jogo ativo |
| `3` | Modo Military | Com jogo ativo |
| `4` | Modo Diplomatic | Com jogo ativo |
| `5` | Modo Resources | Com jogo ativo |
| `W` | Iniciar marcha (Move) | Com província aliada selecionada |
| `A` | Iniciar ataque (Attack) | Com província aliada selecionada |
| `Q` | Zoom out | Com jogo ativo |
| `E` | Zoom in | Com jogo ativo |
| `Space` | Centralizar na capital | Com jogo ativo |
| `S` | Salvar jogo (quick save) | Com jogo ativo |
| `F` | Alternar tela cheia | Sempre |

### Implementação

**Arquivo:** `src/App.tsx` — adicionar `useEffect` com listener `keydown`

```typescript
useEffect(() => {
  if (!gameState || ui.showMenu) return;
  
  const handleKeyDown = (e: KeyboardEvent) => {
    // Ignorar se foco está em input
    if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
    
    const modeKeys: Record<string, ViewMode> = {
      '1': 'political', '2': 'economic', '3': 'military',
      '4': 'diplomatic', '5': 'resources'
    };
    
    switch(e.key) {
      case 'Enter': ctrl.handleEndTurn(); break;
      case 'Escape': cancelCurrentAction(); break;
      case 'w': case 'W': if (ui.selectedProvinceId) handleMapAction('move'); break;
      case 'a': case 'A': if (ui.selectedProvinceId) handleMapAction('attack'); break;
      case 'q': case 'Q': ui.setZoom(Math.max(0.5, ui.zoom - 0.2)); break;
      case 'e': case 'E': ui.setZoom(Math.min(3, ui.zoom + 0.2)); break;
      case ' ': focusCapital(); e.preventDefault(); break;
      case 's': case 'S': if (!e.ctrlKey) { ctrl.handleSave('quicksave'); e.preventDefault(); } break;
      case 'f': case 'F': toggleFullScreen(); break;
    }
    
    if (modeKeys[e.key]) {
      ui.setViewMode(modeKeys[e.key]);
    }
  };
  
  window.addEventListener('keydown', handleKeyDown);
  return () => window.removeEventListener('keydown', handleKeyDown);
}, [gameState, ui, ctrl]);
```

**UX adicional:** Tooltips nos botões do HUD devem mostrar a hotkey (ex: "Marchar [W]").

### Testes
- [ ] Enter encerra turno e mostra TurnSummary
- [ ] Esc cancela ação de marcha/ataque/scout ativa
- [ ] 1-5 alternam modos de visão corretamente
- [ ] W/A iniciam marcha/ataque a partir da província selecionada
- [ ] Q/E ajustam zoom com animação
- [ ] Space centraliza na capital do jogador
- [ ] Hotkeys NÃO funcionam quando foco está em input
- [ ] Hotkeys NÃO funcionam no menu principal

---

## 2. 👑 Sistema de Diplomacia Completo

### Resumo
Implementar um sistema de diplomacia completo com múltiplas ações, cálculo de aceitação baseado em relações/poder/personalidade, memória de eventos históricos, e UI rica com texto narrativo.

### Estado dos Dados

**Campos existentes em `Realm`:**
```typescript
wars: string[]        // ✅ — IDs de reinos em guerra
pacts: string[]       // 🟡 — existe mas não usado
alliances: string[]   // 🟡 — existe mas sem UI
vassals: string[]     // ✅ — funcional
vassalOf?: string     // ✅ — funcional
relations: Record<string, number>  // 🟡 — existe mas sem ação para alterar
memory: Record<string, { betrayal, help, aggression, lastWarTurn, warExhaustion }> // 🟡 — existe mas sem ação
```

**Novos campos a adicionar em `Realm` (`types.ts`):**
```typescript
nonAggressionPacts: string[]     // IDs de reinos com NAP
defensivePacts: string[]         // IDs de reinos com pacto defensivo
tributeFrom: Record<string, number>  // realmId → gold por turno
tributeTo: Record<string, number>    // realmId → gold por turno
```

### Ações Diplomáticas

#### 2.1 — Aliança (Alliance)
- **Custo:** 2 action points, requer relações >= 50
- **Efeito:** Adiciona aliança bilateral. Se um é atacado, o outro automaticamente entra na guerra (defensive call to arms). Não pode declarar guerra contra aliado.
- **Quebra:** Custa -80 relações com todos os reinos, +30 betrayal na memória
- **Flavor text aceito:** "Os exércitos de {realm} e {player} agora marcham como um só. Que esta aliança ecoe através das eras!"
- **Flavor text rejeitado:** "{realm} declina educadamente. 'Nossos caminhos ainda não se cruzam, nobre senhor.'"

#### 2.2 — Pacto de Não-Agressão (NAP)
- **Custo:** 1 action point, requer relações >= 20
- **Efeito:** Não pode declarar guerra por 20 turnos. Quebra automática se um atacar o outro.
- **Quebra:** -60 relações globais, +25 betrayal
- **Duração:** 20 turnos, renovável

#### 2.3 — Pacto Defensivo
- **Custo:** 1 action point, requer NAP ativo + relações >= 40
- **Efeito:** Se o aliado for atacado, você automaticamente entra na guerra do lado dele.
- **Quebra:** Não atender call to arms = -50 relações, +20 betrayal

#### 2.4 — Melhorar Relações
- **Custo:** 1 action point
- **Efeito:** +15 a +25 relações (varia com personalidade)
- **Flavor text:** "Mensageiros partem carregando sedas finas e palavras de amizade para {realm}."

#### 2.5 — Enviar Insulto
- **Custo:** 1 action point
- **Efeito:** -15 a -25 relações
- **Flavor text:** "O arauto real declara publicamente que o soberano de {realm} tem a graça de um javali embriagado."

#### 2.6 — Oferecer Tributo
- **Custo:** 1 action point
- **Efeito:** Oferece X gold por turno. +10 relações ao oferecer, +2 por turno enquanto pagar. Pode parar a qualquer momento (mas causa -20 relações).

#### 2.7 — Exigir Tributo
- **Custo:** 1 action point
- **Efeito:** Exige X gold por turno. Chance de aceitar baseada em poder militar relativo. Se recusar: -10 relações. Se aceitar: eles pagam, mas +15 betrayal, -1 relação por turno.
- **Ultimato:** Se recusar, pode escalar para guerra.

### Cálculo de Aceitação

```typescript
function getDiplomacyAcceptance(
  playerRealm: Realm,
  targetRealm: Realm,
  action: DiplomacyAction,
  state: GameState
): { acceptance: number; reasons: string[] }
```

**Fatores que influenciam:**
| Fator | Peso |
|-------|------|
| Relações atuais (mapeado para 0-100) | 40% |
| Diferença de poder militar | 20% |
| Personalidade do alvo | 15% |
| Memória de eventos (betrayal, help, aggression) | 15% |
| Inimigos em comum | 5% |
| Distância geográfica | 5% |

**Thresholds:**
- Alliance: >= 70% acceptance
- NAP: >= 60%
- Defensive Pact: >= 75%
- Tribute: >= 50%
- Vassalage: >= 85%

### UI — DiplomacyModal

**Layout:**
```
┌──────────────────────────────────┐
│ 👑 Diplomacia                [X] │
├──────────────────────────────────┤
│ Reino de Avalon ❤️ 72            │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░            │
│ Poder: ⚔️🔥🔥 │ Personalidade: 🦅 │
│                                  │
│ Ações Disponíveis:               │
│ ┌──────────────────────────────┐ │
│ │ 🤝 Melhorar Relações  [1 AP] │ │
│ │ 💢 Enviar Insulto     [1 AP] │ │
│ │ 🛡️ Pacto Não-Agressão [1 AP] │ │
│ │ ⚔️ Pacto Defensivo    [1 AP] │ │
│ │ 👑 Aliança            [2 AP] │ │
│ │ 💰 Oferecer Tributo   [1 AP] │ │
│ │ 📜 Exigir Tributo     [1 AP] │ │
│ │ 🔥 Declarar Guerra    [2 AP] │ │
│ └──────────────────────────────┘ │
│                                  │
│ Histórico:                       │
│ • Turno 5: Avalon ajudou na     │
│   guerra contra Thorne (+15)    │
│ • Turno 12: Avalon quebrou      │
│   pacto comercial (-8)          │
└──────────────────────────────────┘
```

### Fluxo de Implementação

1. **`types.ts`**: Adicionar `nonAggressionPacts`, `defensivePacts`, `tributeFrom`, `tributeTo` ao `Realm`
2. **`src/logic/diplomacyLogic.ts`**: Funções puras exportadas:
   - `proposeAlliance(state, fromId, toId): boolean`
   - `proposeNonAggressionPact(state, fromId, toId): boolean`
   - `proposeDefensivePact(state, fromId, toId): boolean`
   - `improveRelations(state, fromId, toId): number` (retorna novo valor)
   - `sendInsult(state, fromId, toId): number`
   - `offerTribute(state, fromId, toId, amount): boolean`
   - `demandTribute(state, fromId, toId, amount): boolean`
   - `getDiplomacyAcceptance(state, fromId, toId, action): { acceptance, reasons }`
   - `getDiplomacyFlavorText(action, fromName, toName, accepted): string`
   - `checkDefensiveCallToArms(state, defenderId): void` — chamado quando guerra é declarada
3. **`DiplomacyModal.tsx`**: Reescrever com UI completa
4. **`useGameController.ts`**: Adicionar handlers: `handleDiplomacyAction()`, `handleDeclareWar()`
5. **`useUI.ts`**: Adicionar estados: `showDiplomacyModal`, `selectedDiplomacyTargetId`
6. **`HUD.tsx`**: Botão "Diplomacia" no painel
7. **`turnLogic.ts` — `processEndOfTurn`**: Tributos processados, NAP timers decrementados

### Testes
- [ ] Aliança impede declarar guerra contra aliado
- [ ] Pacto defensivo: atacar aliado = entrar na guerra automaticamente
- [ ] Melhorar relações: valor sobe entre +15 e +25
- [ ] Insulto: valor cai entre -15 e -25
- [ ] Tributo: gold transferido a cada turno; parar = -20 relações
- [ ] Aceitação considera todos os fatores (poder, personalidade, memória)
- [ ] Flavor text muda dependendo do resultado (aceito/rejeitado)
- [ ] Memória de eventos persiste entre turnos
- [ ] NAP expira após 20 turnos

---

## 3. 🏃 Army Retreat (Recuo de Exército)

### Resumo
Quando um exército é derrotado em batalha, uma porcentagem das tropas sobreviventes recua para uma província vizinha amigável, em vez de desaparecer completamente.

### Especificação

**Regras:**
- 30% das tropas sobreviventes (pós-batalha) recuam
- Destino: província vizinha com mesmo ownerId (amigável)
- Se múltiplas províncias vizinhas amigáveis → escolhe a com maior troops (mais segura)
- Se NENHUMA província vizinha amigável → tropas são perdidas (sem recuo)
- Recuo NÃO conta como ação (acontece automaticamente)
- Tropas recuadas mantêm sua composição proporcional

### Implementação

**Arquivo:** `src/logic/combatLogic.ts` — modificar `resolveCombat` para retornar info de recuo

```typescript
// Nova função exportada
export function getRetreatDestination(
  state: GameState,
  defeatedProvinceId: string,
  realmId: string
): string | null {
  const prov = state.provinces[defeatedProvinceId];
  if (!prov) return null;
  
  const friendlyNeighbors = prov.neighbors
    .map(id => state.provinces[id])
    .filter(p => p && p.ownerId === realmId)
    .sort((a, b) => b.troops - a.troops); // mais segura primeiro
  
  return friendlyNeighbors.length > 0 ? friendlyNeighbors[0].id : null;
}

export function executeRetreat(
  remainingArmy: Army,
  destinationProv: Province,
  retreatRatio: number = 0.3
): Army {
  const retreating: Army = {
    infantry: Math.floor(remainingArmy.infantry * retreatRatio),
    archers: Math.floor(remainingArmy.archers * retreatRatio),
    cavalry: Math.floor(remainingArmy.cavalry * retreatRatio),
    scouts: Math.floor((remainingArmy.scouts || 0) * retreatRatio),
  };
  
  destinationProv.army.infantry += retreating.infantry;
  destinationProv.army.archers += retreating.archers;
  destinationProv.army.cavalry += retreating.cavalry;
  destinationProv.army.scouts += retreating.scouts;
  destinationProv.troops = destinationProv.army.infantry + destinationProv.army.archers + destinationProv.army.cavalry + destinationProv.army.scouts;
  
  return retreating;
}
```

**Arquivo:** `src/logic/turnLogic.ts` — modificar `finishAttack` em `processMarchOrders`:

```typescript
const finishAttack = (order, prov) => {
  // ... existing combat resolution ...
  
  if (!result.won) {
    // Attacker lost — try retreat
    const retreatDest = getRetreatDestination(state, prov.id, order.realmId);
    if (retreatDest) {
      const retreating = executeRetreat(result.attackerRemaining, state.provinces[retreatDest]);
      if (order.realmId === state.playerRealmId) {
        state.logs.push(`DERROTA! ${retreating.infantry + retreating.archers + retreating.cavalry} tropas recuaram para ${state.provinces[retreatDest].name}.`);
      }
    }
  } else {
    // Defender lost — try retreat for defender
    const retreatDest = getRetreatDestination(state, prov.id, prov.ownerId);
    if (retreatDest) {
      executeRetreat(result.defenderRemaining, state.provinces[retreatDest]);
    }
  }
  // ... rest of existing logic ...
};
```

**`BattleOutcomeModal.tsx`**: Mostrar detalhes do recuo (quantas tropas, para onde)

### Testes
- [ ] Atacante derrotado: 30% das tropas restantes recuam para província amigável vizinha
- [ ] Defensor derrotado: 30% das tropas restantes recuam para província amigável vizinha
- [ ] Sem província amigável vizinha: tropas são perdidas
- [ ] Múltiplas províncias vizinhas: recua para a mais segura (mais tropas)
- [ ] Recuo não gasta action points
- [ ] Modal de resultado mostra detalhes do recuo

---

## 4. 🏗️ Ações em Massa nas Províncias

### Resumo
Permitir que o jogador execute ações em TODAS as províncias simultaneamente, essencial para gerenciar impérios grandes sem micro-gerenciamento tedioso.

### Ações

| Ação | Custo por Província | Efeito |
|------|---------------------|--------|
| Assimilar Todas | 50 gold | +5 loyalty em todas as províncias |
| Investir em Todas | 100 gold | +10 wealth em todas as províncias |
| Construir Farms | 100 gold + 50 materials | +1 farm em províncias elegíveis |
| Construir Mines | 150 gold + 75 materials | +1 mine em províncias elegíveis |
| Construir Workshops | 200 gold + 100 materials | +1 workshop em províncias elegíveis |
| Construir Courts | 300 gold + 150 materials | +1 court em províncias elegíveis |

**Regras:**
- Só age em províncias do jogador
- Custo total = soma de custos de cada província
- Se recursos insuficientes → age no máximo de províncias possível (da capital para fora)
- Mostrar estimativa de custo ANTES de confirmar
- Confirmação: modal "Esta ação custará X gold e Y materials. Continuar?"

### Implementação

**Arquivo:** `src/logic/economyLogic.ts`

```typescript
export function massAssimilate(state: GameState, realmId: string): { count: number; cost: number } {
  const realm = state.realms[realmId];
  if (!realm) return { count: 0, cost: 0 };
  
  const provinces = Object.values(state.provinces)
    .filter(p => p.ownerId === realmId)
    .sort((a, b) => {
      // Sort by distance from capital (closest first)
      const distA = a.id === realm.capitalId ? 0 : 999;
      const distB = b.id === realm.capitalId ? 0 : 999;
      return distA - distB;
    });
  
  let count = 0;
  for (const p of provinces) {
    if (realm.gold < 50) break;
    realm.gold -= 50;
    p.loyalty = Math.min(100, p.loyalty + 5);
    count++;
  }
  
  return { count, cost: count * 50 };
}
```

**`HUD.tsx`**: Adicionar botão "⚡ Ações em Massa" que abre submenu com as opções.

### Testes
- [ ] Assimilar todas: +5 loyalty em cada província, gold deduzido
- [ ] Construir farms: +1 farm onde possível, custo total correto
- [ ] Recursos insuficientes: age nas províncias mais próximas da capital primeiro
- [ ] Modal de confirmação mostra custo estimado corretamente
- [ ] Províncias neutras/inimigas não são afetadas
- [ ] Não crasha com 0 gold (simplesmente não faz nada)

---

## 5. 🖱️ Múltipla Seleção de Exércitos

### Resumo
Permitir selecionar múltiplas províncias de uma vez (via Shift+Click ou arrasto) e mover todos os exércitos simultaneamente para um destino.

### Especificação

**Modos de seleção:**
1. **Shift+Click**: Adiciona/remove província da seleção múltipla
2. **Arrasto com botão direito**: Seleciona todas as províncias do jogador na área

**Quando múltiplas províncias estão selecionadas:**
- Clicar em destino → cria march orders para TODAS as províncias selecionadas
- Cada uma envia suas próprias tropas (composição padrão: todas)
- Preview path mostra caminhos de todas as selecionadas (cores diferentes ou tracejado)
- Ação consome 1 AP por província de origem

**UI:**
- Províncias selecionadas: borda dourada pulsante
- Contador: "3 províncias selecionadas" no banner de ação

### Implementação

**Arquivo:** `src/hooks/useUI.ts`
```typescript
multiSelectedProvinceIds: string[]  // nova propriedade
```

**Arquivo:** `src/components/Map.tsx`
- Handler de Shift+Click
- Handler de arrasto (mousedown → mousemove → mouseup)
- Highlight das províncias multi-selecionadas

### Testes
- [ ] Shift+Click adiciona/remove província da seleção múltipla
- [ ] Arrasto seleciona todas as províncias do jogador na área
- [ ] Clicar em destino cria march orders para todas as selecionadas
- [ ] Cada origem gasta 1 AP
- [ ] Preview mostra caminhos de todas as origens
- [ ] Clicar em província sem shift limpa a seleção múltipla

---

## 6. 🔊 Efeitos Sonoros (SFX)

### Resumo
Adicionar efeitos sonoros para ações do jogo usando Web Audio API, com sons sintetizados (sem dependência de arquivos externos).

### Eventos e Sons

| Evento | Som | Trigger |
|--------|-----|---------|
| Batalha | Clash metálico | `resolveCombat` chamado |
| Vitória | Fanfarra curta | `BattleOutcomeModal` com `won=true` |
| Derrota | Som grave | `BattleOutcomeModal` com `won=false` |
| Recrutamento | Martelo/forja | `executeRecruitment` sucesso |
| Construção | Pedra/madeira | `executeBuilding` sucesso |
| Fim de Turno | Badalo de relógio | `handleEndTurn` |
| Conquista de Província | Trombeta | `finishAttack` com `result.won` |
| Nova Guerra | Tambor | `declareWar` |
| Notificação | Sino suave | Toast |

### Implementação

**Arquivo:** `src/logic/sfxLogic.ts`
- Usar `AudioContext` com osciladores para gerar sons proceduralmente
- Cada som é uma função que recebe `AudioContext` e toca

```typescript
export function playBattleSound(ctx: AudioContext) { ... }
export function playVictoryFanfare(ctx: AudioContext) { ... }
export function playDefeatSound(ctx: AudioContext) { ... }
export function playRecruitSound(ctx: AudioContext) { ... }
export function playBuildSound(ctx: AudioContext) { ... }
export function playEndTurnSound(ctx: AudioContext) { ... }
```

**Toggle:** Botão 🔈/🔊 no HUD. Preferência salva em localStorage.

### Testes
- [ ] Cada ação tem seu som distinto
- [ ] Toggle liga/desliga todos os sons
- [ ] Sons não tocam quando jogo está pausado/menu
- [ ] Sem crash se AudioContext não disponível (fallback silencioso)
- [ ] Preferência persiste após reload

---

## 7. 🗺️ Minimapa

### Resumo
Um minimapa no canto inferior esquerdo mostrando uma visão reduzida do mapa com indicação da viewport atual.

### Especificação

**Posição:** Canto inferior esquerdo, 150x100px
**Conteúdo:**
- Todas as províncias coloridas por ownerId (versão minificada)
- Retângulo branco indicando a viewport atual
- Clicar no minimapa = mover viewport para aquela posição

**Tamanho:** Fixo proporcional ao tamanho do mapa
**Zoom:** O retângulo da viewport ajusta com o zoom

### Implementação

**Arquivo:** `src/components/Minimap.tsx`
- Renderiza versão minificada SVG do mapa
- Overlay do retângulo de viewport
- Handler de click para navegação

```typescript
interface MinimapProps {
  gameState: GameState;
  panOffset: { x: number; y: number };
  zoom: number;
  viewportSize: { width: number; height: number };
  onNavigate: (x: number, y: number) => void;
}
```

### Testes
- [ ] Minimapa renderiza cores corretas por ownerId
- [ ] Retângulo de viewport move com pan
- [ ] Retângulo de viewport ajusta tamanho com zoom
- [ ] Clicar no minimapa move a viewport principal
- [ ] Minimapa some no menu (só aparece no jogo)
- [ ] Responsivo em mobile (menor ou escondido)

---

## 8. ✨ Efeitos de Partículas

### Resumo
Adicionar partículas visuais para eventos importantes: batalhas, conquistas e construções.

### Eventos

| Evento | Partículas | Cor | Duração |
|--------|-----------|-----|---------|
| Batalha | Faíscas/explosão | Laranja/Vermelho | 800ms |
| Conquista | Confete/subida | Dourado | 1200ms |
| Construção | Pó/pedras caindo | Cinza | 600ms |

### Implementação

**Arquivo:** `src/index.css` — animações CSS

```css
@keyframes particle-burst {
  0% { transform: scale(0) translate(0, 0); opacity: 1; }
  100% { transform: scale(1) translate(var(--tx), var(--ty)); opacity: 0; }
}

.particle {
  position: absolute;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  animation: particle-burst 0.8s ease-out forwards;
}
```

**`Map.tsx`**: Renderizar `<div>` absoluto sobre província afetada com N partículas, cada uma com `--tx` e `--ty` aleatórios.

**`types.ts`**: `VisualEffect` já existe — estender para suportar partículas.

### Testes
- [ ] Partículas aparecem na posição da província
- [ ] Cores diferentes para cada tipo de evento
- [ ] Partículas desaparecem após duração
- [ ] Performance: máximo 3 animações simultâneas
- [ ] Não crasha com múltiplos eventos no mesmo frame

---

## 🧪 Testes de Integração da Fase

- [ ] Hotkeys + Diplomacia + Army Retreat funcionam juntos sem conflitos
- [ ] Ações em massa não interferem com march orders ativas
- [ ] Múltipla seleção + hotkeys (W/A) funcionam em conjunto
- [ ] SFX + Partículas não causam lag
- [ ] Minimapa atualiza após conquistas/trocas de dono
- [ ] Todas as novas funcionalidades funcionam em mobile (touch events)
- [ ] `npm run lint` limpo
- [ ] `npm run build` sem erros

---

## 📊 Critérios de Aceitação da Fase

- [ ] Jogador pode realizar TODAS as ações diplomáticas listadas
- [ ] Hotkeys documentadas cobrem todas as ações listadas
- [ ] Exército derrotado recua em vez de desaparecer
- [ ] Ações em massa funcionam para pelo menos 3 tipos (assimilar, investir, construir farms)
- [ ] Seleção múltipla funciona com Shift+Click e arrasto
- [ ] SFX audível para batalha, vitória, derrota e construção
- [ ] Minimapa funcional com navegação por clique
- [ ] Partículas visíveis em batalhas e conquistas
- [ ] Nenhum estado do jogo é mutado incorretamente (deep clone em todos os handlers)
- [ ] GameState permanece consistente após 50+ turnos com todas as novas mecânicas

---

*PRD-FASE-1 | Reinos Medievais | Versão 1.0 | 07/05/2026*
