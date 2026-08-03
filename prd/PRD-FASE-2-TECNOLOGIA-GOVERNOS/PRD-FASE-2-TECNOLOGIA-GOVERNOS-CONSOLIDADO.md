# PRD — Fase 2: Tecnologia, Governos e Profundidade Estratégica (v1.1 — Consolidado)

> **Versão:** 1.1 (incorpora revisão crítica de 07/05/2026)
> **Data:** 07/05/2026
> **Status:** 🟡 REFINADO — pronto para decomposição em sprints
> **Estimativa:** 20-25 dias (revisada de 10-15)
> **Pré-requisito:** Fase 1 concluída
> **PRD pai:** [IMPLEMENTACOES-FUTURAS.md](../IMPLEMENTACOES-FUTURAS.md)

---

## 📋 Resumo das Correções Aplicadas (v1.0 → v1.1)

| # | Achado | Correção aplicada |
|---|--------|-------------------|
| C1 | `calculateMilitaryPower` inexistente | Função especificada com fórmula explícita, adicionada como entregável da seção 6 |
| C2 | `originalOwnerId` ausente em Province | Campo formalizado no modelo de dados com regras de set/clear documentadas |
| C3 | `declareWar` com padrão de mutação ambíguo | Código da Liberty reescrito para padrão imutável; função canônica `declareWar` de `diplomacyLogic.ts` referenciada; aiLogic.ts deve ser refatorado para usar a exportada |
| C4 | Fórmula de custo de tech ambígua | Fórmula matemática exata definida: `cost = 10 + 5 * level * (level + 1) / 2` |
| C5 | Atalhos faltantes modos 11-12 | Atribuídos `G` (Growth) e `F` (Military Strength); tabela atualizada |
| C6 | `ViewMode` duplicando `'trade'` | Auditoria concluída: 6 modos existentes (inclui trade). Numeração corrigida; novos modos começam em #7 |
| C7 | `checkCapitulation` vs `processActiveWars` | Interface `CapitulationResult` definida; ponto de inserção especificado (após batalhas, antes da exaustão) |
| I1 | `techGeneration` desnormalizado | Campo tornado computado (não armazenado); triggers de recálculo documentados |
| I2 | `paymentPerTurn` sem fórmula | Fórmula explícita: `Math.ceil((amount * 1.15) / 10)` |
| I3 | Música: estimativa de 1 dia irreal | Estimativa aumentada para 4 dias; abordagem alterada para assets MP3 pré-gravados com `<audio>` nativo |
| I4 | "Províncias distantes" não definido | Métrica definida: caminho BFS > 3 províncias intermediárias até a capital |
| I5 | AP pode ir a zero/negativo | Piso mínimo `Math.max(2, valorCalculado)` para maxActionPoints |
| I6 | Estatísticas de derrota sem tracking | Campos de tracking adicionados ao modelo de Realm com regras de incremento |
| O1 | Estimativa agressiva | Ajustada para 20-25 dias |
| O2 | Sem migração de saves | Seção "Migração de Save Games" adicionada com defaults para todos os novos campos |
| O3 | Teste fantasma de investimento | Removido do checklist de testes da seção 6 |
| O4 | Autoplay policy do browser | Estratégia documentada: iniciar AudioContext via gesto do usuário |

---

## ⚠️ Pendências Resolvidas (Decisões do Usuário)

| # | Pendência | Decisão | Fundamentação |
|---|-----------|---------|---------------|
| P1 | Curva de progressão do custo de tecnologia | **Mantida fórmula triangular:** `cost = 10 + 5 * level * (level + 1) / 2` | Corresponde exatamente à sequência do PRD original (10→15→25→40→60). Crescimento moderado, previsível |
| P2 | Assets de música: gerar vs. baixar | **MP3 gratuitos (CC0)** de OpenGameArt ou Pixabay | Custo zero, licenciamento simples, implementação com `<audio>` nativo |
| P3 | Prazo da fase | **20-25 dias mantido** | Estimativa realista para desenvolvimento por agente IA. Se prazo for crítico, cortar Música e Tela de Derrota |
| P4 | "Províncias distantes" para Republic | **Todas as províncias exceto capital + vizinhas diretas (1 salto BFS)** | Penalidade só NÃO afeta a capital e províncias adjacentes a ela. Qualquer província a ≥2 saltos sofre -10% estabilidade. Simples e claro |
| P5 | `calculateMilitaryPower` para AI | **Soma total de tropas (todas as unidades com peso igual)** × bônus de tech e governo | Segue o padrão do Age of History 2, onde o poder militar é essencialmente o número bruto de tropas. Simples, sem overengineering |
| P6 | Modo 'trade' existente | **Manter com atalho `T`** | Já está implementado no código. Remover seria retrabalho. AoH2 original não tem modo trade no mapa, mas para este projeto é útil como visualização secundária |

---

## 🎯 Visão da Fase

Adicionar camadas de profundidade estratégica que transformam cada partida em uma experiência única. O sistema de tecnologia introduz progressão de longo prazo, governos permitem especialização de reinos com trade-offs reais, e a IA aprimorada cria oponentes que respondem de forma crível às ações do jogador.

---

## 📦 Entregáveis

| # | Funcionalidade | Dias | Prioridade | Arquivos |
|---|---|---|---|---|
| 1 | Sistema de Tecnologia | 3.0 | 🔴 Crítica | `technologyLogic.ts`, `TechnologyModal.tsx`, `types.ts` |
| 2 | Capitulação (Auto-Surrender) | 1.5 | 🔴 Crítica | `turnLogic.ts`, `types.ts` |
| 3 | Sistema de Governos | 2.5 | 🔴 Crítica | `governmentLogic.ts`, `GovernmentModal.tsx`, `types.ts` |
| 4 | Novos Modos de Mapa | 2.0 | 🟡 Alta | `Map.tsx`, `types.ts` |
| 5 | Sistema de Empréstimos | 1.0 | 🟡 Alta | `economyLogic.ts`, `HUD.tsx`, `aiLogic.ts` |
| 6 | IA Avançada | 2.5 | 🟡 Alta | `aiLogic.ts`, `types.ts` |
| 7 | Música Ambiente | 4.0 | 🟢 Média | assets (MP3), `musicLogic.ts` |
| 8 | Responsividade de Modais | 1.0 | 🟢 Média | Todos os modais |
| 9 | Liberty Desire dos Vassalos | 1.5 | 🟢 Média | `turnLogic.ts`, `HUD.tsx`, `types.ts` |
| 10 | Tela de Derrota Narrativa | 1.0 | 🟢 Média | `GameEndModal.tsx`, `types.ts` |

