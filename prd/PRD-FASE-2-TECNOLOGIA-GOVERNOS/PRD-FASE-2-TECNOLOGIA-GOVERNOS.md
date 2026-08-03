# PRD — Fase 2: Tecnologia, Governos e Profundidade Estratégica

> **Versão:** 1.0
> **Data:** 07/05/2026
> **Status:** 🔴 TODO
> **Estimativa:** 10-15 dias
> **Pré-requisito:** Fase 1 concluída
> **PRD pai:** [IMPLEMENTACOES-FUTURAS.md](../IMPLEMENTACOES-FUTURAS.md)

---

## 🎯 Visão da Fase

Adicionar camadas de profundidade estratégica que transformam cada partida em uma experiência única. O sistema de tecnologia introduz progressão de longo prazo, governos permitem especialização de reinos com trade-offs reais, e a IA aprimorada cria oponentes que respondem de forma crível às ações do jogador.

---

## 📦 Entregáveis

| # | Funcionalidade | Dias | Prioridade | Arquivos |
|---|---|---|---|---|
| 1 | Sistema de Tecnologia | 3.0 | 🔴 Crítica | `technologyLogic.ts`, `TechnologyModal.tsx`, `types.ts` |
| 2 | Capitulação | 1.0 | 🔴 Crítica | `turnLogic.ts` |
| 3 | Sistema de Governos | 2.0 | 🔴 Crítica | `governmentLogic.ts`, `GovernmentModal.tsx` |
| 4 | Novos Modos de Mapa | 2.0 | 🟡 Alta | `Map.tsx`, `types.ts` |
| 5 | Sistema de Empréstimos | 1.0 | 🟡 Alta | `economyLogic.ts` |
| 6 | IA Avançada | 2.0 | 🟡 Alta | `aiLogic.ts` |
| 7 | Música Ambiente | 1.0 | 🟢 Média | assets |
| 8 | Responsividade de Modais | 1.0 | 🟢 Média | Todos os modais |
| 9 | Liberty Desire dos Vassalos | 1.0 | 🟢 Média | `turnLogic.ts`, `HUD.tsx` |
| 10 | Tela de Derrota Narrativa | 0.5 | 🟢 Média | `GameEndModal.tsx` |

---

## 1. 🔬 Sistema de Tecnologia

### Resumo
Sistema de progressão onde cada reino acumula pontos de tecnologia por turno e os aloca em 4 categorias, cada uma fornecendo bônus cumulativos. Inspirado diretamente no sistema de tecnologia do Age of History 2 DE.

### Modelo de Dados

**Novos campos em `Realm` (`types.ts`):**
```typescript
techPoints: number;                           // Pontos acumulados não alocados
techLevels: {
  movement: number;      // +0.5 AP extra por nível
  assimilation: number;  // -10% custo de assimilação por nível
  recruitment: number;   // +10% população recrutável por nível
  combat: number;        // +5% ataque e defesa por nível
};
techGeneration: number;  // Quantos pontos gera por turno (baseado em economia)
```

### Geração de Tech Points

```typescript
function generateTechPoints(realm: Realm, provinces: Province[]): number {
  // Base: 1 + bônus por população total e edifícios
  const totalPop = provinces.reduce((sum, p) => sum + p.population, 0);
  const totalWorkshops = provinces.reduce((sum, p) => sum + p.buildings.workshops, 0);
  const totalCourts = provinces.reduce((sum, p) => sum + p.buildings.courts, 0);

  let points = 1; // base
  points += Math.floor(totalPop / 500);     // +1 por 500 população
  points += totalWorkshops;                  // +1 por workshop
  points += Math.floor(totalCourts / 2);     // +1 por 2 courts

  return Math.min(points, 20); // cap em 20 por turno
}
```

### Efeitos por Nível

| Categoria | Bônus por Nível | Nível Máx | Fórmula |
|-----------|----------------|-----------|---------|
| Movement | +0.5 maxActionPoints | 10 | `realm.maxActionPoints = 5 + realm.techLevels.movement * 0.5` |
| Assimilation | -10% custo assimilação | 10 | `assimilationCost *= (1 - realm.techLevels.assimilation * 0.1)` |
| Recruitment | +10% pop recrutável | 10 | `maxRecruitable *= (1 + realm.techLevels.recruitment * 0.1)` |
| Combat | +5% atk e def | 20 | `atkPower *= (1 + realm.techLevels.combat * 0.05)` |