**Total: 20.0 dias** (com folga de 20-25% para integração e imprevistos)

---

## 1. 🔬 Sistema de Tecnologia

### Resumo
Sistema de progressão onde cada reino acumula pontos de tecnologia por turno e os aloca em 4 categorias, cada uma fornecendo bônus cumulativos. Inspirado diretamente no sistema de tecnologia do Age of History 2 DE.

### Modelo de Dados

**Novos campos em `Realm` (`types.ts`):**
```typescript
techPoints: number;                           // Pontos acumulados não alocados
techLevels: {
  movement: number;      // Nível 0-10: +0.5 maxActionPoints por nível
  assimilation: number;  // Nível 0-10: -10% custo de assimilação por nível
  recruitment: number;   // Nível 0-10: +10% população recrutável por nível
  combat: number;        // Nível 0-20: +5% ataque e defesa por nível
};
// NOTA: techGeneration NÃO é armazenado — é calculado sob demanda (ver abaixo)
```

### Geração de Tech Points (FUNÇÃO PURA — não armazena estado)

```typescript
// Em src/logic/technologyLogic.ts
export function generateTechPoints(realm: Realm, state: GameState): number {
  const ownedProvinces = Object.values(state.provinces).filter(p => p.ownerId === realm.id);
  const totalPop = ownedProvinces.reduce((sum, p) => sum + p.population, 0);
  const totalWorkshops = ownedProvinces.reduce((sum, p) => sum + p.buildings.workshops, 0);
  const totalCourts = ownedProvinces.reduce((sum, p) => sum + p.buildings.courts, 0);

  let points = 1; // base
  points += Math.floor(totalPop / 500);     // +1 por 500 população
  points += totalWorkshops;                  // +1 por workshop
  points += Math.floor(totalCourts / 2);     // +1 por 2 courts

  // Aplicar penalidade de governo (Theocracy: -10%, Tribal: -20%)
  // Ver seção 3 para bônus/penalidades por governo

  return Math.min(points, 20); // cap em 20 por turno
}
```

**Pontos de chamada:** `generateTechPoints` deve ser chamada em `processEndOfTurn` para cada reino. O resultado é somado a `realm.techPoints` (acumulador). **NÃO armazenar `techGeneration` como campo** — ele é calculado toda vez que necessário. Isso evita dessincronização quando população ou edifícios mudam por outros caminhos (construção, conquista, crescimento).

### Efeitos por Nível

| Categoria | Bônus por Nível | Nível Máx | Fórmula |
|-----------|----------------|-----------|---------|
| Movement | +0.5 maxActionPoints | 10 | `realm.maxActionPoints = Math.max(2, 5 + realm.techLevels.movement * 0.5 - govPenalty)` |
| Assimilation | -10% custo assimilação | 10 | `assimilationCost *= (1 - realm.techLevels.assimilation * 0.1)` |
| Recruitment | +10% pop recrutável | 10 | `maxRecruitable *= (1 + realm.techLevels.recruitment * 0.1)` |
| Combat | +5% atk e def | 20 | `atkPower *= (1 + realm.techLevels.combat * 0.05)` |

**Piso de AP:** `maxActionPoints` jamais pode ser < 2. Isso protege contra soft-lock quando penalidades de governo (ex: Tribal -1 AP) ou outras reduções acumularem. Aplica-se após todos os modificadores.

### Custo de Upgrade

**Fórmula matemática (substitui a sequência ambígua "10 → 15 → 25 → 40 → 60 → ..."):**

```typescript
export function getTechUpgradeCost(currentLevel: number): number {
  // Sequência triangular: 10, 15, 25, 40, 60, 85, 115, 150, 190, 235, ...
  // Corresponde a: cost = 10 + 5 * level * (level + 1) / 2
  return 10 + 5 * currentLevel * (currentLevel + 1) / 2;
}
```

| Nível atual | Custo para próximo |
|-------------|-------------------|
| 0 → 1 | 10 |
| 1 → 2 | 15 |
| 2 → 3 | 25 |
| 3 → 4 | 40 |
| 4 → 5 | 60 |
| 5 → 6 | 85 |
| 6 → 7 | 115 |
| 7 → 8 | 150 |
| 8 → 9 | 190 |
| 9 → 10 | 235 |

### Alocação

- Custa `getTechUpgradeCost(currentLevel)` techPoints para subir 1 nível
- Só pode alocar durante o turno do jogador (gasta 1 AP)
- Felicidade: +1 loyalty em TODAS as províncias quando qualquer tech sobe de nível
- **Validação:** verificar `realm.techPoints >= getTechUpgradeCost(realm.techLevels[category])` antes de permitir o upgrade

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
export function allocateTechPoints(realm: Realm, category: TechCategory): boolean;
export function getTechEffects(realm: Realm): TechEffects;
export function getTechUpgradeCost(currentLevel: number): number;
export function applyTechCombatBonus(attacker: Realm, defender: Realm, atkPower: number, defPower: number): [number, number];
```

**Integração:**
- `turnLogic.ts` → `processEndOfTurn`: chamar `generateTechPoints` para cada reino, acumular em `realm.techPoints`
- `economyLogic.ts` → `getMaxRecruitable`: aplicar bônus de recruitment tech
- `combatLogic.ts` → `resolveCombat`: aplicar bônus de combat tech
- `useGameController.ts` → handler para alocar pontos (chama `allocateTechPoints`)
- `types.ts` → `ViewMode` adicionar `'technology'`

### Testes
- [ ] Tech points gerados proporcionalmente à população e edifícios
- [ ] `generateTechPoints` é função pura — não armazena estado, mesmo resultado para mesmos inputs
- [ ] Alocação deduz pontos e incrementa nível
- [ ] Custo de upgrade segue a fórmula triangular `10 + 5 * level * (level + 1) / 2`
- [ ] Bônus de movement: +0.5 AP por nível, com piso mínimo `maxActionPoints >= 2`
- [ ] Bônus de recruitment: +10% população recrutável por nível
- [ ] Bônus de combat: +5% atk/def por nível
- [ ] Cap de 20 pontos gerados por turno
- [ ] Felicidade sobe (+1 loyalty global) ao subir qualquer tech
- [ ] Visualização de tech de outros reinos funciona
- [ ] Penalidades de governo (Theocracy, Tribal) afetam geração de tech points

---

## 2. 🏳️ Capitulação (Auto-Surrender)

### Resumo
Sistema onde uma civilização se rende automaticamente quando perde território suficiente e a pontuação de guerra está muito desfavorável, evitando guerras eternas.

### Modelo de Dados

**Novo campo em `Province` (`types.ts`):**
```typescript
originalOwnerId?: string;  // ID do dono pré-guerra. Setado quando a província é conquistada.
                            // Limpo quando a guerra termina (qualquer outcome).
                            // Usado para rastrear "províncias ocupadas" durante guerras ativas.
```

**Regras de lifecycle do `originalOwnerId`:**
1. **Ao conquistar província em guerra:** `province.originalOwnerId = donoAnterior` (antes de trocar `ownerId`)
2. **Ao terminar guerra (capitulação, paz, anexação):** Iterar sobre todas as províncias com `originalOwnerId` pertencentes aos beligerantes e setar `originalOwnerId = undefined`
3. **Consulta:** `state.provinces[pId].ownerId === war.attackerId && state.provinces[pId].originalOwnerId === war.defenderId` → província ocupada pelo atacante

**Nova interface:**
```typescript
interface CapitulationResult {
  winnerId: string;
  loserId: string;
  occupationRatio: number;       // fração de províncias do derrotado ocupadas (0-1)
  provincesToCede: string[];     // lista de provinceIds a ceder (50% das ocupadas, as mais distantes da capital)
}
```

### Regras

**Condições de capitulação (checadas após processar todas as batalhas do turno, antes do cálculo de exaustão):**
- > 60% das províncias do defensor ocupadas (controladas pelo inimigo, detectadas via `originalOwnerId`)
- OU war score > 70% a favor do atacante
- OU capital capturada (`state.provinces[defender.capitalId]?.ownerId === war.attackerId`) + war score > 50%

**Efeitos da capitulação:**
- Guerra termina imediatamente (remover `activeWar`, limpar `realm.wars`, etc.)
- `originalOwnerId` é limpo em todas as províncias envolvidas
- Derrotado perde 50% das províncias ocupadas (escolher as mais distantes da capital do derrotado, usando `findPath` BFS)
- Derrotado vira vassalo do vencedor se ainda tiver províncias (`defender.vassalOf = winner.id`; `winner.vassals.push(defender.id)`)
- Se não tiver mais províncias → reino é eliminado (`delete state.realms[defender.id]`)
- -20% de bônus de felicidade (loyalty -= 20) em todas as províncias do vencedor por 5 turnos (instabilidade pós-guerra)

**Notificação especial:**
```
🏳️ {Derrotado} se rendeu a {Vencedor}!
Após perder {X} províncias e ver sua capital ameaçada,
o reino de {Derrotado} depôs suas armas.
{X} províncias foram cedidas. {Derrotado} agora é vassalo de {Vencedor}.
```

### Implementação

**Arquivo:** `src/logic/turnLogic.ts` — modificar `processActiveWars`

**Ponto de inserção:** A checagem de capitulação ocorre **após** o loop de batalhas (`resolveCombat` para cada `activeWar`) e **antes** do cálculo de exaustão de guerra. Estrutura do fluxo:

```
processActiveWars(state):
  para cada activeWar:
    1. resolveCombat(attacker, defender)   // batalhas do turno
    2. updateWarScore(war)                 // atualizar score
  para cada activeWar:
    3. result = checkCapitulation(state, war)  // NOVO — checar capitulação
    se result:
      4. executeCapitulation(state, result)    // NOVO — aplicar efeitos
      5. continue (pular exaustão para esta guerra)
    6. calculateWarExhaustion(war)         // exaustão normal
```

```typescript
function checkCapitulation(state: GameState, war: War): CapitulationResult | null {
  const attacker = state.realms[war.attackerId];
  const defender = state.realms[war.defenderId];
  if (!attacker || !defender) return null;

  // Contar províncias do defensor ocupadas pelo atacante
  const defenderProvinceIds = Object.keys(state.provinces)
    .filter(pid => state.provinces[pid].originalOwnerId === war.defenderId);
  const occupiedProvinceIds = defenderProvinceIds.filter(pid =>
    state.provinces[pid].ownerId === war.attackerId
  );

  const totalDefenderProvinces = Object.values(state.provinces)
    .filter(p => p.ownerId === war.defenderId || p.originalOwnerId === war.defenderId).length;
  const occupationRatio = occupiedProvinceIds.length / Math.max(totalDefenderProvinces, 1);
  const capitalCaptured = state.provinces[defender.capitalId || '']?.ownerId === war.attackerId;

  if (occupationRatio > 0.6 || war.warScore > 70 || (capitalCaptured && war.warScore > 50)) {
    // Selecionar 50% das províncias ocupadas mais distantes da capital do defensor
    const provincesToCede = selectProvincesToCede(state, occupiedProvinceIds, defender, 0.5);
    return {
      winnerId: war.attackerId,
      loserId: war.defenderId,
      occupationRatio,
      provincesToCede,
    };
  }
  return null;
}