### Alocação

- Custa 10 techPoints para subir 1 nível em qualquer categoria
- Custo aumenta: 10 → 15 → 25 → 40 → 60 → ...
- Só pode alocar durante o turno do jogador (gasta 1 AP)
- Felicidade: +1 loyalty em TODAS as províncias quando qualquer tech sobe de nível

### UI — TechnologyModal

```
┌──────────────────────────────────────┐
│ 🔬 Tecnologia            Pontos: 23  │
│ Geração: +5/turno                  [X]│
├──────────────────────────────────────┤
│                                      │
│ 🏃 Movimento        Nível 3  [+1.5AP]│
│ ▓▓▓▓▓▓▓▓▓▓░░░░░              [↑ 25] │
│ Próximo: +0.5 AP extra              │
│                                      │
│ 🏗️ Assimilação      Nível 1  [-10%] │
│ ▓▓▓░░░░░░░░░░░░              [↑ 15] │
│ Próximo: -20% custo assimilação     │
│                                      │
│ 👥 Recrutamento     Nível 2  [+20%] │
│ ▓▓▓▓▓░░░░░░░░░░              [↑ 25] │
│ Próximo: +30% pop recrutável        │
│                                      │
│ ⚔️ Combate           Nível 5  [+25%] │
│ ▓▓▓▓▓▓▓▓▓▓▓▓▓░░░           [↑ 40]  │
│ Próximo: +30% ataque e defesa       │
│                                      │
├──────────────────────────────────────┤
│ Reinos Vizinhos:                     │
│ • Thorne:  Mov 2 | Ass 1 | Rec 3... │
│ • Avalon:  Mov 5 | Ass 2 | Rec 1... │
└──────────────────────────────────────┘
```

### Implementação

**Arquivo novo:** `src/logic/technologyLogic.ts`
```typescript
export function generateTechPoints(realm: Realm, state: GameState): number;
export function allocateTechPoints(realm: Realm, category: TechCategory, amount: number): boolean;
export function getTechEffects(realm: Realm): TechEffects;
export function getTechUpgradeCost(currentLevel: number): number;
export function applyTechCombatBonus(attacker: Realm, defender: Realm, atkPower: number, defPower: number): [number, number];
```

**Integração:**
- `turnLogic.ts` → `processEndOfTurn`: chamar `generateTechPoints` para cada reino
- `economyLogic.ts` → `getMaxRecruitable`: aplicar bônus de recruitment tech
- `combatLogic.ts` → `resolveCombat`: aplicar bônus de combat tech
- `useGameController.ts` → handler para alocar pontos
- `types.ts` → `ViewMode` adicionar `'technology'`

### Testes
- [ ] Tech points gerados proporcionalmente à população e edifícios
- [ ] Alocação deduz pontos e incrementa nível
- [ ] Custo de upgrade aumenta com nível
- [ ] Bônus de movement: +0.5 AP por nível
- [ ] Bônus de recruitment: +10% população recrutável por nível
- [ ] Bônus de combat: +5% atk/def por nível
- [ ] Cap de 20 pontos por turno
- [ ] Felicidade sobe (+1 loyalty global) ao subir qualquer tech
- [ ] Visualização de tech de outros reinos funciona

---

## 2. 🏳️ Capitulação (Auto-Surrender)

### Resumo
Sistema onde uma civilização se rende automaticamente quando perde território suficiente e a pontuação de guerra está muito desfavorável, evitando guerras eternas.

### Regras

**Condições de capitulação:**
- > 60% das províncias ocupadas (controladas pelo inimigo)
- OU war score > 70% a favor do atacante
- OU capital capturada + war score > 50%

**Efeitos da capitulação:**
- Guerra termina imediatamente
- Derrotado perde 50% das províncias ocupadas (as mais distantes da capital)
- Derrotado vira vassalo do vencedor se ainda tiver províncias
- Se não tiver mais províncias → reino é eliminado
- -20% de bônus de felicidade em todas as províncias do vencedor por 5 turnos (instabilidade pós-guerra)