function selectProvincesToCede(
  state: GameState,
  occupiedIds: string[],
  defender: Realm,
  fraction: number
): string[] {
  // Ordenar por distância BFS da capital do defensor (mais distantes primeiro)
  const capitalId = defender.capitalId;
  const distances: [string, number][] = occupiedIds.map(pid => {
    const path = capitalId ? findPath(state, capitalId, pid, defender.id) : [];
    return [pid, path.length];
  });
  distances.sort((a, b) => b[1] - a[1]); // mais distantes primeiro
  const count = Math.ceil(occupiedIds.length * fraction);
  return distances.slice(0, count).map(d => d[0]);
}
```

### Testes
- [ ] > 60% províncias ocupadas → capitulação dispara
- [ ] War score > 70% → capitulação dispara
- [ ] Capital capturada + war score > 50% → capitulação dispara
- [ ] Capitulação NÃO ocorre antes das condições mínimas
- [ ] `originalOwnerId` é setado ao conquistar província em guerra
- [ ] `originalOwnerId` é limpo em todas as províncias ao fim da guerra
- [ ] Derrotado vira vassalo se ainda tem províncias
- [ ] Derrotado é eliminado se perdeu todas as províncias
- [ ] Províncias cedidas são as mais distantes da capital do derrotado
- [ ] Vencedor sofre penalidade de -20 loyalty por 5 turnos
- [ ] Notificação especial renderizada no TurnSummary
- [ ] Checagem de capitulação ocorre após batalhas, antes da exaustão

---

## 3. 🏛️ Sistema de Governos

### Resumo
Cada reino tem um tipo de governo que concede bônus e penalidades. O jogador pode mudar de governo (com custos), e governos podem ser impostos via diplomacia/guerra.

### Tipos de Governo

| Governo | Bônus | Penalidade | Flavor |
|---------|-------|-----------|--------|
| **Monarchy** | +10% defesa em todas as províncias | -1 ação diplomática por turno | "A coroa é absoluta. A diplomacia... nem tanto." |
| **Republic** | +1 ação diplomática por turno, +5% gold income | -10% estabilidade em províncias distantes (ver definição abaixo) | "O senado debate enquanto o reino prospera." |
| **Feudal** | +15% food production, vassalos +10 loyalty | -5% gold income (taxa feudal) | "Juramentos de lealdade, colheitas abundantes." |
| **Theocracy** | +20% loyalty em todas as províncias | -10% tech generation | "A fé move montanhas, mas não acelera a pesquisa." |
| **Despotism** | +15% ataque militar, recrutamento 20% mais barato | -20% crescimento populacional | "O chicote recruta rápido, mas o povo sofre." |
| **Oligarchy** | +25% gold dos vassalos | -10 relações com todos os reinos | "Poucos governam. Muitos desconfiam." |
| **Tribal** | Bônus dobrado de recursos estratégicos | -1 AP por turno, -20% tech generation | "A terra provê. O resto espera." |

### Definições de Termos Ambíguos

**"Províncias distantes" (Republic):** uma província é considerada distante se o caminho BFS mais curto entre ela e a capital do reino passa por **2 ou mais províncias intermediárias**. Ou seja, a capital e suas vizinhas diretas (1 salto) NÃO sofrem a penalidade. Exemplo: se a capital está em A, o caminho A→B→C tem 1 intermediária (B) — a província C está a 2 saltos, portanto é "distante" e sofre a penalidade de -10% estabilidade. A província B (vizinha direta) não sofre.

**Piso de AP (Tribal e outros):** `maxActionPoints = Math.max(2, valorBase + bonusTech - penalidadeGoverno)`. Nenhum reino pode ter menos de 2 AP por turno, independentemente de penalidades acumuladas.

### Modelo de Dados

**Novo campo em `Realm`:**
```typescript
government: GovernmentType;  // 'monarchy' | 'republic' | 'feudal' | 'theocracy' | 'despotism' | 'oligarchy' | 'tribal'
governmentChangeCooldown: number; // turnos restantes até poder mudar de novo (0 = pode mudar)
```

**Tipo GovernmentType:**
```typescript
export type GovernmentType = 'monarchy' | 'republic' | 'feudal' | 'theocracy' | 'despotism' | 'oligarchy' | 'tribal';