**Notificação especial:**
```
🏳️ {Derrotado} se rendeu a {Vencedor}!
Após perder {X} províncias e ver sua capital ameaçada,
o reino de {Derrotado} depôs suas armas.
{X} províncias foram cedidas. {Derrotado} agora é vassalo de {Vencedor}.
```

### Implementação

**Arquivo:** `src/logic/turnLogic.ts` — modificar `processActiveWars`

```typescript
function checkCapitulation(state: GameState, war: War): CapitulationResult | null {
  const attacker = state.realms[war.attackerId];
  const defender = state.realms[war.defenderId];
  if (!attacker || !defender) return null;

  const totalDefenderProvinces = Object.values(state.provinces)
    .filter(p => p.ownerId === defender.id).length;
  const occupiedProvinces = Object.values(state.provinces)
    .filter(p => p.ownerId === war.attackerId &&
      /* era do defensor */ /* precisamos rastrear ocupação */).length;

  const occupationRatio = occupiedProvinces / Math.max(totalDefenderProvinces, 1);
  const capitalCaptured = state.provinces[defender.capitalId || '']?.ownerId === war.attackerId;

  if (occupationRatio > 0.6 || war.warScore > 70 || (capitalCaptured && war.warScore > 50)) {
    return { winnerId: war.attackerId, loserId: war.defenderId, occupationRatio };
  }
  return null;
}
```

**Nota:** Precisamos adicionar `originalOwnerId?: string` ao `Province` para rastrear de quem era a província originalmente durante a guerra, possibilitando calcular "províncias ocupadas".

### Testes
- [ ] > 60% províncias ocupadas → capitulação
- [ ] War score > 70% → capitulação
- [ ] Capital capturada + war score > 50% → capitulação
- [ ] Derrotado vira vassalo se ainda tem províncias
- [ ] Derrotado é eliminado se perdeu todas as províncias
- [ ] Notificação especial renderizada no TurnSummary
- [ ] Capitulação NÃO ocorre antes das condições mínimas

---

## 3. 🏛️ Sistema de Governos

### Resumo
Cada reino tem um tipo de governo que concede bônus e penalidades. O jogador pode mudar de governo (com custos), e governos podem ser impostos via diplomacia/guerra.

### Tipos de Governo

| Governo | Bônus | Penalidade | Flavor |
|---------|-------|-----------|--------|
| **Monarchy** | +10% defesa em todas as províncias | -1 ação diplomática por turno | "A coroa é absoluta. A diplomacia... nem tanto." |
| **Republic** | +1 ação diplomática por turno, +5% gold income | -10% estabilidade em províncias distantes | "O senado debate enquanto o reino prospera." |
| **Feudal** | +15% food production, vassalos +10 loyalty | -5% gold income (taxa feudal) | "Juramentos de lealdade, colheitas abundantes." |
| **Theocracy** | +20% loyalty em todas as províncias | -10% tech generation | "A fé move montanhas, mas não acelera a pesquisa." |
| **Despotism** | +15% ataque militar, recrutamento 20% mais barato | -20% crescimento populacional | "O chicote recruta rápido, mas o povo sofre." |
| **Oligarchy** | +25% gold dos vassalos | -10 relações com todos os reinos | "Poucos governam. Muitos desconfiam." |
| **Tribal** | Bônus dobrado de recursos estratégicos | -1 AP por turno, -20% tech generation | "A terra provê. O resto espera." |

### Modelo de Dados

**Novo campo em `Realm`:**
```typescript
government: GovernmentType;  // 'monarchy' | 'republic' | 'feudal' | 'theocracy' | 'despotism' | 'oligarchy' | 'tribal'
```

### Mudança de Governo

- **Custo:** 500 gold + 200 materials + instabilidade temporária (-30 loyalty em todas as províncias por 3 turnos)
- **Cooldown:** 20 turnos entre mudanças
- **Via diplomacia:** Ao fim de guerra, vencedor pode impor mudança de governo ao derrotado
- **Via revolução:** Se estabilidade < 20 em mais de 50% das províncias → chance de revolução (muda governo aleatoriamente)

### Implementação