export interface GovernmentStats {
  name: string;
  defense: number;          // multiplicador de defesa
  attack: number;           // multiplicador de ataque
  goldIncome: number;       // multiplicador de renda de gold
  foodProduction: number;   // multiplicador de food
  diplomaticActions: number; // bônus/penalidade de ações diplomáticas
  techGeneration: number;   // multiplicador de geração de tech
  recruitmentCost: number;  // multiplicador de custo de recrutamento
  populationGrowth: number; // multiplicador de crescimento pop
  vassalGoldBonus: number;  // % extra de gold de vassalos
  vassalLoyaltyBonus: number; // bônus de loyalty para vassalos
  strategicResourceBonus: number; // multiplicador de recursos estratégicos
  stabilityInDistant: number; // penalidade de estabilidade em províncias distantes
  relationPenalty: number;  // penalidade de relações com todos os reinos
}
```

### Mudança de Governo

- **Custo:** 500 gold + 200 materials + instabilidade temporária (-30 loyalty em todas as províncias por 3 turnos)
- **Cooldown:** 20 turnos entre mudanças (armazenar em `realm.governmentChangeCooldown`)
- **Via diplomacia:** Ao fim de guerra, vencedor pode impor mudança de governo ao derrotado (custo pago pelo derrotado, sem cooldown)
- **Via revolução:** Se estabilidade < 20 em mais de 50% das províncias → 10% de chance por turno de revolução (muda governo aleatoriamente, sem custo, sem instabilidade adicional)

### Implementação

**Arquivo novo:** `src/logic/governmentLogic.ts`
```typescript
export const GOVERNMENT_STATS: Record<GovernmentType, GovernmentStats>;
export function applyGovernmentBonuses(realm: Realm, state: GameState): void;
export function changeGovernment(realm: Realm, newType: GovernmentType, state: GameState, force: boolean): { success: boolean; message: string };
export function checkRevolution(realm: Realm, state: GameState): GovernmentType | null;
export function getGovernmentFlavor(type: GovernmentType): string;
export function isProvinceDistant(state: GameState, provinceId: string, realm: Realm, threshold?: number): boolean; // default threshold = 2 (≥2 saltos da capital)
```

**Parâmetro `force`:** quando `true` (mudança imposta via tratado), ignora custo de recursos e cooldown, mas ainda causa instabilidade.

**UI — GovernmentModal:**
- Lista de governos disponíveis com bônus/penalidades
- Botão "Reformar Governo" com custo visível
- Indicador de cooldown
- Confirmação: "Esta reforma custará 500 gold, 200 materials e causará instabilidade (-30 loyalty) por 3 turnos. Continuar?"

### Testes
- [ ] Monarchy: +10% defesa, -1 ação diplomática
- [ ] Republic: +1 ação diplomática, +5% gold, -10% estabilidade em províncias a ≥2 saltos da capital (capital + vizinhas diretas imunes)
- [ ] Feudal: +15% food, vassalos +10 loyalty, -5% gold
- [ ] Theocracy: +20% loyalty, -10% tech generation
- [ ] Despotism: +15% ataque, -20% crescimento pop, recrutamento 20% mais barato
- [ ] Oligarchy: +25% gold dos vassalos, -10 relações com todos
- [ ] Tribal: recurso estratégico dobrado, -1 AP, -20% tech
- [ ] maxActionPoints nunca < 2 (Tribal + outras penalidades)
- [ ] Mudança de governo custa recursos + instabilidade
- [ ] Cooldown de 20 turnos funciona
- [ ] Revolução ocorre com estabilidade < 20 em > 50% das províncias (10% chance/turno)
- [ ] Governo pode ser imposto via tratado de paz (force=true, ignora custo)
- [ ] `isProvinceDistant` usa BFS com threshold configurável (default 2)

---

## 4. 🎯 Novos Modos de Mapa

### Resumo
Adicionar 7 novos modos de visualização ao mapa. A Fase 1 já possui 6 modos (`political`, `economic`, `military`, `diplomatic`, `resources`, `trade`). Com os novos, o total será de 13.

### Auditoria dos Modos Existentes (Fase 1)

| # | Modo | Tecla | Cor/Visual | Label |
|---|------|-------|-----------|-------|
| 1 | Political | `1` | Cor do reino | Nome da província |
| 2 | Economic | `2` | Verde (wealth+food+material) | Produção total |
| 3 | Military | `3` | Vermelho (tropas) | Contagem de tropas |
| 4 | Diplomatic | `4` | — | Relações |
| 5 | Resources | `5` | Ícones de recurso | Recurso estratégico |
| 6 | Trade | `T` | — | Rotas comerciais |

### Novos Modos (Fase 2)

| # | Modo | Heatmap | Label | Cor | Tecla |
|---|------|---------|-------|-----|------|
| 7 | **População** | total pop / max pop | "12.450" | Verde (mais = mais escuro) | `6` |
| 8 | **Desenvolvimento** | wealth + sum(buildings) | "Dev: 45" | Azul | `7` |
| 9 | **Renda Total** | goldIncome (sem maintenance) | "+320g" | Dourado | `8` |
| 10 | **Estabilidade** | loyalty / 100 | "85%" | Branco (feliz) → Vermelho (rebelde) | `9` |
| 11 | **Edifícios** | soma de todos os edifícios | "🏘️4" | Roxo | `0` |
| 12 | **Crescimento** | population growth rate | "+3%" | Ciano | `G` |
| 13 | **Força Militar** | troops / max troops | "⚔️45" | Laranja | `F` |

### Atalhos de Teclado (Tabela Completa)

| Tecla | Modo |
|-------|------|
| `1` | Political |
| `2` | Economic |
| `3` | Military |
| `4` | Diplomatic |
| `5` | Resources |
| `T` | Trade |
| `6` | Population |
| `7` | Development |
| `8` | Income |
| `9` | Stability |
| `0` | Buildings |
| `G` | Growth |
| `F` | Military Strength |

### Implementação

**`types.ts`:** Expandir `ViewMode`:
```typescript
export type ViewMode = 'political' | 'economic' | 'military' | 'diplomatic' | 'resources' | 'trade'
  | 'population' | 'development' | 'income' | 'stability' | 'buildings' | 'growth' | 'military_strength';
```

**`Map.tsx`:** Adicionar lógica de coloração e labels para cada novo modo.

### Testes
- [ ] Cada modo mostra a cor/label correta conforme tabela
- [ ] Modo estabilidade: verde para leal (>70), amarelo para neutro (40-70), vermelho para rebelde (<40)
- [ ] Ranking de população/desenvolvimento aparece no HUD
- [ ] Todos os atalhos (1-9, 0, T, G, F) funcionam
- [ ] Modo Trade existente preservado e funcional

---

## 5. 💰 Sistema de Empréstimos

### Resumo
Permitir que o jogador (e a IA) peça empréstimos de gold com pagamento parcelado ao longo de vários turnos.

### Especificação

**Limite de crédito:**
```
maxLoan = Math.floor(totalGoldIncome * 5)
```
(Pode pegar até 5x a renda total por turno.)

**Termos:**
- Período: 10 turnos
- Juros: 15% totais sobre o valor emprestado (juros simples)
- Pagamento: automático no `processEndOfTurn`
- **Fórmula da parcela:** `paymentPerTurn = Math.ceil((amount * 1.15) / 10)`
- Se não puder pagar parcela (gold insuficiente): -10 relações com todos os reinos, -5 loyalty em todas as províncias, empréstimo marcado como `defaulted`

**Modelo:**
```typescript
// Em Realm:
loans: {
  id: string;
  amount: number;            // valor original emprestado
  remaining: number;          // parcelas restantes (10 no início, 0 = quitado)
  paymentPerTurn: number;     // valor da parcela = Math.ceil((amount * 1.15) / 10)
  defaulted: boolean;         // true se já falhou pagamento
}[];
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
- [ ] Jogador recebe gold imediatamente ao contrair empréstimo
- [ ] Parcela = `Math.ceil((amount * 1.15) / 10)` descontada a cada turno
- [ ] Após 10 turnos (remaining = 0), empréstimo está quitado e é removido da lista
- [ ] Default (não pagar): penalidade de -10 relações e -5 loyalty
- [ ] Limite de crédito = `Math.floor(totalGoldIncome * 5)`
- [ ] IA pede empréstimo em guerra com gold negativo
- [ ] Múltiplos empréstimos simultâneos funcionam (cada um com seu `remaining` e `paymentPerTurn`)

---

## 6. 🧠 IA Avançada

### Resumo
Reescrever a IA para usar as personalidades definidas em `types.ts`, tomar decisões contextuais e fornecer um desafio mais realista.

### Função `calculateMilitaryPower` (NOVA — definida aqui)

Esta função é referenciada pela seção `shouldAIAttack` e não existia no código. Ela **deve ser criada** como parte desta seção.

**Abordagem:** Seguindo o padrão do Age of History 2, o poder militar é essencialmente a **soma bruta de tropas** do reino, com modificadores de tecnologia e governo. Todas as unidades (infantry, archers, cavalry, scouts) têm peso igual na soma — isso mantém a simplicidade do AoH2 e evita overengineering. Caso o balanceamento futuro exija pesos diferentes por tipo de unidade, a fórmula pode ser refinada (mas isso é pós-Fase 2).

```typescript
// Em src/logic/aiLogic.ts
export function calculateMilitaryPower(realm: Realm, state: GameState): number {
  const ownedProvinces = Object.values(state.provinces).filter(p => p.ownerId === realm.id);

  // Soma bruta de todas as tropas (infantry + archers + cavalry + scouts)
  let totalTroops = 0;
  for (const prov of ownedProvinces) {
    totalTroops += prov.troops.infantry
      + prov.troops.archers
      + prov.troops.cavalry
      + prov.troops.scouts;
  }

  // Aplicar bônus de tecnologia de combate: +5% por nível
  totalTroops *= (1 + realm.techLevels.combat * 0.05);

  // Aplicar multiplicador de ataque do governo (ex: Despotism +15% → ×1.15)
  const govStats = GOVERNMENT_STATS[realm.government];
  totalTroops *= govStats.attack;

  return Math.round(totalTroops);
}
```

**Por que pesos iguais?** No Age of History 2, o exército é tratado como um número único — não há distinção de tipos de unidade no cálculo de força. O jogo simplesmente compara números brutos. Esta abordagem é:
- Mais simples de implementar e testar
- Previsível para o jogador
- Consistente com a referência (AoH2)
- Fácil de refinar depois se o balanceamento exigir

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

function shouldAIAttack(realm: Realm, target: Realm, prov: Province, targetProv: Province, state: GameState): boolean {
  const myPower = calculateMilitaryPower(realm, state);
  const targetPower = calculateMilitaryPower(target, state);
  const powerRatio = targetPower > 0 ? myPower / targetPower : Infinity;

  switch (realm.personality) {
    case 'expansionist': return powerRatio > 1.5;  // Só ataca com boa vantagem
    case 'opportunistic': return powerRatio > 1.0 && (target.wars.length > 0 || targetProv.troops.infantry + targetProv.troops.archers + targetProv.troops.cavalry + targetProv.troops.scouts < 20);
    case 'defensive': return false;  // Nunca inicia guerra
    case 'diplomatic': return powerRatio > 3.0;  // Só em esmagadora vantagem
    case 'commercial': return powerRatio > 2.5 && (prov.troops.infantry + prov.troops.archers + prov.troops.cavalry + prov.troops.scouts) > 50;
  }
}
```

### Refatoração de `declareWar` da IA

O arquivo `src/logic/aiLogic.ts` contém uma função local `declareWar` (não exportada) que duplica e simplifica a lógica de `src/logic/diplomacyLogic.ts`. Esta duplicata **deve ser removida** e substituída por chamadas à função canônica exportada:

```typescript
// ANTES (aiLogic.ts — REMOVER):
function declareWar(state: GameState, attackerId: string, defenderId: string) { ... }