**Arquivo novo:** `src/logic/governmentLogic.ts`
```typescript
export const GOVERNMENT_STATS: Record<GovernmentType, GovernmentStats>;
export function applyGovernmentBonuses(realm: Realm, state: GameState): void;
export function changeGovernment(realm: Realm, newType: GovernmentType, state: GameState): { success: boolean; message: string };
export function checkRevolution(realm: Realm, state: GameState): GovernmentType | null;
export function getGovernmentFlavor(type: GovernmentType): string;
```

**UI — GovernmentModal:**
- Lista de governos disponíveis com bônus/penalidades
- Botão "Reformar Governo" com custo visível
- Indicador de cooldown
- Confirmação: "Esta reforma custará 500 gold, 200 materials e causará instabilidade por 3 turnos. Continuar?"

### Testes
- [ ] Monarchy: +10% defesa, -1 ação diplomática
- [ ] Republic: +1 ação diplomática, +5% gold
- [ ] Feudal: +15% food, vassalos mais leais, -5% gold
- [ ] Despotism: +15% ataque, -20% crescimento pop
- [ ] Mudança de governo custa recursos + instabilidade
- [ ] Cooldown de 20 turnos funciona
- [ ] Revolução ocorre com estabilidade muito baixa
- [ ] Governo pode ser imposto via tratado de paz
- [ ] Múltiplas mudanças no mesmo turno são bloqueadas

---

## 4. 🎯 Novos Modos de Mapa

### Resumo
Adicionar 7 novos modos de visualização ao mapa, elevando o total de 5 para 12.

### Modos

| # | Modo | Heatmap | Label | Cor |
|---|------|---------|-------|-----|
| 6 | **População** | total pop / max pop | "12.450" | Verde (mais = mais escuro) |
| 7 | **Desenvolvimento** | wealth + sum(buildings) | "Dev: 45" | Azul |
| 8 | **Renda Total** | goldIncome (sem maintenance) | "+320g" | Dourado |
| 9 | **Estabilidade** | loyalty / 100 | "85%" | Branco (feliz) → Vermelho (rebelde) |
| 10 | **Edifícios** | soma de todos os edifícios | "🏘️4" | Roxo |
| 11 | **Crescimento** | population growth rate | "+3%" | Ciano |
| 12 | **Força Militar** | troops / max troops | "⚔️45" | Laranja |

### Atalhos de Teclado

| Tecla | Modo |
|-------|------|
| `1` | Political |
| `2` | Economic |
| `3` | Military |
| `4` | Diplomatic |
| `5` | Resources |
| `6` | Population |
| `7` | Development |
| `8` | Income |
| `9` | Stability |
| `0` | Buildings |

### Implementação

**`types.ts`:** Expandir `ViewMode`:
```typescript
export type ViewMode = 'political' | 'economic' | 'military' | 'diplomatic' | 'resources' | 'trade'
  | 'population' | 'development' | 'income' | 'stability' | 'buildings' | 'growth' | 'military_strength';
```

**`Map.tsx`:** Adicionar lógica de coloração e labels para cada novo modo.

### Testes
- [ ] Cada modo mostra a cor/label correta
- [ ] Modo estabilidade: verde para leal, vermelho para rebelde
- [ ] Ranking de população/desenvolvimento aparece no HUD
- [ ] Atalhos 6-0 funcionam no jogo

---

## 5. 💰 Sistema de Empréstimos

### Resumo
Permitir que o jogador (e a IA) peça empréstimos de gold com pagamento parcelado ao longo de vários turnos.

### Especificação

**Limite de crédito:**
```
maxLoan = Math.floor(totalGoldIncome * 5)
```
(Ou seja, pode pegar até 5x a renda total por turno.)

**Termos:**
- Período: 10 turnos
- Juros: 15% total (1.5% por turno)
- Pagamento: automático no `processEndOfTurn`
- Se não puder pagar parcela: -10 relações com todos os reinos, -5 loyalty em todas as províncias

**Modelo:**
```typescript
// Em Realm:
loans: { amount: number; remaining: number; paymentPerTurn: number; defaulted: boolean }[];
```

### Implementação

**`economyLogic.ts`:**
```typescript
export function requestLoan(realm: Realm, amount: number): { success: boolean; paymentPerTurn: number };
export function processLoanPayments(realm: Realm, state: GameState): void;
export function getMaxLoanAmount(realm: Realm): number;
```