// DEPOIS (aiLogic.ts — USAR):
import { declareWar } from './diplomacyLogic';
// Uso: const { newState } = declareWar(state, attackerId, defenderId);
```

### Agressividade Configurável

No `GameSettings` (menu de novo jogo):
```typescript
aiAggression: number; // 0-100, default 50
```

Multiplicador aplicado ao `powerRatio` mínimo para ataque: `effectiveRatio = baseRatio * (1 - (aiAggression - 50) / 100)`. Com agressividade 100, o threshold é 50% menor (IA ataca com menos vantagem).

### Implementação

**Arquivo:** `src/logic/aiLogic.ts`

```typescript
export function calculateMilitaryPower(realm: Realm, state: GameState): number;
export function processAI(state: GameState): void;
function processAIDiplomacy(state: GameState, realm: Realm): void;
function processAILoans(state: GameState, realm: Realm): void;
function shouldAIAttack(realm: Realm, target: Realm, prov: Province, targetProv: Province, state: GameState): boolean;
```

### Testes
- [ ] `calculateMilitaryPower` retorna valor > 0 para reino com tropas
- [ ] `calculateMilitaryPower` = 0 para reino sem tropas
- [ ] `calculateMilitaryPower` reflete bônus de combat tech e governo
- [ ] Expansionist ataca com powerRatio > 1.5
- [ ] Defensive nunca inicia guerras
- [ ] Opportunistic ataca vizinhos em guerra
- [ ] Commercial foca em economia, só ataca com vantagem > 2.5
- [ ] IA pede empréstimo quando necessário
- [ ] Agressividade configurável afeta thresholds de todas as personalidades
- [ ] aiLogic.ts não contém mais função `declareWar` local — usa a de diplomacyLogic.ts

---

## 7. 🎵 Música Ambiente

### Resumo
Adicionar trilha sonora medieval de fundo, com faixas diferentes para o menu e para o jogo.

### Especificação

- **Menu:** 1 faixa calma, contemplativa
- **Jogo (paz):** 1 faixa ambiente neutra
- **Jogo (guerra):** 1 faixa mais intensa (muda quando o reino do jogador está em guerra)
- **Toggle:** Botão 🔈/🔊 no menu e no HUD
- **Volume:** Slider ajustável (0-100)
- Loop contínuo, transição suave entre faixas (crossfade de 2 segundos)

### Abordagem Técnica

**Assets:** Arquivos MP3 pré-gravados de fontes gratuitas com licença CC0 (Creative Commons Zero — uso livre sem atribuição). Fontes recomendadas: OpenGameArt.org, Pixabay Music. Cada faixa deve ter ~2-4 minutos, loop-friendly (fim emenda com início sem clique). As 3 faixas necessárias: menu (calma), jogo-paz (neutra), jogo-guerra (intensa).

**Reprodução:** Usar elemento `<audio>` nativo do HTML5 (não Web Audio API procedural), que é:
- Mais simples de implementar
- Suporta loop nativo (`loop` attribute)
- Crossfade implementável com dois elementos `<audio>` e `setTimeout` para trocar volume

**Contorno da Autoplay Policy:** Navegadores bloqueiam autoplay sem gesto do usuário. Estratégia:
1. Menu: iniciar música após o primeiro clique do usuário (ex: botão "Novo Jogo" ou "Continuar")
2. Transição menu→jogo: `audioElement.play()` é permitido porque o contexto já foi iniciado por gesto
3. Fallback: se `play()` falhar (Promise rejected), exibir botão "🔊 Ativar Som" no HUD para o usuário clicar e desbloquear o contexto

```typescript
// src/logic/musicLogic.ts
export function initMusic(): void;                          // Criar elementos <audio>
export function startMenuMusic(): void;                     // Iniciar faixa do menu
export function startGameMusic(isAtWar: boolean): void;     // Iniciar faixa do jogo (paz ou guerra)
export function switchToWarMusic(): void;                   // Crossfade para faixa de guerra
export function switchToPeaceMusic(): void;                  // Crossfade para faixa de paz
export function stopMusic(): void;                           // Parar tudo
export function setMusicVolume(volume: number): void;        // 0-100
export function isMusicPlaying(): boolean;
```

### Testes
- [ ] Música inicia após primeiro clique do usuário (autoplay policy)
- [ ] Música toca em loop no menu
- [ ] Música muda ao entrar no jogo
- [ ] Música alterna entre paz/guerra conforme estado do jogador
- [ ] Crossfade de 2s entre faixas
- [ ] Toggle 🔈/🔊 liga e desliga
- [ ] Loop contínuo sem gaps audíveis
- [ ] Volume ajustável via slider
- [ ] Se `play()` falhar, botão "Ativar Som" aparece

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

### Implementação (REVISADA — Padrão Imutável)

O código original do PRD mutava o estado diretamente e chamava `declareWar` sem capturar o retorno, violando o princípio de imutabilidade do projeto e causando comportamento indefinido. A versão corrigida segue o padrão imutável:

**`turnLogic.ts` — `processEndOfTurn`:**
```typescript
function processVassalLiberty(state: GameState): void {
  // NOTA: state já é um deep clone. Trabalhamos sobre ele.
  Object.values(state.realms).forEach(overlord => {
    if (!overlord.vassals || overlord.vassals.length === 0) return;

    overlord.vassals.forEach(vassalId => {
      const vassal = state.realms[vassalId];
      if (!vassal) return;

      // Inicializar liberty se não existir
      if (!overlord.vassalLiberty) overlord.vassalLiberty = {};
      if (overlord.vassalLiberty[vassalId] === undefined) {
        overlord.vassalLiberty[vassalId] = 0;
      }

      let delta = 2; // base

      const overlordAtWar = state.activeWars.some(
        w => w.attackerId === overlord.id || w.defenderId === overlord.id
      );
      if (overlordAtWar) delta += 5;
      if (overlord.overextension > 80) delta += 10;

      const vassalProvinces = Object.values(state.provinces)
        .filter(p => p.ownerId === vassalId).length;
      const overlordProvinces = Object.values(state.provinces)
        .filter(p => p.ownerId === overlord.id).length;
      if (vassalProvinces > overlordProvinces) delta += 3;

      overlord.vassalLiberty[vassalId] = Math.max(0, Math.min(
        100,
        overlord.vassalLiberty[vassalId] + delta
      ));

      if (overlord.vassalLiberty[vassalId] >= 100) {
        // Rebelião! Usar declareWar canônica de diplomacyLogic.ts
        vassal.vassalOf = undefined;
        overlord.vassals = overlord.vassals.filter(v => v !== vassalId);

        const warResult = declareWar(state, vassalId, overlord.id);
        // declareWar modifica state internamente e retorna { newState, callsToResolve }
        // callsToResolve não usados aqui pois o vassalo declarou independência unilateral

        state.logs.push(
          `REBELIÃO: ${vassal.name} declarou independência de ${overlord.name}!`
        );
      } else if (overlord.vassalLiberty[vassalId] >= 70 && overlord.isPlayer) {
        state.logs.push(
          `⚠️ ${vassal.name} está inquieto sob seu domínio (Liberty: ${overlord.vassalLiberty[vassalId]}%).`
        );
      }
    });
  });
}
```

**Integração:**
- `turnLogic.ts` → `processEndOfTurn`: chamar `processVassalLiberty(newState)` após processar economia, antes da limpeza de fim de turno
- `HUD.tsx`: mostrar barra de Liberty para cada vassalo no painel de diplomacia/vassalos
- Ação diplomática "Apaziguar Vassalo" (já existe ou deve existir no `DiplomacyModal`): custa gold, reduz liberty em -5

### Testes
- [ ] Liberty Desire sobe a cada turno conforme fatores
- [ ] Guerra do overlord acelera Liberty (+5/turno)
- [ ] Overextension > 80 acelera Liberty (+10/turno)
- [ ] Liberty >= 100 → rebelião (guerra declarada via `declareWar` canônica)
- [ ] `declareWar` usada é a exportada de `diplomacyLogic.ts` (não a local de `aiLogic.ts`)
- [ ] Após rebelião, vassalo não está mais na lista `overlord.vassals`
- [ ] Após rebelião, `vassal.vassalOf` é `undefined`
- [ ] Apaziguar vassalo (-5 liberty) funciona como ação diplomática
- [ ] Notificação quando Liberty >= 70
- [ ] Liberty nunca < 0 nem > 100
- [ ] Código não contém mutações diretas fora do pattern de deep clone

---

## 10. 💀 Tela de Derrota Narrativa

### Resumo
Quando o jogador perde, mostrar uma tela temática com estatísticas da partida em vez de apenas "Game Over".

### Modelo de Dados (NOVOS campos de tracking)

Os campos abaixo precisam ser adicionados a `Realm` para alimentar as estatísticas da tela de derrota. Sem eles, o `GameEndModal` não terá dados para exibir.

```typescript
// Em Realm (types.ts):
battlesWon: number;          // Incrementado ao vencer batalha (resolveCombat)
realmsDefeated: number;      // Incrementado quando outro reino é eliminado e este reino é o causador
cumulativeGold: number;      // Somado a cada processEndOfTurn: += realm.gold (antes dos gastos)
maxProvincesHeld: number;    // Atualizado a cada turno: max(anterior, provincias atuais)
```

**Regras de incremento:**
- `battlesWon`: incrementado no `resolveCombat` quando o resultado é vitória para este reino
- `realmsDefeated`: incrementado quando `delete state.realms[defeatedId]` e o `war.winnerId === realm.id`
- `cumulativeGold`: `realm.cumulativeGold += realm.gold` ao final de `processEndOfTurn` (antes de deduzir manutenção)
- `maxProvincesHeld`: `realm.maxProvincesHeld = Math.max(realm.maxProvincesHeld, ownedCount)` ao final de `processEndOfTurn`

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

**`GameEndModal.tsx`:** Já existe. Modificar para detectar se `winnerId !== playerRealmId` e mostrar template de derrota. Os dados vêm de `state.realms[playerRealmId]` (campos de tracking adicionados).

### Testes
- [ ] Tela de derrota aparece quando jogador perde (eliminado)
- [ ] `battlesWon` incrementa corretamente ao vencer batalhas
- [ ] `realmsDefeated` incrementa quando reino inimigo é eliminado
- [ ] `cumulativeGold` acumula ao longo dos turnos
- [ ] `maxProvincesHeld` reflete o pico territorial
- [ ] Estatísticas finais exibidas correspondem aos valores rastreados
- [ ] Frase temática é aleatória (não repetida entre recarregamentos da tela)
- [ ] Botões "Tentar Novamente" e "Menu" funcionam

---

## 💾 Migração de Save Games (NOVA SEÇÃO)

### Problema
Jogos salvos da Fase 1 não possuem os novos campos adicionados ao `Realm` e `Province`. Ao carregar um save antigo, o jogo quebrará por campos `undefined`.

### Solução

**Versionamento de schema:**
```typescript
// Em GameState:
schemaVersion: number;  // 1 = Fase 1, 2 = Fase 2
```

**Função de migração:**
```typescript
// Em src/logic/saveMigration.ts (novo arquivo)
export function migrateSaveGame(data: any): GameState {
  if (!data.schemaVersion || data.schemaVersion < 2) {
    // Migrar de v1 → v2
    for (const realmId of Object.keys(data.realms)) {
      const r = data.realms[realmId];
      r.techPoints = r.techPoints ?? 0;
      r.techLevels = r.techLevels ?? { movement: 0, assimilation: 0, recruitment: 0, combat: 0 };
      r.government = r.government ?? 'monarchy';
      r.governmentChangeCooldown = r.governmentChangeCooldown ?? 0;
      r.vassalLiberty = r.vassalLiberty ?? {};
      r.loans = r.loans ?? [];
      r.battlesWon = r.battlesWon ?? 0;
      r.realmsDefeated = r.realmsDefeated ?? 0;
      r.cumulativeGold = r.cumulativeGold ?? 0;
      r.maxProvincesHeld = r.maxProvincesHeld ?? Object.values(data.provinces).filter((p: any) => p.ownerId === realmId).length;
    }
    for (const provId of Object.keys(data.provinces)) {
      data.provinces[provId].originalOwnerId = undefined;
    }
    data.schemaVersion = 2;
  }
  return data as GameState;
}
```

**Integração:** Chamar `migrateSaveGame(loadedData)` em `useGameController.ts` antes de setar o estado inicial, tanto ao carregar save quanto ao iniciar novo jogo (novos jogos já nascem com `schemaVersion: 2`).

---

## 🧪 Testes de Integração da Fase

- [ ] Tecnologia + Governos + Economia não causam loops infinitos
- [ ] Capitulação não deixa estado inválido (províncias órfãs, `originalOwnerId` sujo)
- [ ] IA avançada + sistema de empréstimos: IA não fica em dívida infinita
- [ ] Liberty Desire + Vassalos + Capitulação: independência e anexação coexistem
- [ ] Música ambiente não conflita com SFX da Fase 1
- [ ] Todos os 13 modos de mapa renderizam sem lag (testar com 40 províncias)
- [ ] Modais responsivos não quebram layout em mobile
- [ ] Save da Fase 1 carrega corretamente após migração (todos os defaults aplicados)
- [ ] Novo jogo da Fase 2 salva e carrega com schemaVersion: 2
- [ ] `calculateMilitaryPower` não causa NaN ou Infinity
- [ ] `maxActionPoints` nunca < 2 em nenhuma combinação de governo + tech
- [ ] `npm run lint` limpo
- [ ] `npm run build` sem erros

---

## 📊 Critérios de Aceitação da Fase

- [ ] Jogador pode alocar pontos de tecnologia em 4 categorias
- [ ] Bônus de tecnologia afetam AP, assimilação, recrutamento e combate
- [ ] Civilizações capitulam quando perdem > 60% do território
- [ ] Jogador pode escolher entre 7 tipos de governo
- [ ] Pelo menos 7 novos modos de mapa funcionais (total de 13)
- [ ] Empréstimos funcionam com pagamento automático e fórmula de parcela correta
- [ ] IA segue suas personalidades de forma distinta usando `calculateMilitaryPower`
- [ ] Música ambiente toca no menu e no jogo, com crossfade entre faixas
- [ ] Modais são usáveis em mobile (< 768px)
- [ ] Vassalos se rebelam com Liberty >= 100 usando padrão imutável
- [ ] Derrota mostra tela narrativa com estatísticas rastreadas
- [ ] Save games da Fase 1 são migrados automaticamente

---

*PRD-FASE-2-CONSOLIDADO | Reinos Medievais | Versão 1.1 | 07/05/2026*