**`HUD.tsx`:** Botão "💰 Empréstimo" no painel de economia.

**`aiLogic.ts`:** IA pede empréstimo quando:
- Está em guerra E gold < 0 por mais de 2 turnos
- OU precisa recrutar urgente e não tem gold

### Testes
- [ ] Jogador recebe gold imediatamente
- [ ] Parcelas descontadas automaticamente a cada turno
- [ ] Após 10 turnos, empréstimo está quitado
- [ ] Default (não pagar): penalidade de relações e loyalty
- [ ] Limite de crédito proporcional à renda
- [ ] IA pede empréstimo em guerra com gold negativo
- [ ] Múltiplos empréstimos simultâneos funcionam

---

## 6. 🧠 IA Avançada

### Resumo
Reescrever a IA para usar as personalidades definidas em `types.ts`, tomar decisões contextuais e fornecer um desafio mais realista.

### Personalidades e Comportamento

| Personalidade | Prioridade | Comportamento |
|--------------|-----------|---------------|
| **Expansionist** | Atacar > Recrutar > Construir | Ataca sempre que tem vantagem 2:1. Ignora diplomacia. |
| **Defensive** | Construir > Fortificar > Diplomacia | Só ataca se provocado. Prioriza defesa e estabilidade. |
| **Diplomatic** | Diplomacia > Alianças > Economia | Busca alianças, evita guerra, oferece tributos. |
| **Opportunistic** | Atacar fraco > Economia | Ataca quando vizinho está em guerra ou com poucas tropas. |
| **Commercial** | Economia > Trade > Construir | Foca em gold, trade routes, evita guerra. |

### Novos Comportamentos

```typescript
function processAIDiplomacy(state: GameState, realm: Realm): void {
  switch (realm.personality) {
    case 'diplomatic':
      // Busca aliados entre vizinhos com relações > 0
      // Oferece pactos de não-agressão
      // Melhora relações com reinos mais fortes
      break;
    case 'expansionist':
      // Envia insultos para provocar guerra
      // Exige tributo de reinos mais fracos
      break;
    case 'commercial':
      // Oferece trade routes
      // Pede empréstimo para investir em economia
      break;
    // etc.
  }
}

function processAILoans(state: GameState, realm: Realm): void {
  if (realm.gold < 0 && realm.wars.length > 0) {
    const maxLoan = getMaxLoanAmount(realm);
    if (maxLoan > 100) {
      requestLoan(realm, Math.min(maxLoan, 500));
    }
  }
}

function shouldAIAttack(realm: Realm, target: Realm, prov: Province, targetProv: Province): boolean {
  const powerRatio = calculateMilitaryPower(realm, state) / calculateMilitaryPower(target, state);

  switch (realm.personality) {
    case 'expansionist': return powerRatio > 1.5;  // Só ataca com boa vantagem
    case 'opportunistic': return powerRatio > 1.0 && (target.wars.length > 0 || targetProv.troops < 20);
    case 'defensive': return false;  // Nunca inicia guerra
    case 'diplomatic': return powerRatio > 3.0;  // Só em esmagadora vantagem
    case 'commercial': return powerRatio > 2.5 && prov.troops > 50;
  }
}
```

### Agressividade Configurável

No `GameSettings` (menu de novo jogo):
```typescript
aiAggression: number; // 0-100, default 50
```

Multiplicador aplicado à chance de ataque da IA.

### Testes
- [ ] Expansionist ataca com vantagem 1.5:1
- [ ] Defensive nunca inicia guerras
- [ ] Opportunistic ataca vizinhos em guerra
- [ ] Commercial foca em economia
- [ ] IA pede empréstimo quando necessário
- [ ] Agressividade configurável afeta todas as personalidades
- [ ] IA não investe em província com wealth > 90% do máximo

---

## 7. 🎵 Música Ambiente

### Resumo
Adicionar trilha sonora medieval de fundo, com faixas diferentes para o menu e para o jogo.

### Especificação

- **Menu:** Faixa calma, contemplativa
- **Jogo (paz):** Faixa ambiente neutra
- **Jogo (guerra):** Faixa mais intensa (muda quando em guerra)
- **Toggle:** Botão 🔈/🔊 no menu e no HUD
- **Volume:** Ajustável (slider)
- Loop contínuo, transição suave entre faixas (crossfade)

### Implementação

Usar Web Audio API com sons gerados proceduralmente (como SFX) ou arquivos de áudio leves.

```typescript
// src/logic/musicLogic.ts
export function startMenuMusic(ctx: AudioContext): void;
export function startGameMusic(ctx: AudioContext, isAtWar: boolean): void;
export function stopMusic(): void;
export function setMusicVolume(volume: number): void;
```

### Testes
- [ ] Música toca no menu
- [ ] Música muda ao entrar/sair do jogo
- [ ] Música fica mais intensa quando em guerra
- [ ] Toggle liga/desliga
- [ ] Loop contínuo sem gaps
- [ ] Volume ajustável

---

## 8. 📱 Responsividade de Modais

### Resumo
Garantir que todos os modais do jogo funcionem corretamente em dispositivos móveis (largura < 768px).

### Modais a Adaptar

| Modal | Ação |
|-------|------|
| CombatSetupModal | Layout vertical, sliders maiores |
| BattleOutcomeModal | Fonte maior, botão maior |
| TurnResultModal | Scroll vertical, cards empilhados |
| DiplomacyModal | Lista scrollável, botões touch-friendly |
| SaveGameModal | Layout compacto |
| ChronicleModal | Fonte menor, scroll |
| GameInstructionsModal | Accordion em vez de scroll |
| GameEndModal | Layout vertical |

### Padrão

```css
@media (max-width: 768px) {
  .modal-content {
    width: 95vw;
    max-height: 90vh;
    overflow-y: auto;
    padding: 1rem;
    border-radius: 0.5rem;
  }
  .modal-button {
    min-height: 48px; /* touch target */
    min-width: 48px;
  }
}
```

### Testes
- [ ] Todos os modais abrem sem overflow horizontal em 375px
- [ ] Botões têm touch target >= 48px
- [ ] Scroll funciona em modais longos
- [ ] Fechar modal funciona via botão X e via tap fora

---

## 9. 🏴 Liberty Desire dos Vassalos

### Resumo
Vassalos acumulam "desejo de liberdade" ao longo do tempo, podendo se rebelar se não forem apaziguados.

### Mecânica

**Fatores que aumentam Liberty Desire:**
- +2/turno base
- +5/turno se overlord está em guerra
- +10/turno se overlord tem overextension > 80
- +3/turno se vassalo é maior que overlord (mais províncias)

**Fatores que diminuem:**
- -5 ao receber gold do overlord (ação diplomática "Apaziguar Vassalo")
- -3/turno se overlord tem mais tropas que vassalo
- -2/turno se vassalo tem pacto defensivo com overlord

**Rebelião:** Liberty Desire >= 100 → vassalo declara independência (guerra)

**Notificação:** "⚠️ {Vassalo} está inquieto (Liberty: 85%). Considere apaziguá-lo."

### Modelo de Dados
```typescript
// Em Realm:
vassalLiberty: Record<string, number>;  // vassalId → liberty desire (0-100)
```

### Implementação

**`turnLogic.ts` — `processEndOfTurn`:**
```typescript
function processVassalLiberty(state: GameState): void {
  Object.values(state.realms).forEach(overlord => {
    if (overlord.vassals.length === 0) return;
    
    overlord.vassals.forEach(vassalId => {
      const vassal = state.realms[vassalId];
      if (!vassal) return;
      
      let delta = 2; // base
      
      const overlordAtWar = state.activeWars.some(w => w.attackerId === overlord.id || w.defenderId === overlord.id);
      if (overlordAtWar) delta += 5;
      if (overlord.overextension > 80) delta += 10;
      
      const vassalProvinces = Object.values(state.provinces).filter(p => p.ownerId === vassalId).length;
      const overlordProvinces = Object.values(state.provinces).filter(p => p.ownerId === overlord.id).length;
      if (vassalProvinces > overlordProvinces) delta += 3;
      
      overlord.vassalLiberty[vassalId] = Math.max(0, Math.min(100, (overlord.vassalLiberty[vassalId] || 0) + delta));
      
      if (overlord.vassalLiberty[vassalId] >= 100) {
        // Rebelião!
        vassal.vassalOf = undefined;
        overlord.vassals = overlord.vassals.filter(v => v !== vassalId);
        declareWar(state, vassalId, overlord.id);
        state.logs.push(`REBELIÃO: ${vassal.name} declarou independência de ${overlord.name}!`);
      } else if (overlord.vassalLiberty[vassalId] >= 70 && overlord.isPlayer) {
        state.logs.push(`⚠️ ${vassal.name} está inquieto sob seu domínio (Liberty: ${overlord.vassalLiberty[vassalId]}%).`);
      }
    });
  });
}
```

### Testes
- [ ] Liberty Desire sobe a cada turno
- [ ] Guerra do overlord acelera Liberty
- [ ] Liberty >= 100 → rebelião
- [ ] Apaziguar vassalo reduz Liberty
- [ ] Notificação quando Liberty >= 70

---

## 10. 💀 Tela de Derrota Narrativa

### Resumo
Quando o jogador perde, mostrar uma tela temática em vez de apenas "Game Over".

### Conteúdo

**Template:**
```
┌──────────────────────────────────────┐
│                                      │
│          💀 O FIM DE UMA ERA         │
│                                      │
│     O reino de {PlayerRealm} caiu.   │
│                                      │
│  "{frase temática}"                  │
│                                      │
│  ┌────────────────────────────────┐  │
│  │ 📊 Estatísticas Finais         │  │
│  │ Turnos: {turn}                 │  │
│  │ Províncias máximas: {count}    │  │
│  │ Batalhas vencidas: {wins}      │  │
│  │ Reinos derrotados: {defeated}  │  │
│  │ Ouro acumulado: {gold}         │  │
│  └────────────────────────────────┘  │
│                                      │
│     [Tentar Novamente]   [Menu]      │
│                                      │
└──────────────────────────────────────┘
```

### Frases Temáticas (aleatórias)

- "As crônicas lembrarão seu nome, mas as muralhas já não o protegem."
- "Até os maiores impérios viram pó. O seu não foi exceção."
- "A história é escrita pelos vencedores. Hoje, você não segura a pena."
- "Seu castelo resistiu a incontáveis cercos, mas nenhum reino é eterno."

### Implementação

**`GameEndModal.tsx`:** Já existe. Modificar para detectar se `winnerId !== playerRealmId` e mostrar template de derrota.

### Testes
- [ ] Tela de derrota aparece quando jogador perde (eliminado)
- [ ] Estatísticas finais estão corretas
- [ ] Frase temática é aleatória
- [ ] Botões "Tentar Novamente" e "Menu" funcionam

---

## 🧪 Testes de Integração da Fase

- [ ] Tecnologia + Governos + Economia não causam loops infinitos
- [ ] Capitulação não deixa estado inválido (províncias órfãs)
- [ ] IA avançada + sistema de empréstimos: IA não fica em dívida infinita
- [ ] Liberty Desire + Vassalos + Capitulação: independência e anexação coexistem
- [ ] Música ambiente não conflita com SFX da Fase 1
- [ ] Todos os modos de mapa renderizam sem lag (testar com 40 províncias)
- [ ] Modais responsivos não quebram layout em mobile
- [ ] `npm run lint` limpo
- [ ] `npm run build` sem erros

---

## 📊 Critérios de Aceitação da Fase

- [ ] Jogador pode alocar pontos de tecnologia em 4 categorias
- [ ] Bônus de tecnologia afetam AP, assimilação, recrutamento e combate
- [ ] Civilizações capitulam quando perdem > 60% do território
- [ ] Jogador pode escolher entre 7 tipos de governo
- [ ] Pelo menos 5 novos modos de mapa funcionais
- [ ] Empréstimos funcionam com pagamento automático
- [ ] IA segue suas personalidades de forma distinta
- [ ] Música ambiente toca no menu e no jogo
- [ ] Modais são usáveis em mobile (< 768px)
- [ ] Vassalos se rebelam com Liberty >= 100
- [ ] Derrota mostra tela narrativa com estatísticas

---

*PRD-FASE-2 | Reinos Medievais | Versão 1.0 | 07/05/2026*
